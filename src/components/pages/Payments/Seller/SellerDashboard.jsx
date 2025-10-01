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
        <ContainerComponent variant="default" className="p-4">
            <HeaderComponent variant="filled" size="medium" className="mb-4">
                <h2 className="mb-0">판매자 대시보드</h2>
            </HeaderComponent>

            {/* 통계 카드들 */}
            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-primary">{formatCurrency(dashboardData.todayRevenue)}</h5>
                            <p className="text-muted mb-0">오늘 매출</p>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-success">{dashboardData.todayOrders}</h5>
                            <p className="text-muted mb-0">오늘 주문수</p>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-warning">{dashboardData.pendingOrders}</h5>
                            <p className="text-muted mb-0">처리 대기</p>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-info">{dashboardData.totalProducts}</h5>
                            <p className="text-muted mb-0">등록 상품</p>
                        </div>
                    </CardComponent>
                </div>
            </div>

            {/* 두 번째 행 - 환불/취소 카드 추가 */}
            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-danger">{dashboardData.pendingRefunds}</h5>
                            <p className="text-muted mb-0">환불 대기</p>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-3 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="text-center p-3">
                            <h5 className="text-secondary">{dashboardData.totalRefunds}</h5>
                            <p className="text-muted mb-0">총 환불 건수</p>
                        </div>
                    </CardComponent>
                </div>
            </div>

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

            {/* 빠른 액션 버튼들 */}
            <div className="row">
                <div className="col-md-4 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="p-3 text-center">
                            <h6 className="mb-3">상품 관리</h6>
                            <ButtonComponent 
                                variant="primary" 
                                size="small"
                                className="w-100"
                                onClick={() => {/* 상품 관리 페이지로 이동 */}}
                            >
                                상품 등록/수정
                            </ButtonComponent>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-4 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="p-3 text-center">
                            <h6 className="mb-3">주문 관리</h6>
                            <ButtonComponent 
                                variant="success" 
                                size="small"
                                className="w-100"
                                onClick={() => {/* 주문 관리 페이지로 이동 */}}
                            >
                                주문 처리
                            </ButtonComponent>
                        </div>
                    </CardComponent>
                </div>
                <div className="col-md-4 mb-3">
                    <CardComponent variant="outlined" className="h-100">
                        <div className="p-3 text-center">
                            <h6 className="mb-3">통계 분석</h6>
                            <ButtonComponent 
                                variant="info" 
                                size="small"
                                className="w-100"
                                onClick={() => {/* 통계 페이지로 이동 */}}
                            >
                                매출 분석
                            </ButtonComponent>
                        </div>
                    </CardComponent>
                </div>
            </div>
        </ContainerComponent>
    );
}