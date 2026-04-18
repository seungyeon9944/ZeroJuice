/**
 * Mock 주차장 데이터
 */
import { ParkingLot, ParkingSlot } from '../types';

// 서울 주요 지역 주차장 Mock 데이터
export const MOCK_PARKING_LOTS: ParkingLot[] = [
    {
        id: 'p1',
        name: '강남역 스마트 주차장',
        address: '서울 강남구 강남대로 396',
        lat: 37.4979,
        lng: 127.0276,
        totalSpaces: 200,
        availableSpaces: 45,
        pricePerHour: 3000,
        pricePerMinute: 50,
        isOpen: true,
        openTime: '00:00',
        closeTime: '24:00',
        hasAutoParking: true,
    },
    {
        id: 'p2',
        name: '삼성역 자동주차 타워',
        address: '서울 강남구 테헤란로 508',
        lat: 37.5089,
        lng: 127.0631,
        totalSpaces: 350,
        availableSpaces: 123,
        pricePerHour: 2500,
        pricePerMinute: 42,
        isOpen: true,
        openTime: '06:00',
        closeTime: '23:00',
        hasAutoParking: true,
    },
    {
        id: 'p3',
        name: '홍대입구 공영주차장',
        address: '서울 마포구 양화로 188',
        lat: 37.5571,
        lng: 126.9241,
        totalSpaces: 150,
        availableSpaces: 12,
        pricePerHour: 2000,
        pricePerMinute: 34,
        isOpen: true,
        openTime: '00:00',
        closeTime: '24:00',
        hasAutoParking: false,
    },
    {
        id: 'p4',
        name: '신촌 로터리 주차장',
        address: '서울 서대문구 신촌로 141',
        lat: 37.5596,
        lng: 126.9370,
        totalSpaces: 100,
        availableSpaces: 0,
        pricePerHour: 1500,
        pricePerMinute: 25,
        isOpen: true,
        openTime: '07:00',
        closeTime: '22:00',
        hasAutoParking: false,
    },
    {
        id: 'p5',
        name: '명동 중앙 스마트파킹',
        address: '서울 중구 명동길 74',
        lat: 37.5636,
        lng: 126.9851,
        totalSpaces: 250,
        availableSpaces: 67,
        pricePerHour: 4000,
        pricePerMinute: 67,
        isOpen: true,
        openTime: '00:00',
        closeTime: '24:00',
        hasAutoParking: true,
    },
    {
        id: 'p6',
        name: '이태원역 지하주차장',
        address: '서울 용산구 이태원로 177',
        lat: 37.5346,
        lng: 126.9946,
        totalSpaces: 80,
        availableSpaces: 34,
        pricePerHour: 2500,
        pricePerMinute: 42,
        isOpen: true,
        openTime: '08:00',
        closeTime: '23:00',
        hasAutoParking: false,
    },
    {
        id: 'p7',
        name: '잠실 스마트파킹 센터',
        address: '서울 송파구 올림픽로 300',
        lat: 37.5133,
        lng: 127.1001,
        totalSpaces: 400,
        availableSpaces: 189,
        pricePerHour: 2000,
        pricePerMinute: 34,
        isOpen: true,
        openTime: '00:00',
        closeTime: '24:00',
        hasAutoParking: true,
    },
    {
        id: 'p8',
        name: '여의도 IFC 자동주차',
        address: '서울 영등포구 국제금융로 10',
        lat: 37.5251,
        lng: 126.9254,
        totalSpaces: 500,
        availableSpaces: 234,
        pricePerHour: 3500,
        pricePerMinute: 59,
        isOpen: true,
        openTime: '06:00',
        closeTime: '24:00',
        hasAutoParking: true,
    },
];

// 목적지 키워드로 주차장 검색
export const searchParkingLots = (keyword: string): ParkingLot[] => {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const keywordMap: { [key: string]: string[] } = {
        '강남': ['p1', 'p2'],
        '삼성': ['p2'],
        '홍대': ['p3'],
        '신촌': ['p4', 'p3'],
        '명동': ['p5'],
        '이태원': ['p6'],
        '잠실': ['p7'],
        '여의도': ['p8'],
    };

    for (const [key, ids] of Object.entries(keywordMap)) {
        if (normalizedKeyword.includes(key)) {
            const results = MOCK_PARKING_LOTS.filter(lot => ids.includes(lot.id));
            return results.map((lot, index) => ({
                ...lot,
                distance: (index + 1) * 150 + Math.floor(Math.random() * 100),
            }));
        }
    }

    const shuffled = [...MOCK_PARKING_LOTS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map((lot, index) => ({
        ...lot,
        distance: (index + 1) * 200 + Math.floor(Math.random() * 300),
    }));
};

// Mock 주차 공간 생성
export const generateParkingSlots = (parkingLotId: string): ParkingSlot[] => {
    const zones = ['A', 'B', 'C'];
    const slots: ParkingSlot[] = [];

    zones.forEach((zone, zoneIndex) => {
        for (let i = 1; i <= 20; i++) {
            slots.push({
                id: `${zone}-${i.toString().padStart(2, '0')}`,
                zone,
                number: i,
                status: Math.random() > 0.3 ? 'AVAILABLE' : 'OCCUPIED',
                floor: zoneIndex + 1,
                isHandicapped: i <= 2,
                isElectric: i >= 18,
            });
        }
    });

    return slots;
};
