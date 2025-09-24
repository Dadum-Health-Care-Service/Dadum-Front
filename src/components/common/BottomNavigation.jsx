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
  FaTrophy,
  FaRobot,
  FaShoppingBag,
} from "react-icons/fa"; // ← FaShoppingBag 추가
import styles from "./BottomNavigation.module.css";
import { useLocation, useNavigate } from "react-router-dom";

// 탭 설정을 상수로 분리
const NAVIGATION_TABS = [
  { to: "/", label: "홈", icon: FaHome },
  { to: "/routine", label: "루틴", icon: FaList },
  { to: "/shop", label: "쇼핑", icon: FaShoppingBag },
  { to: "/pose", label: "분석", icon: FaCamera },
  { to: "/calorie", label: "칼로리", icon: FaUtensils },
  { to: "/daily", label: "요약", icon: FaChartBar },
  { to: "/statistics", label: "통계", icon: FaChartBar },
  { to: "/social", label: "소셜", icon: FaComments },
  { to: "/mypage", label: "마이페이지", icon: FaUser },
];

// 개별 탭 아이템 컴포넌트
const NavigationTab = ({ tab }) => {
  const navigate = useNavigate();
  const location = useLocation();

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
        <IconComponent className={styles.icon} />
        <span className={styles.label}>{tab.label}</span>
      </Nav.Link>
    </Nav.Item>
  );
};

// 메인 BottomNavigation 컴포넌트
const BottomNavigation = () => {
  const renderNavigationTabs = () => {
    return NAVIGATION_TABS.map((tab) => (
      <NavigationTab key={tab.to} tab={tab} />
    ));
  };

  return (
    <Nav className={`${styles.bottomNav} bottom-nav`}>
      {renderNavigationTabs()}
    </Nav>
  );
};

export default BottomNavigation;
