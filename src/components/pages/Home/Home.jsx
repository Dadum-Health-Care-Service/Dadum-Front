import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Badge, ProgressBar } from "react-bootstrap";
import ContainerComponent from "../../common/ContainerComponent";
import { FaPlay, FaClock, FaStar, FaFire, FaCheckCircle, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaWind } from "react-icons/fa";
import styles from "./Home.module.css";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";
import FitnessNewsFeed from "../News/FitnessNewsFeed";
import { useApi } from "../../../utils/api/useApi";
const Home = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    consecutiveDays: 0,
    totalRoutines: 0,
    totalTime: "0시간",
  });
  const [userRoutines, setUserRoutines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dailyTip, setDailyTip] = useState("");
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const { GET } = useApi();

  // 날씨 아이콘 매핑
  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return FaSun;
    if (conditionLower.includes('cloud')) return FaCloud;
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) return FaCloudRain;
    if (conditionLower.includes('snow')) return FaSnowflake;
    if (conditionLower.includes('wind')) return FaWind;
    return FaSun; // 기본값
  };

  // 날씨에 따른 운동 추천
  const getExerciseRecommendation = (weather) => {
    if (!weather) return { exercise: "운동을 시작해보세요!", description: "좋은 하루 되세요." };
    
    const temp = weather.temperature;
    const condition = weather.condition?.toLowerCase() || '';
    
    if (temp > 25 && condition.includes('sunny')) {
      return {
        exercise: "실내 운동 추천",
        description: "날씨가 더워요! 헬스장이나 집에서 하는 운동이 좋겠어요."
      };
    } else if (temp > 20 && condition.includes('clear')) {
      return {
        exercise: "야외 운동 추천",
        description: "완벽한 날씨예요! 공원에서 조깅이나 산책을 해보세요."
      };
    } else if (condition.includes('cloudy')) {
      return {
        exercise: "가벼운 야외 운동",
        description: "흐린 날씨예요. 실내외 어디서든 편한 운동을 해보세요."
      };
    } else if (condition.includes('rainy')) {
      return {
        exercise: "실내 홈트레이닝",
        description: "비가 오네요. 집에서 할 수 있는 스트레칭이나 홈트레이닝을 해보세요."
      };
    } else if (temp < 10 || condition.includes('snowy')) {
      return {
        exercise: "실내 워밍업",
        description: "추워요! 실내에서 충분한 워밍업과 함께 운동하세요."
      };
    } else {
      return {
        exercise: "가벼운 운동",
        description: "적당한 날씨예요! 가벼운 산책이나 스트레칭을 추천해요."
      };
    }
  };

  // 날씨 정보 가져오기 (OpenWeatherMap API 사용)
  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      // OpenWeatherMap API 키 (환경 변수에서 가져오기)
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      
      // 사용자 위치 가져오기
      const getLocation = () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
            },
            (error) => {
              console.warn('위치 정보 가져오기 실패:', error);
              // 위치 정보 실패 시 서울 좌표 사용
              resolve({ lat: 37.5665, lon: 126.9780 });
            },
            {
              timeout: 5000,
              maximumAge: 300000, // 5분간 캐시 사용
              enableHighAccuracy: false
            }
          );
        });
      };
      
      try {
        // 사용자 위치 가져오기
        const location = await getLocation();
        console.log('사용자 위치:', location);
        
        // OpenWeatherMap API 호출 (위도/경도 기반)
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=kr`
        );
        
        if (response.ok) {
          const data = await response.json();
          console.log('날씨 데이터:', data);
          
          // 날씨 상태 매핑
          const weatherMain = data.weather[0].main;
          let condition = 'Clear';
          
          switch(weatherMain) {
            case 'Clear':
              condition = 'Clear';
              break;
            case 'Clouds':
              condition = 'Cloudy';
              break;
            case 'Rain':
            case 'Drizzle':
            case 'Thunderstorm':
              condition = 'Rainy';
              break;
            case 'Snow':
              condition = 'Snowy';
              break;
            case 'Mist':
            case 'Smoke':
            case 'Haze':
            case 'Fog':
              condition = 'Cloudy';
              break;
            default:
              condition = 'Clear';
          }
          
          // 카카오 API로 정확한 주소 가져오기
          let locationName = '현재 위치';
          try {
            const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;
            if (KAKAO_API_KEY) {
              const kakaoResponse = await fetch(
                `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${location.lon}&y=${location.lat}`,
                {
                  headers: {
                    Authorization: `KakaoAK ${KAKAO_API_KEY}`
                  }
                }
              );
              
              if (kakaoResponse.ok) {
                const kakaoData = await kakaoResponse.json();
                console.log('카카오 주소 데이터:', kakaoData);
                
                if (kakaoData.documents && kakaoData.documents.length > 0) {
                  const address = kakaoData.documents[0].address;
                  if (address) {
                    // 시/구/동 형식으로 표시
                    const region = address.region_2depth_name || ''; // 구
                    const dong = address.region_3depth_name || ''; // 동
                    
                    if (dong) {
                      locationName = `${region} ${dong}`;
                    } else if (region) {
                      locationName = region;
                    } else {
                      locationName = address.region_1depth_name || '현재 위치'; // 시/도
                    }
                  }
                }
              } else {
                console.warn('카카오 주소 변환 실패:', kakaoResponse.status);
              }
            }
          } catch (kakaoError) {
            console.warn('카카오 주소 변환 실패:', kakaoError);
            // 카카오 API 실패 시 OpenWeatherMap의 이름 사용
            if (data.name) {
              locationName = data.name;
            }
          }
          
          const weatherData = {
            temperature: Math.round(data.main.temp),
            condition: condition,
            location: locationName,
            humidity: data.main.humidity
          };
          
          setWeather(weatherData);
          return;
        }
      } catch (apiError) {
        console.warn('OpenWeatherMap API 호출 실패, 모의 데이터 사용:', apiError);
      }
      
      // API 실패 시 계절에 맞는 모의 데이터 사용
      const currentMonth = new Date().getMonth() + 1;
      let mockWeather;
      
      if (currentMonth >= 10 || currentMonth <= 2) { // 겨울 (10-2월) - 10월도 포함
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 5, // 5-20도
          condition: ['Cloudy', 'Clear'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 30) + 50
        };
      } else if (currentMonth >= 3 && currentMonth <= 5) { // 봄 (3-5월)
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 10, // 10-25도
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 40) + 40
        };
      } else if (currentMonth >= 6 && currentMonth <= 8) { // 여름 (6-8월)
        mockWeather = {
          temperature: Math.floor(Math.random() * 10) + 25, // 25-35도
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 30) + 60
        };
      } else { // 가을 (9월)
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 10, // 10-25도
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 40) + 40
        };
      }
      
      setWeather(mockWeather);
      
    } catch (error) {
      console.error('날씨 정보를 가져오는데 실패했습니다:', error);
      // 최종 에러 시 현재 계절에 맞는 기본값
      const currentMonth = new Date().getMonth() + 1;
      const isWinter = currentMonth >= 10 || currentMonth <= 2;
      
      setWeather({
        temperature: isWinter ? 10 : 20,
        condition: 'Clear',
        location: '서울특별시',
        humidity: 60
      });
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // 리뷰 데이터
  const reviews = [
    { stars: 5, text: "루틴 추천이 생각보다 정교해서 따라하기 쉽고, 시간 대비 효율이 좋아요.", author: "김OO / 직장인" },
    { stars: 5, text: "운동 초보인데도 세트·휴식까지 자동으로 맞춰줘서 성취감이 생겼습니다.", author: "이OO / 대학생" },
    { stars: 5, text: "AI가 추천해주는 운동이 제 체력과 딱 맞아서 놀랐어요. 꾸준히 할 수 있을 것 같습니다.", author: "박OO / 프리랜서" },
    { stars: 5, text: "운동 기록이 자동으로 저장되어서 진행 상황을 한눈에 볼 수 있어요. 동기부여가 됩니다!", author: "정OO / 주부" },
    { stars: 4, text: "실시간 자세 피드백 기능이 정말 유용해요. PT 받는 느낌이 들어요.", author: "최OO / 회사원" },
    { stars: 5, text: "바쁜 일상에서도 짧은 시간 안에 효과적으로 운동할 수 있게 도와줍니다.", author: "강OO / 자영업자" },
  ];

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      // 루틴 목록 가져오기
      const routinesRes = await GET("/routine/list");
      console.log("루틴 데이터 전체:", routinesRes);
      console.log("루틴 데이터 배열:", routinesRes?.data);
      
      const routineArray = routinesRes?.data || [];
      console.log("루틴 배열 길이:", routineArray.length);
      console.log("루틴 배열 내용:", routineArray);
      
      if (Array.isArray(routineArray) && routineArray.length > 0) {
        // 루틴 데이터 변환
        const formattedRoutines = routineArray.map((routine, index) => {
          console.log(`루틴 ${index + 1}:`, routine.routineName, '운동개수:', routine.saveRoutineDto?.length || 0);
          
          const exerciseCount = routine.saveRoutineDto?.length || 0;
          return {
            id: routine.setId,
            title: routine.routineName || `내 운동 ${index + 1}`,
            time: exerciseCount > 0 ? `${exerciseCount}개 운동` : "운동 없음",
            difficulty: routine.level || "보통",
            icon: "",
            completed: false,
            isToday: false  // 오늘 할 루틴 여부
          };
        });
        
        console.log("변환된 루틴:", formattedRoutines);
        setUserRoutines(formattedRoutines);
        
        // 통계 데이터 설정
        setUserStats({
          consecutiveDays: 0,
          totalRoutines: formattedRoutines.length,
          totalTime: "0시간"
        });
      } else {
        console.log("루틴 데이터가 비어있거나 배열이 아님");
        setUserRoutines([]);
      }
    } catch (e) {
      console.error("사용자 데이터 로딩 실패", e);
      setUserRoutines([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchWeather();
  }, [fetchUserData, fetchWeather]);

  // 리뷰 자동 슬라이드 (5초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 2) % reviews.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [reviews.length]);

  // 화면으로 돌아오거나 탭이 활성화될 때 자동 새로고침
  useEffect(() => {
    const handleFocus = () => fetchUserData();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchUserData();
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fetchUserData]);

  // 오늘의 팁 랜덤 선택
  useEffect(() => {
    const tips = [
      "짧게라도 매일 하는 게 장기적으로 가장 큰 변화를 만듭니다.",
      "운동 후 30분 내 단백질 섭취는 근육 회복에 큰 도움이 됩니다.",
      "오늘은 완벽하지 않아도 괜찮습니다. 꾸준함이 곧 완벽함입니다.",
      "세트 사이 휴식은 60~90초가 적당합니다. 집중을 유지해 보세요.",
      "수분 부족은 운동 효율을 떨어뜨립니다. 루틴 전후로 물을 꼭 챙기세요.",
      "오늘은 강도보다 '폼'을 우선하세요. 올바른 자세가 부상을 막습니다.",
      "아침 운동은 하루 종일 활력 넘치는 하루를 만들어줍니다.",
      "스트레칭은 운동 전후 필수입니다. 유연성 향상에 도움이 됩니다.",
      "충분한 수면은 운동 성과와 회복에 중요한 역할을 합니다.",
      "작은 목표부터 시작하세요. 성취감이 동기부여로 이어집니다.",
      "운동 일지를 써보세요. 발전 과정을 확인할 수 있습니다.",
      "친구와 함께 운동하면 지속력이 높아집니다.",
      "운동 전 가벼운 워밍업으로 부상을 예방하세요.",
      "운동 후 쿨다운으로 심박수를 천천히 낮춰주세요.",
      "균형 잡힌 식단과 함께하는 운동이 최고의 효과를 냅니다.",
    ];
    
    // 더 확실한 랜덤 선택을 위해 시간 기반 시드 추가
    const now = new Date();
    const timeSeed = now.getTime() + Math.random();
    const randomIndex = Math.floor((timeSeed % 1000) / 1000 * tips.length);
    const randomTip = tips[randomIndex];
    
    console.log("선택된 팁 인덱스:", randomIndex, "팁:", randomTip);
    setDailyTip(randomTip);
  }, []);

  const startRoutine = (routineId) => {
    // 루틴 페이지로 이동
    navigate('/routine');
  };

  // 오늘 완료한 루틴 자동 추적
  const todayCompletedCount = userRoutines.filter((r) => r.completed).length;

  const stats = [
    {
      label: "연속 달성",
      value: `${userStats?.consecutiveDays ?? 0}일`,
      icon: FaFire,
      color: "#ff6b6b",
    },
    {
      label: "총 루틴",
      value: `${userRoutines.length}개`, // 전체 루틴 개수
      icon: FaStar,
      color: "#ffd93d",
    },
    {
      label: "총 시간",
      value: userStats?.totalTime ?? "0시간",
      icon: FaClock,
      color: "#6c5ce7",
    },
  ];

  return (
    <ContainerComponent className={styles.home}>
      {/* Hero */}
      <section className={styles.hero}>
        <Container>
          <Row className="align-items-center">
            <Col md={7}>
              <h1 className={styles.heroTitle}>AI 기반 운동 분석 및 루틴 관리 서비스</h1>
              <p className={styles.heroSub}>실시간 자세 분석과 AI 칼로리 인식으로 운동을 더 정확하게.</p>
              <div className={styles.heroFeatures}>
                {["실시간 자세 분석", "AI 칼로리 인식", "운동 루틴 관리", "건강 챗봇 상담"].map((feature, i) => (
                  <div key={i} className={styles.heroFeatureItem}>
                    <FaCheckCircle className={styles.heroFeatureIcon} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </Col>
            <Col md={5} className="mt-4 mt-md-0">
              <div className={styles.heroStatsCard}>
                <div className={styles.statsRow}>
                  {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={index} className={styles.statCard}>
                        <IconComponent className={styles.statIcon} style={{ color: stat.color }} />
                        <div className={styles.statValue}>{stat.value}</div>
                        <div className={styles.statLabel}>{stat.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.progressWrap}>
                  <div className={styles.progressHeader}>
                    <span>오늘의 활동</span>
                    <span className={styles.progressNum}>
                      {todayCompletedCount > 0 ? `${todayCompletedCount}개 완료` : ""}
                    </span>
                  </div>
                  <p className={styles.progressMessage}>
                    {todayCompletedCount > 0 
                      ? `오늘 ${todayCompletedCount}개의 루틴을 완료했습니다!` 
                      : "아직 완료한 루틴이 없습니다. 활기차게 시작해봐요!"}
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Quick Routines */}
      <section className={styles.quickRoutines}>
        <Container>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>빠른 루틴</h3>
          </div>

          {loading && (
            <Row>
              {[1,2,3].map((i) => (
                <Col key={i} lg={4} md={6} className="mb-3">
                  <div className={styles.skeletonCard} />
                </Col>
              ))}
            </Row>
          )}

          {!loading && userRoutines.length === 0 && (
            <Row className="justify-content-center">
              <Col lg={4} md={6} className="mb-3">
                <CardComponent
                  title="등록된 루틴이 없습니다"
                  details="나에게 맞는 루틴을 생성해 시작해 보세요."
                  className={styles.routineCard}
                  buttonText="등록"
                  onClick={() => navigate("/routine")}
                />
              </Col>
            </Row>
          )}

          {!loading && userRoutines.length > 0 && (
            <div className={styles.quickRoutinesRow}>
              {userRoutines.slice(0, 3).map((routine) => (
                <div key={routine.id} className={styles.quickRoutinesCard}>
                  <CardComponent
                    title=""
                    details=""
                    className={styles.routineCard}
                  >
                    <div className={styles.routineHeader}>
                      <h5 className={styles.routineTitle}>{routine.title}</h5>
                      <Badge
                        bg={
                          routine.completed ? "success" : routine.difficulty === "쉬움" ? "success" : "warning"
                        }
                        className={styles.difficultyBadge}
                      >
                        {routine.completed ? "완료" : routine.difficulty || "진행"}
                      </Badge>
                    </div>

                    <div className={styles.routineTime}>
                      <FaClock className={styles.timeIcon} />
                      {routine.time || "시간 정보 없음"}
                    </div>

                    <div className={styles.routineFooter}>
                      <ButtonComponent
                        variant={routine.completed ? "success" : "primary"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          startRoutine(routine.id);
                        }}
                        disabled={routine.completed}
                      >
                        {routine.completed ? "완료됨" : "시작하기"}
                      </ButtonComponent>
                    </div>
                  </CardComponent>
                </div>
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* Weather Exercise Recommendation Section */}
      <section className={styles.tipSection}>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={8} className="mb-3">
              <h3 className={styles.sectionTitleCenter}>오늘의 날씨 + 운동 제안</h3>
              {weatherLoading ? (
                <div className={styles.tipCard}>
                  <div className={styles.tipBody}>날씨 정보를 불러오는 중...</div>
                </div>
              ) : (
                <div className={styles.weatherCard}>
                  <div className={styles.weatherLocation}>
                    <span className={styles.locationLabel}>나의 위치</span>
                    <span className={styles.location}>{weather?.location}</span>
                  </div>
                  
                  <div className={styles.weatherMain}>
                    <div className={styles.temperatureSection}>
                      <span className={styles.tempValue}>{weather?.temperature}°</span>
                      <span className={styles.weatherCondition}>{weather?.condition}</span>
                    </div>
                    {weather && (() => {
                      const WeatherIcon = getWeatherIcon(weather.condition);
                      return <WeatherIcon className={styles.weatherIcon} />;
                    })()}
                  </div>
                  
                  <div className={styles.weatherDetails}>
                    <span className={styles.tempRange}>최고: {weather?.temperature + 2}° 최저: {weather?.temperature - 5}°</span>
                  </div>
                  
                  <div className={styles.exerciseRecommendation}>
                    <div className={styles.recommendationTitle}>
                      {weather && getExerciseRecommendation(weather).exercise}
                    </div>
                    <div className={styles.recommendationDescription}>
                      {weather && getExerciseRecommendation(weather).description}
                    </div>
                  </div>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialSection}>
        <Container>
          <h3 className={styles.sectionTitleSm}>What Our Clients Say</h3>
          <div className={styles.reviewSlider}>
            <Row>
              {[currentReviewIndex, (currentReviewIndex + 1) % reviews.length].map((index) => {
                const review = reviews[index];
                return (
                  <Col md={6} className="mb-3" key={index}>
                    <div className={styles.testimonialCard}>
                      <div className={styles.stars}>{"★".repeat(review.stars)}</div>
                      <p className={styles.reviewText}>{review.text}</p>
                      <div className={styles.reviewAuthor}>{review.author}</div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </Container>
      </section>

      {/* News Section */}
      <section className={styles.newsSection}>
        <Container>
          <FitnessNewsFeed />
        </Container>
      </section>
    </ContainerComponent>
  );
};

export default Home;