import axios from 'axios';

const api = axios.create({
    baseURL: 'https://i14a201.p.ssafy.io/api/v1'
});

// 요청 인터셉터: 모든 요청에 토큰 자동 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('🔑 Authorization header added:', `Bearer ${token.substring(0, 20)}...`);
        } else {
            console.warn('⚠️ No access token found in localStorage');
        }
        console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => Promise.reject(error)
);

// 응답 인터셉터: 401 에러 시 자동 토큰 갱신
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 401 에러 + 첫 시도
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');

                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                // RefreshToken으로 새 AccessToken 받기
                const response = await axios.post(
                    'https://i14a201.p.ssafy.io/api/v1/users/refresh',
                    { refreshToken }
                );

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                console.log('🔄 토큰 자동 갱신 완료');

                // 실패했던 원래 요청 재시도
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                console.error('❌ RefreshToken 만료');
                localStorage.clear();
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;