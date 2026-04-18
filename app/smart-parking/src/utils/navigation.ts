/**
 * 외부 앱 연동 유틸리티
 * - T맵 길안내
 * - 카카오맵 앱 연동
 */
import { Linking, Alert, Platform } from 'react-native';

interface NavigationParams {
    goalName: string;
    goalLat: number;
    goalLng: number;
    startLat?: number;
    startLng?: number;
}

/**
 * T맵 길안내 실행
 * - 앱이 설치되어 있으면 T맵으로 이동
 * - 없으면 스토어로 이동
 */
export const openTmapNavigation = async (params: NavigationParams): Promise<void> => {
    const { goalName, goalLat, goalLng } = params;

    // T맵 딥링크 URL
    const tmapUrl = `tmap://route?goalname=${encodeURIComponent(goalName)}&goalx=${goalLng}&goaly=${goalLat}`;

    try {
        const canOpen = await Linking.canOpenURL(tmapUrl);

        if (canOpen) {
            await Linking.openURL(tmapUrl);
        } else {
            // T맵 앱이 없으면 스토어로 이동
            Alert.alert(
                'T맵 설치 필요',
                'T맵 앱이 설치되어 있지 않습니다. 스토어에서 설치하시겠습니까?',
                [
                    { text: '취소', style: 'cancel' },
                    {
                        text: '설치하기',
                        onPress: () => {
                            const storeUrl = Platform.OS === 'ios'
                                ? 'https://apps.apple.com/kr/app/tmap/id431589174'
                                : 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
                            Linking.openURL(storeUrl);
                        }
                    },
                ]
            );
        }
    } catch (error) {
        console.error('T맵 실행 오류:', error);
        Alert.alert('오류', 'T맵 실행에 실패했습니다.');
    }
};

/**
 * 카카오맵 앱으로 길안내
 */
export const openKakaoMapNavigation = async (params: NavigationParams): Promise<void> => {
    const { goalName, goalLat, goalLng } = params;

    const kakaoUrl = `kakaomap://route?ep=${goalLat},${goalLng}&by=CAR`;

    try {
        const canOpen = await Linking.canOpenURL(kakaoUrl);

        if (canOpen) {
            await Linking.openURL(kakaoUrl);
        } else {
            // 웹 버전으로 대체
            const webUrl = `https://map.kakao.com/link/to/${encodeURIComponent(goalName)},${goalLat},${goalLng}`;
            await Linking.openURL(webUrl);
        }
    } catch (error) {
        console.error('카카오맵 실행 오류:', error);
        Alert.alert('오류', '카카오맵 실행에 실패했습니다.');
    }
};

/**
 * 네이버맵 앱으로 길안내
 */
export const openNaverMapNavigation = async (params: NavigationParams): Promise<void> => {
    const { goalName, goalLat, goalLng } = params;

    const naverUrl = `nmap://route/car?dlat=${goalLat}&dlng=${goalLng}&dname=${encodeURIComponent(goalName)}&appname=com.smartparking`;

    try {
        const canOpen = await Linking.canOpenURL(naverUrl);

        if (canOpen) {
            await Linking.openURL(naverUrl);
        } else {
            // 웹 버전으로 대체
            const webUrl = `https://map.naver.com/v5/directions/-/-/-/car?c=${goalLng},${goalLat}`;
            await Linking.openURL(webUrl);
        }
    } catch (error) {
        console.error('네이버맵 실행 오류:', error);
        Alert.alert('오류', '네이버맵 실행에 실패했습니다.');
    }
};
