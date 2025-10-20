import { useEffect, useState } from 'react';

export default function LoadFail() {
  const [shake, setShake] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShake(false), 800);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '1em',
      }}
    >
      <i
        className={`fa-solid fa-ban ${shake ? 'fa-shake' : ''} fa-4x`}
        style={{ color: '#fc0000ff' }}
      ></i>
      <div
        style={{
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.2em',
        }}
      >
        <div>데이터를 불러오지 못했습니다</div>
        <div>다시 시도해주세요</div>
      </div>
    </div>
  );
}
