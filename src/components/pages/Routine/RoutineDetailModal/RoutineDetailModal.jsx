import React, { useState, useEffect, useRef } from "react";
import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import InputComponent from "../../../common/InputComponent";
import styles from "./RoutineDetailModal.module.css";
import ExerciseSetRow from "./ExerciseSetRow/ExerciseSetRow";
import { FaPlus } from "react-icons/fa";
import {
  engKorDict,
  categoryKorDict,
  levelKorDict,
  primaryMuscleKorDict,
  equipmentKorDict,
} from "../../../data/translation";

export default function RoutineDetailModal({
  routine,
  exercises,
  isModalOpen,
  handleDetailModalClose,
}) {
  const [workoutData, setWorkoutData] = useState([]);
  const workoutDataRef = useRef(null);
  useEffect(() => {
    if (!isModalOpen || !routine) return;
    console.log(routine);
    const INITIAL_WORKOUT_DATA = {
      title: routine?.routineName,
      totalTime: "50분",
      totalSets: "15세트",
      estimatedCalories: "400kcal",
      exercises: routine?.saveRoutineDto.map((exercise) => {
        return {
          id: exercise.srId,
          name: engKorDict[exercise.srName],
          category: engKorDict[exercise.srName],
          sets: exercise.set.map((set) => {
            return {
              srsId: set.srsId,
              reps: 0,
              weight: set.weight,
              many: set.many,
              rest: 0,
            };
          }),
        };
      }),
    };
    setWorkoutData(INITIAL_WORKOUT_DATA);
    workoutDataRef.current = INITIAL_WORKOUT_DATA;
  }, [isModalOpen, routine]);

  useEffect(() => {
    console.log("workoutDataRef.current", workoutDataRef.current);
  }, [workoutDataRef.current]);
  // 운동 카드 렌더링 컴포넌트
  const ExerciseCard = ({ exercise, onSetChange }) => {
    // 운동 헤더 렌더링
    const renderExerciseHeader = () => {
      return (
        <div className={styles["exercise-header"]}>
          <div className={styles["exercise-name"]}>{exercise.name}</div>
          <div className={styles["exercise-content"]}>
            <div className={styles["exercise-categories"]}>
              {exercises
                .filter((ex) => engKorDict[ex.name] === exercise.name)
                .map((ex) => {
                  return (
                    <>
                      {ex.category && (
                        <div className={styles["exercise-category"]}>
                          #{categoryKorDict[ex.category]}
                        </div>
                      )}
                      {ex.level && (
                        <div className={styles["exercise-category"]}>
                          #{levelKorDict[ex.level]}
                        </div>
                      )}
                      {ex.primaryMuscle && (
                        <div className={styles["exercise-category"]}>
                          #{primaryMuscleKorDict[ex.primaryMuscle]}
                        </div>
                      )}
                      {ex.equipment && (
                        <div className={styles["exercise-category"]}>
                          #{equipmentKorDict[ex.equipment]}
                        </div>
                      )}
                    </>
                  );
                })}
            </div>
            <ButtonComponent
              variant="outline"
              onClick={() => {
                addSet(exercise.id);
              }}
            >
              <FaPlus />
              추가
            </ButtonComponent>
          </div>
        </div>
      );
    };

    // 세트 헤더 렌더링
    const renderSetsHeader = () => (
      <div className={styles["sets-header"]}>
        <span>세트</span>
        <span>횟수</span>
        <span>중량(kg)</span>
        <span>휴식(초)</span>
        <span>삭제</span>
      </div>
    );

    // 운동 세트들 렌더링
    const renderExerciseSets = () => (
      <div className={styles["exercise-sets"]}>
        {renderSetsHeader()}
        {exercise.sets?.map((set, idx) => {
          console.log(idx);
          return (
            <ExerciseSetRow
              key={idx}
              idx={idx}
              set={set}
              exerciseId={exercise.id}
              workoutDataRef={workoutDataRef}
              deleteSet={deleteSet}
            />
          );
        })}
      </div>
    );
    return (
      <div key={exercise.id} className={styles["exercise-card"]}>
        {renderExerciseHeader()}
        {renderExerciseSets()}
      </div>
    );
  };

  const renderWorkoutSummary = () => (
    <div className={styles["workout-summary"]}>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>총 운동 시간</div>
        <div className={styles["summary-value"]}>{workoutData.totalTime}</div>
      </div>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>총 세트 수</div>
        <div className={styles["summary-value"]}>{workoutData.totalSets}</div>
      </div>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>예상 칼로리</div>
        <div className={styles["summary-value"]}>
          {workoutData.estimatedCalories}
        </div>
      </div>
    </div>
  );

  const renderWorkoutExercises = () => (
    <div className={styles["workout-exercises"]}>
      {workoutData.exercises?.map((exercise) => (
        <ExerciseCard key={exercise.id} exercise={exercise} />
      ))}
    </div>
  );

  const renderWorkoutModalContent = () => (
    <div className={styles["workout-detail-modal"]}>
      {renderWorkoutSummary()}
      {renderWorkoutExercises()}
    </div>
  );

  const addSet = (exerciseId) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [...exercise.sets, { id: exercise.id, sets: [] }],
            }
          : exercise
      ),
    }));
    setWorkoutDataRef((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: [...exercise.sets, { id: exercise.id, sets: [] }],
            }
          : exercise
      ),
    }));
  };
  const deleteSet = (setId, exerciseId) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      ),
    }));
    setWorkoutDataRef((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise
      ),
    }));
  };

  const handleSaveWorkout = () => {
    // 필요시 외부로 저장 이벤트를 전달하도록 확장 가능
    setIsModalOpen(false);
  };

  return (
    <ModalComponent
      isOpen={isModalOpen}
      onClose={() => handleDetailModalClose()}
      title={routine?.routineName}
      subtitle="운동 상세 정보"
      size={ModalComponent.SIZES.LARGE}
      variant={ModalComponent.VARIANTS.ELEVATED}
      footer={
        <ModalComponent.Actions>
          <ButtonComponent variant="primary" onClick={handleSaveWorkout}>
            저장
          </ButtonComponent>
          <ButtonComponent
            variant="secondary"
            onClick={() => handleDetailModalClose()}
          >
            취소
          </ButtonComponent>
        </ModalComponent.Actions>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {renderWorkoutModalContent()}
        <ButtonComponent
          variant="outline"
          size="large"
          onClick={() => {}}
          style={{ width: "100%" }}
        >
          운동 추가
        </ButtonComponent>
      </div>
    </ModalComponent>
  );
}
