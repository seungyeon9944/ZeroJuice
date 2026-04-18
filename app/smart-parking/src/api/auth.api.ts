import apiClient from './client';
import { LoginRequest, LoginResponse, SignupRequest, SignupResponse, BackendLoginResponse } from '../types';
import { ApiResponse } from '../types/common.types';

/**
 * 인증 관련 API 호출
 */
export const AuthApi = {
    // 회원가입
    signup: async (request: SignupRequest): Promise<SignupResponse> => {
        const response = await apiClient.post<SignupResponse>('/auth/user/signup', request);
        return response.data;
    },

    // 로그인
    login: async (request: LoginRequest): Promise<BackendLoginResponse> => {
        const response = await apiClient.post('/auth/user/login', request);

        console.log('[AuthApi] Full response:', JSON.stringify(response.data, null, 2));
        console.log('[AuthApi] Response keys:', Object.keys(response.data));

        // ApiResponse 구조 확인 후 적절히 반환
        if (response.data.success && response.data.data) {
            console.log('[AuthApi] Returning response.data.data');
            return response.data.data;
        }

        // ApiResponse 없이 직접 반환되는 경우
        console.log('[AuthApi] Returning response.data directly');
        return response.data;
    },

    // 로그아웃
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/user/logout');
    },

    // FCM 토큰 갱신
    updateFcmToken: async (token: string): Promise<void> => {
        await apiClient.post('/auth/user/fcm', { token });
    },

    // 소셜 로그인
    socialLogin: async (data: { provider: string; token: string; fcmToken?: string }): Promise<BackendLoginResponse> => {
        const response = await apiClient.post('/auth/user/social-login', data);
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        return response.data;
    },

    // 내 정보 조회 (새로고침)
    getProfile: async (): Promise<BackendLoginResponse> => {
        const response = await apiClient.get<ApiResponse<BackendLoginResponse>>('/auth/user/me');
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || '정보 조회 실패');
    },
};
