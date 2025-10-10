import React from "react";
import { Nav } from "react-bootstrap";
import {
  FaHome,
  FaList,
  FaChartBar,
  FaUser,
  FaComments,
  FaCamera,
  FaUtensils,
  FaShoppingBag,
} from "react-icons/fa"; // ← FaShoppingBag 추가
import styles from "./BottomNavigation.module.css";
import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import NotificationDot from "./NotificationDot";
import { RunContext } from "../../context/RunContext";

// 탭 설정을 상수로 분리
const NAVIGATION_TABS = [
  { to: "/", label: "홈", icon: FaHome },
  { to: "/routine", label: "루틴", icon: FaList },
  { to: "/shop", label: "쇼핑", icon: FaShoppingBag },
  { to: "/pose", label: "분석", icon: FaCamera },
  { to: "/calorie", label: "칼로리", icon: FaUtensils },
  { to: "/daily", label: "요약", icon: FaChartBar },
  { to: "/social", label: "소셜", icon: FaComments },
  { to: "/mypage", label: "마이페이지", icon: FaUser },
  { to: "/admin", label: "관리자", icon: FaUser },
];

// 개별 탭 아이템 컴포넌트
const NavigationTab = ({ tab, isNotify }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isRunning } = useContext(RunContext);
  const IconComponent = tab.icon;

  const isActive = location.pathname === tab.to;

  const handleClick = () => {
    navigate(tab.to);
  };

  const getNavLinkClassName = () => {
    const baseClass = styles.navLink;
    const activeClass = isActive ? styles.active : "";
    return `${baseClass} ${activeClass}`.trim();
  };

  return (
    <Nav.Item className={styles.navItem}>
      <Nav.Link className={getNavLinkClassName()} onClick={handleClick}>
        {isRunning && tab.to === "/routine" ? (
          <img
            src={"/img/RunningRoutine.gif"}
            style={{
              width: "20px",
              height: "23px",
              color: location.pathname === "/routine" ? "#2563eb" : "grey",
            }}
          />
        ) : (
          <IconComponent className={styles.icon} />
        )}

        <span className={styles.label}>{tab.label}</span>
      </Nav.Link>
    </Nav.Item>
  );
};

// 메인 BottomNavigation 컴포넌트
const BottomNavigation = ({ isNotify }) => {
  const { user } = useContext(AuthContext);
  const renderNavigationTabs = () => {
    return NAVIGATION_TABS.filter((tab) => {
      if (user.roles?.includes("SUPER_ADMIN")) {
        return tab.to !== "/mypage";
      } else {
        return tab.to !== "/admin";
      }
      return true;
    }).map((tab, i) => (
      <React.Fragment key={i}>
        <NavigationTab key={tab.to} tab={tab} />
        {isNotify === "REQUEST_ROLE" && <NotificationDot />}
      </React.Fragment>
    ));
  };

  return (
    <Nav className={`${styles.bottomNav} bottom-nav`}>
      {renderNavigationTabs()}
    </Nav>
  );
};

export default BottomNavigation;
