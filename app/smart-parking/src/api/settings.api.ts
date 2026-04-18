import client from './client';
import { API_ENDPOINTS } from '../utils/config';
import { ParkingSettings } from '../types';

/**
 * Settings API integration
 * GET /api/v1/settings
 */
export const SettingsApi = {
    getSettings: async (): Promise<ParkingSettings> => {
        const response = await client.get<ParkingSettings>(API_ENDPOINTS.SETTINGS);
        return response.data;
    },
};
