package com.zerojuice.domain.notification.service;

import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import com.zerojuice.domain.user.entity.User;
import com.zerojuice.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * FCM 알림 발송 서비스
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FCMService {

    private final UserRepository userRepository;

    /**
     * 특정 사용자에게 알림 발송
     */
    /**
     * 특정 사용자에게 알림 발송 (데이터 포함)
     */
    @Transactional(readOnly = true)
    public void sendNotificationToUser(Integer userId, String title, String body, java.util.Map<String, String> data) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        String token = user.getFcmToken();
        if (token == null || token.isBlank()) {
            log.warn("User {} has no FCM token. Notification skipped.", userId);
            return;
        }

        sendToToken(token, title, body, data);
    }

    /**
     * 특정 사용자에게 알림 발송 (기본)
     */
    @Transactional(readOnly = true)
    public void sendNotificationToUser(Integer userId, String title, String body) {
        sendNotificationToUser(userId, title, body, java.util.Collections.emptyMap());
    }

    /**
     * 토큰 기반 알림 발송
     */
    public void sendToToken(String token, String title, String body, java.util.Map<String, String> data) {
        try {
            Message.Builder messageBuilder = Message.builder()
                    .setToken(token)
                    .setNotification(Notification.builder()
                            .setTitle(title)
                            .setBody(body)
                            .build())
                    .setAndroidConfig(com.google.firebase.messaging.AndroidConfig.builder()
                            .setPriority(com.google.firebase.messaging.AndroidConfig.Priority.HIGH)
                            .setNotification(com.google.firebase.messaging.AndroidNotification.builder()
                                    .setChannelId("default")
                                    .setSound("default")
                                    .build())
                            .build());

            if (data != null && !data.isEmpty()) {
                messageBuilder.putAllData(data);
            }

            // 기본 click_action 추가
            messageBuilder.putData("click_action", "FLUTTER_NOTIFICATION_CLICK");

            log.info("Attempting to send FCM message. Token: {}..., Title: {}",
                    token.substring(0, Math.min(10, token.length())), title);

            String response = FirebaseMessaging.getInstance().send(messageBuilder.build());
            log.info("Successfully sent message via FCM. Response: {}", response);
        } catch (com.google.firebase.messaging.FirebaseMessagingException fme) {
            log.error("FirebaseMessagingException: Code={}, Message={}", fme.getMessagingErrorCode(), fme.getMessage());
        } catch (Exception e) {
            log.error("Failed to send FCM message (Unknown Error): ", e);
        }
    }
}
