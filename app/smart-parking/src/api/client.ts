import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../constants';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    async (config) => {
        // 토큰이 있으면 헤더에 추가
        try {
            const token = await AsyncStorage.getItem('@juice_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('[API] Failed to get token:', error);
        }

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API] Request Error:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API] Response ${response.status}:`, response.config.url);
        return response;
    },
    async (error: AxiosError) => {
        if (error.response) {
            //console.error(`[API] Error ${error.response.status}:`, error.response.data);

            // 401 인증 에러 처리 (로그아웃 등)
            if (error.response.status === 401) {
                // TODO: 토큰 만료 시 리프레시 토큰 로직 또는 강제 로그아웃 처리
                // 현재는 단순 로그 처리만 수행
                console.warn('[API] Unathorized - Token might be expired');
            }
        } else if (error.request) {
            console.error('[API] Network Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiClient;

