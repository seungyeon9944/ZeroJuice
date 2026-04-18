/**
 * ParkingStatusCard - 현재 주차 상태 카드
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ParkingSession, ParkingStatus } from '../../types';
import Badge from '../common/Badge';

interface ParkingStatusCardProps {
    session: ParkingSession;
    colors: {
        primary: string;
        textOnPrimary: string;
        surface: string;
        textPrimary: string;
        textSecondary: string;
        border: string;
    };
    onViewDetails?: () => void;
    onRequestExit?: () => void;
}

const ParkingStatusCard: React.FC<ParkingStatusCardProps> = ({
    session,
    colors,
    onViewDetails,
    onRequestExit,
}) => {
    const getStatusInfo = (status: ParkingStatus) => {
        switch (status) {
            case 'ENTERING':
                return { text: '입차 중', variant: 'info' as const, icon: '' };
            case 'PARKING':
                return { text: '주차 진행 중', variant: 'warning' as const, icon: '' };
            case 'PARKED':
                return { text: '주차 완료', variant: 'success' as const, icon: '' };
            case 'EXITING':
                return { text: '출차 중', variant: 'info' as const, icon: '' };
            case 'COMPLETED':
                return { text: '출차 완료', variant: 'success' as const, icon: '' };
            default:
                return { text: '대기 중', variant: 'default' as const, icon: '' };
        }
    };

    const statusInfo = getStatusInfo(session.status);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View>
                        <Text style={[styles.carNumber, { color: colors.textPrimary }]}>
                            {session.carNumber}
                        </Text>
                        <Text style={[styles.parkingLot, { color: colors.textSecondary }]}>
                            {session.parkingLot.name}
                        </Text>
                    </View>
                </View>
                <Badge
                    text={statusInfo.text}
                    variant={statusInfo.variant}
                    icon={statusInfo.icon}
                />
            </View>

            {/* Progress (if parking or exiting) */}
            {(session.status === 'PARKING' || session.status === 'EXITING' || session.status === 'ENTERING') && (
                <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                            {session.progressMessage}
                        </Text>
                        <Text style={[styles.progressPercent, { color: colors.primary }]}>
                            {Math.round(session.progress)}%
                        </Text>
                    </View>
                    <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                        <View
                            style={[
                                styles.progressFill,
                                { width: `${session.progress}%`, backgroundColor: colors.primary }
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* Info */}
            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주차 위치</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                        {session.slot?.id || '배정 중...'}
                    </Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <View style={styles.infoItem}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>주차 시간</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                        {formatDuration()}
                    </Text>
                </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, { borderColor: colors.border }]}
                    onPress={onViewDetails}
                >
                    <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
                        위치 보기
                    </Text>
                </TouchableOpacity>

                {session.status === 'PARKED' && (
                    <TouchableOpacity
                        style={[styles.exitButton, { backgroundColor: colors.primary }]}
                        onPress={onRequestExit}
                    >
                        <Text style={[styles.exitButtonText, { color: colors.textOnPrimary }]}>
                            출차하기
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    carEmoji: {
        fontSize: 36,
        marginRight: 12,
    },
    carNumber: {
        fontSize: 18,
        fontWeight: '700',
    },
    parkingLot: {
        fontSize: 13,
        marginTop: 2,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 14,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressBar: {
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    infoItem: {
        flex: 1,
    },
    infoDivider: {
        width: 1,
        height: 32,
        marginHorizontal: 16,
    },
    infoLabel: {
        fontSize: 12,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
        marginRight: 8,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    exitButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    exitButtonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});

export default ParkingStatusCard;
