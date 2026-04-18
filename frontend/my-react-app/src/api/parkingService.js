import api from './axios';

/**
 * 주차 히스토리 조회
 * @param {number} page - 페이지 번호 (0부터 시작)
 * @param {number} size - 페이지 크기
 * @param {string} plateNumber - 차량번호 필터 (선택)
 * @param {string} startDate - 시작일자 필터 (선택, YYYY-MM-DD)
 * @returns {Promise} API 응답
 */
export const getParkingHistories = async (page = 0, size = 20, plateNumber = '', startDate = '') => {
    try {
        let url = `/parking/histories`;
        const params = new URLSearchParams();

        params.append('page', page);
        params.append('size', size);

        // 필터가 있는 경우 통합 검색 엔드포인트 사용
        if (plateNumber || startDate) {
            url = `/parking/histories/search`;

            if (plateNumber) {
                params.append('carNo', plateNumber);
            }

            if (startDate) {
                // 백엔드가 ISO DateTime 형식을 원하므로 변환 (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
                params.append('startDate', `${startDate}T00:00:00`);
                params.append('endDate', `${startDate}T23:59:59`);
            }
        }

        const finalUrl = `${url}?${params.toString()}`;
        console.log('🔍 Fetching URL:', finalUrl);

        const response = await api.get(finalUrl);
        return response.data;
    } catch (error) {
        console.error('❌ 주차 히스토리 조회 실패:', error);
        console.error('Full error object:', error);
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
        console.error('Response headers:', error.response?.headers);
        throw error;
    }
};

/**
 * 최근 주차 히스토리 조회 (Dashboard용)
 * @param {number} limit - 조회할 개수
 * @returns {Promise} API 응답
 */
export const getRecentParkingHistories = async (limit = 3) => {
    try {
        const response = await api.get(`/parking/histories?page=0&size=${limit}`);
        return response.data;
    } catch (error) {
        console.error('❌ 최근 주차 히스토리 조회 실패:', error);
        throw error;
    }
};

/**
 * 전체 주차 상태 조회
 * @returns {Promise} 슬롯 번호와 상태의 맵 (Map<Byte, String>)
 */
export const getAllParkingStatus = async () => {
    try {
        const response = await api.get('/parking-slots/status');
        return response.data;
    } catch (error) {
        console.error('❌ 전체 주차 상태 조회 실패:', error);
        throw error;
    }
};

/**
 * 빈 슬롯 개수 조회
 * @returns {Promise<number>} 빈 슬롯 개수
 */
export const getEmptySlotCount = async () => {
    try {
        const response = await api.get('/parking-slots/empty-count');
        return response.data;
    } catch (error) {
        console.error('❌ 빈 슬롯 개수 조회 실패:', error);
        throw error;
    }
};

/**
 * 주차 중인 슬롯 개수 조회
 * @returns {Promise<number>} 주차 중인 슬롯 개수
 */
export const getParkingSlotCount = async () => {
    try {
        const response = await api.get('/parking-slots/parking-count');
        return response.data;
    } catch (error) {
        console.error('❌ 주차 중인 슬롯 개수 조회 실패:', error);
        throw error;
    }
};
