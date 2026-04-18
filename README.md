# Zero Juice
<img src="https://i.imgur.com/SDbOf0x.png" alt="Zero Juice Logo" width="250">


Zero Juice는 자율주행 차량, 관리자 웹 인터페이스, 주차장 사용자 모바일 앱, CCTV, RFID를 통합한 스마트 주차 관제 시스템입니다. **제로 주**차 **스**트레스를 실현하여 입차부터 주차, 결제, 출차까지 자동화된 주차 경험을 제공합니다.

## 프로젝트 개요

이 프로젝트는 SSAFY 14기 2학기 AIoT 공통 프로젝트로, 주차 공간의 효율적 관리와 사용자 편의성을 극대화하기 위해 개발되었습니다. AI 기술을 활용한 실시간 주차면 감지, ROS2 기반 자율주행 주차, 실시간 모니터링 대시보드, 모바일 앱을 통한 결제 및 예약 기능을 포함합니다.

## 주요 기능

- **실시간 CCTV 모니터링**: AI 기반 주차면 상태 감지 및 실시간 영상 스트리밍
- **자율주행 주차 유도**: ROS2 임베디드 시스템을 통한 차량 자동 주차
- **대시보드**: 실시간 주차 현황, 매출, 입출차 로그 모니터링
- **모바일 앱**: 입차 요청, 결제, 출차 관리
- **설정 관리**: 요금 정책, CCTV URL 등 시스템 설정
- **MQTT/SSE 통신**: 실시간 데이터 전송 및 이벤트 처리

## 시스템 아키텍처

### 백엔드 (be)
- **기술 스택**: Java 21, Spring Boot 3.5.9, Gradle
- **데이터베이스**: MySQL 8.x
- **캐시/토큰**: Redis
- **메시징**: MQTT (Paho), SSE
- **포트**: 8081 (로컬), API 경로: `/api/v1`

### 웹사이트 (frontend)
- **기술 스택**: React 19, Vite 7, Tailwind CSS 4
- **웹 서버**: Nginx, 포트 80
- **주요 기능**: 로그인, CCTV 모니터링, 대시보드, 트래픽 로그, 설정

### 모바일 앱 (app)
- **기술 스택**: React Native 0.81.5, Expo SDK 54
- **기능**: 카카오 로그인, PortOne 결제, Firebase 푸시 알림

### AI (ai)
- **기술 스택**: Python 3.9+, OpenCV, NumPy
- **기능**: CCTV 기반 ROI 차분 탐지, LLM 요약, Socket.IO 연동

### 임베디드 (emb)
- **기술 스택**: ROS2 (rclpy/ament), C++/Python
- **기능**: 자율주행 네비게이션, 센서 데이터 처리, MQTT 브로커 연동

## 설치 및 실행

### 사전 요구사항
- Docker & Docker Compose
- Node.js 18+
- Java 21
- Python 3.9+
- ROS2

### 빌드 및 배포
자세한 빌드 및 배포 방법은 `exec/01_빌드_배포_매뉴얼.md`를 참조하세요.

### 로컬 실행 예시
1. 백엔드 실행:
   ```bash
   cd be/S14P11A201/zerojuice
   ./gradlew bootRun
   ```

2. 프론트엔드 실행:
   ```bash
   cd frontend/my-react-app
   npm install
   npm run dev
   ```

3. 모바일 앱 실행:
   ```bash
   cd app/S14P11A201/smart-parking
   npm install
   npx expo start
   ```

4. AI 실행:
   ```bash
   cd ai/S14P11A201
   python parking_slot_detection.py
   ```

5. 임베디드 실행:
   ```bash
   # ROS2 환경 설정 후
   cd emb/S14P11A201
   ros2 launch rc_nav2_bringup bringup_launch.py
   ```

## 시연 시나리오

시연 시나리오는 `exec/04_시연_시나리오.md`에 자세히 설명되어 있습니다.

### 주요 시나리오
1. **관리자 웹**: 로그인 → 대시보드 모니터링 → CCTV 확인 → 트래픽 로그 → 설정 변경
2. **모바일 앱**: 로그인 → 입차 요청 → 주차 진행 → 결제 → 출차
3. **연동 검증**: AI ↔ 백엔드 ↔ 임베디드 ↔ 앱/웹 실시간 통신

## 환경 설정

환경변수 및 설정 파일은 `exec/02_외부서비스_정보.md`를 참조하세요.

### 주요 환경변수
- DB_USERNAME, DB_PASSWORD
- JWT_SECRET, JWT_ACCESS_VALIDITY, JWT_REFRESH_VALIDITY
- MQTT_BROKER_URL, MQTT_USERNAME, MQTT_PASSWORD
- FIREBASE_CREDENTIALS_PATH
- GMS_KEY (AI용)

## 데이터베이스

최신 DB 덤프는 `exec/03_DB_덤프_최신본.md`에 있습니다.

## 기여자

- SSAFY 14기 1학기 A201 팀
