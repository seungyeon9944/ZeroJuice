package com.zerojuice.domain.payment.entity;

import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 결제 엔터티
 * PRD: PAYMENTS 테이블
 */
@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Payment extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "history_id", nullable = false)
    private ParkingHistory history;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "method", nullable = false)
    @Builder.Default
    private PaymentMethod method = PaymentMethod.RFID;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "pay_time")
    private LocalDateTime payTime;

    @Column(name = "creator", columnDefinition = "CHAR(10)")
    private String creator;

    @Column(name = "updater", columnDefinition = "CHAR(10)")
    private String updater;

    // 결제 완료 처리
    public void completePayment(String updater) {
        this.status = PaymentStatus.OK;
        this.payTime = LocalDateTime.now();
        this.updater = updater;
    }

    // 결제 실패 처리
    public void failPayment(String updater) {
        this.status = PaymentStatus.FAIL;
        this.updater = updater;
    }
}
