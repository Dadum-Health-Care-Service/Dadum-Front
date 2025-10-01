import { useState } from "react";

import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import InputComponent from "../../../common/InputComponent";
import ListComponent from "../../../common/ListComponent";
import ExerciseSelectModal from "../ExerciseSelectModal/ExerciseSelectModal";
import { engKorDict } from "../../../data/translation";
import { useApi } from "../../../../utils/api/useApi";
import { useModal } from "../../../../context/ModalContext";

const ModalFooter = ({ setIsModalOpen, handleRoutineSave }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: "10px",
        margin: "10px",
      }}
    >
      <ButtonComponent
        variant="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleRoutineSave();
        }}
      >
        저장
      </ButtonComponent>
      <ButtonComponent
        variant="secondary"
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(false);
        }}
      >
        취소
      </ButtonComponent>
    </div>
  );
};

export default function RoutineCreateModal({
  isModalOpen,
  setIsModalOpen,
  getExercises,
}) {
  const [isExerciseSelectModalOpen, setIsExerciseSelectModalOpen] =
    useState(false);
  const [routineName, setRoutineName] = useState("");
  const [routineNameError, setRoutineNameError] = useState("");
  const [routineExercises, setRoutineExercises] = useState([]);
  const { POST } = useApi();
  const { showConfirmModal } = useModal();

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleRoutineSave = () => {
    if (routineName.length === 0) {
      setRoutineNameError("루틴 이름을 입력해주세요.");
      return;
    }
    console.log(routineName, routineExercises);
    POST("/routine/create", {
      routineName: routineName,
      saveRoutineDto: routineExercises.map((exercise) => {
        return {
          srName: exercise,
          reps: 0,
          set: [
            {
              weight: 0,
              many: 0,
            },
          ],
        };
      }),
    })
      .then(() => {
        showConfirmModal(
          "루틴 생성이 완료되었습니다.",
          "루틴 생성",
          "",
          () => {
            handleCloseModal();
          },
          false
        );
      })
      .catch((error) => {
        console.log(error);
        showConfirmModal("루틴 생성에 실패하였습니다.", "루틴 생성", false);
      });
  };

  const renderModalContent = () => {
    return (
      <ModalComponent.Section
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <InputComponent
          name="routineName"
          label="루틴 이름"
          required
          placeholder="루틴 이름을 입력하세요"
          error={routineNameError}
          value={routineName}
          onChange={(e) => {
            setRoutineName(e.target.value);
            setRoutineNameError("");
          }}
        />
        {routineExercises.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label>운동 선택</label>
            <ListComponent variant="">
              <ul
                style={{
                  display: "flex",
                  flexDirection: "column",
                  margin: 0,
                  padding: 0,
                  gap: "4px",
                }}
              >
                {routineExercises.map((exercise, i) => (
                  <li key={i}>
                    <div
                      style={{
                        backgroundColor: "#3b82f6",
                        padding: "8px 16px",
                        color: "#ffffff",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",

                        justifyContent: "space-between",
                        alignItems: "center",
                        borderRadius: "10px",
                      }}
                    >
                      {engKorDict[exercise]}
                      <div
                        style={{ cursor: "pointer" }}
                        onClick={() =>
                          setRoutineExercises(
                            routineExercises.filter((_, index) => index !== i)
                          )
                        }
                      >
                        X
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ListComponent>
          </div>
        )}

        <ButtonComponent
          variant={routineExercises.length > 0 ? "outline" : "primary"}
          label={routineExercises.length > 0 ? "" : "운동 선택"}
          onClick={() => setIsExerciseSelectModalOpen(true)}
        >
          운동 선택
        </ButtonComponent>
      </ModalComponent.Section>
    );
  };

  return (
    <div>
      <ExerciseSelectModal
        isModalOpen={isExerciseSelectModalOpen}
        setIsModalOpen={setIsExerciseSelectModalOpen}
        routineExercises={routineExercises}
        setRoutineExercises={setRoutineExercises}
        getExercises={getExercises}
      />

      <ModalComponent
        title="루틴 생성"
        subtitle="루틴 생성을 위해 필요한 정보를 입력해주세요"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        footer={
          <ModalFooter
            setIsModalOpen={setIsModalOpen}
            handleRoutineSave={handleRoutineSave}
            setRoutineNameError={setRoutineNameError}
          />
        }
        zIndex={9000}
      >
        {renderModalContent()}
      </ModalComponent>
    </div>
  );
}
