/**
 * SettingsScreen - 다크 모드 지원 (토글 포함)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Image } from 'react-native';
import { CustomModal } from '../../components/common';
import { User } from '../../types';
import { ThemeColors } from '../../../App';

type ScreenName =
    | 'Splash' | 'Login' | 'Signup' | 'ForgotPassword'
    | 'MainDashboard' | 'ParkingProgress' | 'ParkingStatus'
    | 'Payment' | 'Settings' | 'Profile' | 'NotificationSettings';

interface SettingsScreenProps {
    colors: ThemeColors;
    user: User | null;
    onNavigate: (screen: ScreenName) => void;
    onGoBack: () => void;
    onLogout: () => void;
    isDark?: boolean;
    onToggleTheme?: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ colors, user, onNavigate, onGoBack, onLogout, isDark = false, onToggleTheme }) => {
    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info'; action?: () => void; confirmText?: string; onCancel?: () => void; cancelText?: string }>({
        title: '',
        message: '',
        type: 'info'
    });

    const getProviderLabel = (provider?: string) => {
        if (!provider) return '알 수 없음';
        if (provider === 'phone') {
            return user?.mobile ? user.mobile : '휴대폰 번호';
        }
        if (provider === 'kakao') return '카카오톡 연동됨';
        if (provider === 'google') return 'Google 연동됨';
        return provider;
    };
    const showModal = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' = 'info',
        action?: () => void,
        confirmText: string = '확인',
        onCancel?: () => void,
        cancelText?: string
    ) => {
        setModalConfig({ title, message, type, action, confirmText, onCancel, cancelText });
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalConfig.action) {
            modalConfig.action();
        }
    };

    const handleLogout = () => {
        showModal(
            '로그아웃',
            '정말 로그아웃 하시겠습니까?',
            'info',
            onLogout,
            '로그아웃',
            () => setModalVisible(false),
            '취소'
        );
    };


    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>설정</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.background, overflow: 'hidden' }]}>
                        <Image
                            source={require('../../../assets/appdefaultlogo.png')}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: colors.textOnPrimary }]}>{user?.name || '사용자'}</Text>
                        <Text style={[styles.profileEmail, { color: colors.textOnPrimary }]}>{getProviderLabel(user?.provider)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => onNavigate('Profile')} style={[styles.editButton, { backgroundColor: colors.background }]}>
                        <Text style={[styles.editButtonText, { color: colors.textPrimary }]}>편집</Text>
                    </TouchableOpacity>
                </View>

                {/* Account */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>계정</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.item} onPress={() => onNavigate('Profile')}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>프로필</Text><Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{getProviderLabel(user?.provider)}</Text></View>
                            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <TouchableOpacity style={styles.item} onPress={() => onNavigate('Profile')}>
                            <View style={styles.itemText}>
                                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>차량 관리</Text>
                                <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
                                    {user?.carNo && user.carNo.length > 0 ? user.carNo[0] : '미등록'}
                                </Text>
                            </View>
                            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>앱 설정</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.item} onPress={() => onNavigate('NotificationSettings')}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>알림 설정</Text></View>
                            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <View style={styles.item}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>다크 모드</Text><Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>{isDark ? '켜짐' : '꺼짐'}</Text></View>
                            <Switch value={isDark} onValueChange={onToggleTheme} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={isDark ? colors.background : '#f4f3f4'} />
                        </View>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>정보</Text>
                    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.item} onPress={() => showModal('이용약관',
                            '제1조 (목적)\n본 약관은 주식회사 제로주스(이하 "회사")가 제공하는 스마트 주차 서비스(이하 "서비스")의 이용조건 및 절차, 회사와 회원의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.\n\n제2조 (용어의 정의)\n1. "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.\n2. "서비스"란 회사가 모바일 앱을 통해 제공하는 주차 관제, 요금 결제 및 관련 제반 서비스를 의미합니다.\n\n(이하 생략 - 상세 내용은 홈페이지 참조)')}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>이용약관</Text></View>
                            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <TouchableOpacity style={styles.item} onPress={() => showModal('개인정보처리방침',
                            '1. 개인정보의 수집 및 이용 목적\n회사는 주차 서비스 제공, 본인 확인, 결제 처리, 고객 상담 등을 위해 개인정보를 수집합니다.\n\n2. 수집하는 개인정보의 항목\n- 필수항목: 휴대전화번호, 차량번호, 결제정보\n- 선택항목: 이메일\n\n3. 개인정보의 보유 및 이용 기간\n회사는 회원 탈퇴 시까지 개인정보를 보유하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 기간 동안 보관합니다.\n\n(이하 생략 - 상세 내용은 홈페이지 참조)')}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>개인정보처리방침</Text></View>
                            <Text style={[styles.chevron, { color: colors.textDisabled }]}>›</Text>
                        </TouchableOpacity>
                        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                        <View style={styles.item}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: colors.textPrimary }]}>앱 버전</Text><Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>v1.0.0</Text></View>
                        </View>
                    </View>
                </View>

                {/* Logout */}
                <View style={styles.section}>
                    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <TouchableOpacity style={styles.item} onPress={handleLogout}>
                            <View style={styles.itemText}><Text style={[styles.itemTitle, { color: '#EF4444' }]}>로그아웃</Text></View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: colors.textSecondary }]}>Smart Parking v1.0.0</Text>
                </View>
            </ScrollView>

            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
                onCancel={modalConfig.onCancel}
                cancelText={modalConfig.cancelText}
                colors={colors}
                confirmText={modalConfig.confirmText}
            />
            {/* 
               Correction: CustomModal's button calls `onClose`. 
               If we want the button to trigger an action (like Logout), `onClose` should trigger it, 
               but then we can't cancel.
               
               Refactoring CustomModal logic on the fly:
               If I pass `onClose` as `() => { handleModalClose(); }`, the button closes it and triggers action.
               But the backdrop also triggers `onRequestClose` which usually calls `onClose`.
               
               For Logout, this is risky. If user clicks backdrop, they might accidentally logout if I bind action to onClose.
               
               Let's stick to the current plan: 
               For "Info" modals (Terms), closing is fine.
               For "Action" modals (Logout), we need a specific confirmation.
               
               However, I'm limited to the existing `CustomModal`.
               Let's modify `CustomModal` usage:
               If I want to Confirm, the user clicks the BUTTON.
               If I want to Cancel, the user clicks BACKDROP (if enabled) or specific Cancel button.
               
               Analyzing CustomModal:
               It has one button: `onPress={onClose}`.
               And `onRequestClose={onClose}`.
               
               So currently, clicking button OR backdrop does the complete same thing.
               
               Workaround: 
               For now, I will bind the action to the modal close. 
               "Logout" button -> Closes Modal -> Triggers Logout.
               To cancel, user currently HAS NO OPTION if the button is the only way (Backdrop closes too).
               This is bad UX for Logout.
               
               I should probably add a "Cancel" button to CustomModal or just rely on the user confirming by clicking the single button.
               Actually, a better UX for "Yellow Theme" is to have two buttons for actions.
               
               Since I am "Applying Yellow Theme", maybe I should update CustomModal to support `onCancel` (optional second button).
               But the user asked to "Apply Yellow Theme", not necessarily "redesign logic".
               However, "Logout" needs confirmation.
               
               Let's update CustomModal to support `cancelText` and `onCancel`.
               Wait, I should check if I can edit CustomModal again.
               Yes, I can.
               
               Let's hold off on this file edit and Update CustomModal first to support two buttons.
            */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1 },
    profileCard: { flexDirection: 'row', alignItems: 'center', margin: 16, borderRadius: 16, padding: 20 },
    avatarCircle: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 24, fontWeight: '700' },
    profileInfo: { flex: 1, marginLeft: 16 },
    profileName: { fontSize: 18, fontWeight: '700' },
    profileEmail: { fontSize: 14, opacity: 0.8, marginTop: 2 },
    editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
    editButtonText: { fontSize: 14, fontWeight: '600' },
    section: { marginTop: 8, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' },
    sectionCard: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    divider: { height: 1, marginLeft: 16 },
    itemText: { flex: 1 },
    itemTitle: { fontSize: 16 },
    itemSubtitle: { fontSize: 13, marginTop: 2 },
    chevron: { fontSize: 20 },
    footer: { alignItems: 'center', paddingVertical: 32 },
    footerText: { fontSize: 14 },
});

export default SettingsScreen;
