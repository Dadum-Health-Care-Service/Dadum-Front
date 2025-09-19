import React, { useState } from "react";
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

const Routine = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", label: "전체", color: "primary" },
    { id: "morning", label: "아침", color: "warning" },
    { id: "exercise", label: "운동", color: "success" },
    { id: "evening", label: "저녁", color: "info" },
    { id: "study", label: "학습", color: "secondary" },
  ];

  const routines = [
    {
      id: 1,
      title: "아침 루틴",
      description: "하루를 시작하는 건강한 아침 루틴",
      category: "morning",
      time: "15분",
      difficulty: "쉬움",
      completed: true,
      tasks: ["물 마시기", "스트레칭", "아침 식사"],
    },
    {
      id: 2,
      title: "운동 루틴",
      description: "전신 운동을 위한 체계적인 루틴",
      category: "exercise",
      time: "30분",
      difficulty: "보통",
      completed: false,
      tasks: ["준비운동", "유산소운동", "근력운동", "정리운동"],
    },
    {
      id: 3,
      title: "저녁 루틴",
      description: "하루를 마무리하는 편안한 루틴",
      category: "evening",
      time: "20분",
      difficulty: "쉬움",
      completed: false,
      tasks: ["정리정돈", "독서", "명상"],
    },
    {
      id: 4,
      title: "학습 루틴",
      description: "효율적인 학습을 위한 루틴",
      category: "study",
      time: "45분",
      difficulty: "보통",
      completed: true,
      tasks: ["목표 설정", "집중 학습", "복습"],
    },
  ];

  const filteredRoutines = routines.filter((routine) => {
    const matchesSearch =
      routine.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      routine.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || routine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.color : "secondary";
  };

  const getCategoryLabel = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.label : "기타";
  };

  return (
    <ContainerComponent className={`${styles.routine}`}>
      <ModalExample />
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>루틴 관리</h1>
        <ButtonComponent variant="primary" size="lg">
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
        {filteredRoutines.map((routine) => (
          <div key={routine.id} className={styles.routineCard}>
            <CardComponent
              variant={routine.completed ? "success" : "primary"}
              title={routine.title}
              className={styles.routineCardComponent}
              badge={routine.completed ? "완료" : "진행중"}
            >
              <div className={styles.routineHeader}>
                <div className={styles.routineInfo}>
                  <h5 className={styles.routineTitle}>{routine.title}</h5>
                  <p className={styles.routineDescription}>
                    {routine.description}
                  </p>
                </div>
                <div className={styles.routineMeta}>
                  <Badge
                    bg={getCategoryColor(routine.category)}
                    className={styles.categoryBadge}
                  >
                    {getCategoryLabel(routine.category)}
                  </Badge>
                  <div className={styles.routineStats}>
                    <span className={styles.time}>
                      <FaPlay className={styles.icon} />
                      {routine.time}
                    </span>
                    <Badge
                      bg={routine.difficulty === "쉬움" ? "success" : "warning"}
                      className={styles.difficultyBadge}
                    >
                      {routine.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={styles.tasksList}>
                <h6>할 일 목록:</h6>
                <ul>
                  {routine.tasks.map((task, index) => (
                    <li key={index} className={styles.taskItem}>
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={styles.routineActions}>
                <ButtonComponent variant="outline-primary" size="sm">
                  <FaPlay className={styles.buttonIcon} />
                  시작
                </ButtonComponent>
                <ButtonComponent variant="outline-secondary" size="sm">
                  <FaEdit className={styles.buttonIcon} />
                  수정
                </ButtonComponent>
                <ButtonComponent variant="outline-danger" size="sm">
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
