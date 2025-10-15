import React from "react";
import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import {
  FaClock,
  FaFire,
  FaDumbbell,
  FaChartBar,
  FaRedoAlt,
  FaBolt,
  FaTrophy,
} from "react-icons/fa";
import styles from "./RoutineResultModal.module.css";

export default function RoutineResultModal({
  isOpen,
  onClose,
  workoutData,
  routineName,
}) {
  if (!workoutData) return null;

  const { routineEndDetails, routineResult } = workoutData;

  // 시간 포맷팅 (초 -> 시:분:초)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}시간 ${m}분 ${s}초`;
    }
    return `${m}분 ${s}초`;
  };

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          운동 완료! <FaTrophy style={{ color: "#ffd700" }} />
        </div>
      }
      subtitle={routineName}
      size={ModalComponent.SIZES.LARGE}
      footer={
        <ModalComponent.Actions>
          <ButtonComponent variant="primary" onClick={onClose}>
            확인
          </ButtonComponent>
        </ModalComponent.Actions>
      }
    >
      <div className={styles.container}>
        {/* 전체 통계 */}
        <div className={styles.summarySection}>
          <h3 className={styles.sectionTitle}>운동 결과</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaClock />
              </div>
              <div className={styles.statValue}>
                {formatTime(routineResult.rouTime)}
              </div>
              <div className={styles.statLabel}>총 운동시간</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaFire />
              </div>
              <div className={styles.statValue}>{routineResult.kcal}</div>
              <div className={styles.statLabel}>소모 칼로리 (kcal)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaDumbbell />
              </div>
              <div className={styles.statValue}>{routineResult.volum}</div>
              <div className={styles.statLabel}>운동 볼륨</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaChartBar />
              </div>
              <div className={styles.statValue}>{routineResult.setNum}</div>
              <div className={styles.statLabel}>총 세트수</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaRedoAlt />
              </div>
              <div className={styles.statValue}>{routineResult.reSet}</div>
              <div className={styles.statLabel}>총 반복횟수</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <FaBolt />
              </div>
              <div className={styles.statValue}>{routineResult.muscle}</div>
              <div className={styles.statLabel}>근육 자극량</div>
            </div>
          </div>
        </div>

        {/* 운동별 세부사항 */}
        <div className={styles.detailSection}>
          <h3 className={styles.sectionTitle}>운동별 상세</h3>
          <div className={styles.exerciseList}>
            {routineEndDetails.map((exercise, index) => (
              <div key={index} className={styles.exerciseCard}>
                <div className={styles.exerciseName}>{exercise.srName}</div>
                <div className={styles.exerciseStats}>
                  <div className={styles.exerciseStat}>
                    <span className={styles.exerciseStatLabel}>세트</span>
                    <span className={styles.exerciseStatValue}>
                      {exercise.setNumber}
                    </span>
                  </div>
                  <div className={styles.exerciseStat}>
                    <span className={styles.exerciseStatLabel}>반복</span>
                    <span className={styles.exerciseStatValue}>
                      {exercise.reps}
                    </span>
                  </div>
                  <div className={styles.exerciseStat}>
                    <span className={styles.exerciseStatLabel}>무게(kg)</span>
                    <span className={styles.exerciseStatValue}>
                      {exercise.weight}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ModalComponent>
  );
}
