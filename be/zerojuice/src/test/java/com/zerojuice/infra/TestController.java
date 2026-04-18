package com.zerojuice.infra;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TestController {

    private final RedisService redisService; // 위에서 만든 서비스 주입

    @GetMapping("/test-redis")
    public void test() {
        // 1. String
        redisService.saveValue("test:java", "Hello Spring", 60L);
        String val = redisService.getValue("test:java");

        // 2. JSON (Map으로 저장 예시)
        Map<String, Object> jsonMap = new HashMap<>();
        jsonMap.put("name", "JavaBackend");
        jsonMap.put("version", 17);
        redisService.saveJson("test:json", jsonMap, null);
        
        // JSON 조회 시 타입을 명시해야 함 (Map.class)
        Map result = redisService.getJson("test:json", Map.class);

        // 3. Hash
        Map<String, String> carInfo = new HashMap<>();
        carInfo.put("owner", "김자바");
        carInfo.put("no", "1234");
        redisService.saveHash("car:java", carInfo);

        // 4. Sorted Set
        Map<String, Double> ranks = new HashMap<>();
        ranks.put("UserA", 100.0);
        ranks.put("UserB", 50.0);
        redisService.saveSortedSet("ranking", ranks);
        
        // 내림차순 조회
        var topRankers = redisService.getSortedSet("ranking", true);
    }
}