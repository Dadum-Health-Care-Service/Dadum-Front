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
