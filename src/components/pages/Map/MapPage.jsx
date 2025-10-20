import { useState, useEffect, useRef, useCallback } from 'react';
import ButtonComponent from '../../common/ButtonComponent';
import AddressSearch from '../Payments/AddressSearch';
import { useKakaoMap } from './hooks/useKakaoMap';
import { usePlaceSearch } from './hooks/usePlaceSearch';
import { useMapMarkers } from './hooks/useMapMarkers';
import styles from './MapPage.module.css';

export default function MapPage() {
  // 공통 훅 사용
  const {
    mapInstance, 
    isLoaded, 
    userLocation, 
    loading: mapLoading, 
    error: mapError, 
    userAddress,
    locationSource,
    addressInfo,
    loadKakaoMapScript, 
    initMap, 
    getCurrentLocation,
    createCurrentPositionMarker,
    initializeLocation,
    setUserAddressLocation
  } = useKakaoMap();
  
  const { 
    searchResults, 
    searchLoading, 
    searchError, 
    searchByKeyword, 
    addDistanceToResults 
  } = usePlaceSearch(mapInstance);
  
  const { 
    markers, 
    addMarker, 
    clearMarkers, 
    showInfoWindow, 
    closeInfoWindow,
    createMarkerImage 
  } = useMapMarkers(mapInstance);


  // 로컬 상태
  const [facilities, setFacilities] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showLocationError, setShowLocationError] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [expandedFacility, setExpandedFacility] = useState(null);
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [addressData, setAddressData] = useState({
    zipCode: '',
    address: '',
    detailAddress: ''
  });
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

  // 카카오맵 초기화
  useEffect(() => {
    loadKakaoMapScript().then(() => {
      if (mapRef.current) {
        initMap(mapRef.current);
      }
    }).catch((error) => {
      console.error('카카오맵 로드 실패:', error);
    });
  }, [loadKakaoMapScript, initMap]);

  // 사용자 위치 초기화 (우선순위: 주소 → GPS → 강남역)
  useEffect(() => {
    if (isLoaded) {
      initializeLocation().catch((error) => {
        console.error('위치 초기화 실패:', error);
      });
    }
  }, [isLoaded, initializeLocation]);


  // 현재 위치 마커 표시
  useEffect(() => {
    if (mapInstance && userLocation) {
      const markerImage = createCurrentPositionMarker();
      if (markerImage) {
        addMarker(userLocation, {
          title: "현재 위치",
          image: markerImage
        });
      }
    }
  }, [mapInstance, userLocation, addMarker, createCurrentPositionMarker]);

  // 운동시설 검색
  const searchFacilities = useCallback(async (category) => {
    if (!userLocation || !mapInstance) {
      console.error('위치 정보나 지도가 없습니다.');
      return;
    }

    const selectedCategoryData = categories.find(cat => cat.id === category);
    const searchQuery = selectedCategoryData.keyword || '헬스장';
    

    try {
      searchByKeyword(searchQuery, { location: userLocation });
    } catch (error) {
      console.error('검색 실패:', error);
    }
  }, [userLocation, mapInstance, searchByKeyword, categories]);

  // 검색 결과 처리
  useEffect(() => {
    if (searchResults.length > 0) {
      const facilitiesWithDistance = addDistanceToResults(searchResults, userLocation);
      setFacilities(facilitiesWithDistance);
      
      // 기존 마커 제거
      clearMarkers();
      
      // 새로운 마커 추가
      facilitiesWithDistance.forEach((facility, index) => {
        const markerImage = createMarkerImage(
          'https://cdn-icons-png.flaticon.com/512/252/252025.png',
          { width: 32, height: 32 },
          { offset: { x: 16, y: 32 } }
        );
        
        addMarker(
          { lat: parseFloat(facility.y), lng: parseFloat(facility.x) },
          {
            title: facility.place_name,
            image: markerImage
          }
        );
      });
    }
  }, [searchResults, userLocation, addDistanceToResults, clearMarkers, addMarker, createMarkerImage]);

  // 카테고리 변경 핸들러
  const handleCategoryChange = useCallback((categoryId) => {
    setSelectedCategory(categoryId);
    searchFacilities(categoryId);
  }, [searchFacilities]);

  // 시설 상세 정보 토글
  const toggleFacilityDetails = useCallback((facilityId) => {
    setExpandedFacility(expandedFacility === facilityId ? null : facilityId);
  }, [expandedFacility]);

  // 모달 열기/닫기
  const toggleMapModal = useCallback(() => {
    setShowMapModal(!showMapModal);
  }, [showMapModal]);

  // 주소 선택 핸들러 (다음 우편번호 API)
  const handleAddressSelect = useCallback((selectedAddressData) => {
    setAddressData(selectedAddressData);
  }, []);

  // 주소 설정 완료 핸들러
  const handleAddressSubmit = useCallback(async () => {
    if (!addressData.address.trim()) {
      alert('주소를 선택해주세요.');
      return;
    }
    
    try {
      // 기본주소 + 상세주소 조합
      const fullAddress = `${addressData.address} ${addressData.detailAddress}`.trim();
      setUserAddressLocation(fullAddress);
      await initializeLocation();
      setShowAddressInput(false);
      setAddressData({ zipCode: '', address: '', detailAddress: '' });
    } catch (error) {
      console.error('주소 설정 실패:', error);
      alert('주소 설정에 실패했습니다.');
    }
  }, [addressData, setUserAddressLocation, initializeLocation]);

  // 강남역 위치로 설정
  const setGangnamLocation = useCallback(() => {
    if (mapInstance) {
      const gangnamLocation = { lat: 37.4979, lng: 127.0276 };
      const latlng = new window.kakao.maps.LatLng(gangnamLocation.lat, gangnamLocation.lng);
      mapInstance.setCenter(latlng);
      setShowLocationError(false);
    }
  }, [mapInstance]);

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 */}
      <div className={styles.mapHeader}>
        <h1 className={styles.mapTitle}>🏃‍♂️ 주변 운동 시설 찾기</h1>
        <p className={styles.mapSubtitle}>내 주변의 다양한 운동 시설을 찾아보세요</p>
        
        {userLocation && (
          <div className={styles.locationInfo}>
            <div className={styles.locationDetails}>
              {addressInfo && (
                <span className={styles.addressText}>
                  🏠 현재 위치 : {addressInfo.roadAddress || addressInfo.address || '주소 정보 없음'}
                </span>
              )}
            </div>
            <div className={styles.locationButtons}>
              <ButtonComponent 
                variant="outline" 
                onClick={initializeLocation}
                className={styles.refreshButton}
              >
                🔄 위치 새로고침
              </ButtonComponent>
              <ButtonComponent 
                variant="secondary" 
                onClick={() => setShowAddressInput(!showAddressInput)}
                className={styles.addressButton}
              >
                🏠 주소 설정
              </ButtonComponent>
            </div>
          </div>
        )}

        {/* 주소 입력 모달 */}
        {showAddressInput && (
          <div className={styles.addressInputModal}>
            <div className={styles.addressInputContent}>
              <h4>📍 주소 설정</h4>
              <p>우편번호 검색을 통해 정확한 주소를 설정하세요</p>
              
              <div className={styles.addressForm}>
                <div className={styles.addressRow}>
                  <input
                    type="text"
                    placeholder="우편번호"
                    value={addressData.zipCode}
                    readOnly
                    className={styles.zipCodeInput}
                  />
                  <AddressSearch 
                    onAddressSelect={handleAddressSelect}
                    buttonText="우편번호 검색"
                  />
                </div>
                
                <input
                  type="text"
                  placeholder="기본주소"
                  value={addressData.address}
                  readOnly
                  className={styles.addressInput}
                />
                
                <input
                  type="text"
                  placeholder="상세주소 (동/호수 등)"
                  value={addressData.detailAddress}
                  onChange={(e) => setAddressData({...addressData, detailAddress: e.target.value})}
                  className={styles.detailAddressInput}
                />
              </div>
              
              <div className={styles.addressInputButtons}>
                <ButtonComponent 
                  variant="primary" 
                  onClick={handleAddressSubmit}
                  disabled={!addressData.address.trim()}
                >
                  설정
                </ButtonComponent>
                <ButtonComponent 
                  variant="outline" 
                  onClick={() => {
                    setShowAddressInput(false);
                    setAddressData({ zipCode: '', address: '', detailAddress: '' });
                  }}
                >
                  취소
                </ButtonComponent>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 위치 오류 알림 */}
      {showLocationError && (
        <div className={styles.locationError}>
          <p>위치 정확도가 낮습니다. 수동으로 설정하시겠습니까?</p>
          <ButtonComponent onClick={setGangnamLocation} size="small">
            강남역으로 설정
          </ButtonComponent>
        </div>
      )}

      {/* 카테고리 선택 */}
      <div className={styles.categorySection}>
        <h3>운동 종류 선택</h3>
        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <ButtonComponent
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`${styles.categoryButton} ${
                selectedCategory === category.id ? styles.selected : ''
              }`}
              disabled={mapLoading || searchLoading}
            >
              {category.name}
            </ButtonComponent>
          ))}
        </div>
      </div>

      {/* 지도 */}
      <div className={styles.mapSection}>
        <div className={styles.mapContainer}>
          <div ref={mapRef} className={styles.map} />
          {mapLoading && <div className={styles.loadingOverlay}>지도 로딩 중...</div>}
          {mapError && <div className={styles.errorOverlay}>{mapError}</div>}
        </div>
      </div>

      {/* 검색 결과 */}
      {facilities.length > 0 && (
        <div className={styles.resultsSection}>
          <h3>검색 결과 ({facilities.length}개)</h3>
          <div className={styles.facilitiesList}>
            {facilities.map((facility, index) => (
              <div key={facility.id || index} className={styles.facilityItem}>
                <div className={styles.facilityHeader}>
                  <h4>{facility.place_name}</h4>
                  <span className={styles.distance}>
                    {facility.distance ? `${Math.round(facility.distance)}m` : ''}
                  </span>
                </div>
                
                <div className={styles.facilityInfo}>
                  <p><strong>카테고리:</strong> {facility.category_name}</p>
                  <p><strong>주소:</strong> {facility.address_name}</p>
                  {facility.phone && (
                    <p><strong>전화:</strong> {facility.phone}</p>
                  )}
                </div>

                <div className={styles.facilityActions}>
                  <ButtonComponent
                    onClick={() => toggleFacilityDetails(facility.id || index)}
                    size="small"
                  >
                    {expandedFacility === (facility.id || index) ? '접기' : '자세히'}
                  </ButtonComponent>
                  
                  {facility.place_url && (
                    <ButtonComponent
                      onClick={() => window.open(facility.place_url, '_blank')}
                      size="small"
                    >
                      지도에서 보기
                    </ButtonComponent>
                  )}
                </div>

                {expandedFacility === (facility.id || index) && (
                  <div className={styles.facilityDetails}>
                    <p><strong>도로명 주소:</strong> {facility.road_address_name}</p>
                    <p><strong>카테고리 그룹:</strong> {facility.category_group_name}</p>
                    <p><strong>좌표:</strong> {facility.y}, {facility.x}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 검색 상태 */}
      {searchLoading && (
        <div className={styles.loadingMessage}>
          <p>운동시설을 검색하고 있습니다...</p>
        </div>
      )}

      {searchError && (
        <div className={styles.errorMessage}>
          <p>{searchError}</p>
        </div>
      )}

      {/* 도움말 */}
      <div className={styles.helpSection}>
        <h3>사용법</h3>
        <ul>
          <li>원하는 운동 종류를 선택하면 주변 운동시설을 검색합니다.</li>
          <li>거리순으로 정렬되어 가장 가까운 시설부터 표시됩니다.</li>
          <li>지도에서 마커를 클릭하면 해당 시설의 위치를 확인할 수 있습니다.</li>
        </ul>
      </div>
    </div>
  );
}