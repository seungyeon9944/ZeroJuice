/**
 * MainDashboard - FUNC-010 (세로형 대시보드)
 * 차량 선택 / 관제 맵 / 정보 패널 / 액션 버튼
 */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Animated, TextInput, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import { User, ParkingSession, ParkingStatus } from '../../types';
import IndoorMap, { MapStatus } from '../../components/map/IndoorMap';
import { ThemeColors } from '../../../App';
import { useParking } from '../../contexts';

type ScreenName = 'Settings' | 'Profile' | 'Payment' | 'ParkingProgress';

interface MainDashboardProps {
    colors: ThemeColors;
    user: User | null;
    currentSession: ParkingSession | null;
    onNavigate: (screen: ScreenName) => void;
    onLogout: () => void;
    onStartParking: () => void;
    onRequestExit: () => void;
    onPayAndExit: () => void;
    onRefreshProfile: () => void;
}

const MainDashboard: React.FC<MainDashboardProps> = ({
    colors,
    user,
    currentSession,
    onNavigate,
    onStartParking,
    onRequestExit,
    onPayAndExit,
    onRefreshProfile,
}) => {
    const { getFee } = useParking();
    const [selectedCarIndex, setSelectedCarIndex] = useState(0);
    const [showCarPicker, setShowCarPicker] = useState(false);
    const [showCarRegisterModal, setShowCarRegisterModal] = useState(false);
    const [newCarNumber, setNewCarNumber] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    // Derived State
    const carNumbers = user?.carNo || [];
    // 선택된 차가 없거나 인덱스가 범위 밖이면 첫번째 차, 그마저도 없으면 '차량 없음'
    const selectedCar = (carNumbers.length > 0 && carNumbers[selectedCarIndex])
        ? carNumbers[selectedCarIndex] : (carNumbers.length > 0 ? carNumbers[0] : '차량 없음');

    // Effect: 차량 목록 변경 시 인덱스 조정
    useEffect(() => {
        if (selectedCarIndex >= carNumbers.length) {
            setSelectedCarIndex(0);
        }
    }, [carNumbers.length]);

    const handleCarSelect = (index: number) => {
        setSelectedCarIndex(index);
        setShowCarPicker(false);
    };

    const isParking = !!currentSession;

    const getMapStatus = (): MapStatus => {
        if (!currentSession) return 'IDLE';
        if (currentSession.status === 'PARKED') return 'PARKED';
        if (currentSession.status === 'EXITING' || currentSession.status === 'COMPLETED') return 'EXITING';
        return 'ENTERING';
    };

    // Derived Parking State (Fix for Missing Variables)
    // 실제로는 currentSession에서 계산해야 함
    const isParked = !!currentSession && currentSession.status === 'PARKED';
    const currentFee = getFee()?.finalFee ?? 0;

    // 시간 계산 (데모용)
    const [elapsedTime, setElapsedTime] = useState('00:00');
    useEffect(() => {
        const enteredAt = currentSession?.enteredAt;
        if (!enteredAt) {
            setElapsedTime('00:00');
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(enteredAt).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((now - start) / 1000); // seconds
            if (diff < 0) {
                setElapsedTime('00:00');
                return;
            }
            const mins = Math.floor(diff / 60);
            const secs = diff % 60;
            setElapsedTime(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, [currentSession]);

    const handleRegisterCar = async () => {
        if (!newCarNumber.trim()) {
            Alert.alert('알림', '차량 번호를 입력해주세요.');
            return;
        }

        setIsRegistering(true);
        try {
            // Import CarApi dynamically or assume it's available
            const { CarApi } = require('../../api/car.api');
            const response = await CarApi.registerOrUpdateCar(user!.id, { carNo: newCarNumber });

            if (response.success) {
                Alert.alert('성공', '차량이 등록되었습니다.', [
                    {
                        text: '확인', onPress: () => {
                            setShowCarRegisterModal(false);
                            // Call refresh profile
                            onRefreshProfile();
                        }
                    }
                ]);
            } else {
                Alert.alert('오류', response.message || '차량 등록 실패');
            }
        } catch (error: any) {
            Alert.alert('오류', '차량 등록 중 문제가 발생했습니다.\n' + error.message);
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* ... Header ... */}
            <View style={[styles.header, { backgroundColor: colors.surface }]}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.greeting, { color: colors.textPrimary }]}>안녕하세요!</Text>
                    <Text style={[styles.userName, { color: colors.textSecondary }]}>{user?.name || '사용자'}님</Text>
                </View>
                <TouchableOpacity
                    style={[styles.settingsButton, { backgroundColor: colors.background }]}
                    onPress={() => onNavigate('Settings')}
                >
                    <Text style={[styles.settingsIcon, { color: colors.textSecondary }]}>⚙</Text>
                </TouchableOpacity>
            </View>

            {/* 1. 차량 선택 */}
            <TouchableOpacity
                style={[styles.carSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowCarPicker(!showCarPicker)}
            >
                <View style={styles.carInfo}>
                    <Text style={[styles.carLabel, { color: colors.textSecondary }]}>선택된 차량</Text>
                    <Text style={[styles.carNumber, { color: colors.textPrimary }]}>{selectedCar}</Text>
                </View>
                <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>▼</Text>
            </TouchableOpacity>

            {/* 차량 선택 드롭다운 */}
            {showCarPicker && (
                <View style={[styles.carPickerDropdown, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {carNumbers.map((car, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.carPickerItem, index === selectedCarIndex && { backgroundColor: colors.primary + '20' }]}
                            onPress={() => handleCarSelect(index)}
                        >
                            <Text style={[styles.carPickerText, { color: colors.textPrimary }]}>{car}</Text>
                            {index === selectedCarIndex && <Text style={{ color: colors.primary }}>선택됨</Text>}
                        </TouchableOpacity>
                    ))}
                    {/* Add Car Button */}
                    <TouchableOpacity
                        style={[styles.carPickerItem, { borderTopWidth: 1, borderTopColor: colors.border }]}
                        onPress={() => {
                            setShowCarPicker(false);
                            setShowCarRegisterModal(true);
                        }}
                    >
                        <Text style={{ color: colors.primary, fontWeight: 'bold' }}>+ 차량 등록 / 수정</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 2. 실시간 관제 맵 (Existing) */}
            <View style={styles.mapSection}>
                {isParking ? (
                    <Animated.View style={[styles.mapContainer, { borderColor: colors.primary }]}>
                        <IndoorMap
                            status={getMapStatus()}
                            targetSlotId={currentSession?.slot?.slotNo?.toString()}
                            carNumber={selectedCar}
                        />
                        <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
                            <Text style={[styles.statusBadgeText, { color: colors.textOnPrimary }]}>
                                {currentSession?.slot?.slotNo || '배정 중...'}
                            </Text>
                        </View>
                    </Animated.View>
                ) : (
                    <View style={[styles.emptyMapContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Image
                            source={require('../../../assets/NoParkingCar.png')}
                            style={styles.emptyCarImage}
                            resizeMode="contain"
                        />
                        <Text style={[styles.emptyMapText, { color: colors.textSecondary }]}>
                            주차 중인 차량이 없습니다
                        </Text>
                        <TouchableOpacity
                            style={[styles.startParkingButton, { backgroundColor: colors.primary }]}
                            onPress={onStartParking}
                        >
                            <Text style={[styles.startParkingText, { color: colors.textOnPrimary }]}>
                                주차장 진입하기
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* 3. 주차 정보 패널 (Existing) */}
            {isParking && (
                <View style={[styles.infoPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.infoItem}>
                        <View>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주차 시간</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{elapsedTime}</Text>
                        </View>
                    </View>
                    <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.infoItem}>
                        <View>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>현재 요금</Text>
                            <Text style={[styles.infoValue, { color: colors.primary }]}>
                                {currentFee.toLocaleString()}원
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {/* 4. 액션 버튼 (Existing) */}
            {isParked && (
                <View style={styles.actionSection}>
                    {currentFee > 0 ? (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={onPayAndExit}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>
                                정산 및 출차하기
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.primary }]}
                            onPress={onRequestExit}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>
                                출차하기
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: colors.textDisabled, marginTop: 4 }]}>Smart Parking v1.0</Text>
            </View>

            {/* --- Car Register Modal --- */}
            {showCarRegisterModal && (
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>차량 등록</Text>
                        <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                            자동 주차 서비스를 이용하려면{'\n'}차량 번호를 등록해야 합니다.
                        </Text>

                        <View style={[styles.inputContainer, { borderColor: colors.border }]}>
                            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>차량 번호 (예: 12가3456)</Text>
                            <TextInput
                                style={[styles.textInput, { color: colors.textPrimary }]}
                                value={newCarNumber}
                                onChangeText={setNewCarNumber}
                                placeholder="차량 번호 입력"
                                placeholderTextColor={colors.textDisabled}
                                autoCapitalize="characters"
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: colors.primary }]}
                            onPress={handleRegisterCar}
                            disabled={isRegistering}
                        >
                            <Text style={styles.modalButtonText}>{isRegistering ? '등록 중...' : '등록하기'}</Text>
                        </TouchableOpacity>

                        {/* Close button only if user has a car (editing mode) or if we want to allow skipping (maybe not for first time?) 
                            Let's allow closing if it was triggered manually (not by empty car). 
                            Actually, if it's forced, maybe we don't show close?
                            But for now, let's add a close option if carPicker triggered it. 
                            The condition `(!user.carNo ...)` was used to auto-show.
                        */}
                        {(user?.carNo && user.carNo.length > 0 && user.carNo[0] !== '차량 없음') && (
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowCarRegisterModal(false)}
                            >
                                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>닫기</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            )}
        </View>
    );
};

// ... Styles ... (I need to add modal styles too)
/*
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999
    },
    modalContent: {
        width: '80%', padding: 24, borderRadius: 20, alignItems: 'center', elevation: 5
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
    inputContainer: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20 },
    inputLabel: { fontSize: 12, marginBottom: 4 },
    textInput: { fontSize: 18, fontWeight: 'bold', padding: 0 },
    modalButton: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
    closeButton: { marginTop: 16 },
    closeButtonText: { fontSize: 14, textDecorationLine: 'underline' }
*/

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16,
    },
    headerLeft: {},
    greeting: { fontSize: 24, fontWeight: '700' },
    userName: { fontSize: 14, marginTop: 4 },
    settingsButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    settingsIcon: { fontSize: 22 },
    carSelector: {
        flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 12,
        borderRadius: 16, borderWidth: 1, padding: 16,
    },
    carIcon: { fontSize: 32, marginRight: 12 },
    carInfo: { flex: 1 },
    carLabel: { fontSize: 12 },
    carNumber: { fontSize: 18, fontWeight: '700', marginTop: 2 },
    dropdownIcon: { fontSize: 12 },
    carPickerDropdown: {
        marginHorizontal: 20, marginTop: 4, borderRadius: 12, borderWidth: 1, overflow: 'hidden',
    },
    carPickerItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    carPickerText: { fontSize: 16 },
    mapSection: { flex: 1, margin: 20 },
    mapContainer: { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 3 },
    map: { flex: 1 },
    statusBadge: {
        position: 'absolute', top: 12, right: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    },
    statusBadgeText: { fontSize: 14, fontWeight: '700' },
    emptyMapContainer: {
        flex: 1, borderRadius: 20, borderWidth: 2, borderStyle: 'dashed',
        justifyContent: 'center', alignItems: 'center', padding: 24,
    },
    emptyCarImage: { width: 120, height: 120, marginBottom: 16 },
    emptyMapText: { fontSize: 16, marginBottom: 24 },
    startParkingButton: { borderRadius: 16, paddingHorizontal: 32, paddingVertical: 18 },
    startParkingText: { fontSize: 18, fontWeight: '700' },
    infoPanel: {
        flexDirection: 'row', marginHorizontal: 20, borderRadius: 16, borderWidth: 1, padding: 20,
    },
    infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
    infoIcon: { fontSize: 28, marginRight: 12 },
    infoLabel: { fontSize: 12 },
    infoValue: { fontSize: 22, fontWeight: '700', marginTop: 2 },
    infoDivider: { width: 1, marginHorizontal: 16 },
    actionSection: { padding: 20 },
    actionButton: { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    actionButtonText: { fontSize: 18, fontWeight: '700' },
    footer: { padding: 12, alignItems: 'center' },
    footerText: { fontSize: 12 },
    modalOverlay: {
        position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999
    },
    modalContent: {
        width: '80%', padding: 24, borderRadius: 20, alignItems: 'center', elevation: 5
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
    modalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
    inputContainer: { width: '100%', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 20 },
    inputLabel: { fontSize: 12, marginBottom: 4 },
    textInput: { fontSize: 18, fontWeight: 'bold', padding: 0 },
    modalButton: { width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
    modalButtonText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
    closeButton: { marginTop: 16 },
    closeButtonText: { fontSize: 14, textDecorationLine: 'underline' }
});

export default MainDashboard;
