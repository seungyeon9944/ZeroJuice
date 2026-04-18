package com.zerojuice.domain.payment.service;

import com.zerojuice.domain.parking.service.ParkingSlotService;
import com.zerojuice.domain.payment.dto.PaymentCreateDto;
import com.zerojuice.domain.payment.dto.PaymentResponseDto;
import com.zerojuice.domain.payment.dto.PaymentUpdateDto;
import com.zerojuice.domain.payment.entity.Payment;
import com.zerojuice.domain.payment.entity.PaymentStatus;
import com.zerojuice.domain.payment.entity.PaymentMethod;
import com.zerojuice.domain.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import com.zerojuice.domain.sse.service.SseEmitterService;
import com.zerojuice.domain.parking.repository.ParkingHistoryRepository;
import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.domain.setting.repository.SettingRepository;
import com.zerojuice.domain.car.repository.CarRepository;
import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.domain.setting.entity.SettingEntity;
import com.zerojuice.domain.sse.event.ParkingFeeEvent;
import com.zerojuice.infra.mqtt.MqttPubGateway;

/**
 * 결제 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final SseEmitterService sseEmitterService;
    private final ParkingSlotService parkingSlotService;
    private final ParkingHistoryRepository parkingHistoryRepository;
    private final SettingRepository settingRepository;
    private final CarRepository carRepository;
    private final MqttPubGateway mqttPubGateway;

    /**
     * 전체 결제 내역 조회
     */
    public List<PaymentResponseDto> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(PaymentResponseDto::from)
                .collect(Collectors.toList());
    }

    /**
     * ID로 결제 조회
     */
    public PaymentResponseDto getPaymentById(Integer id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다. ID: " + id));
        return PaymentResponseDto.from(payment);
    }

    /**
     * historyId로 결제 조회
     */
    public PaymentResponseDto getPaymentByHistoryId(Integer historyId) {
        ParkingHistory history = parkingHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("주차 기록을 찾을 수 없습니다. ID: " + historyId));

        // ⭐ 조회된 엔티티를 사용하여 기존 findByHistory 메서드를 호출합니다.
        Payment payment = paymentRepository.findByHistory(history)
                .orElseThrow(() -> new RuntimeException("해당 주차 기록에 대한 결제 정보가 없습니다."));
        return PaymentResponseDto.from(payment);
    }

    /**
     * 결제 생성 (내부 메서드 - ParkingHistoryService에서 호출)
     */
    @Transactional
    public Payment createPayment(PaymentCreateDto createDto) {
        // ⭐ 중복 체크: findByHistory 사용
        paymentRepository.findByHistory(createDto.getHistory())
                .ifPresent(p -> {
                    throw new RuntimeException("이미 결제 정보가 존재합니다. History ID: " + createDto.getHistory().getId());
                });

        Payment payment = createDto.toEntity();
        return paymentRepository.save(payment);
    }

    /**
     * 결제 상태 업데이트
     */
    @Transactional
    public PaymentResponseDto updatePaymentStatus(Integer id, PaymentUpdateDto updateDto) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("결제 정보를 찾을 수 없습니다. ID: " + id));

        // Entity의 도메인 메서드 사용
        PaymentStatus status = PaymentStatus.valueOf(updateDto.getStatus());
        switch (status) {
            case OK:
                payment.completePayment(updateDto.getUpdater());
                notifyPaymentComplete(payment);
                break;
            case FAIL:
                payment.failPayment(updateDto.getUpdater());
                break;
            default:
                throw new RuntimeException("지원하지 않는 상태입니다: " + status);
        }

        Payment updatedPayment = paymentRepository.save(payment);
        return PaymentResponseDto.from(updatedPayment);
    }

    /**
     * 결제 상태별 통계
     */
    public long countByStatus(PaymentStatus status) {
        return paymentRepository.countByStatus(status);
    }

    /**
     * 오늘의 총 수익 계산
     */
    public Integer calculateTodayRevenue() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return paymentRepository.sumAmountByDateRangeAndStatus(startOfDay, endOfDay, PaymentStatus.OK);
    }

    /**
     * 오늘의 결제 건수 계산
     */
    public Integer getTodayTransactionCount() {
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);
        return paymentRepository.countByDateRangeAndStatus(startOfDay, endOfDay, PaymentStatus.OK);
    }

    /**
     * 실시간 주차 요금 전송 (출차 전까지만 실행)
     */
    @Transactional(readOnly = true)
    public void sendRealtimeFee(Integer userId) {
        var history = parkingHistoryRepository.findTopByCarUserIdAndOutTimeIsNullOrderByInTimeDesc(userId).orElse(null);
        var settings = settingRepository.findAll().stream().findFirst().orElse(null);

        if (history != null && settings != null && history.getCar() != null && history.getCar().getUser() != null) {
            LocalDateTime now = LocalDateTime.now();
            long durationMinutes = Duration.between(history.getInTime(), now).toMinutes();
            long totalFee = settings.getFeeBase()
                    + (Math.max(0, durationMinutes - settings.getTimeBase()) / settings.getTimeUnit())
                            * settings.getFeeUnit();

            ParkingFeeEvent eventDto = ParkingFeeEvent.builder()
                    .eventType("PARKING_STATUS")
                    .data(ParkingFeeEvent.ParkingData.builder()
                            .fee((int) totalFee)
                            .slotNo(String.valueOf(history.getSlotNo()))
                            .elapsedTime(durationMinutes + "분")
                            .inTime(history.getInTime().toString())
                            .status("PARKED")
                            .carNo(history.getCar().getCarNo())
                            .type("REALTIME_UPDATE")
                            .build())
                    .build();
            String sseKey = "app-payment-flow-" + userId;
            sseEmitterService.sendToTopic(sseKey, eventDto.getEventType(), eventDto);
            log.info(">>> [SSE 실시간] 유저 {}번 요금 업데이트: {}원", userId, totalFee);
        }
    }

    /**
     * 출차 버튼 클릭 시 호출 (out_time을 채우고 결제 대기 데이터 생성)
     */
    @Transactional
    public com.zerojuice.domain.parking.dto.ParkingSlotDto processExitRequest(Integer userId) {
        log.info(">>> [PaymentService] processExitRequest 진입 - UserID: {}", userId);

        // ⭐ 1. 해당 유저가 소유한 차량 중 현재 주차 중인(out_time IS NULL) 기록을 찾습니다.
        ParkingHistory history = parkingHistoryRepository.findTopByCarUserIdAndOutTimeIsNullOrderByInTimeDesc(userId)
                .orElseThrow(() -> new RuntimeException("해당 사용자의 주차 중인 기록을 찾을 수 없습니다."));

        log.info(">>> [PaymentService] 주차 기록 찾음 - HistoryID: {}, SlotNo: {}", history.getId(), history.getSlotNo());

        // 이 메서드 안에서 MQTT 전송과 슬롯 반납(큐에 추가)이 일어납니다.
        // [수정] ParkingSlotService의 결과를 받아옵니다.
        com.zerojuice.domain.parking.dto.ParkingSlotDto slotDto = parkingSlotService.exitByUserId(userId);

        // 2. out_time을 현재 시간으로 업데이트 (이제 실시간 요금 전송이 멈춥니다)
        LocalDateTime exitTime = LocalDateTime.now();
        history.updateOutTime(exitTime);

        // 3. 최종 요금 계산
        SettingEntity settings = settingRepository.findAll().stream().findFirst().orElse(null);
        if (settings == null) {
            throw new RuntimeException("주차장 설정 정보를 찾을 수 없습니다.");
        }

        long durationMinutes = Duration.between(history.getInTime(), exitTime).toMinutes();
        long totalFee = settings.getFeeBase()
                + (Math.max(0, durationMinutes - settings.getTimeBase()) / settings.getTimeUnit())
                        * settings.getFeeUnit();

        log.info(">>> [PaymentService] 요금 계산 완료 - {}원 (주차시간: {}분)", totalFee, durationMinutes);

        // 4. 결제 레코드 생성 (프론트에서 결제 성공 후 호출되므로 바로 OK 처리)
        Payment payment = Payment.builder()
                .history(history)
                .amount((int) totalFee)
                .status(PaymentStatus.OK) // [FIX] PENDING -> OK 로 변경 (프론트 결제 신뢰)
                .method(PaymentMethod.KAKAO)
                .creator("SYS")
                .updater("SYS")
                .payTime(exitTime)
                .build();

        paymentRepository.save(payment);

        ParkingFeeEvent finalEvent = ParkingFeeEvent.builder()
                .eventType("PARKING_STATUS")
                .data(ParkingFeeEvent.ParkingData.builder()
                        .fee((int) totalFee)
                        .slotNo(String.valueOf(history.getSlotNo()))
                        .elapsedTime(durationMinutes + "분")
                        .inTime(history.getInTime().toString())
                        .status("EXITED") // 상태를 '출차됨'으로 변경
                        .carNo(history.getCar().getCarNo())
                        .type("COMPLETED") // 타입을 '완료'로 변경
                        .build())
                .build();

        String sseKey = "app-payment-flow-" + userId;
        sseEmitterService.sendToTopic(sseKey, finalEvent.getEventType(), finalEvent);
        log.info(">>> [출차 요청] 최종 요금 {}원 확정 및 결제 대기 상태 진입", userId, totalFee);

        return slotDto;
    }

    private void notifyPaymentComplete(Payment payment) {
        if (payment.getHistory() != null && payment.getHistory().getCar() != null
                && payment.getHistory().getCar().getUser() != null) {
            Integer userId = payment.getHistory().getCar().getUser().getId();

            ParkingFeeEvent paymentEvent = ParkingFeeEvent.builder()
                    .eventType("PAYMENT_COMPLETE")
                    .data(ParkingFeeEvent.ParkingData.builder()
                            .type("SUCCESS")
                            .fee(payment.getAmount().intValue())
                            .carNo(payment.getHistory().getCar().getCarNo())
                            .build())
                    .build();

            // TODO: 실제 사용자 식별 정보로 교체 필요
            String sseKey = "app-payment-flow-" + userId;
            sseEmitterService.sendToTopic(sseKey, paymentEvent.getEventType(), paymentEvent);

            log.info(">>> [SSE 성공] 결제 완료 신호 전송 (Target User: {}, Amount: {})", userId, payment.getAmount());
        }

    }
}
