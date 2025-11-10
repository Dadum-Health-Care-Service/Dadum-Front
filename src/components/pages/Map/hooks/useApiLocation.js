import { useState, useCallback } from 'react';
import { useApi } from '../../../utils/api/useApi';

export const useApiLocation = () => {
  const { POST, GET } = useApi();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 위치 저장
  const saveLocation = useCallback(async (address) => {
    setLoading(true);
    setError('');

    try {
      const response = await POST('/location', { address });
      return response.data;
    } catch (err) {
      setError('위치 저장에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [POST]);

  // 중간 지점 조회
  const getMiddlePoint = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await GET('/location/middle-point');
      return response.data;
    } catch (err) {
      setError('중간 지점 조회에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [GET]);

  return {
    loading,
    error,
    saveLocation,
    getMiddlePoint
  };
};
