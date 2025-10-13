import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Badge } from "react-bootstrap";
import ContainerComponent from "../../common/ContainerComponent";
import { FaPlay, FaClock, FaStar, FaFire } from "react-icons/fa";
import styles from "./Home.module.css";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";
import FitnessNewsFeed from "../News/FitnessNewsFeed";
import { POST } from "../../../utils/api/api";
const Home = () => {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    consecutiveDays: 0,
    totalRoutines: 0,
    totalTime: "0시간",
  });
  const [userRoutines, setUserRoutines] = useState([]);
  const [loading, setLoading] = useState(false);

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
      console.warn("사용자 데이터 로딩 실패. 더미 데이터 사용", e);
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
  const progressPercent =
    totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <ContainerComponent className={styles.home}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h1 className={styles.welcomeTitle}>안녕하세요! 👋</h1>
        <p className={styles.welcomeSubtitle}>오늘도 루틴을 완성해보세요</p>
        <ButtonComponent
          variant="primary"
          size="lg"
          className={styles.startButton}
          onClick={() => navigate("/routine")}
        >
          <FaPlay className={styles.buttonIcon} />
          루틴 시작하기
        </ButtonComponent>
      </div>

      {/* Stats Section */}
      <Row className={styles.statsSection}>
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Col key={index} xs={4}>
              <div className={styles.statCard}>
                <IconComponent
                  className={styles.statIcon}
                  style={{ color: stat.color }}
                />
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            </Col>
          );
        })}
      </Row>

      {/* Quick Routines */}
      <div className={styles.quickRoutines}>
        <h3 className={styles.sectionTitle}>빠른 루틴</h3>
        <Row>
          {totalCount === 0 && !loading && (
            <Col xs={12} className="mb-3">
              <CardComponent
                title="등록된 루틴이 없습니다"
                details=""
                className={styles.routineCard}
                buttonText="등록"
                onClick={() => navigate("/routine")}
              />
            </Col>
          )}
          {userRoutines.map((routine) => (
            <Col key={routine.id} lg={4} md={6} className="mb-3">
              <CardComponent
                title={routine.title}
                details={routine.time || ""}
                className={styles.routineCard}
                onClick={() => startRoutine(routine.id)}
              >
                <div className={styles.routineHeader}>
                  {routine.icon && (
                    <span className={styles.routineIcon}>{routine.icon}</span>
                  )}
                  <Badge
                    bg={
                      routine.completed
                        ? "success"
                        : routine.difficulty === "쉬움"
                        ? "success"
                        : "warning"
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
                <div className="mt-3">
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
      </div>

      {/* Today's Goal */}
      {totalCount > 0 && (
        <CardComponent
          className={styles.todayGoal}
          title="오늘의 목표"
          details={`${completedCount}/${totalCount} 루틴 완료`}
          buttonText=""
        />
      )}

      {/* News Section */}
      <div className={styles.newsSection}>
        <FitnessNewsFeed />
      </div>
    </ContainerComponent>
  );
};

export default Home;
