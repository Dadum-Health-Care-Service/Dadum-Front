import React from "react";
import { Nav } from "react-bootstrap";
import {
  FaHome,
  FaList,
  FaChartBar,
  FaUser,
  FaComments,
  FaCamera,
  FaRobot,
} from "react-icons/fa"; // ← FaRobot 추가
import styles from "./BottomNavigation.module.css";

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
      {tabs.map((tab) => {
        const IconComponent = tab.icon;
        return (
          <Nav.Item key={tab.id} className={styles.navItem}>
            <Nav.Link
              className={`${styles.navLink} ${
                activeTab === tab.id ? styles.active : ""
              }`}
              onClick={() => onTabChange(tab.id)}
            >
              <IconComponent className={styles.icon} />
              <span className={styles.label}>{tab.label}</span>
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
};

export default BottomNavigation;
