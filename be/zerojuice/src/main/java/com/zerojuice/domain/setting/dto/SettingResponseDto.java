package com.zerojuice.domain.setting.dto;

import com.zerojuice.domain.setting.entity.SettingEntity;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingResponseDto {
    
    private Integer id;
    private Short feeBase;      // 기본 요금 (원)
    private Short timeBase;     // 기본 주차 시간 (분)
    private Short feeUnit;      // 추가 요금 단위 (원)
    private Short timeUnit;     // 추가 요금 시간단위 (분)
    private Byte freeTime;        // 무료 주차 시간 (분)
    private String cctvUrl;       // CCTV URL
    
    // Entity -> DTO 변환
    public static SettingResponseDto from(SettingEntity entity) {
        return SettingResponseDto.builder()
                .id(entity.getId())
                .feeBase(entity.getFeeBase())
                .timeBase(entity.getTimeBase())
                .feeUnit(entity.getFeeUnit())
                .timeUnit(entity.getTimeUnit())
                .freeTime(entity.getFreeTime())
                .cctvUrl(entity.getCctvUrl())
                .build();
    }
}