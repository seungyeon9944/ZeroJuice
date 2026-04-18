package com.zerojuice.domain.payment.dto;

import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.domain.payment.entity.Payment;
import com.zerojuice.domain.payment.entity.PaymentMethod;
import com.zerojuice.domain.payment.entity.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Payment 생성용 내부 DTO
 * ParkingHistoryService의 checkout에서 사용
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentCreateDto {
    
    private ParkingHistory history;
    private Integer amount;
    private PaymentMethod method;
    private LocalDateTime payTime;

    // DTO -> Entity 변환
    public Payment toEntity() {
        Payment payment = Payment.builder()
                .history(this.history)
                .amount(this.amount)
                .method(this.method)
                .payTime(this.payTime)
                .status(PaymentStatus.PENDING) // 생성 시 기본값 명시 (Builder 사용 시 안전함)
                .creator("system")
                .build();
        
        // creator 수동 설정 (BaseTimeEntity의 setCreator 사용)
        payment.setCreator("system");  // 또는 파라미터로 받기
        
        return payment;
    }
}