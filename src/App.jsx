import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import PoseAccuracyMVP from "./components/pages/Pose/PoseAccuracyMVP.jsx";

// Common Components
import HeaderComponent from "./components/common/HeaderComponent";
import ButtonComponent from "./components/common/ButtonComponent";
import BottomNavigation from "./components/common/BottomNavigation";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Pages
import Home from "./components/pages/Home/Home.jsx";
import Routine from "./components/pages/Routine/Routine.jsx";
import CalorieCam from "./components/pages/Calorie/CalorieCam.jsx";

// DailySummary 
import DailySummary from "./components/pages/Summary/DailySummary.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleLoginClick = () => setIsLoggedIn(true);
  const handleSignupClick = () => setIsLoggedIn(true);
  const handleLogoutClick = () => setIsLoggedIn(false);
  const handleTabChange = (tabId) => setActiveTab(tabId);
  const handleHeaderMenuClick = (menuId) => setActiveHeaderMenu(menuId);

  // 로그인 후 자동으로 usersId를 콘솔에 출력 (axios .then 스타일)
  useEffect(() => {
    if (!isLoggedIn) return;
    const savedEmail =
      localStorage.getItem("usersEmail") || localStorage.getItem("email");
    if (!savedEmail) {
      console.log("[usersId] 이메일이 저장되어 있지 않습니다. 로그인 저장 로직을 확인하세요.");
      return;
    }
    axios
      .get(`/api/v1/users/email/${encodeURIComponent(savedEmail)}`)
      .then((res) => {
        console.log("[usersId] axios res:", res);
        console.log("[usersId] axios res.data:", res?.data);
        const id = res?.data?.usersId ?? res?.data?.id;
        console.log("[usersId] value:", id);
        if (id) localStorage.setItem("usersId", String(id));
      })
      .catch((e) => {
        console.warn(
          "[usersId] 조회 실패:",
          e?.response?.data || e.message
        );
      });
  }, [isLoggedIn]);

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">🎯 다듬</h1>
            <p className="login-subtitle">루틴을 관리하고 자세를 분석해보세요</p>
          </div>
          <div className="login-form">
            <ButtonComponent
              variant="primary"
              size="lg"
              className="login-button"
              onClick={handleLoginClick}
            >
              로그인
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="lg"
              className="signup-button"
              onClick={handleSignupClick}
            >
              회원가입
            </ButtonComponent>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case "home":
        return <Home />;
      case "routine":
        return <Routine />;
      case "pose":
        return <PoseAccuracyMVP />;
      case "calorie":
        return <CalorieCam />;

      // ✅ 추가: 일일 요약 탭
      case "daily":
        return <DailySummary />;

      case "statistics":
        return (
          <div className="container mt-5 pt-5">
            <h1>통계 페이지</h1>
            <p>통계 기능은 개발 중입니다.</p>
          </div>
        );
      case "social":
        return (
          <div className="container mt-5 pt-5">
            <h1>소셜 페이지</h1>
            <p>소셜 기능은 개발 중입니다.</p>
          </div>
        );
      case "mypage":
        return (
          <div className="container mt-5 pt-5">
            <h1>마이페이지</h1>
            <p>마이페이지 기능은 개발 중입니다.</p>
          </div>
        );
      default:
        return <Home />;
    }
  };

  return (
    <Router>
      <div className="App">
        {isLoggedIn && (
          <>
            {!isMobile && (
              <HeaderComponent variant="elevated" size="large" sticky>
                <HeaderComponent.Section>
                  <HeaderComponent.Brand
                    logo="🎯"
                    brandName="다듬"
                    onClick={() => {
                      setActiveTab("home");
                      setActiveHeaderMenu("home");
                    }}
                    style={{ cursor: "pointer" }}
                  />
                </HeaderComponent.Section>

                <HeaderComponent.Section>
                  <HeaderComponent.Navigation>
                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "routine"}
                      onClick={() => {
                        handleHeaderMenuClick("routine");
                        setActiveTab("routine");
                      }}
                    >
                      루틴
                    </HeaderComponent.MenuItem>

                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "pose"}
                      onClick={() => {
                        handleHeaderMenuClick("pose");
                        setActiveTab("pose");
                      }}
                    >
                      분석
                    </HeaderComponent.MenuItem>

                    {/* 칼로리 */}
                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "calorie"}
                      onClick={() => {
                        handleHeaderMenuClick("calorie");
                        setActiveTab("calorie");
                      }}
                    >
                      칼로리
                    </HeaderComponent.MenuItem>

                    {/* ✅ 추가: 일일 요약 메뉴 */}
                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "daily"}
                      onClick={() => {
                        handleHeaderMenuClick("daily");
                        setActiveTab("daily");
                      }}
                    >
                      일일 요약
                    </HeaderComponent.MenuItem>

                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "statistics"}
                      onClick={() => handleHeaderMenuClick("statistics")}
                    >
                      통계
                    </HeaderComponent.MenuItem>

                    <HeaderComponent.MenuItem
                      active={activeHeaderMenu === "social"}
                      onClick={() => handleHeaderMenuClick("social")}
                    >
                      소셜
                    </HeaderComponent.MenuItem>
                  </HeaderComponent.Navigation>

                  <ButtonComponent
                    variant="outline-secondary"
                    onClick={handleLogoutClick}
                  >
                    로그아웃
                  </ButtonComponent>
                </HeaderComponent.Section>
              </HeaderComponent>
            )}

            {isMobile && (
              <BottomNavigation
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            )}
          </>
        )}

        <main
          style={{
            marginTop: isLoggedIn ? (isMobile ? "20px" : "0") : "0",
            marginBottom: isLoggedIn ? (isMobile ? "80px" : "20px") : "0",
            display: "flex",
            minHeight: isLoggedIn ? "auto" : "100vh",
          }}
        >
          <ErrorBoundary>
            {renderContent()}
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;