package com.zerojuice.domain.sse.listener;

import com.zerojuice.domain.sse.event.DailyRevenueEvent;
import com.zerojuice.domain.sse.event.ParkingHistoryEvent;
import com.zerojuice.domain.sse.event.ParkingSlotStatusEvent;
import com.zerojuice.domain.sse.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * SSE 이벤트 리스너
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SseEventListener {

    private final SseEmitterService sseEmitterService;

    @EventListener
    @Async
    public void handleParkingSlotStatusEvent(ParkingSlotStatusEvent event) {
        log.info("주차 슬롯 상태 이벤트 수신: emptyCount={}, parkingCount={}",
                event.getEmptyCount(), event.getParkingCount());
        sseEmitterService.sendToTopic("parking-slots", "parking-slot-update", event);
        sseEmitterService.sendToTopic("dashboard", "parking-slot-update", event);
    }

    @EventListener
    @Async
    public void handleParkingHistoryEvent(ParkingHistoryEvent event) {
        log.info("주차 기록 이벤트 수신: type={}, historyId={}",
                event.getEventType(), event.getHistory().getId());
        sseEmitterService.sendToTopic("parking-histories", "parking-history-update", event);
        sseEmitterService.sendToTopic("dashboard", "parking-history-update", event);
    }

    @EventListener
    @Async
    public void handleDailyRevenueEvent(DailyRevenueEvent event) {
        log.info("일간 수익 이벤트 수신: revenue={}, transactionCount={}",
                event.getTotalRevenue(), event.getTransactionCount());
        sseEmitterService.sendToTopic("daily-revenue", "revenue-update", event);
        sseEmitterService.sendToTopic("dashboard", "revenue-update", event);
    }

    @EventListener
    @Async
    public void handleRfidExitEvent(com.zerojuice.domain.sse.event.RfidExitEvent event) {
        log.info("RFID 출차 로그 수신: timestamp={}", event.getTimestamp());
        sseEmitterService.sendToTopic("exitlog", "rfid-exit", event);
        sseEmitterService.sendToTopic("dashboard", "rfid-exit", event);
    }

    @EventListener
    @Async
    public void handleRfidEnterEvent(com.zerojuice.domain.sse.event.RfidEnterEvent event) {
        log.info("RFID 입차 로그 수신: timestamp={}", event.getTimestamp());
        sseEmitterService.sendToTopic("exitlog", "rfid-enter", event);
        sseEmitterService.sendToTopic("dashboard", "rfid-enter", event);
    }
}
