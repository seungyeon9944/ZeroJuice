package com.zerojuice.domain.car.entity;

import com.zerojuice.domain.user.entity.User;
import com.zerojuice.global.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/**
 * 차량 엔터티
 * PRD: CARS 테이블
 */
@Entity
@Table(name = "cars")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Car extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "car_no", columnDefinition = "CHAR(8)")
    private String carNo;

    @Column(name = "rfid_no", columnDefinition = "CHAR(8)")
    private String rfidNo;

    @Column(name = "creator", columnDefinition = "CHAR(10)")
    private String creator;

    @Column(name = "updater", columnDefinition = "CHAR(10)")
    private String updater;
    // 차량 번호 수정
    public void updateCarNo(String carNo) {
        this.carNo = carNo;
    }

    // RFID 등록/수정
    public void updateRfidNo(String rfidNo) {
        this.rfidNo = rfidNo;
    }
}
