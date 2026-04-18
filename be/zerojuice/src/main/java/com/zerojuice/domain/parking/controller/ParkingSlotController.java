package com.zerojuice.domain.parking.controller;

import com.zerojuice.domain.parking.dto.ParkingStatusRequestDto;
import com.zerojuice.domain.parking.dto.ParkingStatusResponseDto;
import com.zerojuice.domain.parking.dto.QueueConfigRequestDto;
import com.zerojuice.domain.parking.dto.QueueConfigResponseDto;
import com.zerojuice.domain.parking.service.ParkingSlotService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 주차 슬롯 API 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/parking-slots")
@RequiredArgsConstructor
public class ParkingSlotController {

    private final ParkingSlotService parkingSlotService;

    /**
     * 주차 상태 업데이트 (Python 서버에서 호출)
     * POST /api/parking/status
     */
    @PostMapping("/status")
    public ResponseEntity<ParkingStatusResponseDto> updateParkingStatus(
            @RequestBody ParkingStatusRequestDto requestDto) {

        log.info("주차 상태 업데이트 요청 수신 - 슬롯 개수: {}", requestDto.getSlots().size());

        try {
            int updatedCount = parkingSlotService.updateParkingStatus(requestDto.getSlots());

            ParkingStatusResponseDto response = ParkingStatusResponseDto.builder()
                    .message("주차 상태 업데이트 완료")
                    .updatedCount(updatedCount)
                    .success(true)
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("주차 상태 업데이트 실패", e);

            ParkingStatusResponseDto errorResponse = ParkingStatusResponseDto.builder()
                    .message("주차 상태 업데이트 실패: " + e.getMessage())
                    .updatedCount(0)
                    .success(false)
                    .build();

            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }

    /**
     * 전체 주차 상태 조회
     * GET /api/parking/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<Byte, String>> getAllParkingStatus() {
        log.info("전체 주차 상태 조회 요청");

        try {
            Map<Byte, String> status = parkingSlotService.getAllParkingStatus();
            return ResponseEntity.ok(status);

        } catch (Exception e) {
            log.error("주차 상태 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 빈 슬롯 개수 조회
     * GET /api/parking/empty-count
     */
    @GetMapping("/empty-count")
    public ResponseEntity<Long> getEmptySlotCount() {
        log.info("빈 슬롯 개수 조회 요청");

        try {
            long count = parkingSlotService.getEmptySlotCount();
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            log.error("빈 슬롯 개수 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 주차 중인 슬롯 개수 조회
     * GET /api/parking/parking-count
     */
    @GetMapping("/parking-count")
    public ResponseEntity<Long> getParkingSlotCount() {
        log.info("주차 중인 슬롯 개수 조회 요청");

        try {
            long count = parkingSlotService.getParkingSlotCount();
            return ResponseEntity.ok(count);

        } catch (Exception e) {
            log.error("주차 중인 슬롯 개수 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/queue")
    public ResponseEntity<List<Integer>> getCurrentQueue() {
        return ResponseEntity.ok(parkingSlotService.getCurrentQueueSnapshot());
    }

    @GetMapping("/queue-config")
    public ResponseEntity<QueueConfigResponseDto> getQueueConfig() {
        QueueConfigResponseDto response = QueueConfigResponseDto.builder()
                .configuredSlots(parkingSlotService.getConfiguredSlots())
                .currentQueue(parkingSlotService.getCurrentQueueSnapshot())
                .build();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/queue-config")
    public ResponseEntity<QueueConfigResponseDto> updateQueueConfig(@RequestBody QueueConfigRequestDto request) {
        try {
            parkingSlotService.updateQueueConfig(request.getSlots(), request.isResetQueue());
            QueueConfigResponseDto response = QueueConfigResponseDto.builder()
                    .configuredSlots(parkingSlotService.getConfiguredSlots())
                    .currentQueue(parkingSlotService.getCurrentQueueSnapshot())
                    .build();
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
