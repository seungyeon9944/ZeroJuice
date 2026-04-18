# ZEROJUICE Frontend (A201)

주차 관제/모니터링용 React 프론트엔드 프로젝트입니다.  
실제 애플리케이션 코드는 `my-react-app` 디렉터리에 있습니다.

## 프로젝트 구조

```text
S14P11A201/
├─ README.md                 # 현재 문서
└─ my-react-app/
   ├─ components/            # 화면 핵심 컴포넌트
   ├─ src/
   │  ├─ api/                # Axios 기반 API 서비스
   │  ├─ *.jsx               # 페이지 라우트 래퍼
   │  └─ global.css          # 전역 스타일/디자인 토큰
   ├─ public/                # 정적 리소스
   ├─ dist/                  # 빌드 결과물
   ├─ vite.config.js         # Vite + /api 프록시 설정
   ├─ nginx.conf             # SPA + API/SSE 프록시 설정
   └─ dockerfile             # 멀티스테이지 Docker 빌드
```

## 주요 기능

- 로그인 및 토큰 기반 인증(`accessToken`, `refreshToken`)
- 실시간 CCTV 화면(Socket.IO)
- 실시간 대시보드(SSE 기반 주차 상태/이력/매출 업데이트)
- 입출차 로그 조회(검색/날짜 필터/페이지네이션)
- 요금 정책 조회/수정 및 요금 미리 계산

## 기술 스택

- React 19
- React Router DOM 7
- Vite 7
- Tailwind CSS 4
- Axios
- event-source-polyfill (SSE 헤더 인증)
- socket.io-client

## 라우트

- `/` : 로그인
- `/cctv` : 실시간 모니터링
- `/dashboard` : 대시보드
- `/trafficlog` : 입출차 로그
- `/setting` : 시스템 설정

## 로컬 실행

```bash
cd my-react-app
npm install
npm run dev
```

기본 개발 서버 주소: `http://localhost:5173`

## 빌드/배포

```bash
cd my-react-app
npm run build
npm run preview
```

Docker 이미지 빌드/실행:

```bash
cd my-react-app
docker build -t zerojuice-fe -f dockerfile .
docker run -p 8080:80 zerojuice-fe
```

## 백엔드 연동 방식

- 기본 API: `https://i14a201.p.ssafy.io/api/v1`
- 개발 환경: `vite.config.js`에서 `/api` 프록시 사용
- 배포 환경: `nginx.conf`에서 `/api/` 프록시 및 SSE용 버퍼링 해제
- 인증: Axios 인터셉터로 `Authorization: Bearer <token>` 자동 주입 및 401 시 토큰 갱신 시도

## 참고 사항

- `my-react-app/dist`가 저장소에 포함되어 있어 배포 산출물을 바로 확인할 수 있습니다.
- 일부 소스 파일에 한글 인코딩이 깨져 보이는 문자열이 있으므로, 필요 시 UTF-8 기준으로 정리하는 것을 권장합니다.
