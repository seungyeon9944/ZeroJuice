import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ImageBackground, Dimensions, Easing } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../../constants/colors';


// Types
export type MapStatus = 'IDLE' | 'ENTERING' | 'PARKED' | 'EXITING';

interface IndoorMapProps {
    status: MapStatus;
    targetSlotId?: string | number; // Support number
    carNumber?: string;
    onAnimationComplete?: () => void;
    mqttPose?: { x: number; y: number; yaw?: number } | null;
    coordinate?: { x: number; y: number } | null; // Deprecated due to performance
    rotation?: number; // Deprecated
    subscribeToCoordinates?: (callback: (coord: { x: number; y: number; rotation: number }) => void) => () => void;
    backgroundImage?: any; // Allow custom background image
}

// Coordinate System (0-100%)
// Top-Left is (0,0)
interface Point { x: number; y: number; }

// Slot Coordinates with Orientation
// Slot Types
type SlotType = 'VERTICAL' | 'HORIZONTAL';

interface SlotConfig {
    id: string;
    type: SlotType;
    x: number;
    y: number;
    rotation: number;
    label: string;
}

// Configured Slots
const SLOTS: SlotConfig[] = [
    // Row A (Top Right - Vertical)
    { id: 'A1', type: 'VERTICAL', x: 54.2, y: 11.5, rotation: 0, label: 'A-1' },
    { id: 'A2', type: 'VERTICAL', x: 45.2, y: 11.5, rotation: 0, label: 'A-2' },
    // Row B (Bottom Left - Horizontal)
    { id: 'B1', type: 'HORIZONTAL', x: 14.8, y: 24.5, rotation: 90, label: 'B-1' },
    { id: 'B2', type: 'HORIZONTAL', x: 14.8, y: 35.3, rotation: 90, label: 'B-2' },
    // Row C (Bottom Right - Horizontal)
    { id: 'C1', type: 'HORIZONTAL', x: 45.1, y: 52.3, rotation: 90, label: 'C-1' },
    { id: 'C2', type: 'HORIZONTAL', x: 54.8, y: 52.3, rotation: 90, label: 'C-2' },
];

const ENTRANCE: Point = { x: 45, y: 5 }; // Top Center
const EXIT: Point = { x: 8, y: 15 };      // Top Left
const CENTER_LANE_TOP: Point = { x: 50, y: 40 };    // Driving Lane

const IndoorMap: React.FC<IndoorMapProps> = ({
    status,
    targetSlotId,
    carNumber = '내 차',
    onAnimationComplete,
    mqttPose,
    coordinate,
    subscribeToCoordinates,
    backgroundImage
}) => {
    // Animation Values (0-100%)
    const carX = useRef(new Animated.Value(ENTRANCE.x)).current;
    const carY = useRef(new Animated.Value(ENTRANCE.y)).current;
    const carScale = useRef(new Animated.Value(0)).current; // Start hidden

    // Get target coordinates
    const getSlotCoords = (id?: string | number) => {
        const slot = SLOTS.find(s => s.id === String(id));
        if (slot) return { x: slot.x, y: slot.y, rotation: slot.rotation };
        return { x: 50, y: 50, rotation: 0 }; // Default
    };

    // Helper to convert meters to percentage
    // X: 0-4.16m -> 0-100% (Width)
    // Y: 0-4.22m -> 0-100% (Height)
    const convertMeterToPercent = (x: number, y: number) => {
        return {
            x: (x / 4.16) * 100 - 35,
            y: (y / 4.22) * 100
        };
    };

    useEffect(() => {
        // High Performance Listener
        let unsubscribe: (() => void) | undefined;

        if (subscribeToCoordinates) {
            unsubscribe = subscribeToCoordinates((newCoord) => {
                const { x, y } = convertMeterToPercent(newCoord.x, newCoord.y);
                carX.setValue(x);
                carY.setValue(y);
                carScale.setValue(1);
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [subscribeToCoordinates]); // Only re-run if subscription function changes (rare)

    const [layout, setLayout] = useState({ width: 0, height: 0 });

    // Handle mqttPose (Meters) or coordinate (Legacy %)
    useEffect(() => {
        if (mqttPose) {
            // mqttPose is in meters, convert to %
            const { x, y } = convertMeterToPercent(mqttPose.x, mqttPose.y);
            carX.setValue(x);
            carY.setValue(y);
            carScale.setValue(1);
        } else if (coordinate) {
            // Legacy coordinate handling
            carX.setValue(coordinate.x);
            carY.setValue(coordinate.y);
            carScale.setValue(1);
        }
    }, [mqttPose, coordinate]);

    useEffect(() => {
        const target = getSlotCoords(targetSlotId);

        // Animation logic removed to rely on Real-Time MQTT/SSE Data.
        // If status is ENTERING/EXITING, we expect live updates via subscribeToCoordinates.

        if (status === 'IDLE') {
            carScale.setValue(0);
        } else if (status === 'PARKED') {
            // Parked: Show at target slot
            carScale.setValue(1);
            carX.setValue(target.x);
            carY.setValue(target.y);
        } else {
            // ENTERING or EXITING:
            // Show car (scale 1) but let coordinates be driven by SSE.
            carScale.setValue(1);

            // If we just started, maybe set to ENTRANCE initially if no coord yet?
            // But ParkingContext sets initial coordinate to ENTRANCE/EXIT.
        }

    }, [status, targetSlotId]);

    // Interpolate for mapped values if needed, but we use percentages directly for 'left'/'top'
    const animatedStyle: any = {
        left: carX.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        top: carY.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
        transform: [
            { scale: carScale }
        ]
    };

    return (
        <View
            style={styles.container}
            onLayout={(event) => {
                const { width, height } = event.nativeEvent.layout;
                setLayout({ width, height });
            }}
        >
            {/* Map Background */}
            {layout.width > 0 && layout.height > 0 && (
                <ImageBackground
                    source={backgroundImage || require('../../../assets/map/parking-lot.png')}
                    style={{
                        position: 'absolute',
                        width: layout.width,
                        height: layout.height,
                    }}
                    resizeMode="stretch"
                >
                    {/* Slots Debug Overlay - Render Real Horizontal/Vertical Boxes */}
                    {SLOTS.map((slot) => (
                        <View
                            key={slot.id}
                            style={[
                                styles.slotBase,
                                slot.type === 'VERTICAL' ? styles.slotVertical : styles.slotHorizontal,
                                { left: `${slot.x}%`, top: `${slot.y}%` }
                            ]}
                        >
                            {/* <Text style={styles.slotText}>{slot.label}</Text> */}
                        </View>
                    ))}
                </ImageBackground>
            )}

            {/* Moving Car - Yellow Circle Style */}
            <Animated.View style={[styles.carContainer, animatedStyle]}>
                <View style={styles.carCircle} />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#333', // Dark asphalt
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center', // Ensure centering
        alignItems: 'center',
    },
    // mapBackground style is removed as it is now inline dynamic
    centerLane: {

        position: 'absolute',
        top: 0, bottom: 0, left: '45%', width: '10%',
        backgroundColor: '#444',
        borderLeftWidth: 2, borderRightWidth: 2,
        borderColor: '#555',
        borderStyle: 'dashed',
    },
    entranceMark: {
        position: 'absolute', bottom: 10, left: '45%', width: '10%', alignItems: 'center',
    },
    exitMark: {
        position: 'absolute', top: 10, left: '45%', width: '10%', alignItems: 'center',
    },
    markText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
    // Slots
    slotBase: {
        position: 'absolute',
        // borderWidth: 2, 
        // borderColor: 'rgba(255,255,255,0.3)', // Visible for debugging, can hide later
        justifyContent: 'center',
        alignItems: 'center',
    },
    slotVertical: {
        width: 40, height: 60,
        marginLeft: -20, marginTop: -30,
    },
    slotHorizontal: {
        width: 60, height: 40,
        marginLeft: -30, marginTop: -20,
    },
    slotText: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

    // Car
    carContainer: {
        position: 'absolute',
        width: 20, height: 20,
        marginLeft: -10, marginTop: -10, // Center origin
        zIndex: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    carCircle: {
        width: 20, height: 20,
        borderRadius: 10,
        backgroundColor: '#FFD700', // Yellow
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5, shadowRadius: 2,
        elevation: 5,
    },
    car: {
        width: 24, height: 36,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 1, borderColor: 'white',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5, shadowRadius: 2,
        elevation: 5,
    },
    carLabel: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    carTooltip: {
        position: 'absolute',
        top: -25,
        backgroundColor: 'white',
        paddingHorizontal: 6, paddingVertical: 2,
        borderRadius: 4,
    },
    carTooltipText: { fontSize: 10, fontWeight: 'bold', color: 'black' },
});

export default IndoorMap;
