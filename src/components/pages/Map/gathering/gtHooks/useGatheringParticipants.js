import { useState, useCallback } from 'react';
import { useApi } from '../../../../../utils/api/useApi';

/**
 * 모임 참여자 관리를 위한 훅
 * useApi를 사용하여 모임 참여자 조회, 참여 여부 확인 등의 API 호출을 관리합니다.
 */
export const useGatheringParticipants = () => {
  const { GET } = useApi();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentUserId = parseInt(localStorage.getItem('userId'));

  // 에러 초기화
  const clearError = useCallback(() => setError(''), []);
  
  // 참여자 목록 초기화
  const clearParticipants = useCallback(() => setParticipants([]), []);

  // 참여자 목록 조회
  const fetchParticipants = useCallback(async (gatheringId) => {
    if (!gatheringId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await GET(`/gatherings/${gatheringId}/participants`);
      
      if (response.data.success) {
        setParticipants(response.data.participants || []);
        return response.data.participants || [];
      } else {
        throw new Error(response.data.error || '참여자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || '참여자 목록을 불러오는데 실패했습니다.');
      console.error('참여자 목록 조회 실패:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 사용자가 특정 모임에 참여했는지 확인
  const isParticipant = useCallback((gatheringId) => {
    if (!currentUserId || participants.length === 0) return false;
    return participants.some(p => p.userId === currentUserId);
  }, [participants, currentUserId]);

  // 참여자 수 조회
  const getParticipantCount = useCallback(() => participants.length, [participants]);

  // 특정 사용자의 참여자 정보 조회
  const getParticipantInfo = useCallback((userId) => {
    return participants.find(p => p.userId === userId);
  }, [participants]);

  // 참여자 추가 (로컬 상태 업데이트용)
  const addParticipant = useCallback((participant) => {
    setParticipants(prev => [...prev, participant]);
  }, []);

  // 참여자 제거 (로컬 상태 업데이트용)
  const removeParticipant = useCallback((userId) => {
    setParticipants(prev => prev.filter(p => p.userId !== userId));
  }, []);

  return {
    participants,
    loading,
    error,
    fetchParticipants,
    isParticipant,
    getParticipantCount,
    getParticipantInfo,
    addParticipant,
    removeParticipant,
    clearParticipants,
    clearError
  };
};