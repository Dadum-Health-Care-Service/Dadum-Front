import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../../../utils/api/useApi';

export const useParticipatedGatherings = () => {
  const [participatedGatherings, setParticipatedGatherings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { GET } = useApi();

  // 참여한 모임 목록 조회
  const fetchParticipatedGatherings = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await GET('/gatherings/participated', {}, true); // 인증 필요
      
      if (response.data.success) {
        // 해체된 모임(INACTIVE 상태)은 제외
        const activeGatherings = (response.data.gatherings || []).filter(
          gathering => gathering.status === 'ACTIVE'
        );
        setParticipatedGatherings(activeGatherings);
        return activeGatherings;
      } else {
        throw new Error(response.data.error || '참여한 모임 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '참여한 모임 목록을 불러오는데 실패했습니다.');
      console.error('참여한 모임 목록 조회 실패:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // GET을 의존성에서 제거

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchParticipatedGatherings();
  }, []); // fetchParticipatedGatherings를 의존성에서 제거

  return {
    participatedGatherings,
    loading,
    error,
    fetchParticipatedGatherings,
    setParticipatedGatherings
  };
};
