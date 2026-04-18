import client from './client';
import { API_ENDPOINTS } from '../utils/config';
import { ParkingSlotDto, ApiResponse } from '../types';
import { PaymentResponse } from '../types/payment.types';

/**
 * Parking API integration
 * Matches Backend ParkingController
 */
export const ParkingApi = {
    /**
     * 입차 요청
     * 명세서: POST /parking/request-entry?userId={userId}
     */
    requestEntry: async (userId: number): Promise<ParkingSlotDto> => {
        const response = await client.post<ParkingSlotDto>(API_ENDPOINTS.PARKING_ENTRY, null, {
            params: { userId }
        });
        return response.data;
    },

    /**
     * 출차 요청
     * 명세서: POST /parking/request-exit?userId={userId}
     */
    requestExit: async (userId: number): Promise<ParkingSlotDto> => {
        const response = await client.post<ParkingSlotDto>(API_ENDPOINTS.PARKING_EXIT, null, {
            params: { userId }
        });
        return response.data;
    },

    /**
     * 결제 정보 조회
     * 명세서: GET /payment/{recordId}
     */
    getPaymentInfo: async (recordId: number): Promise<PaymentResponse> => {
        const response = await client.get<ApiResponse<PaymentResponse>>(`${API_ENDPOINTS.PAYMENT_INFO}/${recordId}`);
        // ApiResponse uses 'success' boolean, not 'status' string
        if (response.data.success && response.data.data) {
            return response.data.data;
        }
        throw new Error(response.data.message || '결제 정보를 불러오는데 실패했습니다.');
    },

    /**
     * 전체 주차 슬롯 상태 조회
     */
    getAllParkingStatus: async (): Promise<Record<string, string>> => {
        const response = await client.get<Record<string, string>>(API_ENDPOINTS.PARKING_LOTS_STATUS);
        return response.data;
    },

    /**
     * 차량 ID로 출차(결제) 처리
     * PUT /api/parking/histories/by-car/{carId}/checkout
     */
    checkoutByCarId: async (carId: number, method: 'CARD' | 'KAKAO_PAY', updater: string): Promise<any> => {
        const response = await client.put<any>(`/api/parking/histories/by-car/${carId}/checkout`, {
            method,
            updater
        });
        return response.data;
    },
};
