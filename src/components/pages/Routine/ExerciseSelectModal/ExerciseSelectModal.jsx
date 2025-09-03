import { useState, useEffect } from "react";

import ButtonComponent from "../../../common/ButtonComponent";
import ListComponent from "../../../common/ListComponent";
import ModalComponent from "../../../common/ModalComponent";
import { engKorDict, instructionKorDict } from "../../../data/translation";
import { POST } from "../../../../utils/api/api";

const ModalFooter = ({ setIsModalOpen }) => {
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
          console.log("save");
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

export default function ExerciseSelectModal({ isModalOpen, setIsModalOpen }) {
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [translatedExerciseInstructions, setTranslatedExerciseInstructions] =
    useState([]);

  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/kimbongkum/ict4e/master/exercises.json"
    )
      .then((response) => response.json())
      .then((data) => {
        setExercises(data.exercises);
      });
  }, []);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleListClick = (exercise) => {
    setSelectedExercise(exercise);
    console.log("선택된 운동:", exercise);
  };

  const handleToggleExercise = (exercise) => {
    setExpandedExercise(expandedExercise === exercise ? null : exercise);
  };

  const renderModalContent = () => {
    const translateExerciseInstructions = async (instructions) => {
      const res = await POST(
        "/suggest/translate",
        { instructions: instructions },
        false,
        "ai"
      ).then((res) => {
        setTranslatedExerciseInstructions(res.data);
      });
    };
    return (
      <ModalComponent.Section>
        <ListComponent variant="bordered">
          {exercises?.map((exercise, i) => (
            <ListComponent.Item
              key={i}
              primary={engKorDict[exercise.name] + " (" + exercise.name + ")"}
              secondary={engKorDict[exercise.category]}
              selected={selectedExercise === exercise.name}
              expandable={true}
              expanded={expandedExercise === exercise.name}
              onToggle={() => {
                handleToggleExercise(exercise.name);
                translateExerciseInstructions(exercise.instructions);
              }}
              onClick={() => handleListClick(exercise.name)}
            >
              {expandedExercise === exercise.name && (
                <div
                  style={{
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    borderRadius: "8px",
                  }}
                >
                  <h4>운동 상세 정보</h4>
                  {<p>{instructionKorDict[exercise.name]}</p>}
                </div>
              )}
            </ListComponent.Item>
          ))}
          <ListComponent.Item
            primary={"벤치프레스"}
            secondary={"가슴 운동"}
            selected={selectedExercise === "벤치프레스"}
            expandable={true}
            expanded={expandedExercise === "벤치프레스"}
            onToggle={() => handleToggleExercise("벤치프레스")}
            onClick={() => handleListClick("벤치프레스")}
          >
            {expandedExercise === "벤치프레스" && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                }}
              >
                <h4>운동 상세 정보</h4>
                <p>
                  <strong>주요 근육:</strong> 대흉근, 삼두근, 전면삼각근
                </p>
                <p>
                  <strong>난이도:</strong> 중급
                </p>
                <p>
                  <strong>권장 세트:</strong> 3-4세트
                </p>
                <p>
                  <strong>권장 횟수:</strong> 8-12회
                </p>
                <p>
                  <strong>주의사항:</strong> 어깨를 고정하고 가슴에 집중하여
                  수행
                </p>
              </div>
            )}
          </ListComponent.Item>

          <ListComponent.Item
            primary="스쿼트"
            secondary="하체 운동"
            selected={selectedExercise === "스쿼트"}
            expandable={true}
            expanded={expandedExercise === "스쿼트"}
            onToggle={() => handleToggleExercise("스쿼트")}
            onClick={() => handleListClick("스쿼트")}
          >
            {expandedExercise === "스쿼트" && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                }}
              >
                <h4>운동 상세 정보</h4>
                <p>
                  <strong>주요 근육:</strong> 대퇴사두근, 대퇴이두근, 둔근
                </p>
                <p>
                  <strong>난이도:</strong> 초급
                </p>
                <p>
                  <strong>권장 세트:</strong> 3-4세트
                </p>
                <p>
                  <strong>권장 횟수:</strong> 10-15회
                </p>
                <p>
                  <strong>주의사항:</strong> 무릎이 발끝을 넘지 않도록 주의
                </p>
              </div>
            )}
          </ListComponent.Item>

          <ListComponent.Item
            primary="데드리프트"
            secondary="등 운동"
            selected={selectedExercise === "데드리프트"}
            expandable={true}
            expanded={expandedExercise === "데드리프트"}
            onToggle={() => handleToggleExercise("데드리프트")}
            onClick={() => handleListClick("데드리프트")}
          >
            {expandedExercise === "데드리프트" && (
              <div
                style={{
                  padding: "12px 16px",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                }}
              >
                <h4>운동 상세 정보</h4>
                <p>
                  <strong>주요 근육:</strong> 광배근, 척추기립근, 둔근
                </p>
                <p>
                  <strong>난이도:</strong> 고급
                </p>
                <p>
                  <strong>권장 세트:</strong> 3-5세트
                </p>
                <p>
                  <strong>권장 횟수:</strong> 5-8회
                </p>
                <p>
                  <strong>주의사항:</strong> 허리를 곧게 펴고 척추 중립 자세
                  유지
                </p>
              </div>
            )}
          </ListComponent.Item>
        </ListComponent>
      </ModalComponent.Section>
    );
  };
  return (
    <div>
      <ModalComponent
        title="운동선택"
        subtitle="운동을 선택해주세요"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        footer={<ModalFooter setIsModalOpen={setIsModalOpen} />}
        zIndex={10000}
      >
        {renderModalContent()}
      </ModalComponent>
    </div>
  );
}
