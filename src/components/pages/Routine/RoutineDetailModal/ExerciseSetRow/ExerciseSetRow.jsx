import styles from "./ExerciseSetRow.module.css";
import { FaMinusCircle } from "react-icons/fa";
import InputComponent from "../../../../common/InputComponent";

// 운동 세트 행 렌더링 컴포넌트
const ExerciseSetRow = ({
  idx,
  set,
  exerciseId,
  workoutDataRef,
  deleteSet,
}) => {
  const handleChange = (id, field, value) => {
    const newExercises = workoutDataRef.current.exercises.map((exercise) =>
      exercise.id === exerciseId
        ? {
            ...exercise,
            sets: exercise.sets.map((set) =>
              set.id === id
                ? { ...set, [field]: parseInt(value) }
                : set
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
  return (
    <div className={styles["set-row"]} key={set.srsId}>
      <div className={styles["set-number-id"]}>{idx + 1}</div>
      <InputComponent
        value={set.many}
        className={styles["set-input"]}
        onChange={(e) => handleChange(set.id, "many", e.target.value)}
        type="number"
      />
      <InputComponent
        value={set.weight}
        className={styles["set-input"]}
        onChange={(e) => handleChange(set.id, "weight", e.target.value)}
        type="number"
      />
      <InputComponent
        value={set.rest}
        className={styles["set-input"]}
        onChange={(e) => handleChange(set.id, "rest", e.target.value)}
        type="number"
      />
      <div
        className={styles["set-delete"]}
        onClick={() => deleteSet(set.id, exerciseId)}
      >
        <FaMinusCircle />
      </div>
    </div>
  );
};

export default ExerciseSetRow;
