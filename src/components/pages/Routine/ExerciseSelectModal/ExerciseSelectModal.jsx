import { useState, useEffect } from "react";

import InputComponent from "../../../common/InputComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import ListComponent from "../../../common/ListComponent";
import ModalComponent from "../../../common/ModalComponent";
import TabDetailDropdown from "./TabDetailDropdown/TabDetailDropdown";
import {
  engKorDict,
  instructionKorDict,
  equipmentKorDict,
  categoryKorDict,
  levelKorDict,
  primaryMuscleKorDict,
  equipmentEng,
  categoryEng,
  levelEng,
  primaryMuscleEng,
  categoryKor,
  equipmentKor,
  levelKor,
  primaryMuscleKor,
} from "../../../data/translation";
import { useApi } from "../../../../utils/api/useApi";

const ModalFooter = ({
  addedExercises,
  setIsModalOpen,
  setRoutineExercises,
}) => {
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
          setRoutineExercises(addedExercises);
          setIsModalOpen(false);
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

export default function ExerciseSelectModal({
  isModalOpen,
  setIsModalOpen,
  routineExercises,
  setRoutineExercises,
  getExercises,
}) {
  const { POST } = useApi();
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [activeTab, setActiveTab] = useState("전체");
  const [selectedTabDetails, setSelectedTabDetails] = useState([]);
  const [addedExercises, setAddedExercises] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    fetch(
      "https://raw.githubusercontent.com/kimbongkum/ict4e/master/exercises.json"
    )
      .then((response) => response.json())
      .then((data) => {
        setExercises(data.exercises);
      });
  }, []);
  useEffect(() => {
    setAddedExercises(routineExercises);
  }, [isModalOpen]);
  useEffect(() => {
    getExercises(exercises);
  }, [exercises]);

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

  const handleAddExercise = (exercise) => {
    setAddedExercises(addedExercises.concat(exercise));
  };
  const handleRemoveExercise = (i) => {
    setAddedExercises(addedExercises.filter((e, index) => index !== i));
  };

  const handleTabDetailDropdownChange = (value) => {
    console.log(value);
    if (selectedTabDetails.includes(value.target.value)) return;
    switch (activeTab) {
      case "운동 카테고리":
        console.log("운동 카테고리");
        setSelectedTabDetails(
          selectedTabDetails
            .filter((detail) => {
              return !categoryKor.includes(detail);
            })
            .concat(value.target.value)
        );
        break;
      case "운동 장비":
        setSelectedTabDetails(
          selectedTabDetails
            .filter((detail) => {
              return !equipmentKor.includes(detail);
            })
            .concat(value.target.value)
        );
        break;
      case "운동 주요 근육":
        setSelectedTabDetails(
          selectedTabDetails
            .filter((detail) => {
              return !primaryMuscleKor.includes(detail);
            })
            .concat(value.target.value)
        );
        break;
      case "운동 난이도":
        setSelectedTabDetails(
          selectedTabDetails
            .filter((detail) => {
              return !levelKor.includes(detail);
            })
            .concat(value.target.value)
        );
        break;
    }
  };

  const renderModalContent = () => {
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
                  onClick={() => {
                    if (tab === "전체") {
                      setActiveTab(tab);
                      setSearch("");
                    } else {
                      setActiveTab(tab);
                    }
                  }}
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
                  onChange={handleTabDetailDropdownChange}
                  options={
                    activeTab === "운동 카테고리"
                      ? categoryEng.map((category) => ({
                          value: category,
                          label: categoryKorDict[category],
                        }))
                      : activeTab === "운동 장비"
                      ? equipmentEng.map((equipment) => ({
                          value: equipment,
                          label: equipmentKorDict[equipment],
                        }))
                      : activeTab === "운동 주요 근육"
                      ? primaryMuscleEng.map((primaryMuscle) => ({
                          value: primaryMuscle,
                          label: primaryMuscleKorDict[primaryMuscle],
                        }))
                      : activeTab === "운동 난이도"
                      ? levelEng.map((level) => ({
                          value: level,
                          label: levelKorDict[level],
                        }))
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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
            }}
          >
            {selectedTabDetails.map((detail) => (
              <div
                key={detail}
                style={{
                  width: "fit-content",
                  backgroundColor: "#76ABF0",
                  color: "#ffffff",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "500",
                  fontStyle: "italic",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                #{detail}
                <button
                  style={{
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "500",
                    fontStyle: "italic",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                  onClick={() =>
                    setSelectedTabDetails(
                      selectedTabDetails.filter((d) => d !== detail)
                    )
                  }
                >
                  x
                </button>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h3>추가된 운동</h3>
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
              {addedExercises.map((exercise, i) => (
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
                      onClick={() => handleRemoveExercise(i)}
                    >
                      X
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ListComponent>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3>운동 목록</h3>
          <ListComponent variant="bordered">
            {exercises
              ?.filter((exercise) => {
                if (activeTab === "전체") {
                  return true;
                } else {
                  if (selectedTabDetails.length === 0) return true;
                  const conditions = [
                    categoryKorDict[exercise.category],
                    equipmentKorDict[exercise.equipment],
                    primaryMuscleKorDict[exercise.primaryMuscles],
                    levelKorDict[exercise.level],
                  ];

                  // 모든 조건이 selectedTabDetails 안에 있어야 통과
                  return selectedTabDetails.every((selected) =>
                    conditions.includes(selected)
                  );
                }
              })
              .filter((exercise) => {
                if (search === "") return true;
                return search
                  .split(" ")
                  .some((s) => engKorDict[exercise.name].includes(s));
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
                        cursor: "default",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <h4>운동 상세 정보</h4>
                        <ButtonComponent
                          variant="primary"
                          size="small"
                          padding="0px"
                          onClick={() => handleAddExercise(exercise.name)}
                        >
                          + 추가
                        </ButtonComponent>
                      </div>
                      <ListComponent>
                        <ListComponent.Item>
                          <strong>운동 이름</strong> {" : "}
                          {engKorDict[exercise.name]}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 난이도</strong> {" : "}
                          {levelKorDict[exercise.level]}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 장비</strong> {" : "}
                          {equipmentKorDict[exercise.equipment]}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 주요 근육</strong> {" : "}
                          {primaryMuscleKorDict[exercise.primaryMuscles]}
                        </ListComponent.Item>
                        <ListComponent.Item>
                          <strong>운동 카테고리</strong>
                          {" : "}
                          {categoryKorDict[exercise.category]}
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
        footer={
          <ModalFooter
            addedExercises={addedExercises}
            setIsModalOpen={setIsModalOpen}
            setRoutineExercises={setRoutineExercises}
          />
        }
        zIndex={10000}
      >
        {renderModalContent()}
      </ModalComponent>
    </div>
  );
}
