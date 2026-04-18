package com.zerojuice.domain.setting.service;

import com.zerojuice.domain.setting.dto.SettingRequestDto;
import com.zerojuice.domain.setting.dto.SettingResponseDto;
import com.zerojuice.domain.setting.entity.SettingEntity;
import com.zerojuice.domain.setting.repository.SettingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SettingService {
    
    private final SettingRepository settingRepository;
    
    /**
     * 설정 조회
     * 설정이 없으면 예외 발생
     */
    public SettingResponseDto getSetting() {
        SettingEntity setting = settingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("설정 정보가 존재하지 않습니다."));
        
        return SettingResponseDto.from(setting);
    }
    
    /**
     * 설정 생성
     * 설정이 이미 존재하면 예외 발생
     */
    @Transactional
    public SettingResponseDto createSetting(SettingRequestDto requestDto) {
        // 이미 설정이 존재하는지 확인
        if (settingRepository.count() > 0) {
            throw new RuntimeException("설정은 하나만 존재할 수 있습니다. 수정을 이용해주세요.");
        }
        
        SettingEntity setting = requestDto.toEntity();
        SettingEntity savedSetting = settingRepository.save(setting);
        
        return SettingResponseDto.from(savedSetting);
    }
    
    /**
     * 설정 수정
     * 설정이 없으면 예외 발생
     */
    @Transactional
    public SettingResponseDto updateSetting(SettingRequestDto requestDto) {
        SettingEntity setting = settingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("설정 정보가 존재하지 않습니다."));
        
        // 설정 업데이트
        setting.setFeeBase(requestDto.getFeeBase());
        setting.setTimeBase(requestDto.getTimeBase());
        setting.setFeeUnit(requestDto.getFeeUnit());
        setting.setTimeUnit(requestDto.getTimeUnit());
        setting.setFreeTime(requestDto.getFreeTime());
        setting.setCctvUrl(requestDto.getCctvUrl());
        
        SettingEntity updatedSetting = settingRepository.save(setting);
        
        return SettingResponseDto.from(updatedSetting);
    }
    
    /**
     * 주차 요금 계산 메서드
     * @param parkingTimeMinutes 주차 시간 (분)
     * @return 계산된 요금 (원)
     */
    public int calculateParkingFee(int parkingTimeMinutes) {
        SettingEntity setting = settingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("설정 정보가 존재하지 않습니다."));
        
        // 요금 계산 로직
        if (parkingTimeMinutes <= setting.getTimeBase()) {
            return setting.getFeeBase();
        } else {
            int overtime = parkingTimeMinutes - setting.getTimeBase();
            int additionalFee = (overtime / setting.getTimeUnit()) * setting.getFeeUnit();
            return setting.getFeeBase() + additionalFee;
        }
    }

    /**
     * 설정 Entity 직접 조회 (내부용)
     */
    public SettingEntity getSettingEntity() {
        return settingRepository.findFirstByOrderByIdAsc()
                .orElseThrow(() -> new RuntimeException("설정 정보가 존재하지 않습니다."));
    }
}