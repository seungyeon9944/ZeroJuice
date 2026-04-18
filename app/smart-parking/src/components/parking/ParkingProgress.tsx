/**
 * ParkingProgress - 주차/출차 진행 상태 표시
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ParkingSession } from '../../types';

interface ParkingProgressProps {
    session: ParkingSession;
    colors: {
        primary: string;
        textPrimary: string;
        textSecondary: string;
        surface: string;
        border: string;
        background: string;
    };
}

const ParkingProgress: React.FC<ParkingProgressProps> = ({ session, colors }) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 펄스 애니메이션
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();

        return () => {
            pulse.stop();
        };
    }, []);

    const getSteps = () => {
        const isExit = session.status === 'EXITING';
        return isExit ? [
            { label: '출차 요청', completed: session.exitRequestedAt !== null },
            { label: '차량 이동', completed: session.progress > 30 },
            { label: '출구 진입', completed: session.progress > 70 },
            { label: '출차 완료', completed: session.status === 'COMPLETED' },
        ] : [
            { label: '입차 요청', completed: session.enteredAt !== null },
            { label: '공간 배정', completed: session.slot !== null },
            { label: '자동 주차', completed: session.progress > 50 },
            { label: '주차 완료', completed: session.status === 'PARKED' },
        ];
    };

    const steps = getSteps();

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            {/* 메인 진행 상태 */}
            <View style={styles.mainProgress}>
                <Animated.View
                    style={[
                        styles.progressCircle,
                        {
                            backgroundColor: colors.primary,
                            transform: [{ scale: pulseAnim }]
                        }
                    ]}
                >
                    <Text style={styles.progressEmoji}>
                        {session.status === 'EXITING' ? 'EXIT' : 'PARK'}
                    </Text>
                </Animated.View>

                <Text style={[styles.progressPercent, { color: colors.primary }]}>
                    {Math.round(session.progress)}%
                </Text>
                <Text style={[styles.progressMessage, { color: colors.textPrimary }]}>
                    {session.progressMessage}
                </Text>
            </View>



            {/* 단계별 진행 */}
            <View style={styles.stepsContainer}>
                {steps.map((step, index) => (
                    <View key={index} style={styles.stepItem}>
                        <View style={[
                            styles.stepCircle,
                            {
                                backgroundColor: step.completed ? colors.primary : colors.border,
                                borderColor: step.completed ? colors.primary : colors.border,
                            }
                        ]}>
                            {step.completed && <Text style={styles.stepCheck}>V</Text>}
                        </View>
                        <Text style={[
                            styles.stepLabel,
                            { color: step.completed ? colors.textPrimary : colors.textSecondary }
                        ]}>
                            {step.label}
                        </Text>
                        {index < steps.length - 1 && (
                            <View style={[
                                styles.stepLine,
                                { backgroundColor: step.completed ? colors.primary : colors.border }
                            ]} />
                        )}
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        padding: 24,
    },
    mainProgress: {
        alignItems: 'center',
        marginBottom: 24,
    },
    progressCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    progressEmoji: {
        fontSize: 48,
    },
    progressPercent: {
        fontSize: 32,
        fontWeight: '700',
    },
    progressMessage: {
        fontSize: 16,
        marginTop: 8,
    },
    sensorCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
    },
    sensorTitle: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
        textAlign: 'center',
    },
    sensorGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    sensorItem: {
        alignItems: 'center',
    },
    sensorIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    sensorValue: {
        fontSize: 16,
        fontWeight: '700',
    },
    sensorLabel: {
        fontSize: 12,
        marginTop: 2,
    },
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    stepCheck: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    stepLabel: {
        fontSize: 11,
        marginTop: 6,
        textAlign: 'center',
    },
    stepLine: {
        position: 'absolute',
        top: 14,
        right: -20,
        width: 40,
        height: 2,
    },
});

export default ParkingProgress;
