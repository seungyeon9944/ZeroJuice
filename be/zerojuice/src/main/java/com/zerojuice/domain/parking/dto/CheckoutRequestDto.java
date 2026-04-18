package com.zerojuice.domain.parking.dto;

import com.zerojuice.domain.payment.entity.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 출차 요청 DTO
 * PUT /api/v1/parking-histories/{id}/checkout
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequestDto {
    
    @NotNull(message = "결제 수단은 필수입니다.")
    private PaymentMethod method;  // RFID, KAKAO, CARD
    
    @NotNull(message = "수정자는 필수입니다.")
    private String updater;        // 출차 처리자
}