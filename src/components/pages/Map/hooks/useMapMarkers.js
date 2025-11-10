import { useState, useCallback } from 'react';

export const useMapMarkers = (mapInstance) => {
  const [markers, setMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);

  // 마커 추가
  const addMarker = useCallback((position, options = {}) => {
    if (!mapInstance || !window.kakao?.maps) return null;

    const marker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(position.lat, position.lng),
      map: mapInstance,
      ...options
    });

    setMarkers(prev => [...prev, marker]);
    return marker;
  }, [mapInstance]);

  // 마커들 제거
  const clearMarkers = useCallback(() => {
    markers.forEach(marker => marker.setMap(null));
    setMarkers([]);
  }, [markers]);

  // 정보창 표시
  const showInfoWindow = useCallback((marker, content) => {
    if (!mapInstance || !window.kakao?.maps) return;

    if (infoWindow) {
      infoWindow.close();
    }

    const newInfoWindow = new window.kakao.maps.InfoWindow({
      content,
      removable: false
    });

    newInfoWindow.open(mapInstance, marker);
    setInfoWindow(newInfoWindow);
  }, [mapInstance, infoWindow]);

  // 정보창 닫기
  const closeInfoWindow = useCallback(() => {
    if (infoWindow) {
      infoWindow.close();
      setInfoWindow(null);
    }
  }, [infoWindow]);

  // 마커 클릭 이벤트 추가
  const addMarkerClickListener = useCallback((marker, callback) => {
    if (!marker || !window.kakao?.maps) return;

    window.kakao.maps.event.addListener(marker, 'click', callback);
  }, []);

  // 마커 이미지 생성
  const createMarkerImage = useCallback((imageUrl, size, options = {}) => {
    if (!window.kakao?.maps) return null;

    return new window.kakao.maps.MarkerImage(
      imageUrl,
      new window.kakao.maps.Size(size.width, size.height),
      options
    );
  }, []);

  return {
    markers,
    infoWindow,
    addMarker,
    clearMarkers,
    showInfoWindow,
    closeInfoWindow,
    addMarkerClickListener,
    createMarkerImage
  };
};
