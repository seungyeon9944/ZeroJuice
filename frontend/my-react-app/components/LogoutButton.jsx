import { useNavigate } from 'react-router-dom';

export default function LogoutButton() {
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            // localStorage 전부 삭제
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('clientName');
            
            // 또는
            // localStorage.clear(); // 모든 localStorage 삭제
            
            alert('로그아웃 되었습니다.');
            navigate('/');
        }
    };

    return (
        <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
            로그아웃
        </button>
    );
}