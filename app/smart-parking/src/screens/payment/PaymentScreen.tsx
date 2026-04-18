/**
 * PaymentScreen - FUNC-015/018 (카드 등록 옵션 포함)
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Linking } from 'react-native';
import IMP from 'iamport-react-native';
import { CustomModal } from '../../components/common';
import { ParkingFee, PaymentMethod } from '../../types';
import { ThemeColors } from '../../../App';

interface PaymentScreenProps {
    colors: ThemeColors;
    fee: ParkingFee;
    hasRegisteredCard: boolean;
    onGoBack: () => void;
    onPaymentComplete: (saveCard: boolean) => void;
}

const PAYMENT_METHODS: { method: PaymentMethod; label: string; icon: string }[] = [
    { method: 'KAKAO_PAY', label: '카카오페이', icon: '' },
    { method: 'CARD', label: '신용/체크카드', icon: '' },
];

// --- [USER CONFIGURATION AREA] ---
// 포트원(아임포트) V1 결제 설정 (일반 결제)
// 관리자 콘솔: https://admin.portone.io/
const PORTONE_CONFIG = {
    storeId: 'imp05552822', // 가맹점 식별코드

    // V1 PG사 코드 설정
    pgs: {
        inicis: 'html5_inicis', // KG 이니시스 (웹표준)
        kakao: 'kakaopay.TC0ONETIME',      // 카카오페이 (테스트 모드용 CID)
    },

    payMethod: 'card',
};
// ---------------------------------

const PaymentScreen: React.FC<PaymentScreenProps> = ({
    colors,
    fee,
    hasRegisteredCard,
    onGoBack,
    onPaymentComplete,
}) => {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(hasRegisteredCard ? 'CARD' : 'KAKAO_PAY');
    const [saveCard, setSaveCard] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed'>('idle');
    const [isPaymentVisible, setIsPaymentVisible] = useState(false);

    // Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState<{
        title: string;
        message: string;
        type: 'success' | 'error' | 'info';
        action?: () => void;
        confirmText?: string;
        onCancel?: () => void;
        cancelText?: string
    }>({
        title: '',
        message: '',
        type: 'info'
    });

    // Deep Link Listener for Payment Result
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { url } = event;
            if (!url) return;

            // Check if it's our payment result URL
            if (url.includes('zerojuice://payment-result')) {
                console.log('[PaymentScreen] Deep Link received:', url);

                // Parse URL params
                const params: any = {};
                const regex = /[?&]([^=#]+)=([^&#]*)/g;
                let match;
                while ((match = regex.exec(url))) {
                    params[match[1]] = decodeURIComponent(match[2]);
                }

                console.log('[PaymentScreen] Parsed Params:', params);

                // PortOne sends 'imp_success' or 'success'
                const isSuccess = params.imp_success === 'true' || params.success === 'true';

                // [Log for User Verification]
                console.log('--------------------------------------------------');
                console.log('>>> [결제 파라미터 확인] Payment Result Parameters:');
                console.log(JSON.stringify(params, null, 2));
                console.log('>>> Success Check:', isSuccess);
                console.log('--------------------------------------------------');

                if (isSuccess) {
                    setIsPaymentVisible(false);
                    setPaymentStatus('completed');
                    setTimeout(() => {
                        onPaymentComplete(saveCard);
                    }, 1500);
                } else if (params.imp_success === 'false' || params.success === 'false') {
                    // Only show error if explicitly failed (ignore interruptions)
                    setIsPaymentVisible(false);
                    showModal('결제 실패', params.error_msg || '결제 중 오류가 발생했습니다.', 'error');
                    setPaymentStatus('idle');
                }
            }
        };

        const subscription = Linking.addEventListener('url', handleDeepLink);

        // Check initial URL just in case
        Linking.getInitialURL().then((url) => {
            if (url) handleDeepLink({ url });
        });

        return () => {
            subscription.remove();
        };
    }, []);

    const showModal = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'info' = 'info',
        action?: () => void,
        confirmText: string = '확인',
        onCancel?: () => void,
        cancelText?: string
    ) => {
        setModalConfig({ title, message, type, action, confirmText, onCancel, cancelText });
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        if (modalConfig.action) {
            modalConfig.action();
        }
    };

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;
    };

    const handlePaymentRequest = () => {
        // 실제 결제 모듈 호출을 위해 visible 상태 변경
        setIsPaymentVisible(true);
    };

    const handlePaymentCallback = (response: any) => {
        // response 로그 출력 (디버깅용)
        console.log('[HandlePaymentCallback] Response:', response);

        const { success, error_msg, imp_success } = response;
        const isSuccess = success === true || success === 'true' || imp_success === 'true' || imp_success === true;

        if (isSuccess) {
            console.log('[HandlePaymentCallback] SUCCESS detected');
            setIsPaymentVisible(false); // 성공 시 모듈 닫음
            setPaymentStatus('completed');
            // 1.5초 후 완료 콜백
            setTimeout(() => {
                onPaymentComplete(saveCard);
            }, 1500);
        } else {
            console.log('[HandlePaymentCallback] FAILURE detected (msg:', error_msg, ')');

            // [CRITICAL FIX]
            // 리다이렉트 환경(앱 복귀)에서는 라이브러리가 '잠시 앱을 떠남'을 실패로 오인하거나,
            // Deep Link가 처리되기 전에 Callback이 먼저 실패로 뜰 수 있음.
            // 따라서 실패 처리를 즉시 하지 않고, 잠시 대기 후 Deep Link 성공 여부를 확인함.
            setTimeout(() => {
                setPaymentStatus((prevStatus) => {
                    if (prevStatus === 'completed') {
                        console.log('[HandlePaymentCallback] Ignoring failure because status is already COMPLETED via Deep Link');
                        return prevStatus;
                    }

                    // 진짜 실패로 판단
                    setIsPaymentVisible(false);
                    showModal('결제 실패', error_msg || '결제 중 오류가 발생했습니다.', 'error');
                    return 'idle';
                });
            }, 1000); // 1초 대기 (Deep Link가 먼저 치고 들어오도록)
        }
    };

    const confirmPayment = () => {
        if (hasRegisteredCard) {
            // 등록된 카드가 있으면 바로 시뮬레이션 (혹은 빌링키 결제 API 호출)
            showModal(
                '자동 결제',
                `등록된 카드로 ${fee.finalFee.toLocaleString()}원을 결제합니다.`,
                'info',
                async () => {
                    setPaymentStatus('processing');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    setPaymentStatus('completed');
                    setTimeout(() => onPaymentComplete(saveCard), 1500);
                },
                '결제하기',
                () => setModalVisible(false),
                '취소'
            );
        } else {
            // 일반 결제는 포트원 모듈 호출
            showModal(
                '결제 확인',
                `${fee.finalFee.toLocaleString()}원을 결제하시겠습니까?`,
                'info',
                handlePaymentRequest,
                '결제하기',
                () => setModalVisible(false),
                '취소'
            );
        }
    };

    // 포트원 결제 모듈 렌더링 (isPaymentVisible === true)
    if (isPaymentVisible) {
        // [V1 Integration Spec]
        const targetPg = selectedMethod === 'KAKAO_PAY'
            ? PORTONE_CONFIG.pgs.kakao
            : PORTONE_CONFIG.pgs.inicis;

        const paymentData = {
            pg: targetPg,
            pay_method: PORTONE_CONFIG.payMethod,
            merchant_uid: `mid_${new Date().getTime()}`,
            name: `주차요금 정산 (${fee.carNumber})`,
            amount: fee.finalFee,
            buyer_name: '백만장자전태섭',
            buyer_tel: '010-1234-5678',
            buyer_email: 'buyer@example.com',
            app_scheme: 'zerojuice',
            m_redirect_url: 'zerojuice://payment-result', // 카카오페이 등 모바일 결제 후 복귀를 위한 URL 설정
            escrow: false,
        };

        return (
            <View style={{ flex: 1 }}>
                <IMP.Payment
                    userCode={PORTONE_CONFIG.storeId}
                    loading={<View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View>}
                    data={paymentData}
                    callback={handlePaymentCallback}
                />
            </View>
        );
    }

    // 결제 완료 화면
    if (paymentStatus === 'completed') {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.completedContainer}>
                    <View style={[styles.completedCircle, { backgroundColor: colors.success }]}>
                        <Text style={styles.completedEmoji}>V</Text>
                    </View>
                    <Text style={[styles.completedTitle, { color: colors.textPrimary }]}>결제 완료!</Text>
                    <Text style={[styles.completedAmount, { color: colors.primary }]}>
                        {fee.finalFee.toLocaleString()}원
                    </Text>
                    <Text style={[styles.completedMessage, { color: colors.textSecondary }]}>
                        결제가 완료되었습니다.{'\n'}자동 출차가 시작됩니다.
                    </Text>
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
                </View>
            </View>
        );
    }

    // 자동 결제 모드 (등록된 카드 있음)
    if (hasRegisteredCard) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={onGoBack} style={styles.backButton} disabled={paymentStatus === 'processing'}>
                        <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>자동 결제</Text>
                    <View style={{ width: 44 }} />
                </View>

                <View style={styles.autoPayContent}>
                    <View style={[styles.autoPayCard, { backgroundColor: colors.primary }]}>
                        <Text style={[styles.autoPayTitle, { color: colors.textOnPrimary }]}>등록된 카드로 결제</Text>
                        <Text style={[styles.autoPayAmount, { color: colors.textOnPrimary }]}>
                            {fee.finalFee.toLocaleString()}원
                        </Text>
                        <Text style={[styles.autoPayDuration, { color: colors.textOnPrimary }]}>
                            주차 시간: {formatDuration(fee.duration)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: colors.primary }]}
                        onPress={confirmPayment}
                        disabled={paymentStatus === 'processing'}
                    >
                        {paymentStatus === 'processing' ? (
                            <ActivityIndicator color={colors.textOnPrimary} />
                        ) : (
                            <Text style={[styles.payButtonText, { color: colors.textOnPrimary }]}>결제하기</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // 수동 결제 모드 (등록된 카드 없음)
    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={onGoBack} style={styles.backButton} disabled={paymentStatus === 'processing'}>
                    <Text style={[styles.backButtonText, { color: colors.textPrimary }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>주차 정산</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* 요금 정보 */}
                <View style={[styles.feeCard, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.carNumber, { color: colors.textOnPrimary }]}>{fee.carNumber}</Text>
                    <Text style={[styles.feeDuration, { color: colors.textOnPrimary }]}>
                        주차 시간: {formatDuration(fee.duration)}
                    </Text>
                    <Text style={[styles.feeAmount, { color: colors.textOnPrimary }]}>
                        {fee.finalFee.toLocaleString()}원
                    </Text>
                </View>

                {/* 결제 수단 */}
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>결제 수단</Text>
                <View style={[styles.methodsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {PAYMENT_METHODS.map((item) => (
                        <TouchableOpacity
                            key={item.method}
                            style={[
                                styles.methodItem,
                                selectedMethod === item.method && { backgroundColor: colors.primary + '15' }
                            ]}
                            onPress={() => setSelectedMethod(item.method)}
                            disabled={paymentStatus === 'processing'}
                        >
                            <Text style={styles.methodIcon}>{item.icon}</Text>
                            <Text style={[styles.methodLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                            <View style={[
                                styles.radioButton,
                                { borderColor: selectedMethod === item.method ? colors.primary : colors.border }
                            ]}>
                                {selectedMethod === item.method && (
                                    <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* 카드 저장 옵션 */}
                <View style={[styles.saveCardOption, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.saveCardText}>
                        <Text style={[styles.saveCardTitle, { color: colors.textPrimary }]}>
                            다음에 자동결제로 사용
                        </Text>
                        <Text style={[styles.saveCardDesc, { color: colors.textSecondary }]}>
                            다음 출차 시 자동으로 결제됩니다
                        </Text>
                    </View>
                    <Switch
                        value={saveCard}
                        onValueChange={setSaveCard}
                        trackColor={{ false: colors.border, true: colors.primary }}
                        thumbColor={saveCard ? colors.background : '#f4f3f4'}
                    />
                </View>
            </ScrollView>

            {/* 결제 버튼 */}
            <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
                <TouchableOpacity
                    style={[styles.payButton, { backgroundColor: colors.primary }]}
                    onPress={confirmPayment}
                    disabled={paymentStatus === 'processing'}
                >
                    {paymentStatus === 'processing' ? (
                        <ActivityIndicator color={colors.textOnPrimary} />
                    ) : (
                        <Text style={[styles.payButtonText, { color: colors.textOnPrimary }]}>
                            {fee.finalFee.toLocaleString()}원 결제하기
                        </Text>
                    )}
                </TouchableOpacity>
            </View>


            <CustomModal
                visible={modalVisible}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={handleModalClose}
                onCancel={modalConfig.onCancel}
                cancelText={modalConfig.cancelText}
                colors={colors}
                confirmText={modalConfig.confirmText}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1,
    },
    backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
    backButtonText: { fontSize: 24 },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    content: { flex: 1, padding: 20 },
    feeCard: { borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24 },
    feeEmoji: { fontSize: 48, marginBottom: 12 },
    carNumber: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
    feeDuration: { fontSize: 14, opacity: 0.9, marginBottom: 12 },
    feeAmount: { fontSize: 36, fontWeight: '700' },
    sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 12, marginLeft: 4 },
    methodsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginBottom: 16 },
    methodItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    methodIcon: { fontSize: 24, marginRight: 14 },
    methodLabel: { flex: 1, fontSize: 16 },
    radioButton: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    radioButtonInner: { width: 12, height: 12, borderRadius: 6 },
    saveCardOption: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, borderWidth: 1, padding: 16,
    },
    saveCardText: { flex: 1, marginRight: 12 },
    saveCardTitle: { fontSize: 16, fontWeight: '600' },
    saveCardDesc: { fontSize: 13, marginTop: 4 },
    footer: { padding: 20, borderTopWidth: 1 },
    payButton: { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
    payButtonText: { fontSize: 18, fontWeight: '700' },
    autoPayContent: { flex: 1, justifyContent: 'center', padding: 24 },
    autoPayCard: { borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 32 },
    autoPayIcon: { fontSize: 64, marginBottom: 16 },
    autoPayTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
    autoPayAmount: { fontSize: 42, fontWeight: '700', marginBottom: 8 },
    autoPayDuration: { fontSize: 14, opacity: 0.9 },
    completedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    completedCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    completedEmoji: { fontSize: 48, color: '#FFFFFF' },
    completedTitle: { fontSize: 28, fontWeight: '700', marginBottom: 8 },
    completedAmount: { fontSize: 36, fontWeight: '700', marginBottom: 16 },
    completedMessage: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
});

// --- [Simulated Payment View for Demo] ---
const SimulatedPaymentView: React.FC<{
    colors: ThemeColors;
    method: PaymentMethod;
    amount: number;
    onComplete: (response: any) => void;
}> = ({ colors, method, amount, onComplete }) => {
    const [step, setStep] = React.useState(0); // 0: Init, 1: Connecting, 2: Processing, 3: Approved

    React.useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        // Step 1: Connecting
        timers.push(setTimeout(() => setStep(1), 1000));

        // Step 2: Processing (Fake PG Interaction)
        timers.push(setTimeout(() => setStep(2), 2500));

        // Step 3: Approval & Callback
        timers.push(setTimeout(() => {
            setStep(3);
            setTimeout(() => {
                onComplete({ success: true, imp_uid: 'demo_uid_' + Date.now(), merchant_uid: 'demo_merchant_' + Date.now() });
            }, 1000);
        }, 4500));

        return () => timers.forEach(clearTimeout);
    }, []);

    const isKakao = method === 'KAKAO_PAY';
    const bgColor = isKakao ? '#FEE500' : '#FFFFFF';
    const textColor = isKakao ? '#000000' : '#111111';

    return (
        <View style={[styles.container, { backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' }]}>
            <View style={{
                width: '85%', backgroundColor: bgColor, borderRadius: 20, padding: 30, alignItems: 'center',
                shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5
            }}>
                <ActivityIndicator size="large" color={isKakao ? '#000000' : colors.primary} style={{ marginBottom: 20 }} />

                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 10, color: textColor }}>
                    {step === 0 && "보안 결제 모듈 초기화..."}
                    {step === 1 && (isKakao ? "카카오톡 연결 중..." : "결제사(KG이니시스) 연결 중...")}
                    {step === 2 && "결제 승인 진행 중..."}
                    {step === 3 && "결제 완료!"}
                </Text>

                <Text style={{ fontSize: 14, color: textColor, opacity: 0.7, textAlign: 'center' }}>
                    {amount.toLocaleString()}원 결제
                </Text>

                {step === 2 && (
                    <View style={{ marginTop: 20, width: '100%', height: 4, backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 2 }}>
                        <View style={{ width: '60%', height: '100%', backgroundColor: isKakao ? '#000000' : colors.primary }} />
                    </View>
                )}
            </View>
        </View>
    );
};

export default PaymentScreen;
