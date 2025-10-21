import { useState, useEffect } from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import HeaderComponent from "../../../common/HeaderComponent";
import ButtonComponent from "../../../common/ButtonComponent";
import CardComponent from "../../../common/CardComponent";
import InputComponent from "../../../common/InputComponent";
import ModalComponent from "../../../common/ModalComponent";
import Pagination from "../../../common/Pagination";
import { useApi } from "../../../../utils/api/useApi";
import { useModal } from "../../../../context/ModalContext";
import styles from "./OrderManagement.module.css";

export default function OrderManagement() {
    const { GET, PUT } = useApi();
    const { showBasicModal, showConfirmModal } = useModal();
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    
    // 주문 상세 모달 상태
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, [currentPage, statusFilter, searchTerm]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const response = await GET('/seller/orders', {
                page: currentPage,
                status: statusFilter,
                search: searchTerm
            });
            setOrders(response.data?.orders || []);
            setTotalPages(response.data?.totalPages || 1);
        } catch (error) {
            console.error('주문 목록 로드 실패:', error);
            setOrders([]);
            setTotalPages(1);
            showBasicModal('주문 목록을 불러오는데 실패했습니다.', '오류');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusFilter = (e) => {
        setStatusFilter(e.target.value);
        setCurrentPage(1);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const openOrderDetail = (order) => {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await PUT(`/seller/orders/${orderId}/status`, { status: newStatus });
            showBasicModal('주문 상태가 업데이트되었습니다.', '성공');
            loadOrders();
        } catch (error) {
            console.error('주문 상태 업데이트 실패:', error);
            showBasicModal('주문 상태 업데이트에 실패했습니다.', '오류');
        }
    };

    const handleStatusChange = (order, newStatus) => {
        const statusText = {
            'PENDING': '처리대기',
            'CONFIRMED': '확인됨',
            'SHIPPED': '배송중',
            'DELIVERED': '배송완료',
            'CANCELLED': '취소됨'
        };

        showConfirmModal(
            `주문 상태를 "${statusText[newStatus]}"로 변경하시겠습니까?`,
            "주문 상태 변경",
            "변경된 상태는 고객에게 알림이 전송됩니다.",
            () => updateOrderStatus(order.id, newStatus)
        );
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'PENDING': { class: 'bg-warning', text: '처리대기' },
            'CONFIRMED': { class: 'bg-primary', text: '확인됨' },
            'SHIPPED': { class: 'bg-info', text: '배송중' },
            'DELIVERED': { class: 'bg-success', text: '배송완료' },
            'CANCELLED': { class: 'bg-danger', text: '취소됨' }
        };
        
        const config = statusConfig[status] || { class: 'bg-secondary', text: status };
        return <span className={`badge ${config.class}`}>{config.text}</span>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

    return (
        <ContainerComponent variant="default" className="p-4">
            <HeaderComponent variant="filled" size="medium" className="mb-4">
                <h2 className="mb-0">주문 관리</h2>
            </HeaderComponent>

            {/* 필터 및 검색 */}
            <CardComponent variant="outlined" className="mb-4">
                <div className="p-3">
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <InputComponent
                                label="주문번호 또는 고객명 검색"
                                placeholder="검색어를 입력하세요"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <label className="form-label">주문 상태</label>
                            <select 
                                className="form-select"
                                value={statusFilter}
                                onChange={handleStatusFilter}
                            >
                                <option value="all">전체</option>
                                <option value="PENDING">처리대기</option>
                                <option value="CONFIRMED">확인됨</option>
                                <option value="SHIPPED">배송중</option>
                                <option value="DELIVERED">배송완료</option>
                                <option value="CANCELLED">취소됨</option>
                            </select>
                        </div>
                        <div className="col-md-2 mb-3 d-flex align-items-end">
                            <ButtonComponent 
                                variant="outline" 
                                size="small"
                                onClick={loadOrders}
                                className="w-100"
                            >
                                검색
                            </ButtonComponent>
                        </div>
                    </div>
                </div>
            </CardComponent>

            {/* 주문 목록 */}
            <CardComponent variant="outlined">
                <div className="p-0">
                    <div className="table-responsive">
                        <table className="table table-hover mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>주문번호</th>
                                    <th>고객명</th>
                                    <th>상품명</th>
                                    <th>수량</th>
                                    <th>금액</th>
                                    <th>상태</th>
                                    <th>주문일</th>
                                    <th>관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders && Array.isArray(orders) && orders.map((order) => (
                                    <tr key={order.id}>
                                        <td>
                                            <button 
                                                className="btn btn-link p-0 text-decoration-none"
                                                onClick={() => openOrderDetail(order)}
                                            >
                                                {order.orderNumber}
                                            </button>
                                        </td>
                                        <td>{order.customerName}</td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                {order.productImage && (
                                                    <img 
                                                        src={order.productImage} 
                                                        alt={order.productName}
                                                        className="me-2"
                                                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                                                    />
                                                )}
                                                <span>{order.productName}</span>
                                            </div>
                                        </td>
                                        <td>{order.quantity}개</td>
                                        <td className="fw-bold">{formatCurrency(order.totalAmount)}</td>
                                        <td>{getStatusBadge(order.status)}</td>
                                        <td>{formatDate(order.orderDate)}</td>
                                        <td>
                                            <div className="dropdown">
                                                <button 
                                                    className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                    type="button"
                                                    data-bs-toggle="dropdown"
                                                >
                                                    상태변경
                                                </button>
                                                <ul className="dropdown-menu">
                                                    {order.status === 'PENDING' && (
                                                        <>
                                                            <li>
                                                                <button 
                                                                    className="dropdown-item"
                                                                    onClick={() => handleStatusChange(order, 'CONFIRMED')}
                                                                >
                                                                    확인됨으로 변경
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button 
                                                                    className="dropdown-item text-danger"
                                                                    onClick={() => handleStatusChange(order, 'CANCELLED')}
                                                                >
                                                                    취소
                                                                </button>
                                                            </li>
                                                        </>
                                                    )}
                                                    {order.status === 'CONFIRMED' && (
                                                        <li>
                                                            <button 
                                                                className="dropdown-item"
                                                                onClick={() => handleStatusChange(order, 'SHIPPED')}
                                                            >
                                                                배송중으로 변경
                                                            </button>
                                                        </li>
                                                    )}
                                                    {order.status === 'SHIPPED' && (
                                                        <li>
                                                            <button 
                                                                className="dropdown-item"
                                                                onClick={() => handleStatusChange(order, 'DELIVERED')}
                                                            >
                                                                배송완료로 변경
                                                            </button>
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </CardComponent>

            {orders.length === 0 && (
                <CardComponent variant="outlined">
                    <div className="text-center py-5">
                        <p className="text-muted">해당 조건의 주문이 없습니다.</p>
                    </div>
                </CardComponent>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}

            {/* 주문 상세 모달 */}
            <ModalComponent
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="주문 상세 정보"
                size="large"
            >
                {selectedOrder && (
                    <div>
                        <div className="row mb-4">
                            <div className="col-md-6">
                                <h6>주문 정보</h6>
                                <table className="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td className="fw-bold">주문번호:</td>
                                            <td>{selectedOrder.orderNumber}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">주문일:</td>
                                            <td>{formatDate(selectedOrder.orderDate)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">상태:</td>
                                            <td>{getStatusBadge(selectedOrder.status)}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">총 금액:</td>
                                            <td className="fw-bold text-primary">
                                                {formatCurrency(selectedOrder.totalAmount)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="col-md-6">
                                <h6>고객 정보</h6>
                                <table className="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td className="fw-bold">고객명:</td>
                                            <td>{selectedOrder.customerName}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">연락처:</td>
                                            <td>{selectedOrder.customerPhone}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">이메일:</td>
                                            <td>{selectedOrder.customerEmail}</td>
                                        </tr>
                                        <tr>
                                            <td className="fw-bold">배송주소:</td>
                                            <td>{selectedOrder.shippingAddress}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <h6>주문 상품</h6>
                            <div className="d-flex align-items-center p-3 border rounded">
                                {selectedOrder.productImage && (
                                    <img 
                                        src={selectedOrder.productImage} 
                                        alt={selectedOrder.productName}
                                        className="me-3"
                                        style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    />
                                )}
                                <div className="flex-grow-1">
                                    <h6 className="mb-1">{selectedOrder.productName}</h6>
                                    <p className="text-muted mb-1">{selectedOrder.productDescription}</p>
                                    <div className="d-flex justify-content-between">
                                        <span>수량: {selectedOrder.quantity}개</span>
                                        <span className="fw-bold">
                                            {formatCurrency(selectedOrder.unitPrice)} × {selectedOrder.quantity} = 
                                            {formatCurrency(selectedOrder.totalAmount)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {selectedOrder.notes && (
                            <div className="mb-3">
                                <h6>주문 메모</h6>
                                <p className="text-muted">{selectedOrder.notes}</p>
                            </div>
                        )}
                        
                        <div className="d-flex justify-content-end gap-2">
                            <ButtonComponent 
                                variant="outline" 
                                size="small"
                                onClick={() => setIsDetailModalOpen(false)}
                            >
                                닫기
                            </ButtonComponent>
                            {selectedOrder.status === 'PENDING' && (
                                <>
                                    <ButtonComponent 
                                        variant="success" 
                                        size="small"
                                        onClick={() => {
                                            handleStatusChange(selectedOrder, 'CONFIRMED');
                                            setIsDetailModalOpen(false);
                                        }}
                                    >
                                        주문 확인
                                    </ButtonComponent>
                                    <ButtonComponent 
                                        variant="danger" 
                                        size="small"
                                        onClick={() => {
                                            handleStatusChange(selectedOrder, 'CANCELLED');
                                            setIsDetailModalOpen(false);
                                        }}
                                    >
                                        주문 취소
                                    </ButtonComponent>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </ModalComponent>
        </ContainerComponent>
    );
}
