package com.zerojuice.domain.payment.controller;

import com.zerojuice.domain.payment.dto.PaymentResponseDto;
import com.zerojuice.domain.payment.dto.PaymentUpdateDto;
import com.zerojuice.domain.payment.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

/**
 * 결제 컨트롤러
 */
@Slf4j
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * [출차 요청 API]
     * 프론트엔드에서 '출차' 버튼을 누르면 이 주소로 요청을 보냅니다.
     */
    @PostMapping("/exit/{carId}")
    public ResponseEntity<String> requestExit(@PathVariable("carId") Integer carId) {
        log.info(">>> [PaymentController] 출차 요청 수신 - CarID: {}", carId);
        // 우리가 PaymentService 에 만든 로직을 호출합니다.
        paymentService.processExitRequest(carId);
        return ResponseEntity.ok("출차 및 최종 요금 계산이 완료되었습니다. 결제를 진행해주세요.");
    }

    /**
     * [결제 완료 처리 API] (테스트용)
     * 실제로는 결제 모듈에서 호출하겠지만, 지금은 테스트를 위해 직접 호출할 수 있게 만듭니다.
     */
    @PostMapping("/complete/{paymentId}")
    public ResponseEntity<String> completePayment(@PathVariable("paymentId") Integer paymentId) {
        // ⭐ 결제 상태를 OK로 바꾸고 SSE 알림을 쏩니다.
        PaymentUpdateDto dummydto = PaymentUpdateDto.builder()
                .status("OK")
                .updater("SYS")
                .build();
        paymentService.updatePaymentStatus(paymentId, dummydto);
        return ResponseEntity.ok("결제가 완료되었으며 앱으로 알림이 전송되었습니다.");
    }

    /**
     * 전체 결제 내역 조회
     * GET /api/v1/payments
     */
    @GetMapping
    public ResponseEntity<List<PaymentResponseDto>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    /**
     * ID로 결제 조회
     * GET /api/v1/payments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<PaymentResponseDto> getPaymentById(@PathVariable Integer id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    /**
     * historyId로 결제 조회
     * GET /api/v1/payments/history/{historyId}
     */
    @GetMapping("/history/{historyId}")
    public ResponseEntity<PaymentResponseDto> getPaymentByHistoryId(@PathVariable Integer historyId) {
        return ResponseEntity.ok(paymentService.getPaymentByHistoryId(historyId));
    }

    /**
     * 결제 상태 업데이트
     * PATCH /api/v1/payments/{id}
     * Request Body:
     * {
     * "status": "OK",
     * "updater": "admin"
     * }
     */
    @PatchMapping("/{id}")
    public ResponseEntity<PaymentResponseDto> updatePaymentStatus(
            @PathVariable Integer id,
            @Valid @RequestBody PaymentUpdateDto updateDto) {
        return ResponseEntity.ok(paymentService.updatePaymentStatus(id, updateDto));
    }

}
