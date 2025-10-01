import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import HeaderComponent from "../../common/HeaderComponent";
import ContainerComponent from "../../common/ContainerComponent";
import ButtonComponent from "../../common/ButtonComponent";

import Profile from "./Profile";
import MySocial from "./MySocial";
import Settings from "./Settings";
import Statistics from "./Statistics";
import Gamification from "../Gamification/Gamification";

import { AuthContext } from "../../../context/AuthContext";
import { useModal } from "../../../context/ModalContext";


export default function MyPage(){
    const navigate = useNavigate();
    const {user, dispatch}=useContext(AuthContext);
    const {showConfirmModal}=useModal();
    const location = useLocation();

    const pathSegments = location.pathname.split('/');
    const pathname = pathSegments[pathSegments.length-1];
    const activeHeaderMenu = pathname === 'mypage' || pathname === '' ? "profile" : pathname;

    const handleHeaderMenuClick = (menuId)=>{
        if(menuId === 'profile'){
            navigate('/mypage');
        }else navigate(`/mypage/${menuId}`);
        console.log("선택된 마이페이지 헤더 메뉴:",menuId);
    }

    const routeMyPage = (menuId)=>{
        switch(menuId){
            case "statistics": return <Statistics />
            case "achievements": return <Gamification />
            case "mysocial": return <MySocial />
            case "settings": return <Settings />
            default: return <Profile />
        }
    }

    const handleLogout = ()=>{
        showConfirmModal("정말로 로그아웃 하시겠습니까?","로그아웃","",()=>{dispatch({type:"LOGOUT"})});
    }

    const handleSellerPage = () => {
        navigate('/seller');
    }

    // 사용자가 SELLER 역할을 가지고 있는지 확인
    console.log('현재 사용자 정보:', user);
    console.log('사용자 역할:', user?.roles);
    
    // 백엔드에서 실제 사용자 역할을 가져와서 확인
    const checkUserRoles = async () => {
        try {
            let token = localStorage.getItem('accessToken');
            console.log('localStorage 토큰:', token);
            
            if (!token && user && user.accessToken) {
                token = user.accessToken;
                console.log('user.accessToken 사용:', token);
            }
            
            if (!token) {
                const userInfo = localStorage.getItem('user');
                if (userInfo) {
                    try {
                        const parsedUser = JSON.parse(userInfo);
                        if (parsedUser.accessToken) {
                            token = parsedUser.accessToken;
                            console.log('localStorage user에서 토큰 추출:', token);
                        }
                    } catch (e) {
                        console.error('사용자 정보 파싱 실패:', e);
                    }
                }
            }
            
            console.log('최종 사용할 토큰:', token);
            
            if (token) {
                // JWT 토큰 디코딩해서 내용 확인
                try {
                    const tokenParts = token.split('.');
                    const payload = JSON.parse(atob(tokenParts[1]));
                    console.log('JWT 토큰 페이로드:', payload);
                    console.log('JWT 토큰의 subject (이메일):', payload.sub);
                } catch (e) {
                    console.error('JWT 토큰 디코딩 실패:', e);
                }
                
                console.log('API 호출 시작: /api/v1/users/roles/current');
                const response = await fetch('/api/v1/users/roles/current', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                console.log('API 응답 상태:', response.status);
                console.log('API 응답 헤더:', response.headers);
                
                if (response.ok) {
                    const roles = await response.json();
                    console.log('백엔드에서 받은 사용자 역할 (전체):', roles);
                    console.log('첫 번째 역할 상세:', roles[0]);
                    console.log('rolesDto 확인:', roles[0]?.rolesDto);
                    return roles;
                } else {
                    const errorText = await response.text();
                    console.error('API 호출 실패:', response.status, errorText);
                }
            } else {
                console.error('토큰을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('사용자 역할 조회 오류:', error);
        }
        return [];
    };
    
    // 백엔드에서 받은 실제 역할 데이터를 저장할 상태
    const [actualUserRoles, setActualUserRoles] = useState([]);
    
    // 컴포넌트 마운트 시 역할 확인
    React.useEffect(() => {
        const loadRoles = async () => {
            const roles = await checkUserRoles();
            setActualUserRoles(roles);
        };
        loadRoles();
    }, []);
    
    // 백엔드에서 받은 실제 역할 데이터를 기반으로 판매자 여부 확인
    const isSeller = actualUserRoles.some(role => {
        const roleName = role.rolesDto?.roleName || role.roleName;
        return roleName === 'SELLER' && role.isActive === 1;
    });
    
    console.log('실제 사용자 역할 데이터:', actualUserRoles);
    console.log('판매자 여부 (백엔드 데이터 기반):', isSeller);

    return <>
        <div className="w-100" style={{
            padding: "0 5% 0"
        }}>
            <ContainerComponent size="large">
                <div className="header-column">
                    <div>
                        <HeaderComponent variant="default" size="large" sticky>
                            <HeaderComponent.Section>
                                <HeaderComponent.Brand logo="🏠" brandName="마이 페이지" />
                            </HeaderComponent.Section>
                        </HeaderComponent>
                    </div>

                    <HeaderComponent align="center">
                        <HeaderComponent.Navigation className="pb-2">
                            {isSeller && (
                                <HeaderComponent.MenuItem
                                    onClick={handleSellerPage}
                                >
                                    🛒 판매자센터
                                </HeaderComponent.MenuItem>
                            )}
                            <HeaderComponent.MenuItem
                                active={activeHeaderMenu === "profile"}
                                onClick={()=>handleHeaderMenuClick("profile")}
                            >
                                프로필
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={activeHeaderMenu === "statistics"}
                                onClick={()=>handleHeaderMenuClick("statistics")}
                            >
                                나의 기록
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={activeHeaderMenu === "achievements"}
                                onClick={()=>handleHeaderMenuClick("achievements")}
                            >
                                업적
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={activeHeaderMenu === "mysocial"}
                                onClick={()=>handleHeaderMenuClick("mysocial")}
                            >
                                나의 소셜
                            </HeaderComponent.MenuItem>
                            <HeaderComponent.MenuItem
                                active={activeHeaderMenu === "settings"}
                                onClick={()=>handleHeaderMenuClick("settings")}
                            >
                                설정
                            </HeaderComponent.MenuItem>
                        </HeaderComponent.Navigation>
                        <ButtonComponent
                            className="mb-2"
                            size="small"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </ButtonComponent>
                    </HeaderComponent>
                </div>
            </ContainerComponent>
            <div>
                {routeMyPage(activeHeaderMenu)}
            </div>
        </div>
    
    </>
}