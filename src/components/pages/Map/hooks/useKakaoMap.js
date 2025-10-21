import { useState, useCallback } from 'react';

export const useKakaoMap = () => {
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userAddress, setUserAddress] = useState(null); // 사용자 설정 주소
  const [locationSource, setLocationSource] = useState(null); // 위치 소스 (gps, address, default)
  const [addressInfo, setAddressInfo] = useState(null); // 좌표에서 변환된 주소 정보

  // 카카오맵 스크립트 로드
  const loadKakaoMapScript = useCallback(() => {
    return new Promise((resolve, reject) => {
      const scriptExists = document.querySelector('script[src*="dapi.kakao.com"]');


      if (!scriptExists) {
        const script = document.createElement('script');
        // 임시로 하드코딩된 API 키 사용 (테스트용)
        const apiKey = import.meta.env.VITE_KAKAO_JS_KEY || '90a6d8b34f968dff4707881c54949f46';
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
          if (window.kakao?.maps) {
            window.kakao.maps.load(() => {
              setIsLoaded(true);
              resolve();
            });
          } else {
            setTimeout(() => {
              if (window.kakao?.maps) {
                window.kakao.maps.load(() => {
                  setIsLoaded(true);
                  resolve();
                });
              } else {
                reject(new Error('카카오맵 API를 사용할 수 없습니다.'));
              }
            }, 100);
          }
        };
        script.onerror = (error) => {
          console.error('❌ 카카오맵 스크립트 로드 실패:', error);
          reject(new Error('카카오맵 스크립트 로드 실패'));
        };
      } else if (window.kakao?.maps) {
        window.kakao.maps.load(() => {
          setIsLoaded(true);
          resolve();
        });
      } else {
        // 기존 스크립트 제거 후 새로 로드
        const existingScript = document.querySelector('script[src*="dapi.kakao.com"]');
        if (existingScript) {
          existingScript.remove();
        }
        // 재귀 호출로 새로 로드
        loadKakaoMapScript().then(resolve).catch(reject);
      }
    });
  }, []);

  // 지도 초기화
  const initMap = useCallback((container, options = {}) => {
    if (!window.kakao?.maps) {
      console.error('카카오맵 API가 로드되지 않았습니다.');
      return null;
    }
    
    // 사용자 위치가 있으면 그 위치를 중심으로, 없으면 강남역을 기본으로
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
  }, [userLocation]);

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
  const getCoordinatesFromAddress = useCallback((address) => {
    return new Promise((resolve, reject) => {
      if (!window.kakao?.maps?.services) {
        reject(new Error('카카오맵 서비스가 로드되지 않았습니다.'));
        return;
      }

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
          console.error('❌ 주소 변환 실패:', status);
          reject(new Error('주소를 찾을 수 없습니다.'));
        }
      });
    });
  }, []);

  // 좌표를 주소로 변환하는 함수 (역지오코딩)
  const getAddressFromCoordinates = useCallback((lat, lng) => {
    return new Promise((resolve, reject) => {
      if (!window.kakao?.maps?.services) {
        reject(new Error('카카오맵 서비스가 로드되지 않았습니다.'));
        return;
      }

      const geocoder = new window.kakao.maps.services.Geocoder();
      const coord = new window.kakao.maps.LatLng(lat, lng);
      
      geocoder.coord2Address(coord.getLng(), coord.getLat(), (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const addressInfo = {
            address: result[0].address?.address_name || '',
            roadAddress: result[0].road_address?.address_name || '',
            region1Depth: result[0].address?.region_1depth_name || '',
            region2Depth: result[0].address?.region_2depth_name || '',
            region3Depth: result[0].address?.region_3depth_name || ''
          };
          resolve(addressInfo);
        } else {
          console.error('❌ 좌표 → 주소 변환 실패:', status);
          reject(new Error('주소를 찾을 수 없습니다.'));
        }
      });
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
    loadKakaoMapScript,
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