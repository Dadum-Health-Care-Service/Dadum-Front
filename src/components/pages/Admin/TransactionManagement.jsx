import { useState } from "react";
import ContainerComponent from "../../common/ContainerComponent";
import ButtonComponent from "../../common/ButtonComponent";
import CardComponent from "../../common/CardComponent";
import FraudDetection from "../Payments/FraudDetection";
import FraudStatistics from "./components/FraudStatistics";
import RealTimeMonitor from "./components/RealTimeMonitor";
import SystemTest from "./components/SystemTest";
import PerformanceMonitor from "./components/PerformanceMonitor";
import styles from "./TransactionManagement.module.css";

export default function TransactionManagement() {
  const [activeTab, setActiveTab] = useState("fraud-detection");

  const tabs = [
    { id: "fraud-detection", label: "AI 이상거래 탐지", icon: "🤖" },
    { id: "statistics", label: "AI 통계 대시보드", icon: "📊" },
    { id: "monitoring", label: "실시간 모니터링", icon: "⚡" },
    { id: "testing", label: "시스템 테스트", icon: "🧪" },
    { id: "performance", label: "성능 모니터링", icon: "⚡" }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "fraud-detection":
        return <FraudDetection hideHeader={true} />;
      case "statistics":
        return <FraudStatistics />;
      case "monitoring":
        return <RealTimeMonitor />;
      case "testing":
        return <SystemTest />;
      case "performance":
        return <PerformanceMonitor />;
      default:
        return <FraudDetection hideHeader={true} />;
    }
  };

  return (
    <div className={styles.transactionManagement}>
      <ContainerComponent variant="filled" shadow="none" borderRadius="none">
        <div className={styles.tabContainer}>
          <div className={styles.tabList}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${
                  activeTab === tab.id ? styles.active : ""
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </ContainerComponent>

      <div className={styles.content}>
        {renderContent()}
      </div>
    </div>
  );
}
