package com.zerojuice.domain.parking.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class QueueConfigResponseDto {
    private List<Integer> configuredSlots;
    private List<Integer> currentQueue;
}
