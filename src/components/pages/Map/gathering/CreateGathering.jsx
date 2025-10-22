import { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useKakaoMap } from '../hooks/useKakaoMap';
import { useGatheringCategories, useGatherings } from './gtHooks';
import styles from './Gathering.module.css';

const CreateGathering = ({ show, onHide, onSuccess, initialLocation = null }) => {
  const { userLocation } = useKakaoMap();
  const { formCategories } = useGatheringCategories();
  const { createGathering, loading: apiLoading, error: apiError, clearError } = useGatherings();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'fitness',
    maxParticipants: 10,
    scheduleType: 'ONE_TIME',
    scheduleDetails: '',
    nextMeetingDate: '',
    meetingTime: '',
    dayOfWeek: '',
    location: {
      address: '',
      latitude: null,
      longitude: null
    }
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [isAddressSearching, setIsAddressSearching] = useState(false);

  // 다음 주소검색 API 로드
  useEffect(() => {
    const loadDaumAPI = () => {
      // 이미 로드되어 있는지 확인
      if (window.daum && window.daum.Postcode) {
        setIsApiLoaded(true);
        return;
      }

      // 스크립트가 이미 로드 중인지 확인
      if (document.querySelector('script[src*="postcode.v2.js"]')) {
        const checkLoaded = () => {
          if (window.daum && window.daum.Postcode) {
            setIsApiLoaded(true);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      // 동적으로 스크립트 로드
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.onload = () => {
        setIsApiLoaded(true);
      };
      script.onerror = () => {
        console.error('다음 주소검색 API 로드 실패');
        alert('주소 검색 서비스를 불러올 수 없습니다.');
      };
      
      document.head.appendChild(script);
    };

    loadDaumAPI();
  }, []);

  // 초기 위치 설정
  useEffect(() => {
    if (initialLocation) {
      setFormData(prev => ({
        ...prev,
        location: {
          address: initialLocation.address || '위치 정보 없음',
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude
        }
      }));
    }
  }, [initialLocation]);

  // 모달이 닫힐 때 초기화
  useEffect(() => {
    if (!show) {
      setFormData({
        title: '',
        description: '',
        category: 'fitness',
        maxParticipants: 10,
        scheduleType: 'ONE_TIME',
        scheduleDetails: '',
        nextMeetingDate: '',
        meetingTime: '',
        dayOfWeek: '',
        location: {
          address: '',
          latitude: null,
          longitude: null
        }
      });
      setError('');
      setLoading(false);
    }
  }, [show]);

  // 폼 데이터 변경 핸들러
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  // 주소 검색
  const handleAddressSearch = () => {
    if (!isApiLoaded) {
      alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsAddressSearching(true);
    
    new window.daum.Postcode({
      oncomplete: function(data) {
        setIsAddressSearching(false);
        
        // 주소 정보 설정
        let fullAddress = data.address;
        let extraAddress = '';
        
        if (data.addressType === 'R') {
          if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
            extraAddress += data.bname;
          }
          if (data.buildingName !== '' && data.apartment === 'Y') {
            extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
          }
          if (extraAddress !== '') {
            extraAddress = ' (' + extraAddress + ')';
          }
          fullAddress += extraAddress;
        }

        // 좌표 정보 가져오기 (다음 지도 API 사용)
        const geocoder = new window.kakao.maps.services.Geocoder();
        geocoder.addressSearch(data.address, function(result, status) {
          if (status === window.kakao.maps.services.Status.OK) {
            const coords = result[0];
            
            setFormData(prev => ({
              ...prev,
              location: {
                address: fullAddress,
                latitude: parseFloat(coords.y),
                longitude: parseFloat(coords.x)
              }
            }));
          } else {
            // 좌표를 가져올 수 없는 경우 주소만 설정
            setFormData(prev => ({
              ...prev,
              location: {
                address: fullAddress,
                latitude: null,
                longitude: null
              }
            }));
            alert('주소는 설정되었지만 정확한 좌표를 가져올 수 없습니다.');
          }
        });
      },
      onclose: function(state) {
        setIsAddressSearching(false);
        if (state === 'FORCE_CLOSE') {
          // 사용자가 검색을 취소한 경우
        }
      }
    }).open();
  };

  // 현재 위치 사용
  const useCurrentLocation = () => {
    if (userLocation) {
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          address: userLocation.address || '현재 위치'
        }
      }));
    } else {
      alert('현재 위치를 가져올 수 없습니다.');
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 유효성 검사
    if (!formData.title.trim()) {
      setError('모임 제목을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('모임 설명을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (!formData.location.latitude || !formData.location.longitude) {
      setError('모임 장소를 설정해주세요.');
      setLoading(false);
      return;
    }

    // 일정 유형별 유효성 검사
    if (formData.scheduleType === 'ONE_TIME') {
      if (!formData.nextMeetingDate || !formData.meetingTime) {
        setError('모임 날짜와 시간을 선택해주세요.');
        setLoading(false);
        return;
      }
    } else if (formData.scheduleType === 'WEEKLY') {
      if (!formData.dayOfWeek || !formData.meetingTime) {
        setError('요일과 시간을 선택해주세요.');
        setLoading(false);
        return;
      }
    } else if (formData.scheduleType === 'MONTHLY') {
      if (!formData.dayOfWeek || !formData.scheduleDetails || !formData.meetingTime) {
        setError('주차, 요일, 시간을 모두 선택해주세요.');
        setLoading(false);
        return;
      }
    } else if (formData.scheduleType === 'CUSTOM') {
      if (!formData.scheduleDetails.trim()) {
        setError('일정 상세 정보를 입력해주세요.');
        setLoading(false);
        return;
      }
    }

    try {
      await createGathering({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        maxParticipants: formData.maxParticipants,
        scheduleType: formData.scheduleType,
        scheduleDetails: formData.scheduleDetails,
        nextMeetingDate: formData.nextMeetingDate,
        meetingTime: formData.meetingTime,
        dayOfWeek: formData.dayOfWeek,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        address: formData.location.address
      });

      alert('모임이 성공적으로 생성되었습니다!');
      
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        maxParticipants: 10,
        location: {
          address: '',
          latitude: null,
          longitude: null
        }
      });
      
      onSuccess();
    } catch (err) {
      setError(err.message);
      console.error('모임 생성 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    // 폼 데이터 초기화
    setFormData({
      title: '',
      description: '',
      category: 'fitness',
      maxParticipants: 10,
      scheduleType: 'ONE_TIME',
      scheduleDetails: '',
      nextMeetingDate: '',
      meetingTime: '',
      dayOfWeek: '',
      location: {
        address: '',
        latitude: null,
        longitude: null
      }
    });
    setError('');
    setLoading(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>🏃‍♂️ New Wannabe List 만들기</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className={styles.errorAlert}>
              {error}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>모임 제목 *</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="예: 강남역 근처 헬스장 함께 가요!"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  maxLength={100}
                />
                <Form.Text className="text-muted">
                  {formData.title.length}/100자
                </Form.Text>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>카테고리 *</Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                >
                  {formCategories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>최대 참여자 수 *</Form.Label>
                <Form.Select
                  value={formData.maxParticipants}
                  onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value))}
                >
                  {[5, 10, 15, 20, 30, 50].map(num => (
                    <option key={num} value={num}>{num}명</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>모임 설명 *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="모임에 대한 자세한 설명을 입력해주세요. (시간, 운동 종류, 준비물 등)"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {formData.description.length}/500자
            </Form.Text>
          </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>일정 유형 *</Form.Label>
          <Form.Select
            value={formData.scheduleType}
            onChange={(e) => handleInputChange('scheduleType', e.target.value)}
          >
            <option value="ONE_TIME">일회성 모임</option>
            <option value="WEEKLY">주기적 모임 (매주)</option>
            <option value="MONTHLY">주기적 모임 (매월)</option>
            <option value="CUSTOM">사용자 정의</option>
          </Form.Select>
        </Form.Group>

        {/* 다음 모임 일시 (일회성 모임) */}
        {formData.scheduleType === 'ONE_TIME' && (
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>모임 날짜 *</Form.Label>
                <Form.Control
                  type="date"
                  value={formData.nextMeetingDate}
                  onChange={(e) => handleInputChange('nextMeetingDate', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>모임 시간 *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => handleInputChange('meetingTime', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* 주기적 모임 (매주) */}
        {formData.scheduleType === 'WEEKLY' && (
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>요일 선택 *</Form.Label>
                <Form.Select
                  value={formData.dayOfWeek}
                  onChange={(e) => handleInputChange('dayOfWeek', e.target.value)}
                >
                  <option value="">요일을 선택하세요</option>
                  <option value="MONDAY">월요일</option>
                  <option value="TUESDAY">화요일</option>
                  <option value="WEDNESDAY">수요일</option>
                  <option value="THURSDAY">목요일</option>
                  <option value="FRIDAY">금요일</option>
                  <option value="SATURDAY">토요일</option>
                  <option value="SUNDAY">일요일</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>시간 *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => handleInputChange('meetingTime', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* 주기적 모임 (매월) */}
        {formData.scheduleType === 'MONTHLY' && (
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>매월 몇 번째 주 *</Form.Label>
                <Form.Select
                  value={formData.dayOfWeek}
                  onChange={(e) => handleInputChange('dayOfWeek', e.target.value)}
                >
                  <option value="">주차를 선택하세요</option>
                  <option value="FIRST">첫째 주</option>
                  <option value="SECOND">둘째 주</option>
                  <option value="THIRD">셋째 주</option>
                  <option value="FOURTH">넷째 주</option>
                  <option value="LAST">마지막 주</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>요일 *</Form.Label>
                <Form.Select
                  value={formData.scheduleDetails}
                  onChange={(e) => handleInputChange('scheduleDetails', e.target.value)}
                >
                  <option value="">요일을 선택하세요</option>
                  <option value="SUNDAY">일요일</option>
                  <option value="MONDAY">월요일</option>
                  <option value="TUESDAY">화요일</option>
                  <option value="WEDNESDAY">수요일</option>
                  <option value="THURSDAY">목요일</option>
                  <option value="FRIDAY">금요일</option>
                  <option value="SATURDAY">토요일</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>시간 *</Form.Label>
                <Form.Control
                  type="time"
                  value={formData.meetingTime}
                  onChange={(e) => handleInputChange('meetingTime', e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        {/* 사용자 정의 */}
        {formData.scheduleType === 'CUSTOM' && (
          <Form.Group className="mb-3">
            <Form.Label>일정 상세 정보 *</Form.Label>
            <Form.Control
              type="text"
              placeholder="예: 매주 화요일, 목요일 오후 7시"
              value={formData.scheduleDetails}
              onChange={(e) => handleInputChange('scheduleDetails', e.target.value)}
            />
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Label>모임 장소 *</Form.Label>
            <div className={styles.locationSection}>
              <Form.Control
                type="text"
                placeholder="모임 장소를 입력하거나 주소를 검색하세요"
                value={formData.location.address}
                onChange={(e) => handleInputChange('location.address', e.target.value)}
                className={styles.locationInput}
              />
              <div className={styles.locationButtons}>
                <Button 
                  variant="outline-primary" 
                  onClick={handleAddressSearch}
                  disabled={!isApiLoaded || isAddressSearching}
                  className={styles.locationButton}
                >
                  {isAddressSearching ? '검색 중...' : '🔍 주소 검색'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  onClick={useCurrentLocation}
                  className={styles.locationButton}
                >
                  📍 현재 위치
                </Button>
              </div>
            </div>
            
            {formData.location.latitude && formData.location.longitude && (
              <div className={styles.locationInfo}>
                <small className="text-success">
                  ✅ 장소가 설정되었습니다: {formData.location.address}
                </small>
              </div>
            )}
          </Form.Group>

          <div className={styles.tips}>
            <h6>💡 모임 만들기 팁</h6>
            <ul>
              <li>구체적인 시간과 장소를 명시해주세요</li>
              <li>운동 종류와 난이도를 설명해주세요</li>
              <li>준비물이나 주의사항이 있다면 적어주세요</li>
              <li>친근하고 환영하는 분위기로 작성해주세요</li>
            </ul>
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            취소
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? '생성 중...' : '모임 만들기'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateGathering;
