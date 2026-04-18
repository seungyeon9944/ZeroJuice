import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
// import * as Kakao from 'expo-auth-session/providers/kakao'; // Not used directly
import { ThemeColors } from '../../../App';
import { AuthProvider } from '../../types';
import { CustomModal } from '../../components/common';

WebBrowser.maybeCompleteAuthSession();

// Kakao Endpoint
const KAKAO_DISCOVERY = {
    authorizationEndpoint: 'https://kauth.kakao.com/oauth/authorize',
    tokenEndpoint: 'https://kauth.kakao.com/oauth/token',
};

interface LoginScreenProps {
    colors: ThemeColors;
    onLogin: (provider: AuthProvider, token?: string) => Promise<boolean>;
    onPhoneLogin: (phone: string, password: string) => Promise<boolean>;
    onNavigateSignup: () => void;
    onNavigateForgotPassword: () => void;
    isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
    colors,
    onLogin,
    onPhoneLogin,
    onNavigateSignup,
    onNavigateForgotPassword,
    isLoading = false,
}) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localLoading, setLocalLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info'; action?: () => void }>({
        title: '',
        message: '',
        type: 'info'
    });




    // --- Kakao Login Setup (Native SDK) ---
    // @react-native-seoul/kakao-login
    // --- Kakao Login Setup (Native SDK) ---
    // @react-native-seoul/kakao-login

    // 키 해시 확인용 (개발 단계에서만 사용)
    React.useEffect(() => {
        const checkHash = async () => {
            try {
                const hash = await require('@react-native-seoul/kakao-login').getProfile();
                // Note: getProfile fails if not logged in. 
                // Using a try-catch block for safety, but we really need 'getHash'.
                // If 'getHash' is not exported directly, we might need to rely on the error message or use `keytool`.
                // Actually, let's just ask the user to use keytool first if possible, or try to find if the lib exports it.
                // Most versions export `getHash`.
            } catch (e) { }
        };
        // Better approach: Just ask usage of `getHash`
        require('@react-native-seoul/kakao-login').getProfile().catch((e: any) => console.log('Kakao SDK Init Check'));
    }, []);

    const handleKakaoLogin = async () => {
        setLocalLoading(true);
        try {
            const token = await require('@react-native-seoul/kakao-login').login();
            if (token) {
                console.log('Kakao Login Success:', token.accessToken);
                handleSocialLoginSuccess('kakao', token.accessToken);
            }
        } catch (error: any) {
            console.error('Kakao Login Error:', error);
            // 에러 메시지에서 키 해시를 찾을 수도 있으므로 로그를 자세히 출력
            if (error.code === 'E_CANCELLED_OPERATION') {
                // User cancelled, do nothing
            } else {
                const errorMessage = error.message || JSON.stringify(error);
                showModal('오류', `카카오 로그인 실패: ${errorMessage}`, 'error');
            }
        } finally {
            setLocalLoading(false);
        }
    };


    const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info', action?: () => void) => {
        setModalConfig({ title, message, type, action });
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalConfig.action) {
            modalConfig.action();
        }
    };

    // Ref for focus navigation
    const passwordInputRef = useRef<TextInput>(null);

    const formatPhoneNumber = (text: string) => {
        const numbers = text.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (text: string) => {
        setPhone(formatPhoneNumber(text));
    };

    const handleLogin = async () => {
        if (!phone || phone.length < 12) {
            showModal('알림', '휴대폰 번호를 입력해주세요.', 'error');
            return;
        }
        if (!password || password.length < 4) {
            showModal('알림', '비밀번호를 입력해주세요.', 'error');
            return;
        }

        setLocalLoading(true);
        try {
            // Remove hyphens before sending to API
            const success = await onPhoneLogin(phone.replace(/-/g, ''), password);
            if (!success) {
                showModal('로그인 실패', '휴대폰 번호 또는 비밀번호를 확인해주세요.', 'error');
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
            showModal('오류', errorMessage, 'error');
        } finally {
            setLocalLoading(false);
        }
    };

    const handleSocialLoginSuccess = async (provider: AuthProvider, token?: string) => {
        if (!token) return;

        setLocalLoading(true);
        try {
            const success = await onLogin(provider, token);
            if (!success) {
                showModal('로그인 실패', `${provider} 로그인을 완료할 수 없습니다.`, 'error');
            }
        } catch (error) {
            showModal('오류', '소셜 로그인 중 오류가 발생했습니다.', 'error');
        } finally {
            setLocalLoading(false);
        }
    };

    const loading = isLoading || localLoading;

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Logo */}
            <View style={styles.logoSection}>
                <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
                    <Image source={require('../../../assets/zerojuiceLoginLogo.png')}
                        style={{ width: 50, height: 60 }} />{/* 이게 젤 이쁨 50 60 */}
                </View>
                <Text style={[styles.logoTitle, { color: colors.primary }]}>제로주스</Text>
                <Text style={[styles.tagline, { color: colors.textSecondary }]}>
                    <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>주</Text>차{' '}
                    <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>스</Text>트레스를{' '}
                    <Text style={{ color: '#FFD700', fontWeight: 'bold' }}>제로</Text>로!
                </Text>
            </View>

            {/* Login Form */}
            <View style={styles.formSection}>
                {/* Phone Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="휴대폰 번호"
                        placeholderTextColor={colors.textDisabled}
                        value={phone}
                        onChangeText={handlePhoneChange}
                        keyboardType="phone-pad"
                        maxLength={13}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                        blurOnSubmit={false}
                    />
                </View>

                {/* Password Input */}
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        ref={passwordInputRef}
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="비밀번호"
                        placeholderTextColor={colors.textDisabled}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
                        <Text style={[styles.togglePassword, { color: colors.textSecondary }]}>
                            {showPassword ? '숨기기' : '보기'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Login Button */}
                <TouchableOpacity
                    style={[styles.loginButton, { backgroundColor: colors.primary }]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                        <Text style={[styles.loginButtonText, { color: colors.textOnPrimary }]}>로그인</Text>
                    )}
                </TouchableOpacity>

                {/* Links */}
                <View style={styles.linksRow}>
                    <TouchableOpacity onPress={onNavigateSignup}>
                        <Text style={[styles.linkText, { color: colors.textSecondary }]}>회원가입</Text>
                    </TouchableOpacity>
                    <Text style={[styles.linkDivider, { color: colors.border }]}>|</Text>
                    <TouchableOpacity onPress={onNavigateForgotPassword}>
                        <Text style={[styles.linkText, { color: colors.textSecondary }]}>비밀번호 찾기</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Social Login */}
            <View style={styles.socialSection}>
                <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textSecondary }]}>또는</Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                </View>

                <View style={styles.socialButtons}>
                    {/* Kakao Login */}
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: '#FEE500', marginRight: 12 }]}
                        onPress={handleKakaoLogin}
                        disabled={loading}
                    >
                        <Text style={[styles.socialButtonText, { color: '#3C1E1E' }]}>카카오 로그인</Text>
                    </TouchableOpacity>


                </View>
            </View>

            {/* Footer */}
            <Text style={[styles.footer, { color: colors.textDisabled }]}>
                Smart Parking v1.0
            </Text>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
                colors={colors}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
    logoSection: { alignItems: 'center', marginBottom: 48 },
    logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    logoText: { fontSize: 36, fontWeight: '700' },
    logoTitle: { fontSize: 28, fontWeight: '700' },
    tagline: { fontSize: 14, marginTop: 8 },
    formSection: { marginBottom: 24 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1,
        paddingHorizontal: 16, marginBottom: 12, height: 56,
    },
    input: { flex: 1, fontSize: 16 },
    toggleButton: { paddingHorizontal: 8, paddingVertical: 4 },
    togglePassword: { fontSize: 14 },
    loginButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    loginButtonText: { fontSize: 18, fontWeight: '700' },
    linksRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
    linkText: { fontSize: 14, paddingHorizontal: 12 },
    linkDivider: { fontSize: 12 },
    socialSection: { marginBottom: 24 },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { marginHorizontal: 16, fontSize: 14 },
    socialButtons: { flexDirection: 'row', justifyContent: 'center' },
    socialButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12, paddingVertical: 16,
    },
    socialButtonText: { fontSize: 16, fontWeight: '600' },
    kakaoButton: { // Deprecated
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        borderRadius: 12, paddingVertical: 16,
    },
    kakaoButtonText: { fontSize: 16, fontWeight: '600', color: '#3C1E1E' },
    footer: { textAlign: 'center', fontSize: 12, marginTop: 16 },
});

export default LoginScreen;
