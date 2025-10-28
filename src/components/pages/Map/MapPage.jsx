import { useState, useEffect, useRef, useCallback } from 'react';
import { Tab, Tabs, Row, Col } from 'react-bootstrap';
import ButtonComponent from '../../common/ButtonComponent';
import AddressSearch from '../Payments/AddressSearch';
import { useKakaoMap } from './hooks/useKakaoMap';
import { usePlaceSearch } from './hooks/usePlaceSearch';
import { useMapMarkers } from './hooks/useMapMarkers';
import CreateGathering from './gathering/CreateGathering';
import GatheringList from './gathering/GatheringList';
import GatheringDetail from './gathering/GatheringDetail';
import { useGatheringCategories, useGatherings } from './gathering/gtHooks';
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
    ensureReady,
    initMap,
    getCurrentLocation,
    createCurrentPositionMarker,
    getCoordinatesFromAddress,
    convertLocationToAddress,
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
  const [activeTab, setActiveTab] = useState('map');
  const { getCategoryIcon } = useGatheringCategories();
  const { gatherings, fetchGatherings, syncGatheringParticipants } = useGatherings();

  const [clickedLocation, setClickedLocation] = useState(null);
  const [showCreateFromMap, setShowCreateFromMap] = useState(false);
  const [isConvertingAddress, setIsConvertingAddress] = useState(false);
  const [gatheringMarkers, setGatheringMarkers] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGathering, setSelectedGathering] = useState(null);
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
    ensureReady().then(() => {
      if (mapRef.current) {
        initMap(mapRef.current);
      }
    }).catch((error) => {
      console.error('❌ 카카오맵 로드 실패:', error);
    });
  }, [ensureReady, initMap]);

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

      // 1. 사용자 주소 설정
      setUserAddressLocation(fullAddress);

      // 2. 주소를 좌표로 변환
      const addressLocation = await getCoordinatesFromAddress(fullAddress);

      // 3. 지도 중심점 업데이트
      if (mapInstance && addressLocation) {
        const latlng = new window.kakao.maps.LatLng(addressLocation.lat, addressLocation.lng);
        mapInstance.setCenter(latlng);
      }
      setShowAddressInput(false);
      setAddressData({ zipCode: '', address: '', detailAddress: '' });
    } catch (error) {
      console.error('주소 설정 실패:', error);
      alert('주소가 성공적으로 설정되었습니다!');
    }
  }, [addressData, setUserAddressLocation, mapInstance, getCoordinatesFromAddress, convertLocationToAddress]);

  // 강남역 위치로 설정
  const setGangnamLocation = useCallback(() => {
    if (mapInstance) {
      const gangnamLocation = { lat: 37.4979, lng: 127.0276 };
      const latlng = new window.kakao.maps.LatLng(gangnamLocation.lat, gangnamLocation.lng);
      mapInstance.setCenter(latlng);
      setShowLocationError(false);
    }
  }, [mapInstance]);

  // 지도 클릭 이벤트 핸들러
  const handleMapClick = useCallback(async (event) => {
    if (activeTab !== 'map') return; // 지도 탭에서만 작동

    const latlng = event.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    setIsConvertingAddress(true);

    try {
      // 좌표를 주소로 변환
      const address = await convertLocationToAddress({ lat, lng });
      
      // 주소 정보가 없을 때 좌표 기반 임시 주소 생성
      let finalAddress = address.address || address.roadAddress;
      
      if (!finalAddress) {
        // 좌표 기반 임시 주소 생성
        finalAddress = `위도: ${lat.toFixed(6)}, 경도: ${lng.toFixed(6)}`;
      }
      
      setClickedLocation({
        latitude: lat,
        longitude: lng,
        address: finalAddress
      });

      // 모임 생성 모달 표시
      setShowCreateFromMap(true);
    } catch (error) {
      // 주소 변환 실패 시에도 모달 표시
      setClickedLocation({
        latitude: lat,
        longitude: lng,
        address: '주소 정보 없음'
      });
      setShowCreateFromMap(true);
    } finally {
      setIsConvertingAddress(false);
    }
  }, [activeTab, convertLocationToAddress]);

  // 지도 클릭 이벤트 등록
  useEffect(() => {
    if (mapInstance && activeTab === 'map') {
      // 기존 클릭 이벤트 제거
      window.kakao.maps.event.removeListener(mapInstance, 'click', handleMapClick);
      // 새로운 클릭 이벤트 등록
      window.kakao.maps.event.addListener(mapInstance, 'click', handleMapClick);
    }

    return () => {
      if (mapInstance) {
        window.kakao.maps.event.removeListener(mapInstance, 'click', handleMapClick);
      }
    };
  }, [mapInstance, activeTab, handleMapClick]);


  // 모임 마커 생성
  const createGatheringMarkers = useCallback(() => {
    if (!mapInstance || gatherings.length === 0) return;

    // 기존 모임 마커 제거
    gatheringMarkers.forEach(marker => marker.setMap(null));
    const newMarkers = [];


    gatherings.forEach(gathering => {
      if (gathering.latitude && gathering.longitude) {
        // 모임 마커 이미지 생성
        const markerImage = createMarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          24,
          35
        );

        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(gathering.latitude, gathering.longitude),
          image: markerImage,
          title: gathering.title
        });

        // 마커를 지도에 표시
        marker.setMap(mapInstance);

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          // 마커 클릭 시 상세 모달 열기
          setSelectedGathering(gathering);
          setShowDetailModal(true);
        });

        newMarkers.push(marker);
      }
    });

    setGatheringMarkers(newMarkers);
  }, [mapInstance, gatherings, createMarkerImage]);

  // 모임 데이터 로드 및 마커 생성
  useEffect(() => {
    if (activeTab === 'map') {
      // 먼저 동기화를 실행한 후 모임 목록을 가져옴
      syncGatheringParticipants().then(() => {
        fetchGatherings();
      }).catch(() => {
        // 동기화 실패 시에도 모임 목록은 가져옴
        fetchGatherings();
      });
    }
  }, [activeTab, fetchGatherings, syncGatheringParticipants]);

  useEffect(() => {
    createGatheringMarkers();
  }, [createGatheringMarkers]);

  // 모임 생성 성공 시 마커 업데이트
  const handleGatheringCreated = useCallback(async () => {
    await fetchGatherings();
    // gatherings 상태가 업데이트되면 createGatheringMarkers가 자동으로 호출됨
  }, [fetchGatherings]);

  return (
    <div className={styles.pageContainer}>
      {/* 헤더 */}
      <div className={styles.mapHeader}>
        <h1 className={styles.mapTitle}>🏃‍♂️ Wannabe helthy</h1>
        <p className={styles.mapSubtitle}>건강한 삶의 여정을 시작해보세요</p>

        {/* 탭 네비게이션 */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className={styles.tabNavigation}
        >
          <Tab eventKey="map" title="🗺️ 운동 시설 찾기">
            <div className={styles.tabContent}>
              {/* 지도와 모임 리스트를 나누는 레이아웃 */}
              <Row className="g-4">
                {/* 왼쪽: 모임 리스트 */}
                <Col lg={6} md={12}>
                  <div className={styles.gatheringListSection}>
                    <h4 className={styles.sectionTitle}>📍 Wannabe List</h4>
                    <GatheringList />
                  </div>
                </Col>

                {/* 오른쪽: 지도 */}
                <Col lg={6} md={12}>
                  <div className={styles.mapSection}>
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
                              onChange={(e) => setAddressData({ ...addressData, detailAddress: e.target.value })}
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

                    {/* 위치 오류 알림 */}
                    {showLocationError && (
                      <div className={styles.locationError}>
                        <p>위치 정확도가 낮습니다. 수동으로 설정하시겠습니까?</p>
                        <ButtonComponent onClick={setGangnamLocation} size="small">
                          강남역으로 설정
                        </ButtonComponent>
                      </div>
                    )}
                    {/* 지도 */}
                    <div className={styles.mapSection}>
                      <div className={styles.mapContainer}>
                        <div ref={mapRef} className={styles.map} />
                        {mapLoading && <div className={styles.loadingOverlay}>지도 로딩 중...</div>}
                        {mapError && <div className={styles.errorOverlay}>{mapError}</div>}

                        {/* 지도 클릭 안내 */}
                        <div className={styles.mapClickGuide}>
                          <div className={styles.clickGuideContent}>
                            {isConvertingAddress ? (
                              <>
                                <span className={styles.clickIcon}>⏳</span>
                                <span className={styles.clickText}>주소를 확인하는 중...</span>
                              </>
                            ) : (
                              <>
                                <span className={styles.clickIcon}>👆</span>
                                <span className={styles.clickText}>지도를 클릭하여 모임을 생성하세요!</span>
                              </>
                            )}
                          </div>
                        </div>
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
                  </div>
                </Col>
              </Row>
            </div>
          </Tab>
        </Tabs>
      </div>

      {/* 지도 클릭 시 모임 생성 모달 */}
      <CreateGathering
        show={showCreateFromMap}
        onHide={() => {
          setShowCreateFromMap(false);
          setClickedLocation(null);
        }}
        onSuccess={() => {
          setShowCreateFromMap(false);
          setClickedLocation(null);
          // 모임 데이터 새로고침 및 마커 업데이트
          handleGatheringCreated();
          // 모임 목록 새로고침 (탭이 모임 탭이면)
          if (activeTab === 'gathering') {
            // GatheringList 컴포넌트에서 새로고침하도록 이벤트 발생
            window.dispatchEvent(new CustomEvent('gatheringCreated'));
          }
        }}
        initialLocation={clickedLocation}
      />

      {/* 모임 상세 모달 */}
      <GatheringDetail
        show={showDetailModal}
        onHide={() => {
          setShowDetailModal(false);
          setSelectedGathering(null);
        }}
        gathering={selectedGathering}
        onJoin={() => {
          setShowDetailModal(false);
          setSelectedGathering(null);
          // 모임 데이터 새로고침
          handleGatheringCreated();
        }}
      />
    </div>
  );
}