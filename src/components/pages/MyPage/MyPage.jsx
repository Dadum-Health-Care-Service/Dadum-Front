import { useContext, useState } from "react";
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
    const {dispatch}=useContext(AuthContext);
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