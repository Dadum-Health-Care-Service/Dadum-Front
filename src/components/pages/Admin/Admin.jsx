import React, { useState, useEffect } from "react";
import ModalComponent from "../../common/ModalComponent";
import ButtonComponent from "../../common/ButtonComponent";
import InputComponent from "../../common/InputComponent";
import SelectComponent from "../../common/SelectComponent";
import TextareaComponent from "../../common/TextareaComponent";
import ContainerComponent from "../../common/ContainerComponent";
import styles from "./Admin.module.css";
import Users from "./Section/Users/Users";
import ToggleComponent from "../../common/ToggleComponent";



// 메인 Admin 컴포넌트
const Admin = ({ isMobile, isNotify, setIsNotify }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [workoutData, setWorkoutData] = useState(INITIAL_WORKOUT_DATA);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 모달 열기 핸들러
  const handleOpenModal = (type) => {
    setModalType(type);
    setIsOpen(true);
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsOpen(false);
    setFormData({ name: "", email: "", category: "", message: "" });
  };

  // 폼 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 폼 제출 핸들러
  const handleSubmit = () => {
    console.log("Form submitted:", formData);
    handleCloseModal();
  };

  // 운동 세트 변경 핸들러
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

  // 운동 데이터 저장 핸들러
  const handleSaveWorkout = () => {
    console.log("운동 데이터 저장:", workoutData);
    alert("운동 데이터가 저장되었습니다!");
  };

  // 기본 모달 내용 렌더링
  const renderBasicModalContent = () => (
    <div>
      <p>
        이것은 기본 모달입니다. 간단한 메시지나 확인을 위해 사용할 수 있습니다.
      </p>
      <p>모달은 사용자의 주의를 끌고 중요한 정보를 표시하는 데 유용합니다.</p>
    </div>
  );

  // 폼 모달 내용 렌더링
  const renderFormModalContent = () => (
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

  // 확인 모달 내용 렌더링
  const renderConfirmationModalContent = () => (
    <div>
      <p>정말로 이 작업을 수행하시겠습니까?</p>
      <p>이 작업은 되돌릴 수 없습니다.</p>
    </div>
  );

  // 운동 요약 정보 렌더링
  const renderWorkoutSummary = () => (
    <div className={styles["workout-summary"]}>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>총 운동 시간</div>
        <div className={styles["summary-value"]}>{workoutData.totalTime}</div>
      </div>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>총 세트 수</div>
        <div className={styles["summary-value"]}>{workoutData.totalSets}</div>
      </div>
      <div className={styles["summary-card"]}>
        <div className={styles["summary-label"]}>예상 소모 칼로리</div>
        <div className={styles["summary-value"]}>
          {workoutData.estimatedCalories}
        </div>
      </div>
    </div>
  );

  // 운동 목록 렌더링
  const renderWorkoutExercises = () => (
    <div className={styles["workout-exercises"]}>
      {workoutData.exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onSetChange={handleSetChange}
        />
      ))}
    </div>
  );

  // 운동 모달 내용 렌더링
  const renderWorkoutModalContent = () => (
    <div className={styles["workout-detail-modal"]}>
      {renderWorkoutSummary()}
      {renderWorkoutExercises()}
    </div>
  );

  // 모달 내용 렌더링
  const renderModalContent = () => {
    switch (modalType) {
      case "basic":
        return renderBasicModalContent();
      case "form":
        return renderFormModalContent();
      case "confirmation":
        return renderConfirmationModalContent();
      case "workout":
        return renderWorkoutModalContent();
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

  // 모달 열기 버튼들 렌더링
  const renderModalOpenButtons = () => (
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
  );

  // 모달 특징 설명 렌더링
  const renderModalFeatures = () => (
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
  );

  const currentConfig = getCurrentModalConfig();

  const SectionHeader = ({ title, description }) => (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff",
        position: "sticky",
        top: 0,
        zIndex: 1,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 20 }}>{title}</h2>
      {description && (
        <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>
          {description}
        </p>
      )}
    </div>
  );

  const DashboardSection = () => (
    <div style={{ padding: 0 }}>
      <iframe
        title="dashboard-embed"
        src="http://192.168.0.30:5601/app/r/s/ZwhPG"
        style={{
          width: "100%",
          height: "calc(100vh - 64px)",
          border: "none",
          background: "#ffffff",
        }}
      />
    </div>
  );

  const Placeholder = ({ label }) => (
    <div style={{ padding: 20 }}>
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <p style={{ margin: 0, color: "#475569" }}>
          {label} 페이지가 곧 제공됩니다.
        </p>
      </div>
    </div>
  );

  const UISection = () => (
    <div style={{ padding: 20 }}>
      <h3 style={{ margin: "0 0 16px" }}>ModalComponent 사용 예시</h3>
      {renderModalOpenButtons()}

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

      {renderModalFeatures()}
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return (
          <>
            <SectionHeader
              title="대시보드"
              description="핵심 지표를 한눈에 확인하세요"
            />
            <DashboardSection />
          </>
        );
      case "users":
        return (
          <>
            <SectionHeader
              title="사용자 관리"
              description="사용자 목록과 권한을 관리합니다"
            />

            <ContainerComponent
              variant="filled"
              shadow="none"
              borderRadius="none"
              className={styles.section}
            >
              <ToggleComponent
                content={["사용자 목록", "권한 요청"]}
                isNotify={isNotify}
                viewNotify={setIsNotify}
                notifyIndex={1}
              >
                {[
                  <Users type="user" />,
                  <Users type="roleRequest" isNotify={isNotify} />,
                ]}
              </ToggleComponent>
            </ContainerComponent>
          </>
        );
      case "contents":
        return (
          <>
            <SectionHeader
              title="콘텐츠 관리"
              description="게시물과 자산을 관리합니다"
            />
            <Placeholder label="콘텐츠 관리" />
          </>
        );
      case "orders":
        return (
          <>
            <SectionHeader
              title="주문/거래 관리"
              description="주문 흐름과 상태를 모니터링합니다"
            />
            <Placeholder label="주문/거래 관리" />
          </>
        );
      case "reports":
        return (
          <>
            <SectionHeader
              title="통계 및 리포트"
              description="서비스 데이터를 분석합니다"
            />
            <Placeholder label="통계 및 리포트" />
          </>
        );
      case "settings":
        return (
          <>
            <SectionHeader
              title="시스템 설정"
              description="환경 설정과 통합을 관리합니다"
            />
            <Placeholder label="시스템 설정" />
          </>
        );
      case "support":
        return (
          <>
            <SectionHeader
              title="고객 지원 관리"
              description="문의와 티켓을 처리합니다"
            />
            <Placeholder label="고객 지원 관리" />
          </>
        );
      case "security":
        return (
          <>
            <SectionHeader
              title="보안 관리"
              description="접근 제어와 로그를 확인합니다"
            />
            <Placeholder label="보안 관리" />
          </>
        );
      case "ui":
        return (
          <>
            <SectionHeader
              title="UI / 모달 데모"
              description="공통 컴포넌트 데모 모음"
            />
            <UISection />
          </>
        );
      default:
        return (
          <>
            <SectionHeader title="대시보드" />
            <DashboardSection />
          </>
        );
    }
  };

  const SidebarLink = ({ id, label, emoji }) => (
    <button
      onClick={() => {
        setActiveSection(id);
        setSidebarOpen(false);
      }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "10px 12px",
        border: "none",
        background: activeSection === id ? "#e2e8f0" : "transparent",
        borderRadius: 8,
        color: "#0f172a",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <span style={{ width: 22 }}>{emoji}</span>
      <span style={{ fontSize: 14 }}>{label}</span>
    </button>
  );

  const Sidebar = () => (
    <aside
      className={`${styles["sidebar"]} ${sidebarOpen ? styles["is-open"] : ""}`}
    >
      {isMobile && (
        <button
          className={styles["close-btn"]}
          onClick={() => setSidebarOpen(false)}
          aria-label="close sidebar"
        >
          ✕
        </button>
      )}
      <div style={{ fontWeight: 700, marginBottom: 12, color: "#0f172a" }}>
        관리자
      </div>
      <div style={{ display: "grid", gap: 4 }}>
        <SidebarLink id="dashboard" label="대시보드" emoji="📊" />
        <SidebarLink id="users" label="사용자 관리" emoji="👥" />
        <SidebarLink id="contents" label="콘텐츠 관리" emoji="🗂️" />
        <SidebarLink id="orders" label="주문/거래 관리" emoji="🧾" />
        <SidebarLink id="reports" label="통계 및 리포트" emoji="📈" />
        <SidebarLink id="settings" label="시스템 설정" emoji="⚙️" />
        <SidebarLink id="support" label="고객 지원 관리" emoji="💬" />
        <SidebarLink id="security" label="보안 관리" emoji="🔐" />
        <div style={{ height: 8 }} />
        <div style={{ fontSize: 12, color: "#64748b", padding: "6px 8px" }}>
          데모
        </div>
        <SidebarLink id="ui" label="UI / 모달" emoji="🧩" />
      </div>
    </aside>
  );

  return (
    <div className={styles["admin-layout"]}>
      <div
        className={`${styles["overlay"]} ${sidebarOpen ? styles["show"] : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <Sidebar />

      <section className={styles["content"]}>
        <div className={styles["topbar"]}>
          {isMobile && (
            <>
              <button
                className={styles["menu-btn"]}
                onClick={() => setSidebarOpen(true)}
                aria-label="open sidebar"
              >
                ☰
              </button>

              <h2 style={{ margin: 0, fontSize: 16 }}>Admin</h2>
            </>
          )}
        </div>
        {renderSection()}
      </section>
    </div>
  );
};

export default Admin;
