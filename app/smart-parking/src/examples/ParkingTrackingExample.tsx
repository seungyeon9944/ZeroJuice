/**
 * Example: Using IndoorMap with Real-time Vehicle Tracking
 * 
 * This example shows how to integrate the SSE service with IndoorMap
 * to display real-time vehicle position during parking.
 */

import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import IndoorMap from '../components/map/IndoorMap';
import { vehiclePoseSSE } from '../services/vehiclePoseService';
import { VehiclePose } from '../types/parking.types';
import { API_BASE_URL } from '../utils/config';

const ParkingTrackingScreen = () => {
    const [isTracking, setIsTracking] = useState(false);
    const [currentPose, setCurrentPose] = useState<VehiclePose | null>(null);
    const userId = 1; // Get from auth context

    // Start tracking when user clicks "입차" or "출차"
    const startTracking = () => {
        console.log('[Tracking] Starting...');
        setIsTracking(true);

        vehiclePoseSSE.connect({
            baseUrl: API_BASE_URL,
            userId: userId,
            onPoseUpdate: (pose) => {
                console.log('[Tracking] Pose update:', pose);
                setCurrentPose(pose);
            },
            onError: (error) => {
                console.error('[Tracking] Error:', error);
            },
            onConnect: () => {
                console.log('[Tracking] Connected to SSE');
            },
            onDisconnect: () => {
                console.log('[Tracking] Disconnected from SSE');
                setIsTracking(false);
            },
        });
    };

    // Stop tracking when parking/exit completes
    const stopTracking = () => {
        console.log('[Tracking] Stopping...');
        vehiclePoseSSE.disconnect();
        setIsTracking(false);
        setCurrentPose(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            vehiclePoseSSE.disconnect();
        };
    }, []);

    return (
        <View style={styles.container}>
            {/* Map with real-time tracking */}
            <IndoorMap
                status={isTracking ? 'ENTERING' : 'IDLE'}
                carNumber="123가4567"
                mqttPose={currentPose ? {
                    x: currentPose.x,
                    y: currentPose.y,
                    yaw: currentPose.yaw
                } : null}
                backgroundImage={require('../../assets/map/parking-lot.png')}
            />

            {/* Control buttons */}
            <View style={styles.controls}>
                {!isTracking ? (
                    <Button title="입차 시작" onPress={startTracking} />
                ) : (
                    <Button title="추적 중지" onPress={stopTracking} color="red" />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    controls: {
        padding: 16,
    },
});

export default ParkingTrackingScreen;
