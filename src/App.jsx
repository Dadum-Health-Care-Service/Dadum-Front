import React, { useState, useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import PoseAccuracyMVP from "./components/pages/Pose/PoseAccuracyMVP.jsx";
import Login from "./components/pages/Login/Login.jsx";

import { AuthProvider } from "./context/AuthContext.jsx";
import { RunProvider } from "./context/RunContext.jsx";
import { RoutineProvider } from "./context/RoutineContext.jsx";
import { SuggestProvider } from "./context/SuggestContext.jsx";
import { POST, GET } from "./utils/api/api";

// Common Components
import HeaderComponent from "./components/common/HeaderComponent";
import ButtonComponent from "./components/common/ButtonComponent";
import BottomNavigation from "./components/common/BottomNavigation";
import ContainerComponent from "./components/common/ContainerComponent";


// Pages
import Home from "./components/pages/Home/Home.jsx";
import Routine from "./components/pages/Routine/Routine.jsx";
import Chatbot from "./components/pages/Chatbot/Chatbot.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [selectedListItem, setSelectedListItem] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState("home");
  const [isMobile, setIsMobile] = useState(false);
  const [QR, setQR] = useState(null);

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
    setActiveTab("login");
    // POST(
    //   "/users/login",
    //   {
    //     email: "test@test.com",
    //     password: "testuser",
    //   },
    //   false
    // ).then((res) => {
    //   localStorage.setItem("token", res.data.accessToken);
    //   setIsLoggedIn(true);
    // });
  };
  const handleSignupClick = () => {
    const testEmail = "test" + Date.now() + "@test.com";
    console.log("회원가입 시도:", testEmail);
    
    POST(
      "/users/signup",
      {
        usersName: "테스트유저",
        email: testEmail,
        profileImg: "/img/userAvatar.png",
        nickName: "테스트닉네임",
        phoneNum: "01012345678",
        biosDto: {
          gender: false,
          age: 40,
          height: 180,
          weight: 90,
        },
        authDto: {
          password: "testuser",
        },
      },
      false
    ).then((response) => {
      console.log("회원가입 성공:", response);
      setIsLoggedIn(true);
    }).catch((error) => {
      console.error("회원가입 실패:", error.response?.data || error.message);
    });
  };

  const handlePasswordlessSignupClick = () => {
    POST("/join", { id: "test02", pw: "test02" }, false, "passwordless").then(
      (res) => {
        console.log(res.data);
      }
    );
  };
  const handlePasswordlessLoginClick = () => {
    POST(
      "/loginCheck",
      { id: "test02", pw: "test02" },
      false,
      "passwordless"
    ).then((res) => {
      console.log(res.data);
    });
  };
  const handlePasswordlessRegisterClick = async () => {
    await POST(
      "/passwordlessManageCheck",
      { id: "test02", pw: "test02" },
      false,
      "passwordless"
    ).then(async (res) => {
      console.log(res.data);
      if (res.data.result === "OK") {
        const passwordlessToken = res.data.PasswordlessToken;
        await POST(
          "/passwordlessCallApi",
          { url: "isApUrl", params: `userId=${"test02"}&QRReg=` },
          false,
          "passwordless"
        ).then(async (res) => {
          if (res.data.result === "OK") {
            console.log(`userId=test02&token=${passwordlessToken}`);
            await POST(
              "/passwordlessCallApi",
              {
                url: "joinApUrl",
                params: `userId=${"test02"}&token=${passwordlessToken}`,
              },
              false,
              "passwordless"
            ).then((res) => {
              console.log(JSON.parse(res.data.data));
              const result_data = JSON.parse(res.data.data);
              console.log(result_data.data.qr);
              setQR(result_data.data.qr);
            });
          }
        });
      }
    });
  };

  useEffect(() => {
    // QR 코드 상태 변경 감지 (필요시 로직 추가)
  }, [QR]);

  const handleLogoutClick = () => setIsLoggedIn(false);
  const handleTabChange = (tabId) => setActiveTab(tabId);
  const handleHeaderMenuClick = (menuId) => setActiveHeaderMenu(menuId);

  const renderContent = () => {
    // 로그인되지 않은 경우
    if (!isLoggedIn) {
      // activeTab이 "login"인 경우 Login 컴포넌트 표시
      if (activeTab === "login") {
        return (
          <Login setIsLoggedIn={setIsLoggedIn} setActiveTab={setActiveTab} />
        );
      }

      // 기본 로그인 화면 표시
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
            {/* <ButtonComponent
              variant="outline-primary"
              size="lg"
              className="signup-button"
              onClick={handlePasswordlessSignupClick}
            >
              패스워드리스 가입
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="lg"
              className="signup-button"
              onClick={handlePasswordlessLoginClick}
            >
              패스워드리스 로그인
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="lg"
              className="signup-button"
              onClick={handlePasswordlessRegisterClick}
            >
              패스워드리스 등록
            </ButtonComponent>
            {QR && (
              <ContainerComponent>
                <h4>패스워드리스 등록</h4>
                <img src={QR} alt="QR" />
              </ContainerComponent>
            )} */}
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
      case "achievement":
        return (
          <div className="container mt-5 pt-5">
            <h1>업적 페이지</h1>
            <p>업적 기능은 개발 중입니다.</p>
          </div>
        );
      case "pose": // ← 새 탭: 자세 분석
        return <PoseAccuracyMVP />;
      case "login":
        return (
          <Login setIsLoggedIn={setIsLoggedIn} setActiveTab={setActiveTab} />
        );
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

  // PC: /login 경로에서는 로그인 페이지만 단독 렌더링
  if (typeof window !== 'undefined' && window.location.pathname === '/login') {
    return <Login onLoginSuccess={() => { window.location.href = '/'; }} />;
  }

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
                              active={activeHeaderMenu === "achievement"}
                              onClick={() => {
                                handleHeaderMenuClick("achievement");
                                setActiveTab("achievement");
                              }}
                            >
                              업적
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
                
                {/* 로그인된 경우에만 하단 네비게이션과 챗봇 표시 */}
                {isLoggedIn && (
                   <>
                    {/* 모바일 환경에서만 하단 네비게이션 표시 */}
                    {isMobile && (
                      <BottomNavigation
                        activeTab={activeTab}
                        onTabChange={handleTabChange}
                      />
                    )}

                    {/* 플로팅 챗봇 - 로그인한 사용자에게만 표시 */}
                    <Chatbot 
                      onMessageSend={(userMessage, botResponse) => {
                        console.log('사용자 메시지:', userMessage);
                        console.log('봇 응답:', botResponse);
                      }}
                    />
                  </>
                )}
              </div>
            </SuggestProvider>
          </RoutineProvider>
        </RunProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
