/**
 * 인증 관련 타입 정의
 */

// 소셜 로그인 제공자
// 소셜 로그인 제공자 + 휴대폰
export type AuthProvider = 'kakao' | 'google' | 'phone';

// 사용자 정보
export interface User {
    id: number; // string -> number
    email: string;
    name: string;
    mobile: string;  // phone -> mobile
    provider: AuthProvider;
    profileImage?: string;
    carNo: string[]; // carNumbers -> carNo
    defaultCarNumber?: string;
    createdAt: string;
    lastLoginAt: string;

    // 알림 설정
    notificationSettings: {
        pushEnabled: boolean;
        autoParkingAlert: boolean;
        parkingCompleteAlert: boolean;
        exitCompleteAlert: boolean;
        paymentAlert: boolean;
    };
}

// 로그인 요청
export interface LoginRequest {
    mobile?: string;
    password?: string;
    provider?: AuthProvider;
    token?: string; // 소셜 로그인용 토큰
}

// 로그인 응답 (프론트엔드용)
export interface LoginResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: User;
    message?: string;
}

// 로그인 응답 (백엔드 API용)
export interface BackendLoginResponse {
    accessToken: string;
    refreshToken: string;
    userId: number;
    carNo: string;
}

// 회원가입 요청
export interface SignupRequest {
    mobile: string;
    password: string;
    carNo: string;
}

// 회원가입 응답
export interface SignupResponse {
    success: boolean;
    accessToken?: string;
    refreshToken?: string;
    userId?: number;
    carNo?: string;
    message?: string;
}

// 인증 상태
export interface AuthState {
    isLoading: boolean;
    isAuthenticated: boolean;
    user: User | null;
    token: string | null;
}

// 토큰 갱신 응답
export interface TokenRefreshResponse {
    accessToken: string;
    refreshToken: string;
}
