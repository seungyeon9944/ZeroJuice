package com.zerojuice.domain.parking.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 주차 상태 업데이트 요청 DTO
 * Python 서버에서 전송하는 데이터 형식
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ParkingStatusRequestDto {

    /**
     * 슬롯별 상태 정보
     * key: 슬롯 이름 (A1, A2, B1, B2, C1, C2)
     * value: 상태 ("empty" 또는 "parking")
     */
    private Map<String, String> slots;
}