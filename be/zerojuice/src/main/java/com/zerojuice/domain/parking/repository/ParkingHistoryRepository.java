package com.zerojuice.domain.parking.repository;

import com.zerojuice.domain.parking.entity.ParkingHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ParkingHistoryRepository extends JpaRepository<ParkingHistory, Integer> {

        /**
         * 전체 조회 (FETCH JOIN으로 N+1 문제 해결)
         */
        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car")
        Page<ParkingHistory> findAllWithCar(Pageable pageable);

        /**
         * 차량번호로 검색 (부분 일치)
         */
        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car c WHERE c.carNo LIKE %:carNo%")
        Page<ParkingHistory> findByCarNoContaining(@Param("carNo") String carNo, Pageable pageable);

        /**
         * 날짜 범위로 검색
         */
        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car WHERE ph.inTime BETWEEN :startDate AND :endDate")
        Page<ParkingHistory> findByInTimeBetween(
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        Pageable pageable);

        /**
         * 통합 검색 (차량번호 + 날짜 범위)
         * 모든 파라미터가 선택적(optional)
         */
        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car c " +
                        "WHERE (:carNo IS NULL OR c.carNo LIKE %:carNo%) " +
                        "AND (:startDate IS NULL OR ph.inTime >= :startDate) " +
                        "AND (:endDate IS NULL OR ph.inTime <= :endDate)")
        Page<ParkingHistory> search(
                        @Param("carNo") String carNo,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate,
                        Pageable pageable);

        // 1. 서버 켜질 때 큐 초기화용: 아직 출차 안 한(outTime이 NULL) 모든 기록 조회
        List<ParkingHistory> findAllByOutTimeIsNull();

        // 2. 출차 시 사용: 특정 슬롯에 아직 주차 중인 기록 찾기
        Optional<ParkingHistory> findTopBySlotNoAndOutTimeIsNullOrderByInTimeDesc(Byte slotNo);

        /**
         * ID로 조회 (FETCH JOIN)
         */
        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car WHERE ph.id = :id")
        Optional<ParkingHistory> findByIdWithCar(@Param("id") Integer id);

        /**
         * 출차 시간이 있지만 결제 정보가 없는 이력 조회 (목데이터 처리용)
         * - out_time이 NULL이 아님
         * - payments 테이블에 해당 history_id가 없음
         */
        @Query("SELECT ph FROM ParkingHistory ph " +
                        "JOIN FETCH ph.car " +
                        "WHERE ph.outTime IS NOT NULL " +
                        "AND NOT EXISTS (SELECT 1 FROM Payment p WHERE p.history = ph)")
        List<ParkingHistory> findUnpaidHistories();

        Optional<ParkingHistory> findTopByCarIdAndOutTimeIsNullOrderByInTimeDesc(Integer carId);

        Optional<ParkingHistory> findTopByCarUserIdAndOutTimeIsNullOrderByInTimeDesc(Integer userId);

        // 이 슬롯의 가장 최근 이력 찾기 (출차 완료 알림용)
        Optional<ParkingHistory> findTopBySlotNoOrderByInTimeDesc(Byte slotNo);

        @Query("SELECT ph FROM ParkingHistory ph JOIN FETCH ph.car WHERE ph.car.id = :carId AND ph.outTime IS NULL ORDER BY ph.inTime DESC")
        Optional<ParkingHistory> findTopByCarIdAndOutTimeIsNull(@Param("carId") Integer carId);
}
