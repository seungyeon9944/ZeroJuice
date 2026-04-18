
import EventSource, { EventSourceListener } from "react-native-sse";
import client from "../api/client";

// Base URL for SSE - assuming client has baseURL configured, but EventSource needs full URL.
// We'll try to extract from client or hardcode/env.
// Client.defaults.baseURL is usually set. 
// For now, assume consistent base URL behavior.
// If client.ts uses "http://10.0.2.2:8080", we need that.

const BASE_URL = "https://i14a201.p.ssafy.io/api/v1/sse"; // Standard Android Emulator Localhost

type SseCallback = (data: any) => void;

interface SseCallbacks {
    onStatusChange?: SseCallback;
    onLocationUpdate?: SseCallback;
    onParkingComplete?: SseCallback;
    onPaymentUpdate?: SseCallback;
}

class SseManager {
    private listeners: Map<string, EventSource> = new Map();

    connect(userId: number, callbacks: SseCallbacks) {
        console.log(`[SseManager] Connecting for user ${userId}...`);
        this.disconnect(); // Clear existing

        // 1. Status Channel
        // Topic: app-status-{userId}
        this.createConnection(
            `${BASE_URL}/app/parking-status/${userId}`,
            (event) => {
                const data = this.parseData(event.data);
                console.log('[SSE-Status]', data);
                if (callbacks.onStatusChange) callbacks.onStatusChange(data);
            }
        );

        // 2. Location Channel
        // Topic: app-location-{userId}
        this.createConnection(
            `${BASE_URL}/app/parking-location/${userId}`,
            (event) => {
                const data = this.parseData(event.data);
                // console.log('[SSE-Location]', data); // Verbose
                if (callbacks.onLocationUpdate) callbacks.onLocationUpdate(data);
            }
        );

        // 3. Complete Channel
        // Topic: app-complete-{userId}
        this.createConnection(
            `${BASE_URL}/app/parking-complete/${userId}`,
            (event) => {
                const data = this.parseData(event.data);
                console.log('[SSE-Complete]', data);
                if (callbacks.onParkingComplete) callbacks.onParkingComplete(data);
            }
        );

        // 4. Payment Flow Channel
        // Topic: app-payment-flow-{userId}
        this.createConnection(
            `${BASE_URL}/app/payment-flow/${userId}`,
            (event) => {
                const data = this.parseData(event.data);
                console.log('[SSE-Payment]', data);
                if (callbacks.onPaymentUpdate) callbacks.onPaymentUpdate(data);
            }
        );
    }

    private createConnection(url: string, onMessage: (event: any) => void) {
        try {
            const es = new EventSource(url);

            es.addEventListener("open", () => {
                console.log(`[SSE] Connected to ${url}`);
            });

            es.addEventListener("message", (event: any) => {
                if (event.type === 'message') {
                    onMessage(event);
                }
            });

            es.addEventListener("error", (event: any) => {
                // console.warn(`[SSE] Error on ${url}:`, event);
                // Reconnection strategy is usually handled by browser/lib, but rn-sse might need help.
                // For now, just log.
            });

            this.listeners.set(url, es);
        } catch (e) {
            console.error(`[SSE] Failed to create connection to ${url}`, e);
        }
    }

    disconnect() {
        this.listeners.forEach(es => es.close());
        this.listeners.clear();
        console.log('[SseManager] Disconnected all.');
    }

    private parseData(data: string | object): any {
        if (typeof data === 'string') {
            try {
                return JSON.parse(data);
            } catch {
                return data;
            }
        }
        return data;
    }
}

export const sseService = new SseManager();
