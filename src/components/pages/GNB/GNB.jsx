import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import HeaderComponent from "../../common/HeaderComponent";
import ButtonComponent from "../../common/ButtonComponent";
import BottomNavigation from "../../common/BottomNavigation";
import NotificationDot from "../../common/NotificationDot";
import Chatbot from "../Chatbot/Chatbot";

export default function GNB({ isMobile, isNotify }) {
  const { user, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  console.log("isNotify", isNotify, isNotify === "REQUEST_ROLE");
  const isActive = (pathname) => location.pathname === pathname;

  const handleLogoutClick = (e) => {
    e.preventDefault();
    dispatch({ type: "LOGOUT" });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      <div className="App">
        {/* 웹 환경에서만 헤더 표시 */}
        {!isMobile && (
          <HeaderComponent variant="elevated" size="large" sticky>
            <HeaderComponent.Section>
              <HeaderComponent.Brand
                logo="🎯"
                brandName="다듬"
                onClick={() => navigate("/")}
                style={{ cursor: "pointer" }}
              />
            </HeaderComponent.Section>

            <HeaderComponent.Section>
              <HeaderComponent.Navigation>
                <HeaderComponent.MenuItem
                  active={isActive("/routine")}
                  onClick={() => navigate("/routine")}
                >
                  루틴
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={isActive("/shop")}
                  onClick={() => navigate("/shop")}
                >
                  쇼핑
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={isActive("/pose")}
                  onClick={() => navigate("/pose")}
                >
                  분석
                </HeaderComponent.MenuItem>

                <HeaderComponent.MenuItem
                  active={isActive("/calorie")}
                  onClick={() => navigate("/calorie")}
                >
                  칼로리
                </HeaderComponent.MenuItem>

                <HeaderComponent.MenuItem
                  active={isActive("/daily")}
                  onClick={() => navigate("/daily")}
                >
                  종합건강
                </HeaderComponent.MenuItem>

                <HeaderComponent.MenuItem
                  active={isActive("/social")}
                  onClick={() => navigate("/social")}
                >
                  소셜
                </HeaderComponent.MenuItem>
                {user?.roles?.includes("SUPER_ADMIN") ? (
                  <HeaderComponent.MenuItem
                    active={isActive("/admin")}
                    onClick={() => {
                      navigate("/admin");
                    }}
                    style={{ position: "relative" }}
                  >
                    관리자{isNotify && <NotificationDot />}
                  </HeaderComponent.MenuItem>
                ) : (
                  <HeaderComponent.MenuItem
                    active={isActive("/mypage")}
                    onClick={() => navigate("/mypage")}
                  >
                    마이페이지
                  </HeaderComponent.MenuItem>
                )}
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
        {isMobile && <BottomNavigation isNotify={isNotify} />}

        {/* 플로팅 챗봇 - 모든 페이지에서 사용 가능 */}
        <Chatbot
          onMessageSend={(userMessage, botResponse) => {
            console.log("사용자 메시지:", userMessage);
            console.log("봇 응답:", botResponse);
          }}
        />
      </div>
    </>
  );
}
