/**
 * Parking & Exit Complete SSE Service
 * Listens for parking and exit completion events and shows notifications
*/

import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export type ParkingEventCallback = (data: ParkingEventData) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionCallback = () => void;

export interface ParkingEventData {
    slotNo: string;
    carNo: string;
    timestamp: string;
    x?: number;
    y?: number;
}

interface SSEServiceConfig {
    baseUrl: string;
    userId: number;
    onParkingComplete?: ParkingEventCallback;
    onExitComplete?: ParkingEventCallback; // New callback for exit
    onError?: ErrorCallback;
    onConnect?: ConnectionCallback;
    onDisconnect?: ConnectionCallback;
}

class ParkingCompleteSSEService {
    private eventSource: EventSource | null = null;
    private config: SSEServiceConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000; // ms

    async connect(config: SSEServiceConfig): Promise<void> {
        if (this.eventSource) {
            console.warn('[SSE Service] Already connected. Disconnecting first...');
            this.disconnect();
        }

        this.config = config;
        const url = `${config.baseUrl}/sse/app/parking-complete/${config.userId}`;

        console.log('[SSE Service] Connecting to:', url);

        try {
            const token = await AsyncStorage.getItem('@juice_token');
            if (!token) {
                throw new Error('No authentication token found. Please login first.');
            }

            this.eventSource = new EventSource(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            this.eventSource.addEventListener('open', () => {
                console.log('[SSE Service] Connection established');
                this.reconnectAttempts = 0;
                config.onConnect?.();
            });

            // Handle parking complete event
            this.eventSource.addEventListener('PARKING_COMPLETE', async (event: any) => {
                console.log('🎉 [주차완료] 알림 수신:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    const parkingData: ParkingEventData = {
                        slotNo: data.slotNo || '', carNo: data.carNo || '',
                        timestamp: data.timestamp || new Date().toISOString(),
                    };
                    await this.showParkingCompleteNotification(parkingData);
                    this.config?.onParkingComplete?.(parkingData);
                } catch (error) {
                    console.error('❌ [주차완료] 파싱 오류:', error);
                    this.config?.onError?.(error as Error);
                }
            });

            // NEW: Handle exit complete event
            this.eventSource.addEventListener('EXIT_COMPLETE', async (event: any) => {
                console.log('🎉 [출차완료] 알림 수신:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    const exitData: ParkingEventData = {
                        slotNo: data.slotNo || '', carNo: data.carNo || '',
                        timestamp: data.timestamp || new Date().toISOString(),
                    };
                    await this.showExitCompleteNotification(exitData);
                    this.config?.onExitComplete?.(exitData); // Use new callback
                } catch (error) {
                    console.error('❌ [출차완료] 파싱 오류:', error);
                    this.config?.onError?.(error as Error);
                }
            });
            this.eventSource.addEventListener('message', (event: any) => {
                console.log('📨 [디버깅] 이름 없는 메시지 수신:', event.data);
            });
            // this.eventSource.addEventListener('error', (error: any) => {
            //     console.error('[SSE Service] Connection error:', error);
            //     config.onError?.(new Error('SSE connection error'));
            //     if (this.reconnectAttempts < this.maxReconnectAttempts) {
            //         this.reconnectAttempts++;
            //         console.log(`[SSE Service] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            //         setTimeout(() => { if (this.config) this.connect(this.config); }, this.reconnectDelay * this.reconnectAttempts);
            //     } else {
            //         console.error('[SSE Service] Max reconnection attempts reached');
            //         this.disconnect();
            //     }
            // });
        } catch (error) {
            console.error('[SSE Service] Failed to create EventSource:', error);
            config.onError?.(error as Error);
        }
    }

    private async showParkingCompleteNotification(data: ParkingEventData): Promise<void> {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎉 주차 완료!',
                    body: `${data.slotNo} 슬롯에 주차가 완료되었습니다.`,
                    data: { ...data },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });
            console.log('[SSE Service] Parking notification shown for slot:', data.slotNo);
        } catch (error) {
            console.error('[SSE Service] Failed to show parking notification:', error);
        }
    }

    // NEW: Notification for exit
    private async showExitCompleteNotification(data: ParkingEventData): Promise<void> {
        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '🎉 출차 완료!',
                    body: `차량(${data.carNo})의 출차가 완료되었습니다. 이용해주셔서 감사합니다.`,
                    data: { ...data },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });
            console.log('[SSE Service] Exit notification shown for car:', data.carNo);
        } catch (error) {
            console.error('[SSE Service] Failed to show exit notification:', error);
        }
    }

    disconnect(): void {
        if (this.eventSource) {
            console.log('[SSE Service] Disconnecting...');
            this.eventSource.close();
            this.eventSource = null;
            this.config?.onDisconnect?.();
            this.config = null;
            this.reconnectAttempts = 0;
        }
    }

    isConnected(): boolean {
        return this.eventSource !== null;
    }
}

// Singleton instance
export const parkingCompleteSSE = new ParkingCompleteSSEService();
