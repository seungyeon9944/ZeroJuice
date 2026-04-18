package com.zerojuice.domain.sse.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * SSE Emitter 관리 서비스
 */
@Service
@Slf4j
public class SseEmitterService {

    // 토픽별로 Emitter 관리
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    private static final Long TIMEOUT = 60 * 60 * 1000L; // 1시간

    /**
     * 새 SSE 연결 생성
     */
    public SseEmitter createEmitter(String topic) {
        SseEmitter emitter = new SseEmitter(TIMEOUT);

        emitters.computeIfAbsent(topic, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(topic, emitter));
        emitter.onTimeout(() -> removeEmitter(topic, emitter));
        emitter.onError(e -> removeEmitter(topic, emitter));

        // 연결 확인용 초기 메시지
        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .data("SSE Connected to " + topic));
        } catch (IOException e) {
            log.error("SSE 초기 메시지 전송 실패", e);
        }

        log.info("새 SSE 연결: topic={}, 현재 연결 수={}", topic, emitters.get(topic).size());

        return emitter;
    }

    /**
     * 특정 토픽의 모든 클라이언트에 이벤트 전송
     */
    public void sendToTopic(String topic, String eventName, Object data) {
        List<SseEmitter> topicEmitters = emitters.get(topic);
        if (topicEmitters == null || topicEmitters.isEmpty()) {
            log.info("No clients connected to topic '{}'. (Subscribers: 0)", topic);
            // fall through to global topic if any
        }

        List<SseEmitter> deadEmitters = new ArrayList<>();

        if (topicEmitters != null) {
            for (SseEmitter emitter : topicEmitters) {
                try {
                    emitter.send(SseEmitter.event()
                            .name(eventName)
                            .data(data));
                    log.info("SSE Sent Success: topic={}, event={}, subscriberCount={}", topic, eventName,
                            topicEmitters.size());
                } catch (IOException e) {
                    log.warn("SSE 전송 실패, Emitter 제거 예정", e);
                    deadEmitters.add(emitter);
                }
            }
        }

        // 실패한 Emitter 제거
        deadEmitters.forEach(emitter -> removeEmitter(topic, emitter));

        if (!deadEmitters.isEmpty()) {
            log.info("{}개의 비활성 Emitter 제거됨 (topic={})", deadEmitters.size(), topic);
        }

        // 글로벌 구독 채널로 복제 전송 (디버깅/모니터링용)
        if (!"sse-all".equals(topic)) {
            sendToGlobal(topic, eventName, data);
        }
    }

    private void removeEmitter(String topic, SseEmitter emitter) {
        List<SseEmitter> topicEmitters = emitters.get(topic);
        if (topicEmitters != null) {
            topicEmitters.remove(emitter);
            log.info("SSE 연결 종료: topic={}, 남은 연결 수={}", topic, topicEmitters.size());
        }
    }

    /**
     * 현재 연결 상태 조회 (모니터링용)
     */
    public Map<String, Integer> getConnectionStats() {
        Map<String, Integer> stats = new ConcurrentHashMap<>();
        emitters.forEach((topic, emitterList) -> stats.put(topic, emitterList.size()));
        return stats;
    }

    private void sendToGlobal(String topic, String eventName, Object data) {
        List<SseEmitter> globalEmitters = emitters.get("sse-all");
        if (globalEmitters == null || globalEmitters.isEmpty()) {
            return;
        }
        List<SseEmitter> deadEmitters = new ArrayList<>();
        java.util.Map<String, Object> envelope = new java.util.HashMap<>();
        envelope.put("topic", topic);
        envelope.put("event", eventName);
        envelope.put("data", data);

        for (SseEmitter emitter : globalEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("sse-all")
                        .data(envelope));
            } catch (IOException e) {
                deadEmitters.add(emitter);
            }
        }

        deadEmitters.forEach(emitter -> removeEmitter("sse-all", emitter));
    }
}
