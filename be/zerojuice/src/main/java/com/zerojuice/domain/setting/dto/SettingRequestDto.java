package com.zerojuice.domain.setting.dto;

import com.zerojuice.domain.setting.entity.SettingEntity;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SettingRequestDto {
    
    @NotNull(message = "기본 요금은 필수입니다.")
    @Min(value = 0, message = "기본 요금은 0 이상이어야 합니다.")
    private Short feeBase;      // 기본 요금 (원)
    
    @NotNull(message = "기본 주차 시간은 필수입니다.")
    @Min(value = 1, message = "기본 주차 시간은 1 이상이어야 합니다.")
    private Short timeBase;     // 기본 주차 시간 (분)
    
    @NotNull(message = "추가 요금 단위는 필수입니다.")
    @Min(value = 0, message = "추가 요금 단위는 0 이상이어야 합니다.")
    private Short feeUnit;      // 추가 요금 단위 (원)
    
    @NotNull(message = "추가 요금 시간단위는 필수입니다.")
    @Min(value = 1, message = "추가 요금 시간단위는 1 이상이어야 합니다.")
    private Short timeUnit;     // 추가 요금 시간단위 (분)
    
    @NotNull(message = "무료 주차 시간은 필수입니다.")
    @Min(value = 0, message = "무료 주차 시간은 0 이상이어야 합니다.")
    private Byte freeTime;        // 무료 주차 시간 (분)
    
    private String cctvUrl;       // CCTV URL (선택)
    
    // DTO -> Entity 변환
    public SettingEntity toEntity() {
        return SettingEntity.builder()
                .feeBase(this.feeBase)
                .timeBase(this.timeBase)
                .feeUnit(this.feeUnit)
                .timeUnit(this.timeUnit)
                .freeTime(this.freeTime)
                .cctvUrl(this.cctvUrl)
                .build();
    }
}