import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Badge, ProgressBar } from "react-bootstrap";
import ContainerComponent from "../../common/ContainerComponent";
import { FaPlay, FaClock, FaStar, FaFire, FaCheckCircle } from "react-icons/fa";
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
  const { GET } = useApi();

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
  }, [fetchUserData]);

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
            <Row>
              {userRoutines.slice(0, 3).map((routine) => (
                <Col key={routine.id} lg={4} md={6} className="mb-3">
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
                </Col>
              ))}
            </Row>
          )}
        </Container>
      </section>

      {/* Tip Section */}
      <section className={styles.tipSection}>
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={8} className="mb-3">
              <h3 className={styles.sectionTitleCenter}>오늘의 팁</h3>
              <div className={styles.tipCard}>
                <div className={styles.tipBody}>{dailyTip}</div>
              </div>
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