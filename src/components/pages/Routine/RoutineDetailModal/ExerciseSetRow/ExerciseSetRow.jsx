import styles from "./ExerciseSetRow.module.css";
import { FaMinusCircle, FaCheckCircle, FaRegPlayCircle } from "react-icons/fa";
import InputComponent from "../../../../common/InputComponent";
import TimerComponent from "../../../../common/TimerComponent";
import { RunContext } from "../../../../../context/RunContext";
import { useContext, useState, useEffect } from "react";

// 운동 세트 행 렌더링 컴포넌트
const ExerciseSetRow = ({
  idx,
  set,
  runningSet,
  exerciseId,
  workoutDataRef,
  setNextSet,
  isRest,
  isPaused,
  setRest,
  deleteSet,
  doneSets,
}) => {
  const { isRunning, setId } = useContext(RunContext);
  const handleChange = (id, field, value) => {
    const newExercises = workoutDataRef.current.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === id ? { ...set, [field]: parseInt(value) } : set
            ),
          }
        : exercise
    );
    workoutDataRef.current = {
      ...workoutDataRef.current,
      exercises: newExercises,
    };
    console.log("workoutDataRef.current", workoutDataRef.current);
  };

  const doneTimer = (done) => {
    console.log("doneTimer", done);
    if (done) {
      setNextSet();
    }
  };

  return (
    <div className={styles["set-row"]} key={set.srsId}>
      <div className={styles["set-number-id"]}>
        {runningSet?.srsId === set.srsId && !isRest && !isPaused ? (
          <img
            src={"/img/RunningRoutine.gif"}
            style={{ width: "30px", height: "30px" }}
          />
        ) : (
          idx + 1
        )}
      </div>
      <InputComponent
        value={set.many}
        className={styles["set-input"]}
        onChange={(e) => handleChange(set.id, "many", e.target.value)}
        type="number"
        disabled={doneSets.includes(set)}
      />
      <InputComponent
        value={set.weight}
        className={styles["set-input"]}
        onChange={(e) => handleChange(set.id, "weight", e.target.value)}
        type="number"
        disabled={doneSets.includes(set)}
      />
      {isRunning && setId !== set.setId ? (
        <TimerComponent
          key={set.srsId}
          type="minutes"
          seconds={set.rest}
          startTimer={runningSet?.srsId === set.srsId && isRest}
          pauseTimer={isPaused}
          doneTimer={doneTimer}
        />
      ) : (
        <InputComponent
          value={set.rest}
          className={styles["set-input"]}
          onChange={(e) => handleChange(set.id, "rest", e.target.value)}
          type="number"
          disabled={doneSets.includes(set)}
        />
      )}
      <div
        className={
          isRunning && setId !== set.setId
            ? styles["set-check"]
            : styles["set-delete"]
        }
        onClick={() => {
          doneSets.includes(set)
            ? null
            : isRunning && setId !== set.setId
            ? runningSet?.srsId === set.srsId
              ? setRest(true)
              : setNextSet()
            : deleteSet(set.id, exerciseId);
        }}
        disabled={doneSets.includes(set)}
        style={{
          opacity: doneSets.includes(set) ? 0.5 : 1,
          cursor: doneSets.includes(set) ? "not-allowed" : "pointer",
        }}
      >
        {isRunning && setId !== set.setId ? (
          runningSet?.srsId === set.srsId ? (
            <FaCheckCircle />
          ) : (
            <FaRegPlayCircle />
          )
        ) : (
          <FaMinusCircle />
        )}
      </div>
    </div>
  );
};

export default ExerciseSetRow;
