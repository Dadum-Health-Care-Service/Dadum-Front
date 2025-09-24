import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import HeaderComponent from "../../common/HeaderComponent";
import ButtonComponent from "../../common/ButtonComponent";
import BottomNavigation from "../../common/BottomNavigation";
import Chatbot from "../Chatbot/Chatbot";

export default function GNB({isMobile}){
    const { dispatch }=useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (pathname) => location.pathname === pathname;

    const handleLogoutClick = (e) =>{
        e.preventDefault();
        dispatch({type:"LOGOUT"});
    }

    return<>
        <div className="App">
            {/* 웹 환경에서만 헤더 표시 */}
            {!isMobile && (
                <HeaderComponent variant="elevated" size="large" sticky>
                    <HeaderComponent.Section>
                        <HeaderComponent.Brand
                            logo="🎯"
                            brandName="다듬"
                            onClick={()=>navigate("/")}
                            style={{ cursor: "pointer" }}
                        />
                    </HeaderComponent.Section>
    
                    <HeaderComponent.Section>
                        <HeaderComponent.Navigation>
                            <HeaderComponent.MenuItem
                                active={isActive("/routine")}
                                onClick={()=>navigate("/routine")}
                            >
                                루틴
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={isActive("/achievement")}
                                onClick={()=>navigate("/achievement")}
                            >
                                업적
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={isActive("/pose")}
                                onClick={()=>navigate("/pose")}
                            >
                                분석
                            </HeaderComponent.MenuItem>
                            {/* 칼로리 */}
                            <HeaderComponent.MenuItem
                                active={isActive("/calorie")}
                                onClick={()=>navigate("/calorie")}
                            >
                                칼로리
                            </HeaderComponent.MenuItem>
    
                            {/* ✅ 추가: 일일 요약 메뉴 */}
                            <HeaderComponent.MenuItem
                                active={isActive("/daily")}
                                onClick={()=>navigate("/daily")}
                            >
                                일일 요약
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={isActive("/statistics")}
                                onClick={()=>navigate("/statistics")}
                            >
                                통계
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={isActive("/social")}
                                onClick={()=>navigate("/social")}
                            >
                                소셜
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={isActive("/mypage")}
                                onClick={()=>navigate("/mypage")}
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
                <BottomNavigation />
            )}

            {/* 플로팅 챗봇 - 모든 페이지에서 사용 가능 */}
            <Chatbot
                onMessageSend={(userMessage, botResponse) => {
                    console.log("사용자 메시지:", userMessage);
                    console.log("봇 응답:", botResponse);
                }}
            />
        </div>
    </>
}