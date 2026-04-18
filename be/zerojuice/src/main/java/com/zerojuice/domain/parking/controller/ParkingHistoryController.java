package com.zerojuice.domain.parking.controller;

import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import com.zerojuice.domain.parking.service.ParkingHistoryService;
import com.zerojuice.domain.parking.dto.CheckoutRequestDto;
import com.zerojuice.domain.parking.dto.CheckoutResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/parking/histories")
@RequiredArgsConstructor
public class ParkingHistoryController {

    private final ParkingHistoryService parkingHistoryService;

    /**
     * 전체 조회 (페이징, 최근순 정렬)
     * GET /api/parking/histories?page=0&size=20
     */
    @GetMapping
    public ResponseEntity<Page<ParkingHistoryResponseDto>> getAllParkingHistories(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // 최근 입차시간 순으로 정렬 (내림차순)
        Pageable pageable = PageRequest.of(page, size, Sort.by("inTime").descending());
        Page<ParkingHistoryResponseDto> histories = parkingHistoryService.getAllParkingHistories(pageable);
        return ResponseEntity.ok(histories);
    }

    /**
     * 차량번호로 검색 (페이징)
     * GET /api/parking/histories/search/car-no?carNo=123가4567&page=0&size=20
     */
    @GetMapping("/search/car-no")
    public ResponseEntity<Page<ParkingHistoryResponseDto>> searchByCarNo(
            @RequestParam String carNo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("inTime").descending());
        Page<ParkingHistoryResponseDto> histories = parkingHistoryService.searchByCarNo(carNo, pageable);
        return ResponseEntity.ok(histories);
    }

    /**
     * 날짜 범위로 검색 (페이징)
     * GET
     * /api/parking/histories/search/date-range?startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59&page=0&size=20
     */
    @GetMapping("/search/date-range")
    public ResponseEntity<Page<ParkingHistoryResponseDto>> searchByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("inTime").descending());
        Page<ParkingHistoryResponseDto> histories = parkingHistoryService.searchByDateRange(startDate, endDate,
                pageable);
        return ResponseEntity.ok(histories);
    }

    /**
     * 통합 검색 (선택사항 - 차량번호 + 날짜 범위 동시 검색)
     * GET
     * /api/parking/histories/search?carNo=123가4567&startDate=2025-01-01T00:00:00&endDate=2025-01-31T23:59:59&page=0&size=20
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ParkingHistoryResponseDto>> search(
            @RequestParam(required = false) String carNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("inTime").descending());
        Page<ParkingHistoryResponseDto> histories = parkingHistoryService.search(carNo, startDate, endDate, pageable);
        return ResponseEntity.ok(histories);
    }

    /**
     * 출차 처리
     * PUT /api/parking/histories/{id}/checkout
     * 
     * Request Body:
     * {
     * "method": "RFID",
     * "updater": "admin"
     * }
     * 
     * Response:
     * {
     * "historyId": 1,
     * "carNo": "123가4567",
     * "inTime": "2025-01-28T10:00:00",
     * "outTime": "2025-01-28T12:30:00",
     * "parkingMinutes": 150,
     * "amount": 3000,
     * "paymentId": 1,
     * "paymentStatus": "PENDING"
     * }
     */
    @PutMapping("/{id}/checkout")
    public ResponseEntity<CheckoutResponseDto> checkout(
            @PathVariable Integer id,
            @RequestBody CheckoutRequestDto requestDto) {
        CheckoutResponseDto response = parkingHistoryService.checkout(id, requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 차량 ID 기반 출차 처리 (편의 메서드)
     * PUT /api/parking/histories/by-car/{carId}/checkout
     */
    @PutMapping("/by-car/{carId}/checkout")
    public ResponseEntity<CheckoutResponseDto> checkoutByCar(
            @PathVariable Integer carId,
            @RequestBody CheckoutRequestDto requestDto) {
        CheckoutResponseDto response = parkingHistoryService.checkoutByCarId(carId, requestDto);
        return ResponseEntity.ok(response);
    }

    /**
     * 미결제 이력 일괄 처리 (목데이터 처리용)
     * POST /api/parking/histories/process-unpaid?creator=admin
     * 
     * - out_time은 있지만 결제가 안 된 이력들을 찾아서 일괄 처리
     * - 주로 테스트 환경에서 목데이터를 넣어둔 후 사용
     * 
     * Response:
     * [
     * {
     * "historyId": 1,
     * "carNo": "123가4567",
     * "inTime": "2025-01-28T10:00:00",
     * "outTime": "2025-01-28T12:30:00",
     * "parkingMinutes": 150,
     * "amount": 3000,
     * "paymentId": 1,
     * "paymentStatus": "PENDING"
     * },
     * ...
     * ]
     */
    @PostMapping("/process-unpaid")
    public ResponseEntity<List<CheckoutResponseDto>> processUnpaidHistories(
            @RequestParam(defaultValue = "system") String creator) {
        List<CheckoutResponseDto> results = parkingHistoryService.processUnpaidHistories(creator);
        return ResponseEntity.ok(results);
    }
}