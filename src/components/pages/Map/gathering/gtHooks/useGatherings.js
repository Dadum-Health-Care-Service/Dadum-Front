import { useState, useCallback } from 'react';
import { useApi } from '../../../../../utils/api/useApi';

/**
 * 모임 CRUD 작업을 위한 훅
 * useApi를 사용하여 모임 생성, 조회, 수정, 삭제 등의 API 호출을 관리합니다.
 */
export const useGatherings = () => {
  const { GET, POST, PUT, DELETE } = useApi();
  const [gatherings, setGatherings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 모임 목록 조회
  const fetchGatherings = useCallback(async (category = null) => {
    setLoading(true);
    setError('');

    try {
      const params = category && category !== 'all' ? { category } : {};
      const response = await GET('/gatherings', params, false); // 인증 비활성화
      
      if (response.data.success) {
        setGatherings(response.data.gatherings || []);
        return response.data.gatherings || [];
      } else {
        throw new Error(response.data.error || '모임 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 목록을 불러오는데 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // GET 함수 의존성 제거

  // 모임 생성
  const createGathering = useCallback(async (gatheringData) => {
    setLoading(true);
    setError('');

    try {
      const response = await POST('/gatherings', gatheringData);
      
      if (response.data.success) {
        // 목록에 New Wannabe List 추가
        setGatherings(prev => [response.data.gathering, ...prev]);
        
        // 모임 생성 성공 이벤트 발생
        window.dispatchEvent(new CustomEvent('gatheringCreated', { detail: response.data.gathering }));
        
        return response.data.gathering;
      } else {
        throw new Error(response.data.error || '모임 생성에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 생성에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // POST 함수 의존성 제거

  // 모임 수정
  const updateGathering = useCallback(async (gatheringId, updateData) => {
    setLoading(true);
    setError('');

    try {
      const response = await PUT(`/gatherings/${gatheringId}`, updateData);
      
      if (response.data.success) {
        // 목록에서 해당 모임 업데이트
        setGatherings(prev => 
          prev.map(gathering => 
            gathering.gatheringId === gatheringId ? response.data.gathering : gathering
          )
        );
        
        return response.data.gathering;
      } else {
        throw new Error(response.data.error || '모임 수정에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 수정에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // PUT 함수 의존성 제거

  // 모임 삭제
  const deleteGathering = useCallback(async (gatheringId) => {
    setLoading(true);
    setError('');

    try {
      const response = await DELETE(`/gatherings/${gatheringId}`);
      
      if (response.data.success) {
        // 목록에서 해당 모임 제거
        setGatherings(prev => 
          prev.filter(gathering => gathering.gatheringId !== gatheringId)
        );
        
        return true;
      } else {
        throw new Error(response.data.error || '모임 삭제에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 삭제에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // DELETE 함수 의존성 제거

  // 모임 참여
  const joinGathering = useCallback(async (gatheringId) => {
    setLoading(true);
    setError('');

    try {
      const response = await POST(`/gatherings/${gatheringId}/join`);
      
      if (response.data.success) {
        // 목록에서 해당 모임의 참여자 수 업데이트
        setGatherings(prev => 
          prev.map(gathering => 
            gathering.gatheringId === gatheringId 
              ? { ...gathering, currentParticipants: gathering.currentParticipants + 1 }
              : gathering
          )
        );
        
        return true;
      } else {
        throw new Error(response.data.error || '모임 참여에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 참여에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // POST 함수 의존성 제거

  // 모임 나가기
  const leaveGathering = useCallback(async (gatheringId) => {
    setLoading(true);
    setError('');

    try {
      const response = await POST(`/gatherings/${gatheringId}/leave`);
      
      if (response.data.success) {
        // 목록에서 해당 모임의 참여자 수 업데이트
        setGatherings(prev => 
          prev.map(gathering => 
            gathering.gatheringId === gatheringId 
              ? { ...gathering, currentParticipants: Math.max(0, gathering.currentParticipants - 1) }
              : gathering
          )
        );
        
        return true;
      } else {
        throw new Error(response.data.error || '모임 나가기에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '모임 나가기에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []); // POST 함수 의존성 제거

  // 에러 초기화
  const clearError = useCallback(() => {
    setError('');
  }, []);

  // 모임 참여자 수 동기화
  const syncGatheringParticipants = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await POST('/gatherings/sync-participants', {}, false); // 인증 비활성화
      
      if (response.data.success) {
        // 동기화 후 모임 목록 새로고침
        await fetchGatherings();
        return true;
      } else {
        throw new Error(response.data.error || '참여자 수 동기화에 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '참여자 수 동기화에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchGatherings]);

  return {
    gatherings,
    loading,
    error,
    fetchGatherings,
    createGathering,
    updateGathering,
    deleteGathering,
    joinGathering,
    leaveGathering,
    syncGatheringParticipants,
    clearError
  };
};