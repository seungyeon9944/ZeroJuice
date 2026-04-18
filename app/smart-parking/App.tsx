/**
 * 스마트파킹 - 전체 앱 (피드백 반영)
 */
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Alert } from 'react-native';
import * as SplashScreenPlugin from 'expo-splash-screen'; // Rename import to avoid conflict with Screen component
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { parkingCompleteSSE } from './src/services/parkingCompleteService';
// Types
import { User, AuthProvider as AuthProviderType, ParkingSession, ParkingFee } from './src/types';

// Colors
import { COLORS, DARK_COLORS, ThemeColors } from './src/constants/colors';

// Contexts
import { ParkingProvider, useParking } from './src/contexts';

// Components
import { EntryConfirmModal } from './src/components';
import LoadingModal from './src/components/common/LoadingModal';
// import GlobalLogo from './src/components/common/GlobalLogo'; // Removed per user request

// Screens - Auth
import { SplashScreen, LoginScreen, SignupScreen, ForgotPasswordScreen } from './src/screens/auth';

// Screens - Main
import { MainDashboard } from './src/screens/main';

// Screens - Parking
import { ParkingProgressScreen, ParkingStatusScreen } from './src/screens/parking';

// Screens - Payment
import { PaymentScreen } from './src/screens/payment';

// Screens - Settings
import { SettingsScreen, ProfileScreen, NotificationSettingsScreen } from './src/screens/settings';



// Keep the splash screen visible while we fetch resources
SplashScreenPlugin.preventAutoHideAsync();

export { ThemeColors };

// Screen types
type ScreenName =
  | 'Splash' | 'Login' | 'Signup' | 'ForgotPassword'
  | 'MainDashboard' | 'ParkingProgress' | 'ParkingStatus'
  | 'Payment' | 'Settings' | 'Profile' | 'NotificationSettings'


interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
}

// Services
import * as AuthService from './src/services/authService';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';

// Main App Component (wrapped with ParkingProvider)
function AppContent() {
  const [screen, setScreen] = useState<ScreenName>('Splash');
  const [screenHistory, setScreenHistory] = useState<ScreenName[]>([]);
  const [auth, setAuth] = useState<AuthState>({ isLoading: true, isAuthenticated: false, user: null });
  const [isSplashFinished, setIsSplashFinished] = useState(false);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [hasRegisteredCard, setHasRegisteredCard] = useState(false);

  // Parking Context
  const {
    currentSession,
    status: parkingStatus,
    requestEntry,
    requestExit,
    getFee,
    clearSession,
    simulateEntry,
    updateStatus,
    completePayment,
    refreshSettings,
  } = useParking();

  // Theme
  const colors: ThemeColors = themeMode === 'dark' ? DARK_COLORS : COLORS;
  const isDark = themeMode === 'dark';

  // 초기화
  useEffect(() => {
    loadTheme();
    checkAuth();
  }, []);

  // 주차 상태 변경 감지
  useEffect(() => {
    if (parkingStatus === 'ENTERING' || parkingStatus === 'PARKING') {
      setScreen('ParkingProgress');
    } else if (parkingStatus === 'EXITING') {
      setScreen('ParkingProgress');
    } else if (parkingStatus === 'PARKED') {
      // 주차 완료 시 3초 후 메인으로 이동
      setTimeout(() => {
        setScreen('MainDashboard');
      }, 3000);
    } else if (parkingStatus === 'COMPLETED') {
      setTimeout(() => {
        clearSession();
        setScreen('MainDashboard');
      }, 2000);
    }
  }, [parkingStatus]);

  // 메인 대시보드 진입 시 설정 갱신 (로그인 상태일 때만)
  useEffect(() => {
    if (screen === 'MainDashboard' && auth.isAuthenticated) {
      refreshSettings();
    }
  }, [screen, auth.isAuthenticated, refreshSettings]);

  // FCM 토큰 등록 (로그인 시)
  useEffect(() => {
    const registerToken = async () => {
      // 0. 로컬 설정 확인 (AsyncStorage)
      try {
        const isPushEnabled = await AsyncStorage.getItem('isPushEnabled');
        if (isPushEnabled === 'false') {
          console.log('[App] Push notification disabled locally. Skipping token registration.');
          return;
        }
      } catch (e) {
        console.warn('[App] Failed to check push setting:', e);
      }

      // 1. 권한 요청 (로그인 여부와 상관없이 앱 시작 시 권한 획득 시도 가능)
      // (단, 위에서 'false'가 아닐 때만 진입)
      const token = await registerForPushNotificationsAsync();

      // 2. 로그인 상태라면 백엔드에 토큰 전송
      // 여기서는 user.notificationSettings를 굳이 다시 확인하지 않아도 됨 
      // (이미 AsyncStorage에서 거름 or 초기 실행)
      if (auth.isAuthenticated && auth.user && token) {
        await AuthService.updateFCMToken(token);
      }
    };
    registerToken();
  }, [auth.isAuthenticated]);

  // Parking Complete SSE 연결 (로그인 시)
  useEffect(() => {
    const connectParkingCompleteSSE = async () => {
      if (auth.isAuthenticated && auth.user) {
        const { parkingCompleteSSE } = await import('./src/services/parkingCompleteService');
        const { API_BASE_URL } = await import('./src/utils/config');

        console.log('[App] Connecting to Parking Complete SSE...');

        await parkingCompleteSSE.connect({
          baseUrl: API_BASE_URL,
          userId: typeof auth.user.id === 'string' ? parseInt(auth.user.id) : auth.user.id,
          onParkingComplete: (data) => {
            console.log('[App] Parking completed:', data);
            // 상태 업데이트 -> PARKED -> useEffect에서 메인 이동 처리
            updateStatus('PARKED');
          },
          onConnect: () => {
            console.log('[App] Parking Complete SSE connected');
          },
          onDisconnect: () => {
            console.log('[App] Parking Complete SSE disconnected');
          },
          onError: (error) => {
            console.error('[App] Parking Complete SSE error:', error);
          },
        });
      }
    };

    connectParkingCompleteSSE();

    // Cleanup on logout
    return () => {
      if (!auth.isAuthenticated) {
        import('./src/services/parkingCompleteService').then(({ parkingCompleteSSE }) => {
          parkingCompleteSSE.disconnect();
        });
      }
    };
  }, [auth.isAuthenticated, auth.user]);

  // Exit Log SSE 연결 (로그인 시)
  useEffect(() => {
    const connectExitLogSSE = async () => {
      if (auth.isAuthenticated && auth.user) {
        const { exitLogSSE } = await import('./src/services/exitLogService');
        const { API_BASE_URL } = await import('./src/utils/config');

        console.log('[App] Connecting to Exit Log SSE...');

        await exitLogSSE.connect({
          baseUrl: API_BASE_URL,
          userId: typeof auth.user.id === 'string' ? parseInt(auth.user.id) : auth.user.id,
          onExitLog: (data) => {
            console.log('[App] Exit log received:', data);
            clearSession();
            setScreen('MainDashboard');
          },
          onConnect: () => {
            console.log('[App] Exit Log SSE connected');
          },
          onDisconnect: () => {
            console.log('[App] Exit Log SSE disconnected');
          },
          onError: (error) => {
            console.error('[App] Exit Log SSE error:', error);
          },
        });
      }
    };

    connectExitLogSSE();

    // Cleanup on logout
    return () => {
      if (!auth.isAuthenticated) {
        import('./src/services/exitLogService').then(({ exitLogSSE }) => {
          exitLogSSE.disconnect();
        });
      }
    };
  }, [auth.isAuthenticated, auth.user]);

  // [Smart Entry] 알림 탭 처리 리스너
  useEffect(() => {
    // 알림을 탭해서 앱을 열었을 때 실행됨
    const subscription = import('expo-notifications').then(Notifications => {
      const listener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        // 'action' 값이 'ENTRY_CONFIRM'이면 입차 모달 띄우기
        if (data && data.action === 'ENTRY_CONFIRM') {
          // 약간의 지연 후 모달 오픈 (앱 로딩 안정화)
          setTimeout(() => {
            setShowEntryModal(true);
          }, 500);
        }
      });
      return listener;
    });

    return () => {
      subscription.then(listener => listener.remove());
    };
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('@smartparking_theme');
      if (saved === 'dark' || saved === 'light') {
        setThemeMode(saved);
      }
    } catch { }
  };

  const toggleTheme = async () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
    await AsyncStorage.setItem('@smartparking_theme', newMode);
  };

  const checkAuth = async () => {
    try {
      const user = await AuthService.getUser();
      if (user) {
        setAuth({ isLoading: false, isAuthenticated: true, user });
        setScreen('MainDashboard');
      } else {
        setAuth({ isLoading: false, isAuthenticated: false, user: null });
        setScreen('Login');
      }
    } catch {
      setAuth({ isLoading: false, isAuthenticated: false, user: null });
      setScreen('Login');
    }
  };

  // 휴대폰 로그인
  const handlePhoneLogin = async (phone: string, password: string): Promise<boolean> => {
    try {
      const response = await AuthService.login('phone', { phone, password });
      if (response.success && response.user) {
        setAuth({ isLoading: false, isAuthenticated: true, user: response.user });
        setScreen('MainDashboard');
        return true;
      }
      return false;
    } catch (error) {
      // Alert handled in LoginScreen and client interceptor
      return false;
    }
  };

  // 소셜 로그인
  const handleSocialLogin = async (provider: AuthProviderType, token?: string): Promise<boolean> => {
    try {
      const response = await AuthService.login(provider, { token });
      if (response.success && response.user) {
        setAuth({ isLoading: false, isAuthenticated: true, user: response.user });
        setScreen('MainDashboard');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };



  // 비번 찾기
  const handleResetPassword = async (phone: string): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 1000));
    return true;
  };

  // 로그아웃
  const handleLogout = async () => {
    await AuthService.logout();
    clearSession();
    setAuth({ isLoading: false, isAuthenticated: false, user: null });
    setScreen('Login');
    setScreenHistory([]);
  };

  const updateUser = async (updates: Partial<User>) => {
    if (auth.user) {
      const updatedUser = { ...auth.user, ...updates };
      await AuthService.saveUser(updatedUser);
      setAuth(prev => ({ ...prev, user: updatedUser }));
    }
  };

  /**
   * 사용자 프로필 새로고침 (FUNC-016 보완)
   * 백엔드에서 최신 정보를 가져와 상태를 업데이트합니다.
   */
  const refreshUserProfile = async () => {
    try {
      const { AuthApi } = require('./src/api/auth.api');
      const latestProfile = await AuthApi.getProfile();
      if (latestProfile) {
        // 백엔드 응답을 User 타입으로 변환 (필요시 매핑)
        // LoginResponse와 User 타입이 거의 일치한다고 가정
        // carNo가 배열이 아니라 단일 문자열로 올 수도 있으니 처리 필요

        let carList: string[] = [];
        if (latestProfile.carNo) {
          carList = [latestProfile.carNo];
        } else {
          carList = ['차량 없음']; // 혹은 빈 배열
        }



        // 기존 auth.user의 정보를 최대한 보존하면서 업데이트
        if (auth.user) {
          const mergedUser = {
            ...auth.user,
            carNo: carList,
            defaultCarNumber: carList.length > 0 ? carList[0] : auth.user.defaultCarNumber
          };
          setAuth(prev => ({ ...prev, user: mergedUser }));
          await AuthService.saveUser(mergedUser);
          console.log('[App] User profile refreshed:', mergedUser);
        }
      }
    } catch (error) {
      console.error('[App] Failed to refresh profile:', error);
    }
  };

  // Navigation
  const navigate = (screenName: ScreenName) => {
    setScreenHistory(prev => [...prev, screen]);
    setScreen(screenName);
  };

  const goBack = () => {
    if (screenHistory.length > 0) {
      const prevScreen = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, -1));
      setScreen(prevScreen);
    } else {
      setScreen('MainDashboard');
    }
  };

  // 주차장 진입 (FUNC-012)
  const handleStartParking = () => {
    setShowEntryModal(true);
  };

  const handleEntryConfirm = async () => {
    setShowEntryModal(false);

    // 입차 시작
    const carNumber = auth.user?.defaultCarNumber || auth.user?.carNo?.[0] || '00가0000';
    try {
      await simulateEntry(carNumber);
    } catch {
      Alert.alert('오류', '입차 요청에 실패했습니다.');
    }
  };

  // 결제 및 출차 (FUNC-015/018)
  const handlePayAndExit = () => {
    navigate('Payment');
  };

  const handleRequestExit = async () => {
    if (!currentSession) return;
    await requestExit({ sessionId: currentSession.id, carNumber: currentSession.carNumber });
  };

  const handlePaymentComplete = async (saveCard: boolean) => {
    if (saveCard) {
      setHasRegisteredCard(true);
      await AsyncStorage.setItem('@smartparking_card', 'registered');
    }

    // [FUNC-015] 1. 결제 완료 처리 -> 백엔드 출차(Checkout) API 호출 (DB 업데이트)
    await completePayment('KAKAO_PAY');

    // [FUNC-018] 2. 출차 요청 -> 기존 Context 로직 (SSE 연결 및 상태 'EXITING' 변경)
    if (currentSession) {
      await requestExit({ sessionId: currentSession.id, carNumber: currentSession.carNumber });
    } else {
      // 세션이 없어도 출차 요청을 시도해야 한다면? (보통은 세션이 있어야 함)
      // 혹시 모르니 user.carNo로 요청
      const carNum = auth.user?.defaultCarNumber || auth.user?.carNo?.[0] || '00가0000';
      await requestExit({ sessionId: 'unknown', carNumber: carNum });
    }
  };

  // Render screen
  const renderScreen = () => {
    // Show Splash if video not finished OR auth is still loading (and video hasn't finished yet)
    // Actually, we want to show Splash until BOTH are done, but to avoid re-mounting issues, 
    // let's simplify: Show splash if !isSplashFinished. 
    // If auth finishes early, isSplashFinished will eventually be true.
    // If video finishes early, but auth is loading? We probably still want to show something. 
    // But commonly, Splash just plays once.
    // Let's hold Splash until video finishes. If auth is still loading, we can show LoadingModal or static Splash.

    if (!isSplashFinished) {
      return <SplashScreen colors={colors} onFinish={() => setIsSplashFinished(true)} />;
    }

    if (auth.isLoading) {
      // If video finished but auth still loading, keep showing static splash or loading
      // For now, let's keep SplashScreen but maybe it will static loop? 
      // Or just render SplashScreen again (which might restart video).
      // Better: Don't set isSplashFinished to true until we are ready? 
      // But onFinish comes from the video. 
      // Let's just return SplashScreen if IS_LOADING.
      // But we need to ensure onFinish is handled.

      // Let's rely on the previous logic: 
      // If !isSplashFinished, show Splash.
      // If isSplashFinished is TRUE, but auth.isLoading is TRUE?
      // Show LoadingModal or just background.
      return <SplashScreen colors={colors} />;
    }

    switch (screen) {
      case 'Login':
        return (
          <LoginScreen
            colors={colors}
            onLogin={handleSocialLogin}
            onPhoneLogin={handlePhoneLogin}
            onNavigateSignup={() => navigate('Signup')}
            onNavigateForgotPassword={() => navigate('ForgotPassword')}
            isLoading={auth.isLoading}
          />
        );

      case 'Signup':
        return <SignupScreen colors={colors} onGoBack={goBack} />;

      case 'ForgotPassword':
        return <ForgotPasswordScreen colors={colors} onResetPassword={handleResetPassword} onGoBack={goBack} />;

      case 'MainDashboard':
        return (
          <MainDashboard
            colors={colors}
            user={auth.user}
            currentSession={currentSession}
            onNavigate={navigate}
            onLogout={handleLogout}
            onStartParking={handleStartParking}
            onRequestExit={handleRequestExit}
            onPayAndExit={handlePayAndExit}
            onRefreshProfile={refreshUserProfile}
          />
        );

      case 'ParkingProgress':
        return currentSession ? (
          <ParkingProgressScreen
            colors={colors}
            session={currentSession}
            onGoBack={currentSession.status === 'PARKED' ? goBack : undefined}
            onComplete={() => setScreen('MainDashboard')}
          />
        ) : <MainDashboard colors={colors} user={auth.user} currentSession={null} onNavigate={navigate} onLogout={handleLogout} onStartParking={handleStartParking} onRequestExit={handleRequestExit} onPayAndExit={handlePayAndExit} onRefreshProfile={refreshUserProfile} />;

      case 'ParkingStatus':
        return currentSession ? (
          <ParkingStatusScreen
            colors={colors}
            session={currentSession}
            onGoBack={goBack}
            onRequestExit={handlePayAndExit}
            onViewProgress={() => navigate('ParkingProgress')}
          />
        ) : <MainDashboard colors={colors} user={auth.user} currentSession={null} onNavigate={navigate} onLogout={handleLogout} onStartParking={handleStartParking} onRequestExit={handleRequestExit} onPayAndExit={handlePayAndExit} onRefreshProfile={refreshUserProfile} />;

      case 'Payment':
        const fee = getFee();
        return fee ? (
          <PaymentScreen
            colors={colors}
            fee={fee}
            hasRegisteredCard={hasRegisteredCard}
            onGoBack={goBack}
            onPaymentComplete={handlePaymentComplete}
          />
        ) : <MainDashboard colors={colors} user={auth.user} currentSession={null} onNavigate={navigate} onLogout={handleLogout} onStartParking={handleStartParking} onRequestExit={handleRequestExit} onPayAndExit={handlePayAndExit} onRefreshProfile={refreshUserProfile} />;

      case 'Settings':
        return (
          <SettingsScreen
            colors={colors}
            user={auth.user}
            onNavigate={navigate}
            onGoBack={goBack}
            onLogout={handleLogout}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />
        );

      case 'Profile':
        return <ProfileScreen colors={colors} user={auth.user} onGoBack={goBack} onUpdateUser={updateUser} />;

      case 'NotificationSettings':
        return <NotificationSettingsScreen colors={colors} user={auth.user} onGoBack={goBack} onUpdateUser={updateUser} />;



      default:
        return <SplashScreen colors={colors} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {renderScreen()}

      {/* FUNC-012 입차 확인 모달 */}
      <EntryConfirmModal
        visible={showEntryModal}
        colors={colors}
        parkingLotName="스마트 주차장"
        onCancel={() => setShowEntryModal(false)}
        onConfirm={handleEntryConfirm}
      />
    </View>
  );
}

// Root App with Provider
export default function App() {
  return (
    <SafeAreaProvider>
      <ParkingProvider>
        <AppContent />
      </ParkingProvider>
    </SafeAreaProvider>
  );
}
