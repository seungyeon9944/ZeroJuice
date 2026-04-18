package com.zerojuice.domain.parking.service;

import com.zerojuice.infra.sse.AppEventSseHub;
import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.domain.parking.repository.ParkingHistoryRepository;
import com.zerojuice.domain.payment.dto.PaymentCreateDto;
import com.zerojuice.domain.payment.entity.Payment;
import com.zerojuice.domain.payment.service.PaymentService;
import com.zerojuice.domain.setting.service.SettingService;
import com.zerojuice.domain.parking.dto.CheckoutRequestDto;
import com.zerojuice.domain.parking.dto.CheckoutResponseDto;
import com.zerojuice.domain.sse.event.DailyRevenueEvent;
import com.zerojuice.domain.sse.event.ParkingFeeEvent;
import com.zerojuice.domain.sse.event.ParkingHistoryEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ParkingHistoryServiceImpl implements ParkingHistoryService {

        private final ParkingHistoryRepository parkingHistoryRepository;
        private final AppEventSseHub sseHub;
        private final PaymentService paymentService;
        private final SettingService settingService;
        private final ApplicationEventPublisher eventPublisher;

        @Override
        public Page<ParkingHistoryResponseDto> getAllParkingHistories(Pageable pageable) {
                Page<ParkingHistory> parkingHistories = parkingHistoryRepository.findAllWithCar(pageable);
                return parkingHistories.map(ParkingHistoryResponseDto::from);
        }

        @Override
        public Page<ParkingHistoryResponseDto> searchByCarNo(String carNo, Pageable pageable) {
                Page<ParkingHistory> parkingHistories = parkingHistoryRepository.findByCarNoContaining(carNo, pageable);
                return parkingHistories.map(ParkingHistoryResponseDto::from);
        }

        @Override
        public Page<ParkingHistoryResponseDto> searchByDateRange(
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        Pageable pageable) {
                Page<ParkingHistory> parkingHistories = parkingHistoryRepository.findByInTimeBetween(
                                startDate,
                                endDate,
                                pageable);
                return parkingHistories.map(ParkingHistoryResponseDto::from);
        }

        @Override
        public Page<ParkingHistoryResponseDto> search(
                        String carNo,
                        LocalDateTime startDate,
                        LocalDateTime endDate,
                        Pageable pageable) {
                Page<ParkingHistory> parkingHistories = parkingHistoryRepository.search(
                                carNo,
                                startDate,
                                endDate,
                                pageable);
                return parkingHistories.map(ParkingHistoryResponseDto::from);
        }

        /**
         * 입차 처리
         */
        @Transactional
        public void registerEntry(ParkingHistory history) {
                // 1. DB 저장
                parkingHistoryRepository.save(history);

                // 2. 입차 완료 SSE 알림 전송
                ParkingFeeEvent entryEvent = ParkingFeeEvent.builder()
                                .eventType("PARKING_ENTRY")
                                .data(ParkingFeeEvent.ParkingData.builder()
                                                .type("SUCCESS")
                                                .slotNo(String.valueOf(history.getSlotNo())) // 주차 구역 번호
                                                .elapsedTime("0분")
                                                .build())
                                .build();

                // 유저 ID 추출 (History -> Car -> User -> Id)
                // 엔티티 구조에 따라 getCar().getUser().getId() 형태가 맞는지 확인 필요합니다.
                Long userId = history.getCar().getUser().getId().longValue();

                sseHub.sendMessage(userId, entryEvent);

                log.info(">>> [SSE 성공] {}번 유저 입차 알림 전송 (Slot: {})", userId, history.getSlotNo());
        }

        /**
         * 출차 처리
         * 1. parking_histories의 out_time 업데이트
         * 2. 요금 계산
         * 3. payments 테이블에 데이터 생성
         * 
         * @Transactional로 3개 작업이 원자적으로 처리됨
         */
        @Transactional
        public CheckoutResponseDto checkout(Integer historyId, CheckoutRequestDto requestDto) {
                // 1. ParkingHistory 조회
                ParkingHistory history = parkingHistoryRepository.findByIdWithCar(historyId)
                                .orElseThrow(() -> new RuntimeException("주차 기록을 찾을 수 없습니다. ID: " + historyId));

                // 2. 출차 처리 (out_time 업데이트)
                LocalDateTime outTime = LocalDateTime.now();
                history.checkout(outTime, requestDto.getUpdater());
                parkingHistoryRepository.save(history);

                // 3. 주차 시간 계산 (분)
                int parkingMinutes = history.calculateParkingMinutes();

                // 4. 요금 계산
                int amount = settingService.calculateParkingFee(parkingMinutes);

                // 5. Payment 생성
                PaymentCreateDto paymentDto = PaymentCreateDto.builder()
                                .history(history)
                                .amount(amount)
                                .method(requestDto.getMethod())
                                .payTime(outTime)
                                .build();

                Payment payment = paymentService.createPayment(paymentDto);

                // 6. 응답 DTO 생성
                CheckoutResponseDto response = CheckoutResponseDto.builder()
                                .historyId(history.getId())
                                .carNo(history.getCar().getCarNo())
                                .inTime(history.getInTime())
                                .outTime(history.getOutTime())
                                .parkingMinutes(parkingMinutes)
                                .amount(amount)
                                .paymentId(payment.getId())
                                .paymentStatus(payment.getStatus().name())
                                .build();

                // 7. SSE 이벤트 발행

                // 7-1. 주차 기록 변경 이벤트 (출차)
                ParkingHistoryEvent historyEvent = new ParkingHistoryEvent(
                                ParkingHistoryResponseDto.from(history),
                                "EXIT",
                                LocalDateTime.now());
                eventPublisher.publishEvent(historyEvent);

                // 7-2. 일간 수익 업데이트 이벤트
                // 결제가 성공했거나(OK), 후불/현장결제 등으로 처리된 경우 수익 업데이트
                // 여기서는 checkout 시점에 바로 반영된다고 가정
                DailyRevenueEvent revenueEvent = new DailyRevenueEvent(
                                paymentService.calculateTodayRevenue(),
                                paymentService.getTodayTransactionCount(),
                                LocalDateTime.now());
                eventPublisher.publishEvent(revenueEvent);

                return response;
        }

        @Override
        @Transactional
        public CheckoutResponseDto checkoutByCarId(Integer carId, CheckoutRequestDto requestDto) {
                // 1. 해당 차량의 현재 주차 중인 기록 조회
                ParkingHistory history = parkingHistoryRepository.findTopByCarIdAndOutTimeIsNull(carId)
                                .orElseThrow(() -> new RuntimeException("해당 차량의 주차 중인 기록을 찾을 수 없습니다. CarID: " + carId));

                log.info(">>> [Checkout] CarID {} 로 HistoryID {} 조회 성공. 출차 처리 진행.", carId, history.getId());

                // 2. 기존 checkout 메서드 재사용
                return checkout(history.getId(), requestDto);
        }

        /**
         * 목데이터 처리: 이미 out_time이 있지만 결제가 안 된 이력들을 처리
         * 
         * 사용 시나리오:
         * - 테스트 환경에서 목데이터를 넣어둔 경우
         * - 시스템 오류로 결제가 누락된 경우
         * 
         * @return 처리된 결제 정보 목록
         */
        @Transactional
        public List<CheckoutResponseDto> processUnpaidHistories(String creator) {
                List<ParkingHistory> unpaidHistories = parkingHistoryRepository.findUnpaidHistories();
                List<CheckoutResponseDto> results = new ArrayList<>();

                for (ParkingHistory history : unpaidHistories) {
                        try {
                                // 주차 시간 계산
                                int parkingMinutes = history.calculateParkingMinutes();

                                // 요금 계산
                                int amount = settingService.calculateParkingFee(parkingMinutes);

                                // Payment 생성
                                PaymentCreateDto paymentDto = PaymentCreateDto.builder()
                                                .history(history)
                                                .amount(amount)
                                                .method(com.zerojuice.domain.payment.entity.PaymentMethod.RFID) // 기본값
                                                .payTime(history.getOutTime())
                                                .build();

                                Payment payment = paymentService.createPayment(paymentDto);

                                CheckoutResponseDto result = CheckoutResponseDto.builder()
                                                .historyId(history.getId())
                                                .carNo(history.getCar().getCarNo())
                                                .inTime(history.getInTime())
                                                .outTime(history.getOutTime())
                                                .parkingMinutes(parkingMinutes)
                                                .amount(amount)
                                                .paymentId(payment.getId())
                                                .paymentStatus(payment.getStatus().name())
                                                .build();

                                results.add(result);

                        } catch (Exception e) {
                                // 개별 오류는 로깅만 하고 계속 진행
                        }
                }

                return results;
        }
}
