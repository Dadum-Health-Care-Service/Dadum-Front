import { useState, useEffect } from 'react';
import { Card, Button, Badge, Row, Col, Container, Spinner, Alert } from 'react-bootstrap';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { useGatheringCategories, useGatherings } from './gtHooks';
import CreateGathering from './CreateGathering';
import GatheringDetail from './GatheringDetail';
import styles from './Gathering.module.css';

const GatheringList = () => {
  const { userLocation } = useKakaoMap();
  const { categories } = useGatheringCategories();
  const { gatherings, loading, error, fetchGatherings, joinGathering, leaveGathering } = useGatherings();
  
  const [filteredGatherings, setFilteredGatherings] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGathering, setSelectedGathering] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  // 카테고리 필터링
  const filterGatherings = (gatherings, category) => {
    if (category === 'all') {
      return gatherings;
    }
    return gatherings.filter(gathering => gathering.category === category);
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  // 필터링된 모임 목록 업데이트
  useEffect(() => {
    const filtered = filterGatherings(gatherings, selectedCategory);
    setFilteredGatherings(filtered);
    setCurrentPage(1); // 카테고리 변경 시 첫 페이지로
  }, [gatherings, selectedCategory]);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredGatherings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGatherings = filteredGatherings.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 모임 참여 핸들러
  const handleJoinGathering = async (gatheringId) => {
    try {
      await joinGathering(gatheringId);
      alert('모임에 성공적으로 참여했습니다!');
      // 모임 목록 새로고침
      fetchGatherings();
    } catch (err) {
      alert(err.message);
    }
  };

  // 모임 상세보기
  const handleGatheringClick = (gathering) => {
    setSelectedGathering(gathering);
    setShowDetailModal(true);
  };

  // 거리 계산 (간단한 Haversine 공식)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  useEffect(() => {
    fetchGatherings();
    
    // 모임 생성 이벤트 리스너 등록
    const handleGatheringCreated = () => {
      fetchGatherings();
    };
    
    window.addEventListener('gatheringCreated', handleGatheringCreated);
    
    return () => {
      window.removeEventListener('gatheringCreated', handleGatheringCreated);
    };
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">로딩 중...</span>
        </Spinner>
        <p>모임 목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <Container className={styles.gatheringListContainer}>
        {/* 카테고리 필터 */}
        <div className={styles.categoryFilter}>
          <div className={styles.categoryButtons}>
            {categories.map(category => (
              <Button
                key={category.value}
                variant={selectedCategory === category.value ? "primary" : "outline-secondary"}
                size="sm"
                onClick={() => handleCategoryChange(category.value)}
                className={styles.categoryButton}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div className={styles.createButtonContainer}>
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
            size="sm"
          >
            + New Wannabe List
          </Button>
        </div>


      {error && (
        <Alert variant="danger" className={styles.errorAlert}>
          {error}
        </Alert>
      )}

      {filteredGatherings.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏃‍♂️</div>
          <h4>
            {selectedCategory === 'all' ? '아직 모임이 없습니다' : `${categories.find(c => c.value === selectedCategory)?.label} 모임이 없습니다`}
          </h4>
          <p>
            {selectedCategory === 'all' ? '첫 번째 모임을 만들어보세요!' : '다른 카테고리를 확인해보거나 New Wannabe List을 만들어보세요!'}
          </p>
        </div>
      ) : (
        <div className={styles.gatheringList}>
          {currentGatherings.map((gathering) => (
            <div 
              key={gathering.gatheringId} 
              className={styles.gatheringListItem}
              onClick={() => handleGatheringClick(gathering)}
            >
              <div className={styles.listItemContent}>
                <div className={styles.listItemMain}>
                  <h5 className={styles.gatheringTitle}>{gathering.title}</h5>
                  <div className={styles.listItemMeta}>
                    <span className={styles.participantInfo}>
                      참여자: {gathering.currentParticipants}/{gathering.maxParticipants}명
                    </span>
                    <span className={styles.categoryInfo}>
                      {categories.find(c => c.value === gathering.category)?.label}
                    </span>
                    <span className={styles.statusInfo}>
                      {gathering.status === 'ACTIVE' ? '진행중' : '종료'}
                    </span>
                  </div>
                </div>
                <div className={styles.listItemActions}>
                  <button 
                    className={styles.joinButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGathering(gathering.gatheringId);
                    }}
                    disabled={gathering.currentParticipants >= gathering.maxParticipants}
                  >
                    참여하기
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {filteredGatherings.length > itemsPerPage && (
        <div className={styles.pagination}>
          <div className={styles.paginationInfo}>
            {startIndex + 1}-{Math.min(endIndex, filteredGatherings.length)} / {filteredGatherings.length}개
          </div>
          <div className={styles.paginationButtons}>
            <button 
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`${styles.pageButton} ${currentPage === page ? styles.activePage : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className={styles.pageButton}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 모임 생성 모달 */}
      <CreateGathering 
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchGatherings();
        }}
      />

      {/* 모임 상세 모달 */}
      <GatheringDetail 
        show={showDetailModal}
        onHide={() => setShowDetailModal(false)}
        gathering={selectedGathering}
        onJoin={() => {
          setShowDetailModal(false);
          fetchGatherings();
        }}
      />
    </Container>
  );
};

export default GatheringList;
