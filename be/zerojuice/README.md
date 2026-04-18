# ZeroJuice Backend

자율주행 주차 관제 시스템 백엔드 서버

## 기술 스택

| 항목 | 기술 |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 3.5.9 |
| Database | MySQL 8.0+ |
| ORM | Spring Data JPA |
| Security | Spring Security + JWT |
| API Docs | SpringDoc OpenAPI (Swagger) |
| Build | Gradle |

## 실행 방법

### 1. 환경변수 설정

```bash
export DB_USERNAME=your_username
export DB_PASSWORD=your_password
export JWT_SECRET=your-256-bit-secret-key
export MQTT_USERNAME=mqtt_user
export MQTT_PASSWORD=mqtt_password
```

### 2. 로컬 실행

```bash
./gradlew bootRun --args='--spring.profiles.active=local'
```

### 3. 빌드

```bash
./gradlew build
```

## API 문서

서버 실행 후 접속:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/api-docs

## 프로젝트 구조

src/main/java/com/zerojuice/
├── domain/           # 도메인별 패키지
│   ├── user/         # 앱 사용자
│   ├── client/       # 관리자(고객사)
│   ├── car/          # 차량
│   ├── parking/      # 주차
│   ├── payment/      # 결제
│   └── setting/      # 설정
├── global/           # 공통 모듈
│   ├── config/       # 설정
│   ├── security/     # 보안/JWT
│   ├── exception/    # 예외 처리
│   └── common/       # 공통 유틸
└── infra/            # 외부 인프라
    ├── mqtt/         # MQTT 통신
    ├── sse/          # SSE 실시간
    └── fcm/          # FCM 푸시
```

## 관련 문서

- PRD: `zerojuice_PRD_v2.md`
- API 명세서: `A201_제로주스_API명세서_v2.md`
