import { useState, useEffect } from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import HeaderComponent from "../../../common/HeaderComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import CardComponent from "../../../common/CardComponent";
import { useApi } from "../../../../utils/api/useApi";
import styles from "./SellerDashboard.module.css";

export default function SellerDashboard() {
    console.log('SellerDashboard 컴포넌트 렌더링됨');
    
    const { GET } = useApi();
    const [dashboardData, setDashboardData] = useState({
        todayRevenue: 0,
        monthlyRevenue: 0,
        totalProducts: 0,
        completedOrders: 0,
        todayOrders: 0,
        pendingOrders: 0,
        activeProducts: 0,
        monthlyOrders: 0,
        pendingRefunds: 0,
        totalRefunds: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            console.log('대시보드 데이터 로드 시작...');
            
            // 대시보드 데이터 로드
            const dashboardResponse = await GET('/seller/dashboard/stats');
            console.log('대시보드 응답:', dashboardResponse);
            console.log('대시보드 데이터:', dashboardResponse.data);
            setDashboardData(dashboardResponse.data);
            
            // 최근 주문 로드
            const ordersResponse = await GET('/seller/orders/recent');
            console.log('주문 응답:', ordersResponse);
            setRecentOrders(ordersResponse.data);
            
            // 환불 통계 로드
            const refundsResponse = await GET('/seller/refunds/statistics');
            console.log('환불 통계 응답:', refundsResponse);
            if (refundsResponse.data) {
                setDashboardData(prev => ({
                    ...prev,
                    pendingRefunds: refundsResponse.data.pendingRefunds || 0,
                    totalRefunds: refundsResponse.data.totalRefunds || 0
                }));
            }
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    console.log('렌더링 시점 - loading:', loading);
    console.log('렌더링 시점 - dashboardData:', dashboardData);
    console.log('렌더링 시점 - recentOrders:', recentOrders);

    if (loading) {
        return (
            <ContainerComponent variant="default" className="p-4">
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">로딩중...</span>
                    </div>
                </div>
            </ContainerComponent>
        );
    }

    console.log('SellerDashboard JSX 렌더링 시작');
    
    return (
        <ContainerComponent variant="default" className={`p-4 ${styles.dashboardContainer}`}>
            <HeaderComponent variant="filled" size="medium" className="mb-4">
                <h2 className="mb-0">판매자 대시보드</h2>
            </HeaderComponent>

            {/* 통계 테이블 */}
            <CardComponent variant="outlined" className="mb-4">
                <div className="p-3 border-bottom">
                    <h5 className="mb-0">📊 판매 현황 요약</h5>
                </div>
                <div className="p-0">
                    <div className="table-responsive">
                        <table className={`table table-hover mb-0 ${styles.statsTable}`}>
                            <thead>
                                <tr>
                                    <th className="text-center">구분</th>
                                    <th className="text-center">오늘</th>
                                    <th className="text-center">이번 달</th>
                                    <th className="text-center">전체</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className={`fw-bold text-primary ${styles.metricLabel}`}>💰 매출</td>
                                    <td className={`text-center text-primary fw-bold ${styles.metricValue} ${styles.today}`}>{formatCurrency(dashboardData.todayRevenue)}</td>
                                    <td className={`text-center text-primary ${styles.metricValue}`}>{formatCurrency(dashboardData.monthlyRevenue)}</td>
                                    <td className="text-center text-muted">-</td>
                                </tr>
                                <tr>
                                    <td className={`fw-bold text-success ${styles.metricLabel}`}>📦 주문수</td>
                                    <td className={`text-center text-success fw-bold ${styles.metricValue} ${styles.today}`}>{dashboardData.todayOrders}</td>
                                    <td className={`text-center text-success ${styles.metricValue}`}>{dashboardData.monthlyOrders}</td>
                                    <td className="text-center text-muted">-</td>
                                </tr>
                                <tr>
                                    <td className={`fw-bold text-warning ${styles.metricLabel}`}>⏳ 처리 대기</td>
                                    <td className={`text-center text-warning fw-bold ${styles.metricValue} ${styles.today}`}>{dashboardData.pendingOrders}</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className="text-center text-muted">-</td>
                                </tr>
                                <tr>
                                    <td className={`fw-bold text-info ${styles.metricLabel}`}>📋 등록 상품</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className={`text-center text-info fw-bold ${styles.metricValue}`}>{dashboardData.totalProducts}</td>
                                </tr>
                                <tr>
                                    <td className={`fw-bold text-danger ${styles.metricLabel}`}>💸 환불 대기</td>
                                    <td className={`text-center text-danger fw-bold ${styles.metricValue} ${styles.today}`}>{dashboardData.pendingRefunds}</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className="text-center text-muted">-</td>
                                </tr>
                                <tr>
                                    <td className={`fw-bold text-secondary ${styles.metricLabel}`}>📊 총 환불 건수</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className="text-center text-muted">-</td>
                                    <td className={`text-center text-secondary fw-bold ${styles.metricValue}`}>{dashboardData.totalRefunds}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardComponent>

            {/* 최근 주문 */}
            <CardComponent variant="outlined" className="mb-4">
                <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <h5 className="mb-0">최근 주문</h5>
                    <ButtonComponent 
                        variant="outline" 
                        size="small"
                        onClick={() => {/* 주문 관리 페이지로 이동 */}}
                    >
                        전체 보기
                    </ButtonComponent>
                </div>
                <div className="p-3">
                    {recentOrders.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>주문번호</th>
                                        <th>고객명</th>
                                        <th>상품명</th>
                                        <th>금액</th>
                                        <th>상태</th>
                                        <th>주문일</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.orderId}>
                                            <td>{order.orderNumber}</td>
                                            <td>{order.customerName}</td>
                                            <td>{order.productName}</td>
                                            <td>{formatCurrency(order.amount)}</td>
                                            <td>
                                                <span className={`badge ${
                                                    order.status === 'PENDING' ? 'bg-warning' :
                                                    order.status === 'CONFIRMED' ? 'bg-success' :
                                                    order.status === 'CANCELLED' ? 'bg-danger' : 'bg-secondary'
                                                }`}>
                                                    {order.status === 'PENDING' ? '처리대기' :
                                                     order.status === 'CONFIRMED' ? '확인됨' :
                                                     order.status === 'CANCELLED' ? '취소됨' : order.status}
                                                </span>
                                            </td>
                                            <td>{new Date(order.orderDate).toLocaleDateString('ko-KR')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center text-muted py-4">
                            <p>최근 주문이 없습니다.</p>
                        </div>
                    )}
                </div>
            </CardComponent>
        </ContainerComponent>
    );
}