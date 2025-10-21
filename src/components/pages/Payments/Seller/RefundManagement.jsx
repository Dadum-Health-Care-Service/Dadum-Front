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
import styles from "./RefundManagement.module.css";

export default function RefundManagement() {
    const { GET, PUT } = useApi();
    const { showBasicModal, showConfirmModal } = useModal();
    
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    
    // 환불 상세 모달 상태
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState(null);

    useEffect(() => {
        loadRefunds();
    }, [currentPage, statusFilter, searchTerm]);

    const loadRefunds = async () => {
        try {
            setLoading(true);
            const response = await GET('/seller/refunds', {
                page: currentPage,
                status: statusFilter,
                search: searchTerm
            });
            setRefunds(response.data?.refunds || []);
            setTotalPages(response.data?.totalPages || 1);
        } catch (error) {
            console.error('환불 목록 로드 실패:', error);
            setRefunds([]);
            setTotalPages(1);
            showBasicModal('환불 목록을 불러오는데 실패했습니다.', '오류');
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

    const openRefundDetail = (refund) => {
        setSelectedRefund(refund);
        setIsDetailModalOpen(true);
    };

    const closeRefundDetail = () => {
        setSelectedRefund(null);
        setIsDetailModalOpen(false);
    };

    const handleRefundApproval = (refundId) => {
        showConfirmModal(
            "환불을 승인하시겠습니까?",
            "환불 승인",
            "승인된 환불은 복구할 수 없습니다.",
            async () => {
                try {
                    await PUT(`/seller/refunds/${refundId}/approve`);
                    showBasicModal('환불이 승인되었습니다.', '성공');
                    loadRefunds();
                } catch (error) {
                    console.error('환불 승인 실패:', error);
                    showBasicModal('환불 승인에 실패했습니다.', '오류');
                }
            }
        );
    };

    const handleRefundRejection = (refundId) => {
        showConfirmModal(
            "환불을 거부하시겠습니까?",
            "환불 거부",
            "거부된 환불은 복구할 수 없습니다.",
            async () => {
                try {
                    await PUT(`/seller/refunds/${refundId}/reject`);
                    showBasicModal('환불이 거부되었습니다.', '성공');
                    loadRefunds();
                } catch (error) {
                    console.error('환불 거부 실패:', error);
                    showBasicModal('환불 거부에 실패했습니다.', '오류');
                }
            }
        );
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'PENDING': { text: '대기중', class: 'bg-warning' },
            'APPROVED': { text: '승인됨', class: 'bg-success' },
            'REJECTED': { text: '거부됨', class: 'bg-danger' },
            'PROCESSING': { text: '처리중', class: 'bg-info' }
        };
        const statusInfo = statusMap[status] || { text: status, class: 'bg-secondary' };
        return (
            <span className={`badge ${statusInfo.class}`}>
                {statusInfo.text}
            </span>
        );
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
                <div className="d-flex justify-content-between align-items-center">
                    <h2 className="mb-0">환불/취소 관리</h2>
                </div>
            </HeaderComponent>

            {/* 필터 및 검색 */}
            <CardComponent variant="outlined" className="mb-4">
                <div className="p-3">
                    <div className="row">
                        <div className="col-md-4 mb-3">
                            <InputComponent
                                type="text"
                                placeholder="주문번호 또는 고객명 검색"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="col-md-3 mb-3">
                            <select 
                                className="form-select"
                                value={statusFilter}
                                onChange={handleStatusFilter}
                            >
                                <option value="all">전체 상태</option>
                                <option value="PENDING">대기중</option>
                                <option value="APPROVED">승인됨</option>
                                <option value="REJECTED">거부됨</option>
                                <option value="PROCESSING">처리중</option>
                            </select>
                        </div>
                    </div>
                </div>
            </CardComponent>

            {/* 환불 목록 */}
            <CardComponent variant="outlined">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>환불번호</th>
                                <th>주문번호</th>
                                <th>고객명</th>
                                <th>상품명</th>
                                <th>환불금액</th>
                                <th>상태</th>
                                <th>신청일</th>
                                <th>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds && Array.isArray(refunds) && refunds.map((refund) => (
                                <tr key={refund.refundId}>
                                    <td>
                                        <button 
                                            className="btn btn-link p-0 text-decoration-none"
                                            onClick={() => openRefundDetail(refund)}
                                        >
                                            #{refund.refundId}
                                        </button>
                                    </td>
                                    <td>#{refund.orderId}</td>
                                    <td>{refund.customerName}</td>
                                    <td>{refund.productName}</td>
                                    <td>{formatCurrency(refund.refundAmount)}</td>
                                    <td>{getStatusBadge(refund.status)}</td>
                                    <td>{formatDate(refund.requestedAt)}</td>
                                    <td>
                                        {refund.status === 'PENDING' && (
                                            <div className="btn-group" role="group">
                                                <ButtonComponent
                                                    variant="success"
                                                    size="small"
                                                    onClick={() => handleRefundApproval(refund.refundId)}
                                                >
                                                    승인
                                                </ButtonComponent>
                                                <ButtonComponent
                                                    variant="danger"
                                                    size="small"
                                                    onClick={() => handleRefundRejection(refund.refundId)}
                                                >
                                                    거부
                                                </ButtonComponent>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 빈 상태 */}
                {(!refunds || refunds.length === 0) && (
                    <div className="text-center py-5">
                        <h4 className="text-muted">환불 요청이 없습니다</h4>
                        <p className="text-muted">고객의 환불 요청이 없습니다.</p>
                    </div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </CardComponent>

            {/* 환불 상세 모달 */}
            <ModalComponent
                isOpen={isDetailModalOpen}
                onClose={closeRefundDetail}
                size="large"
                title="환불 상세 정보"
            >
                {selectedRefund && (
                    <div className="p-3">
                        <div className="row mb-3">
                            <div className="col-md-6">
                                <h6>환불 정보</h6>
                                <table className="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td>환불번호</td>
                                            <td>#{selectedRefund.refundId}</td>
                                        </tr>
                                        <tr>
                                            <td>주문번호</td>
                                            <td>#{selectedRefund.orderId}</td>
                                        </tr>
                                        <tr>
                                            <td>환불금액</td>
                                            <td>{formatCurrency(selectedRefund.refundAmount)}</td>
                                        </tr>
                                        <tr>
                                            <td>상태</td>
                                            <td>{getStatusBadge(selectedRefund.status)}</td>
                                        </tr>
                                        <tr>
                                            <td>신청일</td>
                                            <td>{formatDate(selectedRefund.requestedAt)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="col-md-6">
                                <h6>고객 정보</h6>
                                <table className="table table-sm">
                                    <tbody>
                                        <tr>
                                            <td>고객명</td>
                                            <td>{selectedRefund.customerName}</td>
                                        </tr>
                                        <tr>
                                            <td>연락처</td>
                                            <td>{selectedRefund.customerPhone}</td>
                                        </tr>
                                        <tr>
                                            <td>이메일</td>
                                            <td>{selectedRefund.customerEmail}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        <div className="mb-3">
                            <h6>환불 사유</h6>
                            <p className="border p-2 rounded bg-light">
                                {selectedRefund.reason}
                            </p>
                        </div>

                        {selectedRefund.status === 'PENDING' && (
                            <div className="d-flex gap-2">
                                <ButtonComponent
                                    variant="success"
                                    onClick={() => {
                                        handleRefundApproval(selectedRefund.refundId);
                                        closeRefundDetail();
                                    }}
                                >
                                    환불 승인
                                </ButtonComponent>
                                <ButtonComponent
                                    variant="danger"
                                    onClick={() => {
                                        handleRefundRejection(selectedRefund.refundId);
                                        closeRefundDetail();
                                    }}
                                >
                                    환불 거부
                                </ButtonComponent>
                            </div>
                        )}
                    </div>
                )}
            </ModalComponent>
        </ContainerComponent>
    );
}
