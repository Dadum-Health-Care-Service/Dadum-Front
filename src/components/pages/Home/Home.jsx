import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Badge } from "react-bootstrap";
import ContainerComponent from "../../common/ContainerComponent";
import { FaPlay, FaClock, FaCheckCircle, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaWind } from "react-icons/fa";
import styles from "./Home.module.css";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";
import FitnessNewsFeed from "../News/FitnessNewsFeed";
import { useApi } from "../../../utils/api/useApi";
import { useAuth } from "../../../context/AuthContext";
const Home = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    consecutiveDays: 0,
    totalRoutines: 0,
    totalTime: "0시간",
  });
  const [userRoutines, setUserRoutines] = useState([]);
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const { GET, POST } = useApi();
  const { user } = useAuth();

  const getWeatherIcon = (condition) => {
    const conditionLower = condition?.toLowerCase() || '';
    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return FaSun;
    if (conditionLower.includes('cloud')) return FaCloud;
    if (conditionLower.includes('rain') || conditionLower.includes('shower')) return FaCloudRain;
    if (conditionLower.includes('snow')) return FaSnowflake;
    if (conditionLower.includes('wind')) return FaWind;
    return FaSun;
  };

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

  const fetchWeather = useCallback(async () => {
    setWeatherLoading(true);
    try {
      const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
      
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
              resolve({ lat: 37.4979, lon: 127.0276 });
            },
            {
              timeout: 5000,
              maximumAge: 300000,
              enableHighAccuracy: false
            }
          );
        });
      };
      
      try {
        const location = await getLocation();
        
        const response = await GET(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=kr`,
          {},
          false
        );
        
        if (response.status === 200) {
          const data = response.data;
          
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
          
          let locationName = '현재 위치';
          try {
            const KAKAO_API_KEY = import.meta.env.VITE_KAKAO_API_KEY;
            if (KAKAO_API_KEY) {
              const kakaoResponse = await GET(
                `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${location.lon}&y=${location.lat}`,
                {},
                false
              );
              
              if (kakaoResponse.status === 200) {
                const kakaoData = kakaoResponse.data;
                
                if (kakaoData.documents && kakaoData.documents.length > 0) {
                  const address = kakaoData.documents[0].address;
                  if (address) {
                    const region = address.region_2depth_name || '';
                    const dong = address.region_3depth_name || '';
                    
                    if (dong) {
                      locationName = `${region} ${dong}`;
                    } else if (region) {
                      locationName = region;
                    } else {
                      locationName = address.region_1depth_name || '현재 위치';
                    }
                  }
                }
              } else {
                console.warn('카카오 주소 변환 실패:', kakaoResponse.status);
              }
            }
          } catch (kakaoError) {
            console.warn('카카오 주소 변환 실패:', kakaoError);
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
      
      const currentMonth = new Date().getMonth() + 1;
      let mockWeather;
      
      if (currentMonth >= 10 || currentMonth <= 2) {
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 5,
          condition: ['Cloudy', 'Clear'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 30) + 50
        };
      } else if (currentMonth >= 3 && currentMonth <= 5) {
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 10,
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 40) + 40
        };
      } else if (currentMonth >= 6 && currentMonth <= 8) {
        mockWeather = {
          temperature: Math.floor(Math.random() * 10) + 25,
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 30) + 60
        };
      } else {
        mockWeather = {
          temperature: Math.floor(Math.random() * 15) + 10,
          condition: ['Clear', 'Cloudy'][Math.floor(Math.random() * 2)],
          location: '서울특별시',
          humidity: Math.floor(Math.random() * 40) + 40
        };
      }
      
      setWeather(mockWeather);
      
    } catch (error) {
      console.error('날씨 정보를 가져오는데 실패했습니다:', error);
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

  const reviews = [
    { stars: 5, text: "자세 분석 기능이 정말 정확해요. 혼자서도 올바른 자세로 운동할 수 있어서 좋습니다.", author: "김OO / 직장인" },
    { stars: 5, text: "운동 초보인데도 세트·휴식까지 자동으로 맞춰줘서 성취감이 생겼습니다.", author: "이OO / 대학생" },
    { stars: 5, text: "식단 사진만 찍으면 칼로리가 바로 나와서 편리해요. 건강 관리가 쉬워졌습니다.", author: "박OO / 프리랜서" },
    { stars: 5, text: "운동 기록이 자동으로 저장되어서 진행 상황을 한눈에 볼 수 있어요. 동기부여가 됩니다!", author: "정OO / 주부" },
    { stars: 4, text: "실시간 자세 피드백 기능이 정말 유용해요. PT 받는 느낌이 들어요.", author: "최OO / 회사원" },
    { stars: 5, text: "스마트 워치와 연동되어 종합 건강 리포트를 받아볼 수 있어서 만족스럽습니다.", author: "강OO / 자영업자" },
  ];

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const routinesRes = await GET("/routine/list", {}, true).catch(err => {
        console.warn("루틴 목록 조회 실패 (서버 에러 무시):", err.message);
        return { data: [] };
      });
      
      const routineArray = routinesRes?.data || [];
      
      if (Array.isArray(routineArray) && routineArray.length > 0) {
        const formattedRoutines = routineArray.map((routine, index) => {
          
          const exerciseCount = routine.saveRoutineDto?.length || 0;
          return {
            id: routine.setId,
            title: routine.routineName || `내 운동 ${index + 1}`,
            time: exerciseCount > 0 ? `${exerciseCount}개 운동` : "운동 없음",
            icon: ""
          };
        });
        
        setUserRoutines(formattedRoutines);
        
        try {
          const resultsRes = await POST("/routine/result", {}, true).catch(err => {
            console.warn("루틴 완료 기록 조회 실패:", err.message);
            return { data: [] };
          });
          
          const results = resultsRes?.data || [];
          
          if (Array.isArray(results) && results.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            
            const todayResults = results.filter(r => {
              if (!r.tEnd) {
                return false;
              }
              
              const endDate = new Date(r.tEnd);
              const endDateStr = endDate.toISOString().split('T')[0];
              
              const koreanToday = new Date();
              koreanToday.setHours(koreanToday.getHours() + 9);
              const koreanTodayStr = koreanToday.toISOString().split('T')[0];
              
              return endDateStr === today || endDateStr === koreanTodayStr;
            });
            
            const uniqueRoutineIds = [...new Set(todayResults.map(r => r.setId || r.id))];
            setTodayCompletedCount(uniqueRoutineIds.length);
            
            const totalSeconds = results.reduce((sum, record) => {
              const time = record.routineResult?.rouTime || 0;
              return sum + time;
            }, 0);
            
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            
            let totalTimeStr = "";
            if (hours > 0) {
              totalTimeStr = `${hours}시간 ${minutes}분`;
            } else if (minutes > 0) {
              totalTimeStr = `${minutes}분 ${seconds}초`;
            } else {
              totalTimeStr = `${seconds}초`;
            }
            
            
            const uniqueDates = [...new Set(results.map(r => {
              const date = r.tEnd || r.tStart;
              return date ? new Date(date).toISOString().split('T')[0] : null;
            }).filter(Boolean))].sort((a, b) => new Date(b) - new Date(a));
            
            let consecutiveDays = 0;
            if (uniqueDates.length > 0) {
              const today = new Date().toISOString().split('T')[0];
              const latestDate = uniqueDates[0];
              
              if (latestDate === today) {
                consecutiveDays = 1;
                
                for (let i = 1; i < uniqueDates.length; i++) {
                  const prevDate = new Date(uniqueDates[i - 1]);
                  const currDate = new Date(uniqueDates[i]);
                  const diff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));
                  
                  if (diff === 1) {
                    consecutiveDays++;
                  } else {
                    break;
                  }
                }
              }
            }
            
            setUserStats({
              consecutiveDays,
              totalRoutines: formattedRoutines.length,
              totalTime: totalTimeStr
            });
          } else {
            setTodayCompletedCount(0);
            setUserStats({
              consecutiveDays: 0,
              totalRoutines: formattedRoutines.length,
              totalTime: "0시간"
            });
          }
        } catch (statsError) {
          console.warn("루틴 통계 계산 실패:", statsError.message);
          setTodayCompletedCount(0);
          setUserStats({
            consecutiveDays: 0,
            totalRoutines: formattedRoutines.length,
            totalTime: "0시간"
          });
        }
      } else {
        setUserRoutines([]);
        setTodayCompletedCount(0);
        setUserStats({
          consecutiveDays: 0,
          totalRoutines: 0,
          totalTime: "0시간"
        });
      }
    } catch (e) {
      console.error("사용자 데이터 로딩 실패", e);
      setUserRoutines([]);
      setTodayCompletedCount(0);
      setUserStats({
        consecutiveDays: 0,
        totalRoutines: 0,
        totalTime: "0시간"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchWeather();
  }, [fetchUserData, fetchWeather]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setUserRoutines([]);
      setTodayCompletedCount(0);
      setUserStats({
        consecutiveDays: 0,
        totalRoutines: 0,
        totalTime: "0시간",
      });
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentReviewIndex((prevIndex) => (prevIndex + 2) % reviews.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [reviews.length]);

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

  const startRoutine = (routineId) => {
    navigate('/routine');
  };

  const getRecommendationsByTime = () => {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 12) {
      return {
        foods: [
          { name: "바나나", description: "에너지 보충, 운동 전 가벼운 식사" },
          { name: "그릭 요거트", description: "단백질 15g, 포만감 지속" },
          { name: "견과류", description: "건강한 지방, 집중력 향상" }
        ],
        tips: [
          { title: "충분한 수분 섭취", description: "운동 전 30분 전에 물 200ml 마시기" },
          { title: "가벼운 워밍업", description: "5-10분 가벼운 스트레칭으로 몸 준비" },
          { title: "충분한 수면", description: "7-9시간의 질 좋은 수면으로 회복" }
        ]
      };
    } else if (hour >= 12 && hour < 18) {
      return {
        foods: [
          { name: "계란", description: "완전한 단백질, 빠른 회복" },
          { name: "연어", description: "오메가3 풍부, 염증 완화" },
          { name: "퀴노아", description: "완전단백질, 복합탄수화물" }
        ],
        tips: [
          { title: "점심 후 휴식", description: "운동 전 1-2시간 휴식으로 소화" },
          { title: "스트레칭", description: "10-15분 정적 스트레칭으로 근육 이완" },
          { title: "충분한 수분 섭취", description: "운동 후 500ml 이상의 물 마시기" }
        ]
      };
    } else {
      return {
        foods: [
          { name: "닭가슴살", description: "고단백, 저지방, 근육 회복" },
          { name: "고구마", description: "복합탄수화물, 포만감 지속" },
          { name: "아보카도", description: "건강한 지방, 염증 완화" }
        ],
        tips: [
          { title: "저녁 운동 후 식사", description: "운동 후 30분 내에 단백질 섭취" },
          { title: "충분한 수면", description: "7-9시간의 질 좋은 수면 필수" },
          { title: "마사지", description: "근육 마사지로 긴장 완화" }
        ]
      };
    }
  };


  return (
    <ContainerComponent className={styles.home}>
      <section className={styles.hero}>
        <Container>
          <Row className="justify-content-center">
            <Col md={10}>
              <h1 className={styles.heroTitle}>AI 기반 운동 분석 및 루틴 관리 서비스</h1>
              <p className={styles.heroSub}>실시간 자세 분석과 AI 칼로리 인식으로 운동을 더 정확하게.</p>
              <div className={styles.heroFeatures}>
                {["실시간 자세 분석", "AI 칼로리 인식", "운동 루틴 관리", "건강 챗봇 상담", "종합 건강 리포트", "스마트 워치 연동"].map((feature, i) => (
                  <div key={i} className={styles.heroFeatureItem}>
                    <FaCheckCircle className={styles.heroFeatureIcon} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className={styles.challengesSection}>
        <Container>
          <h3 className={styles.sectionTitle}>오늘의 도전 과제</h3>
          <Row>
            <Col md={4} className="mb-3">
              <CardComponent className={styles.challengeCard}>
                <div className={styles.challengeContent}>
                  <h5 className={styles.challengeTitle}>연속 달성</h5>
                  <div className={styles.challengeTarget}>{userStats?.consecutiveDays ?? 0} 일 연속</div>
                  <div className={styles.consecutiveDays}>
                    {[1,2,3,4,5,6,7].map((day) => (
                      <div 
                        key={day} 
                        className={`${styles.dayIndicator} ${day <= (userStats?.consecutiveDays ?? 0) ? styles.dayActive : ''}`}
                      ></div>
                    ))}
                  </div>
                  <div className={styles.motivationText}>
                    {userStats?.consecutiveDays === 0 ? "오늘부터 시작해보세요!" :
                     userStats?.consecutiveDays === 1 ? "첫 걸음을 내딛었어요!" :
                     userStats?.consecutiveDays === 2 ? "꾸준히 하고 있어요!" :
                     userStats?.consecutiveDays === 3 ? "습관이 만들어지고 있어요!" :
                     userStats?.consecutiveDays === 4 ? "정말 잘하고 있어요!" :
                     userStats?.consecutiveDays === 5 ? "완벽한 일주일이에요!" :
                     userStats?.consecutiveDays >= 6 ? "운동 마스터가 되었어요!" : "좋은 습관 유지 중!"}
                  </div>
                </div>
              </CardComponent>
            </Col>
            <Col md={4} className="mb-3">
              <CardComponent className={styles.challengeCard}>
                <div className={styles.challengeContent}>
                  <h5 className={styles.challengeTitle}>오늘 완료</h5>
                  <div className={styles.challengeTarget}>{todayCompletedCount}/3개 루틴</div>
                  <div className={styles.challengeProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ 
                        width: `${(todayCompletedCount / 3) * 100}%`, 
                        background: 'linear-gradient(90deg, #0A66FF, #3B82F6)' 
                      }}></div>
                    </div>
                    <span className={styles.progressText}>
                      {todayCompletedCount > 0 ? <span style={{ color: '#0A66FF', fontWeight: 500 }}>{todayCompletedCount}개 완료!</span> : <span style={{ color: '#0A66FF', fontWeight: 500 }}>오늘 운동을 시작해보세요</span>}
                    </span>
                  </div>
                </div>
              </CardComponent>
            </Col>
            <Col md={4} className="mb-3">
              <CardComponent className={styles.challengeCard}>
                <div className={styles.challengeContent}>
                  <h5 className={styles.challengeTitle}>총 시간</h5>
                  <div className={styles.challengeTarget}>{userStats?.totalTime ?? "0시간"}</div>
                  <div className={styles.challengeProgress}>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ 
                        width: userStats?.totalTime && userStats.totalTime !== "0시간" ? '100%' : '0%', 
                        background: 'linear-gradient(90deg, #0A66FF, #3B82F6)' 
                      }}></div>
                    </div>
                    <span className={styles.progressText}>
                      {userStats?.totalTime && userStats.totalTime !== "0시간" ? <span style={{ color: '#0A66FF', fontWeight: 500 }}>운동 완료!</span> : <span style={{ color: '#0A66FF', fontWeight: 500 }}>운동을 시작해보세요</span>}
                    </span>
                  </div>
                </div>
              </CardComponent>
            </Col>
          </Row>
        </Container>
      </section>

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

      <section className={styles.nutritionSection}>
        <Container>
          <h3 className={styles.sectionTitle}>영양 + 회복 정보</h3>
          <Row>
            <Col md={6} className="mb-3">
              <CardComponent 
                title="추천 음식"
                className={styles.nutritionCard}
              >
                <div className={styles.nutritionContent}>
                  {getRecommendationsByTime().foods.map((food, index) => (
                    <div key={index} className={styles.foodItemBox}>
                      <div className={styles.foodBullet}></div>
                      <div className={styles.foodContent}>
                        <div className={styles.foodName}>{food.name}</div>
                        <div className={styles.foodDescription}>{food.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardComponent>
            </Col>
            <Col md={6} className="mb-3">
              <CardComponent 
                title="회복 팁"
                className={styles.recoveryCard}
              >
                <div className={styles.recoveryContent}>
                  {getRecommendationsByTime().tips.map((tip, index) => (
                    <div key={index} className={styles.tipItemBox}>
                      <div className={styles.tipNumber}>{index + 1}</div>
                      <div className={styles.tipContent}>
                        <div className={styles.tipTitle}>{tip.title}</div>
                        <div className={styles.tipDescription}>{tip.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardComponent>
            </Col>
          </Row>
        </Container>
      </section>

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

      <section className={styles.newsSection}>
        <Container>
          <FitnessNewsFeed />
        </Container>
      </section>
    </ContainerComponent>
  );
};

export default Home;