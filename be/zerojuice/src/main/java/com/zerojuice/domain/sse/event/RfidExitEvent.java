package com.zerojuice.domain.sse.event;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * RFID 출차 로그 이벤트
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RfidExitEvent {

    // 데이터 구조가 미정이므로 Map으로 유연하게 수신
    private Map<String, Object> rfidData;

    private LocalDateTime timestamp;
}
