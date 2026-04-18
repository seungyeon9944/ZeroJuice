package com.zerojuice.domain.setting.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "fee_base", nullable = false)
    private Short feeBase;  // 기본 요금 (원)
    
    @Column(name = "time_base", nullable = false)
    private Short timeBase;  // 기본 주차 시간 (분)
    
    @Column(name = "fee_unit", nullable = false)
    private Short feeUnit;  // 추가 요금 단위 (원)
    
    @Column(name = "time_unit", nullable = false)
    private Short timeUnit;  // 추가 요금 시간단위 (분)
    
    @Column(name = "free_time", nullable = false)
    private Byte freeTime;  // 무료 주차 시간 (분)
    
    @Column(name = "cctv_url", columnDefinition = "TEXT")
    private String cctvUrl;  // CCTV URL

    public void updateSettings(Short feeBase, Short timeBase, Short feeUnit, Short timeUnit, Byte freeTime, String cctvUrl) {
        this.feeBase = feeBase;
        this.timeBase = timeBase;
        this.feeUnit = feeUnit;
        this.timeUnit = timeUnit;
        this.freeTime = freeTime;
        this.cctvUrl = cctvUrl;
    }
}