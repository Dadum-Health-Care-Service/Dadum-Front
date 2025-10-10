import { useState } from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import HeaderComponent from "../../../common/HeaderComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import CardComponent from "../../../common/CardComponent";
import SellerDashboard from "./SellerDashboard";
import ProductManagement from "./ProductManagement";
import OrderManagement from "./OrderManagement";
import RefundManagement from "./RefundManagement";
import SalesAnalysis from "../SalesAnalysis";
import SellerSettings from "./SellerSettings";
import styles from "./SellerMain.module.css";

export default function SellerMain() {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const tabs = [
        { id: "dashboard", label: "대시보드", icon: "📊" },
        { id: "products", label: "상품 관리", icon: "📦" },
        { id: "orders", label: "주문 관리", icon: "🛒" },
        { id: "refunds", label: "환불/취소", icon: "💸" },
        { id: "analytics", label: "매출 분석", icon: "📈" },
        { id: "settings", label: "설정", icon: "⚙️" }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <SellerDashboard />;
            case "products":
                return <ProductManagement />;
            case "orders":
                return <OrderManagement />;
            case "refunds":
                return <RefundManagement />;
            case "analytics":
                return <SalesAnalysis />;
            case "settings":
                return <SellerSettings />;
            default:
                return <SellerDashboard />;
        }
    };

    return (
        <div className={styles.sellerMain}>
            {/* 모바일 메뉴 버튼 */}
            <button 
                className={styles.mobileMenuButton}
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                ☰
            </button>

            {/* 모바일 오버레이 */}
            {sidebarOpen && (
                <div 
                    className={styles.mobileOverlay}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <ContainerComponent variant="default" className="p-0">
                <div className="row g-0">
                    {/* 사이드바 */}
                    <div className="col-md-3 col-lg-2">
                        <div className={`${styles.sellerSidebar} ${sidebarOpen ? styles.show : ''}`}>
                            <div className="p-3 border-bottom">
                                <h5 className="mb-0">판매자 센터</h5>
                            </div>
                            <nav className="nav flex-column">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`${styles.navLink} d-flex align-items-center ${
                                            activeTab === tab.id ? styles.active : ''
                                        }`}
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setSidebarOpen(false); // 모바일에서 탭 선택 시 사이드바 닫기
                                        }}
                                    >
                                        <span className="me-2">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* 메인 콘텐츠 */}
                    <div className="col-md-9 col-lg-10">
                        <div className={styles.sellerContent}>
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </ContainerComponent>
        </div>
    );
}
