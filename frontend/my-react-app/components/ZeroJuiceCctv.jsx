import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CCTVMonitor from './cctvModule.jsx';
import { Link } from 'react-router-dom';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { getAllParkingStatus } from '../src/api/parkingService.js';

export default function ZeroJuiceCctv() {
  const navigate = useNavigate();
  const [parkingStatus, setParkingStatus] = useState({});
  const [zoneOccupancy, setZoneOccupancy] = useState({
    A: { occupied: 0, total: 2, percentage: 0 },
    B: { occupied: 0, total: 2, percentage: 0 },
    C: { occupied: 0, total: 2, percentage: 0 },
  });
  const [trafficLogs, setTrafficLogs] = useState(() => {
    try {
      const savedLogs = localStorage.getItem('cctv_traffic_logs');
      if (!savedLogs) return [];
      const parsed = JSON.parse(savedLogs);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }); // Combined entry and exit logs
  const [llmSummary, setLlmSummary] = useState(() => {
    try {
      return localStorage.getItem('cctv_llm_summary') || '';
    } catch {
      return '';
    }
  });
  const [llmSummaryAt, setLlmSummaryAt] = useState(() => {
    try {
      return localStorage.getItem('cctv_llm_summary_at') || '';
    } catch {
      return '';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cctv_traffic_logs', JSON.stringify(trafficLogs));
    } catch { }
  }, [trafficLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('cctv_llm_summary', llmSummary || '');
      localStorage.setItem('cctv_llm_summary_at', llmSummaryAt || '');
    } catch { }
  }, [llmSummary, llmSummaryAt]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      window.location.href = '/';
      return;
    }

    // Fetch parking status
    const fetchParkingStatus = async () => {
      try {
        const status = await getAllParkingStatus();
        setParkingStatus(status);

        // Calculate zone occupancy
        // Zone A: slots 1, 2
        // Zone B: slots 3, 4
        // Zone C: slots 5, 6
        const zoneA = [status['1'], status['2']];
        const zoneB = [status['3'], status['4']];
        const zoneC = [status['5'], status['6']];

        const calculateOccupancy = (slots) => {
          const total = slots.length;
          const occupied = slots.filter(s => s !== 'EMPTY').length;
          const percentage = Math.round((occupied / total) * 100);
          return { occupied, total, percentage };
        };

        setZoneOccupancy({
          A: calculateOccupancy(zoneA),
          B: calculateOccupancy(zoneB),
          C: calculateOccupancy(zoneC),
        });
      } catch (error) {
        console.error('Failed to fetch parking status:', error);
      }
    };

    // Fetch initial status
    fetchParkingStatus();

    // SSE Connection
    const sseUrl = '/api/v1/sse/parking-slots'; // Dedicated endpoint for parking slots
    // console.log('📡 [CCTV] Connecting to SSE:', sseUrl);

    // Use Polyfill to send Authorization header
    const eventSource = new EventSourcePolyfill(sseUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 86400000, // Increase timeout just in case
    });

    // 1. 연결 성공 시
    eventSource.onopen = () => {
      // console.log('%c[SSE] 연결 성공! (Connect)', 'color: green; font-weight: bold;');
    };

    // 2. 초기 연결 이벤트 ('connected') 수신
    eventSource.addEventListener('connected', (e) => {
      // console.log('%c[SSE] 초기 연결 메시지:', 'color: blue', e.data);
    });

    // 3. 실제 데이터 이벤트 ('parking-slot-update') 수신
    eventSource.addEventListener('parking-slot-update', (e) => {
      try {
        const data = JSON.parse(e.data);
        // console.log('%c[SSE] 🅿️ 주차 슬롯 데이터 수신:', 'color: #ff00ff; font-weight: bold;', data);

        if (data.slotStatus) {
          setParkingStatus(data.slotStatus);

          // Recalculate zones immediately
          const status = data.slotStatus;
          const zoneA = [status['1'], status['2']];
          const zoneB = [status['3'], status['4']];
          const zoneC = [status['5'], status['6']];

          const calculateOccupancy = (slots) => {
            const total = slots.length;
            if (total === 0) return { occupied: 0, total: 0, percentage: 0 };
            // Safety check: slots might be undefined if key incorrect
            const validSlots = slots.filter(s => s !== undefined);
            const occupied = validSlots.filter(s => s !== 'EMPTY').length;
            const percentage = Math.round((occupied / total) * 100);
            return { occupied, total, percentage };
          };

          setZoneOccupancy({
            A: calculateOccupancy(zoneA),
            B: calculateOccupancy(zoneB),
            C: calculateOccupancy(zoneC),
          });
        }
      } catch (err) {
        console.error('Error parsing slot update:', err);
      }
    });

    // 4. 에러 발생 시
    eventSource.onerror = (e) => {
      console.error('[SSE] 에러 발생 (연결 끊김 등):', e);
      eventSource.close();
    };

    // RFID Exit Log SSE Connection
    const sseExitUrl = '/api/v1/sse/exitlog';
    console.log('📡 [CCTV] Connecting to Exit Log SSE:', sseExitUrl);
    console.log('🔑 [CCTV] Token for Exit Log:', token ? `Present (${token.substring(0, 10)}...)` : 'Missing');

    const exitEventSource = new EventSourcePolyfill(sseExitUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 86400000,
    });

    exitEventSource.onopen = () => {
      console.log('✅ RFID 로그 SSE 연결 성공');
    };

    exitEventSource.addEventListener('rfid-exit', (e) => {
      try {
        const data = JSON.parse(e.data);
        // console.log('📩 [RAW SSE DATA]:', e.data); // Too noisy
        console.log('📦 [SSE Exit Data]:', data);

        const rfidData = data.rfidData;

        if (rfidData && rfidData.type === 'exit' && rfidData.hexData) {
          // Hex Decoding Logic
          const decodeHexPayload = (hexString) => {
            if (!hexString) return "";
            const hexValues = hexString.trim().split(/\s+/);
            const byteArray = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(byteArray);
          };

          const decodedJsonStr = decodeHexPayload(rfidData.hexData);
          const rfidInfo = JSON.parse(decodedJsonStr);

          // Add new log to unified state (keep last 10)
          const newLog = {
            carNumber: rfidInfo.carNumber,
            type: rfidData.type,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setTrafficLogs(prev => [newLog, ...prev].slice(0, 10));
        }
      } catch (err) {
        console.error('Error parsing exit log:', err);
      }
    });

    // RFID Entry Event Listener
    exitEventSource.addEventListener('rfid-enter', (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log('🚗 [SSE Entry Data]:', data);

        const rfidData = data.rfidData;

        if (rfidData && rfidData.type === 'enter' && rfidData.hexData) {
          // Hex Decoding Logic
          const decodeHexPayload = (hexString) => {
            if (!hexString) return "";
            const hexValues = hexString.trim().split(/\s+/);
            const byteArray = new Uint8Array(hexValues.map(h => parseInt(h, 16)));
            const decoder = new TextDecoder('utf-8');
            return decoder.decode(byteArray);
          };

          const decodedJsonStr = decodeHexPayload(rfidData.hexData);
          const rfidInfo = JSON.parse(decodedJsonStr);

          // Add new log to unified state (keep last 10)
          const newLog = {
            carNumber: rfidInfo.carNumber,
            type: rfidData.type,
            timestamp: data.timestamp || new Date().toISOString()
          };
          setTrafficLogs(prev => [newLog, ...prev].slice(0, 10));

          // Optional: Show notification
          console.log(`🚗 입차: ${rfidInfo.carNumber}`);
        }
      } catch (err) {
        console.error('Error parsing entry log:', err);
      }
    });

    // LLM Summary SSE Connection
    const sseSummaryUrl = 'https://i14a201.p.ssafy.io/api/v1/sse/parking-summary';
    const summaryEventSource = new EventSourcePolyfill(sseSummaryUrl, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      heartbeatTimeout: 86400000,
    });

    summaryEventSource.onopen = () => {
      console.log('✅ LLM Summary SSE 연결 성공');
    };

    summaryEventSource.addEventListener('parking-summary-update', (e) => {
      try {
        const summaryText = e.data;
        if (summaryText) {
          setLlmSummary(summaryText);
          setLlmSummaryAt('');
        }
      } catch (err) {
        console.error('Error parsing summary update:', err);
      }
    });

    return () => {
      console.log('🔌 [CCTV] Disconnecting SSE...');
      eventSource.close();
      exitEventSource.close();
      summaryEventSource.close();
    };
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

  return (
    <div className="bg-background-light min-h-screen flex overflow-hidden font-sans">
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
          <Link to="/cctv" className="nav-link active flex items-center py-4 px-5 rounded-lg shadow-md shadow-primary/20">
            <span className="text-lg font-semibold">Live Monitor</span>
          </Link>
          <Link to="/dashboard" className="nav-link flex items-center py-4 px-5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition group">
            <span className="text-lg font-medium">Dashboard</span>
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
      <main className="flex-1 md:ml-56 p-4 md:p-8 overflow-x-hidden">
        {/* Page Title Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 border-l-8 border-primary pl-4">
              실시간 모니터
            </h2>
            <p className="text-gray-500 mt-1 pl-6 text-[15px] font-medium">
              실시간 CCTV 모니터링 및 시스템 로그
            </p>
          </div>
          <div className="flex gap-3">
            <span className="bg-red-600 text-white text-xs px-4 py-2 font-bold rounded-lg animate-pulse shadow-lg">
              ● LIVE FEED ACTIVE
            </span>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[8.6fr_3.4fr] gap-6">
          {/* Left Column - Camera Feeds */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="relative bg-black rounded-xl overflow-hidden w-full shadow-lg border-4 border-primary group">
              <div className="bg-primary text-black px-4 py-2 font-bold text-xs flex justify-between items-center">
                <span className="flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-icons text-sm">terminal</span> CCTV 모니터
                </span>
                <span className="animate-pulse">● LIVE</span>
              </div>
              <CCTVMonitor />
            </div>
            <div className="bg-white rounded-xl shadow-md border-l-4 border-emerald-500 p-4 min-[1500px]:hidden">
              <div className="flex items-center justify-between gap-4">
                <div className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-icons text-lg text-emerald-500">smart_toy</span>
                  LLM 요약
                </div>
                {llmSummaryAt ? (
                  <span className="text-sm font-mono text-gray-400">{llmSummaryAt}</span>
                ) : null}
              </div>
              <p className="mt-2 text-lg text-gray-800">
                {llmSummary || '요약 대기중...'}
              </p>
            </div>
          </div>



          {/* Right Column - Capacity Overview & Exit Logs */}
          <div className="col-span-1 flex flex-col gap-6">
            {/* Capacity Overview */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-primary p-5">
              <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-icons text-lg text-primary">storage</span>
                수용 현황
              </h3>
              <div className="space-y-4">
                {/* Zone A */}
                <div>
                  <div className="flex justify-between text-base font-mono mb-1 font-bold">
                    <span className="text-gray-700">ZONE A (Slots 1-2)</span>
                    <span className={`${zoneOccupancy.A.percentage >= 80 ? 'text-red-500' :
                      zoneOccupancy.A.percentage >= 50 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                      {zoneOccupancy.A.occupied}/{zoneOccupancy.A.total} ({zoneOccupancy.A.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${zoneOccupancy.A.percentage >= 80 ? 'bg-red-500' :
                        zoneOccupancy.A.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${zoneOccupancy.A.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Zone B */}
                <div>
                  <div className="flex justify-between text-base font-mono mb-1 font-bold">
                    <span className="text-gray-700">ZONE B (Slots 3-4)</span>
                    <span className={`${zoneOccupancy.B.percentage >= 80 ? 'text-red-500' :
                      zoneOccupancy.B.percentage >= 50 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                      {zoneOccupancy.B.occupied}/{zoneOccupancy.B.total} ({zoneOccupancy.B.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${zoneOccupancy.B.percentage >= 80 ? 'bg-red-500' :
                        zoneOccupancy.B.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${zoneOccupancy.B.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Zone C */}
                <div>
                  <div className="flex justify-between text-base font-mono mb-1 font-bold">
                    <span className="text-gray-700">ZONE C (Slots 5-6)</span>
                    <span className={`${zoneOccupancy.C.percentage >= 80 ? 'text-red-500' :
                      zoneOccupancy.C.percentage >= 50 ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                      {zoneOccupancy.C.occupied}/{zoneOccupancy.C.total} ({zoneOccupancy.C.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${zoneOccupancy.C.percentage >= 80 ? 'bg-red-500' :
                        zoneOccupancy.C.percentage >= 50 ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`}
                      style={{ width: `${zoneOccupancy.C.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md border-l-4 border-emerald-500 p-4 hidden min-[1500px]:block">
              <div className="flex items-center justify-between gap-4">
                <div className="text-base font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="material-icons text-lg text-emerald-500">smart_toy</span>
                  LLM 요약
                </div>
                {llmSummaryAt ? (
                  <span className="text-sm font-mono text-gray-400">{llmSummaryAt}</span>
                ) : null}
              </div>
              <p className="mt-2 text-lg text-gray-800">
                {llmSummary || '요약 대기중...'}
              </p>
            </div>

            {/* 입출차 기록 (Combined Entry/Exit Logs) */}
            <div className="bg-white rounded-xl shadow-md border-t-4 border-gray-400 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold text-gray-700 flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-icons text-lg text-gray-600">history</span>
                  입출차 기록
                </h3>
                <button
                  type="button"
                  onClick={() => setTrafficLogs([])}
                  className="text-sm font-bold text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1.5 transition"
                >
                  Clear
                </button>
              </div>
              <div className="overflow-y-auto max-h-60 space-y-2">
                {trafficLogs.length === 0 ? (
                  <p className="text-base text-gray-400 text-center py-4">최근 입출차 기록이 없습니다.</p>
                ) : (
                  trafficLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center p-2 bg-gray-50 rounded border-l-2 ${log.type === 'enter' ? 'border-green-500' : 'border-red-500'
                        }`}
                    >
                      <div>
                        <p className={`text-base font-bold ${log.type === 'enter' ? 'text-green-700' : 'text-red-700'
                          }`}>
                          {log.type === 'enter' ? '입차' : log.type === 'exit' ? '출차' : 'Unknown'}
                          {' : '}
                          <span className="text-gray-900">{log.carNumber || 'Unknown'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-mono text-gray-400 block">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main >
    </div >
  );
}
