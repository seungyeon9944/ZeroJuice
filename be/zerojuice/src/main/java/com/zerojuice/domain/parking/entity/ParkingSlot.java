package com.zerojuice.domain.parking.entity;

import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 주차면 엔터티
 * PRD: PARKING_SLOTS 테이블
 */
@Entity
@Table(name = "parking_slots")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ParkingSlot extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "slot_no", columnDefinition = "TINYINT")
    private Byte slotNo;

    @Column(name = "pos_x")
    private Double posX;

    @Column(name = "pos_y")
    private Double posY;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private SlotStatus status = SlotStatus.EMPTY;

    @Column(name = "creator", columnDefinition = "CHAR(10)")
    private String creator;

    @Column(name = "updater", columnDefinition = "CHAR(10)")
    private String updater;

    // 차량 주차
    public void parkCar(Car car) {
        this.status = SlotStatus.PARKING;
    }

    // 차량 출차
    public void releaseCar() {
        this.status = SlotStatus.EMPTY;
    }

    /**
     * Python에서 받은 상태값으로 업데이트
     * @param statusStr "parking" 또는 "empty"
     */
    public void updateStatus(String statusStr) {
        if ("parking".equalsIgnoreCase(statusStr)) {
            this.status = SlotStatus.PARKING;
        } else if ("empty".equalsIgnoreCase(statusStr)) {
            this.status = SlotStatus.EMPTY;
        }
    }
    
    /**
     * 좌표 업데이트 (나중에 관리자가 수정할 수 있게)
     */
    public void updatePosition(Double posX, Double posY) {
        this.posX = posX;
        this.posY = posY;
    }

    /**
     * Python 서버용: creator 수동 설정
     */
    public void setCreatorForPython(String creator) {
        this.creator = creator;
    }

    /**
     * updater 수동 설정 (필요 시)
     */
    public void setUpdaterForPython(String updater) {
        this.updater = updater;
    }
}
