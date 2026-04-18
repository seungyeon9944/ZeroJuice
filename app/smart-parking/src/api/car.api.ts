import client from './client';
import { ApiResponse } from '../types/common.types';

export interface CarRegisterRequest {
    carNo: string;
    rfidNo?: string;
}

export const CarApi = {
    /**
     * 차량 등록 및 수정
     * POST /api/car?userId=...
     */
    registerOrUpdateCar: async (userId: number, data: CarRegisterRequest): Promise<ApiResponse<string>> => {
        const response = await client.post<ApiResponse<string>>('/api/car', data, {
            params: { userId }
        });
        return response.data;
    },

    /**
     * 내 차량 조회 (Optional, if needed for checking existence)
     * For now, we might rely on calling register/update blindly or key off errors.
     * But usually a GET is helpful. Let's assume we might add GET later or just use register.
     */
    /**
     * 차량 삭제
     * DELETE /api/car?userId=...&carNo=...
     */
    deleteCar: async (userId: number, carNo: string): Promise<ApiResponse<string>> => {
        const response = await client.delete<ApiResponse<string>>('/api/car', {
            params: { userId, carNo }
        });
        return response.data;
    },
};
