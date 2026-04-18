# ZeroJuice Backend Implementation TODO List

> **원칙**: 1 커밋 = 1 기능
> **기준**: zerojuice_PRD_v2.md
> **작성일**: 2026-01-22

---

## 📋 커밋 체크리스트

### Phase 0: 프로젝트 초기화

#### Commit #001: 프로젝트 생성 및 기본 구조 ✅
- [x] Spring Initializr로 프로젝트 생성 (Spring Boot 3.5.9, Java 21, Gradle)
- [x] 기본 의존성 추가 (Web, JPA, Security, Validation, MySQL, Lombok)
- [x] `.gitignore` 설정
- [x] `README.md` 작성

```bash
# 커밋 메시지
git commit -m "chore: 프로젝트 초기화 및 기본 의존성 설정"
```

---

#### Commit #002: 패키지 구조 생성 ✅
- [x] `com.zerojuice.domain.user` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.domain.client` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.domain.vehicle` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.domain.parking` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.domain.payment` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.domain.setting` (entity, repository, service, controller, dto)
- [x] `com.zerojuice.global.config`
- [x] `com.zerojuice.global.security`
- [x] `com.zerojuice.global.exception`
- [x] `com.zerojuice.global.common`
- [x] `com.zerojuice.infra.mqtt`
- [x] `com.zerojuice.infra.sse`
- [x] `com.zerojuice.infra.fcm`

```bash
# 커밋 메시지
git commit -m "chore: 도메인별 패키지 구조 생성"
```

---

### Phase 1: 환경 설정

#### Commit #003: application.yml 설정 ✅
- [x] `application.yml` 기본 설정
- [x] `application-local.yml` 로컬 개발 환경 설정
- [x] `application-prod.yml` 운영 환경 설정 (템플릿)
- [x] 환경변수 플레이스홀더 설정 (DB, JWT, MQTT)

```bash
# 커밋 메시지
git commit -m "config: application.yml 프로파일별 설정 추가"
```

---

#### Commit #004: Swagger UI 설정 ✅
- [x] `springdoc-openapi-starter-webmvc-ui:2.3.0` 의존성 추가
- [x] `springdoc` 설정 (application.yml)
- [x] `SwaggerConfig.java` 작성 (API 그룹, 설명 설정)
- [ ] Swagger 접속 테스트 (`/swagger-ui.html`)

```bash
# 커밋 메시지
git commit -m "config: Swagger UI 설정 및 OpenAPI 문서화 구성"
```

---

#### Commit #005: CORS 설정 ✅
- [x] `WebConfig.java` 작성
- [x] 허용 Origin 설정 (localhost:3000, 19006, 8081)
- [x] 허용 Method 설정 (GET, POST, PUT, DELETE, OPTIONS)

```bash
# 커밋 메시지
git commit -m "config: CORS 설정 추가"
```

---

#### Commit #006: Spring Security 기본 설정 ✅
- [x] `SecurityConfig.java` 작성
- [x] CSRF 비활성화
- [x] Stateless 세션 설정
- [x] Swagger 경로 permitAll 설정
- [x] 인증 API 경로 permitAll 설정

```bash
# 커밋 메시지
git commit -m "config: Spring Security 기본 설정"
```

---

#### Commit #007: 공통 응답 형식 정의 ✅
- [x] `ApiResponse<T>` 클래스 작성 (success, data)
- [x] `ErrorResponse` 클래스 작성 (success, error.message, error.errorCode)
- [x] `ErrorCode` Enum 작성 (BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, INTERNAL_ERROR)

```bash
# 커밋 메시지
git commit -m "feat: 공통 API 응답 형식 정의"
```

---

#### Commit #008: 전역 예외 처리 ✅
- [x] `GlobalExceptionHandler.java` 작성 (@RestControllerAdvice)
- [x] `CustomException.java` 작성
- [x] 공통 예외 처리 (MethodArgumentNotValidException, HttpMessageNotReadableException 등)

```bash
# 커밋 메시지
git commit -m "feat: 전역 예외 처리 핸들러 구현"
```

---

### Phase 2: 데이터베이스 엔터티

#### Commit #009: User 엔터티 ✅
- [x] `User.java` 엔터티 작성
- [x] 컬럼: id, email, password, phone, fcm_token + Audit 필드
- [x] JPA 어노테이션 설정 (@Entity, @Table, @Column)
- [x] BaseTimeEntity 상속 (create_time, update_time 자동 관리)

```bash
# 커밋 메시지
git commit -m "feat: User 엔터티 정의"
```

---

#### Commit #010: Client 엔터티
- [ ] `Client.java` 엔터티 작성
- [ ] 컬럼: id, clientId, password, clientName, createdAt

```bash
# 커밋 메시지
git commit -m "feat: Client 엔터티 정의"
```

---

#### Commit #011: Car 엔터티 ✅
- [x] `Car.java` 엔터티 작성 (PRD v2 기준 CARS 테이블)
- [x] 컬럼: id, user_id, car_no, rfid_no + Audit 필드
- [x] User와 1:1 관계 설정 (@OneToOne)

```bash
# 커밋 메시지
git commit -m "feat: Car 엔터티 정의"
```

---

#### Commit #012: ParkingSlot 엔터티 ✅
- [x] `ParkingSlot.java` 엔터티 작성
- [x] 컬럼: id, car_id, slot_no, pos_x, pos_y, status + Audit 필드
- [x] `SlotStatus` Enum (EMPTY, PARKING)

```bash
# 커밋 메시지
git commit -m "feat: ParkingSlot 엔터티 정의"
```

---

#### Commit #013: ParkingHistory 엔터티 ✅
- [x] `ParkingHistory.java` 엔터티 작성
- [x] 컬럼: id, car_id, slot_id, slot_no, in_time, out_time + Audit 필드
- [x] Car와 N:1 관계 설정
- [x] ParkingSlot과 N:1 관계 설정

```bash
# 커밋 메시지
git commit -m "feat: ParkingHistory 엔터티 정의"
```

---

#### Commit #014: Payment 엔터티 ✅
- [x] `Payment.java` 엔터티 작성
- [x] 컬럼: id, history_id, amount, method, status, pay_time + Audit 필드
- [x] ParkingHistory와 1:1 관계 설정
- [x] `PaymentMethod` Enum (RFID, KAKAO, CARD)
- [x] `PaymentStatus` Enum (PENDING, OK, FAIL)

```bash
# 커밋 메시지
git commit -m "feat: Payment 엔터티 정의"
```

---

#### Commit #015: Setting 엔터티
- [ ] `Setting.java` 엔터티 작성
- [ ] 컬럼: id, clientId, keyName, value, description, updatedAt
- [ ] Client와 N:1 관계 설정

```bash
# 커밋 메시지
git commit -m "feat: Setting 엔터티 정의"
```

---

#### Commit #016: BaseTimeEntity 추상 클래스 ✅
- [x] `BaseTimeEntity.java` 작성
- [x] @MappedSuperclass, @EntityListeners(AuditingEntityListener.class)
- [x] create_time, update_time, creator, updater 자동 관리
- [x] JpaConfig에 @EnableJpaAuditing 추가

```bash
# 커밋 메시지
git commit -m "feat: BaseTimeEntity 및 JPA Auditing 설정"
```

---

### Phase 3: Repository 계층

#### Commit #017: Repository 인터페이스 생성 ✅
- [x] `UserRepository.java` (findByEmail, findByPhone)
- [ ] `ClientRepository.java` (findByClientId) - 웹 담당
- [x] `CarRepository.java` (findByUserId, findByCarNo, findByRfidNo)
- [x] `ParkingSlotRepository.java` (findByStatus, findBySlotNo)
- [x] `ParkingHistoryRepository.java` (findByCarIdAndOutTimeIsNull, 페이징 조회)
- [x] `PaymentRepository.java` (findByHistoryId)
- [ ] `SettingRepository.java` (findByClientId, findByKeyName) - 웹 담당

```bash
# 커밋 메시지
git commit -m "feat: 전체 Repository 인터페이스 정의"
```

---

### Phase 4: JWT 인증

#### Commit #018: JWT 의존성 및 설정 ✅
- [x] jjwt 의존성 확인 (jjwt-api, jjwt-impl, jjwt-jackson)
- [x] application.yml의 jwt 설정 바인딩 (이미 완료)

```bash
# 커밋 메시지
git commit -m "config: JWT 설정 프로퍼티 바인딩"
```

---

#### Commit #019: JwtTokenProvider 구현 ✅
- [x] `JwtTokenProvider.java` 확장 (팀원 코드 기반)
- [x] `createAccessToken(userId, role, name)` 메서드
- [x] `createRefreshToken(userId, role)` 메서드
- [x] `validateToken(token)` 메서드
- [x] `getUserId(token)`, `getRole(token)`, `getName(token)` 메서드

```bash
# 커밋 메시지
git commit -m "feat: JwtTokenProvider 구현"
```

---

#### Commit #020: JwtAuthenticationFilter 구현 ✅
- [x] `JwtAuthenticationFilter.java` 작성 (OncePerRequestFilter 상속)
- [x] Authorization 헤더에서 Bearer 토큰 추출
- [x] 토큰 검증 및 SecurityContext 설정
- [x] SecurityConfig에 필터 등록

```bash
# 커밋 메시지
git commit -m "feat: JWT 인증 필터 구현 및 Security 연동"
```

---

#### ~~Commit #021: CustomUserDetails 및 UserDetailsService 구현~~ (JWT 직접 검증으로 불필요)
- ~~`CustomUserDetails.java` 작성~~
- ~~`CustomUserDetailsService.java` 작성 (앱 사용자용)~~
- ~~`CustomClientDetailsService.java` 작성 (관리자용)~~

```bash
# 스킵 (JWT 환경에서 불필요)
```

---

### Phase 5: 웹 API (관리자용)

#### Commit #022: 관리자 로그인 API
- [ ] `ClientAuthController.java` 작성
- [ ] `POST /api/v1/auth/client/login`
- [ ] `ClientLoginRequest` DTO (clientId, password)
- [ ] `ClientLoginResponse` DTO (accessToken, clientName)
- [ ] `ClientAuthService.java` 로그인 로직

```bash
# 커밋 메시지
git commit -m "feat: 관리자 로그인 API 구현 (POST /auth/client/login)"
```

---

#### Commit #023: 관리자 로그아웃 API
- [ ] `POST /api/v1/auth/client/logout`
- [ ] 토큰 무효화 (블랙리스트 or 프론트 처리)

```bash
# 커밋 메시지
git commit -m "feat: 관리자 로그아웃 API 구현 (POST /auth/client/logout)"
```

---

#### Commit #024: 대시보드 - 주차장 현황 요약 API
- [ ] `DashboardController.java` 작성
- [ ] `GET /api/v1/dashboard/summary`
- [ ] `DashboardSummaryResponse` DTO (totalSlots, emptySlots, occupiedSlots, parkingSlots, dailyRevenue)
- [ ] `DashboardService.java` 현황 집계 로직

```bash
# 커밋 메시지
git commit -m "feat: 대시보드 주차장 현황 요약 API 구현 (GET /dashboard/summary)"
```

---

#### Commit #025: 대시보드 - 시간대별 혼잡도 API
- [ ] `GET /api/v1/dashboard/hourly-stats`
- [ ] Query Parameter: date (YYYY-MM-DD)
- [ ] `HourlyStatsResponse` DTO

```bash
# 커밋 메시지
git commit -m "feat: 시간대별 혼잡도 API 구현 (GET /dashboard/hourly-stats)"
```

---

#### Commit #026: 대시보드 - 4주간 평균 혼잡도 API
- [ ] `GET /api/v1/dashboard/day-of-week-average`
- [ ] Query Parameter: date
- [ ] `DayOfWeekAverageResponse` DTO

```bash
# 커밋 메시지
git commit -m "feat: 4주간 평균 혼잡도 API 구현 (GET /dashboard/day-of-week-average)"
```

---

#### Commit #027: 최근 입출차 로그 API
- [ ] `ParkingLogController.java` 작성
- [ ] `GET /api/v1/parking/logs/recent`
- [ ] Query Parameter: limit (기본값 3)
- [ ] `ParkingLogResponse` DTO

```bash
# 커밋 메시지
git commit -m "feat: 최근 입출차 로그 API 구현 (GET /parking/logs/recent)"
```

---

#### Commit #028: 입출차 로그 조회 API (페이징, 검색)
- [ ] `GET /api/v1/parking/logs`
- [ ] Query Parameters: page, size, vehicleNo, startDate, endDate, status
- [ ] 페이징 응답 (content, totalElements, totalPages, currentPage)

```bash
# 커밋 메시지
git commit -m "feat: 입출차 로그 페이징 조회 API 구현 (GET /parking/logs)"
```

---

#### Commit #029: 입차 등록 API (내부 시스템용)
- [ ] `POST /api/v1/parking/entry`
- [ ] Request: vehicleNo
- [ ] `ParkingService.java` 입차 처리 로직
- [ ] ParkingRecord 생성 (status: PARKING)
- [ ] 등록된 차량이면 FCM 푸시 발송 (추후)

```bash
# 커밋 메시지
git commit -m "feat: 입차 등록 API 구현 (POST /parking/entry)"
```

---

#### Commit #030: 출차 처리 API (내부 시스템용)
- [ ] `POST /api/v1/parking/exit`
- [ ] Request: vehicleNo
- [ ] ParkingRecord status 변경 (EXITING → COMPLETED)
- [ ] 주차 요금 계산
- [ ] Payment 레코드 생성

```bash
# 커밋 메시지
git commit -m "feat: 출차 처리 API 구현 (POST /parking/exit)"
```

---

#### Commit #031: 주차면 배정 API
- [ ] `POST /api/v1/parking/assign`
- [ ] Request: vehicleNo
- [ ] 배정 알고리즘 (MVP: 빈자리 중 첫 번째)
- [ ] Response: slotNo, coordinates

```bash
# 커밋 메시지
git commit -m "feat: 주차면 배정 API 구현 (POST /parking/assign)"
```

---

#### Commit #032: 주차면 전체 조회 API
- [ ] `ParkingSlotController.java` 작성
- [ ] `GET /api/v1/parking-slots`
- [ ] 전체 주차면 정보 반환

```bash
# 커밋 메시지
git commit -m "feat: 주차면 전체 조회 API 구현 (GET /parking-slots)"
```

---

#### Commit #033: 주차면 상태 조회 API
- [ ] `GET /api/v1/parking-slots/status`
- [ ] 간략 상태 정보만 반환 (slotNo, status)

```bash
# 커밋 메시지
git commit -m "feat: 주차면 상태 조회 API 구현 (GET /parking-slots/status)"
```

---

#### Commit #034: 설정 조회 API
- [ ] `SettingController.java` 작성
- [ ] `GET /api/v1/settings`
- [ ] 요금 관련 설정 조회

```bash
# 커밋 메시지
git commit -m "feat: 설정 조회 API 구현 (GET /settings)"
```

---

#### Commit #035: 설정 수정 API
- [ ] `PUT /api/v1/settings`
- [ ] Request: 설정 키-값 맵
- [ ] 설정 값 업데이트

```bash
# 커밋 메시지
git commit -m "feat: 설정 수정 API 구현 (PUT /settings)"
```

---

### Phase 6: 앱 API (사용자용)

#### Commit #036: 사용자 회원가입 API
- [ ] `UserAuthController.java` 작성
- [ ] `POST /api/v1/auth/user/signup`
- [ ] Request: phone, password, name, vehicleNo
- [ ] User + Vehicle 동시 생성 (트랜잭션)
- [ ] 자동 로그인 (토큰 발급)

```bash
# 커밋 메시지
git commit -m "feat: 사용자 회원가입 API 구현 (POST /auth/user/signup)"
```

---

#### Commit #037: SMS 인증번호 발송 API
- [ ] `POST /api/v1/auth/user/send-verification`
- [ ] Request: phone
- [ ] 인증번호 생성 및 저장 (Redis 또는 인메모리)
- [ ] Response: expireAt
- [ ] (MVP) 실제 SMS 발송 대신 로그 출력

```bash
# 커밋 메시지
git commit -m "feat: SMS 인증번호 발송 API 구현 (POST /auth/user/send-verification)"
```

---

#### Commit #038: SMS 인증번호 확인 API
- [ ] `POST /api/v1/auth/user/verify-code`
- [ ] Request: phone, code
- [ ] Response: verified (true/false)

```bash
# 커밋 메시지
git commit -m "feat: SMS 인증번호 확인 API 구현 (POST /auth/user/verify-code)"
```

---

#### Commit #039: 사용자 로그인 API
- [ ] `POST /api/v1/auth/user/login`
- [ ] Request: phone, password
- [ ] Response: accessToken, refreshToken, userId, name, vehicleNo

```bash
# 커밋 메시지
git commit -m "feat: 사용자 로그인 API 구현 (POST /auth/user/login)"
```

---

#### Commit #040: 사용자 로그아웃 API
- [ ] `POST /api/v1/auth/user/logout`
- [ ] 토큰 무효화 처리

```bash
# 커밋 메시지
git commit -m "feat: 사용자 로그아웃 API 구현 (POST /auth/user/logout)"
```

---

#### Commit #041: 토큰 갱신 API
- [ ] `POST /api/v1/auth/user/refresh`
- [ ] Request: refreshToken
- [ ] Response: 새로운 accessToken, refreshToken

```bash
# 커밋 메시지
git commit -m "feat: 토큰 갱신 API 구현 (POST /auth/user/refresh)"
```

---

#### Commit #042: 현재 주차 상태 조회 API
- [ ] `UserParkingController.java` 작성
- [ ] `GET /api/v1/user/parking-status`
- [ ] JWT에서 userId 추출
- [ ] 현재 진행 중인 주차 기록 조회
- [ ] Response: isParking, record (recordId, slotNo, entryTime, status, currentFee, coordinates)

```bash
# 커밋 메시지
git commit -m "feat: 현재 주차 상태 조회 API 구현 (GET /user/parking-status)"
```

---

#### Commit #043: 입차 요청 API
- [ ] `POST /api/v1/parking/request-entry`
- [ ] JWT에서 사용자 차량 정보 조회
- [ ] 주차면 자동 배정
- [ ] ParkingRecord 생성
- [ ] MQTT 명령 발행 (추후)

```bash
# 커밋 메시지
git commit -m "feat: 입차 요청 API 구현 (POST /parking/request-entry)"
```

---

#### Commit #044: 출차 요청 API
- [ ] `POST /api/v1/parking/request-exit`
- [ ] 현재 주차 기록 상태 변경 (EXITING)
- [ ] 요금 계산
- [ ] Response: recordId, fee

```bash
# 커밋 메시지
git commit -m "feat: 출차 요청 API 구현 (POST /parking/request-exit)"
```

---

#### Commit #045: 차량 실시간 위치 조회 API
- [ ] `GET /api/v1/vehicle/location`
- [ ] Response: position (x, y), status, updatedAt
- [ ] (MVP) 더미 데이터 또는 MQTT로 수신한 마지막 위치

```bash
# 커밋 메시지
git commit -m "feat: 차량 실시간 위치 조회 API 구현 (GET /vehicle/location)"
```

---

#### Commit #046: 결제 정보 조회 API
- [ ] `PaymentController.java` 작성
- [ ] `GET /api/v1/payment/{recordId}`
- [ ] 요금 계산 로직 적용
- [ ] Response: recordId, entryTime, currentTime, parkingMinutes, fee, isPaid

```bash
# 커밋 메시지
git commit -m "feat: 결제 정보 조회 API 구현 (GET /payment/{recordId})"
```

---

#### Commit #047: 결제 처리 API
- [ ] `POST /api/v1/payment/process`
- [ ] Request: recordId, method, rfidTag
- [ ] Payment 레코드 생성/업데이트
- [ ] Response: paymentId, amount, method, status, paidAt

```bash
# 커밋 메시지
git commit -m "feat: 결제 처리 API 구현 (POST /payment/process)"
```

---

#### Commit #048: 내 정보 조회 API
- [ ] `UserController.java` 작성
- [ ] `GET /api/v1/user/me`
- [ ] Response: userId, phone, name, vehicleNo, rfidTag, createdAt

```bash
# 커밋 메시지
git commit -m "feat: 내 정보 조회 API 구현 (GET /user/me)"
```

---

#### Commit #049: 내 정보 수정 API
- [ ] `PUT /api/v1/user/me`
- [ ] Request: name, vehicleNo
- [ ] User, Vehicle 정보 업데이트

```bash
# 커밋 메시지
git commit -m "feat: 내 정보 수정 API 구현 (PUT /user/me)"
```

---

#### Commit #050: 주차 이력 조회 API
- [ ] `GET /api/v1/user/parking-history`
- [ ] Query Parameters: page, size
- [ ] 페이징 응답

```bash
# 커밋 메시지
git commit -m "feat: 주차 이력 조회 API 구현 (GET /user/parking-history)"
```

---

#### Commit #051: FCM 토큰 등록/갱신 API
- [ ] `POST /api/v1/user/fcm-token`
- [ ] Request: fcmToken
- [ ] User.fcmToken 업데이트

```bash
# 커밋 메시지
git commit -m "feat: FCM 토큰 등록 API 구현 (POST /user/fcm-token)"
```

---

#### Commit #052: Geofence 진입 알림 API
- [ ] `POST /api/v1/notification/geofence-entry`
- [ ] Request: latitude, longitude
- [ ] 주차장 범위 내 여부 확인
- [ ] Response: isInRange, parkingLotName

```bash
# 커밋 메시지
git commit -m "feat: Geofence 진입 알림 API 구현 (POST /notification/geofence-entry)"
```

---

### Phase 7: 요금 계산 로직

#### Commit #053: 요금 계산 서비스
- [ ] `FeeCalculator.java` 작성
- [ ] 기본 무료 30분
- [ ] 10분당 500원
- [ ] 일 최대 15,000원
- [ ] Setting 테이블에서 설정값 조회

```bash
# 커밋 메시지
git commit -m "feat: 요금 계산 로직 구현 (FeeCalculator)"
```

---

### Phase 8: 실시간 통신

#### Commit #054: MQTT 설정 및 연결
- [ ] `MqttConfig.java` 작성
- [ ] MQTT 브로커 연결 설정
- [ ] MqttProperties 바인딩

```bash
# 커밋 메시지
git commit -m "config: MQTT 브로커 연결 설정"
```

---

#### Commit #055: MQTT 메시지 발행 서비스
- [ ] `MqttPublisher.java` 작성
- [ ] `sendParkCommand(vehicleId, destination)` 메서드
- [ ] `sendExitCommand(vehicleId)` 메서드
- [ ] `sendStopCommand(vehicleId)` 메서드

```bash
# 커밋 메시지
git commit -m "feat: MQTT 메시지 발행 서비스 구현"
```

---

#### Commit #056: MQTT 메시지 수신 핸들러
- [ ] `MqttSubscriber.java` 작성
- [ ] `vehicle/{vehicleId}/status` 토픽 구독
- [ ] `vehicle/{vehicleId}/ack` 토픽 구독
- [ ] 차량 위치 정보 저장

```bash
# 커밋 메시지
git commit -m "feat: MQTT 메시지 수신 핸들러 구현"
```

---

#### Commit #057: SSE 설정 및 대시보드 스트리밍
- [ ] `SseController.java` 작성
- [ ] `GET /api/v1/sse/dashboard`
- [ ] `SseEmitterService.java` 작성
- [ ] slot-update, entry, exit 이벤트 발행

```bash
# 커밋 메시지
git commit -m "feat: SSE 대시보드 실시간 업데이트 구현"
```

---

#### Commit #058: FCM 푸시 알림 설정
- [ ] Firebase Admin SDK 설정
- [ ] `FcmService.java` 작성
- [ ] `sendPushNotification(fcmToken, title, body)` 메서드
- [ ] firebase-service-account.json 설정 확인

```bash
# 커밋 메시지
git commit -m "feat: FCM 푸시 알림 서비스 구현"
```

---

### Phase 9: 데이터 초기화

#### Commit #059: DDL 스크립트 작성
- [ ] `schema.sql` 작성 (테이블 생성)
- [ ] `data.sql` 작성 (초기 데이터)
- [ ] 기본 주차면 데이터
- [ ] 기본 설정값 데이터
- [ ] 테스트용 관리자 계정

```bash
# 커밋 메시지
git commit -m "chore: DDL 및 초기 데이터 스크립트 작성"
```

---

### Phase 10: 테스트 및 검증

#### Commit #060: 단위 테스트 - Service 계층
- [ ] `UserAuthServiceTest.java`
- [ ] `ParkingServiceTest.java`
- [ ] `FeeCalculatorTest.java`

```bash
# 커밋 메시지
git commit -m "test: Service 계층 단위 테스트 작성"
```

---

#### Commit #061: 통합 테스트 - API 계층
- [ ] `AuthControllerIntegrationTest.java`
- [ ] `ParkingControllerIntegrationTest.java`
- [ ] MockMvc 활용

```bash
# 커밋 메시지
git commit -m "test: Controller 계층 통합 테스트 작성"
```

---

#### Commit #062: API 문서 최종 점검
- [ ] Swagger UI에서 전체 API 테스트
- [ ] Request/Response 예시 확인
- [ ] 누락된 API 확인

```bash
# 커밋 메시지
git commit -m "docs: Swagger API 문서 최종 점검 및 보완"
```

---

### Phase 11: Docker 및 배포 준비 (선택)

#### Commit #063: Dockerfile 작성
- [ ] `Dockerfile` 작성 (Multi-stage build)
- [ ] JDK 21 베이스 이미지

```bash
# 커밋 메시지
git commit -m "chore: Dockerfile 작성"
```

---

#### Commit #064: docker-compose.yml 작성
- [ ] Spring Boot 앱 서비스
- [ ] MySQL 서비스
- [ ] MQTT Broker (Mosquitto) 서비스
- [ ] 환경변수 설정

```bash
# 커밋 메시지
git commit -m "chore: docker-compose.yml 작성"
```

---

## 📊 진행 상황 요약

| Phase | 커밋 수 | 설명 |
|---|---|---|
| Phase 0 | 2 | 프로젝트 초기화 |
| Phase 1 | 6 | 환경 설정 |
| Phase 2 | 8 | 데이터베이스 엔터티 |
| Phase 3 | 1 | Repository 계층 |
| Phase 4 | 4 | JWT 인증 |
| Phase 5 | 14 | 웹 API (관리자용) |
| Phase 6 | 17 | 앱 API (사용자용) |
| Phase 7 | 1 | 요금 계산 로직 |
| Phase 8 | 5 | 실시간 통신 |
| Phase 9 | 1 | 데이터 초기화 |
| Phase 10 | 3 | 테스트 및 검증 |
| Phase 11 | 2 | Docker 배포 (선택) |
| **Total** | **64** | |

---

## 🚀 시작하기

```bash
# 1. 프로젝트 생성 (Spring Initializr)
# https://start.spring.io

# 2. Git 초기화
git init
git add .
git commit -m "chore: 프로젝트 초기화 및 기본 의존성 설정"

# 3. 이후 각 커밋별로 진행
```

---

## 📝 커밋 메시지 규칙

| 타입 | 설명 |
|---|---|
| feat | 새로운 기능 추가 |
| fix | 버그 수정 |
| config | 설정 관련 변경 |
| chore | 빌드, 패키지 등 기타 작업 |
| docs | 문서 관련 변경 |
| test | 테스트 코드 작성 |
| refactor | 리팩토링 |
