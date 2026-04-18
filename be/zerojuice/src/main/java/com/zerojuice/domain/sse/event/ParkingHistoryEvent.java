package com.zerojuice.domain.sse.event;

import com.zerojuice.domain.parking.dto.ParkingHistoryResponseDto;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 주차 기록 생성/변경 이벤트
 */
@Getter
@AllArgsConstructor
public class ParkingHistoryEvent {
    private ParkingHistoryResponseDto history;
    private String eventType; // "ENTRY", "EXIT"
    private LocalDateTime timestamp;
}
