import React from "react";
import { Nav } from "react-bootstrap";
import {
  FaHome,
  FaList,
  FaChartBar,
  FaUser,
  FaComments,
  FaCamera,
  FaTrophy,
  FaRobot,
} from "react-icons/fa";

import styles from "./BottomNavigation.module.css";

// 탭 설정을 상수로 분리
const NAVIGATION_TABS = [
  { id: "home", label: "홈", icon: FaHome },
  { id: "routine", label: "루틴", icon: FaList },
  { id: "achievement", label: "업적", icon: FaTrophy },
  { id: "pose", label: "분석", icon: FaCamera },
  { id: "statistics", label: "통계", icon: FaChartBar },
  { id: "social", label: "소셜", icon: FaComments },
  { id: "mypage", label: "마이페이지", icon: FaUser },
];

// 개별 탭 아이템 컴포넌트
const NavigationTab = ({ tab, isActive, onTabChange }) => {
  const IconComponent = tab.icon;

  const handleClick = () => {
    onTabChange(tab.id);
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
const BottomNavigation = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: "home", label: "홈", icon: FaHome },
    { id: "routine", label: "루틴", icon: FaList },
    { id: "pose", label: "분석", icon: FaCamera },
    { id: "statistics", label: "통계", icon: FaChartBar },
    { id: "social", label: "소셜", icon: FaComments },
    { id: "mypage", label: "마이페이지", icon: FaUser },
  ];

  return (
    <Nav className={`${styles.bottomNav} bottom-nav`}>
      {renderNavigationTabs()}
    </Nav>
  );
};

export default BottomNavigation;
