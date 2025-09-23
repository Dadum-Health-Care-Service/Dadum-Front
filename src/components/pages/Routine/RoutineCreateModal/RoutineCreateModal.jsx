import { useState } from "react";

import ModalComponent from "../../../common/ModalComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import InputComponent from "../../../common/InputComponent";
import ExerciseSelectModal from "../ExerciseSelectModal/ExerciseSelectModal";

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

export default function RoutineCreateModal({ isModalOpen, setIsModalOpen }) {
  const [isExerciseSelectModalOpen, setIsExerciseSelectModalOpen] =
    useState(false);

  const getSaveHandler = () => {
    return () => {
      console.log("save");
    };
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const renderModalContent = () => {
    return (
      <ModalComponent.Section
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <InputComponent
          name="routineName"
          label="루틴 이름"
          placeholder="루틴 이름을 입력하세요"
        />
        <ButtonComponent
          variant="primary"
          label="운동 선택"
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
      />
      <ModalComponent
        title="루틴 생성"
        subtitle="루틴 생성을 위해 필요한 정보를 입력해주세요"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        footer={<ModalFooter setIsModalOpen={setIsModalOpen} />}
        zIndex={9000}
      >
        {renderModalContent()}
      </ModalComponent>
    </div>
  );
}
