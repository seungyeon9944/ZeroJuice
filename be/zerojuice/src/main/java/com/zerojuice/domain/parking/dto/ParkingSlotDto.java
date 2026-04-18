package com.zerojuice.domain.parking.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ParkingSlotDto {
    private String commandId;   // "cmd-20260128-000123"
    private String type;        // "PARK"
    private String slotNo;      // "A1", "C2" 등
    private String timestamp;   // "2025-01-20T14:30:00"
}