package com.zerojuice.domain.parking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 주차 상태 업데이트 응답 DTO
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingStatusResponseDto {

    /**
     * 응답 메시지
     */
    private String message;

    /**
     * 업데이트된 슬롯 개수
     */
    private int updatedCount;

    /**
     * 성공 여부
     */
    private boolean success;
}