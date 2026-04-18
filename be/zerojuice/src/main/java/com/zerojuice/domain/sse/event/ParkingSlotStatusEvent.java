package com.zerojuice.domain.sse.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 주차 슬롯 상태 변경 이벤트
 */
@Getter
@AllArgsConstructor
public class ParkingSlotStatusEvent {
    private Map<Byte, String> slotStatus; // {slotNo: status}
    private Long emptyCount;
    private Long parkingCount;
    private LocalDateTime timestamp;
}
