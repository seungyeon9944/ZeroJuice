/**
 * ForgotPasswordScreen - 비밀번호 찾기 화면
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ThemeColors } from '../../../App';

interface ForgotPasswordScreenProps {
    colors: ThemeColors;
    onResetPassword: (phone: string) => Promise<boolean>;
    onGoBack: () => void;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ colors, onResetPassword, onGoBack }) => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const formatPhoneNumber = (text: string) => {
        const numbers = text.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleReset = async () => {
        if (!phone || phone.length < 12) {
            Alert.alert('알림', '휴대폰 번호를 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const success = await onResetPassword(phone.replace(/-/g, ''));
            if (success) {
                setSent(true);
            } else {
                Alert.alert('알림', '등록되지 않은 휴대폰 번호입니다.');
            }
        } catch {
            Alert.alert('오류', '요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.successContainer}>
                    <Text style={styles.successEmoji}>[V]</Text>
                    <Text style={[styles.successTitle, { color: colors.textPrimary }]}>인증번호 발송 완료</Text>
                    <Text style={[styles.successMessage, { color: colors.textSecondary }]}>
                        {phone}로 임시 비밀번호를 발송했습니다.{'\n'}SMS를 확인해주세요.
                    </Text>
                    <TouchableOpacity
                        style={[styles.backToLoginButton, { backgroundColor: colors.primary }]}
                        onPress={onGoBack}
                    >
                        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>로그인으로 돌아가기</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>비밀번호 찾기</Text>
                <View style={{ width: 44 }} />
            </View>

            <View style={styles.content}>
                <Text style={[styles.description, { color: colors.textSecondary }]}>
                    가입 시 등록한 휴대폰 번호를 입력하시면{'\n'}임시 비밀번호를 SMS로 발송합니다.
                </Text>

                <Text style={[styles.label, { color: colors.textSecondary }]}>휴대폰 번호</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="010-0000-0000"
                        placeholderTextColor={colors.textDisabled}
                        value={phone}
                        onChangeText={(t) => setPhone(formatPhoneNumber(t))}
                        keyboardType="phone-pad"
                        maxLength={13}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.resetButton, { backgroundColor: colors.primary }]}
                    onPress={handleReset}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                        <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>임시 비밀번호 발송</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1, padding: 24 },
    description: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
    inputContainer: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, height: 52 },
    input: { flex: 1, fontSize: 16, height: '100%' },
    resetButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
    buttonText: { fontSize: 16, fontWeight: '700' },
    successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    successEmoji: { fontSize: 64, marginBottom: 24 },
    successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
    successMessage: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32 },
    backToLoginButton: { borderRadius: 12, paddingVertical: 16, paddingHorizontal: 32 },
});

export default ForgotPasswordScreen;
