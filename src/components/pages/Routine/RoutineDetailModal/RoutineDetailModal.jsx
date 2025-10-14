import React, { useState, useEffect, useRef, useContext } from "react";
import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import InputComponent from "../../../common/InputComponent";
import ExerciseSelectModal from "../ExerciseSelectModal/ExerciseSelectModal";
import RoutineResultModal from "../RoutineResultModal/RoutineResultModal";
import styles from "./RoutineDetailModal.module.css";
import ExerciseSetRow from "./ExerciseSetRow/ExerciseSetRow";
import { FaPlus, FaTrash, FaCheck, FaPause, FaPlay } from "react-icons/fa";
import {
  engKorDict,
  korEngDict,
  categoryKorDict,
  levelKorDict,
  primaryMuscleKorDict,
  equipmentKorDict,
} from "../../../data/translation";
import { RunContext } from "../../../../context/RunContext";
import { useApi } from "../../../../utils/api/useApi";
import { useModal } from "../../../../context/ModalContext";
import TotalTimer from "../../../common/TotalTimer";
export default function RoutineDetailModal({
  routine,
  exercises,
  isModalOpen,
  handleDetailModalClose,
  getRoutines,
  getExercises,
}) {
  const [workoutData, setWorkoutData] = useState([]);
  const workoutDataRef = useRef(null);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [workoutResult, setWorkoutResult] = useState(null);
  const [isExerciseSelectModalOpen, setIsExerciseSelectModalOpen] =
    useState(false);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const { PUT, POST } = useApi();
  const { showConfirmModal, closeModal } = useModal();
  const {
    isRunning,
    setId,
    usePause,
    isPaused,
    useResume,
    useComplete,
    startTime,
  } = useContext(RunContext);
  const [runningSet, setRunningSet] = useState(null);
  const [isRest, setIsRest] = useState(false);
  const [doneSets, setDoneSets] = useState([]);
  const [doneExercises, setDoneExercises] = useState([]);
  const [doneRoutine, setDoneRoutine] = useState(false);
  const [setIdx, setSetIdx] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  useEffect(() => {
    if (!isModalOpen || !routine) return;
    const INITIAL_WORKOUT_DATA = {
      title: routine?.routineName,
      setId: routine?.setId,
      usersId: routine?.usersId,
      totalTime: "50분",
      totalSets: "15세트",
      estimatedCalories: "400kcal",
      exercises: routine?.saveRoutineDto
        .map((exercise) => {
          return {
            id: exercise.srId,
            name: engKorDict[exercise.srName],
            category: engKorDict[exercise.srName],
            sets: exercise.set.map((set, i) => {
              return {
                id: i,
                srsId: set.srsId,
                reps: 0,
                weight: set.weight,
                many: set.many,
                rest: set.rest,
              };
            }),
          };
        })
        .sort((a, b) => a.id - b.id),
    };
    setWorkoutExercises(
      INITIAL_WORKOUT_DATA.exercises.map(
        (exercise) => korEngDict[exercise.name]
      )
    );
    setWorkoutData(INITIAL_WORKOUT_DATA);
    workoutDataRef.current = INITIAL_WORKOUT_DATA;
    setDoneRoutine(false);
  }, [isModalOpen, routine]);

  useEffect(() => {
    if (isRunning && setId === routine?.setId) {
      setRunningSet(workoutDataRef.current.exercises[0].sets[0]);
    }
  }, [isRunning, routine]);

  useEffect(() => {
    if (workoutExercises.length > 0) {
      setWorkoutData((prev) => {
        const updatedData = {
          ...prev,
          exercises: prev.exercises
            .filter((exercise) =>
              workoutExercises.includes(korEngDict[exercise.name])
            )
            .concat(
              workoutExercises
                .filter(
                  (exercise) =>
                    !prev.exercises.some((e) => {
                      return e.name === engKorDict[exercise];
                    })
                )
                .map((exercise) => {
                  console.log(exercise);
                  return {
                    id: Date.now() + Math.random(), // 임시 고유 ID
                    name: engKorDict[exercise],
                    category: engKorDict[exercise],
                    sets: [
                      {
                        id: 0,
                        srsId: null,
                        weight: 0,
                        many: 0,
                        rest: 0,
                      },
                    ],
                  };
                })
            ),
        };
        workoutDataRef.current = updatedData;
        return updatedData;
      });
    }
  }, [workoutExercises]);

  // 다음 세트 설정
  const setNextSet = () => {
    setIsRest(false);
    const currentExerciseIndex = workoutDataRef.current.exercises.findIndex(
      (exercise) => exercise.sets.includes(runningSet)
    );

    if (currentExerciseIndex === -1) return;

    const currentExercise =
      workoutDataRef.current.exercises[currentExerciseIndex];
    const currentSetIndex = currentExercise.sets.findIndex(
      (set) => set === runningSet
    );
    const nextSet = currentExercise.sets[currentSetIndex + 1];
    const nextExercise =
      workoutDataRef.current.exercises[currentExerciseIndex + 1];

    if (nextSet) {
      // 같은 운동의 다음 세트
      setDoneSets([...doneSets, runningSet]);
      setRunningSet(nextSet);
      setSetIdx(currentSetIndex + 1);
    } else if (nextExercise) {
      // 다음 운동의 첫 번째 세트
      setDoneSets([...doneSets, runningSet]);
      setDoneExercises([...doneExercises, currentExercise]);
      setRunningSet(nextExercise.sets[0]);
      setSetIdx(0);
      setExerciseIdx(currentExerciseIndex + 1);
    } else {
      // 마지막 운동의 마지막 세트
      setDoneSets([...doneSets, runningSet]);
      setDoneExercises([...doneExercises, currentExercise]);
      setRunningSet(null);
      setDoneRoutine(true);
    }
  };
  const setNextExercise = () => {
    const currentExerciseIndex = workoutDataRef.current.exercises.findIndex(
      (exercise) => exercise.sets.includes(runningSet)
    );

    if (currentExerciseIndex === -1) return;

    const currentExercise =
      workoutDataRef.current.exercises[currentExerciseIndex];
    const nextExercise =
      workoutDataRef.current.exercises[currentExerciseIndex + 1];

    if (nextExercise) {
      setDoneExercises([...doneExercises, currentExercise]);
      setRunningSet(nextExercise.sets[0]);
      setSetIdx(0);
      setExerciseIdx(currentExerciseIndex + 1);
    } else {
      // 마지막 운동
      setDoneExercises([...doneExercises, currentExercise]);
      setRunningSet(null);
      setDoneRoutine(true);
      setExerciseIdx(0);
      setSetIdx(0);
    }
  };
  const setRest = (rest) => {
    setIsRest(rest);
  };

  useEffect(() => {
    console.log(isRest);
  }, [isRest]);
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
                    <React.Fragment key={ex.id}>
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
                    </React.Fragment>
                  );
                })}
            </div>
            <div className={styles["exercise-buttons"]}>
              {!(isRunning && setId === routine.setId) ? (
                <ButtonComponent
                  variant="outline"
                  onClick={() => {
                    addSet(exercise.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <FaPlus />
                  {window.innerWidth >= 768 ? "추가" : ""}
                </ButtonComponent>
              ) : (
                <ButtonComponent
                  variant="primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                  onClick={() => {
                    setNextExercise();
                    setDoneExercises([...doneExercises, exercise]);
                  }}
                >
                  <FaCheck />
                  {window.innerWidth >= 768 ? "완료" : ""}
                </ButtonComponent>
              )}
              {!(isRunning && setId === routine.setId) ? (
                <ButtonComponent
                  variant="secondary"
                  onClick={() => {
                    showConfirmModal(
                      "운동을 삭제하시겠습니까?",
                      "운동 삭제",
                      "",
                      () => {
                        deleteExercise(exercise.id);
                        closeModal();
                      },
                      true
                    );
                  }}
                  style={{
                    backgroundColor: "red",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                >
                  <FaTrash />
                  {window.innerWidth >= 768 ? "삭제" : ""}
                </ButtonComponent>
              ) : isPaused ? (
                <ButtonComponent
                  variant="secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                  onClick={() => {
                    useResume();
                  }}
                >
                  <FaPlay />
                  {window.innerWidth >= 768 ? "재개" : ""}
                </ButtonComponent>
              ) : (
                <ButtonComponent
                  variant="secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                  }}
                  onClick={() => {
                    usePause();
                  }}
                >
                  <FaPause />
                  {window.innerWidth >= 768 ? "일시정지" : ""}
                </ButtonComponent>
              )}
            </div>
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
        <span>{!(isRunning && setId === routine.setId) ? "삭제" : "완료"}</span>
      </div>
    );

    // 운동 세트들 렌더링
    const renderExerciseSets = () => {
      return (
        <div className={styles["exercise-sets"]}>
          {renderSetsHeader()}
          {exercise.sets?.map((set, idx) => {
            return (
              <ExerciseSetRow
                key={idx}
                idx={idx}
                set={set}
                runningSet={runningSet}
                exerciseId={exercise.id}
                workoutDataRef={workoutDataRef}
                setNextSet={setNextSet}
                setRest={setRest}
                isRest={isRest}
                deleteSet={deleteSet}
                doneSets={doneSets}
                isPaused={isPaused}
              />
            );
          })}
        </div>
      );
    };
    return (
      <div
        key={exercise.id}
        className={styles["exercise-card"]}
        disabled={doneExercises.includes(exercise)}
        style={{
          opacity: doneExercises.includes(exercise) ? 0.5 : 1,
          cursor: doneExercises.includes(exercise) ? "not-allowed" : "pointer",
        }}
      >
        {renderExerciseHeader()}
        {renderExerciseSets()}
      </div>
    );
  };

  const renderWorkoutSummary = () => {
    return (
      <>
        {!(isRunning && setId === routine?.setId) ? (
          <div className={styles["workout-summary"]}>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-label"]}>총 운동 시간</div>
              <div className={styles["summary-value"]}>
                {workoutData.totalTime}
              </div>
            </div>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-label"]}>총 세트 수</div>
              <div className={styles["summary-value"]}>
                {workoutData.totalSets}
              </div>
            </div>
            <div className={styles["summary-card"]}>
              <div className={styles["summary-label"]}>예상 칼로리</div>
              <div className={styles["summary-value"]}>
                {workoutData.estimatedCalories}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
              padding: "20px",
            }}
          >
            총 운동시간
            <TotalTimer type="DETAIL" size="40px" />
          </div>
        )}
      </>
    );
  };

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
    //추가하기 전 ref 동기화
    setWorkoutData(workoutDataRef.current);
    setWorkoutData((prev) => {
      const updatedData = {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [
                  ...exercise.sets,
                  {
                    id: exercise.sets.length,
                    reps: 0,
                    weight: 0,
                    rest: 0,
                    many: 0,
                  },
                ],
              }
            : exercise
        ),
      };

      // ref도 동일한 데이터로 업데이트
      workoutDataRef.current = updatedData;

      return updatedData;
    });
  };
  const deleteExercise = (exerciseId) => {
    setWorkoutData((prev) => {
      const updatedData = {
        ...prev,
        exercises: prev.exercises.filter(
          (exercise) => exercise.id !== exerciseId
        ),
      };
      workoutDataRef.current = updatedData;
      return updatedData;
    });
    setWorkoutExercises((prev) => {
      return prev.filter(
        (exercise) =>
          exercise !==
          korEngDict[
            workoutData.exercises.find((e) => e.id === exerciseId).name
          ]
      );
    });
  };

  const deleteSet = (setId, exerciseId) => {
    setWorkoutData((prev) => {
      const updatedData = {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: exercise.sets.filter((set) => set.id !== setId),
              }
            : exercise
        ),
      };

      // ref도 동일한 데이터로 업데이트
      workoutDataRef.current = updatedData;

      return updatedData;
    });
  };

  const handleSaveWorkout = async () => {
    // 필요시 외부로 저장 이벤트를 전달하도록 확장 가능
    console.log("workoutDataRef.current", workoutDataRef.current);
    const updateWorkoutData = {
      setId: workoutDataRef.current.setId,
      routineName: workoutDataRef.current.title,
      usersId: workoutDataRef.current.usersId,
      saveRoutineDto: workoutDataRef.current.exercises.map((exercise) => {
        return {
          srName: korEngDict[exercise.name],
          srId: exercise.id ? exercise.id : null,
          reps: exercise.reps,
          set: exercise.sets.map((set) => {
            if (set.srsId) {
              return {
                srsId: set.srsId,
                weight: set.weight,
                many: set.many,
                rest: set.rest,
              };
            } else {
              return {
                weight: set.weight,
                many: set.many,
                rest: set.rest,
              };
            }
          }),
        };
      }),
    };
    await PUT(
      `/routine/${workoutDataRef.current.setId}/update`,
      updateWorkoutData
    ).then((res) => {
      console.log(res.data);
      setIsCompleteModalOpen(true);
    });
  };

  const handleDoneWorkout = async () => {
    useComplete();
    const exercises = workoutDataRef.current.exercises;

    // 총 세트수
    const totalSets = exercises.reduce(
      (total, exercise) => total + exercise.sets.length,
      0
    );

    // 총 운동횟수 (모든 세트의 reps 합)
    const totalReps = exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((sum, set) => sum + (set.many || 0), 0),
      0
    );

    // 총 무게 (모든 세트의 weight 합)
    const totalWeight = exercises.reduce(
      (total, exercise) =>
        total + exercise.sets.reduce((sum, set) => sum + (set.weight || 0), 0),
      0
    );

    // 운동 볼륨 (weight × reps의 총합)
    const totalVolume = exercises.reduce(
      (total, exercise) =>
        total +
        exercise.sets.reduce(
          (sum, set) => sum + (set.weight || 0) * (set.many || 0),
          0
        ),
      0
    );

    // 총 운동시간 (초 단위) - 현재 시간으로 직접 계산
    const currentEndTime = Date.now();
    const totalTime = currentEndTime - startTime; // 밀리초를 초로 변환하려면 / 1000

    // 소모 칼로리 (시간 + 볼륨 기반 계산)
    // 시간 기반: 초당 약 0.067 kcal 소모 (분당 4kcal / 60초)
    // 볼륨 기반: 1kg 들어올림당 약 0.01 kcal
    const timeBasedKcal = (totalTime / 1000) * 0.067;
    const volumeBasedKcal = totalVolume * 0.01;
    const estimatedKcal = Math.round(timeBasedKcal + volumeBasedKcal);

    const formatToLocalDateTime = (timestamp) => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const completeWorkoutData = {
      routineEndDetails: workoutDataRef.current.exercises.map((exercise) => {
        return {
          srName: exercise.name,
          setNumber: exercise.sets.length,
          reps: exercise.sets.reduce((acc, set) => acc + set.many, 0),
          weight: exercise.sets.reduce((acc, set) => acc + set.weight, 0),
        };
      }),
      routineResult: {
        muscle: Math.round(totalVolume * 0.7),
        kcal: estimatedKcal,
        reSet: totalSets,
        setNum: totalSets,
        volum: totalVolume,
        rouTime: Math.round(totalTime / 1000),
        exVolum: totalVolume,
      },
      tStart: formatToLocalDateTime(startTime),
      tEnd: formatToLocalDateTime(currentEndTime),
    };
    await POST(
      `/routine/${workoutDataRef.current.setId}/result`,
      completeWorkoutData
    ).then((res) => {
      console.log(res.data);
      setWorkoutResult(completeWorkoutData);
      setIsResultModalOpen(true);
    });
  };

  // 저장 완료 모달 푸터
  const completeModalFooter = () => {
    return (
      <ModalComponent.Actions>
        <ButtonComponent variant="primary" onClick={closeCompleteModal}>
          확인
        </ButtonComponent>
      </ModalComponent.Actions>
    );
  };
  // 저장 완료 모달 닫기
  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
    handleDetailModalClose();
    getRoutines();
  };

  // 결과 모달 닫기
  const closeResultModal = () => {
    setIsResultModalOpen(false);
    setWorkoutResult(null);
    handleDetailModalClose();
    getRoutines();
  };

  return (
    <>
      <ModalComponent
        isOpen={isModalOpen}
        onClose={() => handleDetailModalClose()}
        title={routine?.routineName}
        subtitle="운동 상세 정보"
        size={ModalComponent.SIZES.LARGE}
        variant={ModalComponent.VARIANTS.ELEVATED}
        footer={
          <ModalComponent.Actions>
            {isRunning && setId === routine?.setId ? (
              <ButtonComponent
                variant="primary"
                onClick={handleDoneWorkout}
                disabled={!doneRoutine}
              >
                완료
              </ButtonComponent>
            ) : (
              <ButtonComponent variant="primary" onClick={handleSaveWorkout}>
                저장
              </ButtonComponent>
            )}
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
            onClick={() => {
              setIsExerciseSelectModalOpen(true);
            }}
            style={{ width: "100%" }}
          >
            운동 추가
          </ButtonComponent>
        </div>
      </ModalComponent>
      <ModalComponent
        isOpen={isCompleteModalOpen}
        onClose={closeCompleteModal}
        title="권한 변경 완료"
        size="small"
        footer={completeModalFooter()}
      >
        <div>수정된 루틴을 저장했습니다.</div>
      </ModalComponent>
      <RoutineResultModal
        isOpen={isResultModalOpen}
        onClose={closeResultModal}
        workoutData={workoutResult}
        routineName={routine?.routineName}
      />
      <ExerciseSelectModal
        isModalOpen={isExerciseSelectModalOpen}
        setIsModalOpen={setIsExerciseSelectModalOpen}
        routineExercises={workoutExercises}
        setRoutineExercises={setWorkoutExercises}
        getExercises={getExercises}
      />
    </>
  );
}
