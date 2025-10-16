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
  const { GET } = useApi();

  const fetchUserData = useCallback(async () => {
    setLoading(true);
    try {
      const statsRes = await fetch("/api/v1/users/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setUserStats(statsData);
      }

      const routinesRes = await fetch("/api/v1/users/routines");
      if (routinesRes.ok) {
        const routinesData = await routinesRes.json();
        setUserRoutines(Array.isArray(routinesData) ? routinesData : []);
      } else {
        setUserRoutines([]);
      }
    } catch (e) {
      console.warn("사용자 데이터 로딩 실패", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

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

  const startRoutine = async (routineId) => {
    try {
      const res = await fetch(`/api/v1/routine/${routineId}/start`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("루틴 시작 실패");
      setUserRoutines((prev) =>
        prev.map((r) => (r.id === routineId ? { ...r, completed: true } : r))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const stats = [
    {
      label: "연속 달성",
      value: `${userStats?.consecutiveDays ?? 9}일`,
      icon: FaFire,
      color: "#ff6b6b",
    },
    {
      label: "총 루틴",
      value: `${userStats?.totalRoutines ?? 0}개`,
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

  const completedCount = userRoutines.filter((r) => r.completed).length;
  const totalCount = userRoutines.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <ContainerComponent className={styles.home}>
      {/* Hero */}
      <section className={styles.hero}>
        <Container>
          <Row className="align-items-center">
            <Col md={7}>
              <h1 className={styles.heroTitle}>AI 맞춤형 헬스 루틴 추천 서비스</h1>
              <p className={styles.heroSub}>시간·컨디션·목표에 맞춰 루틴을 생성합니다.</p>
              <div className={styles.heroCtas}>
                <ButtonComponent
                  variant="primary"
                  size="large"
                  className={styles.startButton}
                  onClick={() => navigate("/routine")}
                >
                  <FaPlay className={styles.buttonIcon} />
                  시작하기
                </ButtonComponent>
              </div>
            </Col>
            <Col md={5} className="mt-4 mt-md-0">
              <div className={styles.heroStatsCard}>
                <Row>
                  {stats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <Col xs={4} key={index}>
                        <div className={styles.statCard}>
                          <IconComponent className={styles.statIcon} style={{ color: stat.color }} />
                          <div className={styles.statValue}>{stat.value}</div>
                          <div className={styles.statLabel}>{stat.label}</div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
                <div className={styles.progressWrap}>
                  <div className={styles.progressHeader}>
                    <span>오늘의 진행률</span>
                    <span className={styles.progressNum}>{completedCount}/{totalCount}</span>
                  </div>
                  <ProgressBar now={progressPercent} label={`${Math.round(progressPercent)}%`} className={styles.progressBar} />
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Why Section */}
      <section className={styles.whySection}>
        <Container>
          <Row className="align-items-stretch">
            <Col md={6} className="d-flex">
              <h3 className={styles.sectionTitleLeft}>왜 다듬인가?</h3>
              <div className={styles.whyList}>
                {["AI 루틴 자동 추천", "세트·휴식·중량까지 설정", "연계/저장형 시스템", "지도 없이도 쉬운 접근성"].map((t, i) => (
                  <div key={i} className={styles.whyItem}>
                    <FaCheckCircle className={styles.whyIcon} />
                    <span>{t}</span>
                  </div>
                ))}
              </div>
            </Col>
            <Col md={6} className="mt-4 mt-md-0 d-flex">
              <CardComponent 
                className={styles.tipCard} 
                title="오늘의 팁" 
                details=""
                buttonText=""
                onClick={null}
              >
                <div className={styles.tipBody}>{dailyTip}</div>
              </CardComponent>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Testimonials */}
      <section className={styles.testimonialSection}>
        <Container>
          <h3 className={styles.sectionTitleSm}>What Our Clients Say</h3>
          <Row>
            {[
              { stars: 5, text: "루틴 추천이 생각보다 정교해서 따라하기 쉽고, 시간 대비 효율이 좋아요.", author: "김OO / 직장인" },
              { stars: 5, text: "운동 초보인데도 세트·휴식까지 자동으로 맞춰줘서 성취감이 생겼습니다.", author: "이OO / 대학생" },
            ].map((r, i) => (
              <Col md={6} className="mb-3" key={i}>
                <div className={styles.testimonialCard}>
                  <div className={styles.stars}>{"★★★★★".slice(0, r.stars)}</div>
                  <p className={styles.reviewText}>{r.text}</p>
                  <div className={styles.reviewAuthor}>{r.author}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Quick Routines */}
      <section className={styles.quickRoutines}>
        <Container>
          <div className={styles.sectionHeaderRow}>
            <h3 className={styles.sectionTitle}>빠른 루틴</h3>
            {totalCount > 0 && (
              <ButtonComponent variant="outline" size="sm" onClick={() => navigate("/routine")}>모든 루틴 보기</ButtonComponent>
            )}
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

          {!loading && totalCount === 0 && (
            <Row>
              <Col xs={12} className="mb-3">
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

          {!loading && totalCount > 0 && (
            <Row>
              {userRoutines.map((routine) => (
                <Col key={routine.id} lg={4} md={6} className="mb-3">
                  <CardComponent
                    title={routine.title}
                    details={routine.time || ""}
                    className={styles.routineCard}
                    onClick={() => startRoutine(routine.id)}
                  >
                    <div className={styles.routineHeader}>
                      {routine.icon && <span className={styles.routineIcon}>{routine.icon}</span>}
                      <Badge
                        bg={
                          routine.completed ? "success" : routine.difficulty === "쉬움" ? "success" : "warning"
                        }
                        className={styles.difficultyBadge}
                      >
                        {routine.completed ? "완료" : routine.difficulty || "진행"}
                      </Badge>
                    </div>

                    <h5 className={styles.routineTitle}>{routine.title}</h5>

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

          {totalCount > 0 && (
            <CardComponent className={styles.todayGoal} title="오늘의 목표" details={`${completedCount}/${totalCount} 루틴 완료`} />
          )}
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