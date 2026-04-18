/**
 * SSE Service for Real-time Vehicle Pose Updates
 * Connects to backend SSE endpoint and streams vehicle position data
 */

import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VehiclePose } from '../types/parking.types';

export type PoseUpdateCallback = (pose: VehiclePose) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionCallback = () => void;

interface SSEServiceConfig {
    baseUrl: string;
    userId: number;
    onPoseUpdate: PoseUpdateCallback;
    onError?: ErrorCallback;
    onConnect?: ConnectionCallback;
    onDisconnect?: ConnectionCallback;
}

// Coordinate Mapping Logic based on User Constraints (Recalibration)
// Raw Data Range:
// - Top-Left: (x=2.83, y=-1.15) -> Screen Bottom-Left (x=0, y=Height)
// - Bottom-Right: (x=0.00, y=3.07) -> Screen Top-Right (x=Width, y=0)
//
// ROTATION APPLIED: -90 degrees visually
//
// Transformation:
// Screen X (Width) corresponds to Raw Y.
// Range Y: -1.15 to 3.07 (Span ~4.22)
// Mapped X = Raw Y - (-1.15) = Raw Y + 1.15
//
// Screen Y (Height) corresponds to Raw X.
// Range X: 0.00 to 2.83 (Span ~2.83)
// Mapped Y = Raw X  (Since 0 is Top/Right and 2.83 is Bottom/Left in raw terms? Wait.
// If Raw X=2.83 is Bottom-Left (Screen Y=Max, X=0) and Raw X=0 is Top-Right (Screen Y=0, X=Max)
// Then Screen Y is proportional to Raw X.
// Y = Raw X. (0 -> 0, 2.83 -> 2.83)

const mapCoordinates = (rawX: number, rawY: number): { x: number, y: number } => {
    // RECALIBRATION (4.16m Width Adjustment):
    // User requested screen width to be increased by 30% (3.2 * 1.3 = 4.16m).
    // Screen X (Width) follows Raw X (2.83 -> 0.00) mapped into 4.16m space.
    // Logic: X = 4.16 - rawX
    // - At Raw X=2.83 (Left Limit) -> Screen X = 1.33
    // - At Raw X=0.00 (Right Limit) -> Screen X = 4.16
    // Width Span: 4.16
    //
    // Screen Y (Height) follows Raw Y (-1.15 -> 3.07)
    // Logic: Y = rawY + 1.15
    // Height Span: 4.22

    const rotatedX = 4.16 - rawX;
    const rotatedY = rawY + 1.15;

    return { x: rotatedX, y: rotatedY };
};

class VehiclePoseSSEService {
    private eventSource: EventSource | null = null;
    private config: SSEServiceConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000; // ms

    /**
     * Connect to SSE endpoint
     */
    async connect(config: SSEServiceConfig): Promise<void> {
        if (this.eventSource) {
            console.warn('[SSE] Already connected. Disconnecting first...');
            this.disconnect();
        }

        this.config = config;
        const url = `${config.baseUrl}/sse/app/parking-location/${config.userId}`;

        console.log('[SSE] Connecting to:', url);

        try {
            // Get auth token (same way as apiClient)
            const token = await AsyncStorage.getItem('@juice_token');

            console.log('[SSE] Token check:', token ? `Found (${token.substring(0, 20)}...)` : 'NOT FOUND');

            if (!token) {
                throw new Error('No authentication token found. Please login first.');
            }

            // Use react-native-sse
            this.eventSource = new EventSource(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            this.eventSource.addEventListener('open', () => {
                console.log('[SSE] Connection established');
                this.reconnectAttempts = 0;
                config.onConnect?.();
            });

            // Handle incoming messages (default 'message' event)
            this.eventSource.addEventListener('message', (event: any) => {
                try {
                    const data = JSON.parse(event.data);

                    const { x: mappedX, y: mappedY } = mapCoordinates(data.x, data.y);

                    console.log(`[SSE] Raw: (${data.x}, ${data.y}) | Mapped: (${mappedX.toFixed(3)}, ${mappedY.toFixed(3)})`);

                    const pose: VehiclePose = {
                        type: data.type || 'PARK',
                        slotNo: data.slotNo || '',
                        carNo: data.carNo || '',
                        x: mappedX,
                        y: mappedY,
                        yaw: data.yaw - 90,
                        timestamp: data.timestamp || new Date().toISOString()
                    };

                    this.config?.onPoseUpdate(pose);
                } catch (error) {
                    console.error('[SSE] Failed to parse message:', error);
                    this.config?.onError?.(error as Error);
                }
            });

            // Handle REALTIME_LOCATION event (backend specific)
            this.eventSource.addEventListener('REALTIME_LOCATION' as any, (event: any) => {
                try {
                    const data = JSON.parse(event.data);

                    const { x: mappedX, y: mappedY } = mapCoordinates(data.x, data.y);

                    console.log(`[SSE] REALTIME Raw: (${data.x}, ${data.y}) | Mapped: (${mappedX.toFixed(3)}, ${mappedY.toFixed(3)})`);

                    const pose: VehiclePose = {
                        type: data.type || 'PARK',
                        slotNo: data.slotNo || '',
                        carNo: data.carNo || '',
                        x: mappedX,
                        y: mappedY,
                        yaw: data.yaw - 90,
                        timestamp: data.timestamp || new Date().toISOString()
                    };

                    this.config?.onPoseUpdate(pose);
                } catch (error) {
                    console.error('[SSE] Failed to parse REALTIME_LOCATION:', error);
                    this.config?.onError?.(error as Error);
                }
            });

            // this.eventSource.addEventListener('error', (error) => {
            //     console.error('[SSE] Connection error:', error);
            //     config.onError?.(new Error('SSE connection error'));

            //     // Attempt reconnection
            //     if (this.reconnectAttempts < this.maxReconnectAttempts) {
            //         this.reconnectAttempts++;
            //         console.log(`[SSE] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

            //         setTimeout(() => {
            //             if (this.config) {
            //                 this.connect(this.config);
            //             }
            //         }, this.reconnectDelay * this.reconnectAttempts);
            //     } else {
            //         console.error('[SSE] Max reconnection attempts reached');
            //         this.disconnect();
            //     }
            // });
        } catch (error) {
            console.error('[SSE] Failed to create EventSource:', error);
            config.onError?.(error as Error);
        }
    }

    /**
     * Disconnect from SSE endpoint
     */
    disconnect(): void {
        if (this.eventSource) {
            console.log('[SSE] Disconnecting...');
            this.eventSource.close();
            this.eventSource = null;
            this.config?.onDisconnect?.();
            this.config = null;
            this.reconnectAttempts = 0;
        }
    }

    /**
     * Check if currently connected
     */
    isConnected(): boolean {
        return this.eventSource !== null;
    }
}

// Singleton instance
export const vehiclePoseSSE = new VehiclePoseSSEService();
