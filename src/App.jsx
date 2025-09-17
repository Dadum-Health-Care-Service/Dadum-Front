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

//Contexts
import { RunProvider } from "./context/RunContext.jsx";
import { RoutineProvider } from "./context/RoutineContext.jsx";
import { SuggestProvider } from "./context/SuggestContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { POST } from "./utils/api/api";
import MyPage from "./components/pages/MyPage/MyPage.jsx";
import SamplePage from "./components/pages/SamplePage/SamplePage.jsx";

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

  const handleLoginClick = () => {
    POST(
      "/users/login",
      {
        email: "test@test.com",
        password: "testuser",
      },
      false
    ).then((res) => {
      localStorage.setItem("token", res.data.accessToken);
      setIsLoggedIn(true);
    });
  };
  const handleSignupClick = () => {
    POST(
      "/users/signup",
      {
        usersName: "테스트유저",
        email: "test@test.com",
        profileImg: "/img/userAvatar.png",
        nickName: "테스트닉네임",
        phoneNum: "01012345678",
        biosDto: {
          gender: 0,
          age: 40,
          height: 180,
          weight: 90,
        },
        authDto: {
          password: "testuser",
        },
      },
      false
    ).then(() => {
      setIsLoggedIn(true);
    });
  };
  const handleLogoutClick = () => setIsLoggedIn(false);
  const handleTabChange = (tabId) => setActiveTab(tabId);
  const handleHeaderMenuClick = (menuId) => setActiveHeaderMenu(menuId);

  const renderContent = () => {
    // 로그인되지 않은 경우 로그인 화면 표시
    if (!isLoggedIn) {
      return (
        <div className="login-container">
          <div className="login-header">
            <h1 className="login-title">🎯 다듬</h1>
            <p className="login-subtitle">
              루틴을 관리하고 자세를 분석해보세요
            </p>
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

    // 로그인된 경우 기존 페이지들 표시
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
        return (
          <SamplePage />
          //<div className="container mt-5 pt-5">
          //  <h1>소셜 페이지</h1>
          //  <p>소셜 기능은 개발 중입니다.</p>
          //</div>
        );
      case "mypage":
        return (
          <MyPage />
        );
      default:
        return <Home />;
    }
  };

  return (
    <Router>
      <AuthProvider>
        <RunProvider>
          <RoutineProvider>
            <SuggestProvider>
              <div className="App">
                {/* 로그인된 경우에만 헤더와 네비게이션 표시 */}
                {isLoggedIn && (
                  <>
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
                              onClick={() =>
                                handleHeaderMenuClick("statistics")
                              }
                            >
                              통계
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                              active={activeHeaderMenu === "social"}
                              onClick={() => {handleHeaderMenuClick("social")}}
                            >
                              소셜
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                              active={activeHeaderMenu === "mypage"}
                              onClick={() => {
                                handleHeaderMenuClick("mypage");
                                setActiveTab("mypage")
                              }}
                            >
                              마이페이지
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

                    {/* 모바일 환경에서만 하단 네비게이션 표시 */}
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
                    marginBottom: isLoggedIn
                      ? isMobile
                        ? "80px"
                        : "20px"
                      : "0",
                    display: "flex",
                    minHeight: isLoggedIn ? "auto" : "100vh",
                  }}
                >
                  {renderContent()}
                </main>
              </div>
            </SuggestProvider>
          </RoutineProvider>
        </RunProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
