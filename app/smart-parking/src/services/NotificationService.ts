import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 알림 핸들러 설정: 앱이 실행 중일 때 알림이 오면 어떻게 표시할지 결정
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    } as Notifications.NotificationBehavior),
});

/**
 * 푸시 알림 권한을 요청하고 FCM 토큰을 가져옵니다.
 * @returns {Promise<string | undefined>} FCM Token
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // if (Device.isDevice) 체크 제거: 에뮬레이터(Google Play 지원)에서도 동작함
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('푸시 알림 권한이 허용되지 않았습니다.');
        return undefined;
    }

    // Expo Go가 아닌 실제 프로젝트 ID를 사용하기 위해 projectId 명시 (선택 사항이나 권장)
    // app.json에 extra.eas.projectId가 설정되어 있다면 자동으로 가져옴
    // 여기서는 기본적으로 가져오도록 시도
    try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
        // 만약 Expo Push Token을 쓴다면:
        // token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig?.extra?.eas?.projectId })).data;

        // **중요**: 백엔드와 FCM 연동을 위해서는 'Device Push Token' (FCM Token)이 필요할 수 있음.
        // 하지만 Expo Notifications를 사용할 경우, Expo Push Token을 쓰는 것이 일반적임.
        // Firebase Admin SDK를 백에서 쓴다면 Device Token(FCM Token)이 필요함.
        // getDevicePushTokenAsync()가 FCM 토큰을 반환함.
    } catch (e) {
        console.log('토큰 발급 중 에러 발생:', e);
    }

    console.log('FCM Token:', token);
    return token;
}
