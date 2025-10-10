import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Badge, InputGroup } from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaFilter,
  FaPlay,
  FaStop,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";
import InputComponent from "../../common/InputComponent";
import SelectComponent from "../../common/SelectComponent";
import ContainerComponent from "../../common/ContainerComponent";
import styles from "./Routine.module.css";
import RoutineCreateModal from "./RoutineCreateModal/RoutineCreateModal";
import RoutineDetailModal from "./RoutineDetailModal/RoutineDetailModal";
import TotalTimer from "../../common/TotalTimer";
import { useApi } from "../../../utils/api/useApi";
import { useModal } from "../../../context/ModalContext";
import { RunContext } from "../../../context/RunContext";

const Routine = () => {
  const { GET, DELETE } = useApi();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);
  const { showConfirmModal } = useModal();
  const { useRun, useStop, isRunning, setId } = useContext(RunContext);

  const categories = [
    { id: "all", label: "전체", color: "primary" },
    { id: "morning", label: "아침", color: "warning" },
    { id: "exercise", label: "운동", color: "success" },
    { id: "evening", label: "저녁", color: "info" },
    { id: "study", label: "학습", color: "secondary" },
  ];

  const filteredRoutines = routines
    .filter((routine) => {
      const matchesSearch = routine.routineName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || routine.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.setId > b.setId) {
        return 1;
      } else if (a.setId < b.setId) {
        return -1;
      } else {
        return 0;
      }
    });

  const getCategoryColor = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "secondary";
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.label : "기타";
  };
  const handleDetailModalOpen = (routine) => {
    setSelectedRoutine(routine);
    setIsDetailModalOpen(true);
  };
  const handleDetailModalClose = () => {
    setSelectedRoutine(null);
    setIsDetailModalOpen(false);
  };
  const handleDeleteRoutine = (routine) => {
    console.log(routine);
    showConfirmModal(
      "루틴을 삭제하시겠습니까?",
      "루틴 삭제",
      "",
      async () => {
        await DELETE(`/routine/${routine.setId}/delete`, {}, true)
        .then((res) => {
          console.log(res);
          showConfirmModal(
            "루틴이 삭제되었습니다.",
            "루틴 삭제",
            "",
            () => {
              getRoutines();
            },
            false
          );
        })
        .catch((err) => {
          console.log(err);
        });
      },
      true
    );
  };

  const getRoutines =() =>{
    GET("/routine/list", {}, true)
    .then((res) => {
      setRoutines(res.data);
    })
    .catch((err) => {
      console.log(err);
    });
  }

  useEffect(() => {
   getRoutines();
  }, []);

  const getExercises = (exercises) => {
    setExercises(exercises);
  };
  const handleRun = (runId) => {
    useStop();
    if (isRunning&&runId===setId) {
      useStop();
    } else {
      useRun(runId);
    }
  }
  return (
    <ContainerComponent className={`${styles.routine}`}>
      <RoutineCreateModal
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        getExercises={getExercises}
        getRoutines={getRoutines}
      />
      <RoutineDetailModal
        routine={selectedRoutine}
        exercises={exercises}
        isModalOpen={isDetailModalOpen}
        handleDetailModalClose={handleDetailModalClose}
        getRoutines={getRoutines}
        getExercises={getExercises}
      />
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>루틴 관리</h1>
        <ButtonComponent
          variant="primary"
          size="lg"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <FaPlus className={styles.buttonIcon} />새 루틴 만들기
        </ButtonComponent>
      </div>

      {/* Search and Filter */}
      <div className={styles.searchFilter}>
        <div className={styles.searchRow}>
          <div className={styles.searchInput}>
            <InputComponent
              placeholder="루틴 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className={styles.filterSelect}>
            <SelectComponent
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <SelectComponent.Option key={category.id} value={category.id}>
                  {category.label}
                </SelectComponent.Option>
              ))}
            </SelectComponent>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className={styles.categories}>
        {categories.map((category) => (
          <Badge
            key={category.id}
            bg={category.id === selectedCategory ? category.color : "light"}
            text={category.id === selectedCategory ? "white" : "dark"}
            className={styles.categoryBadge}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.label}
          </Badge>
        ))}
      </div>

      {/* Routines Grid */}
      <div className={styles.routinesGrid}>
        {filteredRoutines?.map((routine) => (
          <div key={routine.setId} className={styles.routineCard}>
            <CardComponent
              variant={routine.completed ? "success" : "primary"}
              title={<div className={styles.routineTitleContainer}>{routine.routineName}{isRunning && setId===routine.setId && (
                <div style={{ display: 'flex', gap: '1em', marginRight: '1em' }}>
                  <img
                    src={'/img/RunningRoutine.gif'}
                    style={{ width: '30px', height: '30px' }}
                  />
                  <TotalTimer type="DETAIL" />
                </div>
                )}</div>}
              className={styles.routineCardComponent}
              buttonText=""
              badge={isRunning&&setId===routine.setId ? "진행중" : "완료"}
              onClick={() => handleDetailModalOpen(routine)}
            >
              <div className={styles.routineHeader}>
                <div className={styles.routineInfo}>
                  <div className={styles.routineTitleContainer}>
                  <div className={styles.routineTitle}>{routine.title}</div>
                  </div>
                  
                  <p className={styles.routineDescription}>
                    {routine.description}
                  </p>
                </div>
              </div>

              <div className={styles.routineActions}>
                <ButtonComponent variant="primary" size="sm" onClick={(e) => {
                  e.stopPropagation();
                  console.log(routine.setId);
                  console.log(setId);
                  console.log(isRunning);
                  handleRun(routine.setId);}} style={{background: isRunning&&setId===routine.setId ? "red" : "#007bff"}}>
                  {isRunning&&setId===routine.setId ? <FaStop className={styles.buttonIcon} /> : <FaPlay className={styles.buttonIcon} />}
                  {isRunning&&setId===routine.setId ? "중지" : "시작"}
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  size="sm"
                  onClick={() => handleDetailModalOpen(routine)}
                >
                  <FaEdit className={styles.buttonIcon} />
                  수정
                </ButtonComponent>
                <ButtonComponent variant="secondary" size="sm" onClick={(e) => {e.stopPropagation(); handleDeleteRoutine(routine)}}>
                  <FaTrash className={styles.buttonIcon} />
                  삭제
                </ButtonComponent>
              </div>
            </CardComponent>
          </div>
        ))}
      </div>
    </ContainerComponent>
  );
};

export default Routine;
