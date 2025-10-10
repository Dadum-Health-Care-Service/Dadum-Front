import React, { useState, useEffect, useRef } from "react";
import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import InputComponent from "../../../common/InputComponent";
import ExerciseSelectModal from "../ExerciseSelectModal/ExerciseSelectModal";
import styles from "./RoutineDetailModal.module.css";
import ExerciseSetRow from "./ExerciseSetRow/ExerciseSetRow";
import { FaPlus, FaTrash } from "react-icons/fa";
import {
  engKorDict,
  korEngDict,
  categoryKorDict,
  levelKorDict,
  primaryMuscleKorDict,
  equipmentKorDict,
} from "../../../data/translation";
import { useApi } from "../../../../utils/api/useApi";
import { useModal } from "../../../../context/ModalContext";
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
  const [isExerciseSelectModalOpen, setIsExerciseSelectModalOpen] = useState(false);
  const [workoutExercises, setWorkoutExercises] = useState([]);
  const { PUT } = useApi();
  const { showConfirmModal, closeModal} = useModal();
  
  useEffect(() => {
    if (!isModalOpen || !routine) return;
    console.log(routine);
    const INITIAL_WORKOUT_DATA = {
      title: routine?.routineName,
      setId: routine?.setId,
      usersId: routine?.usersId,
      totalTime: "50분",
      totalSets: "15세트",
      estimatedCalories: "400kcal",
      exercises: routine?.saveRoutineDto.map((exercise) => {
        return {
          id: exercise.srId,
          name: engKorDict[exercise.srName],
          category: engKorDict[exercise.srName],
          sets: exercise.set.map((set,i) => {
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
      }),
    };
    setWorkoutExercises(INITIAL_WORKOUT_DATA.exercises.map(exercise => korEngDict[exercise.name]));
    setWorkoutData(INITIAL_WORKOUT_DATA);
    workoutDataRef.current = INITIAL_WORKOUT_DATA;
  }, [isModalOpen, routine]);

  useEffect(() => {
    if(workoutExercises.length > 0){
    setWorkoutData((prev)=>{
      const updatedData = {
        ...prev,
        exercises: prev.exercises.filter(exercise => workoutExercises.includes(korEngDict[exercise.name]))
        .concat(workoutExercises.filter(exercise => !prev.exercises.some(e => {return e.name === engKorDict[exercise]})).map((exercise)=>{
          console.log(exercise);
          return {
            name: engKorDict[exercise],
            category: engKorDict[exercise],
            sets:[{
              id: 0,
              srsId: null,
              weight: 0,
              many: 0,
              rest: 0,
            }]
          };
        })),
      }
      workoutDataRef.current = updatedData;
      return updatedData;
      });
    
    
    }
  
    
  }, [workoutExercises]);

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
            <div className={styles["exercise-buttons"]}>
            <ButtonComponent
              variant="outline"
              onClick={() => {
                addSet(exercise.id);
              }}
              style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"}}
            >
              <FaPlus />
              {window.innerWidth >= 768 ? "추가" : ""}
            </ButtonComponent>
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
              style={{backgroundColor: "red", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px"}}
            >
              <FaTrash />
              {window.innerWidth >= 768 ? "삭제" : ""}
            </ButtonComponent>
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
        <span>삭제</span>
      </div>
    );

    // 운동 세트들 렌더링
    const renderExerciseSets = () => {    
      return (<div className={styles["exercise-sets"]}>
        {renderSetsHeader()}
        {exercise.sets?.map((set, idx) => {
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
    };
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
    //추가하기 전 ref 동기화
    setWorkoutData(workoutDataRef.current);
    setWorkoutData((prev) => {
      const updatedData = {
        ...prev,
        exercises: prev.exercises.map((exercise) =>
          exercise.id === exerciseId
            ? {
                ...exercise,
                sets: [...exercise.sets, { id: exercise.sets.length, reps:0, weight:0, rest:0, many:0 }]
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
        exercises: prev.exercises.filter((exercise) => exercise.id !== exerciseId),
      };
      workoutDataRef.current = updatedData;
      return updatedData;
    });
    setWorkoutExercises((prev) => {
      return prev.filter((exercise) => exercise !== korEngDict[workoutData.exercises.find((e) => e.id === exerciseId).name]);
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

  const handleSaveWorkout = async() => {
    // 필요시 외부로 저장 이벤트를 전달하도록 확장 가능
    console.log("workoutDataRef.current", workoutDataRef.current);
    const updateWorkoutData ={
      "setId": workoutDataRef.current.setId,
      "routineName": workoutDataRef.current.title,
      "usersId": workoutDataRef.current.usersId,
      "saveRoutineDto": workoutDataRef.current.exercises.map((exercise) => {
        return {
          "srName": korEngDict[exercise.name],
          "srId": exercise.id? exercise.id : null,
          "reps": exercise.reps,
          "set": exercise.sets.map((set) => {
            if(set.srsId){
            return {
              "srsId": set.srsId,
                "weight": set.weight,
                "many": set.many,
                "rest": set.rest
              };
            }
            else{
              return {
                "weight": set.weight,
                "many": set.many,
                "rest": set.rest
              };
            }
          }),
        };
      }),
    };
    await PUT(`/routine/${workoutDataRef.current.setId}/update`, updateWorkoutData)
    .then((
      (res) => {
        console.log(res.data);
        setIsCompleteModalOpen(true);
      }
    ));
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
          onClick={() => {setIsExerciseSelectModalOpen(true)}}
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
