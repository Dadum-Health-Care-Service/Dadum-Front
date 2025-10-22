import React, { useState } from 'react';
import { useApiLocation } from './hooks/useApiLocation';

const LocationInput = () => {
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const { loading, error, saveLocation } = useApiLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      setMessage('주소를 입력해주세요.');
      return;
    }

    try {
      const res = await saveLocation(address);
      setMessage(`위치 저장 성공! 좌표: (${res.latitude}, ${res.longitude}), 지역: ${res.address}`);
      setAddress(''); // 성공 시 입력 필드 초기화
    } catch (err) {
      setMessage('위치 저장 중 오류가 발생했습니다.');
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>위치 입력하기</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="예) 서울특별시 강남구 테헤란로 123"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: '70%', padding: '0.5rem' }}
          disabled={loading}
        />
        <button 
          type="submit" 
          style={{ marginLeft: '10px' }}
          disabled={loading}
        >
          {loading ? '저장 중...' : '저장'}
        </button>
      </form>
      {error && <p style={{ color: 'red', marginTop: '1rem' }}>{error}</p>}
      {message && <p style={{ marginTop: '1rem' }}>{message}</p>}
    </div>
  );
};

export default LocationInput;
