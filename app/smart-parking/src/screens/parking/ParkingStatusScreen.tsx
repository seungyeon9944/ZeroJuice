/**
 * ParkingStatusScreen - 현재 주차 상태 화면
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { ParkingSession } from '../../types';
import { ParkingStatusCard, Badge } from '../../components';
import IndoorMap, { MapStatus } from '../../components/map/IndoorMap';
import { ThemeColors } from '../../../App';
import { useParking } from '../../contexts';

interface ParkingStatusScreenProps {
    colors: ThemeColors;
    session: ParkingSession;
    onGoBack: () => void;
    onRequestExit: () => void;
    onViewProgress: () => void;
}

const ParkingStatusScreen: React.FC<ParkingStatusScreenProps> = ({
    colors,
    session,
    onGoBack,
    onRequestExit,
    onViewProgress,
}) => {
    const navigation = useNavigation<any>();
    const { subscribeToCoordinates } = useParking();

    const formatDuration = () => {
        if (!session.enteredAt) return '0분';
        const enteredAt = new Date(session.enteredAt);
        const now = new Date();
        const diffMs = now.getTime() - enteredAt.getTime();
        const minutes = Math.floor(diffMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}시간 ${minutes % 60}분`;
        }
        return `${minutes}분`;
    };

    const calculateFee = () => {
        if (!session.enteredAt) return 0;
        const enteredAt = new Date(session.enteredAt);
        const now = new Date();
        const diffMs = now.getTime() - enteredAt.getTime();
        const minutes = Math.ceil(diffMs / (1000 * 60));
        const calculated = minutes * (session.parkingLot.pricePerMinute || 50);
        return Math.max(calculated, 100); // [TEST MODE] Minimum 100 won to enable payment test
    };

    const getMapStatus = (): MapStatus => {
        switch (session.status) {
            case 'ENTERING': return 'ENTERING';
            case 'PARKING': return 'ENTERING'; // Visualize as entering/parking
            case 'PARKED': return 'PARKED';
            case 'EXITING': return 'EXITING';
            default: return 'IDLE';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>주차 현황</Text>
                    <Badge
                        text={session.status === 'PARKED' ? '주차 중' : '진행 중'}
                        variant={session.status === 'PARKED' ? 'success' : 'warning'}
                        size="small"
                    />
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 지도 */}
                <View style={[styles.mapContainer, { borderColor: colors.primary }]}>
                    <IndoorMap
                        status={getMapStatus()}
                        targetSlotId={session.slot?.slotNo}
                        carNumber={session.carNumber}
                        subscribeToCoordinates={subscribeToCoordinates}
                        backgroundImage={require('../../../assets/map/parking-lot.png')}
                    />
                </View>

                {/* 주차 정보 */}
                <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.infoHeader}>
                        <View style={styles.infoHeaderText}>
                            <Text style={[styles.carNumber, { color: colors.textPrimary }]}>{session.carNumber}</Text>
                            <Text style={[styles.parkingLot, { color: colors.textSecondary }]}>{session.parkingLot.name}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    <View style={styles.infoGrid}>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주차 위치</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{session.slot?.id || '-'}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주차 시간</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{formatDuration()}</Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>입차 시간</Text>
                            <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                                {session.enteredAt
                                    ? new Date(session.enteredAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
                                    : '-'}
                            </Text>
                        </View>
                        <View style={styles.infoItem}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>예상 요금</Text>
                            <Text style={[styles.infoValue, { color: colors.primary }]}>{calculateFee().toLocaleString()}원</Text>
                        </View>
                    </View>
                </View>

                {/* 액션 버튼 */}
                <View style={styles.actions}>
                    {session.status !== 'PARKED' && (
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                            onPress={onViewProgress}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>진행 상황</Text>
                        </TouchableOpacity>
                    )}

                    {session.status === 'PARKED' && (
                        <TouchableOpacity
                            style={[styles.exitButton, { backgroundColor: colors.primary }]}
                            onPress={() => {
                                // [TEST MODE] Force 100 won specifically for testing
                                const testFee = Math.max(calculateFee(), 100);
                                navigation.navigate('Payment', {
                                    fee: {
                                        finalFee: testFee,
                                        carNumber: session.carNumber,
                                        duration: 60,
                                    },
                                    hasRegisteredCard: false
                                });
                            }}
                        >
                            <Text style={[styles.exitButtonText, { color: colors.textOnPrimary }]}>출차 요청</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24 },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
    content: { flex: 1 },
    mapContainer: { height: 200, margin: 16, borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
    map: { flex: 1 },
    infoCard: { marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1 },
    infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    carEmoji: { fontSize: 36, marginRight: 12 },
    infoHeaderText: { flex: 1 },
    carNumber: { fontSize: 20, fontWeight: '700' },
    parkingLot: { fontSize: 14, marginTop: 2 },
    divider: { height: 1, marginBottom: 16 },
    infoGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    infoItem: { width: '50%', marginBottom: 16 },
    infoLabel: { fontSize: 12, marginBottom: 4 },
    infoValue: { fontSize: 16, fontWeight: '600' },
    actions: { padding: 16 },
    actionButton: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 12, borderWidth: 1 },
    actionButtonText: { fontSize: 16, fontWeight: '600' },
    exitButton: { borderRadius: 12, paddingVertical: 18, alignItems: 'center' },
    exitButtonText: { fontSize: 18, fontWeight: '700' },
});

export default ParkingStatusScreen;
