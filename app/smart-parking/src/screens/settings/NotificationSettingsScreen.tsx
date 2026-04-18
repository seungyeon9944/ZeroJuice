/**
 * NotificationSettingsScreen - 알림 설정 화면
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { User } from '../../types';
import { Card } from '../../components';
import { ThemeColors } from '../../../App';
import { AuthApi } from '../../api/auth.api';
import { registerForPushNotificationsAsync } from '../../services/NotificationService';

interface NotificationSettingsScreenProps {
    colors: ThemeColors;
    user: User | null;
    onGoBack: () => void;
    onUpdateUser: (updates: Partial<User>) => void;
}

const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
    colors,
    user,
    onGoBack,
    onUpdateUser,
}) => {
    const settings = user?.notificationSettings || {
        pushEnabled: true,
        autoParkingAlert: true,
        parkingCompleteAlert: true,
        exitCompleteAlert: true,
        paymentAlert: true,
    };

    useEffect(() => {
        const syncToggleWithStorage = async () => {
            try {
                // 1. 내 폰에 저장된 진짜 설정값 확인 ('false'인지?)
                const savedSetting = await AsyncStorage.getItem('isPushEnabled');

                // 2. 내 폰엔 꺼져있다고 되어있는데(false), 화면(settings)은 켜져(true) 있다면?
                if (savedSetting === 'false' && settings.pushEnabled) {
                    console.log('[Settings] UI Sync: Force OFF based on local storage');

                    // 3. 화면의 스위치를 강제로 끔 (서버 요청 없이 UI만 업데이트)
                    onUpdateUser({
                        notificationSettings: {
                            ...settings,
                            pushEnabled: false,
                            // 마스터 스위치가 꺼지면 아래 세부 알림도 다 끄는 게 자연스러움
                            autoParkingAlert: false,
                            parkingCompleteAlert: false,
                            exitCompleteAlert: false,
                            paymentAlert: false,
                        }
                    });
                }
            } catch (e) {
                console.log('[Settings] Failed to sync toggle state:', e);
            }
        };

        syncToggleWithStorage();
    }, []);

    const updateSetting = async (key: keyof typeof settings, value: boolean) => {
        const newSettings = { ...settings, [key]: value };

        // pushEnabled가 꺼지면 모든 알림 비활성화
        if (key === 'pushEnabled') {
            try {
                if (value) {
                    // ON: 권한 체크 먼저 수행
                    const { status: existingStatus } = await Notifications.getPermissionsAsync();
                    let finalStatus = existingStatus;

                    if (existingStatus !== 'granted') {
                        const { status } = await Notifications.requestPermissionsAsync();
                        finalStatus = status;
                    }

                    if (finalStatus !== 'granted') {
                        Alert.alert(
                            '알림 권한 필요',
                            '알림을 받으려면 설정에서 권한을 허용해주세요.',
                            [
                                { text: '취소', style: 'cancel' },
                                { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                            ]
                        );
                        // 권한 없으면 스위치 켜지 않음 (함수 종료)
                        return;
                    }

                    // 권한 획득 후 토큰 발급 및 등록
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                        await AuthApi.updateFcmToken(token);
                        await AsyncStorage.setItem('isPushEnabled', 'true');
                        console.log('[Settings] FCM Token registered & saved locally');
                    }
                } else {
                    // OFF: 토큰 삭제 (빈 문자열 전송)
                    await AuthApi.updateFcmToken('');
                    await AsyncStorage.setItem('isPushEnabled', 'false');
                    console.log('[Settings] FCM Token removed & disabled locally');
                }
            } catch (error) {
                console.error('[Settings] Failed to update FCM token:', error);
                // 에러 처리: 필요시 UI에 반영하거나 조용히 실패
            }

            if (!value) {
                onUpdateUser({
                    notificationSettings: {
                        ...newSettings,
                        autoParkingAlert: false,
                        parkingCompleteAlert: false,
                        exitCompleteAlert: false,
                        paymentAlert: false,
                    }
                });
                return;
            }
        }

        onUpdateUser({ notificationSettings: newSettings });
    };

    const renderSettingItem = (
        icon: string,
        title: string,
        description: string,
        key: keyof typeof settings,
        disabled: boolean = false
    ) => (
        <View style={[styles.settingItem, disabled && { opacity: 0.5 }]}>
            <Text style={styles.settingIcon}>{icon}</Text>
            <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{title}</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description}</Text>
            </View>
            <Switch
                value={settings[key]}
                onValueChange={(value) => updateSetting(key, value)}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={settings[key] ? colors.background : '#f4f3f4'}
                disabled={disabled}
            />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>알림 설정</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* 마스터 스위치 */}
                <Card colors={colors} variant="outlined" style={styles.masterCard}>
                    <View style={styles.masterRow}>
                        <View style={styles.masterInfo}>
                            <View>
                                <Text style={[styles.masterTitle, { color: colors.textPrimary }]}>푸시 알림</Text>
                                <Text style={[styles.masterDescription, { color: colors.textSecondary }]}>
                                    모든 알림 받기
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={settings.pushEnabled}
                            onValueChange={(value) => updateSetting('pushEnabled', value)}
                            trackColor={{ false: colors.border, true: colors.primary }}
                            thumbColor={settings.pushEnabled ? colors.background : '#f4f3f4'}
                        />
                    </View>
                </Card>

                {/* 개별 알림 설정 */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>주차 알림</Text>
                <Card colors={colors} variant="outlined" style={styles.settingsCard}>
                    {renderSettingItem(
                        '',
                        '자동주차 가능 알림',
                        '주차장 진입 시 자동주차 가능 여부 알림',
                        'autoParkingAlert',
                        !settings.pushEnabled
                    )}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {renderSettingItem(
                        '',
                        '주차 완료 알림',
                        '자동 주차가 완료되면 알림',
                        'parkingCompleteAlert',
                        !settings.pushEnabled
                    )}
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    {renderSettingItem(
                        '',
                        '출차 완료 알림',
                        '자동 출차가 완료되면 알림',
                        'exitCompleteAlert',
                        !settings.pushEnabled
                    )}
                </Card>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>결제 알림</Text>
                <Card colors={colors} variant="outlined" style={styles.settingsCard}>
                    {renderSettingItem(
                        '',
                        '결제 알림',
                        '결제 완료 및 영수증 알림',
                        'paymentAlert',
                        !settings.pushEnabled
                    )}
                </Card>

                {/* 안내 */}
                <View style={styles.notice}>
                    <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                        알림 설정은 디바이스의 시스템 설정에서도 변경할 수 있습니다.
                    </Text>
                </View>
            </ScrollView>
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
    content: { flex: 1, padding: 16 },
    masterCard: { marginBottom: 24 },
    masterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    masterInfo: { flexDirection: 'row', alignItems: 'center' },
    masterIcon: { fontSize: 32, marginRight: 16 },
    masterTitle: { fontSize: 18, fontWeight: '700' },
    masterDescription: { fontSize: 14, marginTop: 2 },
    sectionTitle: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
    settingsCard: { marginBottom: 24, padding: 0 },
    settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    settingIcon: { fontSize: 24, marginRight: 14 },
    settingText: { flex: 1 },
    settingTitle: { fontSize: 16, fontWeight: '600' },
    settingDescription: { fontSize: 13, marginTop: 2 },
    divider: { height: 1, marginLeft: 54 },
    notice: { padding: 16 },
    noticeText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

export default NotificationSettingsScreen;
