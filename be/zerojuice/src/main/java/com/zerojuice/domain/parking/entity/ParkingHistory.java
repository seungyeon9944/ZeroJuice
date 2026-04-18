package com.zerojuice.domain.parking.entity;

import com.zerojuice.domain.car.entity.Car;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "parking_histories")
@Getter
@Setter
@NoArgsConstructor
public class ParkingHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "car_id", nullable = false)
    private Car car;
    
    @Column(name = "slot_no", nullable = false)
    private Byte slotNo;
    
    @Column(name = "in_time", nullable = false)
    private LocalDateTime inTime;
    
    @Column(name = "out_time")
    private LocalDateTime outTime;
    
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
    
    @Column(name = "update_time", nullable = false)
    private LocalDateTime updateTime;
    
    @Column(name = "creator", length = 10, nullable = false)
    private String creator;
    
    @Column(name = "updater", length = 10)
    private String updater;

    public void updateOutTime(LocalDateTime outTime) {
        this.outTime = outTime;
        this.updater = "SYS";
    }

    // [입차 생성자] Builder 패턴 사용
    @Builder
    public ParkingHistory(Car car, Byte slotNo, String creator) {
        this.car = car;
        this.slotNo = slotNo;
        this.inTime = LocalDateTime.now();
        this.createTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.creator = creator;
        this.updater = creator;
        // out_time은 null로 시작 (아직 주차중)
    }

    // [출차 처리 메서드]
    public void exit() {
        this.outTime = LocalDateTime.now();
        this.updateTime = LocalDateTime.now();
        this.updater = "ADMIN"; // 혹은 요청자
    }
    
    /**
     * 출차 처리
     */
    public void checkout(LocalDateTime outTime, String updater) {
        if (this.outTime != null) {
            throw new RuntimeException("이미 출차 처리된 기록입니다. History ID: " + this.id);
        }
        this.outTime = outTime;
        this.updateTime = LocalDateTime.now();
        this.updater = updater;
    }
    
    /**
     * 주차 시간 계산 (분 단위)
     */
    public int calculateParkingMinutes() {
        if (this.outTime == null) {
            throw new RuntimeException("출차 시간이 없습니다. History ID: " + this.id);
        }
        
        long seconds = java.time.Duration.between(this.inTime, this.outTime).getSeconds();
        return (int) Math.ceil((double) seconds / 60);
    }
}
