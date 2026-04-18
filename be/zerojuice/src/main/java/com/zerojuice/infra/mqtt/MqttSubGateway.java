package com.zerojuice.infra.mqtt;

import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.Message;
import org.springframework.stereotype.Component;
import com.zerojuice.domain.sse.event.ParkingFeeEvent;
import com.zerojuice.infra.sse.AppEventSseHub;
import lombok.RequiredArgsConstructor;
import com.zerojuice.domain.car.repository.CarRepository;
import com.zerojuice.domain.car.entity.Car;
import com.zerojuice.domain.payment.service.PaymentService;
import com.zerojuice.domain.payment.dto.PaymentResponseDto;
import com.zerojuice.domain.sse.service.SseEmitterService;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Slf4j
@Component
@lombok.RequiredArgsConstructor
public class MqttSubGateway {

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;
    private final AppEventSseHub sseHub;
    private final CarRepository carRepository;
    private final SseEmitterService sseEmitterService;

    @ServiceActivator(inputChannel = "mqttPoseInputChannel")
    public void handlePose(Message<String> message) {
        String payload = message.getPayload();
        String topic = String.valueOf(message.getHeaders().get("mqtt_receivedTopic"));

        log.info("[MQTT-POSE] topic={}, payload={}", topic, payload);

        try {
            String[] topicParts = topic.split("/");
            if (topicParts.length >= 3) {
                // topic: car/{carNo}/pose (carNo may contain escaped unicode)
                String carNo = extractCarNo(topicParts);

                PosePayload parsedPose = parsePosePayload(payload);

                ParkingFeeEvent poseEvent = ParkingFeeEvent.builder()
                        .eventType("REALTIME_LOCATION")
                        .data(ParkingFeeEvent.ParkingData.builder()
                                .type("LOCATION_UPDATE")
                                .slotNo(parsedPose.slotNo)
                                .carNo(parsedPose.carNo)
                                .x(parsedPose.x)
                                .y(parsedPose.y)
                                .yaw(parsedPose.yaw)
                                .timestamp(parsedPose.timestamp)
                                .status("DRIVING")
                                .build())
                        .build();

                // 앱 SSE 채널로 전송 (userId 기준)
                Car car = carRepository.findByCarNo(carNo)
                        .orElseGet(() -> {
                            if (!parsedPose.carNo.isBlank()) {
                                return carRepository.findByCarNo(parsedPose.carNo).orElse(null);
                            }
                            return null;
                        });
                if (car == null) {
                    throw new RuntimeException("미등록 차량: " + carNo);
                }
                if (car.getUser() != null) {
                    String topicKey = "app-location-" + car.getUser().getId();
                    sseEmitterService.sendToTopic(topicKey, poseEvent.getEventType(), poseEvent.getData());
                }
            }
        } catch (Exception e) {
            log.error(">>> [SSE 위치 전송 실패] 에러: {}", e.getMessage());
        }
    }

    @ServiceActivator(inputChannel = "mqttAckInputChannel")
    public void handleAck(Message<String> message) {
        String payload = message.getPayload();
        String topic = String.valueOf(message.getHeaders().get("mqtt_receivedTopic"));

        log.info("[MQTT-ACK] topic={}, payload={}", topic, payload);

        try {
            String[] topicParts = topic.split("/");
            if (topicParts.length >= 3) {
                String carNo = extractCarNo(topicParts);

                ParkingFeeEvent ackEvent = ParkingFeeEvent.builder()
                        .eventType("PARKING_COMPLETE")
                        .data(ParkingFeeEvent.ParkingData.builder()
                                .type("SUCCESS")
                                .build())
                        .build();

                // 앱 SSE 채널로 전송 (userId 기준)
                Car car = carRepository.findByCarNo(carNo)
                        .orElseThrow(() -> new RuntimeException("미등록 차량: " + carNo));
                if (car.getUser() != null) {
                    String topicKey = "app-complete-" + car.getUser().getId();
                    sseEmitterService.sendToTopic(topicKey, ackEvent.getEventType(), ackEvent.getData());
                }
                // 전체 구독 채널에도 전송
                sseEmitterService.sendToTopic("app-complete-all", ackEvent.getEventType(), ackEvent.getData());
                log.info(">>> [SSE 중계 성공] CarNo: {}, Event: PARKING_COMPLETE", carNo);
            }
        } catch (Exception e) {
            log.error(">>> [SSE 중계 실패] 토픽 파싱 중 에러 발생: {}", e.getMessage());
        }
    }

    private String extractCarNo(String[] topicParts) {
        // topicParts: ["car", "{carNo...}", "pose|ack"]
        if (topicParts.length <= 2) {
            throw new IllegalArgumentException("Invalid topic format");
        }
        String rawCarNo = String.join("/", Arrays.copyOfRange(topicParts, 1, topicParts.length - 1));
        return unescapeUnicode(rawCarNo);
    }

    private PosePayload parsePosePayload(String payload) {
        String slotNo = "";
        String carNo = "";
        Double x = null;
        Double y = null;
        Double yaw = null;
        String timestamp = "";
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(payload);
            if (node.hasNonNull("x")) {
                x = node.get("x").asDouble();
            }
            if (node.hasNonNull("y")) {
                y = node.get("y").asDouble();
            }
            if (node.hasNonNull("yaw")) {
                yaw = node.get("yaw").asDouble();
            }
            if (node.hasNonNull("timestamp")) {
                timestamp = node.get("timestamp").asText();
            }
            if (node.hasNonNull("slotNo")) {
                String slotValue = node.get("slotNo").asText();
                if (slotValue.startsWith("{") && slotValue.endsWith("}")) {
                    com.fasterxml.jackson.databind.JsonNode inner = objectMapper.readTree(slotValue);
                    if (inner.hasNonNull("slotNo")) {
                        slotNo = inner.get("slotNo").asText();
                    }
                    if (inner.hasNonNull("carNo")) {
                        carNo = inner.get("carNo").asText();
                    }
                    if (inner.hasNonNull("x")) {
                        x = inner.get("x").asDouble();
                    }
                    if (inner.hasNonNull("y")) {
                        y = inner.get("y").asDouble();
                    }
                    if (inner.hasNonNull("yaw")) {
                        yaw = inner.get("yaw").asDouble();
                    }
                    if (inner.hasNonNull("timestamp")) {
                        timestamp = inner.get("timestamp").asText();
                    }
                } else {
                    slotNo = slotValue;
                }
            }
            if (carNo.isBlank() && node.hasNonNull("carNo")) {
                String outerCarNo = node.get("carNo").asText();
                if (!outerCarNo.isBlank()) {
                    carNo = outerCarNo;
                }
            }
            if (!carNo.isBlank()) {
                carNo = unescapeUnicode(carNo);
            }
        } catch (Exception e) {
            log.debug("POSE payload JSON 파싱 실패: {}", e.getMessage());
        }
        return new PosePayload(slotNo, carNo, x, y, yaw, timestamp);
    }

    // Decode sequences like "\\uAC00" to actual Unicode characters (e.g., "가")
    private String unescapeUnicode(String input) {
        StringBuilder out = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            if (c == '\\' && i + 5 < input.length() && input.charAt(i + 1) == 'u') {
                String hex = input.substring(i + 2, i + 6);
                try {
                    int codePoint = Integer.parseInt(hex, 16);
                    out.append((char) codePoint);
                    i += 5;
                    continue;
                } catch (NumberFormatException ignore) {
                    // fall through and append as-is
                }
            }
            out.append(c);
        }
        return out.toString();
    }

    private static class PosePayload {
        private final String slotNo;
        private final String carNo;
        private final Double x;
        private final Double y;
        private final Double yaw;
        private final String timestamp;

        private PosePayload(String slotNo, String carNo, Double x, Double y, Double yaw, String timestamp) {
            this.slotNo = slotNo;
            this.carNo = carNo;
            this.x = x;
            this.y = y;
            this.yaw = yaw;
            this.timestamp = timestamp;
        }
    }

    /**
     * 최종 출차 확인 (RFID 태깅 시 호출)
     */
    @ServiceActivator(inputChannel = "mqttRfidInputChannel")
    public void handleRfidExit(Message<byte[]> message) {
        byte[] payloadBytes = message.getPayload();
        // 인코딩 대응 및 차량 번호 추출
        String carNo = extractCarNoFromRfidPayload(payloadBytes);
        log.info("[MQTT-RFID-EXIT] 수신된 차량 번호: {}", carNo);

        try {
            // 차량 번호로 유저 찾기
            Car car = carRepository.findByCarNo(carNo)
                    .orElseThrow(() -> new RuntimeException("미등록 차량: " + carNo));

            if (car.getUser() != null) {
                Integer userId = car.getUser().getId();
                // 여기서 결제 여부를 확인하거나, 최종 출차 로그를 남기는 로직을 실행합니다.
                log.info(">>> 유저 {}번 차량 최종 출차 확인 완료", userId);
            }
        } catch (Exception e) {
            log.error("출차 확인 중 오류: {}", e.getMessage());
        }
        // String topic =
        // String.valueOf(message.getHeaders().get("mqtt_receivedTopic"));

        // 디버깅: 바이트 HEX 로그 확인 (인코딩 문제 분석용)
        StringBuilder hexString = new StringBuilder();
        for (byte b : payloadBytes) {
            hexString.append(String.format("%02X ", b));
        }
        String hexData = hexString.toString().trim();
        log.info("[MQTT-DEBUG] Hex: {}", hexData);

        // 요청사항: Raw HEX 데이터를 그대로 프론트로 전송
        // payload: {"hexData": "7B 22 ...", "type": "exit"}
        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("hexData", hexData);
        responseData.put("carNo", carNo);
        responseData.put("type", "exit");

        log.info("[MQTT-RFID-EXIT] Forwarding HEX data: {}", responseData);

        try {
            // 이벤트 발행
            eventPublisher.publishEvent(
                    new com.zerojuice.domain.sse.event.RfidExitEvent(responseData, java.time.LocalDateTime.now()));
            // 앱 SSE 전송 (유저별 채널)
            Car car = carRepository.findByCarNo(carNo).orElse(null);
            if (car != null && car.getUser() != null) {
                String topicKey = "app-exitlog-" + car.getUser().getId();
                sseEmitterService.sendToTopic(topicKey, "rfid-exit", responseData);
            }
            // 앱 SSE 전송 (전체 구독 채널)
            sseEmitterService.sendToTopic("app-exitlog-all", "rfid-exit", responseData);
        } catch (Exception e) {
            log.error("RFID 이벤트 발행 실패", e);
        }
    }

    /**
     * 입차 확인 (RFID 태깅 시 호출)
     */
    @ServiceActivator(inputChannel = "mqttRfidEnterInputChannel")
    public void handleRfidEnter(Message<byte[]> message) {
        byte[] payloadBytes = message.getPayload();
        // 인코딩 대응 및 차량 번호 추출
        String carNo = extractCarNoFromRfidPayload(payloadBytes);
        log.info("[MQTT-RFID-ENTER] 수신된 차량 번호: {}", carNo);

        try {
            // 차량 번호로 유저 찾기
            Car car = carRepository.findByCarNo(carNo)
                    .orElseThrow(() -> new RuntimeException("미등록 차량: " + carNo));

            if (car.getUser() != null) {
                Integer userId = car.getUser().getId();
                // 입차 로그를 남기는 로직을 실행합니다.
                log.info(">>> 유저 {}번 차량 입차 확인 완료", userId);
            }
        } catch (Exception e) {
            log.error("입차 확인 중 오류: {}", e.getMessage());
        }

        // 디버깅: 바이트 HEX 로그 확인 (인코딩 문제 분석용)
        StringBuilder hexString = new StringBuilder();
        for (byte b : payloadBytes) {
            hexString.append(String.format("%02X ", b));
        }
        String hexData = hexString.toString().trim();
        log.info("[MQTT-DEBUG] Hex: {}", hexData);

        // 요청사항: Raw HEX 데이터를 그대로 프론트로 전송
        // payload: {"hexData": "7B 22 ...", "type": "enter"}
        java.util.Map<String, Object> responseData = new java.util.HashMap<>();
        responseData.put("hexData", hexData);
        responseData.put("carNo", carNo);
        responseData.put("type", "enter");

        log.info("[MQTT-RFID-ENTER] Forwarding HEX data: {}", responseData);

        try {
            // 이벤트 발행
            eventPublisher.publishEvent(
                    new com.zerojuice.domain.sse.event.RfidEnterEvent(responseData, java.time.LocalDateTime.now()));
            // 앱 SSE 전송 (유저별 채널)
            Car car = carRepository.findByCarNo(carNo).orElse(null);
            if (car != null && car.getUser() != null) {
                String topicKey = "app-exitlog-" + car.getUser().getId();
                sseEmitterService.sendToTopic(topicKey, "rfid-enter", responseData);
            }
            // 앱 SSE 전송 (전체 구독 채널)
            sseEmitterService.sendToTopic("app-exitlog-all", "rfid-enter", responseData);
        } catch (Exception e) {
            log.error("RFID 입차 이벤트 발행 실패", e);
        }
    }

    private String extractCarNoFromRfidPayload(byte[] payloadBytes) {
        String carNo = "";
        String utf8 = new String(payloadBytes, StandardCharsets.UTF_8).trim();
        try {
            com.fasterxml.jackson.databind.JsonNode node = objectMapper.readTree(utf8);
            if (node.hasNonNull("carNumber")) {
                carNo = node.get("carNumber").asText();
            } else if (node.hasNonNull("carNo")) {
                carNo = node.get("carNo").asText();
            }
        } catch (Exception ignore) {
            // fall through to legacy decode
        }
        if (carNo == null || carNo.isBlank()) {
            carNo = new String(payloadBytes, Charset.forName("CP949")).trim();
        }
        return carNo;
    }
}
