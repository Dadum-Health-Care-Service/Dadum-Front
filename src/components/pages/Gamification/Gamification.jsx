import { useState, useEffect } from 'react';
import ContainerComponent from '../../common/ContainerComponent';
import HeaderComponent from '../../common/HeaderComponent';
import styles from './Gamification.module.css';
import AchievementService from './achievementService';
import achievementConfig from './achievements.json';

export default function Gamification() {
  const [achievementService] = useState(() => new AchievementService(achievementConfig));
  const [achievements, setAchievements] = useState(achievementConfig.achievements);
  const [userSessions, setUserSessions] = useState([]); // 실제 운동 데이터로 교체
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
      <HeaderComponent 
        title="🏆 업적 시스템" 
        variant="elevated" 
        size="large" 
        align="center"
        className={styles.pageTitle}
      />
      
      {/* 전체 통계 */}
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

      {/* 카테고리별 업적 */}
      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <ContainerComponent key={category} variant="elevated" className={styles.categorySection}>
          <HeaderComponent 
            title={categoryNames[category] || category}
            variant="outlined" 
            size="medium"
            className={styles.categoryTitle}
          />
          
          <div className={styles.achievementsGrid}>
            {categoryAchievements.map(achievement => {
              const status = getAchievementStatus(achievement);
              return (
                <div key={achievement.id} className={`${styles.achievementItem} ${status.unlocked ? styles.unlocked : styles.locked}`}>
                  <div className={styles.achievementHeader}>
                    <div className={styles.achievementIcon}>
                      {achievement.icon}
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
        </ContainerComponent>
      ))}
    </div>
  );
}
