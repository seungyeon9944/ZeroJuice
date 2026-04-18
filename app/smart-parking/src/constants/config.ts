// API 설정 상수
export const API_CONFIG = {
  // 실제 백엔드 API URL
  BASE_URL: 'https://i14a201.p.ssafy.io/api/v1', // 8081 port + /api/v1 context path
  TIMEOUT: 10000,
};

// 앱 설정a
export const APP_CONFIG = {
  // 지도 폴링 간격 (ms)
  POLLING_INTERVAL: 3000,
};

// OAuth 설정 (소셜 로그인)
export const AUTH_CONFIG = {
  // 카카오 로그인
  KAKAO_CLIENT_ID: 'YOUR_KAKAO_REST_API_KEY',
  KAKAO_REDIRECT_URI: 'YOUR_REDIRECT_URI',

  // 구글 로그인
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID',
};
