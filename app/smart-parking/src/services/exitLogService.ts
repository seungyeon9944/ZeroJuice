/**
 * Exit Log SSE Service
 * Subscribes to backend exit log stream and shows notifications
 */

import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface ExitLogData {
    carNo?: string;
    slotNo?: string;
    timestamp?: string;
    message?: string;
    [key: string]: any;
}

export type ExitLogCallback = (data: ExitLogData) => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionCallback = () => void;

interface ExitLogSSEConfig {
    baseUrl: string;
    userId: number;
    onExitLog?: ExitLogCallback;
    onError?: ErrorCallback;
    onConnect?: ConnectionCallback;
    onDisconnect?: ConnectionCallback;
}

class ExitLogSSEService {
    private eventSource: EventSource | null = null;
    private config: ExitLogSSEConfig | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 2000;
    private recentEvents = new Map<string, number>();

    async connect(config: ExitLogSSEConfig): Promise<void> {
        if (this.eventSource) {
            console.warn('[ExitLog SSE] Already connected. Disconnecting first...');
            this.disconnect();
        }

        this.config = config;
        const url = `${config.baseUrl}/sse/app/exitlog/${config.userId}`;

        console.log('[ExitLog SSE] Connecting to:', url);

        try {
            const token = await AsyncStorage.getItem('@juice_token');
            if (!token) {
                throw new Error('No authentication token found. Please login first.');
            }

            this.eventSource = new EventSource(url, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            this.eventSource.addEventListener('open', () => {
                console.log('[ExitLog SSE] Connection established');
                this.reconnectAttempts = 0;
                config.onConnect?.();
            });

            const handleEvent = async (event: any) => {
                if (this.isDuplicateEvent(event)) return;
                try {
                    const data = this.parseData(event.data);
                    await this.showExitLogNotification(data);
                    this.config?.onExitLog?.(data);
                } catch (error) {
                    console.error('[ExitLog SSE] Failed to handle event:', error);
                    this.config?.onError?.(error as Error);
                }
            };

            this.eventSource.addEventListener('message', handleEvent);
            this.eventSource.addEventListener('EXIT_LOG' as any, handleEvent);
            this.eventSource.addEventListener('exitlog' as any, handleEvent);
            this.eventSource.addEventListener('rfid-exit' as any, handleEvent);

            // this.eventSource.addEventListener('error', (error: any) => {
            //     console.error('[ExitLog SSE] Connection error:', error);
            //     config.onError?.(new Error('SSE connection error'));
            //     if (this.reconnectAttempts < this.maxReconnectAttempts) {
            //         this.reconnectAttempts++;
            //         console.log(`[ExitLog SSE] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            //         setTimeout(() => { if (this.config) this.connect(this.config); }, this.reconnectDelay * this.reconnectAttempts);
            //     } else {
            //         console.error('[ExitLog SSE] Max reconnection attempts reached');
            //         this.disconnect();
            //     }
            // });
        } catch (error) {
            console.error('[ExitLog SSE] Failed to create EventSource:', error);
            config.onError?.(error as Error);
        }
    }

    private parseData(raw: any): ExitLogData {
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return { message: raw };
            }
        }
        return raw || {};
    }

    private async showExitLogNotification(data: ExitLogData): Promise<void> {
        const title = '출차 로그 알림';
        const body = data.message
            || (data.carNo && data.slotNo ? `차량(${data.carNo}) 출차 로그 수신 (슬롯 ${data.slotNo})`
                : data.carNo ? `차량(${data.carNo}) 출차 로그 수신`
                    : '출차 로그를 수신했습니다.');

        try {
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: { ...data },
                    sound: true,
                    priority: Notifications.AndroidNotificationPriority.HIGH,
                },
                trigger: null,
            });
            console.log('[ExitLog SSE] Notification shown:', body);
        } catch (error) {
            console.error('[ExitLog SSE] Failed to show notification:', error);
        }
    }

    private isDuplicateEvent(event: any): boolean {
        const key = `${event?.type || ''}|${event?.lastEventId || ''}|${event?.data || ''}`;
        const now = Date.now();
        for (const [k, ts] of this.recentEvents.entries()) {
            if (now - ts > 5000) this.recentEvents.delete(k);
        }
        if (this.recentEvents.has(key)) return true;
        this.recentEvents.set(key, now);
        return false;
    }

    disconnect(): void {
        if (this.eventSource) {
            console.log('[ExitLog SSE] Disconnecting...');
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

export const exitLogSSE = new ExitLogSSEService();
