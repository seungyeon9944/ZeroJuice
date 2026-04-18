# 최근 변경 사항 요약

## 빌드/의존성
- `build.gradle`: Lombok 테스트용 의존성 추가 및 `annotationProcessorPath`를 명시해 어노테이션 프로세서가 안정적으로 동작하도록 보완.

## 결제 도메인
- `src/main/java/com/zerojuice/domain/payment/service/PaymentService.java`
  - `updatePaymentStatus` 중복 메서드 제거.
  - 결제 완료 시 SSE 알림을 `notifyPaymentComplete`로 분리해 재사용하도록 정리.
  - `findTopByCarIdAndOutTimeIsNull` 사용을 `findTopByCarIdAndOutTimeIsNullOrderByInTimeDesc`로 정합화.
- `src/main/java/com/zerojuice/domain/payment/controller/PaymentController.java`
  - 잘못된 DTO 초기화 구문을 `PaymentUpdateDto.builder()`로 수정.

## SSE / 클라이언트
- `src/main/java/com/zerojuice/infra/sse/AppEventSseHub.java`
  - 사용되지 않는 `ParkingFeeEvent` 필드 제거.
- `src/main/java/com/zerojuice/domain/client/service/ClientService.java`
  - 사용되지 않는 `ParkingFeeEvent` 필드 제거.
- `src/main/java/com/zerojuice/domain/client/controller/ClientController.java`
  - 로그아웃 시 사용하는 `RedisService` 주입 추가.
- `src/main/java/com/zerojuice/domain/parking/service/ParkingHistoryServiceImpl.java`
  - `ParkingFeeEvent` import 누락 보완.

## 기타
- `gradlew`: Gradle wrapper 재생성 과정에서 파일이 갱신됨.
