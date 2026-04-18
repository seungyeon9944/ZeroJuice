package com.zerojuice.domain.parking.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class QueueConfigRequestDto {
    private List<Integer> slots;
    private boolean resetQueue = true;
}
