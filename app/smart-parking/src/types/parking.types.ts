/**
 * 주차 관련 타입 정의
 */

// 주차 상태
export type ParkingStatus =
    | 'IDLE'           // 주차 안 함
    | 'ENTERING'       // 입차 중
    | 'PARKING'        // 주차 진행 중 (자동주차)
    | 'PARKED'         // 주차 완료
    | 'EXITING'        // 출차 중
    | 'COMPLETED';     // 출차 완료

// 주차 공간 상태
export type SlotStatus = 'EMPTY' | 'PARKING';

// 주차 공간 정보
export interface ParkingSlot {
    id: number;       // string -> number
    slotNo: string | number;         // 공간 번호
    status: SlotStatus;
    posX?: number;       // DB에 추가된 좌표값 (필요 시)
    posY?: number;
}

// 주차장 정보
export interface ParkingLot {
    id: string;
    name: string;
    address: string;
    lat: number;
    lng: number;
    totalSpaces: number;
    availableSpaces: number;
    pricePerHour: number;
    pricePerMinute: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
    hasAutoParking: boolean;
    distance?: number;
}

// 주차 세션 (현재 주차 정보)
export interface ParkingSession {
    id: string;
    carNumber: string;
    parkingLot: ParkingLot;
    slot: ParkingSlot | null;
    status: ParkingStatus;
    enteredAt: string | null;      // 입차 시간
    parkedAt: string | null;       // 주차 완료 시간
    exitRequestedAt: string | null; // 출차 요청 시간
    exitedAt: string | null;       // 출차 완료 시간

    // 주차 진행 상태 (0-100%)
    progress: number;
    progressMessage: string;

    // 현재 요금 (실시간 계산 또는 최종)
    fee?: number;
}

// 주차 요금
export interface ParkingFee {
    sessionId: string;
    carNumber: string;
    parkingLotName: string;
    enteredAt: string;
    duration: number;           // 분
    baseFee: number;
    discountAmount: number;
    discountReason: string | null;
    finalFee: number;
}

// 입차 요청
export interface EntryRequest {
    carNumber: string;
    parkingLotId: string;
    preferredSlot?: string;     // 선호 공간 (선택)
}

// 입차 응답
export interface EntryResponse {
    success: boolean;
    session: ParkingSession;
    assignedSlot: ParkingSlot;
    estimatedTime: number;      // 예상 소요 시간 (초)
    message: string;
}

// 출차 요청
export interface ExitRequest {
    sessionId: string;
    carNumber: string;
}

// 출차 응답
export interface ExitResponse {
    success: boolean;
    session: ParkingSession;
    fee: ParkingFee;
    estimatedTime: number;
    message: string;
}

// 주차 진행 업데이트 (실시간)
export interface ParkingProgressUpdate {
    sessionId: string;
    status: ParkingStatus;
    progress: number;
    message: string;
}

// 알림 타입
export type NotificationType =
    | 'AUTO_PARKING_AVAILABLE'
    | 'PARKING_STARTED'
    | 'PARKING_COMPLETED'
    | 'EXIT_STARTED'
    | 'EXIT_COMPLETED'
    | 'PAYMENT_REQUIRED'
    | 'PAYMENT_COMPLETED';

// 알림
export interface ParkingNotification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    createdAt: string;
    isRead: boolean;
}

// Backend Response DTO
export interface ParkingSlotDto {
    commandId: string;
    type: string;
    slotNo: string; // e.g., "A1"
    timestamp: string;
}

// 차량 위치 데이터 (MQTT via SSE)
export interface VehiclePose {
    type: 'PARK' | 'EXIT';
    slotNo: string;          // e.g., "A1"
    carNo: string;           // 차량 번호
    x: number;               // 실제 좌표 (미터 등)
    y: number;
    yaw: number;             // 방향 (라디안)
    timestamp: string;       // ISO 8601 형식
}

// SSE 이벤트 타입
export interface VehiclePoseEvent {
    data: VehiclePose;
    id?: string;
    event?: string;
}
