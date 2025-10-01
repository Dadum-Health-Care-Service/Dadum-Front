import { useState } from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import HeaderComponent from "../../../common/HeaderComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import CardComponent from "../../../common/CardComponent";
import SellerDashboard from "./SellerDashboard";
import ProductManagement from "./ProductManagement";
import OrderManagement from "./OrderManagement";
import RefundManagement from "./RefundManagement";
import styles from "./SellerMain.module.css";

export default function SellerMain() {
    const [activeTab, setActiveTab] = useState("dashboard");

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
                return (
                    <ContainerComponent variant="default" className="p-4">
                        <HeaderComponent variant="filled" size="medium" className="mb-4">
                            <h2 className="mb-0">매출 분석</h2>
                        </HeaderComponent>
                        <CardComponent variant="outlined">
                            <div className="text-center py-5">
                                <p className="text-muted">매출 분석 기능은 준비 중입니다.</p>
                            </div>
                        </CardComponent>
                    </ContainerComponent>
                );
            case "settings":
                return (
                    <ContainerComponent variant="default" className="p-4">
                        <HeaderComponent variant="filled" size="medium" className="mb-4">
                            <h2 className="mb-0">판매자 설정</h2>
                        </HeaderComponent>
                        <CardComponent variant="outlined">
                            <div className="text-center py-5">
                                <p className="text-muted">판매자 설정 기능은 준비 중입니다.</p>
                            </div>
                        </CardComponent>
                    </ContainerComponent>
                );
            default:
                return <SellerDashboard />;
        }
    };

    return (
        <div className="seller-main">
            <ContainerComponent variant="default" className="p-0">
                <div className="row g-0">
                    {/* 사이드바 */}
                    <div className="col-md-3 col-lg-2">
                        <div className="seller-sidebar">
                            <div className="p-3 border-bottom">
                                <h5 className="mb-0">판매자 센터</h5>
                            </div>
                            <nav className="nav flex-column">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        className={`nav-link d-flex align-items-center ${
                                            activeTab === tab.id ? 'active' : ''
                                        }`}
                                        onClick={() => setActiveTab(tab.id)}
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
                        <div className="seller-content">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </ContainerComponent>
        </div>
    );
}
