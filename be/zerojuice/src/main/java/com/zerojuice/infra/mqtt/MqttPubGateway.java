package com.zerojuice.infra.mqtt;

import org.springframework.integration.annotation.MessagingGateway;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;

@MessagingGateway(defaultRequestChannel = "mqttOutboundChannel")
public interface MqttPubGateway {

    // 기존 서비스 코드 호환용 (topic만 받는 버전)
    void sendToMqtt(@Payload String payload,
                    @Header(MqttHeaders.TOPIC) String topic);

    // QoS까지 지정하고 싶으면 이거 사용
    void sendToMqtt(@Payload String payload,
                    @Header(MqttHeaders.TOPIC) String topic,
                    @Header(MqttHeaders.QOS) int qos);

    // (원하면 명세용 이름도 유지 가능)
    default void publishCommand(String payload, String topic, int qos) {
        sendToMqtt(payload, topic, qos);
    }
}
