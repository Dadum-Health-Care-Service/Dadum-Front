import { useState, useEffect } from 'react';
import { FaFire, FaTrophy, FaMedal, FaStar, FaCalendar, FaClock, FaDumbbell, FaHeart, FaSun, FaMoon, FaCheck, FaBolt, FaChartBar, FaChartLine, FaSync, FaPalette, FaBullseye } from 'react-icons/fa';
import ContainerComponent from '../../common/ContainerComponent';
import HeaderComponent from '../../common/HeaderComponent';
import styles from './Gamification.module.css';
import AchievementService from './achievementService';
import achievementConfig from './achievements.json';

export default function Gamification() {
  const [achievementService] = useState(() => new AchievementService(achievementConfig));
  const [achievements, setAchievements] = useState(achievementConfig.achievements);
  const [userSessions, setUserSessions] = useState([]); // 실제 운동 데이터로 교체
  const [expandedCategories, setExpandedCategories] = useState({}); // 펼쳐진 카테고리 상태
  const [totalStats, setTotalStats] = useState({
    totalSessions: 0,
    totalDuration: 0,
    unlockedAchievements: 0,
    completionRate: 0
  });

  // 업적 달성 상태 업데이트
  useEffect(() => {
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
    'Session': '세션 구성',
    'Session Pattern': '세션 패턴',
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

  // 업적 상태 표시 (실제 구현 시 서버에서 가져온 데이터 사용)
  const getAchievementStatus = (achievement) => {
    const isUnlocked = achievementService.checkAchievementUnlock(achievement, userSessions);
    return {
      unlocked: isUnlocked,
      progress: 0, // 진행률 계산 로직 추가 필요
      lastUnlocked: null // 마지막 해금 시간
    };
  };

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
                              <span className={`${styles.statusBadge} ${status.unlocked ? styles.unlocked : styles.locked}`}>
                                {status.unlocked ? "해금됨" : "잠김"}
                              </span>
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
