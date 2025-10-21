import { useState, useEffect } from 'react';
import { Modal, Button, Alert, Row, Col, Badge, ListGroup, Spinner } from 'react-bootstrap';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { useGatheringCategories, useGatheringParticipants, useGatherings } from './gtHooks';
import styles from './Gathering.module.css';

const GatheringDetail = ({ show, onHide, gathering, onJoin, onClose }) => {
  const { userLocation } = useKakaoMap();
  const { findCategory } = useGatheringCategories();
  const { participants, loading, error, fetchParticipants, isParticipant } = useGatheringParticipants();
  const { joinGathering, leaveGathering } = useGatherings();
  
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');


  // 모임 참여
  const handleJoin = async () => {
    setJoining(true);
    setJoinError('');
    
    try {
      await joinGathering(gathering.gatheringId);
      alert('모임에 성공적으로 참여했습니다!');
      
      // 참여자 목록 새로고침
      await fetchParticipants(gathering.gatheringId);
      
      // 부모 컴포넌트에 참여 완료 알림
      onJoin();
    } catch (err) {
      setJoinError(err.message);
      console.error('모임 참여 실패:', err);
    } finally {
      setJoining(false);
    }
  };

  // 모임 나가기
  const handleLeave = async () => {
    if (!window.confirm('정말로 모임에서 나가시겠습니까?')) {
      return;
    }

    setJoining(true);
    setJoinError('');
    
    try {
      await leaveGathering(gathering.gatheringId);
      alert('모임에서 나갔습니다.');
      
      // 참여자 목록 새로고침
      await fetchParticipants(gathering.gatheringId);
      
      // 부모 컴포넌트에 나가기 완료 알림
      onJoin();
    } catch (err) {
      setJoinError(err.message);
      console.error('모임 나가기 실패:', err);
    } finally {
      setJoining(false);
    }
  };

  // 거리 계산
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
    if (show && gathering) {
      fetchParticipants(gathering.gatheringId);
    }
  }, [show, gathering, fetchParticipants]);

  // 참여 상태 확인을 위한 추가 useEffect
  useEffect(() => {
    if (show && gathering && participants.length > 0) {
      // 참여자 목록이 로드된 후 상태 확인
      console.log('참여자 목록:', participants);
      console.log('현재 사용자 ID:', localStorage.getItem('userId'));
    }
  }, [show, gathering, participants]);

  if (!gathering) return null;

  return (
    <Modal show={show} onHide={onHide || onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className={styles.detailTitle}>
          {gathering.title}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {(error || joinError) && (
          <Alert variant="danger" className={styles.errorAlert}>
            {error || joinError}
          </Alert>
        )}

        <Row>
          <Col md={8}>
            <div className={styles.gatheringInfo}>
              <div className={styles.statusSection}>
                <Badge 
                  bg="info" 
                  className={styles.categoryBadge}
                >
                  {findCategory(gathering.category)?.icon} {findCategory(gathering.category)?.label}
                </Badge>
                <Badge 
                  bg={gathering.status === 'ACTIVE' ? 'success' : 'secondary'}
                  className={styles.statusBadge}
                >
                  {gathering.status === 'ACTIVE' ? '진행중' : '종료'}
                </Badge>
                <span className={styles.participantCount}>
                  👥 {gathering.currentParticipants}/{gathering.maxParticipants}명
                </span>
              </div>

              <div className={styles.descriptionSection}>
                <h6>📝 모임 설명</h6>
                <p className={styles.description}>{gathering.description}</p>
              </div>

              <div className={styles.locationSection}>
                <h6>📍 모임 장소</h6>
                <p className={styles.location}>
                  {gathering.address}
                  {userLocation && gathering.latitude && gathering.longitude && (
                    <span className={styles.distance}>
                      ({Math.round(calculateDistance(
                        userLocation.lat, 
                        userLocation.lng, 
                        gathering.latitude, 
                        gathering.longitude
                      ) * 1000)}m)
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.timeSection}>
                <h6>⏰ 모임 정보</h6>
                <p className={styles.timeInfo}>
                  생성일: {new Date(gathering.createdAt).toLocaleString()}
                </p>
                <div className={styles.scheduleInfo}>
                  {gathering.nextMeetingDate ? (
                    <>
                      <div className={styles.scheduleDate}>
                        📅 <strong>모임 일정:</strong> {new Date(gathering.nextMeetingDate).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </div>
                      <div className={styles.scheduleTime}>
                        🕐 <strong>모임 시간:</strong> {new Date(gathering.nextMeetingDate).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </>
                  ) : (
                    <div className={styles.scheduleDate}>
                      📅 <strong>모임 일정:</strong> 일정 미정
                    </div>
                  )}
                    {/* scheduleType이 있으면 항상 표시 */}
                    <div className={styles.scheduleType}>
                      🔄 <strong>일정 유형:</strong> {
                        gathering.scheduleType === 'ONE_TIME' ? '일회성 모임' :
                        gathering.scheduleType === 'WEEKLY' ? '주기적 모임 (매주)' :
                        gathering.scheduleType === 'MONTHLY' ? '주기적 모임 (매월)' :
                        gathering.scheduleType === 'CUSTOM' ? '사용자 정의 모임' : '일회성 모임'
                      }
                    </div>
                    {gathering.scheduleDetails && (
                      <div className={styles.scheduleDetails}>
                        📝 <strong>일정 상세:</strong> {gathering.scheduleDetails}
                      </div>
                    )}
                  </div>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <div className={styles.participantsSection}>
              <h6>👥 참여자 목록</h6>
              
              {loading ? (
                <div className={styles.loadingContainer}>
                  <Spinner size="sm" animation="border" />
                  <span>로딩 중...</span>
                </div>
              ) : (
                <ListGroup className={styles.participantList}>
                  {participants.map((participant, index) => (
                    <ListGroup.Item key={participant.participantId} className={styles.participantItem}>
                      <div className={styles.participantInfo}>
                        <span className={styles.participantNumber}>{index + 1}</span>
                        <span className={styles.participantName}>
                          {participant.nickname || `사용자${participant.userId}`}
                        </span>
                        {participant.role === 'CREATOR' && (
                          <Badge bg="primary" size="sm">방장</Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {new Date(participant.joinedAt).toLocaleDateString()} 참여
                      </small>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}

              {participants.length === 0 && !loading && (
                <p className={styles.emptyParticipants}>아직 참여자가 없습니다.</p>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>
      
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          닫기
        </Button>
        
        {gathering.status === 'ACTIVE' && (
          <>
            {isParticipant(gathering.gatheringId) ? (
              <Button 
                variant="danger" 
                onClick={handleLeave}
                disabled={joining}
              >
                {joining ? '처리 중...' : '모임 나가기'}
              </Button>
            ) : (
              <Button 
                variant="success" 
                onClick={handleJoin}
                disabled={joining || gathering.currentParticipants >= gathering.maxParticipants}
              >
                {joining ? '참여 중...' : 
                 gathering.currentParticipants >= gathering.maxParticipants ? '정원 마감' : '참여하기'}
              </Button>
            )}
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default GatheringDetail;
