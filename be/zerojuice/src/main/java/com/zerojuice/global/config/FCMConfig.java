package com.zerojuice.global.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

import javax.annotation.PostConstruct;
import java.util.List;

/**
 * Firebase Cloud Messaging 설정
 * firebase_service_account.json 파일이 resources 또는 특정 경로에 있어야 함
 */
@Slf4j
@Configuration
public class FCMConfig {

    // application.yml 등에 설정된 경로 (없으면 기본값 사용 가능)
    // @Value("${firebase.config.path:firebase_service_account.json}")
    private String firebaseConfigPath = "firebase_service_account.json"; // 임시 하드코딩

    @PostConstruct
    public void init() {
        try {
            // 이미 초기화되어 있는지 확인
            List<FirebaseApp> apps = FirebaseApp.getApps();
            if (apps != null && !apps.isEmpty()) {
                log.info("Firebase App already initialized");
                return;
            }

            // 파일 읽기 시도 (ClassPath 우선)
            ClassPathResource resource = new ClassPathResource(firebaseConfigPath);

            if (resource.exists()) {
                FirebaseOptions options = FirebaseOptions.builder()
                        .setCredentials(GoogleCredentials.fromStream(resource.getInputStream()))
                        .build();
                FirebaseApp.initializeApp(options);
                log.info("Firebase App initialized successfully");
            } else {
                log.warn("Firebase configuration file not found at classpath: {}. Push notifications will not work.",
                        firebaseConfigPath);
                // 개발 환경에서 앱이 죽지 않도록 예외를 던지지 않고 로그만 남김
            }

        } catch (Exception e) {
            log.error("Failed to initialize Firebase: {}", e.getMessage());
            // 앱 실행 자체를 막지 않기 위해 예외 무시 (선택사항)
        }
    }
}
