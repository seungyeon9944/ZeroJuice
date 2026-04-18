package com.zerojuice.domain.setting.controller;

import com.zerojuice.domain.setting.dto.SettingRequestDto;
import com.zerojuice.domain.setting.dto.SettingResponseDto;
import com.zerojuice.domain.setting.service.SettingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class SettingController {
    
    private final SettingService settingService;
    
    /**
     * 설정 조회
     * GET /api/v1/settings
     */
    @GetMapping
    public ResponseEntity<SettingResponseDto> getSetting() {
        SettingResponseDto response = settingService.getSetting();
        return ResponseEntity.ok(response);
    }
    
    /**
     * 설정 생성
     * POST /api/v1/settings
     */
    @PostMapping
    public ResponseEntity<SettingResponseDto> createSetting(
            @Valid @RequestBody SettingRequestDto requestDto) {
        SettingResponseDto response = settingService.createSetting(requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * 설정 수정
     * PUT /api/v1/settings
     */
    @PutMapping
    public ResponseEntity<SettingResponseDto> updateSetting(
            @Valid @RequestBody SettingRequestDto requestDto) {
        SettingResponseDto response = settingService.updateSetting(requestDto);
        return ResponseEntity.ok(response);
    }
}