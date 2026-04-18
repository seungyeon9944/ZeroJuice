/**
 * 결제 관련 타입 정의
 */

// 결제 수단
export type PaymentMethod = 'KAKAO_PAY' | 'NAVER_PAY' | 'CARD' | 'SAMSUNG_PAY';

// 결제 상태
export type PaymentStatus =
    | 'PENDING'
    | 'OK'
    | 'FAIL'
    | 'FAILED';

// 결제 요청
export interface PaymentRequest {
    sessionId: string;
    carNumber: string;
    amount: number;
    method: PaymentMethod;
}

// 결제 응답
export interface PaymentResponse {
    transactionId: string;
    status: PaymentStatus;
    amount: number;
    method: PaymentMethod;
    paidAt: string | null;
    receiptUrl: string | null;
    message: string;
}

// 결제 내역
export interface PaymentHistory {
    id: string;
    transactionId: string;
    parkingLotName: string;
    carNumber: string;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt: string;
    duration: number;       // 주차 시간 (분)
}

// 영수증
export interface Receipt {
    transactionId: string;
    parkingLotName: string;
    parkingLotAddress: string;
    carNumber: string;
    enteredAt: string;
    exitedAt: string;
    duration: number;
    baseFee: number;
    discountAmount: number;
    finalAmount: number;
    method: PaymentMethod;
    paidAt: string;
}
