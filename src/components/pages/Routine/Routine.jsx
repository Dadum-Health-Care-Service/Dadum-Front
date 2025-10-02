import React, { useState, useEffect } from "react";
import { Container, Row, Col, Badge, InputGroup } from "react-bootstrap";
import {
  FaSearch,
  FaPlus,
  FaFilter,
  FaPlay,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import CardComponent from "../../common/CardComponent";
import ButtonComponent from "../../common/ButtonComponent";
import InputComponent from "../../common/InputComponent";
import SelectComponent from "../../common/SelectComponent";
import ContainerComponent from "../../common/ContainerComponent";
import styles from "./Routine.module.css";
import ModalExample from "../../common/ModalExample";
import RoutineCreateModal from "./RoutineCreateModal/RoutineCreateModal";
import RoutineDetailModal from "./RoutineDetailModal/RoutineDetailModal";
import { useApi } from "../../../utils/api/useApi";

const Routine = () => {
  const { GET } = useApi();
  const [searchTerm, setSearchTerm] = useState("");
  const [exercises, setExercises] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [routines, setRoutines] = useState([]);

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

  useEffect(() => {
    GET("/routine/list", {}, true)
      .then((res) => {
        setRoutines(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  const getExercises = (exercises) => {
    setExercises(exercises);
  };
  return (
    <ContainerComponent className={`${styles.routine}`}>
      <RoutineCreateModal
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        getExercises={getExercises}
      />
      <RoutineDetailModal
        routine={selectedRoutine}
        exercises={exercises}
        isModalOpen={isDetailModalOpen}
        handleDetailModalClose={handleDetailModalClose}
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
              title={routine.routineName}
              className={styles.routineCardComponent}
              buttonText=""
              badge={routine.completed ? "완료" : "진행중"}
              onClick={() => handleDetailModalOpen(routine)}
            >
              <div className={styles.routineHeader}>
                <div className={styles.routineInfo}>
                  <h5 className={styles.routineTitle}>{routine.title}</h5>
                  <p className={styles.routineDescription}>
                    {routine.description}
                  </p>
                </div>
              </div>

              <div className={styles.routineActions}>
                <ButtonComponent variant="primary" size="sm">
                  <FaPlay className={styles.buttonIcon} />
                  시작
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  size="sm"
                  onClick={() => handleDetailModalOpen(routine)}
                >
                  <FaEdit className={styles.buttonIcon} />
                  수정
                </ButtonComponent>
                <ButtonComponent variant="secondary" size="sm">
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
