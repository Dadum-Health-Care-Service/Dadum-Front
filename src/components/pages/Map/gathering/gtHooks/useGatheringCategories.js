import { useMemo } from 'react';

/**
 * 모임 카테고리 관련 훅
 * 카테고리 데이터와 관련 유틸리티 함수들을 제공합니다.
 */
export const useGatheringCategories = () => {
  // 카테고리 데이터
  const categories = useMemo(() => [
    { value: 'all', label: '전체', icon: '🏃‍♂️' },
    { value: 'fitness', label: '헬스/피트니스', icon: '💪' },
    { value: 'running', label: '러닝/조깅', icon: '🏃‍♂️' },
    { value: 'yoga', label: '요가/필라테스', icon: '🧘‍♀️' },
    { value: 'swimming', label: '수영', icon: '🏊‍♂️' },
    { value: 'cycling', label: '사이클링', icon: '🚴‍♂️' },
    { value: 'climbing', label: '등산/클라이밍', icon: '🧗‍♂️' },
    { value: 'martial', label: '무술/격투기', icon: '🥋' },
    { value: 'dance', label: '댄스/에어로빅', icon: '💃' },
    { value: 'sports', label: '구기종목', icon: '⚽' },
    { value: 'outdoor', label: '아웃도어', icon: '🏕️' },
    { value: 'other', label: '기타', icon: '🎯' }
  ], []);

  // 카테고리별 아이콘 매핑 (지도 마커용)
  const categoryIcons = useMemo(() => ({
    'fitness': '💪',
    'running': '🏃‍♂️',
    'yoga': '🧘‍♀️',
    'swimming': '🏊‍♂️',
    'cycling': '🚴‍♂️',
    'climbing': '🧗‍♂️',
    'martial': '🥋',
    'dance': '💃',
    'sports': '⚽',
    'outdoor': '🏕️',
    'other': '🎯'
  }), []);

  // 카테고리 찾기 함수
  const findCategory = (value) => {
    return categories.find(category => category.value === value);
  };

  // 카테고리 아이콘 가져오기
  const getCategoryIcon = (categoryValue) => {
    return categoryIcons[categoryValue] || '🎯';
  };

  // 카테고리 라벨 가져오기
  const getCategoryLabel = (categoryValue) => {
    const category = findCategory(categoryValue);
    return category ? category.label : '기타';
  };

  // 폼용 카테고리 옵션 (전체 제외)
  const formCategories = useMemo(() => 
    categories.filter(category => category.value !== 'all'), 
    [categories]
  );

  return {
    categories,
    categoryIcons,
    findCategory,
    getCategoryIcon,
    getCategoryLabel,
    formCategories
  };
};
