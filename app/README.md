# S14P11A201 프로젝트 문서

## 1) 프로젝트 개요
이 저장소는 Expo + React Native 기반의 **스마트 주차(ZeroJuice) 모바일 앱** 프로젝트입니다.

- 앱 코드 위치: `smart-parking/`
- 루트 기존 문서: `README.md` (현재 최소 내용)
- 미리보기 이미지: `parking-lot-preview.png`

핵심 목적은 사용자 인증 후 주차 입차/출차 요청, 실시간 상태 추적(SSE), 결제, 알림, 설정 관리를 모바일 앱에서 제공하는 것입니다.

## 2) 기술 스택
- Frontend: React 19, React Native 0.81, Expo SDK 54
- Language: TypeScript
- Networking: Axios
- Realtime: SSE (`react-native-sse`)
- Storage: AsyncStorage
- Auth/Integration: Kakao Login, Expo Auth Session
- Notifications: Expo Notifications
- Payment: `iamport-react-native`

## 3) 주요 기능
- 인증
  - 전화번호 로그인/회원가입
  - 소셜 로그인(카카오 등)
- 주차
  - 입차 요청
  - 출차 요청
  - 주차 진행/상태 화면
  - 실시간 좌표 및 상태 업데이트(SSE)
- 결제
  - 결제 진행 및 결제 완료 후 출차 흐름
- 사용자 설정
  - 프로필/알림 설정
  - 테마(라이트/다크) 저장
- 푸시 알림
  - FCM 토큰 등록 및 알림 응답 처리

## 4) 디렉터리 구조
```text
S14P11A201/
├─ README.md
├─ readme1.md
├─ parking-lot-preview.png
└─ smart-parking/
   ├─ App.tsx
   ├─ package.json
   ├─ app.json
   ├─ index.ts
   ├─ src/
   │  ├─ api/          # 백엔드 API 클라이언트, 엔드포인트
   │  ├─ services/     # 인증, SSE, 알림, 스토리지 등 서비스 레이어
   │  ├─ contexts/     # Parking/Theme 컨텍스트
   │  ├─ screens/      # auth/main/parking/payment/settings 화면
   │  ├─ components/   # 공통/주차/맵 UI 컴포넌트
   │  ├─ constants/    # API/색상/설정 상수
   │  ├─ types/        # 도메인 타입 정의
   │  ├─ utils/        # config/좌표 매핑/네비게이션 유틸
   │  └─ mocks/        # 목 데이터
   └─ assets/          # 로고/스플래시/맵 이미지
```

## 5) 실행 방법
### 사전 준비
- Node.js LTS
- npm
- Expo CLI(전역 설치 없이 `npx expo` 사용 가능)

### 설치 및 실행
```bash
cd smart-parking
npm install
npm run start
```

추가 실행 스크립트:
- `npm run android`
- `npm run ios`
- `npm run web`

현재 개발 서버 포트는 `8085`로 고정되어 있습니다.

## 6) 환경/설정 포인트
### API 서버
- 기본 API URL: `https://i14a201.p.ssafy.io/api/v1`
- 관련 파일: `smart-parking/src/utils/config.ts`, `smart-parking/src/constants/config.ts`

### 인증 토큰 저장 키
- `@juice_token`
- `@juice_user`

### 카카오 로그인/앱 설정
- `smart-parking/app.json`에 카카오 플러그인 및 안드로이드 패키지 설정 포함

## 7) 현재 코드 기준 참고 사항
- 루트 `README.md`는 현재 간단 제목만 존재합니다.
- 앱의 주요 흐름은 `smart-parking/App.tsx`에서 상태 기반 화면 전환으로 구성되어 있습니다.
- 실시간 이벤트는 `src/services/*SSE*` 계층에서 처리합니다.

## 8) 개선 권장 사항
- `.env` 기반으로 API URL/키 분리
- 루트 README와 앱 README 분리 또는 통합 정리
- 빌드/배포/테스트 가이드 추가

---
필요하면 다음 단계로 `README.md` 자체를 이 문서 내용으로 교체해 드릴 수 있습니다.
