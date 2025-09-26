import { useState, useEffect, useContext } from 'react';
import { FaFire, FaTrophy, FaMedal, FaStar, FaCalendar, FaClock, FaDumbbell, FaHeart, FaSun, FaMoon, FaCheck, FaBolt, FaChartBar, FaChartLine, FaSync, FaPalette, FaBullseye } from 'react-icons/fa';
import ContainerComponent from '../../common/ContainerComponent';
import HeaderComponent from '../../common/HeaderComponent';
import styles from './Gamification.module.css';
import AchievementService from './achievementService';
import achievementConfig from './achievements.json';
import GamificationService from '../../../services/gamificationService';
import { useAuth } from '../../../context/AuthContext';
import { GET, POST } from '../../../utils/api/api';

export default function Gamification() {
  const { user } = useAuth();
  const [gamificationService] = useState(() => new GamificationService({ GET, POST }));
  const [achievementService] = useState(() => new AchievementService(achievementConfig, gamificationService));
  const [achievements, setAchievements] = useState(achievementConfig.achievements);
  const [userSessions, setUserSessions] = useState([]); // 백엔드에서 가져온 실제 운동 데이터
  const [expandedCategories, setExpandedCategories] = useState({}); // 펼쳐진 카테고리 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStats, setTotalStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    unlockedAchievements: 0,
    completionRate: 0
  });

  // 백엔드에서 사용자 세션 데이터 로드
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const sessions = await achievementService.loadUserSessions(user.accessToken);
        setUserSessions(sessions);
      } catch (err) {
        setError(`데이터를 불러오는 중 오류가 발생했습니다. (${err.response?.status || 'Unknown'})`);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.accessToken, achievementService]);

  // 업적 달성 상태 업데이트
  useEffect(() => {
    if (userSessions.length === 0) return;

    const unlockedAchievements = achievementService.checkAllAchievements(achievements, userSessions);
    const unlockedCount = unlockedAchievements.length;
    const completionRate = Math.round((unlockedCount / achievements.length) * 100);
    
    setTotalStats({
      totalSessions: userSessions.length,
      totalDuration: userSessions.reduce((sum, session) => sum + session.duration, 0),
      unlockedAchievements: unlockedCount,
      completionRate
    });
  }, [userSessions, achievements, achievementService]);

  // 데이터 새로고침 함수
  const refreshData = async () => {
    if (!user?.accessToken) return;

    try {
      setLoading(true);
      setError(null);
      
      const sessions = await achievementService.loadUserSessions(user.accessToken);
      setUserSessions(sessions);
    } catch (err) {
      setError('데이터를 새로고침하는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주기적으로 데이터 새로고침 (5분마다)
  useEffect(() => {
    if (!user?.accessToken) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [user?.accessToken]);

  // 업적 카테고리별 그룹화
  const groupedAchievements = achievements.reduce((groups, achievement) => {
    const category = achievement.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(achievement);
    return groups;
  }, {});

  // 카테고리 이름 매핑
  const categoryNames = {
    'Onboarding': '온보딩 & 초기 동기',
    'Milestone': '마일스톤',
    'Streak': '스트릭(연속일)',
    'Weekly': '주간 리듬',
    'Session': '루틴 구성',
    'Session Pattern': '루틴 패턴',
    'Monthly Volume': '볼륨(월간)',
    'Variety': '다양성',
    'Expertise': '전문성',
    'Time-of-Day': '시간대 루틴'
  };

  // 아이콘 매핑 함수
  const getAchievementIcon = (iconString) => {
    const iconMap = {
      // 스트릭 아이콘들
      'calendar-3': <FaCalendar className={styles.achievementIconSvg} style={{ color: '#4ecdc4' }} />,
      'check-7': <FaCheck className={styles.achievementIconSvg} style={{ color: '#28a745' }} />,
      'trophy-14': <FaTrophy className={styles.achievementIconSvg} style={{ color: '#feca57' }} />,
      
      // 기타 SVG 아이콘들
      'calendar-week': <FaCalendar className={styles.achievementIconSvg} style={{ color: '#45b7d1' }} />,
      'trophy-milestone': <FaTrophy className={styles.achievementIconSvg} style={{ color: '#feca57' }} />,
      'target': <FaBullseye className={styles.achievementIconSvg} style={{ color: '#e74c3c' }} />,
      'bolt': <FaBolt className={styles.achievementIconSvg} style={{ color: '#ffc107' }} />,
      'sync': <FaSync className={styles.achievementIconSvg} style={{ color: '#6c5ce7' }} />,
      'chart-line': <FaChartLine className={styles.achievementIconSvg} style={{ color: '#2ecc71' }} />,
      'chart-bar': <FaChartBar className={styles.achievementIconSvg} style={{ color: '#6c5ce7' }} />,
      'palette': <FaPalette className={styles.achievementIconSvg} style={{ color: '#e91e63' }} />,
      'sunrise': <FaSun className={styles.achievementIconSvg} style={{ color: '#feca57' }} />,
      'sunset': <FaMoon className={styles.achievementIconSvg} style={{ color: '#ff6b35' }} />,
      
      // 기존 이모티콘들 (호환성을 위해 유지)
      '🚶‍♂️': <FaDumbbell className={styles.achievementIconSvg} style={{ color: '#4ecdc4' }} />,
      '⏰': <FaClock className={styles.achievementIconSvg} style={{ color: '#96ceb4' }} />,
      '⭐': <FaStar className={styles.achievementIconSvg} style={{ color: '#ff9ff3' }} />,
      '💪': <FaDumbbell className={styles.achievementIconSvg} style={{ color: '#ff6b6b' }} />,
      '❤️': <FaHeart className={styles.achievementIconSvg} style={{ color: '#ff6b6b' }} />,
      '🌙': <FaMoon className={styles.achievementIconSvg} style={{ color: '#6c5ce7' }} />,
      '🥇': <FaMedal className={styles.achievementIconSvg} style={{ color: '#ffd700' }} />,
    };

    // 매핑된 아이콘이 있으면 반환, 없으면 기본 아이콘 반환
    return iconMap[iconString] || <FaStar className={styles.achievementIconSvg} style={{ color: '#95a5a6' }} />;
  };


  // 카테고리 토글 함수 (모든 화면 크기에서 동작)
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // 업적 상태 표시 (백엔드 데이터 기반)
  const getAchievementStatus = (achievement) => {
    if (userSessions.length === 0) {
      return {
        unlocked: false,
        progress: 0,
        currentValue: 0,
        targetValue: 0,
        lastUnlocked: null
      };
    }

    const status = achievementService.getAchievementStatusWithProgress(achievement, userSessions);
    return {
      unlocked: status.unlocked,
      progress: status.progress,
      currentValue: status.currentValue,
      targetValue: status.targetValue,
      lastUnlocked: null // 마지막 해금 시간 (추후 구현)
    };
  };

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <div className={styles.gamificationContainer}>
        <div className={styles.mobileTitle}>
          <HeaderComponent 
            title="🏆 업적" 
            variant="elevated" 
            size="large" 
            align="center"
            className={styles.pageTitle}
          />
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>업적 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태 렌더링
  if (error) {
    return (
      <div className={styles.gamificationContainer}>
        <div className={styles.mobileTitle}>
          <HeaderComponent 
            title="🏆 업적" 
            variant="elevated" 
            size="large" 
            align="center"
            className={styles.pageTitle}
          />
        </div>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gamificationContainer}>
      {/* 모바일용 페이지 제목 */}
      <div className={styles.mobileTitle}>
        <HeaderComponent 
          title="🏆 업적" 
          variant="elevated" 
          size="large" 
          align="center"
          className={styles.pageTitle}
        />
        <button 
          className={styles.refreshButton}
          onClick={refreshData}
          disabled={loading}
          title="데이터 새로고침"
        >
          🔄
        </button>
      </div>
      
      {/* 좌측: 전체 통계 */}
      <div className={styles.statsColumn}>
        <ContainerComponent variant="elevated" className={styles.statsSection}>
          <HeaderComponent 
            title="📊 전체 통계" 
            variant="outlined" 
            size="medium"
            className={styles.categoryTitle}
          />
          
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={`${styles.statNumber} ${styles.primary}`}>
                {achievements.length}
              </div>
              <p className={styles.statLabel}>전체 업적</p>
            </div>
            
            <div className={styles.statItem}>
              <div className={`${styles.statNumber} ${styles.success}`}>
                {totalStats.unlockedAchievements}
              </div>
              <p className={styles.statLabel}>해금된 업적</p>
            </div>
            
            <div className={styles.statItem}>
              <div className={`${styles.statNumber} ${styles.warning}`}>
                {achievements.length - totalStats.unlockedAchievements}
              </div>
              <p className={styles.statLabel}>잠긴 업적</p>
            </div>
            
            <div className={styles.statItem}>
              <div className={`${styles.statNumber} ${styles.info}`}>
                {totalStats.completionRate}%
              </div>
              <p className={styles.statLabel}>달성률</p>
            </div>
          </div>
          
          <div className={styles.progressSection}>
            <div className={styles.progressLabel}>전체 진행률</div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: '#e9ecef',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${totalStats.completionRate}%`,
                height: '100%',
                backgroundColor: '#17a2b8',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        </ContainerComponent>
      </div>

      {/* 우측: 카테고리별 업적 */}
      <div className={styles.achievementsColumn}>
        <ContainerComponent variant="elevated" className={styles.achievementsContainer}>
          <HeaderComponent 
            title="📋 업적 목록" 
            variant="outlined" 
            size="medium"
            className={styles.containerTitle}
          />
          
          <div className={styles.categoriesList}>
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
              const isExpanded = expandedCategories[category];
              const unlockedCount = categoryAchievements.filter(achievement => 
                achievementService.checkAchievementUnlock(achievement, userSessions)
              ).length;
              
              return (
                <div key={category} className={styles.categorySection}>
                  <div 
                    className={styles.categoryHeader}
                    onClick={() => toggleCategory(category)}
                  >
                    <div className={styles.categoryHeaderLeft}>
                      <h4 className={styles.categoryTitle}>
                        {categoryNames[category] || category}
                      </h4>
                      <span className={styles.categoryCount}>
                        {unlockedCount}/{categoryAchievements.length}
                      </span>
                    </div>
                    <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                      ▼
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className={styles.achievementsGrid}>
                      {categoryAchievements.map(achievement => {
                        const status = getAchievementStatus(achievement);
                        return (
                          <div key={achievement.id} className={`${styles.achievementItem} ${status.unlocked ? styles.unlocked : styles.locked}`}>
                            <div className={styles.achievementHeader}>
                              <div className={styles.achievementIcon}>
                                {getAchievementIcon(achievement.icon)}
                              </div>
                              <div className={styles.achievementInfo}>
                                <h6 className={styles.achievementName}>{achievement.name}</h6>
                                <p className={styles.achievementDescription}>{achievement.description}</p>
                              </div>
                            </div>
                            
                            <div className={styles.achievementFooter}>
                              <div className={styles.progressInfo}>
                                {!status.unlocked && status.targetValue > 0 && (
                                  <div className={styles.progressBar}>
                                    <div 
                                      className={styles.progressFill}
                                      style={{ width: `${status.progress}%` }}
                                    ></div>
                                  </div>
                                )}
                                <div className={styles.progressText}>
                                  {status.unlocked ? (
                                    <span className={`${styles.statusBadge} ${styles.unlocked}`}>
                                      해금됨
                                    </span>
                                  ) : (
                                    <span className={`${styles.statusBadge} ${styles.locked}`}>
                                      {status.targetValue > 0 ? `${status.currentValue}/${status.targetValue}` : "잠김"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ContainerComponent>
      </div>
    </div>
  );
}
