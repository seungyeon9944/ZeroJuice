package com.zerojuice.domain.payment.entity;

/**
 * 결제 상태 Enum
 */
public enum PaymentStatus {
    PENDING, // 대기중
    OK, // 결제완료
    FAIL // 결제실패
}
