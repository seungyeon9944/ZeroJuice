package com.zerojuice.infra.sse;

import com.zerojuice.domain.sse.event.ParkingFeeEvent;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AppEventSseHub {
    // ⭐ [수정] 모든 타입을 키로 쓸 수 있도록 String으로 관리합니다.
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();
    // ⭐ [수정] Object로 타입을 넓혀서 Long과 String 모두 받을 수 있게 합니다.
    public SseEmitter subscribe(Object targetId) {
        String key = String.valueOf(targetId); // 숫자가 들어오든 차량번호가 들어오든 문자열로 변환
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        this.emitters.put(key, emitter);

        emitter.onCompletion(() -> this.emitters.remove(key));
        emitter.onTimeout(() -> this.emitters.remove(key));

        return emitter;
    }

    // ⭐ [수정] Object로 타입을 넓혀서 기존 서비스들의 수정을 최소화합니다.
    public void sendMessage(Object targetId, ParkingFeeEvent event) {
        String key = String.valueOf(targetId);
        SseEmitter emitter = emitters.get(key);

        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.getEventType())
                        .data(event.getData()));
            } catch (IOException e) {
                emitters.remove(key);
            }
        }
    }
}
