/**
 * 로컬 MQTT PUB 동작 확인용 Smoke Test
 * local profile에서만 실행됨
 */
package com.zerojuice.infra.mqtt;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Profile("local")
@Component
@RequiredArgsConstructor
public class MqttCommandSmokeTest implements CommandLineRunner {

    private final MqttPubGateway mqttPubGateway;

    @Override
    public void run(String... args) {
        String topic = "car/1/command";
        String payload = """
            {
              "commandId": "cmd-20260128-000123",
              "type": "PARK",
              "slotNo": "A1",
              "timestamp": "2026-01-28T16:40:00"
            }
            """;

        mqttPubGateway.sendToMqtt(payload, topic, 1);
        System.out.println("[MQTT-PUB-TEST] sent: " + topic);
    }
}
