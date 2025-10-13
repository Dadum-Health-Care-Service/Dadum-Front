/**
 * 네이버 뉴스 API 서비스
 * 
 * 사용법:
 * 1. 네이버 개발자 센터에서 애플리케이션 등록
 * 2. 클라이언트 ID와 Secret 발급
 * 3. 환경변수에 설정
 */

// 환경변수에서 API 키 가져오기 (Vite 환경에서는 import.meta.env 사용)
const NAVER_CLIENT_ID = import.meta.env.VITE_NAVER_CLIENT_ID || 'YOUR_NAVER_CLIENT_ID';
const NAVER_CLIENT_SECRET = import.meta.env.VITE_NAVER_CLIENT_SECRET || 'YOUR_NAVER_CLIENT_SECRET';

// 네이버 뉴스 API 기본 URL
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';

/**
 * 스포츠 피트니스 관련 뉴스 검색어 목록 (네이버 스포츠 아웃도어 피트니스 섹션 특화)
 */
const WORKOUT_SEARCH_TERMS = [
  '아웃도어 피트니스',
  '스포츠 피트니스',
  '헬스장 운동',
  '홈트레이닝 스포츠',
  '요가 아웃도어',
  '맨몸운동 스포츠',
  '다이어트 운동',
  '근력운동 헬스',
  '유산소 스포츠',
  '스트레칭 요가',
  '보디빌딩 헬스',
  '크로스핏 피트니스',
  '필라테스 운동',
  '웨이트 트레이닝',
  '피트니스 아웃도어'
];

/**
 * 백엔드를 통한 네이버 뉴스 검색 (운동 관련)
 */
const fetchFitnessNews = async (count = 5, searchTerm = null) => {
  try {
    // 랜덤한 검색어 선택 (중복 방지)
    const randomTerm = searchTerm || WORKOUT_SEARCH_TERMS[Math.floor(Math.random() * WORKOUT_SEARCH_TERMS.length)];
    // 5개 뉴스 요청
    const url = `http://localhost:8080/api/v1/news/fitness?query=${encodeURIComponent(randomTerm)}&display=${count}`;
    
    console.log('검색어:', randomTerm);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { ...data, searchTerm: randomTerm };
  } catch (error) {
    console.error('운동 뉴스 가져오기 오류:', error);
    throw error;
  }
};

/**
 * 백엔드를 통한 네이버 이미지 검색
 */
const fetchNewsImage = async (query) => {
  try {
    const url = `http://localhost:8080/api/v1/news/image?query=${encodeURIComponent(query)}&display=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.items && data.items.length > 0) {
      return data.items[0].link; // 첫 번째 이미지 URL 반환
    }
    return null;
  } catch (error) {
    console.error('이미지 검색 오류:', error);
    return null;
  }
};

/**
 * 운동 관련 뉴스 가져오기
 * @param {number} count - 가져올 뉴스 개수
 * @param {boolean} forceRefresh - 강제 새로고침 여부
 */
export const getWorkoutNews = async (count = 5, forceRefresh = false) => {
  try {
    console.log('네이버 뉴스 검색 시작... (', count, '개)');
    
    // 새로고침 시에는 랜덤한 검색어 사용
    const searchTerm = forceRefresh ? null : '스포츠 피트니스';
    const data = await fetchFitnessNews(count, searchTerm);
    
    if (data && data.items && data.items.length > 0) {
      console.log('실제 뉴스 데이터 로드 완료:', data.items.length, '개, 검색어:', data.searchTerm);
      
      // 건강/운동 관련 뉴스만 필터링
      const filteredItems = filterHealthRelatedNews(data.items);
      
      // Unsplash의 운동 관련 고품질 이미지 (무료, API 키 불필요)
      const workoutImages = [
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&h=400&fit=crop', // 체육관
        'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&h=400&fit=crop', // 아령
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&h=400&fit=crop', // 달리기
        'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=700&h=400&fit=crop', // 운동화
        'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&h=400&fit=crop', // 요가
        'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&h=400&fit=crop', // 근력운동
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=700&h=400&fit=crop', // 헬스장
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&h=400&fit=crop', // 스포츠
      ];
      
      // 네이버 API 응답 형식을 우리 형식으로 변환 (썸네일 개선)
      const processedNews = await Promise.all(filteredItems.map(async (item, index) => {
        // 기사 제목으로 네이버 이미지 검색 시도
        let thumbnail = workoutImages[index % workoutImages.length]; // 기본값
        try {
          const imageUrl = await fetchNewsImage(item.title.replace(/<[^>]*>/g, ''));
          if (imageUrl) {
            thumbnail = imageUrl;
          }
        } catch (error) {
          console.log('이미지 검색 실패, 기본 이미지 사용:', error);
        }
        
        return {
          id: `news_${Date.now()}_${index}`, // 고유 ID 생성
          title: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
          description: item.description.replace(/<[^>]*>/g, ''),
          summary: item.description.replace(/<[^>]*>/g, '').substring(0, 80) + '...',
          link: item.link,
          originallink: item.originallink,
          pubDate: item.pubDate,
          category: getCategoryFromSearchTerm(data.searchTerm),
          time: formatNewsTime(item.pubDate),
          // 개선된 썸네일 (네이버 이미지 검색 또는 Unsplash fallback)
          thumbnail: thumbnail,
          source: item.originallink ? new URL(item.originallink).hostname : null,
          details: [
            "최신 운동 관련 뉴스입니다.",
            "전문가들의 의견과 연구 결과를 확인하세요.",
            "건강하고 효과적인 운동 정보를 제공합니다."
          ],
          tips: "최신 운동 트렌드와 건강 정보를 확인하여 더 나은 운동 습관을 만드세요!"
        };
      }));
      
      console.log('필터링 완료:', processedNews.length, '개');
      return processedNews.slice(0, count);
    } else {
      console.log('뉴스 데이터가 없어 더미 데이터를 사용합니다.');
      return getDummyNewsData(count);
    }
    
  } catch (error) {
    console.error('뉴스 검색 실패:', error);
    console.log('더미 데이터를 사용합니다.');
    return getDummyNewsData(count);
  }
};

/**
 * 검색어에 따른 카테고리 매핑
 */
const getCategoryFromSearchTerm = (searchTerm) => {
  const categoryMap = {
    '운동 건강': '운동 건강',
    '헬스케어': '헬스케어',
    '피트니스 건강': '피트니스',
    '홈트레이닝 운동': '홈트레이닝',
    '요가 명상': '요가/명상',
    '필라테스 건강': '필라테스',
    '맨몸운동 효과': '맨몸운동',
    '다이어트 건강': '다이어트',
    '체중감량 운동': '체중관리',
    '근력운동 효과': '근력운동',
    '운동 과학': '운동 과학',
    '건강 관리': '건강 관리',
    '웰빙 운동': '웰빙',
    '운동 상식': '운동 상식',
    '건강 뉴스': '건강 뉴스'
  };
  
  return categoryMap[searchTerm] || '운동 건강';
};

/**
 * 뉴스 시간 포맷 (RFC 822 형식)
 */
const formatNewsTime = (dateString) => {
  try {
    const pubDate = new Date(dateString);
    const now = new Date();
    const diffInMs = now - pubDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return pubDate.toLocaleDateString('ko-KR');
    }
  } catch (error) {
    return '최근';
  }
};

/**
 * 날짜를 상대 시간으로 변환 (예: "2시간 전")
 * 네이버 블로그 API는 yyyyMMdd 형식 반환
 */
const formatTimeAgo = (dateString) => {
  try {
    // yyyyMMdd 형식을 Date 객체로 변환
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    const pubDate = new Date(`${year}-${month}-${day}`);
    
    const now = new Date();
    const diffInMs = now - pubDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInHours < 1) {
      return '오늘';
    } else if (diffInHours < 24) {
      return '오늘';
    } else if (diffInDays === 1) {
      return '어제';
    } else if (diffInDays < 7) {
      return `${diffInDays}일 전`;
    } else {
      return `${year}.${month}.${day}`;
    }
  } catch (error) {
    return dateString;
  }
};

/**
 * 건강/운동과 관련 없는 뉴스 필터링 (완화된 버전)
 */
const filterHealthRelatedNews = (newsList) => {
  // 완전히 제외할 키워드들 (강한 제외)
  const strongExcludeKeywords = [
    '창업', '투자', '주식', '금융',
    '정치', '선거', '국회', '정부',
    '부동산', '아파트', '임대',
    '자동차', '운전', '교통',
    '연예', '배우', '가수', '드라마'
  ];
  
  // 약한 제외 키워드들 (제목에만 있으면 제외)
  const weakExcludeKeywords = [
    '기업', '경제', '기술', 'IT', '소프트웨어',
    '축구', '야구', '농구', '프로야구', '구단'
  ];
  
  return newsList.filter(news => {
    const title = news.title.toLowerCase();
    const description = (news.description || '').toLowerCase();
    const text = title + ' ' + description;
    
    // 강한 제외 키워드가 있으면 제외
    const hasStrongExclude = strongExcludeKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    // 제목에 약한 제외 키워드가 있으면 제외
    const hasWeakExcludeInTitle = weakExcludeKeywords.some(keyword => 
      title.includes(keyword.toLowerCase())
    );
    
    // 제외 조건에 해당하면 필터링
    if (hasStrongExclude || hasWeakExcludeInTitle) {
      return false;
    }
    
    // 운동/건강 관련 키워드가 하나라도 있으면 통과
    const healthKeywords = [
      '운동', '건강', '헬스', '피트니스', '다이어트',
      '요가', '필라테스', '홈트레이닝', '맨몸운동',
      '근력', '유산소', '스트레칭', '체중감량',
      '영양', '식단', '비타민', '보충제',
      '의학', '병원', '의료', '치료', '예방',
      '웰빙', '라이프스타일', '맞춤', '케어'
    ];
    
    const hasHealthKeyword = healthKeywords.some(keyword => 
      text.includes(keyword.toLowerCase())
    );
    
    return hasHealthKeyword;
  });
};

/**
 * 중복 뉴스 제거
 */
const removeDuplicateNews = (newsList) => {
  const seen = new Set();
  return newsList.filter(news => {
    const key = news.title.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

/**
 * API 실패 시 사용할 더미 데이터
 */
const getDummyNewsData = (count) => {
  const dummyNews = [
    {
      id: `dummy_${Date.now()}_1`,
      title: '새로운 연구: 하루 30분 운동으로 심혈관 질환 위험 40% 감소',
      description: '최신 연구에 따르면 하루 30분의 규칙적인 운동이 심혈관 질환 위험을 크게 줄일 수 있다는 것이 밝혀졌습니다.',
      link: '#',
      originallink: '#',
      pubDate: new Date().toISOString(),
      category: '건강연구',
      time: '2시간 전',
      summary: '최신 연구에 따르면 하루 30분의 규칙적인 운동이 심혈관 질환 위험을 크게 줄일 수 있다는 것이 밝혀졌습니다...',
      details: [
        '30분 중강도 운동으로 심혈관 질환 위험 40% 감소',
        '주 3회 이상 규칙적인 운동이 가장 효과적',
        '걷기, 수영, 자전거 등 다양한 운동 형태 모두 유효'
      ],
      tips: '하루 30분 운동을 위해 계단 이용하기, 점심시간 산책하기 등 작은 습관부터 시작해보세요.'
    },
    {
      id: `dummy_${Date.now()}_2`,
      title: '겨울철 실내 운동 효과적인 방법 - 홈트레이닝 트렌드',
      description: '추운 겨울, 실내에서도 효과적으로 운동할 수 있는 다양한 홈트레이닝 방법들을 소개합니다.',
      link: '#',
      originallink: '#',
      pubDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: '홈트레이닝',
      time: '4시간 전',
      summary: '추운 겨울, 실내에서도 효과적으로 운동할 수 있는 다양한 홈트레이닝 방법들을 소개합니다...',
      details: [
        '온라인 운동 클래스 활용으로 동기부여 증진',
        '간단한 운동 도구로 효과적인 홈트레이닝',
        '실내 자전거, 런닝머신 등 유산소 운동 기구 활용'
      ],
      tips: '작은 공간에서도 할 수 있는 플랭크, 스쿼트, 푸시업 등 기본 운동으로 시작해보세요.'
    }
  ];
  
  return dummyNews.slice(0, count);
};

export default {
  fetchFitnessNews,
  getWorkoutNews
};
