package com.zerojuice.domain.parking.controller;

import com.zerojuice.domain.parking.dto.ParkingSlotDto;
import com.zerojuice.domain.parking.service.ParkingSlotService;
import com.zerojuice.domain.payment.dto.PaymentResponseDto;
import com.zerojuice.domain.payment.service.PaymentService;
import com.zerojuice.infra.RedisService;
import com.zerojuice.global.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
// @RequestMapping("/api/parking")
@RequiredArgsConstructor
public class ParkingController {

    private final ParkingSlotService parkingSlotService;
    private final RedisService redisService;
    private final PaymentService paymentService;

    /**
     * 입차 요청
     * 명세서: POST /parking/request-entry
     */
    @PostMapping("/parking/request-entry")
    public ResponseEntity<ParkingSlotDto> requestEntry(@RequestParam Integer userId) {

        log.info("입차 요청 들어옴! 사용자 ID: {}", userId);

        // Redis에서 userId를 키로 하는 토큰이 있는지 조회
        String savedToken = redisService.getValue("auth:rt:" + String.valueOf(userId));

        // 토큰 유효성 검사 (없거나 만료되었으면 에러 리턴)
        if (savedToken == null) {
            throw new RuntimeException("로그인이 만료되었습니다.");
        }

        log.info("Redis 토큰 검증 완료");

        // 3. 서비스 호출 (DB에서 차 번호 찾고 MQTT 쏘는 건 서비스가 함)
        ParkingSlotDto response = parkingSlotService.requestEntry(userId);

        return ResponseEntity.ok(response);
    }

    /**
     * 출차 요청
     * 명세서 : POST /parking/request-exit
     */
    @PostMapping("/parking/request-exit")
    public ResponseEntity<ParkingSlotDto> requestExit(@RequestParam Integer userId) {
        ParkingSlotDto response = paymentService.processExitRequest(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 결제 정보 조회
     * 명세서: GET /payment/{recordId}
     */
    @GetMapping("/payment/{recordId}")
    public ResponseEntity<ApiResponse<PaymentResponseDto>> getPaymentInfo(@PathVariable("recordId") Integer recordId) {
        log.info(">>> [4.3.1] 결제 정보 조회 수신 - RecordId: {}", recordId);

        // 명세서의 recordId는 우리의 historyId와 같습니다.
        PaymentResponseDto response = paymentService.getPaymentByHistoryId(recordId);

        return ResponseEntity.ok(ApiResponse.success(response));
    }

}