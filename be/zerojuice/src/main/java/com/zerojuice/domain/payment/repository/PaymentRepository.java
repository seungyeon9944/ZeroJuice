package com.zerojuice.domain.payment.repository;

import com.zerojuice.domain.parking.entity.ParkingHistory;
import com.zerojuice.domain.payment.entity.Payment;
import com.zerojuice.domain.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * 결제 Repository
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Integer> {

    // 주차 기록 ID로 결제 조회
    Optional<Payment> findByHistory(ParkingHistory history);

    // 결제 상태별 조회
    long countByStatus(PaymentStatus status);

    // 특정 날짜 범위 + 상태별 총 수익 조회
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.createTime >= :startDate AND p.createTime < :endDate AND p.status = :status")
    Integer sumAmountByDateRangeAndStatus(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate, @Param("status") PaymentStatus status);

    // 특정 날짜 범위 + 상태별 결제 건수 조회
    @Query("SELECT COUNT(p) FROM Payment p WHERE p.createTime >= :startDate AND p.createTime < :endDate AND p.status = :status")
    Integer countByDateRangeAndStatus(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate, @Param("status") PaymentStatus status);
}
