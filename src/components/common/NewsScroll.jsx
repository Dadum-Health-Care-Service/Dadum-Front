import React, { useState, useEffect } from 'react';
import { Carousel, Badge, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import NewsDetailModal from './NewsDetailModal';
import { getWorkoutNews } from '../../services/newsApi';
import './NewsScroll.css';

const NewsScroll = () => {
  const [selectedNews, setSelectedNews] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allNews, setAllNews] = useState([]);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // 컴포넌트 마운트 시 실제 뉴스 데이터 가져오기
  useEffect(() => {
    loadNewsData();
  }, []);

  const loadNewsData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // 실제 네이버 뉴스 API 호출 (5개만 가져오기)
      const realNews = await getWorkoutNews(5, forceRefresh);
      setAllNews(realNews);
      setCurrentIndex(0);
      
      console.log('실제 뉴스 데이터 로드 완료:', realNews.length, '개');
    } catch (error) {
      console.error('뉴스 로드 실패:', error);
      setError('뉴스를 불러오는데 실패했습니다.');
      
      // API 실패 시 더미 데이터 사용
      const dummyData = getDummyNewsData(5);
      setAllNews(dummyData);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  // 다음 뉴스로 이동
  const handleNext = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= allNews.length) {
      // 마지막 뉴스에 도달하면 새로고침
      handleRefresh();
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  // 이전 뉴스로 이동
  const handlePrev = () => {
    const prevIndex = currentIndex === 0 ? allNews.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
  };

  // 뉴스 새로고침
  const handleRefresh = () => {
    setCurrentIndex(0);
    setIsAutoPlaying(true);
    loadNewsData(true); // forceRefresh = true로 설정
    
    // 새로고침 완료 후 자동재생 상태 해제
    setTimeout(() => {
      setIsAutoPlaying(false);
    }, 2000);
  };

  // 터치 이벤트 핸들러 (모바일 스와이프)
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext(); // 왼쪽으로 스와이프 -> 다음 뉴스 (마지막이면 새로고침)
    }
    if (isRightSwipe) {
      handlePrev(); // 오른쪽으로 스와이프 -> 이전 뉴스
    }

    // 초기화
    setTouchStart(0);
    setTouchEnd(0);
  };

  // 더미 데이터 (API 실패 시 사용)
  const getDummyNewsData = (count = 2) => {
    const allDummyNews = [
    {
      id: 1,
      title: "새로운 연구: 하루 30분 운동으로 심혈관 질환 위험 40% 감소",
      category: "건강연구",
      time: "2시간 전",
      summary: "최신 연구에 따르면 하루 30분의 규칙적인 운동이 심혈관 질환 위험을 크게 줄일 수 있다는 것이 밝혀졌습니다.",
      details: [
        "30분 중강도 운동으로 심혈관 질환 위험 40% 감소",
        "주 3회 이상 규칙적인 운동이 가장 효과적",
        "걷기, 수영, 자전거 등 다양한 운동 형태 모두 유효",
        "운동 강도보다는 지속성이 더 중요한 요소"
      ],
      tips: "하루 30분 운동을 위해 계단 이용하기, 점심시간 산책하기 등 작은 습관부터 시작해보세요."
    },
    {
      id: 2,
      title: "겨울철 실내 운동 효과적인 방법 - 홈트레이닝 트렌드",
      category: "운동팁",
      time: "4시간 전",
      summary: "추운 겨울, 실내에서도 효과적으로 운동할 수 있는 다양한 홈트레이닝 방법들을 소개합니다.",
      details: [
        "온라인 운동 클래스 활용으로 동기부여 증진",
        "간단한 운동 도구로 효과적인 홈트레이닝",
        "실내 자전거, 런닝머신 등 유산소 운동 기구 활용",
        "스트레칭과 요가로 유연성과 마음의 안정 찾기"
      ],
      tips: "작은 공간에서도 할 수 있는 플랭크, 스쿼트, 푸시업 등 기본 운동으로 시작해보세요."
    },
    {
      id: 3,
      title: "올림픽 선수들이 추천하는 식단 관리 비법 공개",
      category: "영양정보",
      time: "6시간 전",
      summary: "세계 최고 수준의 선수들이 실제로 사용하는 영양 관리 노하우를 공개합니다.",
      details: [
        "운동 전후 탄수화물과 단백질의 균형잡힌 섭취",
        "충분한 수분 섭취와 전해질 보충의 중요성",
        "개인별 체질에 맞는 맞춤형 식단 설계",
        "규칙적인 식사 시간과 양의 조절"
      ],
      tips: "운동 1-2시간 전 가벼운 탄수화물, 운동 후 30분 내 단백질 섭취를 권장합니다."
    },
    {
      id: 4,
      title: "스트레칭의 중요성 - 근육 통증 예방과 유연성 향상",
      category: "운동과학",
      time: "8시간 전",
      summary: "운동 전후 스트레칭의 중요성과 올바른 방법에 대해 알아봅니다.",
      details: [
        "동적 스트레칭으로 운동 전 준비운동",
        "정적 스트레칭으로 운동 후 근육 이완",
        "유연성 향상으로 부상 위험 감소",
        "혈액 순환 개선과 근육 회복 촉진"
      ],
      tips: "각 스트레칭을 15-30초간 유지하고, 통증이 느껴지지 않는 범위에서 실시하세요."
    },
    {
      id: 5,
      title: "새해 목표 달성을 위한 운동 루틴 설계 가이드",
      category: "운동계획",
      time: "10시간 전",
      summary: "새해 운동 목표를 효과적으로 달성하기 위한 루틴 설계 방법을 제시합니다.",
      details: [
        "현실적이고 구체적인 목표 설정",
        "점진적 난이도 증가로 지속 가능성 확보",
        "다양한 운동 종류로 지루함 방지",
        "주간/월간 진도 체크로 동기부여"
      ],
      tips: "목표를 작은 단위로 나누어 매일의 성취감을 느끼며 지속해보세요."
    },
    {
      id: 6,
      title: "근력 운동과 유산소 운동의 균형 맞추는 방법",
      category: "운동법",
      time: "12시간 전",
      summary: "최적의 운동 효과를 위한 근력 운동과 유산소 운동의 균형잡힌 조합법을 소개합니다.",
      details: [
        "주 3-4회 근력 운동과 주 2-3회 유산소 운동",
        "운동 순서: 근력 운동 후 유산소 운동",
        "휴식일을 통한 근육 회복 시간 확보",
        "개인 체력 수준에 맞는 운동 강도 조절"
      ],
      tips: "초보자는 유산소 운동부터 시작하여 점진적으로 근력 운동을 추가하는 것을 권장합니다."
    }
  ];
  
  return allDummyNews.slice(0, count);
};

  const handleNewsClick = (news) => {
    setSelectedNews(news);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNews(null);
  };

  return (
    <div className="news-section">
      <div className="news-section-header">
        <h3 className="news-section-title">
          피트니스 뉴스
        </h3>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          <strong>알림:</strong> {error} 더미 데이터를 표시합니다.
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">최신 운동 뉴스를 가져오는 중...</p>
        </div>
      ) : allNews.length > 0 ? (
        <div className="news-carousel-wrapper">
          <button 
            className="news-carousel-btn news-carousel-btn-prev"
            onClick={handlePrev}
            aria-label="이전 뉴스"
          >
            <FaChevronLeft />
          </button>
          
          <div 
            className="news-thumbnail-card"
            onClick={() => window.open(allNews[currentIndex].link, '_blank')}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="news-thumbnail-image-wrapper">
              <img 
                src={allNews[currentIndex].thumbnail} 
                alt={allNews[currentIndex].title}
                className="news-thumbnail-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/700x400/4CAF50/ffffff?text=피트니스+뉴스';
                }}
              />
            </div>
            <div className="news-thumbnail-content">
              <h4 className="news-thumbnail-title">{allNews[currentIndex].title}</h4>
              <p className="news-thumbnail-time">{allNews[currentIndex].time}</p>
            </div>
          </div>
          
          <button 
            className="news-carousel-btn news-carousel-btn-next"
            onClick={handleNext}
            aria-label="다음 뉴스"
          >
            <FaChevronRight />
          </button>
        </div>
      ) : (
        <p className="text-center">뉴스가 없습니다.</p>
      )}

      {/* 하단 선 인디케이터 */}
      {allNews.length > 0 && (
        <div className="news-indicators">
          <div 
            className="news-line-indicator"
            onClick={() => {
              // 클릭한 위치에 따라 뉴스 이동
              const rect = event.currentTarget.getBoundingClientRect();
              const clickX = event.clientX - rect.left;
              const percentage = clickX / rect.width;
              const targetIndex = Math.floor(percentage * allNews.length);
              if (targetIndex >= allNews.length - 1) {
                handleRefresh(); // 마지막 지점 클릭 시 새로고침
              } else {
                setCurrentIndex(targetIndex);
              }
            }}
          >
            <div 
              className="news-line-progress"
              style={{
                width: `${((currentIndex + 1) / allNews.length) * 100}%`
              }}
            />
          </div>
          {isAutoPlaying && (
            <div style={{
              marginTop: '10px',
              fontSize: '0.8rem',
              color: '#007bff',
              textAlign: 'center'
            }}>
              🔄 새로운 뉴스를 가져오는 중...
            </div>
          )}
        </div>
      )}

      <NewsDetailModal 
        show={showModal}
        onHide={handleCloseModal}
        news={selectedNews}
      />
    </div>
  );
};

export default NewsScroll;
