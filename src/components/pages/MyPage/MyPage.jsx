import { useState } from "react";
import HeaderComponent from "../../common/HeaderComponent";
import ContainerComponent from "../../common/ContainerComponent";
import Profile from "./Profile";
import MySocial from "./MySocial";
import Settings from "./Settings";
import HealthData from "./HealthData";

export default function MyPage(){
    const [activeHeaderMenu,setActiveHeaderMenu]=useState("profile");

    const handleHeaderMenuClick = (menuId)=>{
        setActiveHeaderMenu(menuId);
        console.log("선택된 마이페이지 헤더 메뉴:",menuId);
    }

    const routeMyPage = (menuId)=>{
        switch(menuId){
            case "healthdata": return <HealthData />
            case "mysocial": return <MySocial />
            case "settings": return <Settings />
            default: return <Profile />
        }
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
                                active={activeHeaderMenu === "healthdata"}
                                onClick={()=>handleHeaderMenuClick("healthdata")}
                            >
                                나의 기록
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
                    </HeaderComponent>
                </div>
            </ContainerComponent>
            <ContainerComponent size="large">
                <div>
                    <HeaderComponent.Section>
                        {routeMyPage(activeHeaderMenu)}
                    </HeaderComponent.Section>
                </div>
            </ContainerComponent>
        </div>
    
    </>
}