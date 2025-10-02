import { GET } from '../utils/api/api';

/**
 * 업적 시스템을 위한 백엔드 데이터 서비스
 */
export class GamificationService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  /**
   * 사용자의 모든 루틴 실행 결과를 가져옵니다
   * @param {string} accessToken - 사용자 인증 토큰
   * @param {Object} dateRange - 날짜 범위 (선택사항)
   * @returns {Promise<Array>} 루틴 실행 결과 배열
   */
  async getRoutineResults(accessToken, dateRange = null) {
    try {
      // 날짜 범위가 없으면 null을 보내지 말고 빈 객체를 보냅니다
      const requestBody = dateRange ? {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      } : {};

      const response = await this.apiClient.POST(
        '/routine/result',
        requestBody,
        accessToken
      );

      return response.data || [];
    } catch (error) {
      // JWT 만료 에러 처리
      if (error.response?.status === 500 && 
          error.response?.data?.message?.includes('JWT expired')) {
        // 로그아웃 처리
        localStorage.removeItem('user');
        window.location.href = '/login';
        return [];
      }
      
      return [];
    }
  }

  /**
   * 사용자의 모든 루틴 목록을 가져옵니다
   * @param {string} accessToken - 사용자 인증 토큰
   * @returns {Promise<Array>} 루틴 목록 배열
   */
  async getRoutines(accessToken) {
    try {
      const response = await this.apiClient.GET(
        '/routine/list',
        {},
        accessToken
      );

      return response.data || [];
    } catch (error) {
      // JWT 만료 에러 처리
      if (error.response?.status === 500 && 
          error.response?.data?.message?.includes('JWT expired')) {
        // 로그아웃 처리
        localStorage.removeItem('user');
        window.location.href = '/login';
        return [];
      }
      
      // 기타 500 에러의 경우 빈 배열을 반환
      if (error.response?.status === 500) {
        return [];
      }
      
      throw error; // 다른 에러는 다시 throw
    }
  }

  /**
   * 백엔드 루틴 결과 데이터를 업적 시스템에서 사용할 세션 데이터로 변환합니다
   * @param {Array} routineResults - 백엔드에서 가져온 루틴 실행 결과 배열
   * @param {Array} routines - 사용자의 루틴 목록
   * @returns {Array} 업적 시스템에서 사용할 세션 데이터 배열
   */
  transformToSessionData(routineResults, routines) {
    const routineMap = new Map();
    routines.forEach(routine => {
      routineMap.set(routine.setId, routine);
    });

    return routineResults.map(result => {
      const routine = routineMap.get(result.id);
      const startTime = new Date(result.tStart);
      const endTime = new Date(result.tEnd);
      const duration = Math.round((endTime - startTime) / (1000 * 60)); // 분 단위

      return {
        id: result.retId,
        startTime: result.tStart,
        endTime: result.tEnd,
        duration: duration,
        status: 'valid', // 백엔드에서 가져온 데이터는 모두 유효한 것으로 간주
        category: this.getCategoryFromRoutine(routine),
        routineId: result.id,
        routineName: routine?.routineName || '알 수 없는 루틴',
        // 루틴 결과 데이터 추가
        routineResult: result.routineResult ? {
          muscle: result.routineResult.muscle,
          kcal: result.routineResult.kcal,
          reSet: result.routineResult.reSet,
          setNum: result.routineResult.setNum,
          volum: result.routineResult.volum,
          rouTime: result.routineResult.rouTime,
          exVolum: result.routineResult.exVolum
        } : null
      };
    }).filter(session => session.duration >= 10); // 최소 10분 이상만 유효한 세션으로 간주
  }

  /**
   * 루틴에서 카테고리 정보를 추출합니다
   * @param {Object} routine - 루틴 객체
   * @returns {string} 카테고리명
   */
  getCategoryFromRoutine(routine) {
    if (!routine) return '기타';
    
    // 루틴 이름이나 설명에서 카테고리를 추출하는 로직
    // 실제 구현에서는 루틴의 카테고리 필드가 있다면 그것을 사용
    const routineName = routine.routineName?.toLowerCase() || '';
    
    if (routineName.includes('유산소') || routineName.includes('cardio')) {
      return '유산소';
    } else if (routineName.includes('근력') || routineName.includes('strength')) {
      return '근력';
    } else if (routineName.includes('요가') || routineName.includes('yoga')) {
      return '요가';
    } else if (routineName.includes('필라테스') || routineName.includes('pilates')) {
      return '필라테스';
    } else if (routineName.includes('스트레칭') || routineName.includes('stretching')) {
      return '스트레칭';
    } else {
      return '기타';
    }
  }

  /**
   * 사용자의 업적 관련 통계를 계산합니다
   * @param {Array} sessions - 세션 데이터 배열
   * @returns {Object} 통계 정보
   */
  calculateStats(sessions) {
    const totalSessions = sessions.length;
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const uniqueDays = new Set(sessions.map(session => 
      new Date(session.startTime).toDateString()
    )).size;
    
    // 카테고리별 통계
    const categoryStats = {};
    sessions.forEach(session => {
      const category = session.category;
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          totalDuration: 0
        };
      }
      categoryStats[category].count++;
      categoryStats[category].totalDuration += session.duration;
    });

    return {
      totalSessions,
      totalDuration,
      uniqueDays,
      categoryStats,
      averageSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0
    };
  }

  /**
   * 최근 N일간의 세션 데이터를 필터링합니다
   * @param {Array} sessions - 전체 세션 데이터
   * @param {number} days - 최근 일수
   * @returns {Array} 필터링된 세션 데이터
   */
  getRecentSessions(sessions, days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return sessions.filter(session => 
      new Date(session.startTime) >= cutoffDate
    );
  }

  /**
   * 특정 월의 세션 데이터를 필터링합니다
   * @param {Array} sessions - 전체 세션 데이터
   * @param {number} year - 연도
   * @param {number} month - 월 (1-12)
   * @returns {Array} 필터링된 세션 데이터
   */
  getMonthlySessions(sessions, year, month) {
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate.getFullYear() === year && 
             sessionDate.getMonth() === month - 1;
    });
  }
}

export default GamificationService;
