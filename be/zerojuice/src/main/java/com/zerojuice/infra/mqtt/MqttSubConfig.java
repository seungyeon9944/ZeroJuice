package com.zerojuice.infra.mqtt;

import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.integration.channel.DirectChannel;
import org.springframework.integration.core.MessageProducer;
import org.springframework.integration.mqtt.core.DefaultMqttPahoClientFactory;
import org.springframework.integration.mqtt.core.MqttPahoClientFactory;
import org.springframework.integration.mqtt.inbound.MqttPahoMessageDrivenChannelAdapter;
import org.springframework.integration.mqtt.support.DefaultPahoMessageConverter;
import org.springframework.messaging.MessageChannel;

@Configuration
public class MqttSubConfig {

    @Value("${mqtt.broker-url}")
    private String brokerUrl;

    @Value("${mqtt.sub.client-id}")
    private String subClientId;

    @Value("${mqtt.sub.topics.pose}")
    private String poseTopic;

    @Value("${mqtt.sub.topics.ack}")
    private String ackTopic;

    @Value("${mqtt.sub.qos.pose}")
    private int poseQos;

    @Value("${mqtt.sub.qos.ack}")
    private int ackQos;

    @Value("${mqtt.sub.topics.rfid}")
    private String rfidTopic;

    @Value("${mqtt.sub.qos.rfid}")
    private int rfidQos;

    @Value("${mqtt.sub.topics.rfid-enter}")
    private String rfidEnterTopic;

    @Value("${mqtt.sub.qos.rfid-enter}")
    private int rfidEnterQos;

    @Bean
    public MqttPahoClientFactory mqttSubClientFactory() {
        DefaultMqttPahoClientFactory factory = new DefaultMqttPahoClientFactory();
        MqttConnectOptions options = new MqttConnectOptions();
        options.setServerURIs(new String[] { brokerUrl });
        options.setCleanSession(true);
        factory.setConnectionOptions(options);
        return factory;
    }

    @Bean
    public MessageChannel mqttPoseInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel mqttAckInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel mqttRfidInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageChannel mqttRfidEnterInputChannel() {
        return new DirectChannel();
    }

    @Bean
    public MessageProducer mqttPoseInbound(
            MqttPahoClientFactory mqttSubClientFactory,
            MessageChannel mqttPoseInputChannel) {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(
                subClientId + "-pose",
                mqttSubClientFactory,
                poseTopic);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(poseQos);
        adapter.setOutputChannel(mqttPoseInputChannel);
        return adapter;
    }

    @Bean
    public MessageProducer mqttAckInbound(
            MqttPahoClientFactory mqttSubClientFactory,
            MessageChannel mqttAckInputChannel) {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(
                subClientId + "-ack",
                mqttSubClientFactory,
                ackTopic);
        adapter.setConverter(new DefaultPahoMessageConverter());
        adapter.setQos(ackQos);
        adapter.setOutputChannel(mqttAckInputChannel);
        return adapter;
    }

    @Bean
    public MessageProducer mqttRfidInbound(
            MqttPahoClientFactory mqttSubClientFactory,
            MessageChannel mqttRfidInputChannel) {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(
                subClientId + "-rfid",
                mqttSubClientFactory,
                rfidTopic);
        DefaultPahoMessageConverter converter = new DefaultPahoMessageConverter();
        converter.setPayloadAsBytes(true); // 인코딩 문제 방지를 위해 바이트로 수신
        adapter.setConverter(converter);
        adapter.setQos(rfidQos);
        adapter.setOutputChannel(mqttRfidInputChannel);
        return adapter;
    }

    @Bean
    public MessageProducer mqttRfidEnterInbound(
            MqttPahoClientFactory mqttSubClientFactory,
            MessageChannel mqttRfidEnterInputChannel) {
        MqttPahoMessageDrivenChannelAdapter adapter = new MqttPahoMessageDrivenChannelAdapter(
                subClientId + "-rfid-enter",
                mqttSubClientFactory,
                rfidEnterTopic);
        DefaultPahoMessageConverter converter = new DefaultPahoMessageConverter();
        converter.setPayloadAsBytes(true); // 인코딩 문제 방지를 위해 바이트로 수신
        adapter.setConverter(converter);
        adapter.setQos(rfidEnterQos);
        adapter.setOutputChannel(mqttRfidEnterInputChannel);
        return adapter;
    }
}
