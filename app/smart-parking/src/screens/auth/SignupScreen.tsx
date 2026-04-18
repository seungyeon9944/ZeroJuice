/**
 * SignupScreen - 회원가입 화면
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { ThemeColors } from '../../../App';
import { CustomModal } from '../../components/common';
import { signup } from '../../services/authService';

interface SignupScreenProps {
    colors: ThemeColors;
    onGoBack: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ colors, onGoBack }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [carNumber, setCarNumber] = useState('');
    const [loading, setLoading] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info'; action?: () => void }>({
        title: '',
        message: '',
        type: 'info'
    });

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

    const formatPhoneNumber = (text: string) => {
        const numbers = text.replace(/[^0-9]/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handleSignup = async () => {
        if (!phone || phone.length < 12) {
            showModal('알림', '휴대폰 번호를 입력해주세요.', 'error');
            return;
        }
        if (!password || password.length < 6) {
            showModal('알림', '비밀번호는 6자 이상이어야 합니다.', 'error');
            return;
        }
        if (password !== confirmPassword) {
            showModal('알림', '비밀번호가 일치하지 않습니다.', 'error');
            return;
        }
        if (!carNumber) {
            showModal('알림', '차량 번호를 입력해주세요.', 'error');
            return;
        }

        setLoading(true);
        try {
            await signup({
                phone: phone.replace(/-/g, ''),
                password,
                carNumber: carNumber.toUpperCase(),
            });

            showModal('가입 완료', '회원가입이 완료되었습니다.\n로그인 후 이용해주세요.', 'success', () => onGoBack());
        } catch (error: any) {
            // Backend specific error message
            // [API] Error 400: {"error": {"errorCode": "INVALID_INPUT", "message": "올바른 차량번호 형식이 아닙니다."}, "success": false}
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || '회원가입 중 오류가 발생했습니다.';
            showModal('오류', errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>회원가입</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Phone */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>휴대폰 번호 *</Text>
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

                {/* Password */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>비밀번호 *</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="6자 이상"
                        placeholderTextColor={colors.textDisabled}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {/* Confirm Password */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>비밀번호 확인 *</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="비밀번호 재입력"
                        placeholderTextColor={colors.textDisabled}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                    />
                </View>

                {/* Car Number */}
                <Text style={[styles.label, { color: colors.textSecondary }]}>차량 번호 *</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                        style={[styles.input, { color: colors.textPrimary }]}
                        placeholder="12가3456"
                        placeholderTextColor={colors.textDisabled}
                        value={carNumber}
                        onChangeText={(t) => setCarNumber(t.toUpperCase())}
                        autoCapitalize="characters"
                    />
                </View>

                {/* Signup Button */}
                <TouchableOpacity
                    style={[styles.signupButton, { backgroundColor: colors.primary }]}
                    onPress={handleSignup}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                        <Text style={[styles.signupButtonText, { color: colors.textOnPrimary }]}>가입하기</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
                colors={colors}
            />
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
    label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
    inputContainer: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, height: 52 },
    input: { flex: 1, fontSize: 16, height: '100%' },
    signupButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
    signupButtonText: { fontSize: 18, fontWeight: '700' },
});

export default SignupScreen;
