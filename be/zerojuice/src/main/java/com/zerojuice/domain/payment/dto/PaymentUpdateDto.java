package com.zerojuice.domain.payment.dto;
import com.zerojuice.domain.payment.entity.PaymentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payment 상태 업데이트용 DTO
 * PATCH /api/v1/payments/{id}
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentUpdateDto {
    
    @NotNull(message = "상태는 필수입니다.")
    @Pattern(regexp = "PENDING|OK|FAIL", message = "상태는 PENDING, OK, FAIL 중 하나여야 합니다.")
    private String status;
    
    @NotNull(message = "수정자는 필수입니다.")
    private String updater;

    // String을 Enum으로 안전하게 변환하는 편의 메서드 추가
    public PaymentStatus getStatusAsEnum() {
        return PaymentStatus.valueOf(this.status);
    }
}