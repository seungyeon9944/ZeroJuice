package com.zerojuice.domain.parking.controller;

import com.zerojuice.domain.parking.dto.ParkingSummaryRequestDto;
import com.zerojuice.domain.sse.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 주차 요약 수신 API
 */
@Slf4j
@RestController
@RequestMapping("/parking-summary")
@RequiredArgsConstructor
public class ParkingSummaryController {

    private final SseEmitterService sseEmitterService;

    /**
     * 주차 요약 정보 수신 (외부 시스템에서 호출)
     * POST /api/v1/parking-summary
     */
    @PostMapping
    public ResponseEntity<Void> receiveParkingSummary(@RequestBody ParkingSummaryRequestDto requestDto) {
        String summary = requestDto.getSummary();
        if (summary == null) {
            log.warn("주차 요약 수신 실패: summary 누락 (timestamp={})", requestDto.getTimestamp());
            return ResponseEntity.badRequest().build();
        }

        log.info("주차 요약 수신: summary={}, ts={}", summary, requestDto.getTimestamp());

        sseEmitterService.sendToTopic("parking-summary", "parking-summary-update", summary);
        sseEmitterService.sendToTopic("dashboard", "parking-summary-update", summary);

        return ResponseEntity.ok().build();
    }
}
