/**
 * 네이버 뉴스 API 서비스 (백엔드 프록시 사용)
 * - 기존 기능(필터링, 중복제거, 이미지 검색, 시간 포맷, 더미 데이터) 유지
 * - 탭별 검색어(explicitSearchTerm) 반영
 */

import { GET } from "../utils/api/api";

/**
 * 스포츠 피트니스 관련 뉴스 검색어 목록 (랜덤 기본값)
 */
const WORKOUT_SEARCH_TERMS = [
  "아웃도어 피트니스",
  "스포츠 피트니스",
  "헬스장 운동",
  "홈트레이닝 스포츠",
  "요가 아웃도어",
  "맨몸운동 스포츠",
  "다이어트 운동",
  "근력운동 헬스",
  "유산소 스포츠",
  "스트레칭 요가",
  "보디빌딩 헬스",
  "크로스핏 피트니스",
  "필라테스 운동",
  "웨이트 트레이닝",
  "피트니스 아웃도어",
];

/** ------------------------------------------------------------------
 *  백엔드 프록시 호출
 *  ------------------------------------------------------------------ */
const fetchFitnessNews = async (count = 5, searchTerm = null) => {
  // 전달된 검색어가 없으면 랜덤
  const term =
    searchTerm ||
    WORKOUT_SEARCH_TERMS[
      Math.floor(Math.random() * WORKOUT_SEARCH_TERMS.length)
    ];

  // 필터링을 위해 더 많은 뉴스를 요청 (최소 30개)
  const requestCount = Math.max(count * 5, 20);

  const params = {
    query: term,
    display: requestCount,
    _t: Date.now(), // ✅ 캐시 방지
  };

  console.log("[fetchFitnessNews] GET /news/fitness", params);

  const response = await GET("/news/fitness", params, true);
  const data = response.data;

  return { ...data, searchTerm: term };
};

const fetchNewsImage = async (query) => {
  try {
    const params = {
      query: query,
      display: 1,
    };

    const response = await GET("/news/image", params, true);
    const data = response.data;

    if (data && data.items && data.items.length > 0) {
      return data.items[0].link || null;
    }
    return null;
  } catch (e) {
    console.error("이미지 검색 오류:", e);
    return null;
  }
};

/** ------------------------------------------------------------------
 *  유틸
 *  ------------------------------------------------------------------ */
const stripHTML = (text = "") => text.replace(/<[^>]*>/g, "").trim();

const formatNewsTime = (dateString) => {
  try {
    const pubDate = new Date(dateString);
    const now = new Date();
    const diffInMs = now - pubDate;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (Number.isNaN(pubDate.getTime())) return "최근";
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    if (diffInDays < 7) return `${diffInDays}일 전`;
    return pubDate.toLocaleDateString("ko-KR");
  } catch {
    return "최근";
  }
};

// 건강/운동 관련 필터
const filterHealthRelatedNews = (newsList) => {
  const strongExclude = [
    "창업",
    "투자",
    "주식",
    "금융",
    "정치",
    "선거",
    "국회",
    "정부",
    "부동산",
    "아파트",
    "임대",
    "자동차",
    "운전",
    "교통",
    "연예",
    "배우",
    "가수",
    "드라마",
    "테슬라",
    "전기차",
    "EV",
    "모델Y",
    "모델3",
    "모델S",
    "모델X",
  ];

  const weakExcludeInTitle = [
    "기업",
    "경제",
    "기술",
    "IT",
    "소프트웨어",
    "축구",
    "야구",
    "농구",
    "프로야구",
    "구단",
  ];

  const healthKeywords = [
    "운동",
    "건강",
    "헬스",
    "피트니스",
    "다이어트",
    "요가",
    "필라테스",
    "홈트레이닝",
    "맨몸운동",
    "근력",
    "유산소",
    "스트레칭",
    "체중감량",
    "영양",
    "식단",
    "비타민",
    "보충제",
    "의학",
    "병원",
    "의료",
    "치료",
    "예방",
    "웰빙",
    "라이프스타일",
    "맞춤",
    "케어",
  ];

  return newsList.filter((news) => {
    const title = (news.title || "").toLowerCase();
    const description = (news.description || "").toLowerCase();
    const text = `${title} ${description}`;

    if (strongExclude.some((k) => text.includes(k.toLowerCase()))) return false;
    if (weakExcludeInTitle.some((k) => title.includes(k.toLowerCase())))
      return false;

    const hasHealthKeyword = healthKeywords.some((k) =>
      text.includes(k.toLowerCase())
    );
    return hasHealthKeyword;
  });
};

const removeDuplicateNews = (newsList) => {
  const seen = new Set();
  return newsList.filter((news) => {
    const key = (news.title || "").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** ------------------------------------------------------------------
 *  더미 데이터 (백업)
 *  ------------------------------------------------------------------ */
const getDummyNewsData = (count) => {
  const dummyNews = [
    {
      id: `dummy_${Date.now()}_1`,
      title: "새로운 연구: 하루 30분 운동으로 심혈관 질환 위험 40% 감소",
      description:
        "최신 연구에 따르면 하루 30분의 규칙적인 운동이 심혈관 질환 위험을 크게 줄일 수 있다는 것이 밝혀졌습니다.",
      link: "#",
      originallink: "#",
      pubDate: new Date().toISOString(),
      category: "건강연구",
      time: "2시간 전",
      summary:
        "최신 연구에 따르면 하루 30분의 규칙적인 운동이 심혈관 질환 위험을 크게 줄일 수 있다는 것이 밝혀졌습니다...",
      details: [
        "30분 중강도 운동으로 심혈관 질환 위험 40% 감소",
        "주 3회 이상 규칙적인 운동이 가장 효과적",
        "걷기, 수영, 자전거 등 다양한 운동 형태 모두 유효",
      ],
      tips: "하루 30분 운동을 위해 계단 이용하기, 점심시간 산책하기 등 작은 습관부터 시작해보세요.",
    },
    {
      id: `dummy_${Date.now()}_2`,
      title: "겨울철 실내 운동 효과적인 방법 - 홈트레이닝 트렌드",
      description:
        "추운 겨울, 실내에서도 효과적으로 운동할 수 있는 다양한 홈트레이닝 방법들을 소개합니다.",
      link: "#",
      originallink: "#",
      pubDate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: "홈트레이닝",
      time: "4시간 전",
      summary:
        "추운 겨울, 실내에서도 효과적으로 운동할 수 있는 다양한 홈트레이닝 방법들을 소개합니다...",
      details: [
        "온라인 운동 클래스 활용으로 동기부여 증진",
        "간단한 운동 도구로 효과적인 홈트레이닝",
        "실내 자전거, 런닝머신 등 유산소 운동 기구 활용",
      ],
      tips: "작은 공간에서도 할 수 있는 플랭크, 스쿼트, 푸시업 등 기본 운동으로 시작해보세요.",
    },
  ];
  return dummyNews.slice(0, count);
};

/** ------------------------------------------------------------------
 *  메인 함수: 뉴스 가져오기 (탭별 검색어 반영 + 전체 로직 유지)
 *  ------------------------------------------------------------------ */
/**
 * @param {number} count        - 가져올 뉴스 개수
 * @param {boolean} forceRefresh - 강제 새로고침 (true면 랜덤 검색어 허용)
 * @param {string|null} explicitSearchTerm - 탭에서 내려온 검색어 (우선 적용)
 * @param {object} options      - { withImages: true } 썸네일 이미지 재검색 여부
 */
export const getWorkoutNews = async (
  count = 5,
  forceRefresh = false,
  explicitSearchTerm = null,
  options = { withImages: true }
) => {
  try {
    // ✅ 탭 검색어 최우선 사용 (null/undefined만 대체)
    const searchTerm =
      explicitSearchTerm ?? (forceRefresh ? null : "스포츠 피트니스");

    // 확인용 로그
    console.log(
      "[getWorkoutNews] searchTerm =",
      searchTerm,
      "forceRefresh =",
      forceRefresh
    );

    // API 호출 제한 방지를 위한 지연
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 1) 백엔드 프록시로 뉴스 가져오기 (강화된 재시도 로직)
    let data = await fetchFitnessNews(count, searchTerm);
    let retryCount = 0;
    const maxRetries = 3;

    // 재시도 로직: 최대 3회까지 재시도
    while (
      (!data || !data.items || data.items.length === 0) &&
      retryCount < maxRetries
    ) {
      retryCount++;
      console.log(
        `뉴스 데이터 없음 → ${retryCount}차 재시도 (${retryCount}/${maxRetries})`
      );

      // 재시도 간격을 점진적으로 증가 (1초, 2초, 3초)
      await new Promise((resolve) => setTimeout(resolve, retryCount * 1000));

      // 재시도 시 다른 검색어 사용 (더 일반적인 검색어로)
      const retrySearchTerms = ["운동", "건강", "피트니스", "헬스"];
      const retrySearchTerm =
        retrySearchTerms[retryCount % retrySearchTerms.length];

      console.log(`재시도 검색어: ${retrySearchTerm}`);
      data = await fetchFitnessNews(count, retrySearchTerm);
    }

    // 모든 재시도 실패 시 더미 데이터 사용
    if (!data || !data.items || data.items.length === 0) {
      console.log("모든 재시도 실패 → 더미 데이터 사용");
      return getDummyNewsData(count);
    }

    // 2) 필터링/중복제거
    const filtered = filterHealthRelatedNews(data.items);
    const unique = removeDuplicateNews(filtered);

    // 3) 썸네일 준비 (Unsplash fallback)
    const workoutImages = [
      "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=700&h=400&fit=crop",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=700&h=400&fit=crop",
    ];

    // 4) 매핑 + (선택) 이미지 재검색
    const withImages = options?.withImages !== false;

    const processed = await Promise.all(
      unique.slice(0, count).map(async (item, index) => {
        const title = stripHTML(item.title);
        const description = stripHTML(item.description || "");
        const summary =
          (description || title).substring(0, 80) +
          (description.length > 80 ? "..." : "");

        let thumbnail = workoutImages[index % workoutImages.length];
        if (withImages) {
          try {
            const url = await fetchNewsImage(title);
            if (url) thumbnail = url;
          } catch (e) {
            // 무시 후 fallback
          }
        }

        let source = "";
        try {
          const u = new URL(item.originallink || item.link || "");
          source = u.hostname.replace(/^www\./, "");
        } catch {
          source = "";
        }

        return {
          id: `news_${Date.now()}_${index}`,
          title,
          description,
          summary,
          link: item.link,
          originallink: item.originallink,
          pubDate: item.pubDate,
          time: formatNewsTime(item.pubDate),
          category: "건강 뉴스", // UI 배지용
          thumbnail,
          source,
          details: [
            "최신 운동 관련 뉴스입니다.",
            "전문가들의 의견과 연구 결과를 확인하세요.",
            "건강하고 효과적인 운동 정보를 제공합니다.",
          ],
          tips: "최신 운동 트렌드와 건강 정보를 확인하여 더 나은 운동 습관을 만드세요!",
        };
      })
    );

    return processed;
  } catch (error) {
    console.error("뉴스 검색 실패:", error);
    return getDummyNewsData(count);
  }
};

export default {
  fetchFitnessNews,
  getWorkoutNews,
};
