import { useState, useCallback } from 'react';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
          setLocation(locationData);
          setLoading(false);
          resolve(locationData);
        },
        (error) => {
          setLoading(false);
          let errorMessage = '위치 정보를 가져올 수 없습니다.';
          
          switch(error.code) {
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

  // 주소로 좌표 변환 (카카오 API 사용)
  const getCoordinatesFromAddress = useCallback(async (address) => {
    if (!window.kakao?.maps?.services) {
      throw new Error('카카오 API가 로드되지 않았습니다.');
    }

    setLoading(true);
    setError('');

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.addressSearch(address, (result, status) => {
          setLoading(false);
          
          if (status === window.kakao.maps.services.Status.OK) {
            const locationData = {
              lat: parseFloat(result[0].y),
              lng: parseFloat(result[0].x),
              address: result[0].address_name,
              roadAddress: result[0].road_address_name
            };
            setLocation(locationData);
            resolve(locationData);
          } else {
            const errorMessage = '주소를 찾을 수 없습니다.';
            setError(errorMessage);
            reject(new Error(errorMessage));
          }
        });
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  // 좌표로 주소 변환 (카카오 API 사용)
  const getAddressFromCoordinates = useCallback(async (lat, lng) => {
    if (!window.kakao?.maps?.services) {
      throw new Error('카카오 API가 로드되지 않았습니다.');
    }

    setLoading(true);
    setError('');

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.coord2Address(lng, lat, (result, status) => {
          setLoading(false);
          
          if (status === window.kakao.maps.services.Status.OK) {
            const addressData = {
              address: result[0].address.address_name,
              roadAddress: result[0].road_address.address_name,
              region1Depth: result[0].address.region_1depth_name,
              region2Depth: result[0].address.region_2depth_name,
              region3Depth: result[0].address.region_3depth_name
            };
            resolve(addressData);
          } else {
            const errorMessage = '주소를 찾을 수 없습니다.';
            setError(errorMessage);
            reject(new Error(errorMessage));
          }
        });
      });
    } catch (err) {
      setLoading(false);
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    getCoordinatesFromAddress,
    getAddressFromCoordinates
  };
};
