import React, { useState } from "react";
import ModalComponent from "./ModalComponent";
import ButtonComponent from "./ButtonComponent";
import InputComponent from "./InputComponent";
import SelectComponent from "./SelectComponent";
import TextareaComponent from "./TextareaComponent";
import styles from "./ModalExample.module.css";

// 모달 타입별 설정을 객체로 분리하여 관리
const MODAL_CONFIGS = {
  basic: {
    title: "기본 모달",
    subtitle: "간단한 정보 표시",
    size: ModalComponent.SIZES.MEDIUM,
    variant: ModalComponent.VARIANTS.DEFAULT,
    hasFooter: false,
  },
  form: {
    title: "폼 모달",
    subtitle: "사용자 정보 입력",
    size: ModalComponent.SIZES.LARGE,
    variant: ModalComponent.VARIANTS.ELEVATED,
    hasFooter: true,
  },
  confirmation: {
    title: "확인 모달",
    subtitle: "작업 확인",
    size: ModalComponent.SIZES.SMALL,
    variant: ModalComponent.VARIANTS.OUTLINED,
    hasFooter: true,
  },
  workout: {
    title: "아침 운동 루틴",
    subtitle: "운동 상세 정보",
    size: ModalComponent.SIZES.LARGE,
    variant: ModalComponent.VARIANTS.ELEVATED,
    hasFooter: true,
  },
};

// 폼 필드 설정을 배열로 분리
const FORM_FIELDS = [
  {
    id: "name",
    label: "이름",
    type: "text",
    placeholder: "이름을 입력하세요",
    required: true,
  },
  {
    id: "email",
    label: "이메일",
    type: "email",
    placeholder: "이메일을 입력하세요",
    required: true,
  },
  {
    id: "category",
    label: "카테고리",
    type: "select",
    placeholder: "카테고리를 선택하세요",
    options: [
      { value: "", label: "카테고리를 선택하세요" },
      { value: "general", label: "일반" },
      { value: "support", label: "지원" },
      { value: "feedback", label: "피드백" },
    ],
    required: true,
  },
  {
    id: "message",
    label: "메시지",
    type: "textarea",
    placeholder: "메시지를 입력하세요",
    rows: 4,
    required: true,
  },
];

// 운동 데이터 초기값
const INITIAL_WORKOUT_DATA = {
  title: "아침 운동 루틴",
  totalTime: "50분",
  totalSets: "15세트",
  estimatedCalories: "400kcal",
  exercises: [
    {
      id: 1,
      name: "스쿼트",
      category: "웜업",
      sets: [
        { setNumber: 1, reps: 10, weight: 0, rest: 60 },
        { setNumber: 2, reps: 12, weight: 0, rest: 60 },
        { setNumber: 3, reps: 15, weight: 0, rest: 60 },
      ],
    },
    {
      id: 2,
      name: "푸시업",
      category: "웜업",
      sets: [
        { setNumber: 1, reps: 8, weight: 0, rest: 45 },
        { setNumber: 2, reps: 10, weight: 0, rest: 45 },
        { setNumber: 3, reps: 12, weight: 0, rest: 45 },
      ],
    },
    {
      id: 3,
      name: "데드리프트",
      category: "메인 운동",
      sets: [
        { setNumber: 1, reps: 8, weight: 60, rest: 120 },
        { setNumber: 2, reps: 8, weight: 70, rest: 120 },
        { setNumber: 3, reps: 6, weight: 80, rest: 120 },
        { setNumber: 4, reps: 6, weight: 85, rest: 120 },
      ],
    },
    {
      id: 4,
      name: "벤치프레스",
      category: "메인 운동",
      sets: [
        { setNumber: 1, reps: 10, weight: 40, rest: 90 },
        { setNumber: 2, reps: 8, weight: 50, rest: 90 },
        { setNumber: 3, reps: 6, weight: 55, rest: 90 },
      ],
    },
  ],
};

// 폼 필드 렌더링 컴포넌트
const FormField = ({ field, value, onChange }) => {
  const { id, label, type, placeholder, required, options, rows } = field;

  const renderInput = () => {
    switch (type) {
      case "select":
        return (
          <SelectComponent
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            required={required}
          >
            {options.map((option) => (
              <SelectComponent.Option key={option.value} value={option.value}>
                {option.label}
              </SelectComponent.Option>
            ))}
          </SelectComponent>
        );
      case "textarea":
        return (
          <TextareaComponent
            id={id}
            name={id}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            rows={rows}
            required={required}
          />
        );
      default:
        return (
          <InputComponent
            id={id}
            name={id}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          marginBottom: "8px",
          fontWeight: "500",
        }}
      >
        {label}
      </label>
      {renderInput()}
    </div>
  );
};

// 운동 세트 행 렌더링 컴포넌트
const ExerciseSetRow = ({ set, exerciseId, onSetChange }) => {
  const handleChange = (field, value) => {
    onSetChange(exerciseId, set.setNumber, field, value);
  };

  return (
    <div className={styles["set-row"]}>
      <InputComponent
        value={set.setNumber}
        onChange={(e) => handleChange("setNumber", e.target.value)}
        className={styles["set-number-input"]}
        type="number"
        min="1"
      />
      <InputComponent
        value={set.reps}
        onChange={(e) => handleChange("reps", e.target.value)}
        className={styles["set-input"]}
        type="number"
      />
      <InputComponent
        value={set.weight}
        onChange={(e) => handleChange("weight", e.target.value)}
        className={styles["set-input"]}
        type="number"
      />
      <InputComponent
        value={set.rest}
        onChange={(e) => handleChange("rest", e.target.value)}
        className={styles["set-input"]}
        type="number"
      />
    </div>
  );
};

// 운동 카드 렌더링 컴포넌트
const ExerciseCard = ({ exercise, onSetChange }) => {
  return (
    <div key={exercise.id} className={styles["exercise-card"]}>
      <div className={styles["exercise-header"]}>
        <div className={styles["exercise-icon"]}>🏋️</div>
        <div className={styles["exercise-name"]}>{exercise.name}</div>
        <div className={styles["exercise-category"]}>{exercise.category}</div>
      </div>

      <div className={styles["exercise-sets"]}>
        <div className={styles["sets-header"]}>
          <span>세트</span>
          <span>횟수</span>
          <span>중량(kg)</span>
          <span>휴식(초)</span>
        </div>
        {exercise.sets.map((set) => (
          <ExerciseSetRow
            key={set.setNumber}
            set={set}
            exerciseId={exercise.id}
            onSetChange={onSetChange}
          />
        ))}
      </div>
    </div>
  );
};

// 모달 푸터 렌더링 컴포넌트
const ModalFooter = ({ modalType, onSave, onClose }) => {
  if (!MODAL_CONFIGS[modalType]?.hasFooter) return null;

  const getFooterButtons = () => {
    switch (modalType) {
      case "workout":
        return (
          <>
            <ButtonComponent variant="primary" onClick={onSave}>
              저장
            </ButtonComponent>
            <ButtonComponent variant="secondary" onClick={onClose}>
              취소
            </ButtonComponent>
          </>
        );
      case "form":
        return (
          <>
            <ButtonComponent variant="primary" onClick={onSave}>
              제출
            </ButtonComponent>
            <ButtonComponent variant="secondary" onClick={onClose}>
              취소
            </ButtonComponent>
          </>
        );
      case "confirmation":
        return (
          <>
            <ButtonComponent variant="danger" onClick={onClose}>
              확인
            </ButtonComponent>
            <ButtonComponent variant="secondary" onClick={onClose}>
              취소
            </ButtonComponent>
          </>
        );
      default:
        return null;
    }
  };

  return <ModalComponent.Actions>{getFooterButtons()}</ModalComponent.Actions>;
};

const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DATA);

  // 모달 열기
  const handleOpenModal = (type) => {
    setModalType(type);
    setIsOpen(true);
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setIsOpen(false);
    setFormData({ name: "", email: "", category: "", message: "" });
  };

  // 폼 입력 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 폼 제출 처리
  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    handleCloseModal();
  };

  // 운동 세트 변경 처리
  const handleSetChange = (exerciseId, setNumber, field, value) => {
    setWorkoutData((prev) => ({
      ...prev,
      exercises: prev.exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.setNumber === setNumber ? { ...set, [field]: value } : set
              ),
            }
          : exercise
      ),
    }));
  };

  // 운동 데이터 저장
  const handleSaveWorkout = () => {
    console.log("운동 데이터 저장:", workoutData);
    alert("운동 데이터가 저장되었습니다!");
  };

  // 모달 내용 렌더링
  const renderModalContent = () => {
    switch (modalType) {
      case "basic":
        return (
          <div>
            <p>
              이것은 기본 모달입니다. 간단한 메시지나 확인을 위해 사용할 수
              있습니다.
            </p>
            <p>
              모달은 사용자의 주의를 끌고 중요한 정보를 표시하는 데 유용합니다.
            </p>
          </div>
        );

      case "form":
        return (
          <form>
            <ModalComponent.Section>
              {FORM_FIELDS.map((field) => (
                <FormField
                  key={field.id}
                  field={field}
                  value={formData[field.id]}
                  onChange={handleInputChange}
                />
              ))}
            </ModalComponent.Section>
          </form>
        );

      case "confirmation":
        return (
          <div>
            <p>정말로 이 작업을 수행하시겠습니까?</p>
            <p>이 작업은 되돌릴 수 없습니다.</p>
          </div>
        );

      case "workout":
        return (
          <div className={styles["workout-detail-modal"]}>
            {/* 상단 요약 정보 */}
            <div className={styles["workout-summary"]}>
              <div className={styles["summary-card"]}>
                <div className={styles["summary-label"]}>총 운동 시간</div>
                <div className={styles["summary-value"]}>
                  {workoutData.totalTime}
                </div>
              </div>
              <div className={styles["summary-card"]}>
                <div className={styles["summary-label"]}>총 세트 수</div>
                <div className={styles["summary-value"]}>
                  {workoutData.totalSets}
                </div>
              </div>
              <div className={styles["summary-card"]}>
                <div className={styles["summary-label"]}>예상 소모 칼로리</div>
                <div className={styles["summary-value"]}>
                  {workoutData.estimatedCalories}
                </div>
              </div>
            </div>
            {/* 운동 목록 */}
            <div className={styles["workout-exercises"]}>
              {workoutData.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onSetChange={handleSetChange}
                />
              ))}
            </div>
          </div>
        );

      default:
        return <div>기본 내용</div>;
    }
  };

  // 현재 모달 설정 가져오기
  const getCurrentModalConfig = () => {
    const config = MODAL_CONFIGS[modalType];
    if (modalType === "workout") {
      config.title = workoutData.title;
    }
    return config;
  };

  // 저장 핸들러 선택
  const getSaveHandler = () => {
    switch (modalType) {
      case "workout":
        return handleSaveWorkout;
      case "form":
        return handleSubmit;
      default:
        return undefined;
    }
  };

  const currentConfig = getCurrentModalConfig();

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>ModalComponent 사용 예시</h2>

      {/* 모달 열기 버튼들 */}
      <div style={{ display: "grid", gap: "16px", marginBottom: "30px" }}>
        {Object.keys(MODAL_CONFIGS).map((type) => (
          <ButtonComponent
            key={type}
            variant={
              type === "basic"
                ? "primary"
                : type === "form"
                ? "success"
                : type === "confirmation"
                ? "warning"
                : "info"
            }
            onClick={() => handleOpenModal(type)}
          >
            {type === "basic" && "기본 모달 열기"}
            {type === "form" && "폼 모달 열기"}
            {type === "confirmation" && "확인 모달 열기"}
            {type === "workout" && "운동 상세 정보 모달 열기"}
          </ButtonComponent>
        ))}
      </div>

      {/* 모달 컴포넌트 */}
      <ModalComponent
        isOpen={isOpen}
        onClose={handleCloseModal}
        {...currentConfig}
        footer={
          <ModalFooter
            modalType={modalType}
            onSave={getSaveHandler()}
            onClose={handleCloseModal}
          />
        }
      >
        {renderModalContent()}
      </ModalComponent>

      {/* 모달 특징 설명 */}
      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>ModalComponent 특징</h3>
        <ul>
          <li>
            <strong>접근성</strong>: 키보드 네비게이션 및 스크린 리더 지원
          </li>
          <li>
            <strong>반응형</strong>: 모든 화면 크기에서 최적화
          </li>
          <li>
            <strong>커스터마이징</strong>: 크기, 스타일, 동작 방식 조정 가능
          </li>
          <li>
            <strong>애니메이션</strong>: 부드러운 열기/닫기 효과
          </li>
          <li>
            <strong>다크 모드</strong>: 시스템 설정에 따른 자동 테마 전환
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ModalExample;
