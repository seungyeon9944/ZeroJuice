# ZeroJuice - 자율주행 주차 관제 시스템 PRD v2

## 문서 정보

| 항목 | 내용 |
|---|---|
| 프로젝트명 | ZeroJuice (제로주스) |
| 버전 | 2.0.0 |
| 작성일 | 2026-01-21 |
| 문서 유형 | Product Requirements Document |

---

## 1. 프로젝트 개요

### 1.1 프로젝트 소개

ZeroJuice는 자율주행 차량을 위한 스마트 주차 관제 시스템입니다. 웹 관제 시스템, 모바일 앱, 임베디드 시스템을 통합하여 자동 입출차, 최적 주차면 배정, RFID 자동 결제 기능을 제공합니다.

### 1.2 프로젝트 목표

- 자율주행 차량의 자동 주차 프로세스 구현
- 실시간 주차장 현황 모니터링 및 관제
- 사용자 편의성 극대화 (앱 기반 주차 관리)
- RFID 기반 자동 결제 시스템

### 1.3 MVP 범위

- 단일 주차장 운영 (다중 주차장은 MVP 이후)
- 1인 1차량 등록 체계 (회원가입 시 차량번호 등록)

---

## 2. 기술 스택

### 2.1 Backend

| 항목 | 기술 |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.5.9 |
| Database | MySQL 8.0+ |
| ORM | Spring Data JPA |
| Security | Spring Security + JWT |
| API 문서화 | SpringDoc OpenAPI (Swagger UI) |
| Build Tool | Gradle |

### 2.2 Frontend

| 항목 | 기술 |
|---|---|
| 웹 관제 시스템 | React |
| 모바일 앱 | React Native |

### 2.3 임베디드

| 항목 | 기술 |
|---|---|
| 플랫폼 | Jetson Orin Nano |
| 미들웨어 | ROS2, Rviz2 |
| 센서 | 2D LiDAR, 카메라 |
| 영상처리 (주차공간) | YOLOv11 nano |
| 영상처리 (번호판) | YOLOv11 nano + EasyOCR |

### 2.4 통신

| 프로토콜 | 용도 |
|---|---|
| REST API | 웹/앱 ↔ 서버 |
| MQTT | 서버 ↔ 차량 (임베디드) |
| SSE | 서버 → 웹 (실시간 대시보드) |
| FCM | 서버 → 앱 (푸시 알림) |

---

## 3. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        클라이언트 레이어                          │
├───────────────┬───────────────┬─────────────────────────────────┤
│   웹 관제      │   모바일 앱    │           차량 (임베디드)         │
│   (React)     │ (React Native) │    (ROS2 + Jetson Orin Nano)   │
└───────┬───────┴───────┬───────┴─────────────────┬───────────────┘
        │               │                         │
        │ REST/SSE      │ REST/FCM                │ MQTT
        │               │                         │
┌───────▼───────────────▼─────────────────────────▼───────────────┐
│                     Spring Boot Backend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Auth     │  │ Parking  │  │ Payment  │  │ MQTT Handler     │ │
│  │ Module   │  │ Module   │  │ Module   │  │                  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    JPA / MySQL                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 데이터베이스 설계

### 4.1 엔터티 목록

| No | 엔터티 | 한글명 | 설명 |
|:---:|---|---|---|
| 1 | user | 사용자 | 앱 사용자 (휴대폰번호 로그인) |
| 2 | client | 고객사 | 웹 관리자 (DBA 생성) |
| 3 | vehicle | 차량 | 차량 정보 (사용자와 1:1) |
| 4 | parking_slot | 주차면 | 주차 공간 (좌표 포함) |
| 5 | parking_record | 주차기록 | 입출차 기록 (핵심 트랜잭션) |
| 6 | payment | 결제 | 결제 정보 (RFID 자동결제) |
| 7 | setting | 설정 | 시스템 설정 (고객사별) |

### 4.2 ERD 관계도

```
┌──────────┐         ┌──────────┐         ┌──────────────┐         ┌──────────┐
│   user   │───1:1───│ vehicle  │───1:N───│parking_record│───1:1───│ payment  │
│  (사용자) │         │  (차량)   │         │  (주차기록)   │         │  (결제)   │
└──────────┘         └──────────┘         └──────┬───────┘         └──────────┘
                                                 │
┌──────────┐         ┌──────────────┐            │
│  client  │─────┬───│ parking_slot │────────────┘
│ (고객사)  │     │   │   (주차면)    │
└──────────┘     │   └──────────────┘
                 │
                 │   ┌──────────┐
                 └───│ setting  │
                     │  (설정)   │
                     └──────────┘
```

### 4.3 주요 테이블 정의

**※ 공통 사항:** 모든 RDB 테이블은 Audit 필드(`create_time`, `update_time`, `creator`, `updater`)를 포함합니다.

#### USERS (사용자)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 사용자 ID |
| mobile | VARCHAR(13) | NOT NULL | 휴대폰번호 |
| password | VARCHAR(100) | NOT NULL | 비밀번호 |
| fcm_token | CHAR(255) | NULL | FCM 푸시 토큰 |
| create_time | DATETIME | NOT NULL | 생성일시 |
| update_time | DATETIME | NULL | 수정일시 |
| creator | VARCHAR(10) | NOT NULL | 생성자 |
| updater | VARCHAR(10) | NULL | 수정자 |


#### CARS (차량)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 차량 ID |
| user_id | INT | FK → users.id | 소유자 |
| car_no | CHAR(8) | UNIQUE, NOT NULL | 차량 번호판 |
| rfid_no | CHAR(8) | UNIQUE, NULL | RFID 태그 ID |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 등록일시 |
| update_time | DATETIME | ON UPDATE | 수정일시 |
| creator | VARCHAR(10) | NULL | 생성자 |
| updater | VARCHAR(10) | NULL | 수정자 |

#### PARKING_SLOTS (주차면)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 주차면 ID |
| car_id | INT | FK → cars.id, NULL | 현재 주차된 차량 |
| slot_no | INT | NOT NULL | 주차면 번호 |
| pos_x | DOUBLE | NULL | X 좌표 |
| pos_y | DOUBLE | NULL | Y 좌표 |
| status | ENUM | DEFAULT 'EMPTY' | 상태 (EMPTY, PARKING) |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| update_time | DATETIME | ON UPDATE | 수정일시 |
| creator | VARCHAR(10) | NULL | 생성자 |
| updater | VARCHAR(10) | NULL | 수정자 |

#### PARKING_HISTORIES (주차기록)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 기록 ID |
| car_id | INT | FK → cars.id | 차량 |
| slot_id | INT | FK → parking_slots.id | 주차면 |
| slot_no | INT | NULL | 주차면 번호 (기록용) |
| in_time | DATETIME | NOT NULL | 입차 시간 |
| out_time | DATETIME | NULL | 출차 시간 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| update_time | DATETIME | ON UPDATE | 수정일시 |
| creator | VARCHAR(10) | NULL | 생성자 |
| updater | VARCHAR(10) | NULL | 수정자 |

#### PAYMENTS (결제)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 결제 ID |
| history_id | INT | FK → parking_histories.id | 주차기록 |
| amount | INT | NOT NULL | 결제 금액 |
| method | ENUM | DEFAULT 'RFID' | 결제수단 (RFID, KAKAO, CARD) |
| status | ENUM | DEFAULT 'PENDING' | 결제상태 (PENDING, OK, FAIL) |
| pay_time | DATETIME | NULL | 결제완료시간 |
| create_time | DATETIME | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| update_time | DATETIME | ON UPDATE | 수정일시 |
| creator | VARCHAR(10) | NULL | 생성자 |
| updater | VARCHAR(10) | NULL | 수정자 |

#### SETTINGS (시스템 관리)

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | INT | PK, AUTO_INCREMENT | 설정 ID |
| fee_base | INT | NOT NULL | 기본 요금 |
| time_base | INT | NOT NULL | 기본 시간 (분 단위) |
| fee_unit | INT | NOT NULL | 추가 요금 단위 |
| time_unit | INT | NOT NULL | 추가 시간 단위 (분 단위) |
| free_time | INT | NOT NULL | 회차 무료 시간 (분 단위) |
| cctv_url | VARCHAR(255) | NULL | CCTV 스트리밍 URL |

#### REDIS (실시간 데이터 캐싱)

| Key | 타입 | 설명 |
|---|---|---|
| car_id | STRING | 차량 식별자 |
| fcm_token | STRING | 알림 전송용 토큰 |
| x | FLOAT | 차량 실시간 X 좌표 |
| y | FLOAT | 차량 실시간 Y 좌표 |
---

## 5. 기능 요구사항

### 5.1 웹 관제 시스템 (9개 기능)

| ID | 기능명 | 설명 | 우선순위 |
|---|---|---|---|
| FUNC-001 | 인증-로그인 | 관리자 로그인 (ID/PW) | 상 |
| FUNC-002 | 인증-로그아웃 | 로그아웃 처리 | 상 |
| FUNC-003 | 대시보드-주차장현황 | 전체 주차면 현황 조회 | 상 |
| FUNC-004 | 대시보드-입출차기록 | 입출차 이력 조회/검색 | 상 |
| FUNC-005 | 대시보드-CCTV | CCTV 영상 스트리밍 | 중 |
| FUNC-006 | 입출차-번호판인식입차 | 입차 차량 번호판 인식 처리 | 상 |
| FUNC-007 | 입출차-번호판인식출차 | 출차 차량 번호판 인식 및 정산 | 상 |
| FUNC-008 | 주차면-주차면관리 | 주차면 추가/수정/삭제 | 중 |
| FUNC-009 | 설정-시스템설정 | 요금 정책 등 설정 관리 | 중 |

### 5.2 모바일 앱 (11개 기능)

| ID | 기능명 | 설명 | 우선순위 |
|---|---|---|---|
| FUNC-010 | 홈-메인화면 | 주차 상태별 UI (미주차/주차중/주차완료/출차중) | 상 |
| FUNC-011 | 홈-주차장선택 | 주차장 목록 및 선택 | 하 (MVP 이후) |
| FUNC-012 | 주차-입차프로세스 | 입차 요청 및 자동주차 시작 | 상 |
| FUNC-013 | 주차-주차현황 | 내 차량 위치 실시간 조회 | 상 |
| FUNC-014 | 주차-실시간현황 | 차량 이동 실시간 표시 | 상 |
| FUNC-015 | 출차-출차프로세스 | 출차 요청 및 자동결제 | 상 |
| FUNC-016 | 인증-로그인 | 휴대폰번호 + 비밀번호 로그인 | 상 |
| FUNC-017 | 인증-로그아웃 | 로그아웃 처리 | 상 |
| FUNC-018 | 결제-주차정산 | RFID 자동결제 | 상 |
| FUNC-019 | 알림-푸시알림 | FCM 푸시 알림 수신 | 중 |
| FUNC-020 | 인증-회원가입 | 휴대폰번호 + 차량번호 기반 회원가입 | 상 |

### 5.3 임베디드 (10개 기능)

| ID | 기능명 | 설명 | 우선순위 |
|---|---|---|---|
| FUNC-021 | 인식-번호판인식 | 입차 차량 번호판 OCR | 상 |
| FUNC-022 | 배정-자동배정 | 최적 주차면 자동 배정 | 상 |
| FUNC-023 | 주행-경로계획 | 자율주행 경로 생성 | 상 |
| FUNC-024 | 주행-자율주행 | 배정 주차면까지 자율주행 | 상 |
| FUNC-025 | 주행-주차완료 | 주차 완료 판단 및 서버 통보 | 상 |
| FUNC-026 | 출차-출차인식 | 출차 요청 차량 인식 | 상 |
| FUNC-027 | 출차-자율출차 | 출구까지 자율주행 | 상 |
| FUNC-028 | 통신-서버통신 | MQTT 기반 서버 통신 | 상 |
| FUNC-029 | 인식-주차면인식 | 주차면 상태 실시간 인식 | 상 |
| FUNC-030 | 상태-위치보고 | 차량 현재 위치 주기적 보고 | 상 |

---

## 6. API 명세 개요

> Base URL: `https://api.zerojuice.com/api/v1`

### 6.1 웹 API (관리자용)

#### 인증

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /auth/client/login | 관리자 로그인 | X |
| POST | /auth/client/logout | 관리자 로그아웃 | O |

#### 대시보드

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /dashboard/summary | 주차장 현황 요약 | O |
| GET | /dashboard/hourly-stats | 시간대별 혼잡도 | O |
| GET | /dashboard/day-of-week-average | 4주간 평균 혼잡도 | O |

#### 입출차 관리

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /parking/logs/recent | 최근 입출차 로그 | O |
| GET | /parking/logs | 입출차 로그 조회 | O |
| POST | /parking/entry | 입차 등록 (번호판 인식) | X (내부) |
| POST | /parking/exit | 출차 처리 (번호판 인식) | X (내부) |
| POST | /parking/assign | 주차면 배정 | O |

#### 주차면/설정

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /parking-slots | 주차면 전체 조회 | O |
| GET | /parking-slots/status | 주차면 상태 조회 | O |
| GET | /settings | 설정 조회 | O |
| PUT | /settings | 설정 수정 | O |

### 6.2 앱 API (사용자용)

#### 인증

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /auth/user/signup | 회원가입 | X |
| POST | /auth/user/send-verification | SMS 인증번호 발송 | X |
| POST | /auth/user/verify-code | SMS 인증번호 확인 | X |
| POST | /auth/user/login | 사용자 로그인 | X |
| POST | /auth/user/logout | 사용자 로그아웃 | O |
| POST | /auth/user/refresh | 토큰 갱신 | X |

#### 주차

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /user/parking-status | 현재 주차 상태 조회 | O |
| POST | /parking/request-entry | 입차 요청 | O |
| POST | /parking/request-exit | 출차 요청 | O |
| GET | /vehicle/location | 차량 실시간 위치 | O |

#### 결제

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /payment/{recordId} | 결제 정보 조회 | O |
| POST | /payment/process | 결제 처리 | O |

#### 사용자 정보

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| GET | /user/me | 내 정보 조회 | O |
| PUT | /user/me | 내 정보 수정 | O |
| GET | /user/parking-history | 주차 이력 조회 | O |

#### 알림

| Method | Endpoint | 설명 | 인증 |
|---|---|---|---|
| POST | /user/fcm-token | FCM 토큰 등록/갱신 | O |
| POST | /notification/geofence-entry | Geofence 진입 알림 | O |

### 6.3 실시간 통신

#### SSE (Server-Sent Events)

| Endpoint | 방향 | 설명 |
|---|---|---|
| GET /sse/dashboard | 서버 → 웹 | 대시보드 실시간 업데이트 |

#### MQTT 토픽

| Topic | 방향 | QoS | 설명 |
|---|---|---|---|
| vehicle/{vehicleId}/command | 서버 → 차량 | 1 | 주차/출차/이동/정지 명령 |
| vehicle/{vehicleId}/status | 차량 → 서버 | 0 | 위치/속도/배터리/상태 리포팅 |
| vehicle/{vehicleId}/ack | 차량 → 서버 | 1 | 명령 응답 (ACK) |

#### CCTV 스트리밍

| Endpoint | 설명 |
|---|---|
| GET /stream/cctv/{cameraId}/playlist.m3u8 | HLS 스트리밍 |

---

## 7. 요금 계산 규칙

```
기본 무료: 30분
10분당 요금: 500원
일 최대 요금: 15,000원

계산식: ceil((주차시간 - 무료시간) / 10) × 10분당요금
(최대 요금 초과 시 최대 요금 적용)

예시:
- 1시간 주차 → (60-30)/10 × 500 = 1,500원
- 5시간 주차 → (300-30)/10 × 500 = 13,500원
- 10시간 주차 → 15,000원 (최대 요금)
```

---

## 8. 주차면 배정 알고리즘

### 8.1 MVP 알고리즘: 최단 거리 + 구역 균등 배분

```
1차: 혼잡도 낮은 구역 선택
2차: 해당 구역 내 입구에서 가장 가까운 빈 자리 선택
```

### 8.2 향후 확장 (가중치 기반)

| 요소 | 가중치 | 설명 |
|---|---|---|
| 거리 | 40% | 입구까지 거리 |
| 경로 복잡도 | 25% | 회전/후진 횟수 |
| 구역 혼잡도 | 20% | 해당 구역 점유율 |
| 주변 여유 | 15% | 양옆 빈자리 |

---

## 9. 프로젝트 구조 (Backend)

```
zerojuice/
├── build.gradle
├── settings.gradle
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/zerojuice/
│   │   │       ├── ZerojuiceApplication.java
│   │   │       ├── domain/
│   │   │       │   ├── user/
│   │   │       │   │   ├── entity/
│   │   │       │   │   ├── repository/
│   │   │       │   │   ├── service/
│   │   │       │   │   ├── controller/
│   │   │       │   │   └── dto/
│   │   │       │   ├── client/
│   │   │       │   ├── vehicle/
│   │   │       │   ├── parking/
│   │   │       │   ├── payment/
│   │   │       │   └── setting/
│   │   │       ├── global/
│   │   │       │   ├── config/
│   │   │       │   ├── security/
│   │   │       │   ├── exception/
│   │   │       │   └── common/
│   │   │       └── infra/
│   │   │           ├── mqtt/
│   │   │           ├── sse/
│   │   │           └── fcm/
│   │   └── resources/
│   │       ├── application.yml
│   │       └── application-{profile}.yml
│   └── test/
└── docker-compose.yml
```

---

## 10. 주요 의존성

```groovy
dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-security'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // Database
    runtimeOnly 'com.mysql:mysql-connector-j'
    
    // JWT
    implementation 'io.jsonwebtoken:jjwt-api:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.12.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.12.5'
    
    // Swagger UI (OpenAPI 3.0)
    implementation 'org.springdoc:springdoc-openapi-starter-webmvc-ui:2.3.0'
    
    // MQTT
    implementation 'org.springframework.integration:spring-integration-mqtt'
    
    // FCM
    implementation 'com.google.firebase:firebase-admin:9.2.0'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    
    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
    testImplementation 'org.springframework.security:spring-security-test'
}
```

---

## 11. 환경 설정

### 11.1 application.yml

```yaml
spring:
  application:
    name: zerojuice
  
  datasource:
    url: jdbc:mysql://localhost:3306/zerojuice?useSSL=false&serverTimezone=Asia/Seoul
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
    driver-class-name: com.mysql.cj.jdbc.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    properties:
      hibernate:
        format_sql: true
        dialect: org.hibernate.dialect.MySQLDialect
    show-sql: true

# JWT 설정
jwt:
  secret: ${JWT_SECRET}
  access-token-validity: 3600000      # 1시간
  refresh-token-validity: 604800000   # 7일

# MQTT 설정
mqtt:
  broker-url: tcp://localhost:1883
  client-id: zerojuice-server
  username: ${MQTT_USERNAME}
  password: ${MQTT_PASSWORD}

# FCM 설정
firebase:
  credentials-path: classpath:firebase-service-account.json

# Swagger UI 설정
springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html
    operations-sorter: method
    tags-sorter: alpha
    doc-expansion: none
  default-consumes-media-type: application/json
  default-produces-media-type: application/json
```

### 11.2 CORS 설정 (WebConfig.java)

```java
package com.zerojuice.global.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:3000",      // React 웹
                    "http://localhost:19006",     // React Native (Expo)
                    "http://localhost:8081"       // React Native (Metro)
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
```

### 11.3 Spring Security 설정 (SecurityConfig.java)

```java
package com.zerojuice.global.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Swagger UI 접근 허용
                .requestMatchers(
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/api-docs/**",
                    "/v3/api-docs/**"
                ).permitAll()
                // 인증 API 접근 허용
                .requestMatchers(
                    "/api/v1/auth/**"
                ).permitAll()
                // 내부 시스템 API (CCTV/임베디드)
                .requestMatchers(
                    "/api/v1/parking/entry",
                    "/api/v1/parking/exit"
                ).permitAll()  // TODO: IP 제한 또는 API Key 인증 추가
                // 그 외 인증 필요
                .anyRequest().authenticated()
            );
        
        // JWT 필터 추가
        // http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
}
```

---

## 12. 필수 설정 파일

### 12.1 Firebase 인증서

FCM 푸시 알림을 사용하려면 Firebase Console에서 서비스 계정 키를 발급받아야 합니다.

**파일 위치:** `src/main/resources/firebase-service-account.json`

> ⚠️ **주의:** 이 파일은 `.gitignore`에 추가하여 Git에 커밋되지 않도록 합니다.

**.gitignore 추가:**
```
# Firebase
src/main/resources/firebase-service-account.json
```

### 12.2 환경변수 목록

| 변수명 | 설명 | 예시 |
|---|---|---|
| DB_USERNAME | MySQL 사용자명 | zerojuice_user |
| DB_PASSWORD | MySQL 비밀번호 | password123 |
| JWT_SECRET | JWT 서명 키 (256bit 이상 권장) | your-256-bit-secret-key... |
| MQTT_USERNAME | MQTT 브로커 사용자명 | mqtt_user |
| MQTT_PASSWORD | MQTT 브로커 비밀번호 | mqtt_password |

---

## 13. Swagger UI 접속 정보

| 항목 | URL |
|---|---|
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/api-docs |
| OpenAPI YAML | http://localhost:8080/api-docs.yaml |

---

## 14. 추가 필요 문서

| 문서 | 설명 | 상태 |
|---|---|---|
| ERD 설계서 | 데이터베이스 상세 설계 | ✅ 완료 |
| DDL | 테이블 생성 스크립트 | ✅ 완료 |
| API 명세서 | Swagger/OpenAPI 상세 명세 | ✅ 완료 (v2.1) |
| 시퀀스 다이어그램 | 주요 플로우 시각화 | 작성 필요 |
| 화면 설계서 | 웹/앱 UI 설계 | 작성 필요 |
| 테스트 계획서 | 테스트 케이스 정의 | 작성 필요 |
| 배포 가이드 | Docker/K8s 배포 설정 | 작성 필요 |

---

## 15. 결정 필요 사항

| No | 항목 | 현재 상태 | 비고 |
|---|---|---|---|
| 1 | RFID 위치 | 차량 부착 가정 | 확인 필요 |
| 2 | 결제 실패 시 출차 | 미정 | 정책 결정 필요 |
| 3 | 앱 결제 화면 사용 시점 | 미정 | RFID 외 결제 시? |
| 4 | 다중 차량 등록 | MVP에서 1인 1차량 | 향후 확장 검토 |

---

## 변경 이력

| 버전 | 일자 | 작성자 | 변경 내용 |
|---|---|---|---|
| 1.0.0 | 2026-01-21 | - | 초기 작성 |
| 1.1.0 | 2026-01-21 | - | API 명세 개요 업데이트 (실제 엔드포인트 반영, MQTT 토픽 상세화) |
| 2.0.0 | 2026-01-21 | - | **환경설정 보완**: Spring Boot 버전 수정(3.2.2), Swagger UI 의존성 및 설정 추가, CORS 설정 추가, Spring Security 설정 추가, 환경변수 목록 정리 |
