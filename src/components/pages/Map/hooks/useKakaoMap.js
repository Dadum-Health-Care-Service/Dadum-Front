import { useState, useCallback } from 'react';

// 단순한 준비 가드 (index.html에서 이미 로드됨)
function ensureReady() {
  return new Promise((resolve, reject) => {
    if (!window.kakao?.maps?.load) {
      reject(new Error('SDK 미로드'));
      return;
    }
    
    window.kakao.maps.load(() => {
      if (!window.kakao?.maps?.services?.Geocoder) {
        reject(new Error('services 미포함'));
        return;
      }
      resolve();
    });
  });
}

export const useKakaoMap = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState(null); // 사용자 설정 주소
  const [locationSource, setLocationSource] = useState(null); // 위치 소스 (gps, address, default)
  const [addressInfo, setAddressInfo] = useState(null); // 좌표에서 변환된 주소 정보

  // 공통 준비 가드
  const ensureReadyCallback = useCallback(async () => {
    await ensureReady();
    setIsLoaded(true);
  }, []);

  // 지도 초기화
  const initMap = useCallback(async (container, options = {}) => {
    await ensureReady();
    const centerLat = userLocation?.lat || 37.4979; // 강남역
    const centerLng = userLocation?.lng || 127.0276; // 강남역
    
    const defaultOptions = {
      center: new window.kakao.maps.LatLng(centerLat, centerLng),
      level: 5,
      ...options
    };
    
    const map = new window.kakao.maps.Map(container, defaultOptions);
    setMapInstance(map);
    return map;
  }, [ensureReady, userLocation]);

  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = new Error('이 브라우저는 위치 서비스를 지원하지 않습니다.');
        setError(error.message);
        reject(error);
        return;
      }

      setLoading(true);
      setError('');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setUserLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (error) => {
          setLoading(false);
          let errorMessage = '위치 정보를 가져올 수 없습니다.';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = '위치 권한이 거부되었습니다.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = '위치 정보를 사용할 수 없습니다.';
              break;
            case error.TIMEOUT:
              errorMessage = '위치 요청이 시간 초과되었습니다.';
              break;
          }

          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }, []);

  // 주소를 좌표로 변환하는 함수
  const getCoordinatesFromAddress = useCallback(async (address) => {
    await ensureReady();
    return new Promise((resolve, reject) => {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      geocoder.addressSearch(address, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const coords = {
            lat: parseFloat(result[0].y),
            lng: parseFloat(result[0].x),
            address: result[0].address_name,
            roadAddress: result[0].road_address_name
          };
          resolve(coords);
        } else {
          reject(new Error('주소를 찾을 수 없습니다.'));
        }
      });
    });
  }, []);

  // 좌표를 주소로 변환하는 함수 (역지오코딩)
  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    await ensureReady();
    return new Promise((resolve, reject) => {
      try {
        console.log('🔧 Geocoder 생성 시도:', {
          services: !!window.kakao?.maps?.services,
          Geocoder: !!window.kakao?.maps?.services?.Geocoder
        });
        
        const geocoder = new window.kakao.maps.services.Geocoder();
        const coord = new window.kakao.maps.LatLng(lat, lng);
        
        console.log('📍 좌표 변환 시도:', { lat, lng });
        
        geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
          console.log('🔍 Geocoder 결과:', { result, status });
          
          if (status === window.kakao.maps.services.Status.OK && result && result.length > 0) {
            const firstResult = result[0];
            console.log('✅ 첫 번째 결과:', firstResult);
            
            const addressInfo = {
              address: firstResult.address?.address_name || '',
              roadAddress: firstResult.road_address?.address_name || '',
              region1Depth: firstResult.address?.region_1depth_name || '',
              region2Depth: firstResult.address?.region_2depth_name || '',
              region3Depth: firstResult.address?.region_3depth_name || ''
            };
            console.log('🏠 최종 주소 정보:', addressInfo);
            resolve(addressInfo);
          } else {
            console.log('❌ 주소 변환 실패:', { status, result });
            reject(new Error(`주소를 찾을 수 없습니다. 상태: ${status}`));
          }
        });
      } catch (error) {
        console.log('💥 Geocoder 에러:', error);
        reject(error);
      }
    });
  }, []);


  // 현재 위치 마커 이미지 생성
  const createCurrentPositionMarker = useCallback(() => {
    if (!window.kakao?.maps) return null;

    return new window.kakao.maps.MarkerImage(
      'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%2212%22%20fill%3D%22rgba(66%2C133%2C244%2C0.3)%22%20/%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%228%22%20fill%3D%22white%22%20/%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%225%22%20fill%3D%22%234285F4%22%20/%3E%3C/svg%3E',
      new window.kakao.maps.Size(40, 40),
      { offset: new window.kakao.maps.Point(20, 20) }
    );
  }, []);

  // 좌표를 주소로 변환하는 헬퍼 함수
  const convertLocationToAddress = useCallback(async (location) => {
    try {
      const address = await getAddressFromCoordinates(location.lat, location.lng);
      setAddressInfo(address);
      return { ...location, ...address };
    } catch (error) {
      setAddressInfo(null);
      return location;
    }
  }, [getAddressFromCoordinates]);

  // 위치 우선순위 로직: 사용자 주소 → GPS → 강남역
  const initializeLocation = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      await ensureReady(); // ★ 반드시 먼저
      // 1순위: 사용자 설정 주소 사용
      if (userAddress) {
        try {
          const addressLocation = await getCoordinatesFromAddress(userAddress);
          const addressLocationWithAddress = await convertLocationToAddress(addressLocation);
          setUserLocation(addressLocationWithAddress);
          setLocationSource('address');
          return addressLocationWithAddress;
        } catch (addressError) {
        }
      }
      
      // 2순위: GPS 위치 가져오기
      try {
        const gpsLocation = await getCurrentLocation();
        const gpsLocationWithAddress = await convertLocationToAddress(gpsLocation);
        setUserLocation(gpsLocationWithAddress);
        setLocationSource('gps');
        return gpsLocationWithAddress;
      } catch (gpsError) {
      }
      
      // 3순위: 강남역 기본 위치
      const defaultLocation = {
        lat: 37.4979,
        lng: 127.0276,
        address: '서울특별시 강남구 강남대로 396',
        roadAddress: '서울특별시 강남구 강남대로 396',
        accuracy: 0
      };
      const defaultLocationWithAddress = await convertLocationToAddress(defaultLocation);
      setUserLocation(defaultLocationWithAddress);
      setLocationSource('default');
      return defaultLocationWithAddress;
    } finally {
      setLoading(false);
    }
  }, [getCurrentLocation, userAddress, getCoordinatesFromAddress, convertLocationToAddress]);

  // 사용자 주소 설정 함수
  const setUserAddressLocation = useCallback((address) => {
    setUserAddress(address);
  }, []);

  return {
    mapInstance,
    isLoaded,
    userLocation,
    loading,
    error,
    userAddress,
    locationSource,
    addressInfo,
    ensureReady: ensureReadyCallback,
    initMap,
    getCurrentLocation,
    createCurrentPositionMarker,
    getCoordinatesFromAddress,
    getAddressFromCoordinates,
    convertLocationToAddress,
    initializeLocation,
    setUserAddressLocation
  };
};