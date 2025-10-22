import { useState, useCallback } from 'react';

export const usePlaceSearch = (mapInstance) => {
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 키워드 검색
  const searchByKeyword = useCallback((keyword, options = {}) => {
    if (!mapInstance || !window.kakao?.maps?.services) {
      setSearchError('지도가 초기화되지 않았습니다.');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    const places = new window.kakao.maps.services.Places();
    const searchOptions = {
      radius: 1000,
      ...options
    };

    places.keywordSearch(keyword, (data, status) => {
      setSearchLoading(false);
      
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else {
        setSearchError('검색 결과가 없습니다.');
        setSearchResults([]);
      }
    }, searchOptions);
  }, [mapInstance]);

  // 카테고리 검색
  const searchByCategory = useCallback((categoryCode, location, radius = 50) => {
    if (!mapInstance || !window.kakao?.maps?.services) {
      setSearchError('지도가 초기화되지 않았습니다.');
      return;
    }

    setSearchLoading(true);
    setSearchError('');

    const places = new window.kakao.maps.services.Places();
    const latlng = new window.kakao.maps.LatLng(location.lat, location.lng);

    places.categorySearch(categoryCode, (data, status) => {
      setSearchLoading(false);
      
      if (status === window.kakao.maps.services.Status.OK) {
        setSearchResults(data);
      } else {
        setSearchError('검색 결과가 없습니다.');
        setSearchResults([]);
      }
    }, { location: latlng, radius });
  }, [mapInstance]);

  // 가장 가까운 장소 찾기
  const findNearestPlace = useCallback(async (categoryCodes, location) => {
    if (!mapInstance || !window.kakao?.maps?.services) {
      console.error('지도가 초기화되지 않았습니다.');
      return null;
    }

    const places = new window.kakao.maps.services.Places();
    const latlng = new window.kakao.maps.LatLng(location.lat, location.lng);

    const searchPromises = categoryCodes.map((code) => {
      return new Promise((resolve) => {
        places.categorySearch(code, (data, status) => {
          if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
            resolve(data[0]);
          } else {
            resolve(null);
          }
        }, { location: latlng, radius: 50 });
      });
    });

    const results = await Promise.all(searchPromises);
    const validResults = results.filter((p) => p !== null);
    
    if (validResults.length === 0) return null;
    
    validResults.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return validResults[0];
  }, [mapInstance]);

  // 거리 계산
  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // 미터 단위로 반환
  }, []);

  // 검색 결과에 거리 정보 추가
  const addDistanceToResults = useCallback((results, userLocation) => {
    if (!userLocation) return results;

    return results.map(place => ({
      ...place,
      distance: calculateDistance(
        userLocation.lat,
        userLocation.lng,
        parseFloat(place.y),
        parseFloat(place.x)
      )
    })).sort((a, b) => a.distance - b.distance);
  }, [calculateDistance]);

  return {
    searchResults,
    searchLoading,
    searchError,
    searchByKeyword,
    searchByCategory,
    findNearestPlace,
    calculateDistance,
    addDistanceToResults
  };
};