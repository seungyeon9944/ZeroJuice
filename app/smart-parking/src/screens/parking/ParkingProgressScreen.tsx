/**
 * ParkingProgressScreen - 주차/출차 실시간 관제 화면
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions } from 'react-native';

import { ParkingSession } from '../../types';
import IndoorMap, { MapStatus } from '../../components/map/IndoorMap';
import { ThemeColors } from '../../../App';
import { Image } from 'expo-image';
import { useParking } from '../../contexts';

interface ParkingProgressScreenProps {
    colors: ThemeColors;
    session: ParkingSession;
    onGoBack?: () => void;
    onComplete?: () => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Mock Path Points for Simulation (0-100%)
// In real app, these would come from the DB/Socket
const ENTRANCE = { x: 50, y: 95, rot: 0 };
const LANE_MID = { x: 50, y: 50, rot: 0 };
const LANE_TOP = { x: 50, y: 20, rot: 0 };
const EXIT = { x: 50, y: 5, rot: 180 };

const ParkingProgressScreen: React.FC<ParkingProgressScreenProps> = ({
    colors,
    session,
    onGoBack,
    onComplete,
}) => {
    const isExit = session.status === 'EXITING' || session.status === 'COMPLETED';

    // Simulation State
    const { coordinate, subscribeToCoordinates } = useParking(); // Get real-time coordinate & subscriber
    const [statusMessage, setStatusMessage] = useState(isExit ? '출차 요청 중...' : '입차 요청 중...');

    // Animations
    const overlayOpacity = useRef(new Animated.Value(0)).current;
    const checkmarkScale = useRef(new Animated.Value(0)).current;

    const showCompletion = () => {
        Animated.sequence([
            Animated.timing(overlayOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(checkmarkScale, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true
            })
        ]).start();
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete();
        }
    };

    // Status Message Logic
    useEffect(() => {
        switch (session.status) {
            case 'ENTERING':
                setStatusMessage('입차 요청 확인');
                break;
            case 'PARKING':
                setStatusMessage('자동 주차 진행 중...');
                break;
            case 'PARKED':
                setStatusMessage('주차 완료!');
                showCompletion();
                break;
            case 'EXITING':
                setStatusMessage('출차 요청 진행 중...');
                break;
            case 'COMPLETED':
                setStatusMessage('출차 완료!');
                showCompletion();
                break;
            default:
                setStatusMessage('대기 중...');
        }
    }, [session.status]);

    return (
        <View style={[styles.container, { backgroundColor: '#333' }]}>
            {/* Contained Map */}
            <View style={styles.mapContainer}>
                <IndoorMap
                    status={isExit ? 'EXITING' : 'ENTERING'} // Base status
                    subscribeToCoordinates={subscribeToCoordinates} // High perf update
                    targetSlotId={session.slot?.slotNo} // Use slotNo (string or number matches)
                    backgroundImage={require('../../../assets/map/parking-lot.png')}
                />
            </View>

            {/* Top Status Overlay */}
            <View style={styles.statusOverlay}>
                <View style={[styles.statusCard, { backgroundColor: 'rgba(0,0,0,0.8)', borderColor: colors.primary }]}>
                    <Text style={[styles.statusTitle, { color: colors.primary }]}>
                        {isExit ? 'AUTO EXIT' : 'AUTO PARKING'}
                    </Text>
                    <Text style={styles.statusMessage}>
                        {statusMessage}
                    </Text>
                    {session.carNumber && (
                        <Text style={styles.carNumber}>{session.carNumber}</Text>
                    )}
                </View>
            </View>

            {/* Completion Overlay (Full Screen Fade) */}
            <Animated.View
                style={[
                    styles.completionOverlay,
                    {
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        opacity: overlayOpacity,
                        zIndex: overlayOpacity.interpolate({ inputRange: [0, 1], outputRange: [-1, 100] })
                    }
                ]}
            >
                <Animated.View style={{ transform: [{ scale: checkmarkScale }] }}>
                    <View style={[styles.checkmarkCircle, { borderColor: colors.primary }]}>
                        <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                    </View>
                </Animated.View>

                <Text style={styles.completionText}>
                    {isExit ? '출차 완료' : '주차 완료'}
                </Text>

                <TouchableOpacity
                    style={[styles.confirmButton, { backgroundColor: colors.primary }]}
                    onPress={handleComplete}
                >
                    <Text style={styles.confirmButtonText}>확인</Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    mapContainer: {
        height: 350, // Fixed height for "contained" look like test screen
        margin: 20,
        borderRadius: 16,
        overflow: 'hidden',
        borderColor: '#555',
        marginTop: 240, // Push down below overlay
    },
    statusOverlay: {
        position: 'absolute',
        top: 60,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    statusCard: {
        width: '100%',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    statusMessage: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        marginBottom: 4,
        textAlign: 'center',
    },
    carNumber: {
        fontSize: 14,
        color: '#ccc',
        marginTop: 4,
    },
    completionOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        backgroundColor: 'rgba(255,255,255,0.9)',
    },
    checkmark: {
        fontSize: 60,
        fontWeight: 'bold',
    },
    completionText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 40,
    },
    confirmButton: {
        paddingVertical: 16,
        paddingHorizontal: 60,
        borderRadius: 30,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ParkingProgressScreen;
