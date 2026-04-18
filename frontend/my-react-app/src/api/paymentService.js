import api from './axios';

/**
 * 전체 결제 내역 조회
 * @returns {Promise} API 응답
 */
export const getAllPayments = async () => {
    try {
        const response = await api.get('/payments');
        return response.data;
    } catch (error) {
        console.error('❌ 전체 결제 내역 조회 실패:', error);
        throw error;
    }
};

/**
 * 일간 수익 통계 계산
 * 당일 00:00 ~ 현재 시간까지의 수익과 전일 수익을 계산
 * @returns {Promise<{todayRevenue: number, yesterdayRevenue: number, changePercent: number}>}
 */
export const getDailyRevenue = async () => {
    try {
        const payments = await getAllPayments();

        console.log('📦 Total payments received:', payments.length);

        // 현재 로컬 시간 기준 (한국 시간)
        const now = new Date();

        // 당일 00:00:00 (로컬 시간)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // 전일 00:00:00 (로컬 시간)
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);

        // 전일 23:59:59.999 (로컬 시간)
        const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);

        console.log('📊 Revenue calculation period (Local Time):');
        console.log('  Current Time:', now.toLocaleString('ko-KR'));
        console.log('  Today Start:', todayStart.toLocaleString('ko-KR'), '(', todayStart.toISOString(), ')');
        console.log('  Today End (Now):', now.toLocaleString('ko-KR'), '(', now.toISOString(), ')');
        console.log('  Yesterday Start:', yesterdayStart.toLocaleString('ko-KR'), '(', yesterdayStart.toISOString(), ')');
        console.log('  Yesterday End:', yesterdayEnd.toLocaleString('ko-KR'), '(', yesterdayEnd.toISOString(), ')');

        // 당일 수익 계산 (status가 'OK'인 것만)
        const todayPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paidAt);
            const isToday = paymentDate >= todayStart && paymentDate <= now;
            const isOK = payment.status === 'OK';

            if (isToday && isOK) {
                console.log('✅ Today payment:', {
                    id: payment.id,
                    amount: payment.amount,
                    payTime: new Date(payment.paidAt).toLocaleString('ko-KR'),
                    status: payment.status
                });
            }

            return isToday && isOK;
        });

        const todayRevenue = todayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // 전일 수익 계산 (status가 'OK'인 것만)
        const yesterdayPayments = payments.filter(payment => {
            const paymentDate = new Date(payment.paidAt);
            const isYesterday = paymentDate >= yesterdayStart && paymentDate <= yesterdayEnd;
            const isOK = payment.status === 'OK';

            if (isYesterday && isOK) {
                console.log('✅ Yesterday payment:', {
                    id: payment.id,
                    amount: payment.amount,
                    payTime: new Date(payment.paidAt).toLocaleString('ko-KR'),
                    status: payment.status
                });
            }

            return isYesterday && isOK;
        });

        const yesterdayRevenue = yesterdayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

        // 전일 대비 변화율 계산
        let changePercent = 0;
        if (yesterdayRevenue > 0) {
            changePercent = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
        } else if (todayRevenue > 0) {
            changePercent = 100; // 전일 수익이 0이고 당일 수익이 있으면 100% 증가
        }

        console.log('💰 Revenue statistics:');
        console.log('  Today Payments Count:', todayPayments.length);
        console.log('  Today Revenue:', todayRevenue.toLocaleString(), '원');
        console.log('  Yesterday Payments Count:', yesterdayPayments.length);
        console.log('  Yesterday Revenue:', yesterdayRevenue.toLocaleString(), '원');
        console.log('  Change:', changePercent.toFixed(1), '%');

        return {
            todayRevenue,
            yesterdayRevenue,
            changePercent: Math.round(changePercent * 10) / 10 // 소수점 첫째자리까지
        };
    } catch (error) {
        console.error('❌ 일간 수익 통계 계산 실패:', error);
        // 에러 발생 시 기본값 반환
        return {
            todayRevenue: 0,
            yesterdayRevenue: 0,
            changePercent: 0
        };
    }
};
