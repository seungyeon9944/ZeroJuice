package com.zerojuice.domain.parking.repository;

import com.zerojuice.domain.parking.entity.ParkingSlot;
import com.zerojuice.domain.parking.entity.SlotStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 주차면 Repository
 */
@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Integer> {

    // 상태별 주차면 조회
    List<ParkingSlot> findByStatus(SlotStatus status);

    // 주차면 번호로 조회
    Optional<ParkingSlot> findBySlotNo(Integer slotNo);

    // 비어있는 주차면 조회 (배정용)
    List<ParkingSlot> findByStatusOrderBySlotNoAsc(SlotStatus status);

    // 비어있는 주차면 개수
    long countByStatus(SlotStatus status);

    /**
     * 슬롯 번호로 주차 슬롯 찾기
     * @param slotNo 슬롯 번호 (1~8)
     * @return 주차 슬롯
     */
    Optional<ParkingSlot> findBySlotNo(Byte slotNo);
}
