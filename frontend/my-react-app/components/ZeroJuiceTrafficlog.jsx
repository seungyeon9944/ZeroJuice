import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getParkingHistories } from '../src/api/parkingService';

export default function TrafficLogs() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 6;

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('clientName');
      alert('로그아웃 되었습니다.');
      navigate('/');
    }
  };

  // API에서 데이터 가져오기
  const fetchLogs = async (page = 0, query = searchQuery, date = dateFilter) => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found');
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching logs - Page:', page, 'Token:', token.substring(0, 20) + '...');
      const data = await getParkingHistories(page, pageSize, query, date);
      console.log('API Response:', data);

      if (data && data.content) {
        setLogs(data.content);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Traffic logs 로드 실패:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 - 인증 체크 포함
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }
    fetchLogs(0);
  }, [navigate]);

  // 필터 적용
  const handleFilter = () => {
    fetchLogs(0); // 필터 적용 시 첫 페이지로
  };

  // 필터 초기화
  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
    fetchLogs(0, '', '');
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      fetchLogs(newPage);
    }
  };

  const stats = [
    {
      label: '총 입출차',
      value: totalElements.toLocaleString(),
      trend: `${totalPages}페이지`,
      trendType: 'info',
      gradient: 'from-primary/20'
    },
    {
      label: '현재 주차 중',
      value: logs.filter(l => !l.outTime).length.toString(),
      subtitle: '현재 페이지 기준',
      gradient: 'from-black/10'
    },
    {
      label: '출차',
      value: logs.filter(l => l.outTime).length.toString(),
      trend: '현재 페이지 기준',
      trendType: 'info',
      gradient: 'from-primary/20'
    },
    {
      label: '페이지',
      value: `${currentPage + 1}/${totalPages || 1}`,
      isCapacity: false
    }
  ];

  const getPlateStyle = (item) => {
    // outTime이 있으면 출차, 없으면 주차중
    const isParked = !item.outTime;
    return isParked ? 'yellow' : 'white';
  };

  const getTypeColor = (item) => {
    return !item.outTime ? 'green' : 'purple';
  };

  const getStatusColor = (item) => {
    // outTime이 null이면 주차중(ENTRY/PARKED), 있으면 출차(EXIT)
    if (!item.outTime) {
      return 'bg-green-50 text-green-700 border-green-200';
    } else {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  const getStatusText = (item) => {
    return item.outTime ? 'EXIT' : 'PARKED';
  };

  const formatTimestamp = (timestamp) => {
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
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="bg-background-light text-gray-900 font-sans antialiased min-h-screen flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden bg-secondary text-primary p-4 flex justify-between items-center shadow-md">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-xl tracking-wider">
            ZERO<span className="text-white">JUICE</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-white hover:text-primary transition"
        >
          ☰
        </button>
      </header>

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
            <Link to="/trafficlog" className="nav-link active flex items-center py-4 px-5 rounded-lg shadow-md shadow-primary/20">
              <span className="text-lg font-semibold">Traffic Logs</span>
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

      {/* Main Content */}
      <main className="flex-1 md:ml-56 p-4 md:p-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 border-l-8 border-primary pl-4">
              입출차 기록
            </h2>
            <p className="text-gray-500 mt-1 pl-6 text-[15px] font-medium">
              실시간 출입 기록 모니터링
            </p>
          </div>
          <div className="flex flex-wrap gap-3"></div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="w-full lg:w-72">
            <label className="block text-base font-bold text-gray-700 mb-2 uppercase tracking-wider pl-3">
              차량 번호 검색
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              placeholder="차량 번호를 입력하세요..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
            />
          </div>
          <div className="w-full lg:w-72">
            <label className="block text-base font-bold text-gray-700 mb-2 uppercase tracking-wider pl-3">
              시작 날짜 필터
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-base"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleClearFilters}
              className="flex items-center px-4 py-2 bg-gray-200 border border-gray-300 rounded-lg text-sm font-bold hover:bg-gray-300 transition shadow-sm"
            >
              필터 초기화
            </button>
            <button
              onClick={handleFilter}
              className="flex items-center px-4 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/30"
            >
              필터 적용
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`${stat.isCapacity ? 'bg-secondary text-white border-black' : 'bg-white border-gray-200'} p-5 rounded-xl shadow-sm border relative overflow-hidden ${stat.isCapacity ? '' : 'group'}`}
            >
              {!stat.isCapacity && (
                <>
                  <div className={`absolute right-0 top-0 w-16 h-16 bg-gradient-to-bl ${stat.gradient} to-transparent rounded-bl-3xl`}></div>
                  <p className="text-gray-500 text-base font-semibold uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <h3 className="text-3xl font-bold mt-1 text-gray-900">
                    {stat.value}
                  </h3>
                  {stat.trend && (
                    <p className={`text-sm mt-2 flex items-center font-normal ${stat.trendType === 'up' ? 'text-green-500' :
                      stat.trendType === 'warning' ? 'text-yellow-600' :
                        'text-gray-500'
                      }`}>
                      {stat.trend}
                    </p>
                  )}
                  {stat.subtitle && (
                    <p className="text-sm mt-1 text-gray-400">{stat.subtitle}</p>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Traffic Logs Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-sm font-medium">입출차 기록을 불러오는 중...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p className="text-lg font-medium">기록이 없습니다</p>
                <p className="text-sm mt-2">필터를 변경해 보세요</p>
              </div>
            ) : (
              <>
                <table className="w-full zebra-table">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        입차 시간
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        출차 시간
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        차량 번호
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        슬롯 번호
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-base font-mono text-gray-500">#{log.id}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium">
                            {formatTimestamp(log.inTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900 font-medium">
                            {log.outTime ? formatTimestamp(log.outTime) : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`plate-number inline-block px-3 py-1 rounded shadow-sm border-2 font-mono font-bold text-sm tracking-wider ${getPlateStyle(log) === 'yellow' ? 'bg-yellow-100 text-black border-yellow-400' :
                            getPlateStyle(log) === 'red' ? 'bg-red-100 text-red-900 border-red-400' :
                              'bg-white text-gray-900 border-gray-400'
                            }`}>
                            {log.carNo || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-lg bg-gray-100 border border-gray-300">
                            <span className="text-primary mr-1.5">🅿️</span>
                            <span className="font-mono text-sm font-bold text-gray-900">
                              {log.slotNo || 'N/A'}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusColor(log)}`}>
                            {getStatusText(log)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">{currentPage * pageSize + 1}</span> ~{' '}
                        <span className="font-medium">
                          {Math.min((currentPage + 1) * pageSize, totalElements)}
                        </span> of{' '}
                        <span className="font-medium">{totalElements}</span>건
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${currentPage === 0
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        이전
                      </button>
                      <div className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg">
                        {currentPage + 1} / {totalPages || 1} 페이지
                      </div>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${currentPage >= totalPages - 1
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
