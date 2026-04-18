package com.zerojuice.domain.parking.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.domain.sse.event.ParkingHistoryEvent;
import com.zerojuice.domain.sse.event.ParkingSlotStatusEvent;
import com.zerojuice.infra.mqtt.MqttPubGateway;

import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import com.zerojuice.domain.parking.dto.ParkingSlotDto; // <--- import 변경 확인
import com.zerojuice.domain.parking.entity.ParkingSlot;
import com.zerojuice.domain.car.repository.CarRepository;
import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.domain.parking.entity.SlotStatus;
import com.zerojuice.domain.parking.repository.ParkingHistoryRepository;
import com.zerojuice.domain.parking.repository.ParkingSlotRepository;
import jakarta.annotation.PostConstruct;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.stream.Collectors;

/**
 * 주차 슬롯 관리 서비스
 */
@Slf4j
@Service
public class ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final MqttPubGateway mqttPubGateway;
    // mqttGateway를 mqttPubGateway로 변경
    private final ParkingHistoryRepository parkingHistoryRepository;
    private final CarRepository carRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final com.zerojuice.domain.notification.service.FCMService fcmService;

    // 빈 자리를 관리하는 큐
    private final Queue<Integer> availableSlotQueue = new ConcurrentLinkedQueue<>();
    private volatile List<Integer> configuredSlots;
    private final String initialSlotsProperty;

    public ParkingSlotService(
            ParkingSlotRepository parkingSlotRepository,
            MqttPubGateway mqttPubGateway,
            ParkingHistoryRepository parkingHistoryRepository,
            CarRepository carRepository,
            ObjectMapper objectMapper,
            ApplicationEventPublisher eventPublisher,
            com.zerojuice.domain.notification.service.FCMService fcmService,
            @Value("${parking.queue.initial-slots:3,6,2,1}") String initialSlotsProperty) {
        this.parkingSlotRepository = parkingSlotRepository;
        this.mqttPubGateway = mqttPubGateway;
        this.parkingHistoryRepository = parkingHistoryRepository;
        this.carRepository = carRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
        this.fcmService = fcmService;
        this.initialSlotsProperty = initialSlotsProperty;
    }

    /**
     * [서버 시작 시 큐 초기화]
     * parking_slots 테이블에서 EMPTY인 것만 1번부터 가져와서 큐에 채움
     */
    @PostConstruct
    public void initQueue() {
        this.configuredSlots = parseSlotList(initialSlotsProperty);
        resetQueueWithConfiguredSlots();
        log.info("큐 초기화 완료. configuredSlots={}, currentQueue={}", configuredSlots, availableSlotQueue);
    }

    @Transactional(readOnly = true)
    public List<Integer> getConfiguredSlots() {
        return new ArrayList<>(configuredSlots);
    }

    @Transactional(readOnly = true)
    public List<Integer> getCurrentQueueSnapshot() {
        return new ArrayList<>(availableSlotQueue);
    }

    @Transactional
    public void updateQueueConfig(List<Integer> slots, boolean resetQueue) {
        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("slots는 비어 있을 수 없습니다.");
        }

        List<Integer> parsedSlots = normalizeSlotList(slots);
        this.configuredSlots = parsedSlots;

        if (resetQueue) {
            resetQueueWithConfiguredSlots();
        }

        log.info("큐 설정 변경 완료. configuredSlots={}, currentQueue={}, resetQueue={}",
                configuredSlots, availableSlotQueue, resetQueue);
    }

    private void resetQueueWithConfiguredSlots() {
        availableSlotQueue.clear();
        availableSlotQueue.addAll(configuredSlots);
    }

    private List<Integer> parseSlotList(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new IllegalArgumentException("parking.queue.initial-slots 값이 비어 있습니다.");
        }

        try {
            List<Integer> slots = Arrays.stream(raw.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(Integer::parseInt)
                    .collect(Collectors.toList());
            return normalizeSlotList(slots);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("parking.queue.initial-slots 파싱 실패: " + raw, e);
        }
    }

    private List<Integer> normalizeSlotList(List<Integer> slots) {
        if (slots == null || slots.isEmpty()) {
            throw new IllegalArgumentException("슬롯 리스트가 비어 있습니다.");
        }

        List<Integer> normalized = slots.stream()
                .filter(slot -> slot != null)
                .collect(Collectors.toList());

        if (normalized.size() != slots.size()) {
            throw new IllegalArgumentException("슬롯 리스트에 null 값이 포함되어 있습니다.");
        }

        boolean hasNonPositive = normalized.stream().anyMatch(slot -> slot <= 0);
        if (hasNonPositive) {
            throw new IllegalArgumentException("슬롯 번호는 1 이상이어야 합니다.");
        }

        return List.copyOf(normalized);
    }

    /**
     * [입차 요청]
     * 핵심: DB에 'saveAndFlush'로 즉시 저장해야 ID가 생성됨
     */
    @Transactional
    public ParkingSlotDto requestEntry(Integer userId) {
        try {
            // 1. 차량 조회
            Car car = carRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("차량 정보가 없습니다. 먼저 차량을 등록해주세요."));

            // 2. 빈 자리 배정
            Integer slotNoInt = availableSlotQueue.poll();
            if (slotNoInt == null) {
                throw new RuntimeException("만차입니다.");
            }
            Byte slotNo = slotNoInt.byteValue();

            // 3. [저장 로직] History 생성
            ParkingHistory history = ParkingHistory.builder()
                    .car(car)
                    .slotNo(slotNo)
                    .creator("SYSTEM")
                    .build();

            // ★★★ [핵심] DB에 즉시 저장하고 ID를 받아옴 ★★★
            parkingHistoryRepository.saveAndFlush(history);

            log.info("[DB 저장 성공] History ID: {}, Slot: {}, Car: {}", history.getId(), slotNo, car.getCarNo());

            // 4. MQTT 전송
            ParkingSlotDto result = sendMqttMessage(slotNoInt, "PARK", car.getCarNo(), history.getId());

            // 5. SSE 이벤트 발행
            ParkingHistoryEvent event = new ParkingHistoryEvent(
                    ParkingHistoryResponseDto.from(history),
                    "ENTRY",
                    LocalDateTime.now());
            eventPublisher.publishEvent(event);

            // 6. FCM 알림 발송
            try {
                fcmService.sendNotificationToUser(
                        userId,
                        "입차 배정",
                        "주차공간 배정이 완료되었습니다. (" + convertSlotNoToName(slotNoInt) + ")",
                        java.util.Map.of("type", "PARKING_STARTED"));
            } catch (Exception e) {
                log.warn("FCM 알림 발송 실패: {}", e.getMessage());
            }

            return result;

        } catch (RuntimeException e) {
            log.error("입차 요청 실패: {}", e.getMessage());
            // 에러 상황을 DTO에 담아서 리턴 (혹은 컨트롤러에서 핸들링)
            // 여기서는 DTO에 에러 필드가 없으므로, Exception을 던지되 메시지를 명확히 함
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * [출차 요청]
     */
    @Transactional
    public ParkingSlotDto requestExit(Integer slotNoInt) {
        Byte slotNo = slotNoInt.byteValue();

        // 1. 현재 주차 중인 기록 찾기
        ParkingHistory history = parkingHistoryRepository.findTopBySlotNoAndOutTimeIsNullOrderByInTimeDesc(slotNo)
                .orElseThrow(() -> new RuntimeException("해당 슬롯에 주차 기록이 없습니다."));
        return processExit(history);
    }

    /**
     * [출차 요청] 추후에 ParkingController.java와 관련해서 수정해야함 (slotNo 받을지 or userId 받을지)
     */
    @Transactional
    public ParkingSlotDto exitByUserId(Integer userId) {
        Car car = carRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("차량을 찾을 수 없습니다. UserID: " + userId));

        ParkingHistory history = parkingHistoryRepository.findTopByCarIdAndOutTimeIsNullOrderByInTimeDesc(car.getId())
                .orElseThrow(() -> new RuntimeException("현재 주차 중인 차량이 아닙니다."));

        Integer slotNo = history.getSlotNo().intValue();
        log.info("🚗 유저({}) 차량 출차 요청 -> 슬롯 번호: {}", userId, slotNo);

        return processExit(history);
    }

    private ParkingSlotDto processExit(ParkingHistory history) {
        Integer slotNoInt = history.getSlotNo().intValue();

        // 1. 출차 처리 (out_time 업데이트)
        history.exit();
        parkingHistoryRepository.saveAndFlush(history);

        // 2. 큐 반납
        availableSlotQueue.offer(slotNoInt);
        log.info("출차 처리 완료: {}번 슬롯", slotNoInt);

        // 3. MQTT 전송
        ParkingSlotDto result = sendMqttMessage(slotNoInt, "EXIT", history.getCar().getCarNo(), history.getId());

        // 4. SSE 이벤트 발행 (출차)
        ParkingHistoryEvent event = new ParkingHistoryEvent(
                ParkingHistoryResponseDto.from(history),
                "EXIT",
                LocalDateTime.now());
        eventPublisher.publishEvent(event);

        // 5. FCM 알림 발송 (출차 시작)
        try {
            if (history.getCar() != null && history.getCar().getUser() != null) {
                fcmService.sendNotificationToUser(
                        history.getCar().getUser().getId(),
                        "출차 진행",
                        "출차 중입니다. 잠시만 기다려주세요.");
            }
        } catch (Exception e) {
            log.warn("FCM 알림 발송 실패: {}", e.getMessage());
        }

        return result;
    }

    // MQTT 전송 로직
    private ParkingSlotDto sendMqttMessage(Integer slotNo, String type, String carNo, Integer historyId) {
        String topic = "car/" + carNo + "/command";
        String slotName = convertSlotNoToName(slotNo);
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // DB ID를 사용하여 커맨드 생성 (예: cmd-20260128-000205)
        String newCommandId = String.format("cmd-%s-%06d", datePart, historyId);

        ParkingSlotDto payload = ParkingSlotDto.builder()
                .commandId(newCommandId)
                .type(type)
                .slotNo(slotName)
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();

        try {
            String jsonMessage = objectMapper.writeValueAsString(payload);
            mqttPubGateway.sendToMqtt(jsonMessage, topic);

            log.info("📡 [MQTT 전송 성공] Type: {}, Slot: {}", type, slotName);
        } catch (JsonProcessingException e) {
            log.error("JSON 변환 실패", e);
        }
        return payload;
    }

    private String convertSlotNoToName(Integer slotNo) {
        char row = (char) ('A' + (slotNo - 1) / 2);
        int col = (slotNo % 2 == 0) ? 2 : 1;
        return String.format("%c%d", row, col);
    }

    @Transactional
    public ParkingSlotDto releaseSlot(Integer slotNo) {
        return requestExit(slotNo);
    }

    // ===== 슬롯 이름 → 슬롯 번호 매핑 =====
    // Python에서 받는 슬롯 이름(A1, A2, B1, B2, C1, C2)을 DB의 slot_no(1~6)로 변환
    private static final Map<String, Byte> SLOT_NAME_TO_NO = Map.of(
            "A1", (byte) 1,
            "A2", (byte) 2,
            "B1", (byte) 3,
            "B2", (byte) 4,
            "C1", (byte) 5,
            "C2", (byte) 6
    // 필요하면 7, 8까지 추가 가능
    );

    /**
     * Python 서버에서 받은 주차 상태 업데이트
     * 
     * @param slotsData Python에서 받은 슬롯 데이터 Map (예: {"A1": "empty", "B2": "parking"})
     * @return 업데이트된 슬롯 개수
     */
    @Transactional
    public int updateParkingStatus(Map<String, String> slotsData) {
        log.info("주차 상태 업데이트 시작 - 슬롯 개수: {}", slotsData.size());

        // 모든 슬롯을 한 번에 조회 (DB 조회 1회로 최적화)
        Map<Byte, ParkingSlot> existingSlots = parkingSlotRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(ParkingSlot::getSlotNo, slot -> slot));

        int updatedCount = 0;

        for (Map.Entry<String, String> entry : slotsData.entrySet()) {
            String slotName = entry.getKey(); // 예: "A1"
            String status = entry.getValue(); // 예: "empty" 또는 "parking"

            try {
                // 슬롯 이름을 슬롯 번호로 변환
                Byte slotNo = SLOT_NAME_TO_NO.get(slotName);

                if (slotNo == null) {
                    log.warn("알 수 없는 슬롯 이름: {}", slotName);
                    continue;
                }

                // 기존 슬롯 찾기
                ParkingSlot slot = existingSlots.get(slotNo);

                if (slot == null) {
                    log.warn("슬롯 번호 {}가 DB에 존재하지 않습니다. 슬롯을 먼저 생성해주세요.", slotNo);
                    continue;
                }

                // [상태 변화 감지]
                SlotStatus oldStatus = slot.getStatus();
                SlotStatus newStatus = SlotStatus.valueOf(status.toUpperCase());

                // 상태 업데이트 수행 (실제 값이 다를 때만)
                if (oldStatus != newStatus) {
                    slot.updateStatus(status); // 문자열 그대로 넘겨도 내부에서 처리
                    parkingSlotRepository.save(slot);
                    updatedCount++;

                    log.debug("슬롯 업데이트 완료 - SlotNo: {}, Old: {}, New: {}", slotNo, oldStatus, newStatus);

                    // [알림 로직]
                    handleStatusChangeNotification(slotNo, slotName, oldStatus, newStatus);
                }

            } catch (IllegalArgumentException e) {
                log.warn("잘못된 상태 값: {}", status);
            } catch (Exception e) {
                log.error("슬롯 업데이트 실패 - SlotName: {}, Error: {}", slotName, e.getMessage());
            }
        }

        log.info("주차 상태 업데이트 완료 - 총 {}개 슬롯 업데이트", updatedCount);

        // SSE 이벤트 발행
        ParkingSlotStatusEvent event = new ParkingSlotStatusEvent(
                getAllParkingStatus(),
                getEmptySlotCount(),
                getParkingSlotCount(),
                LocalDateTime.now());
        eventPublisher.publishEvent(event);
        log.debug("ParkingSlotStatusEvent 발행 완료");

        return updatedCount;
    }

    // 상태 변화에 따른 알림 처리 핸들러 (메서드 분리)
    private void handleStatusChangeNotification(Byte slotNo, String slotName, SlotStatus oldStatus,
            SlotStatus newStatus) {
        log.info("Checking notification trigger for Slot {} ({}) -> {} to {}", slotNo, slotName, oldStatus, newStatus);
        try {
            // Case 1: 주차 완료 (Anything -> PARKING)
            if (newStatus == SlotStatus.PARKING) {
                // 현재 해당 슬롯에 주차 중인(out_time IS NULL) 기록 찾기
                Optional<ParkingHistory> history = parkingHistoryRepository
                        .findTopBySlotNoAndOutTimeIsNullOrderByInTimeDesc(slotNo);

                if (history.isEmpty()) {
                    log.warn("Notification skipped: No active history found for slot {}", slotNo);
                } else {
                    log.info("Found history for parking complete: {}", history.get().getId());
                    if (history.get().getCar() == null)
                        log.warn("History has no CAR");
                    else if (history.get().getCar().getUser() == null)
                        log.warn("History has no USER");
                }

                if (history.isPresent() && history.get().getCar() != null && history.get().getCar().getUser() != null) {
                    Integer userId = history.get().getCar().getUser().getId();
                    fcmService.sendNotificationToUser(
                            userId,
                            "주차 완료",
                            "주차가 완료되었습니다. 현재 자리는 " + slotName + "입니다.",
                            java.util.Map.of("type", "PARKING_COMPLETED"));
                    log.info("주차 완료 알림 발송 성공 to User {}", userId);
                }
            }

            // Case 2: 출차 완료 (PARKING -> EMPTY)
            // 출차는 requestExit에서 이미 out_time을 찍어버렸을 수 있으므로,
            // '가장 최근에 이 슬롯을 썼던 사람'을 찾아야 함.
            else if (oldStatus == SlotStatus.PARKING && newStatus == SlotStatus.EMPTY) {
                // 해당 슬롯의 가장 최근 기록 (이미 출차 처리되어 out_time이 있을 수 있음)
                Optional<ParkingHistory> history = parkingHistoryRepository.findTopBySlotNoOrderByInTimeDesc(slotNo);

                if (history.isEmpty()) {
                    log.warn("Notification skipped: No history found for slot {} (Exit)", slotNo);
                } else {
                    log.info("Found history for exit complete: {}", history.get().getId());
                }

                if (history.isPresent() && history.get().getCar() != null && history.get().getCar().getUser() != null) {
                    Integer userId = history.get().getCar().getUser().getId();
                    fcmService.sendNotificationToUser(
                            userId,
                            "출차 완료",
                            "출차가 완료되었습니다. 차량을 타고 이동해주세요.",
                            java.util.Map.of("type", "EXIT_COMPLETED"));
                    log.info("출차 완료 알림 발송 성공 to User {}", userId);
                }
            }
        } catch (Exception e) {
            log.error("상태 변화 알림 중 오류: {}", e.getMessage(), e);
        }
    }

    /**
     * 모든 주차 슬롯 조회
     */
    @Transactional(readOnly = true)
    public Map<Byte, String> getAllParkingStatus() {
        return parkingSlotRepository.findAll().stream()
                .collect(java.util.stream.Collectors.toMap(
                        ParkingSlot::getSlotNo,
                        slot -> slot.getStatus().name()));
    }

    /**
     * 빈 슬롯 개수 조회
     */
    @Transactional(readOnly = true)
    public long getEmptySlotCount() {
        return parkingSlotRepository.countByStatus(com.zerojuice.domain.parking.entity.SlotStatus.EMPTY);
    }

    /**
     * 주차 중인 슬롯 개수 조회
     */
    @Transactional(readOnly = true)
    public long getParkingSlotCount() {
        return parkingSlotRepository.countByStatus(com.zerojuice.domain.parking.entity.SlotStatus.PARKING);
    }
}
