import { useState, useEffect } from "react";

import InputComponent from "../../../common/InputComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import ListComponent from "../../../common/ListComponent";
import ModalComponent from "../../../common/ModalComponent";
import { engKorDict, instructionKorDict } from "../../../data/translation";
import { POST } from "../../../../utils/api/api";

// 탭별 세부 옵션 드롭다운 컴포넌트
const TabDetailDropdown = ({
  placeholder,
  options,
  value,
  onChange,
  size = "medium",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");

  const handleOptionClick = (optionValue) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    if (onChange) {
      onChange({ target: { value: optionValue } });
    }
  };

  const selectedLabel =
    options.find((opt) => opt.value === selectedValue)?.label || placeholder;

  const sizeStyles = {
    small: { padding: "8px 12px", fontSize: "12px" },
    medium: { padding: "10px 14px", fontSize: "14px" },
    large: { padding: "12px 16px", fontSize: "16px" },
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          ...sizeStyles[size],
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          color: selectedValue ? "#374151" : "#9ca3af",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#3b82f6";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#d1d5db";
        }}
      >
        <span>{selectedLabel}</span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.value)}
              style={{
                width: "100%",
                ...sizeStyles[size],
                border: "none",
                backgroundColor:
                  selectedValue === option.value ? "#eff6ff" : "transparent",
                color: selectedValue === option.value ? "#1d4ed8" : "#374151",
                textAlign: "left",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedValue !== option.value) {
                  e.target.style.backgroundColor = "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedValue !== option.value) {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState("전체");

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
      <ModalComponent.Section
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            padding: "16px",
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
            marginBottom: "16px",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
            운동 검색
          </h3>

          {/* 탭 기반 필터 */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* 탭 네비게이션 */}
            <div
              style={{
                display: "flex",
                borderBottom: "1px solid #e5e7eb",
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {[
                "전체",
                "운동 카테고리",
                "운동 장비",
                "운동 주요 근육",
                "운동 난이도",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "12px 16px",
                    border: "none",
                    backgroundColor: "transparent",
                    color: activeTab === tab ? "#3b82f6" : "#6b7280",
                    fontSize: "14px",
                    fontWeight: activeTab === tab ? "600" : "400",
                    cursor: "pointer",
                    borderBottom:
                      activeTab === tab
                        ? "2px solid #3b82f6"
                        : "2px solid transparent",
                    transition: "all 0.2s ease",
                    whiteSpace: "nowrap",
                    minWidth: "fit-content",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 탭별 세부 옵션 드롭다운 */}
            {activeTab !== "전체" && (
              <div style={{ marginTop: "12px" }}>
                <TabDetailDropdown
                  placeholder={`${activeTab} 세부 옵션`}
                  size="small"
                  options={
                    activeTab === "운동 카테고리"
                      ? [
                          { value: "strength", label: "근력" },
                          { value: "stretching", label: "스트레칭" },
                          { value: "cardio", label: "유산소" },
                        ]
                      : activeTab === "운동 장비"
                      ? [
                          { value: "body only", label: "body only" },
                          { value: "dumbbell", label: "dumbbell" },
                          { value: "barbell", label: "barbell" },
                          { value: "cable", label: "cable" },
                          { value: "machine", label: "machine" },
                          { value: "other", label: "other" },
                        ]
                      : activeTab === "운동 주요 근육"
                      ? [
                          { value: "hamstrings", label: "hamstrings" },
                          { value: "calves", label: "calves" },
                          { value: "glutes", label: "glutes" },
                          { value: "legs", label: "legs" },
                        ]
                      : activeTab === "운동 난이도"
                      ? [
                          { value: "beginner", label: "beginner" },
                          { value: "intermediate", label: "intermediate" },
                          { value: "advanced", label: "advanced" },
                        ]
                      : []
                  }
                />
              </div>
            )}
          </div>

          <InputComponent
            placeholder="운동 이름을 검색해주세요"
            variant="outlined"
            size="medium"
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3>운동 목록</h3>
          <ListComponent variant="bordered">
            {exercises
              ?.filter((exercise) => {
                if (activeTab === "전체") return true;
                if (activeTab === "유산소")
                  return exercise.category === "cardio";
                return exercise.primaryMuscle === activeTab.toLowerCase();
              })
              .map((exercise, i) => (
                <ListComponent.Item
                  key={i}
                  primary={
                    engKorDict[exercise.name] + " (" + exercise.name + ")"
                  }
                  secondary={engKorDict[exercise.category]}
                  selected={selectedExercise === exercise.name}
                  expandable={true}
                  expanded={expandedExercise === exercise.name}
                  onToggle={() => {
                    handleToggleExercise(exercise.name);
                    translateExerciseInstructions(exercise.instructions);
                  }}
                  onClick={() => handleListClick(exercise.name)}
                  noPadding={true}
                  style={{ padding: "0px" }}
                >
                  {expandedExercise === exercise.name && (
                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "12px 16px",
                        boxShadow: "inset 0 0 12px 0 rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <h4>운동 상세 정보</h4>
                      <ListComponent>
                        <ListComponent.Item>
                          <strong>운동 이름</strong> {" : "}
                          {engKorDict[exercise.name]}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 난이도</strong> {" : "}
                          {exercise.level}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 장비</strong> {" : "}
                          {exercise.equipment}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 주요 근육</strong> {" : "}
                          {exercise.primaryMuscles.join(", ")}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 카테고리</strong>
                          {" : "}
                          {exercise.category}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 방법</strong>
                          <div
                            style={{ whiteSpace: "pre-line", marginTop: "4px" }}
                          >
                            {instructionKorDict[exercise.name].replace(
                              /\./g,
                              ".\n"
                            )}
                          </div>
                        </ListComponent.Item>
                      </ListComponent>
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
        </div>
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
