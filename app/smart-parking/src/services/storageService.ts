/**
 * 스토리지 서비스
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// 저장
export const setItem = async (key: string, value: any): Promise<void> => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    await AsyncStorage.setItem(key, stringValue);
};

// 조회
export const getItem = async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    try {
        return JSON.parse(value) as T;
    } catch {
        return value as unknown as T;
    }
};

// 삭제
export const removeItem = async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
};

// 전체 삭제
export const clear = async (): Promise<void> => {
    await AsyncStorage.clear();
};
