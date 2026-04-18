import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ZeroJuiceLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [clientId, setClientId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    // Auto-redirect if already logged in
    React.useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            navigate('/cctv');
        }
    }, [navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/v1/users/login', {
                user_id: clientId,
                password: password
            });

            console.log("응답:", response);

            if (response.status === 200) {
                const { accessToken, refreshToken, clientName } = response.data;

                // 토큰 저장
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);
                localStorage.setItem('clientName', clientName);

                console.log("✅ 로그인 성공!");
                console.log("AccessToken:", accessToken.substring(0, 20) + "...");
                console.log("RefreshToken:", refreshToken.substring(0, 20) + "...");

                alert(`${clientName}님 환영합니다!`);
                navigate('/cctv');
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError('아이디 또는 비밀번호가 틀렸습니다.');
            } else {
                setError('서버 연결에 실패했습니다.');
            }
            console.error('Login error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-background-light min-h-screen flex items-center justify-center p-4 font-sans">
            <div className="max-w-6xl w-full flex flex-col md:flex-row overflow-hidden bg-surface-light rounded-3xl shadow-2xl min-h-[600px]">
                <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
                    <div className="mb-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center text-black font-bold shadow-lg shadow-primary/30 transition-all hover:scale-105 p-1">
                                <img src="/bee-icon.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-3xl font-black text-secondary tracking-tight">
                                ZERO<span className="text-primary">JUICE</span>
                            </h1>
                        </div>
                        <p className="text-gray-500 font-medium">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 animate-pulse">
                            <p className="text-sm text-red-600 font-semibold">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleLogin}>
                        <div>
                            <label
                                className="block text-sm font-bold text-secondary mb-2"
                                htmlFor="clientId"
                            >
                                Client ID
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder-gray-400 font-medium"
                                    id="clientId"
                                    name="clientId"
                                    placeholder="admin"
                                    required=""
                                    type="text"
                                    value={clientId}
                                    onChange={(e) => setClientId(e.target.value)}
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                    mail
                                </span>
                            </div>
                        </div>
                        <div>
                            <label
                                className="block text-sm font-bold text-secondary mb-2"
                                htmlFor="password"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder-gray-400 font-medium"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    required=""
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <a
                                    className="font-semibold text-secondary hover:text-primary transition-colors"
                                    href="#"
                                >
                                    Forgot password?
                                </a>
                            </div>
                        </div>
                        <button
                            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-black text-black bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform hover:-translate-y-0.5 hover:shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign in to Dashboard'
                            )}
                        </button>
                    </form>
                    <div className="mt-8 text-center text-sm text-gray-500 font-medium">
                        <p>Protected by ZeroJuice Security Systems v2.4</p>
                    </div>
                </div>
                <div className="hidden md:flex md:w-1/2 relative bg-secondary items-center justify-center p-12 overflow-hidden group">
                    <div className="absolute inset-0 bg-secondary">
                        <div
                            className="absolute inset-0 opacity-20"
                            style={{
                                backgroundImage: "radial-gradient(#FBBF24 1px, transparent 1px)",
                                backgroundSize: "30px 30px"
                            }}
                        />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-full bg-hazard-pattern opacity-10 transform skew-x-12 translate-x-16" />
                    <div className="absolute bottom-0 left-0 w-full h-4 bg-hazard-pattern" />
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="relative w-full max-w-[400px] mb-8 transform group-hover:scale-105 transition-transform duration-500 aspect-video">
                            <div className="absolute inset-0 bg-primary blur-[80px] opacity-30 rounded-full animate-pulse-glow" />
                            <video
                                className="w-full h-full object-cover rounded-2xl shadow-2xl border-2 border-primary/20"
                                autoPlay
                                muted
                                loop
                                playsInline
                            >
                                <source src="/zerojuice_splash.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                        <h2 className="text-4xl font-black text-white mb-4">
                            Parking <span className="text-primary">Reinforced.</span>
                        </h2>
                        <p className="text-gray-400 max-w-sm leading-relaxed font-medium">
                            Streamline your parking operations with the most robust management
                            system on the market. Secure. Efficient. Juiced up.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-800 text-primary border border-gray-700 font-bold">
                                SYSTEM: ONLINE
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-800 text-gray-400 border border-gray-700 font-bold">
                                LATENCY: 12ms
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};