// 새로운 JSON 스키마 기반 업적 달성 체크 서비스
export class AchievementService {
  constructor(config) {
    this.config = config;
    this.validSessionCriteria = config.valid_session_definition;
    this.caps = config.caps;
  }

  // 유효 세션 판정
  isValidSession(session) {
    return (
      session.duration >= this.validSessionCriteria.min_active_minutes &&
      session.duration <= this.caps.daily_total_cap_minutes &&
      session.status === 'valid'
    );
  }

  // 세션 간격 체크
  checkSessionInterval(session1, session2) {
    const timeDiff = Math.abs(new Date(session1.endTime) - new Date(session2.startTime));
    return timeDiff >= this.validSessionCriteria.min_gap_between_sessions_minutes * 60 * 1000;
  }

  // 세션 겹침 체크
  checkSessionOverlap(session1, session2) {
    const start1 = new Date(session1.startTime);
    const end1 = new Date(session1.endTime);
    const start2 = new Date(session2.startTime);
    const end2 = new Date(session2.endTime);
    
    return start1 < end2 && start2 < end1;
  }

  // 업적 달성 체크 메인 함수
  checkAchievementUnlock(achievement, userSessions, currentSession = null) {
    const validSessions = userSessions.filter(session => this.isValidSession(session));
    
    // 겹침 체크
    if (this.validSessionCriteria.no_overlap) {
      validSessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      for (let i = 1; i < validSessions.length; i++) {
        if (this.checkSessionOverlap(validSessions[i-1], validSessions[i])) {
          validSessions.splice(i, 1); // 겹치는 세션 제거
          i--;
        }
      }
    }

    return this.evaluateRule(achievement.rule, validSessions, currentSession);
  }

  // 규칙 평가 함수
  evaluateRule(rule, sessions, currentSession) {
    for (const [ruleType, condition] of Object.entries(rule)) {
      const result = this.evaluateRuleType(ruleType, condition, sessions, currentSession);
      if (!result) return false;
    }
    return true;
  }

  // 규칙 타입별 평가
  evaluateRuleType(ruleType, condition, sessions, currentSession) {
    switch (ruleType) {
      case 'total_valid_sessions':
        return this.evaluateComparison(sessions.length, condition);
      
      case 'current_session_min':
        return currentSession && this.evaluateComparison(currentSession.duration, condition);
      
      case 'weekly_sessions':
        return this.evaluateComparison(this.getWeeklySessions(sessions).length, condition);
      
      case 'lifetime_active_minutes':
        return this.evaluateComparison(this.getTotalActiveMinutes(sessions), condition);
      
      case 'consecutive_days_with_valid_session':
        return this.evaluateComparison(this.getConsecutiveDays(sessions), condition);
      
      case 'active_days_in_week':
        return this.evaluateComparison(this.getActiveDaysInWeek(sessions), condition);
      
      case 'consecutive_weeks_active_days_in_week':
        return this.evaluateConsecutiveWeeks(condition, sessions);
      
      case 'sessions_count_in_day':
        return this.evaluateDailySessions(condition, sessions);
      
      case 'each_session_min':
        return this.evaluateSessionDuration(condition, sessions);
      
      case 'min_gap_minutes_between_sessions':
        return this.evaluateSessionGap(condition, sessions);
      
      case 'monthly_active_minutes':
        return this.evaluateComparison(this.getMonthlyActiveMinutes(sessions), condition);
      
      case 'monthly_valid_sessions':
        return this.evaluateComparison(this.getMonthlySessions(sessions).length, condition);
      
      case 'lifetime_distinct_categories':
        return this.evaluateComparison(this.getDistinctCategories(sessions), condition);
      
      case 'category_lifetime_sessions':
        return this.evaluateCategorySessions(condition, sessions);
      
      case 'monthly_sessions_in_time_window':
        return this.evaluateTimeWindowSessions(condition, sessions);
      
      default:
        return false;
    }
  }

  // 비교 연산자 평가
  evaluateComparison(value, condition) {
    for (const [operator, target] of Object.entries(condition)) {
      switch (operator) {
        case '>=':
          return value >= target;
        case '>':
          return value > target;
        case '<=':
          return value <= target;
        case '<':
          return value < target;
        case '==':
          return value === target;
        default:
          return false;
      }
    }
    return false;
  }

  // 주간 세션 수 계산
  getWeeklySessions(sessions) {
    const now = new Date();
    const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= weekStart && sessionDate < weekEnd;
    });
  }

  // 총 활성 시간 계산
  getTotalActiveMinutes(sessions) {
    return sessions.reduce((sum, session) => sum + session.duration, 0);
  }

  // 연속일 계산
  getConsecutiveDays(sessions) {
    const dailySessions = this.groupSessionsByDay(sessions);
    const sortedDays = Object.keys(dailySessions).sort();
    
    let maxStreak = 0;
    let currentStreak = 0;
    
    for (let i = 0; i < sortedDays.length; i++) {
      const day = sortedDays[i];
      const daySessions = dailySessions[day];
      
      // 하루 총 운동시간 체크
      const dailyDuration = daySessions.reduce((sum, session) => sum + session.duration, 0);
      if (dailyDuration > this.caps.daily_total_cap_minutes) continue;
      
      // 이전 날과 연속인지 체크
      if (i > 0) {
        const prevDay = sortedDays[i - 1];
        const daysDiff = this.getDaysDifference(prevDay, day);
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    return maxStreak;
  }

  // 주간 활동일 계산
  getActiveDaysInWeek(sessions) {
    const weeklySessions = this.getWeeklySessions(sessions);
    const uniqueDays = new Set(
      weeklySessions.map(session => 
        new Date(session.startTime).toDateString()
      )
    );
    return uniqueDays.size;
  }

  // 연속 주간 체크
  evaluateConsecutiveWeeks(condition, sessions) {
    const { min_active_days, weeks } = condition;
    let consecutiveWeeks = 0;
    const now = new Date();
    
    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + i * 7));
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weeklySessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate >= weekStart && sessionDate < weekEnd;
      });
      
      const uniqueDays = new Set(
        weeklySessions.map(session => 
          new Date(session.startTime).toDateString()
        )
      );
      
      if (uniqueDays.size >= min_active_days) {
        consecutiveWeeks++;
      } else {
        break;
      }
    }
    
    return consecutiveWeeks >= weeks;
  }

  // 일일 세션 수 체크
  evaluateDailySessions(condition, sessions) {
    const dailySessions = this.groupSessionsByDay(sessions);
    
    for (const [operator, target] of Object.entries(condition)) {
      for (const day in dailySessions) {
        const daySessions = dailySessions[day];
        if (this.evaluateComparison(daySessions.length, { [operator]: target })) {
          return true;
        }
      }
    }
    return false;
  }

  // 세션 지속시간 체크
  evaluateSessionDuration(condition, sessions) {
    for (const [operator, target] of Object.entries(condition)) {
      const hasValidSession = sessions.some(session => 
        this.evaluateComparison(session.duration, { [operator]: target })
      );
      if (!hasValidSession) return false;
    }
    return true;
  }

  // 세션 간격 체크
  evaluateSessionGap(condition, sessions) {
    const dailySessions = this.groupSessionsByDay(sessions);
    
    for (const day in dailySessions) {
      const daySessions = dailySessions[day];
      if (daySessions.length < 2) continue;
      
      const sortedSessions = daySessions.sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );
      
      let validGap = true;
      for (let i = 1; i < sortedSessions.length; i++) {
        const gap = Math.abs(
          new Date(sortedSessions[i-1].endTime) - new Date(sortedSessions[i].startTime)
        ) / (60 * 1000); // 분 단위로 변환
        
        for (const [operator, target] of Object.entries(condition)) {
          if (!this.evaluateComparison(gap, { [operator]: target })) {
            validGap = false;
            break;
          }
        }
        if (!validGap) break;
      }
      
      if (validGap) return true;
    }
    return false;
  }

  // 월간 활성 시간 계산
  getMonthlyActiveMinutes(sessions) {
    const monthlySessions = this.getMonthlySessions(sessions);
    return monthlySessions.reduce((sum, session) => sum + session.duration, 0);
  }

  // 월간 세션 수 계산
  getMonthlySessions(sessions) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return sessions.filter(session => {
      const sessionDate = new Date(session.startTime);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });
  }

  // 고유 카테고리 수 계산
  getDistinctCategories(sessions) {
    const categories = new Set(sessions.map(session => session.category).filter(Boolean));
    return categories.size;
  }

  // 카테고리별 세션 수 체크
  evaluateCategorySessions(condition, sessions) {
    const categoryCounts = {};
    
    sessions.forEach(session => {
      if (session.category) {
        categoryCounts[session.category] = (categoryCounts[session.category] || 0) + 1;
      }
    });
    
    for (const [operator, target] of Object.entries(condition)) {
      const hasValidCategory = Object.values(categoryCounts).some(count => 
        this.evaluateComparison(count, { [operator]: target })
      );
      if (!hasValidCategory) return false;
    }
    return true;
  }

  // 시간대별 세션 체크
  evaluateTimeWindowSessions(condition, sessions) {
    const { start, end, count } = condition;
    const monthlySessions = this.getMonthlySessions(sessions);
    
    const timeSlotSessions = monthlySessions.filter(session => {
      const sessionHour = new Date(session.startTime).getHours();
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);
      return sessionHour >= startHour && sessionHour < endHour;
    });
    
    for (const [operator, target] of Object.entries(count)) {
      return this.evaluateComparison(timeSlotSessions.length, { [operator]: target });
    }
    return false;
  }

  // 헬퍼 함수들
  groupSessionsByDay(sessions) {
    const dailySessions = {};
    
    sessions.forEach(session => {
      const day = new Date(session.startTime).toDateString();
      if (!dailySessions[day]) {
        dailySessions[day] = [];
      }
      dailySessions[day].push(session);
    });
    
    return dailySessions;
  }

  getDaysDifference(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((new Date(date1) - new Date(date2)) / oneDay));
  }

  // 모든 업적 체크
  checkAllAchievements(achievements, userSessions, currentSession = null) {
    const unlockedAchievements = [];
    
    achievements.forEach(achievement => {
      if (this.checkAchievementUnlock(achievement, userSessions, currentSession)) {
        unlockedAchievements.push(achievement);
      }
    });
    
    return unlockedAchievements;
  }
}

export default AchievementService;
