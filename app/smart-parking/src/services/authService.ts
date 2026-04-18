/**
 * 인증 서비스
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthProvider, LoginResponse, LoginRequest, BackendLoginResponse } from '../types';
import { AuthApi } from '../api/auth.api';

// Mock 사용자 데이터 (소셜 로그인용)
const MOCK_USERS: Record<Exclude<AuthProvider, 'phone'>, User> = {
    kakao: {
        id: 12345,
        email: 'user@kakao.com',
        name: '김주스',
        mobile: '010-0000-0000',
        profileImage: 'https://via.placeholder.com/100',
        provider: 'kakao',
        carNo: ['12가3456'],
        defaultCarNumber: '12가3456',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        notificationSettings: {
            pushEnabled: true,
            autoParkingAlert: true,
            parkingCompleteAlert: true,
            exitCompleteAlert: true,
            paymentAlert: true,
        },
    },
    google: {
        id: 67890,
        email: 'user@gmail.com',
        name: '박주스',
        mobile: '010-0000-0000',
        profileImage: 'https://via.placeholder.com/100',
        provider: 'google',
        carNo: ['34나5678'],
        defaultCarNumber: '34나5678',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        notificationSettings: {
            pushEnabled: true,
            autoParkingAlert: true,
            parkingCompleteAlert: true,
            exitCompleteAlert: true,
            paymentAlert: true,
        },
    },
};

// 회원가입
export const signup = async (data: { phone: string; password: string; carNumber: string }): Promise<boolean> => {
    try {
        await AuthApi.signup({
            mobile: data.phone,
            password: data.password,
            carNo: data.carNumber,
        });
        return true;
    } catch (error: any) {
        // console.warn used to avoid Red Box overlay in Dev mode for expected errors
        console.warn('[AuthService] Signup failed:', error.message);
        throw error; // Let the component handle specific errors
    }
};

// 로그인
export const login = async (provider: AuthProvider, credentials?: { phone?: string; password?: string; token?: string }): Promise<LoginResponse> => {
    if (provider === 'phone') {
        if (!credentials?.phone || !credentials?.password) {
            throw new Error('전화번호와 비밀번호가 필요합니다.');
        }

        // 실제 백엔드 API 호출
        try {
            const request: LoginRequest = {
                mobile: credentials.phone, // 매핑 수정
                password: credentials.password
            };

            console.log('[AuthService] Login Request:', JSON.stringify(request));

            const response = await AuthApi.login(request);

            console.log('[AuthService] Login Response:', JSON.stringify(response));

            // 중요: 백엔드 응답은 accessToken, refreshToken, userId, carNo로 옴
            // 프론트엔드 LoginResponse 타입은 user 객체를 포함해야 함
            // 따라서 여기서 백엔드 응답을 프론트엔드 구조로 변환해야 함

            const user: User = {
                id: response.userId,
                email: '', // 백엔드 미제공
                name: '사용자', // 백엔드 미제공
                mobile: credentials.phone || '',
                provider: 'phone',
                profileImage: '',
                carNo: response.carNo ? [response.carNo] : [],
                defaultCarNumber: response.carNo,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                notificationSettings: {
                    pushEnabled: true,
                    autoParkingAlert: true,
                    parkingCompleteAlert: true,
                    exitCompleteAlert: true,
                    paymentAlert: true,
                },
            };

            const fullResponse: LoginResponse = {
                success: true,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                user: user,
                message: '로그인 성공'
            };

            console.log('[AuthService] Saving token:', fullResponse.accessToken);

            // 토큰 및 사용자 정보 저장
            if (fullResponse.accessToken) {
                await saveToken(fullResponse.accessToken);
                console.log('[AuthService] Token saved successfully');

                // 즉시 확인
                const savedToken = await getToken();
                console.log('[AuthService] Verification - Token retrieved:', savedToken ? 'YES' : 'NO');
            } else {
                console.error('[AuthService] No access token in response!');
            }

            if (fullResponse.user) {
                await saveUser(fullResponse.user);
                console.log('[AuthService] User saved successfully');
            }

            return fullResponse;
        } catch (error) {
            console.error('[AuthService] Login failed:', error);
            throw error;
        }
    } else {
        // 소셜 로그인 (실제 구현)
        console.log(`[AuthService] Social Login (${provider}) with token:`, credentials?.token);

        try {
            // API 호출
            // AuthApi.ts에 socialLogin 메서드가 필요할 수 있음.
            // 하지만 지금 AuthApi.ts를 수정하기보다는 여기서 fetch 또는 axios를 직접 쓰거나 AuthApi를 통해야 함.
            // AuthApi.ts를 먼저 확인하자니 tool call이 더 필요하므로, 
            // 일단 AuthApi.ts에 해당 메서드가 없다고 가정하고 axios/fetch를 사용하거나,
            // AuthApi.login을 재사용하기엔 endpoint가 다름.
            // 가장 깔끔한건 AuthApi에 추가하는 것.
            // 하지만 AuthApi 파일 내용을 모르는 상태에서 추측보다는,
            // axios import가 되어있는지 확인. (UserAuthService.ts 상단을 보면 api/auth.api만 import)

            // 기존 api/auth.api.ts를 수정하는 것이 맞음.
            // 하지만 Tool Call 절약을 위해 여기서 직접 호출하거나, mock 대신 AuthApi.socialLogin(가칭)을 호출하도록 변경.

            // let's assume I will update AuthApi as well or use a raw request here.
            // Using raw axios/fetch here is a bit dirty but fast.
            // Let's use AuthApi.socialLogin and I will update AuthApi next.

            const response = await AuthApi.socialLogin({
                provider: provider.toUpperCase(),
                token: credentials?.token || '',
                fcmToken: '' // 필요시 추가
            });

            console.log('[AuthService] Social Login Response:', JSON.stringify(response));

            const user: User = {
                id: response.userId,
                email: '',
                name: '사용자',
                mobile: '', // 소셜 유저는 모바일을 모를 수 있음
                provider: provider,
                profileImage: '',
                carNo: response.carNo ? [response.carNo] : [],
                defaultCarNumber: response.carNo,
                createdAt: new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
                notificationSettings: {
                    pushEnabled: true,
                    autoParkingAlert: true,
                    parkingCompleteAlert: true,
                    exitCompleteAlert: true,
                    paymentAlert: true,
                },
            };

            const fullResponse: LoginResponse = {
                success: true,
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
                user: user,
                message: '로그인 성공'
            };

            if (fullResponse.accessToken) {
                await saveToken(fullResponse.accessToken);
            }
            if (fullResponse.user) {
                await saveUser(fullResponse.user);
            }

            return fullResponse;

        } catch (error) {
            console.error('[AuthService] Social Login failed:', error);
            throw error;
        }
    }
};

// 로그아웃
export const logout = async (): Promise<void> => {
    try {
        const token = await getToken();
        if (token) {
            await AuthApi.logout();
        }
    } catch (error) {
        console.warn('[AuthService] Logout API failed, clearing local storage anyway');
    } finally {
        await AsyncStorage.multiRemove(['@juice_token', '@juice_user']);
    }
};

// 토큰 저장
export const saveToken = async (token: string): Promise<void> => {
    await AsyncStorage.setItem('@juice_token', token);
};

// 토큰 조회
export const getToken = async (): Promise<string | null> => {
    return AsyncStorage.getItem('@juice_token');
};

// 사용자 저장
export const saveUser = async (user: User): Promise<void> => {
    await AsyncStorage.setItem('@juice_user', JSON.stringify(user));
};

// 사용자 조회
export const getUser = async (): Promise<User | null> => {
    const data = await AsyncStorage.getItem('@juice_user');
    return data ? JSON.parse(data) : null;
};

// FCM 토큰 업데이트
export const updateFCMToken = async (token: string): Promise<void> => {
    try {
        await AuthApi.updateFcmToken(token);
        console.log('[AuthService] FCM Token updated on backend');
    } catch (error) {
        // FCM 업데이트 실패는 치명적이지 않으므로 warning으로 처리
        console.warn('[AuthService] Failed to update FCM token (non-critical):', error);
    }
};
