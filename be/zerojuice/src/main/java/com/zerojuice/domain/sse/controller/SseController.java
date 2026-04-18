package com.zerojuice.domain.sse.controller;

import com.zerojuice.domain.sse.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * SSE (Server-Sent Events) 컨트롤러
 */
@RestController
@RequestMapping("/sse")
@RequiredArgsConstructor
@Slf4j
public class SseController {

    private final SseEmitterService sseEmitterService;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    /**
     * 주차 슬롯 상태 (웹) SSE
     * GET /api/v1/sse/parking-slots
     */
    @GetMapping(value = "/parking-slots", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter parkingSlots() {
        log.info("주차 슬롯 SSE 연결 요청");
        return sseEmitterService.createEmitter("parking-slots");
    }

    /**
     * 주차 기록 (웹) SSE
     * GET /api/v1/sse/parking-histories
     */
    @GetMapping(value = "/parking-histories", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter parkingHistories() {
        log.info("주차 기록 SSE 연결 요청");
        return sseEmitterService.createEmitter("parking-histories");
    }

    /**
     * 일간 수익 (웹) SSE
     * GET /api/v1/sse/daily-revenue
     */
    @GetMapping(value = "/daily-revenue", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter dailyRevenue() {
        log.info("일간 수익 SSE 연결 요청");
        return sseEmitterService.createEmitter("daily-revenue");
    }

    /**
     * 주차 요약 (웹) SSE
     * GET /api/v1/sse/parking-summary
     */
    @GetMapping(value = "/parking-summary", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter parkingSummary() {
        log.info("주차 요약 SSE 연결 요청");
        return sseEmitterService.createEmitter("parking-summary");
    }

    /**
     * 대시보드 통합 데이터 (웹) SSE (주차 슬롯 + 수익 + 최근 기록)
     * GET /api/v1/sse/dashboard
     */
    @GetMapping(value = "/dashboard", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter dashboard() {
        log.info("대시보드 SSE 연결 요청");
        return sseEmitterService.createEmitter("dashboard");
    }

    /**
     * RFID 출차 로그 (웹) SSE
     * GET /api/v1/sse/exitlog
     */
    @GetMapping(value = "/exitlog", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter exitLog() {
        log.info("RFID 출차 로그 SSE 연결 요청");
        return sseEmitterService.createEmitter("exitlog");
    }

    /**
     * 로그인 완료 (앱) SSE
     */
    @GetMapping(value = "/app/login/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appLogin(@PathVariable Long userId) {
        log.info("앱 로그인 SSE 연결 요청 - UserId: {}", userId);
        return sseEmitterService.createEmitter("app-login-" + userId);
    }

    /**
     * 현재 주차상태 전달 (앱) SSE
     */
    @GetMapping(value = "/app/parking-status/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appParkingStatus(@PathVariable Long userId) {
        log.info("앱 주차상태 SSE 연결 요청 - UserId: {}", userId);
        return sseEmitterService.createEmitter("app-status-" + userId);
    }

    /**
     * 실시간 주차위치 전달 (앱) SSE
     */
    @GetMapping(value = "/app/parking-location/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appParkingLocation(@PathVariable Long userId) {
        log.info("앱 실시간 위치 SSE 연결 요청 - UserId: {}", userId);
        return sseEmitterService.createEmitter("app-location-" + userId);
    }

    /**
     * 주차완료 시 주차된 위치 전달 (앱) SSE
     */
    @GetMapping(value = "/app/parking-complete/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appParkingComplete(@PathVariable Long userId) {
        log.info("앱 주차완료 위치 SSE 연결 요청 - UserId: {}", userId);
        return sseEmitterService.createEmitter("app-complete-" + userId);
    }

    /**
     * 주차완료 시 주차된 위치 전달 (앱) SSE - 전체 구독
     * GET /api/v1/sse/app/parking-complete
     */
    @GetMapping(value = "/app/parking-complete", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appParkingCompleteAll() {
        log.info("앱 주차완료 위치 SSE 연결 요청 - All");
        return sseEmitterService.createEmitter("app-complete-all");
    }

    /**
     * 결제 통합 - 실시간 요금 + 결제 완료 알림 (앱) SSE
     * GET /api/v1/sse/app/payment-flow/{userId}
     */
    @GetMapping(value = "/app/payment-flow/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appPaymentFlow(@PathVariable Long userId) {
        log.info("앱 결제 플로우 SSE 연결 요청 - UserId: {}", userId);
        // ⭐ 채널 키를 "app-payment-flow-"로 통일합니다.
        return sseEmitterService.createEmitter("app-payment-flow-" + userId);
    }

    /**
     * RFID 입/출차 로그 (앱) SSE
     * GET /api/v1/sse/app/exitlog/{userId}
     */
    @GetMapping(value = "/app/exitlog/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appExitLog(@PathVariable Long userId) {
        log.info("앱 RFID 로그 SSE 연결 요청 - UserId: {}", userId);
        return sseEmitterService.createEmitter("app-exitlog-" + userId);
    }

    /**
     * RFID 입/출차 로그 (앱) SSE - 전체 구독
     * GET /api/v1/sse/app/exitlog
     */
    @GetMapping(value = "/app/exitlog", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter appExitLogAll() {
        log.info("앱 RFID 로그 SSE 연결 요청 - All");
        return sseEmitterService.createEmitter("app-exitlog-all");
    }

    /**
     * SSE 연결 상태 확인 (모니터링용)
     * GET /api/v1/sse/stats
     */
    @GetMapping("/stats")
    public Map<String, Integer> getStats() {
        return sseEmitterService.getConnectionStats();
    }

    /**
     * SSE 전체 이벤트 스트림 (디버깅/모니터링용)
     * GET /api/v1/sse/all
     */
    @GetMapping(value = "/all", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter all() {
        log.info("SSE 전체 스트림 연결 요청");
        return sseEmitterService.createEmitter("sse-all");
    }

}
