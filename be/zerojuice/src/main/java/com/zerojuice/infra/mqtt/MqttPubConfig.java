package com.zerojuice.infra.mqtt;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.outbound.MqttPahoMessageHandler;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageHandler;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class MqttPubConfig {

    @Value("${mqtt.broker-url}")
    private String BROKER_URL;

    @Value("${mqtt.pub.client-id}")
    private String PUB_CLIENT_ID;

    // 공통 옵션 설정
    @Bean(name = "mqttPubClientFactory")
    public MqttPahoClientFactory mqttPubClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[]{BROKER_URL});
        options.setCleanSession(true);
        factory.setConnectionOptions(options);
        return factory;
    }


    // 나가는 메시지를 담을 채널
    @Bean
    public MessageChannel mqttOutboundChannel() {
        return new DirectChannel();
    }

    // 메시지 발송 핸들러 (실제로 브로커에 쏘는 녀석)
    @Bean
    @ServiceActivator(inputChannel = "mqttOutboundChannel")
    public MessageHandler mqttOutboundMessageHandler(
            @org.springframework.beans.factory.annotation.Qualifier("mqttPubClientFactory")
            MqttPahoClientFactory mqttPubClientFactory
    ) {
        // 송신용 Client ID는 수신용과 다르게 설정했습니다.
        MqttPahoMessageHandler handler =
                new MqttPahoMessageHandler(PUB_CLIENT_ID, mqttPubClientFactory);
        
        handler.setAsync(true); // 비동기 전송
        handler.setDefaultTopic("car/0/command"); // 기본 토픽 (Gateway에서 덮어씀)
        
        return handler;
    }
}