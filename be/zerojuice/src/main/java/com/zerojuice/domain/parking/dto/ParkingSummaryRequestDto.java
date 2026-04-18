package com.zerojuice.domain.parking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 주차 요약 정보 수신 DTO (외부에서 { summary: string, timestamp }로 전달)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ParkingSummaryRequestDto {

    private String summary;
    private String timestamp;
}
