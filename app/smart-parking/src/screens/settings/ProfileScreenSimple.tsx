/**
 * ProfileScreen - 다크 모드 지원
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image } from 'react-native';
import { User } from '../../types';
import { ThemeColors } from '../../../App';

interface ProfileScreenProps {
    colors: ThemeColors;
    user: User | null;
    onGoBack: () => void;
    onUpdateUser: (updates: Partial<User>) => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ colors, user, onGoBack, onUpdateUser }) => {
    const [newCarNum, setNewCarNum] = useState('');

    const handleAddOrUpdateCar = async () => {
        if (newCarNum.length < 4) {
            Alert.alert('오류', '차량 번호를 4자 이상 입력해주세요.');
            return;
        }

        try {
            // carNumbers (string[]) 대신 carNo (string[]) 사용
            // user.carNo는 string[] 타입임
            const currentCars = user?.carNo || [];
            if (currentCars.includes(newCarNum)) { // toUpperCase() 제거 (이미 입력시 처리하거나 서버 위임)
                Alert.alert('알림', '이미 등록된 차량 번호입니다.');
                return;
            }

            // API 호출
            const { CarApi } = require('../../api/car.api');
            if (!user?.id) return;

            const response = await CarApi.registerOrUpdateCar(user.id, { carNo: newCarNum });

            if (response.success) {
                Alert.alert('성공', '차량이 등록/수정 되었습니다.', [{
                    text: '확인', onPress: () => {
                        setNewCarNum('');
                        // 프로필 갱신 필요 (상위 컴포넌트에서 처리하거나, 여기서 직접 갱신 요청)
                        // onUpdateUser는 로컬 state만 바꾸는데, 실제로는 서버에서 다시 받아오는게 안전함.
                        // 일단 로컬 업데이트 흉내 + 알림
                        // User 타입의 carNo는 string[]
                        onUpdateUser({ carNo: [newCarNum] });
                    }
                }]);
            } else {
                Alert.alert('실패', response.message);
            }
        } catch (error: any) {
            Alert.alert('오류', error.message || '차량 등록 실패');
        }
    };

    const handleRemoveCar = async (carNum: string) => {
        Alert.alert('차량 삭제', `${carNum}를 삭제하시겠습니까?`, [
            { text: '취소', style: 'cancel' },
            {
                text: '삭제', style: 'destructive', onPress: async () => {
                    try {
                        const { CarApi } = require('../../api/car.api');
                        if (!user?.id) return;

                        const response = await CarApi.deleteCar(user.id, carNum);
                        if (response.success) {
                            Alert.alert('삭제 완료', '차량이 삭제되었습니다.', [{
                                text: '확인', onPress: () => {
                                    onUpdateUser({ carNo: [] }); // 빈 배열로 업데이트
                                }
                            }]);
                        } else {
                            Alert.alert('실패', response.message);
                        }
                    } catch (error: any) {
                        Alert.alert('오류', error.message || '차량 삭제 실패');
                    }
                }
            },
        ]);
    };

    const getProviderLabel = (provider?: string) => {
        if (!provider) return '알 수 없음';
        if (provider === 'phone') {
            // 휴대폰 로그인: 유저의 mobile 번호 표시 (없으면 '휴대폰 번호')
            return user?.mobile ? user.mobile : '휴대폰 번호';
        }
        if (provider === 'kakao') return '카카오톡 연동됨';
        if (provider === 'google') return 'Google 연동됨';
        return provider;
    };

    const hasCar = user?.carNo && user.carNo.length > 0 && user.carNo[0] !== '차량 없음';

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>프로필</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Card */}
                <View style={[styles.profileCard, { backgroundColor: colors.primary }]}>
                    <View style={[styles.avatarCircle, { backgroundColor: colors.background }]}>
                        <Image
                            source={require('../../../assets/appdefaultlogo.png')}
                            style={{ width: '100%', height: '100%', borderRadius: 40 }}
                            resizeMode="cover"
                        />
                    </View>
                    <Text style={[styles.profileName, { color: colors.textOnPrimary }]}>{user?.name || '사용자'}</Text>
                    <Text style={[styles.profileEmail, { color: colors.textOnPrimary }]}>{user?.email || '-'}</Text>
                    <View style={[styles.providerBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.providerText, { color: colors.textPrimary }]}>{getProviderLabel(user?.provider)}</Text>
                    </View>
                </View>

                {/* Car List (1인 1차량) */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>등록된 차량</Text>
                    <View style={[styles.carList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        {user?.carNo?.map((carNum: string, index: number) => (
                            <View key={index} style={[styles.carItem, { borderBottomColor: colors.divider }]}>
                                <View style={[styles.carIconCircle, { backgroundColor: colors.primary }]} />
                                <Text style={[styles.carNumber, { color: colors.textPrimary }]}>{carNum}</Text>
                                {/* 삭제 버튼 비활성화 (요청 사항) */}
                            </View>
                        ))}
                        {(!hasCar) && (
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>등록된 차량이 없습니다</Text>
                        )}
                    </View>
                </View>

                {/* Add/Edit Car - DISABLED per user request */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>차량 정보 수정</Text>
                    <View style={styles.addCarRow}>
                        <TextInput
                            style={[styles.addCarInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
                            value={newCarNum}
                            editable={true}
                            placeholder="변경할 차량 번호 입력 (예: 12가3456)"
                            placeholderTextColor={colors.textDisabled}
                            onChangeText={setNewCarNum}
                        />
                        <TouchableOpacity
                            style={[styles.addButton, { backgroundColor: colors.primary }]}
                            onPress={handleAddOrUpdateCar}
                        >
                            <Text style={[styles.addButtonText, { color: colors.textOnPrimary }]}>수정</Text>
                        </TouchableOpacity>
                    </View>
                    {hasCar && (
                        <Text style={{ marginTop: 8, fontSize: 12, color: colors.textSecondary }}>
                            * 현재 1인 1차량 정책으로, 수정 시 기존 차량 번호가 변경됩니다.
                        </Text>
                    )}
                </View>

                {/* Account Info */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>계정 정보</Text>
                    <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>가입일</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
                            </Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>로그인 방식</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{getProviderLabel(user?.provider)}</Text>
                        </View>
                    </View>
                </View>
            </ScrollView >
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1 },
    profileCard: { margin: 16, borderRadius: 20, padding: 32, alignItems: 'center' },
    avatarCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    avatarText: { fontSize: 32, fontWeight: '700' },
    profileName: { fontSize: 24, fontWeight: '700' },
    profileEmail: { fontSize: 14, opacity: 0.8, marginTop: 4 },
    providerBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
    providerText: { fontSize: 12, fontWeight: '600' },
    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    carList: { borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
    carItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
    carIconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    carIcon: { fontSize: 20 },
    carNumber: { flex: 1, fontSize: 16, fontWeight: '600' },
    removeButton: { paddingHorizontal: 12, paddingVertical: 6 },
    removeButtonText: { fontSize: 14, color: '#EF4444', fontWeight: '600' },
    emptyText: { padding: 24, textAlign: 'center' },
    addCarRow: { flexDirection: 'row', alignItems: 'center' },
    addCarInput: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 14, paddingHorizontal: 16, fontSize: 16, marginRight: 8 },
    addButton: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20 },
    addButtonDisabled: { opacity: 0.5 },
    addButtonText: { fontSize: 16, fontWeight: '600' },
    infoCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
    infoLabel: { fontSize: 14 },
    infoValue: { fontSize: 14, fontWeight: '600' },
});

export default ProfileScreen;
