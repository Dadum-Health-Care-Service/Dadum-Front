import React, { useEffect, useState } from 'react';
import { useApiLocation } from './hooks/useApiLocation';

const MiddlePoint = () => {
  const { loading, error, getMiddlePoint } = useApiLocation();
  const [middlePoint, setMiddlePoint] = useState(null);

  useEffect(() => {
    getMiddlePoint()
      .then(data => setMiddlePoint(data))
      .catch(() => {
        // 에러는 useApiLocation에서 처리됨
      });
  }, [getMiddlePoint]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (loading || !middlePoint) return <p>중간 지점 불러오는 중...</p>;

  return (
    <div>
      <h2>중간 지점 좌표</h2>
      <p>위도: {middlePoint.latitude.toFixed(6)}</p>
      <p>경도: {middlePoint.longitude.toFixed(6)}</p>
      <p>설명: {middlePoint.address}</p>
    </div>
  );
};

export default MiddlePoint;
