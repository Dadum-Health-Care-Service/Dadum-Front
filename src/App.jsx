import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import PoseAccuracyMVP from "./components/pages/Pose/PoseAccuracyMVP.jsx";

// Common Components
import HeaderComponent from "./components/common/HeaderComponent";
import ButtonComponent from "./components/common/ButtonComponent";
import BottomNavigation from "./components/common/BottomNavigation";

// Pages
import Home from "./components/pages/Home/Home.jsx";
import Routine from "./components/pages/Routine/Routine.jsx";
import Social from "./components/pages/Social/Social.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState("home");
  const [isMobile, setIsMobile] = useState(false);

  // 반응형 디자인을 위한 화면 크기 감지
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // 초기 체크
    checkIsMobile();

    // 리사이즈 이벤트 리스너
    window.addEventListener("resize", checkIsMobile);

    // 클린업
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const handleLoginClick = () => setIsLoggedIn(true);
  const handleSignupClick = () => setIsLoggedIn(true);
  const handleLogoutClick = () => setIsLoggedIn(false);
  const handleTabChange = (tabId) => setActiveTab(tabId);
  const handleHeaderMenuClick = (menuId) => setActiveHeaderMenu(menuId);

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home />;
      case "routine":
        return <Routine />;
      case "pose": // ← 새 탭: 자세 분석
        return <PoseAccuracyMVP />;
      case "statistics":
        return (
          <div className="container mt-5 pt-5">
            <h1>통계 페이지</h1>
            <p>통계 기능은 개발 중입니다.</p>
          </div>
        );
      case "social":
        return <Social />;
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
        {/* 웹 환경에서만 헤더 표시 */}
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
              <ButtonComponent>로그인</ButtonComponent>
            </HeaderComponent.Section>
          </HeaderComponent>
        )}

        <main
          style={{
            marginTop: isMobile ? "20px" : "80px",
            marginBottom: isMobile ? "80px" : "20px",
            display: "flex",
          }}
        >
          {renderContent()}
        </main>

        {/* 모바일 환경에서만 하단 네비게이션 표시 */}
        {isMobile && (
          <BottomNavigation
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
