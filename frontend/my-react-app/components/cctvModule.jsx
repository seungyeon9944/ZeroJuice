import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

// [중요] 파이썬 서버 주소 (8333번 포트)
const SOCKET_SERVER_URL = 'https://i14a201.p.ssafy.io:8333';

const CCTVMonitor = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // 1. 소켓 연결 (HLS가 아닌 Socket.IO 사용)
    socketRef.current = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'], // 파이썬 서버 설정과 맞춤
      secure: true, // HTTPS 필수
      rejectUnauthorized: false // 인증서 경고 무시 (개발용)
    });

    // 2. 연결 성공 시
    socketRef.current.on('connect', () => {
      console.log('✅ CCTV Socket 연결 성공');
      setIsConnected(true);
    });

    // 3. 연결 끊김 시
    socketRef.current.on('disconnect', () => {
      console.log('❌ CCTV Socket 연결 끊김');
      setIsConnected(false);
    });

    // 4. [핵심] 서버가 보내주는 이미지 받기
    socketRef.current.on('video_frame', (base64Data) => {
      // 받은 데이터를 이미지 소스로 변환
      setImageSrc(`data:image/jpeg;base64,${base64Data}`);
    });

    // 5. 에러 처리
    socketRef.current.on('connect_error', (err) => {
      console.error('Socket 연결 에러:', err);
    });

    // 컴포넌트가 꺼질 때 소켓 정리
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="w-full aspect-[4/3] bg-black flex items-center justify-center">
      {/* [중요] <video> 태그가 아니라 <img> 태그를 씁니다! 
        이유: 우리는 동영상이 아니라 '빠르게 바뀌는 사진'을 받고 있기 때문입니다.
      */}
      {imageSrc ? (
        <img
          src={imageSrc}
          alt="Real-time CCTV"
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'contain',
            //border: isConnected ? '2px solid #00ff00' : '2px solid red'
          }}
        />
      ) : (
        <div style={{ color: 'white', padding: '50px', textAlign: 'center', width: '100%' }}>
          <p>{isConnected ? "영상 수신 대기중..." : "서버 연결중..."}</p>
        </div>
      )}
    </div>
  );
};

export default CCTVMonitor;
