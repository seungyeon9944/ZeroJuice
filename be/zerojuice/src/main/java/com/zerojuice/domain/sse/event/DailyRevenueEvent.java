package com.zerojuice.domain.sse.event;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 일간 수익 업데이트 이벤트
 */
@Getter
@AllArgsConstructor
public class DailyRevenueEvent {
    private Integer totalRevenue;
    private Integer transactionCount;
    private LocalDateTime timestamp;
}
