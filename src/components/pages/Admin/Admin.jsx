import React, { useState, useEffect, useContext } from "react";
import ModalComponent from "../../common/ModalComponent";
import ButtonComponent from "../../common/ButtonComponent";
import InputComponent from "../../common/InputComponent";
import SelectComponent from "../../common/SelectComponent";
import TextareaComponent from "../../common/TextareaComponent";
import ContainerComponent from "../../common/ContainerComponent";
import styles from "./Admin.module.css";
import Users from "./Section/Users/Users";
import Security from "./Section/Security/Security";
import ToggleComponent from "../../common/ToggleComponent";
import FraudDetection from "../Payments/FraudDetection";
import FraudStatistics from "./components/FraudStatistics";
import RealTimeMonitor from "./components/RealTimeMonitor";
import SystemTest from "./components/SystemTest";
import PerformanceMonitor from "./components/PerformanceMonitor";
import TransactionManagement from "./TransactionManagement";
import { AuthContext } from "../../../context/AuthContext";

// 메인 Admin 컴포넌트
const Admin = ({ isMobile, isNotify, setIsNotify }) => {
  const { dispatch } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        src={`${import.meta.env.VITE_ELASTICSEARCH_URL}:5601/app/r/s/ZwhPG`}
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
                  <Users type="user" isNotify={isNotify} />,
                  <Users type="roleRequest" isNotify={isNotify} />,
                ]}
              </ToggleComponent>
            </ContainerComponent>
          </>
        );
      case "transactions":
        return (
          <>
            <SectionHeader
              title="거래 관리"
              description="AI 기반 이상거래 탐지 및 거래 관련 모든 기능을 관리합니다"
            />
            <TransactionManagement />
          </>
        );
      case "reports":
        return (
          <>
            <SectionHeader
              title="실시간 페이지 통계"
              description="실시간 페이지 내 트래픽, 조회수, 사용자 통계등을 조회합니다"
            />
            <ContainerComponent
              variant="filled"
              shadow="none"
              borderRadius="none"
              className={styles.section}
            >
              <iframe
                title="reports-embed"
                src='https://lookerstudio.google.com/embed/reporting/a58d20f5-fc94-4b00-90e6-42f77385bdd9/page/kIV1C?params=%7B"dp56":"a310653790w507274485","df1":"include%25EE%2580%25800%25EE%2580%2580IN%25EE%2580%2580THIS_MONTH"%7D'
                style={{
                  width: "100%",
                  height: "calc(100vh - 64px)",
                  border: "none",
                  background: "#ffffff",
                }}
              />
            </ContainerComponent>
            <Placeholder label="실시간 페이지 통계" />
          </>
        );
      case "security":
        return (
          <>
            <SectionHeader
              title="보안 관리"
              description="접근 제어와 로그를 확인합니다"
            />
            <ContainerComponent
              variant="filled"
              shadow="none"
              borderRadius="none"
              className={styles.section}
            >
              <Security />
            </ContainerComponent>
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
        <div style={{ fontSize: 12, color: "#64748b", padding: "6px 8px" }}>
          관리 및 통계
        </div>
        <SidebarLink id="dashboard" label="대시보드" emoji="📊" />
        <SidebarLink id="users" label="사용자 관리" emoji="👥" />
        <SidebarLink id="transactions" label="거래 관리" emoji="💳" />
        <SidebarLink id="reports" label="실시간 페이지 통계" emoji="📈" />
        <SidebarLink id="security" label="보안 관리" emoji="🔐" />
        {isMobile && (
          <>
            <div style={{ fontSize: 12, color: "#64748b", padding: "6px 8px" }}>
              로그아웃
            </div>
            <div style={{ height: 8 }} />

            <ButtonComponent
              onClick={() => {
                dispatch({ type: "LOGOUT" });
                navigate("/login");
              }}
            >
              {"로그아웃"}
            </ButtonComponent>
          </>
        )}
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
