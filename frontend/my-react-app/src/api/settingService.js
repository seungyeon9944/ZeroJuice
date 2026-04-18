import api from './axios';

/**
 * 설정 조회
 * @returns {Promise} API 응답
 */
export const getSetting = async () => {
    try {
        const response = await api.get('/settings');
        return response.data;
    } catch (error) {
        console.error('❌ 설정 조회 실패:', error);
        throw error;
    }
};

/**
 * 설정 수정
 * @param {Object} data - 설정 데이터
 * @returns {Promise} API 응답
 */
export const updateSetting = async (data) => {
    try {
        const response = await api.put('/settings', data);
        return response.data;
    } catch (error) {
        console.error('❌ 설정 수정 실패:', error);
        throw error;
    }
};
