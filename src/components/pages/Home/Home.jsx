import React from "react";
import { Container, Row, Col, Badge } from "react-bootstrap";
import ContainerComponent from "../../common/ContainerComponent";
import { FaPlay, FaClock, FaStar, FaFire } from "react-icons/fa";
import styles from "./Home.module.css";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";

const Home = () => {
  const quickRoutines = [
    { id: 1, title: "아침 루틴", time: "15분", difficulty: "쉬움", icon: "🌅" },
    { id: 2, title: "운동 루틴", time: "30분", difficulty: "보통", icon: "💪" },
    { id: 3, title: "저녁 루틴", time: "20분", difficulty: "쉬움", icon: "🌙" },
  ];

  const stats = [
    { label: "연속 달성", value: "7일", icon: FaFire, color: "#ff6b6b" },
    { label: "총 루틴", value: "12개", icon: FaStar, color: "#ffd93d" },
    { label: "총 시간", value: "8.5시간", icon: FaClock, color: "#6c5ce7" },
  ];

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
          {quickRoutines.map((routine) => (
            <Col key={routine.id} lg={4} md={6} className="mb-3">
              <CardComponent
                variant="primary"
                className={styles.routineCard}
                onClick={() => console.log(`루틴 ${routine.id} 클릭`)}
              >
                <div className={styles.routineHeader}>
                  <span className={styles.routineIcon}>{routine.icon}</span>
                  <Badge
                    bg={routine.difficulty === "쉬움" ? "success" : "warning"}
                    className={styles.difficultyBadge}
                  >
                    {routine.difficulty}
                  </Badge>
                </div>
                <h5 className={styles.routineTitle}>{routine.title}</h5>
                <div className={styles.routineTime}>
                  <FaClock className={styles.timeIcon} />
                  {routine.time}
                </div>
              </CardComponent>
            </Col>
          ))}
        </Row>
      </div>

      {/* Today's Goal */}
      <CardComponent variant="success" className={styles.todayGoal}>
        <h4>오늘의 목표</h4>
        <div className={styles.goalProgress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: "75%" }}></div>
          </div>
          <span className={styles.progressText}>3/4 루틴 완료</span>
        </div>
      </CardComponent>
    </ContainerComponent>
  );
};

export default Home;
