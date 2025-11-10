import React, { useState, useEffect } from 'react';
import { useParticipatedGatherings } from '../hooks/useParticipatedGatherings';
import GatheringCalendar from '../../Map/gathering/GatheringCalendar';
import GatheringDetail from '../../Map/gathering/GatheringDetail';
import styles from './ParticipatedGatheringsSidebar.module.css';

const ParticipatedGatheringsSidebar = () => {
  const { participatedGatherings, loading, error } = useParticipatedGatherings();
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedGatherings, setExpandedGatherings] = useState(new Set());
  const [selectedGathering, setSelectedGathering] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(prev => !prev);
  };

  const toggleGatheringExpanded = (gatheringId) => {
    setExpandedGatherings(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gatheringId)) {
        newSet.delete(gatheringId);
      } else {
        newSet.add(gatheringId);
      }
      return newSet;
    });
  };

  const handleGatheringClick = (gathering) => {
    setSelectedGathering(gathering);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedGathering(null);
  };

  // 달력에서 모임 클릭 시 모달 열기
  useEffect(() => {
    const handleShowGatheringDetail = (event) => {
      const { gathering } = event.detail;
      setSelectedGathering(gathering);
      setShowDetailModal(true);
    };

    window.addEventListener('showGatheringDetail', handleShowGatheringDetail);
    
    return () => {
      window.removeEventListener('showGatheringDetail', handleShowGatheringDetail);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Wannabe List</h3>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Wannabe List</h3>
        <div className={styles.error}>
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidebar}>
      <h3 
        className={styles.sidebarTitle}
        onClick={toggleExpanded}
        style={{ cursor: 'pointer' }}
      >
        Wannabe List
        <span className={styles.expandIcon}>
          {isExpanded ? '▼' : '▶'}
        </span>
      </h3>
      
      {isExpanded && (
        <>
          {participatedGatherings.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🏃‍♂️</div>
              <p className={styles.emptyText}>
                아직 참여한 모임이 없습니다.
              </p>
              <p className={styles.emptySubtext}>
                플레이스에서 모임을 찾아 참여해보세요!
              </p>
            </div>
          ) : (
            <div className={styles.gatheringList}>
              {participatedGatherings.map((gathering) => {
                const isGatheringExpanded = expandedGatherings.has(gathering.gatheringId);
                return (
                  <div key={gathering.gatheringId} className={styles.gatheringItem}>
                    <div 
                      className={styles.gatheringHeader}
                      onClick={() => toggleGatheringExpanded(gathering.gatheringId)}
                      style={{ cursor: 'pointer' }}
                    >
                      <h4 className={styles.gatheringTitle}>
                        {gathering.title}
                        <span className={styles.expandIcon}>
                          {isGatheringExpanded ? '▼' : '▶'}
                        </span>
                      </h4>
                      <span className={styles.gatheringStatus}>
                        {gathering.status === 'ACTIVE' ? '진행중' : '종료'}
                      </span>
                    </div>
                    
                    {isGatheringExpanded && (
                      <div className={styles.gatheringInfo}>
                        <div className={styles.gatheringContent}>
                          <div className={styles.gatheringCategory}>
                            {gathering.category === 'fitness' && '💪 헬스/피트니스'}
                            {gathering.category === 'running' && '🏃‍♂️ 러닝/조깅'}
                            {gathering.category === 'yoga' && '🧘‍♀️ 요가'}
                            {gathering.category === 'swimming' && '🏊‍♂️ 수영'}
                            {gathering.category === 'cycling' && '🚴‍♂️ 사이클링'}
                          </div>
                          
                          <div className={styles.gatheringParticipants}>
                            👥 {gathering.currentParticipants}/{gathering.maxParticipants}명
                          </div>
                          
                          {gathering.scheduleType && gathering.scheduleType !== 'ONE_TIME' && (
                            <div className={styles.gatheringSchedule}>
                              📅 {gathering.scheduleDetails || '일정 정보 없음'}
                            </div>
                          )}
                        </div>
                        
                        <div className={styles.gatheringActions}>
                          <button 
                            className={styles.detailButton}
                            onClick={() => handleGatheringClick(gathering)}
                          >
                            상세보기
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      
      {/* 달력 섹션 */}
      <div className={styles.calendarSection}>
        <GatheringCalendar />
      </div>

      {/* 모임 상세 모달 */}
      {showDetailModal && selectedGathering && (
        <GatheringDetail
          show={showDetailModal}
          onHide={handleCloseModal}
          gathering={selectedGathering}
        />
      )}
    </div>
  );
};

export default ParticipatedGatheringsSidebar;
