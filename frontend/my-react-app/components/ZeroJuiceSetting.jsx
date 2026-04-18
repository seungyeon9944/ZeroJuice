import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSetting, updateSetting } from '../src/api/settingService.js';
import { getParkingSlotCount, getEmptySlotCount } from '../src/api/parkingService.js';

export default function SystemSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    feeBase: 0,
    timeBase: 0,
    feeUnit: 0,
    timeUnit: 0,
    freeTime: 0
  });

  // 주차장 통계
  const [parkingStats, setParkingStats] = useState({
    parkedCount: 0,
    emptyCount: 0,
    occupancyRate: 0
  });

  // 요금 계산 예시
  const [calculatorMinutes, setCalculatorMinutes] = useState(30);
  const sliderTrackRef = useRef(null);
  const [sliderHover, setSliderHover] = useState({ show: false, value: 30, x: 0 });

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }
  }, [navigate]);

  // 설정 데이터 가져오기
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        console.log('⚙️ Fetching settings...');
        const data = await getSetting();
        console.log('✅ Settings loaded:', data);
        setSettings({
          feeBase: data.feeBase || 0,
          timeBase: data.timeBase || 0,
          feeUnit: data.feeUnit || 0,
          timeUnit: data.timeUnit || 0,
          freeTime: data.freeTime || 0
        });
      } catch (error) {
        console.error('❌ 설정 로드 실패:', error);
        alert('설정을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 주차장 통계 가져오기
  useEffect(() => {
    const fetchParkingStats = async () => {
      try {
        const parked = await getParkingSlotCount();
        const empty = await getEmptySlotCount();
        const total = parked + empty;
        const rate = total > 0 ? Math.round((parked / total) * 100) : 0;

        setParkingStats({
          parkedCount: parked,
          emptyCount: empty,
          occupancyRate: rate
        });
      } catch (error) {
        console.error('❌ 주차장 통계 로드 실패:', error);
      }
    };

    fetchParkingStats();
    const interval = setInterval(fetchParkingStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      console.log('💾 Saving settings:', settings);

      const response = await updateSetting(settings);

      console.log('✅ Settings saved:', response);
      alert('설정이 성공적으로 저장되었습니다! 🎉');
    } catch (error) {
      console.error('❌ 설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('clientName');
      alert('로그아웃 되었습니다.');
      navigate('/');
    }
  };

  // 요금 계산 함수
  const calculateFee = (minutes) => {
    if (minutes <= settings.freeTime) {
      return 0;
    }

    const chargeableMinutes = minutes - settings.freeTime;

    if (chargeableMinutes <= settings.timeBase) {
      return settings.feeBase;
    }

    const extraMinutes = chargeableMinutes - settings.timeBase;
    const extraUnits = Math.ceil(extraMinutes / settings.timeUnit);
    const totalFee = settings.feeBase + (extraUnits * settings.feeUnit);

    return totalFee;
  };

  const calculatedFee = calculateFee(calculatorMinutes);

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-secondary text-gray-300 border-r border-gray-700 h-screen fixed top-0 left-0 overflow-y-auto">
        <div className="p-6 flex items-center space-x-3 border-b border-gray-700">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center text-black shadow-lg shadow-primary/50 transition-transform hover:scale-105 p-1">
            <img src="/bee-icon.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            ZERO<span className="text-white">JUICE</span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-4">
          <Link to="/cctv" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
            <span className="text-lg font-medium">Live Monitor</span>
          </Link>
          <Link to="/dashboard" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
            <span className="text-lg font-medium">Dashboard</span>
          </Link>
          <Link to="/trafficlog" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
            <span className="text-lg font-medium">Traffic Logs</span>
          </Link>
          <Link to="/setting" className="nav-link active flex items-center py-4 px-5 rounded-lg shadow-md shadow-primary/20">
            <span className="text-lg font-semibold">System Config</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <div className="bg-gray-800 rounded-lg p-3 flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-black font-bold">A</div>
              <div>
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-500">Super Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-400 transition-colors p-1.5 hover:bg-gray-700 rounded"
              title="로그아웃"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 flex flex-col h-screen overflow-y-auto bg-background-light">
        <div className="w-full p-4 md:p-8">
          {/* Page Title Section */}
          <div className="flex flex-wrap justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-3xl font-bold text-gray-900 border-l-8 border-primary pl-4">
                시스템 설정
              </h2>
              <p className="text-gray-500 text-[15px] font-medium pl-6">
                주차 요금 및 시스템 설정 관리
              </p>
            </div>
            <div className="flex gap-3"></div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-4 text-gray-500">설정을 불러오는 중...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Live Statistics */}
              <div className="lg:col-span-1 flex flex-col gap-6">
                {/* Live Parking Statistics */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-primary text-2xl">📊</span>
                    <h2 className="text-secondary text-xl font-bold">실시간 통계</h2>
                  </div>
                  <div className="rounded-2xl border border-border-light bg-card-bg p-6 flex flex-col gap-6 shadow-sm">
                    {/* Occupancy Rate */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-text-secondary text-sm font-bold uppercase tracking-widest">
                          현재 혼잡도
                        </p>
                        <h3 className="text-secondary text-4xl font-black tracking-tight">
                          {parkingStats.occupancyRate}%
                        </h3>
                      </div>
                      <div className="relative size-18">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-neutral-100"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></path>
                          <path
                            className="text-primary"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            strokeDasharray={`${parkingStats.occupancyRate}, 100`}
                            strokeLinecap="round"
                            strokeWidth="4"
                          ></path>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm font-black text-secondary">
                            {parkingStats.occupancyRate}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-border-light"></div>

                    {/* Parked Vehicles */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                          <span className="text-2xl">🚗</span>
                        </div>
                        <div>
                          <p className="text-text-secondary text-base font-medium">주차 중</p>
                          <p className="text-secondary text-2xl font-black">{parkingStats.parkedCount}</p>
                        </div>
                      </div>
                    </div>

                    {/* Empty Slots */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                        <div>
                          <p className="text-text-secondary text-base font-medium">빈 자리</p>
                          <p className="text-emerald-600 text-2xl font-black">{parkingStats.emptyCount}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Right Column - Fee Calculator Preview */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-primary text-xl">🧮</span>
                    <h2 className="text-secondary text-xl font-bold">요금 미리보기</h2>
                  </div>
                  <div className="rounded-2xl border border-border-light bg-gradient-to-br from-primary/5 to-card-bg p-8 flex flex-col gap-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                      <label className="text-text-secondary text-sm font-bold">
                        주차 시간을 선택해주세요.
                      </label>
                      <div className="flex items-center gap-4">
                        <div
                          ref={sliderTrackRef}
                          className="relative flex-1"
                          onMouseMove={(e) => {
                            const rect = sliderTrackRef.current?.getBoundingClientRect();
                            if (!rect) return;
                            const min = 0;
                            const max = 240;
                            const step = 10;
                            const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
                            const raw = min + pct * (max - min);
                            const snapped = Math.round(raw / step) * step;
                            setSliderHover({ show: true, value: snapped, x: pct * rect.width });
                          }}
                          onMouseLeave={() => setSliderHover((prev) => ({ ...prev, show: false }))}
                        >
                          {sliderHover.show && (
                            <div
                              className="absolute -top-8 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-0.5 shadow-sm pointer-events-none"
                              style={{ left: sliderHover.x, transform: 'translateX(-50%)' }}
                            >
                              {sliderHover.value}분
                            </div>
                          )}
                          <input
                            type="range"
                            min="0"
                            max="240"
                            step="10"
                            value={calculatorMinutes}
                            onChange={(e) => setCalculatorMinutes(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-border-light rounded-xl px-4 py-2 min-w-[100px]">
                          <input
                            type="number"
                            value={calculatorMinutes}
                            onChange={(e) => setCalculatorMinutes(parseInt(e.target.value) || 0)}
                            className="w-full text-secondary font-bold text-lg focus:outline-none"
                          />
                          <span className="text-text-secondary text-xl font-bold">분</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 border-2 border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-text-secondary text-lg font-black">예상 요금</p>
                        </div>
                        <div className="flex items-baseline gap-2 text-secondary font-black">
                          <span className="text-2xl">{calculatedFee.toLocaleString()}</span>
                          <span className="text-2xl text-text-secondary relative -right-1">원</span>
                        </div>
                      </div>

                      {calculatorMinutes <= settings.freeTime ? (
                        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                          <p className="text-emerald-700 text-xs font-bold">
                            🎉 무료 주차 시간 내입니다!
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg space-y-2">
                          <p className="text-sm text-text-secondary">
                            <span className="font-bold">무료 시간:</span> {settings.freeTime}분
                          </p>
                          <p className="text-sm text-text-secondary">
                            <span className="font-bold">기본 요금:</span> ₩{settings.feeBase.toLocaleString()} ({settings.timeBase}분)
                          </p>
                          {calculatorMinutes > settings.freeTime + settings.timeBase && (
                            <p className="text-sm text-text-secondary">
                              <span className="font-bold">추가 요금:</span> ₩{settings.feeUnit.toLocaleString()} / {settings.timeUnit}분
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* Revenue & Rates */}
                <section className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-primary text-xl">💰</span>
                    <h2 className="text-secondary text-xl font-bold">요금 및 수익</h2>
                  </div>
                  <div className="rounded-2xl border border-border-light bg-card-bg p-6 flex flex-col gap-6 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* 기본 요금 */}
                      <div className="flex flex-col gap-3">
                        <label className="text-text-secondary text-sm font-black uppercase tracking-widest">
                          기본 요금 (Base Fee)
                        </label>
                        <div className="relative group">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={settings.feeBase}
                            onChange={(e) => handleInputChange('feeBase', e.target.value)}
                            className="w-full bg-gray-50 border border-border-light text-secondary rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all font-bold text-2xl text-right"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-bold">
                            원
                          </span>
                        </div>
                      </div>

                      {/* 기본 시간 */}
                      <div className="flex flex-col gap-3">
                        <label className="text-text-secondary text-sm font-black uppercase tracking-widest">
                          기본 시간 (Base Time)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={settings.timeBase}
                            onChange={(e) => handleInputChange('timeBase', e.target.value)}
                            className="w-full bg-gray-50 border border-border-light text-secondary rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all font-bold text-2xl text-right"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-bold">
                            분
                          </span>
                        </div>
                      </div>

                      {/* 추가 요금 */}
                      <div className="flex flex-col gap-3">
                        <label className="text-text-secondary text-sm font-black uppercase tracking-widest">
                          추가 요금 (Extra Fee)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={settings.feeUnit}
                            onChange={(e) => handleInputChange('feeUnit', e.target.value)}
                            className="w-full bg-gray-50 border border-border-light text-secondary rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all font-bold text-2xl text-right"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-bold">
                            원
                          </span>
                        </div>
                      </div>

                      {/* 추가 시간 단위 */}
                      <div className="flex flex-col gap-3">
                        <label className="text-text-secondary text-sm font-black uppercase tracking-widest">
                          추가 시간 단위 (Time Unit)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={settings.timeUnit}
                            onChange={(e) => handleInputChange('timeUnit', e.target.value)}
                            className="w-full bg-gray-50 border border-border-light text-secondary rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all font-bold text-2xl text-right"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-bold">
                            분
                          </span>
                        </div>
                      </div>

                      {/* 무료 시간 */}
                      <div className="flex flex-col gap-3">
                        <label className="text-text-secondary text-sm font-black uppercase tracking-widest">
                          무료 시간 (Free Time)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            value={settings.freeTime}
                            onChange={(e) => handleInputChange('freeTime', e.target.value)}
                            className="w-full bg-gray-50 border border-border-light text-secondary rounded-xl py-3.5 px-4 pr-12 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition-all font-bold text-2xl text-right"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-lg font-bold">
                            분
                          </span>
                        </div>
                      </div>

                      <div className="flex items-end justify-center sm:justify-end">
                        <button
                          onClick={handleSaveSettings}
                          disabled={saving || loading}
                          className="flex cursor-pointer items-center justify-center rounded-xl h-[52px] px-9 bg-primary hover:bg-primary-hover text-black text-base font-black shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {saving ? '저장 중...' : 'Apply Changes'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 items-start">
                      <span className="text-primary shrink-0 text-xl">ℹ️</span>
                      <p className="text-sm text-text-secondary leading-relaxed font-medium">
                        요금 설정 변경 시 즉시 적용됩니다. 변경 시점 이후 입차하는 차량부터 새로운 요금이 적용됩니다.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
