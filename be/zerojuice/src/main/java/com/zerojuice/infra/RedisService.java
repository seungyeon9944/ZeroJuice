package com.zerojuice.infra;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper; // JSON 변환용 (Jackson)

    // 1. Set Key, Value (String)
    public void saveValue(String key, String value, Long expireSeconds) {
        System.out.println("Save " + key + " : " + value);
        if (expireSeconds != null) {
            redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(expireSeconds));
        } else {
            redisTemplate.opsForValue().set(key, value);
        }
    }

    // 2. Get Value (String)
    public String getValue(String key) {
        System.out.println("Get " + key + "'s Data");
        return redisTemplate.opsForValue().get(key);
    }

    // 3. Set Key, JSON Value
    public void saveJson(String key, Object value, Long expireSeconds) {
        System.out.println("Save " + key + "'s json style");
        try {
            // Object -> JSON String 변환
            String jsonStr = objectMapper.writeValueAsString(value);
            
            if (expireSeconds != null) {
                redisTemplate.opsForValue().set(key, jsonStr, Duration.ofSeconds(expireSeconds));
            } else {
                redisTemplate.opsForValue().set(key, jsonStr);
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }

    // 4. Get JSON Value
    // 자바는 타입을 명시해야 해서 반환 타입을 제네릭(T)이나 Map으로 받아야 합니다.
    // 여기서는 편의상 Map으로 받습니다.
    public <T> T getJson(String key, Class<T> valueType) {
        System.out.println("Get " + key + "'s json style value");
        String jsonStr = redisTemplate.opsForValue().get(key);
        
        if (jsonStr != null) {
            try {
                return objectMapper.readValue(jsonStr, valueType);
            } catch (JsonProcessingException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    // 5. Set Hash Value
    public void saveHash(String key, Map<String, String> value) {
        System.out.println("Save " + key + "'s hash style");
        redisTemplate.opsForHash().putAll(key, value);
    }

    // 6. Get Hash Value (전체)
    public Map<Object, Object> getHash(String key) {
        System.out.println("Get " + key + "'s hash style");
        return redisTemplate.opsForHash().entries(key);
    }

    // [추가] Get Hash Field (특정 필드)
    public Object getHashField(String key, String field) {
        System.out.println("Get " + field + " from " + key);
        return redisTemplate.opsForHash().get(key, field);
    }

    // 7. Set Set Value
    public void saveSet(String key, List<String> value) {
        System.out.println("Save " + key + "'s set style");
        // List를 배열로 변환하여 저장
        String[] values = value.toArray(new String[0]);
        redisTemplate.opsForSet().add(key, values);
    }

    // 8. Get Set Value
    public Set<String> getSet(String key) {
        System.out.println("Get " + key + "'s set style");
        return redisTemplate.opsForSet().members(key);
    }

    // 9. Set Sorted Set Value
    // 자바에서는 Map<String, Double> 형태로 점수를 받습니다.
    public void saveSortedSet(String key, Map<String, Double> value) {
        System.out.println("Save " + key + "'s sorted_set style");
        // 하나씩 루프 돌며 추가
        for (Map.Entry<String, Double> entry : value.entrySet()) {
            redisTemplate.opsForZSet().add(key, entry.getKey(), entry.getValue());
        }
    }

    // 10. Get Sorted Set Value
    public Set<ZSetOperations.TypedTuple<String>> getSortedSet(String key, boolean desc) {
        System.out.println("Get " + key + "'s sorted_set style");
        if (desc) {
            // 점수 높은 순 (내림차순)
            return redisTemplate.opsForZSet().reverseRangeWithScores(key, 0, -1);
        } else {
            // 점수 낮은 순 (오름차순)
            return redisTemplate.opsForZSet().rangeWithScores(key, 0, -1);
        }
    }

    // 11. Delete Key
    public void delete(String key) {
        System.out.println("Delete " + key);
        redisTemplate.delete(key);
    }

    // 12. Flush All (주의!)
    public void flushAll() {
        System.out.println("Delete All redis Datas");
        redisTemplate.getConnectionFactory().getConnection().flushDb();
    }

    // 13. 블랙리스트 등록 (밀리초 단위 만료 시간 설정)
    public void saveBlackList(String key, String value, Long expireMilliSeconds) {
        System.out.println("Blacklist registered - " + key + " for " + expireMilliSeconds + "ms");
        if (expireMilliSeconds != null && expireMilliSeconds > 0) {
            redisTemplate.opsForValue().set(key, value, Duration.ofMillis(expireMilliSeconds));
        }
    }

    // 14. 키 존재 여부 확인 (블랙리스트 체크용)
    public boolean hasKey(String key) {
        Boolean hasKey = redisTemplate.hasKey(key);
        return hasKey != null && hasKey;
    }

    // 15. 만료 시간 조회 (남은 시간 확인용)
    public Long getExpire(String key) {
        return redisTemplate.getExpire(key, TimeUnit.MILLISECONDS);
    }
}