/**
 * ParkingContext - 주차 상태 중앙 관리 (Real API Integration)
 */
import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';
import {
    ParkingStatus,
    ParkingSession,
    ParkingSlot,
    ParkingLot,
    ParkingFee,
    EntryRequest,
    EntryResponse,
    ExitRequest,
    ExitResponse,
    ParkingNotification,
    NotificationType,
    ParkingSlotDto,
    ParkingSettings
} from '../types';
import { ParkingApi } from '../api/parking.api';
import { SettingsApi } from '../api/settings.api';
import { getUser } from '../services/authService';
import { vehiclePoseSSE } from '../services/vehiclePoseService';
import { API_CONFIG } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 주차 컨텍스트 타입
interface ParkingContextType {
    currentSession: ParkingSession | null;
    status: ParkingStatus;
    currentParkingLot: ParkingLot | null;
    notifications: ParkingNotification[];
    requestEntry: (request: EntryRequest) => Promise<EntryResponse>;
    requestExit: (request: ExitRequest) => Promise<ExitResponse>;
    completePayment: (method: 'CARD' | 'KAKAO_PAY') => Promise<void>;
    getFee: () => ParkingFee | null;
    clearSession: () => void;
    markNotificationAsRead: (id: string) => void;
    addNotification: (type: NotificationType, title: string, body: string) => void;
    simulateEntry: (carNumber: string) => Promise<void>; // Deprecated but kept for compatibility
    updateStatus: (status: ParkingStatus) => void; // For external updates (SSE)
    coordinate: { x: number; y: number } | null;
    rotation: number;
    setCoordinate: (coord: { x: number; y: number } | null) => void;
    subscribeToCoordinates: (callback: (coord: { x: number; y: number; rotation: number }) => void) => () => void;
    isLoading: boolean;
    refreshSettings: () => Promise<void>;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

// Default Parking Lot (For display only, since backend doesn't return lot details yet)
const DEFAULT_PARKING_LOT: ParkingLot = {
    id: 'lot-1',
    name: 'SSAFY 본사 주차장',
    address: '대전광역시 유성구 동서대로 98-39',
    lat: 36.350411,
    lng: 127.384547,
    totalSpaces: 6,
    availableSpaces: 5,
    pricePerHour: 3000,
    pricePerMinute: 50,
    isOpen: true,
    openTime: '00:00',
    closeTime: '24:00',
    hasAutoParking: true,
    distance: 0.5,
};

export const ParkingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentSession, setCurrentSession] = useState<ParkingSession | null>(null);
    const [status, setStatus] = useState<ParkingStatus>('IDLE');
    const [currentParkingLot, setCurrentParkingLot] = useState<ParkingLot | null>(null);
    const [notifications, setNotifications] = useState<ParkingNotification[]>([]);
    const [coordinate, setCoordinate] = useState<{ x: number; y: number } | null>(null);
    const [rotation, setRotation] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [parkingSettings, setParkingSettings] = useState<ParkingSettings | null>(null);

    // Simulation Ref
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Hardcoded Points matching IndoorMap (Mock)
    const ENTRANCE = { x: 45, y: 5 }; // Top Center
    const CENTER = { x: 50, y: 40 };  // Driving Lane
    const SLOT_COORDS: Record<string, { x: number, y: number, rotation: number }> = {
        // Row A (Top Right - Vertical)
        'A1': { x: 68, y: 20, rotation: 0 },
        'A2': { x: 85, y: 20, rotation: 0 },
        // Row B (Bottom Left - Horizontal)
        'B1': { x: 25, y: 55, rotation: 90 },
        'B2': { x: 25, y: 80, rotation: 90 },
        // Row C (Bottom Right - Horizontal)
        'C1': { x: 75, y: 55, rotation: -90 },
        'C2': { x: 75, y: 80, rotation: -90 },
        // Default
        'DEFAULT': { x: 50, y: 50, rotation: 0 }
    };

    // 알림 추가
    const addNotification = useCallback((type: NotificationType, title: string, body: string) => {
        const notification: ParkingNotification = {
            id: Date.now().toString(),
            type,
            title,
            body,
            createdAt: new Date().toISOString(),
            isRead: false,
        };
        setNotifications(prev => [notification, ...prev]);
    }, []);

    // 상태 업데이트 (SSE 등에서 호출)
    const updateStatus = useCallback((newStatus: ParkingStatus) => {
        console.log('[ParkingContext] Status updated:', newStatus);

        // 1. Update simple status state
        setStatus(newStatus);

        if (newStatus === 'COMPLETED' && simulationIntervalRef.current) {
            clearInterval(simulationIntervalRef.current);
            simulationIntervalRef.current = null;
        }
        // 2. Update session status safely
        setCurrentSession(prev => {
            if (!prev) {
                console.warn('[ParkingContext] Cannot update status - No active session');
                return null;
            }
            return { ...prev, status: newStatus };
        });
    }, []);

    // Coordinate Subscribers (Performance Optimization)
    const coordinateSubscribers = useRef<Array<(coord: { x: number; y: number; rotation: number }) => void>>([]);

    const subscribeToCoordinates = useCallback((callback: (coord: { x: number; y: number; rotation: number }) => void) => {
        coordinateSubscribers.current.push(callback);
        // Initial call if coordinate exists
        if (coordinate) {
            callback({ x: coordinate.x, y: coordinate.y, rotation });
        }
        return () => {
            coordinateSubscribers.current = coordinateSubscribers.current.filter(cb => cb !== callback);
        };
    }, [coordinate, rotation]);

    const notifySubscribers = (x: number, y: number, rot: number) => {
        coordinateSubscribers.current.forEach(callback => callback({ x, y, rotation: rot }));
    };

    const refreshSettings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('@juice_token');
            if (!token) {
                setParkingSettings(null);
                return;
            }
            const settings = await SettingsApi.getSettings();
            setParkingSettings(settings);
        } catch (error) {
            console.error('[ParkingContext] Failed to load settings:', error);
        }
    }, []);




    // Real-time Position Handler
    const handlePoseUpdate = useCallback((pose: { x: number; y: number; yaw: number }) => {
        // 1. Notify Subscribers (Animation)
        // vehiclePoseService already emits mapped coordinates.
        // yaw from service is already adjusted (-90).
        notifySubscribers(pose.x, pose.y, pose.yaw);

        // 2. Update Context State
        setCoordinate({ x: pose.x, y: pose.y });
        setRotation(pose.yaw);

        // 3. Check Proximity for Auto-Status Update (Optional but good for UX)
        // If we want to automatically switch to PARKED/COMPLETED based on position.
        // For now, we rely on the visual tracking.
        // Or we can implement a simple check:
        // if (distance(pose, target) < threshold) updateStatus('PARKED');
    }, []);

    // 입차 요청 (Real API + SSE)
    const requestEntry = useCallback(async (request: EntryRequest): Promise<EntryResponse> => {
        setIsLoading(true);
        console.log('[ParkingContext] Requesting Entry via API...');

        try {
            // Refresh settings at entry time
            await refreshSettings();

            // 1. Get User ID
            const user = await getUser();
            if (!user) throw new Error('User not found. Please login.');

            // 2. Call API
            const responseDto: ParkingSlotDto = await ParkingApi.requestEntry(user.id);
            console.log('[ParkingContext] API Response:', responseDto);

            // 3. Map Response to Session
            const assignedSlot: ParkingSlot = {
                id: 1, // Backend response (ParkingSlotDto) only has slotNo, using dummy ID 1 or map from slotNo if needed
                slotNo: responseDto.slotNo, // "A1"
                status: 'PARKING'
            };

            const session: ParkingSession = {
                id: responseDto.commandId || `session-${Date.now()}`,
                carNumber: request.carNumber,
                parkingLot: DEFAULT_PARKING_LOT,
                slot: assignedSlot,
                status: 'ENTERING',
                enteredAt: new Date().toISOString(),
                parkedAt: null,
                exitRequestedAt: null,
                exitedAt: null,
                progress: 0,
                progressMessage: '입차 처리 중...',
            };

            setCurrentSession(session);
            setCurrentParkingLot(DEFAULT_PARKING_LOT);
            setStatus('ENTERING');

            // Set initial position if available, otherwise just wait for SSE
            // We can optionally set ENTRANCE as starting point
            setCoordinate(ENTRANCE);
            setRotation(0);

            addNotification('PARKING_STARTED', '입차 요청 완료', `공간 배정: ${assignedSlot.slotNo}. 자동 주차가 곧 시작됩니다.`);

            // ★ Connect SSE for Real-time Tracking
            vehiclePoseSSE.connect({
                baseUrl: API_CONFIG.BASE_URL,
                userId: user.id,
                onPoseUpdate: (pose) => {
                    handlePoseUpdate(pose);
                },
                onError: (err: any) => console.error('[SSE] Error:', err),
                onConnect: () => console.log('[SSE] Connected for Entry')
            });

            return {
                success: true,
                session,
                assignedSlot,
                estimatedTime: 0,
                message: '입차 요청이 접수되었습니다.',
            };
        } catch (error: any) {
            console.error('[ParkingContext] Entry Request Failed:', error);
            let errorMessage = '입차 요청 실패';

            if (error.response) {
                // Server responded with a status code
                console.error('[ParkingContext] Error Data:', error.response.data);
                console.error('[ParkingContext] Error Status:', error.response.status);

                errorMessage = error.response.data?.message || `서버 오류 (${error.response.status})`;
                if (error.response.status === 500 && errorMessage.includes('로그인이 만료')) {
                    errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
                    // Optionally trigger logout logic here if possible
                }
            } else if (error.request) {
                // Request was made but no response received
                errorMessage = '서버 응답이 없습니다. 네트워크를 확인해주세요.';
            } else {
                errorMessage = error.message;
            }

            return {
                success: false,
                session: null as any,
                assignedSlot: null as any,
                estimatedTime: 0,
                message: errorMessage,
            };
        } finally {
            setIsLoading(false);
        }
    }, [addNotification, handlePoseUpdate]);

    // 출차 요청 (Real API + SSE)
    const requestExit = useCallback(async (request: ExitRequest): Promise<ExitResponse> => {
        setIsLoading(true);
        try {
            const user = await getUser();
            if (!user) throw new Error('User not found');

            const responseDto = await ParkingApi.requestExit(user.id);
            console.log('[ParkingContext] Exit Response:', responseDto);

            const updatedSession: ParkingSession = currentSession ? {
                ...currentSession,
                status: 'EXITING',
                exitRequestedAt: new Date().toISOString()
            } : {
                id: responseDto.commandId,
                carNumber: request.carNumber,
                parkingLot: DEFAULT_PARKING_LOT,
                slot: null,
                status: 'EXITING',
                enteredAt: null,
                parkedAt: null,
                exitRequestedAt: new Date().toISOString(),
                exitedAt: null,
                progress: 0,
                progressMessage: '출차 중...',
            };

            setCurrentSession(updatedSession);
            setStatus('EXITING');

            addNotification('EXIT_STARTED', '출차 요청 완료', '자동 출차가 시작됩니다.');

            // ★ Connect SSE for Real-time Tracking
            vehiclePoseSSE.connect({
                baseUrl: API_CONFIG.BASE_URL,
                userId: user.id,
                onPoseUpdate: (pose) => {
                    handlePoseUpdate(pose);
                },
                onError: (err: any) => console.error('[SSE] Error:', err),
                onConnect: () => console.log('[SSE] Connected for Exit')
            });

            return {
                success: true,
                session: updatedSession,
                fee: null as any,
                estimatedTime: 0,
                message: '출차 요청이 접수되었습니다.',
            };
        } catch (error: any) {
            console.error('[ParkingContext] Exit Request Failed:', error);
            return {
                success: false,
                session: null as any,
                fee: null as any,
                estimatedTime: 0,
                message: error.message || '출차 요청 실패',
            };
        } finally {
            setIsLoading(false);
        }
    }, [currentSession, addNotification, handlePoseUpdate]);

    // 결제 완료 처리 (New API Integration)
    const completePayment = useCallback(async (method: 'CARD' | 'KAKAO_PAY') => {
        setIsLoading(true);
        try {
            const user = await getUser();
            if (!user) throw new Error('User not found');

            // TODO: Ensure we have the correct Car ID. Using user.id as fallback for now.
            // Assuming user.id corresponds to carId or we use it as key.
            // If user.id is string, parse it.
            const carId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

            console.log('[ParkingContext] Calling checkoutByCarId API with carId:', carId);
            await ParkingApi.checkoutByCarId(carId, method, user.name || 'User');

            console.log('[ParkingContext] Checkout API Success');
            addNotification('PAYMENT_COMPLETED', '결제 처리 완료', '결제 정보가 서버에 저장되었습니다.');

        } catch (error: any) {
            //console.error('[ParkingContext] Payment Completion Failed:', error);
            // Optionally re-throw or handle error
        } finally {
            setIsLoading(false);
        }
    }, [addNotification]);

    // ...

    const getFee = useCallback((): ParkingFee | null => {
        if (!currentSession || !currentSession.enteredAt) return null;

        const enteredAt = new Date(currentSession.enteredAt);
        const now = new Date();
        const rawDuration = Math.ceil((now.getTime() - enteredAt.getTime()) / (1000 * 60));
        const durationMinutes = Math.max(0, rawDuration);

        const feeBase = parkingSettings?.feeBase ?? 1000;
        const timeBase = parkingSettings?.timeBase ?? 30;
        const feeUnit = parkingSettings?.feeUnit ?? 500;
        const timeUnit = parkingSettings?.timeUnit ?? 10;

        const overMinutes = durationMinutes - timeBase;
        const overUnits = Math.max(0, Math.ceil(overMinutes / timeUnit));
        const baseFee = feeBase + (overUnits * feeUnit);
        return {
            sessionId: currentSession.id,
            carNumber: currentSession.carNumber,
            parkingLotName: DEFAULT_PARKING_LOT.name,
            enteredAt: currentSession.enteredAt,
            duration: durationMinutes,
            baseFee,
            discountAmount: 0,
            discountReason: null,
            finalFee: baseFee,
        };
    }, [currentSession, parkingSettings]);

    const clearSession = useCallback(() => {
        vehiclePoseSSE.disconnect(); // Disconnect SSE
        setCurrentSession(null);
        setCurrentParkingLot(null);
        setCoordinate(null);
        setRotation(0);
        setStatus('IDLE');
    }, []);

    const markNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    }, []);

    const simulateEntry = useCallback(async (carNumber: string): Promise<void> => {
        await requestEntry({
            carNumber,
            parkingLotId: DEFAULT_PARKING_LOT.id,
        });
    }, [requestEntry]);

    const value: ParkingContextType = {
        currentSession,
        status,
        currentParkingLot,
        notifications,
        requestEntry,
        requestExit,
        getFee,
        clearSession,
        markNotificationAsRead,
        addNotification,
        simulateEntry,
        updateStatus,
        completePayment,
        coordinate,
        setCoordinate,
        subscribeToCoordinates,
        isLoading,
        rotation,
        refreshSettings,
    };

    return (
        <ParkingContext.Provider value={value}>
            {children}
        </ParkingContext.Provider>
    );
};

export const useParking = (): ParkingContextType => {
    const context = useContext(ParkingContext);
    if (!context) {
        throw new Error('useParking must be used within a ParkingProvider');
    }
    return context;
};

export default ParkingContext;
