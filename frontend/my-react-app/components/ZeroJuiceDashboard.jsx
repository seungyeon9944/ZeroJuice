import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EventSourcePolyfill } from 'event-source-polyfill';
import {
  getRecentParkingHistories,
  getAllParkingStatus,
  getEmptySlotCount,
  getParkingSlotCount
} from '../src/api/parkingService.js';
import { getDailyRevenue } from '../src/api/paymentService.js';

export default function ZeroJuiceDashboard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  // 주차장 통계 데이터
  const [totalSlots, setTotalSlots] = useState(0);
  const [emptySlots, setEmptySlots] = useState(0);
  const [parkedSlots, setParkedSlots] = useState(0);
  const [occupancyRate, setOccupancyRate] = useState(0);

  // 수익 통계 데이터
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [revenueChange, setRevenueChange] = useState(0);
  const [revenueLoading, setRevenueLoading] = useState(true);

  // 차트 툴팁 상태
  const [chartTooltip, setChartTooltip] = useState({ show: false, x: 0, y: 0, hour: '', thisWeek: 0, lastWeek: 0 });

  // 수익 통계 데이터 가져오기 함수
  const fetchRevenueStats = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found');
      setRevenueLoading(false);
      return;
    }

    try {
      console.log('💰 Fetching revenue statistics...');
      // loading state is optional for updates, maybe only set if needed or keep silent for updates
      // For initial load it might be fine, for updates we might not want to show spinner
      // But keeping it simple for now or checking if it's already loading could work.
      // Let's passed a 'silent' flag if needed, but strictly reusing exact logic for now is safer.
      // However, showing spinner on every update might be annoying.
      // Let's decide to NOT set loading true if it's an update?
      // actually, let's keep it simple. User wants it fixed.
      // setRevenueLoading(true); // Maybe omit for background updates?

      const revenueData = await getDailyRevenue();

      setTodayRevenue(revenueData.todayRevenue);
      setYesterdayRevenue(revenueData.yesterdayRevenue);
      setRevenueChange(revenueData.changePercent);

      console.log('✅ Revenue statistics updated:', revenueData);
    } catch (error) {
      console.error('❌ 수익 통계 로드 실패:', error);
    } finally {
      setRevenueLoading(false); // This might cause a quick flash if we used it, but let's leave it for now or remove setRevenueLoading(true) from here and handle it in caller?
      // To be safe and minimal change: I will copy the function as is but maybe handle loading state carefully.
      // Actually, line 103 setRevenueLoading(true) was there.
    }
  };

  // 인증 체크
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }
  }, [navigate]);

  // 주차장 통계 데이터 가져오기
  useEffect(() => {
    const fetchParkingStats = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found');
        return;
      }

      try {
        console.log('📊 Fetching parking statistics...');

        // 전체 주차 상태 조회
        const statusData = await getAllParkingStatus();
        console.log('Parking status:', statusData);

        // 빈 슬롯 개수
        const emptyCount = await getEmptySlotCount();
        console.log('Empty slots:', emptyCount);

        // 주차 중인 슬롯 개수
        const parkedCount = await getParkingSlotCount();
        console.log('Parked slots:', parkedCount);

        // 전체 슬롯 수 계산 (statusData는 Map 형태)
        const total = Object.keys(statusData).length;

        setTotalSlots(total);
        setEmptySlots(emptyCount);
        setParkedSlots(parkedCount);

        // 혼잡도 계산: (주차 중 / 전체) × 100
        const rate = total > 0 ? Math.round((parkedCount / total) * 100) : 0;
        setOccupancyRate(rate);

        console.log('✅ Statistics updated:', { total, empty: emptyCount, parked: parkedCount, rate });
      } catch (error) {
        console.error('❌ 주차장 통계 로드 실패:', error);
      }
    };

    fetchParkingStats();

    // SSE implementation replaces polling
    // limit overhead by removing interval
  }, []);

  // 수익 통계 초기 로드
  useEffect(() => {
    setRevenueLoading(true); // Set loading initially
    fetchRevenueStats().finally(() => setRevenueLoading(false));
  }, []);

  // Update revenue change percentage whenever todayRevenue or yesterdayRevenue changes
  useEffect(() => {
    if (yesterdayRevenue > 0) {
      const change = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
      setRevenueChange(change);
    }
  }, [todayRevenue, yesterdayRevenue]);

  // SSE 실시간 연동
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Use relative path with proxy to avoid CORS
    const sseUrl = '/api/v1/sse/dashboard';

    console.log('📡 Connecting to SSE:', sseUrl);
    // Use Polyfill to send Authorization header
    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 86400000,
    });

    eventSource.onopen = () => {
      console.log('✅ SSE Connected');
    };

    eventSource.onmessage = (event) => {
      // Debug: log any message to see what's coming
      console.log('📨 SSE Message:', event.data);
    };

    eventSource.onerror = (err) => {
      console.error('❌ SSE Error:', err);
      eventSource.close();
    };

    // 1. 주차 슬롯 업데이트
    eventSource.addEventListener('parking-slot-update', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('⚡ Slot Update:', data);

        // 데이터 구조: { slotStatus: {}, emptyCount: 4, parkingCount: 2, ... }
        setEmptySlots(data.emptyCount);
        setParkedSlots(data.parkingCount);

        // Total slots could be dynamic, but usually fixed. 
        // We can recalculate if slotStatus is provided
        if (data.slotStatus) {
          setTotalSlots(Object.keys(data.slotStatus).length);
        }

        const total = data.slotStatus ? Object.keys(data.slotStatus).length : (data.emptyCount + data.parkingCount);
        const rate = total > 0 ? Math.round((data.parkingCount / total) * 100) : 0;
        setOccupancyRate(rate);

      } catch (err) {
        console.error('Error parsing slot update:', err);
      }
    });

    // 2. 입출차 기록 업데이트
    eventSource.addEventListener('parking-history-update', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('⚡ History Update:', data);

        // data.history contains the record
        // data.eventType is ENTRY or EXIT
        if (data.history) {
          setLiveFeed(prev => {
            // 새 항목 추가 및 최대 5개 유지
            const newFeed = [data.history, ...prev];
            return newFeed.slice(0, 5);
          });
        }
      } catch (err) {
        console.error('Error parsing history update:', err);
      }
    });

    // 3. 수익 업데이트
    eventSource.addEventListener('revenue-update', (e) => {
      console.log('⚡ Revenue Signal Received (Using Refetch Strategy)');
      // SSE 페이로드 대신, API를 다시 호출하여 정확한 최신 데이터를 가져옴
      fetchRevenueStats();
    });

    return () => {
      console.log('🔌 Disconnecting SSE...');
      eventSource.close();
    };
  }, []);

  // 최근 활동 데이터 가져오기
  useEffect(() => {
    const fetchLiveFeed = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        console.log('No access token found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching live feed with token:', token.substring(0, 20) + '...');
        const data = await getRecentParkingHistories(3);
        console.log('API Response:', data);
        // API 응답 구조에 맞춰 데이터 매핑
        if (data && data.content) {
          setLiveFeed(data.content);
        }
      } catch (error) {
        console.error('Live feed 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        // 에러 시 빈 배열 유지
      } finally {
        setLoading(false);
      }
    };

    fetchLiveFeed();
  }, []);

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('clientName');
      alert('로그아웃 되었습니다.');
      navigate('/');
    }
  };

  const getStatusColor = (item) => {
    // outTime이 null이면 주차중(ENTRY), 있으면 출차(EXIT)
    const status = item.outTime ? 'EXIT' : 'ENTRY';
    if (status === 'ENTRY') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    } else if (status === 'EXIT') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }
    return 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusText = (item) => {
    return item.outTime ? 'EXIT' : 'PARKED';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '-';

    // DB에서 오는 시간이 이미 KST이므로, 타임존 정보 없이 로컬 시간으로 파싱
    const dateStr = timestamp.replace(' ', 'T');

    // 타임존 정보가 없으면 로컬 시간으로 간주
    let date;
    if (!dateStr.includes('Z') && !dateStr.includes('+') && !dateStr.includes('-', 10)) {
      const parts = dateStr.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      if (parts) {
        date = new Date(
          parseInt(parts[1]),
          parseInt(parts[2]) - 1,
          parseInt(parts[3]),
          parseInt(parts[4]),
          parseInt(parts[5]),
          parseInt(parts[6])
        );
      } else {
        date = new Date(timestamp);
      }
    } else {
      date = new Date(timestamp);
    }

    return date.toLocaleString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // 차트 데이터 (하드코딩 - 추후 API 연동 시 교체)
  const hourlyData = [
    { hour: '00h', thisWeek: 15, lastWeek: 20 },
    { hour: '04h', thisWeek: 10, lastWeek: 15 },
    { hour: '08h', thisWeek: 45, lastWeek: 38 },
    { hour: '12h', thisWeek: 65, lastWeek: 55 },
    { hour: '16h', thisWeek: 50, lastWeek: 45 },
    { hour: '20h', thisWeek: 30, lastWeek: 35 },
    { hour: '24h', thisWeek: 18, lastWeek: 22 }
  ];

  const handleChartHover = (e, dataPoint, index) => {
    // SVG 컨테이너의 위치 가져오기
    const svgElement = e.currentTarget.closest('svg');
    const chartContainer = svgElement.parentElement;
    const containerRect = chartContainer.getBoundingClientRect();

    // 마우스 위치를 차트 컨테이너 기준으로 계산
    const x = e.clientX - containerRect.left;
    const y = e.clientY - containerRect.top;

    setChartTooltip({
      show: true,
      x: x,
      y: y,
      hour: dataPoint.hour,
      thisWeek: dataPoint.thisWeek,
      lastWeek: dataPoint.lastWeek
    });
  };

  const handleChartLeave = () => {
    setChartTooltip({ show: false, x: 0, y: 0, hour: '', thisWeek: 0, lastWeek: 0 });
  };

  return (
    <div className="bg-background-light text-text-primary font-sans overflow-hidden">
      <div className="flex h-screen w-full overflow-hidden">
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
            <Link to="/dashboard" className="nav-link active flex items-center py-4 px-5 rounded-lg shadow-md shadow-primary/20">
              <span className="text-lg font-semibold">Dashboard</span>
            </Link>
            <Link to="/trafficlog" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
              <span className="text-lg font-medium">Traffic Logs</span>
            </Link>
            <Link to="/setting" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
              <span className="text-lg font-medium">System Config</span>
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

        {/* Main Content - No Header */}
        <main className="flex-1 flex flex-col h-full overflow-hidden relative md:ml-56">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-background-light">
            <div className="w-full flex flex-col gap-6">
              {/* Page Title */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-3">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 border-l-8 border-primary pl-4">
                    대시보드
                  </h2>
                  <p className="text-gray-500 mt-1 pl-6 text-[15px] font-medium">
                    실시간 주차 운영 모니터링
                  </p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Parking Slots */}
                <div className="bg-surface-light rounded-2xl p-5 shadow-soft border border-white relative overflow-hidden group hover-lift">
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl">🅿️</span>
                  </div>
                  <div className="flex flex-col h-full justify-between gap-3">
                    <div>
                      <p className="text-text-secondary text-base font-bold uppercase tracking-widest flex items-baseline gap-2">
                        <span>전체 주차면</span>
                        <span className="text-text-secondary text-base font-medium normal-case">Total slots</span>
                      </p>
                      <h3 className="text-secondary text-6xl font-black mt-1.5 tracking-tight">
                        {totalSlots}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2"></div>
                  </div>
                </div>

                {/* Empty Slots */}
                <div className="bg-surface-light rounded-2xl p-5 shadow-soft border border-white relative overflow-hidden group hover-lift">
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl">✅</span>
                  </div>
                  <div className="flex flex-col h-full justify-between gap-3">
                    <div>
                      <p className="text-text-secondary text-base font-bold uppercase tracking-widest flex items-baseline gap-2">
                        <span>빈 자리</span>
                        <span className="text-text-secondary text-base font-medium normal-case">Empty slots</span>
                      </p>
                      <h3 className="text-emerald-600 text-6xl font-black mt-1.5 tracking-tight">
                        {emptySlots}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2"></div>
                  </div>
                </div>

                {/* Parked Slots */}
                <div className="bg-surface-light rounded-2xl p-5 shadow-soft border border-white relative overflow-hidden group hover-lift">
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="text-8xl">🚗</span>
                  </div>
                  <div className="flex flex-col h-full justify-between gap-3">
                    <div>
                      <p className="text-text-secondary text-base font-bold uppercase tracking-widest flex items-baseline gap-2">
                        <span>주차 중</span>
                        <span className="text-text-secondary text-base font-medium normal-case">Parked</span>
                      </p>
                      <h3 className="text-amber-600 text-6xl font-black mt-1.5 tracking-tight">
                        {parkedSlots}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2"></div>
                  </div>
                </div>

                {/* Current Occupancy */}
                <div className="bg-surface-light rounded-2xl p-5 shadow-soft border border-white flex items-center justify-between hover-lift relative overflow-hidden">
                  <div className="flex flex-col gap-1">
                    <p className="text-text-secondary text-base font-bold uppercase tracking-widest flex items-baseline gap-2">
                      <span>혼잡도</span>
                      <span className="text-text-secondary text-base font-medium normal-case">Occupancy</span>
                    </p>
                    <h3 className="text-secondary text-6xl font-black mt-1.5 tracking-tight">{occupancyRate}%</h3>
                  </div>
                  <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 p-4 opacity-10">
                    <span className="text-8xl">⚡</span>
                  </div>
                  <div className="relative size-20">
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
                        strokeDasharray={`${occupancyRate}, 100`}
                        strokeLinecap="round"
                        strokeWidth="4"
                      ></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-secondary font-bold text-xl">⚡</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart and Daily Revenue */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hourly Congestion Comparison (This Week vs Last Week) */}
                <div className="lg:col-span-2 bg-surface-light rounded-2xl p-5 shadow-soft border border-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-text-secondary text-lg font-bold uppercase tracking-widest">
                        시간대별 혼잡도 비교
                      </h3>
                      <p className="text-text-secondary text-xs font-medium">
                        This week vs last week (hourly)
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-primary"></span>
                        <span className="text-secondary">이번 주</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-neutral-300"></span>
                        <span className="text-text-secondary">지난 주</span>
                      </div>
                    </div>
                  </div>
                  <div className="relative w-full h-56" onMouseLeave={handleChartLeave}>
                    <svg
                      className="w-full h-full overflow-visible"
                      preserveAspectRatio="none"
                      viewBox="0 0 100 50"
                    >
                      <g className="chart-grid-line" stroke="currentColor" strokeWidth="0.1">
                        <line x1="0" x2="100" y1="10" y2="10"></line>
                        <line x1="0" x2="100" y1="20" y2="20"></line>
                        <line x1="0" x2="100" y1="30" y2="30"></line>
                        <line x1="0" x2="100" y1="40" y2="40"></line>
                      </g>
                      <defs>
                        <linearGradient id="yellowGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4"></stop>
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0"></stop>
                        </linearGradient>
                      </defs>
                      {/* This Week - Solid line with gradient fill */}
                      <path
                        d="M0,40 L4.17,38 L8.33,35 L12.5,30 L16.67,28 L20.83,32 L25,35 L29.17,33 L33.33,30 L37.5,25 L41.67,20 L45.83,18 L50,22 L54.17,25 L58.33,28 L62.5,32 L66.67,35 L70.83,38 L75,40 L79.17,42 L83.33,40 L87.5,38 L91.67,35 L95.83,33 L100,30 L100,50 L0,50 Z"
                        fill="url(#yellowGrad)"
                      ></path>
                      <path
                        d="M0,40 L4.17,38 L8.33,35 L12.5,30 L16.67,28 L20.83,32 L25,35 L29.17,33 L33.33,30 L37.5,25 L41.67,20 L45.83,18 L50,22 L54.17,25 L58.33,28 L62.5,32 L66.67,35 L70.83,38 L75,40 L79.17,42 L83.33,40 L87.5,38 L91.67,35 L95.83,33 L100,30"
                        fill="none"
                        stroke="#fbbf24"
                        strokeWidth="1.5"
                      ></path>
                      {/* Last Week - Dashed line */}
                      <path
                        d="M0,45 L4.17,43 L8.33,40 L12.5,38 L16.67,35 L20.83,38 L25,40 L29.17,38 L33.33,35 L37.5,32 L41.67,30 L45.83,28 L50,30 L54.17,32 L58.33,35 L62.5,37 L66.67,40 L70.83,42 L75,44 L79.17,45 L83.33,43 L87.5,42 L91.67,40 L95.83,38 L100,35"
                        fill="none"
                        stroke="#d1d5db"
                        strokeDasharray="2 2"
                        strokeWidth="1"
                      ></path>

                      {/* Hover zones - invisible rectangles for each time period */}
                      {hourlyData.map((dataPoint, idx) => (
                        <rect
                          key={idx}
                          x={idx * (100 / 6)}
                          y="0"
                          width={100 / 6}
                          height="50"
                          fill="transparent"
                          style={{ cursor: 'pointer' }}
                          onMouseEnter={(e) => handleChartHover(e, dataPoint)}
                        />
                      ))}
                    </svg>

                    {/* Tooltip */}
                    {chartTooltip.show && (
                      <div
                        className="absolute z-50 bg-white border-2 border-primary shadow-lg rounded-lg p-3 pointer-events-none"
                        style={{
                          left: `${chartTooltip.x}px`,
                          top: `${chartTooltip.y - 100}px`,
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="text-xs font-bold text-secondary mb-2 border-b border-gray-200 pb-1">
                          {chartTooltip.hour}
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-primary"></span>
                            <span className="text-gray-600">이번 주:</span>
                            <span className="font-bold text-secondary">{chartTooltip.thisWeek}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-full bg-neutral-300"></span>
                            <span className="text-gray-600">지난 주:</span>
                            <span className="font-bold text-gray-700">{chartTooltip.lastWeek}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between text-sm font-bold uppercase tracking-widest text-text-secondary mt-0.5 px-1">
                      <span>00h</span>
                      <span>04h</span>
                      <span>08h</span>
                      <span>12h</span>
                      <span>16h</span>
                      <span>20h</span>
                      <span>24h</span>
                    </div>
                  </div>
                </div>

                {/* Daily Revenue Card - Enhanced */}
                <div className="bg-gradient-to-br from-primary/10 via-surface-light to-surface-light rounded-2xl p-5 shadow-soft border border-primary/20 flex flex-col h-full hover-lift relative overflow-hidden">
                  <div className="absolute right-[-20px] top-[-20px] p-4 opacity-5">
                    <span className="text-9xl">💰</span>
                  </div>
                  <div className="flex flex-col h-full justify-between relative z-10">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-primary/20 p-2 rounded-lg">
                          <span className="text-2xl">💰</span>
                        </div>
                        <div>
                          <p className="text-text-secondary text-lg font-bold uppercase tracking-widest">
                            일간 수익
                          </p>
                          <p className="text-text-secondary text-base font-medium">
                            Daily parking revenue
                          </p>
                        </div>
                      </div>
                      {revenueLoading ? (
                        <div className="flex items-center gap-3 mt-4">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="text-text-secondary text-sm">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-secondary text-5xl font-black mt-3 tracking-tight">
                            {todayRevenue.toLocaleString()}원
                          </h3>
                          <p className="text-text-secondary text-xs mt-2 font-medium">
                            Accumulated from 00:00 to now
                          </p>
                        </>
                      )}
                    </div>
                    {!revenueLoading && (
                      <>
                        <div className="mt-5 p-4 rounded-xl bg-white/50 border border-neutral-100">
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary text-base font-bold">전일 대비</span>
                            <span className={`flex items-center text-base font-black ${revenueChange > 0
                              ? 'text-emerald-600'
                              : revenueChange < 0
                                ? 'text-red-600'
                                : 'text-neutral-400'
                              }`}>
                              <span className="mr-1">
                                {revenueChange > 0 ? '📈' : revenueChange < 0 ? '📉' : '📊'}
                              </span>
                              {revenueChange > 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                            </span>
                          </div>
                          <div className="mt-3 h-1 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${revenueChange > 0
                                ? 'bg-emerald-500'
                                : revenueChange < 0
                                  ? 'bg-red-500'
                                  : 'bg-neutral-300'
                                }`}
                              style={{
                                width: `${Math.min(Math.abs(revenueChange), 100)}%`
                              }}
                            ></div>
                          </div>
                          <div className="mt-2 text-sm text-text-secondary font-medium">
                            어제: {yesterdayRevenue.toLocaleString()}원
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Feed Table */}
                <div className="bg-surface-light rounded-2xl shadow-soft border border-white overflow-hidden mb-6">
                  <div className="px-6 py-3 border-b border-neutral-100 flex justify-between items-center bg-white">
                    <h3 className="text-text-secondary text-lg font-bold uppercase tracking-widest">최근 활동</h3>
                    <button
                      onClick={() => navigate('/trafficlog')}
                      className="text-secondary hover:text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
                    >
                      Full Log <span className="text-sm">→</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                  {loading ? (
                    <div className="p-8 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="mt-2 text-sm">Loading...</p>
                    </div>
                  ) : liveFeed.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <p className="text-sm">No recent activity</p>
                    </div>
                  ) : (
                    <table className="w-full text-left text-base">
                      <thead className="bg-neutral-50 text-sm uppercase font-bold tracking-widest text-text-secondary">
                        <tr>
                          <th className="px-6 py-3">차량 번호</th>
                          <th className="px-6 py-3">입차 시간</th>
                          <th className="px-6 py-3">슬롯 번호</th>
                          <th className="px-6 py-3">상태</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {liveFeed.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-neutral-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <span className="font-mono text-lg font-bold text-secondary tracking-wider">
                                {item.carNo || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-text-secondary text-base">
                              {formatTime(item.inTime)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-base bg-gray-100 px-2.5 py-1 rounded border border-gray-200 font-bold text-secondary">
                                {item.slotNo || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-black uppercase tracking-widest border ${getStatusColor(item)}`}
                              >
                                {getStatusText(item)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
