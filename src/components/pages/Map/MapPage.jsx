import { useState, useEffect, useRef, useCallback } from 'react';
import ButtonComponent from '../../common/ButtonComponent';
import styles from './MapPage.module.css';

export default function MapPage() {
  const [userLocation, setUserLocation] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [showLocationError, setShowLocationError] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [expandedFacility, setExpandedFacility] = useState(null);
  const mapRef = useRef(null);
  const modalMapRef = useRef(null);

  // 운동 시설 카테고리 정의
  const categories = [
    { id: 'all', name: '전체', keyword: '운동시설' },
    { id: 'gym', name: '헬스장', keyword: '헬스장' },
    { id: 'soccer', name: '풋살장', keyword: '풋살장' },
    { id: 'tennis', name: '테니스장', keyword: '테니스장' },
    { id: 'swimming', name: '수영장', keyword: '수영장' },
    { id: 'badminton', name: '배드민턴장', keyword: '배드민턴장' },
    { id: 'table_tennis', name: '탁구장', keyword: '탁구장' },
    { id: 'basketball', name: '농구장', keyword: '농구장' },
    { id: 'volleyball', name: '배구장', keyword: '배구장' },
    { id: 'golf', name: '골프장', keyword: '골프장' }
  ];

  // 카카오 API 로드 확인 제거 - 필요할 때만 확인

  // 사용자 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // 지도 초기화 (한 번만)
  useEffect(() => {
    if (userLocation && window.kakao && window.kakao.maps && mapRef.current) {
      console.log('지도 초기화 시작');
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [userLocation?.lat, userLocation?.lng]); // 좌표가 실제로 변경될 때만

  // 자동 검색 완전 제거

  // 모달 지도 초기화
  useEffect(() => {
    if (showMapModal && userLocation && window.kakao && window.kakao.maps && window.kakao.maps.services && modalMapRef.current) {
      setTimeout(() => {
        initializeModalMap();
      }, 100);
    }
  }, [showMapModal]); // userLocation 의존성 제거

  // 지도 초기화 함수
  const initializeMap = () => {
    console.log('지도 초기화 시작:', { mapRef: mapRef.current, kakao: !!window.kakao, userLocation });
    
    if (!mapRef.current || !window.kakao) {
      console.log('지도 초기화 실패: mapRef 또는 kakao 없음');
      return;
    }

    try {
      const mapOption = {
        center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
        level: 3
      };

      console.log('지도 옵션:', mapOption);

      const mapInstance = new window.kakao.maps.Map(mapRef.current, mapOption);
      setMap(mapInstance);
      console.log('지도 인스턴스 생성 완료');

      // 현재 위치 마커
      const currentPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      const marker = new window.kakao.maps.Marker({
        position: currentPosition,
        map: mapInstance,
        title: '현재 위치'
      });

      // 현재 위치에 인포윈도우 표시
      const infowindow = new window.kakao.maps.InfoWindow({
        content: '<div style="padding:5px;">현재 위치</div>'
      });
      infowindow.open(mapInstance, marker);
      
      console.log('지도 초기화 완료');
    } catch (error) {
      console.error('지도 초기화 오류:', error);
    }
  };

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setLoading(true);
    
    // 위치 옵션 설정 (정확도 높이기)
    const options = {
      enableHighAccuracy: true,  // 높은 정확도 사용
      timeout: 10000,           // 10초 타임아웃
      maximumAge: 0             // 캐시된 위치 사용 안함
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        console.log('위치 정보:', { latitude, longitude, accuracy });
        
        // 위치 정확도 체크 (100m 이내면 정확한 것으로 간주)
        if (accuracy > 100) {
          console.log('위치 정확도가 낮습니다. 수동 설정을 권장합니다.');
          setShowLocationError(true);
        }
        
        setUserLocation({ lat: latitude, lng: longitude });
        setError('');
        setLoading(false);
      },
      (error) => {
        console.error('위치 정보를 가져올 수 없습니다:', error);
        
        // 위치 권한이 거부된 경우 강남역 좌표로 기본 설정
        if (error.code === error.PERMISSION_DENIED) {
          console.log('위치 권한 거부됨. 강남역 좌표로 설정');
          setUserLocation({ lat: 37.4979, lng: 127.0276 }); // 강남역 좌표
          setError('위치 권한이 거부되어 강남역을 기준으로 표시합니다.');
        } else {
          setError('위치 정보에 접근할 수 없습니다. 위치 권한을 허용해주세요.');
        }
        setLoading(false);
      },
      options
    );
  }, []); // 의존성 배열 추가

  // 수동으로 강남역 위치 설정
  const setGangnamLocation = useCallback(() => {
    setUserLocation({ lat: 37.4979, lng: 127.0276 });
    setShowLocationError(false);
    setError('');
    console.log('강남역 위치로 설정됨');
  }, []);

  // 카카오 장소 검색을 사용하여 운동 시설 검색
  const searchFacilities = useCallback(async (category) => {
    if (!userLocation) {
      setError('위치 정보가 없습니다.');
      return;
    }

    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      setError('카카오 API가 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const selectedCategoryData = categories.find(cat => cat.id === category);
      const searchQuery = selectedCategoryData.keyword || '헬스장';
      
      console.log('검색 시작:', { category, searchQuery, userLocation });

      // 카카오 장소 검색 API 사용
      const places = new window.kakao.maps.services.Places();
      const center = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
      
      // 반경 1km 내에서 검색
      const radius = 1000;
      
      places.keywordSearch(searchQuery, (data, status) => {
        console.log('검색 콜백 실행:', { data, status, searchQuery });
        
        if (status === window.kakao.maps.services.Status.OK) {
          console.log('검색 성공! 결과 개수:', data.length);
          console.log('검색 결과:', data);
          
          if (data.length === 0) {
            console.log('검색 결과가 없습니다. 다른 키워드로 시도해보세요.');
            setError('검색 결과가 없습니다. 다른 카테고리를 시도해보세요.');
            setFacilities([]);
            clearMarkers();
          } else {
            // 거리순으로 정렬
            const facilitiesWithDistance = data.map(place => {
              const distance = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                place.y, 
                place.x
              );
              return {
                ...place,
                distance: distance,
                gps_coordinates: {
                  latitude: parseFloat(place.y),
                  longitude: parseFloat(place.x)
                }
              };
            }).sort((a, b) => a.distance - b.distance);

            console.log('처리된 시설 데이터:', facilitiesWithDistance);
            setFacilities(facilitiesWithDistance);
            addMarkersToMap(facilitiesWithDistance);
          }
        } else {
          console.error('장소 검색 실패:', status);
          console.error('상태 코드:', status);
          setError(`검색 중 오류가 발생했습니다. (상태: ${status})`);
          setFacilities([]);
          clearMarkers();
        }
        setLoading(false);
      }, {
        location: center,
        radius: radius,
        sort: window.kakao.maps.services.SortBy.DISTANCE
      });

    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      setLoading(false);
    }
  }, [userLocation]); // 의존성 배열 추가

  // 카테고리 변경 시 검색
  const handleCategoryChange = (categoryId) => {
    console.log('카테고리 변경:', categoryId);
    setSelectedCategory(categoryId);
    
    // API가 로드되었을 때만 검색 실행
    if (window.kakao && window.kakao.maps && window.kakao.maps.services && userLocation) {
      searchFacilities(categoryId);
    } else {
      setError('카카오 API가 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
    }
  };

  // 테스트용 간단한 검색 함수
  const testSearch = () => {
    console.log('테스트 검색 시작');
    
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) {
      setError('카카오 API가 아직 로드 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    if (!userLocation) {
      setError('위치 정보가 없습니다.');
      return;
    }
    
    // 헬스장 검색 실행
    searchFacilities('gym');
  };

  // 아코디언 토글 함수
  const toggleFacility = (facilityId) => {
    setExpandedFacility(expandedFacility === facilityId ? null : facilityId);
  };

  // 지도 모달 열기/닫기
  const openMapModal = () => {
    setShowMapModal(true);
  };

  const closeMapModal = () => {
    setShowMapModal(false);
  };

  // 모달 지도 초기화
  const initializeModalMap = () => {
    if (!modalMapRef.current || !window.kakao || !window.kakao.maps || !userLocation) return;

    const mapOption = {
      center: new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng),
      level: 3
    };

    const modalMapInstance = new window.kakao.maps.Map(modalMapRef.current, mapOption);
    
    // 현재 위치 마커
    const currentPosition = new window.kakao.maps.LatLng(userLocation.lat, userLocation.lng);
    const marker = new window.kakao.maps.Marker({
      position: currentPosition,
      map: modalMapInstance,
      title: '현재 위치'
    });

    // 시설 마커들 추가
    if (facilities.length > 0) {
      addMarkersToMap(facilities, modalMapInstance);
    }
  };

  // 마커 추가 함수
  const addMarkersToMap = (facilities, targetMap = null) => {
    const mapInstance = targetMap || map;
    if (!mapInstance || !window.kakao) return;

    // 기존 마커 제거
    clearMarkers();

    const newMarkers = facilities.map((facility, index) => {
      if (!facility.gps_coordinates) return null;

      const position = new window.kakao.maps.LatLng(
        facility.gps_coordinates.latitude,
        facility.gps_coordinates.longitude
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: mapInstance,
        title: facility.place_name || facility.title
      });

      // 마커 클릭 시 정보창 표시
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 300px;">
            <h3 style="margin: 0 0 10px 0; color: #2c3e50;">${facility.place_name || facility.title}</h3>
            ${facility.road_address_name ? `<p style="margin: 5px 0; color: #7f8c8d;">📍 ${facility.road_address_name}</p>` : ''}
            ${facility.phone ? `<p style="margin: 5px 0; color: #27ae60;">📞 ${facility.phone}</p>` : ''}
            ${facility.distance ? `<p style="margin: 5px 0; color: #e74c3c;">🚶‍♂️ ${facility.distance.toFixed(1)}km</p>` : ''}
            ${facility.category_name ? `<p style="margin: 5px 0; color: #3498db;">🏷️ ${facility.category_name}</p>` : ''}
          </div>
        `
      });

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infoWindow.open(mapInstance, marker);
      });

      return marker;
    }).filter(marker => marker !== null);

    setMarkers(newMarkers);
  };

  // 마커 제거 함수
  const clearMarkers = () => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  };

  // 거리 계산 함수 (Haversine formula)
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

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 */}
      <div className={styles.mapHeader}>
        <h1 className={styles.mapTitle}>🏃‍♂️ 주변 운동 시설 찾기</h1>
        <p className={styles.mapSubtitle}>내 주변의 다양한 운동 시설을 찾아보세요</p>
        
        {userLocation && (
          <div className={styles.locationInfo}>
            <span className={styles.locationText}>
              📍 현재 위치: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
            </span>
            <ButtonComponent 
              variant="outline" 
              onClick={getCurrentLocation}
              className={styles.refreshButton}
            >
              🔄 위치 새로고침
            </ButtonComponent>
            <ButtonComponent 
              variant="secondary" 
              onClick={testSearch}
              className={styles.testButton}
            >
              🧪 테스트 검색
            </ButtonComponent>
          </div>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className={styles.categoryFilter}>
        <div className={styles.categoryButtons}>
          {categories.map(category => (
            <ButtonComponent
              key={category.id}
              variant={selectedCategory === category.id ? 'primary' : 'outline'}
              onClick={() => handleCategoryChange(category.id)}
              className={styles.categoryButton}
            >
              {category.name}
            </ButtonComponent>
          ))}
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>운동 시설을 검색하는 중...</p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>{error}</p>
          <ButtonComponent 
            variant="primary" 
            onClick={getCurrentLocation}
          >
            위치 권한 허용
          </ButtonComponent>
        </div>
      )}

      {/* 위치 정확도 경고 */}
      {showLocationError && (
        <div className={styles.errorContainer} style={{ backgroundColor: '#fff3cd', borderColor: '#ffeaa7' }}>
          <p className={styles.errorText} style={{ color: '#856404' }}>
            ⚠️ 현재 위치가 부정확할 수 있습니다. 강남역 기준으로 검색하시겠습니까?
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <ButtonComponent 
              variant="primary" 
              onClick={setGangnamLocation}
            >
              강남역으로 설정
            </ButtonComponent>
            <ButtonComponent 
              variant="outline" 
              onClick={() => setShowLocationError(false)}
            >
              현재 위치 유지
            </ButtonComponent>
          </div>
        </div>
      )}

      {/* 메인 콘텐츠 영역 */}
      <div className={styles.mainContent}>
        {/* 왼쪽: 시설 목록 (아코디언) */}
        <div className={styles.facilitiesList}>
          <div className={styles.facilitiesHeader}>
            <h3 className={styles.facilitiesTitle}>
              {categories.find(cat => cat.id === selectedCategory)?.name} 검색 결과 ({facilities.length}개)
            </h3>
            <ButtonComponent 
              variant="primary" 
              onClick={openMapModal}
              className={styles.expandMapButton}
            >
              🗺️ 지도 확대보기
            </ButtonComponent>
          </div>
          
          {facilities.length > 0 ? (
            <div className={styles.accordionContainer}>
              {facilities.map((facility, index) => {
                const isExpanded = expandedFacility === index;
                const distance = facility.distance || 0;

                return (
                  <div key={index} className={styles.accordionItem}>
                    <div 
                      className={styles.accordionHeader}
                      onClick={() => toggleFacility(index)}
                    >
                      <div className={styles.facilityTitle}>
                        <h4 className={styles.facilityName}>{facility.place_name || facility.title}</h4>
                        {facility.distance && (
                          <span className={styles.distance}>
                            🚶‍♂️ {facility.distance.toFixed(1)}km
                          </span>
                        )}
                      </div>
                      <span className={styles.accordionIcon}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    {isExpanded && (
                      <div className={styles.accordionContent}>
                        <div className={styles.facilityDetails}>
                          {facility.road_address_name && (
                            <p className={styles.address}>📍 {facility.road_address_name}</p>
                          )}
                          
                          {facility.phone && (
                            <p className={styles.phone}>📞 {facility.phone}</p>
                          )}
                          
                          {facility.category_name && (
                            <p className={styles.category}>🏷️ {facility.category_name}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.noResults}>
              <p>검색 결과가 없습니다.</p>
            </div>
          )}
        </div>

        {/* 오른쪽: 지도 */}
        <div className={styles.mapSection}>
          <div className={styles.mapContainer}>
            <div ref={mapRef} className={styles.map}></div>
          </div>
        </div>
      </div>

      {/* 검색 안내 */}
      {!loading && !error && facilities.length === 0 && userLocation && (
        <div className={styles.emptyState}>
          <h3>🔍 운동 시설을 검색해보세요</h3>
          <p>위의 카테고리 버튼을 클릭하여 주변 운동 시설을 찾아보세요!</p>
          <p style={{ color: '#6c757d', fontSize: '0.9rem', marginTop: '10px' }}>
            💡 헬스장, 수영장, 테니스장 등 원하는 카테고리를 선택해주세요
          </p>
        </div>
      )}

      {/* 지도 모달 */}
      {showMapModal && (
        <div className={styles.mapModal}>
          <div className={styles.mapModalContent}>
            <div className={styles.mapModalHeader}>
              <h3>🗺️ 지도 확대보기</h3>
              <ButtonComponent 
                variant="outline" 
                onClick={closeMapModal}
                className={styles.closeButton}
              >
                ✕ 닫기
              </ButtonComponent>
            </div>
            <div className={styles.mapModalBody}>
              <div ref={modalMapRef} className={styles.modalMap}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
