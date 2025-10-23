import React, { useState, useEffect, useContext } from 'react';
import { useApi } from '../../../../utils/api/useApi';
import { AuthContext } from '../../../../context/AuthContext';
import ButtonComponent from '../../../common/ButtonComponent';
import ModalComponent from '../../../common/ModalComponent';
import styles from './OrderHistory.module.css';

export default function OrderHistory() {
  const { GET, DELETE, POST } = useApi();
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 환불 모달 상태
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [productCondition, setProductCondition] = useState('NEW');
  const [additionalInfo, setAdditionalInfo] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // 사용자 로그인 확인
      if (!user || !user.accessToken) {
        setOrders([]);
        setError('');
        setLoading(false);
        return;
      }

      // 실제 API 호출 (useApi 사용)
      const response = await GET('/orders', {}, true, 'main');
      
      // axios 응답을 직접 처리
      if (response && response.data) {
        // 백엔드 응답 구조에 맞게 수정
        const ordersData = response.data.orders || response.data || [];
        setOrders(ordersData);
        setError('');
      } else {
        console.error("API 오류: 응답 데이터가 없습니다");
        throw new Error('주문 내역 조회 실패');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('❌ 주문 내역 조회 실패:', error);
      setError('주문 내역을 불러오는데 실패했습니다.');
      setLoading(false);
    }
  };

  // 결제 취소 처리
  const handleCancelOrder = async (order) => {
    if (!window.confirm(`정말로 "${order.productName}" 주문을 취소하시겠습니까?\n결제 금액이 환불됩니다.`)) {
      return;
    }

    setLoading(true);
    try {
      if (!user || !user.accessToken) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 주문 취소 API 호출 (useApi 사용)
      const response = await DELETE(`/orders/${order.id}/cancel`, {}, true, 'main');

      if (response && response.data) {
        alert('주문이 성공적으로 취소되었습니다.');
        // 주문 내역 새로고침
        fetchOrders();
      } else {
        throw new Error('주문 취소 실패');
      }
      
    } catch (error) {
      console.error('결제 취소 실패:', error);
      setError('결제 취소에 실패했습니다. 관리자에게 문의해주세요.');
      setLoading(false);
    }
  };

  // 환불 모달 열기
  const openRefundModal = (order) => {
    setSelectedOrder(order);
    setRefundAmount(order.totalAmount.toString());
    setShowRefundModal(true);
  };

  // 환불 모달 닫기
  const closeRefundModal = () => {
    setShowRefundModal(false);
    setSelectedOrder(null);
    setRefundReason('');
    setRefundAmount('');
    setProductCondition('NEW');
    setAdditionalInfo('');
  };

  // 환불 요청 처리
  const handleRefundRequest = async () => {
    if (!refundReason.trim()) {
      alert('환불 사유를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (!user || !user.accessToken) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      const refundRequest = {
        refundReason: refundReason,
        refundAmount: parseInt(refundAmount),
        productCondition: productCondition,
        additionalInfo: additionalInfo
      };

      // 환불 요청 API 호출 (useApi 사용)
      const response = await POST(
        `/orders/${selectedOrder.id}/refund`,
        refundRequest,
        true,
        'main'
      );

      if (response && response.data) {
        alert('환불 요청이 성공적으로 접수되었습니다.\n검토 후 3-5일 내에 처리됩니다.');
        // 모달 닫기 및 주문 내역 새로고침
        closeRefundModal();
        fetchOrders();
      } else {
        throw new Error('환불 요청 실패');
      }
      
    } catch (error) {
      console.error('환불 요청 실패:', error);
      setError('환불 요청에 실패했습니다. 관리자에게 문의해주세요.');
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { className: styles.statusPending, text: '주문 대기' },
      'CONFIRMED': { className: styles.statusConfirmed, text: '주문 확인' },
      'SHIPPED': { className: styles.statusShipped, text: '배송 중' },
      'DELIVERED': { className: styles.statusDelivered, text: '배송 완료' },
      'CANCELLED': { className: styles.statusCancelled, text: '주문 취소' }
    };

    const config = statusConfig[status] || { className: styles.statusPending, text: status };
    return <span className={`${styles.statusBadge} ${config.className}`}>{config.text}</span>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className={styles.orderHistoryContainer}>
        <div className={styles.loadingContainer}>
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginLeft: '12px', marginTop: '8px' }}>주문 내역을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.orderHistoryContainer}>
        <div className={styles.errorContainer}>
          <h4 className={styles.errorTitle}>오류 발생</h4>
          <p className={styles.errorText}>{error}</p>
          <ButtonComponent variant="outline" onClick={fetchOrders}>
            다시 시도
          </ButtonComponent>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.orderHistoryContainer}>
        {/* 헤더 */}
        <div className={styles.orderHistoryHeader}>
          <h1 className={styles.orderHistoryTitle}>📋 주문 내역</h1>
          <p className={styles.orderHistorySubtitle}>나의 주문 현황을 확인해보세요</p>
          
          {/* 디버깅 버튼 */}
          <div>
            <ButtonComponent 
              variant="outline" 
              size="small"
              onClick={() => {
                alert(`사용자: ${user ? '있음' : '없음'}\n토큰: ${user?.accessToken ? '있음' : '없음'}\n사용자 ID: ${user?.usersId || '없음'}`);
              }}
              className={styles.debugButton}
            >
              🔍 토큰 상태 확인
            </ButtonComponent>
          </div>
        </div>

        {/* 주문 내역 */}
        {orders.length === 0 ? (
          <div className={styles.emptyState}>
            <h4 className={styles.emptyStateTitle}>📋 주문 내역이 없습니다</h4>
            <p className={styles.emptyStateText}>
              {!user || !user.accessToken 
                ? '로그인 후 주문 내역을 확인할 수 있습니다.' 
                : '아직 주문한 상품이 없습니다. 첫 번째 주문을 시작해보세요!'
              }
            </p>
            {user && user.accessToken && (
              <ButtonComponent 
                variant="primary" 
                onClick={() => window.location.href = '/shop'}
                className={styles.shopButton}
              >
                쇼핑하러 가기
              </ButtonComponent>
            )}
          </div>
        ) : (
          <div className={styles.ordersGrid}>
            {Array.isArray(orders) && orders.map((order) => (
              <div key={order.id} className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  <span className={styles.orderNumber}>주문번호</span>
                  <span>{order.orderNumber}</span>
                </div>
                
                <div className={styles.orderCardBody}>
                  <div style={{ marginBottom: '16px' }}>
                    <h6 className={styles.productTitle}>{order.productName}</h6>
                    <p className={styles.productCategory}>
                      카테고리: {order.productCategory || '일반'}
                    </p>
                    <div className={styles.priceInfo}>
                      <span>수량: {order.quantity}개</span>
                      <span className={styles.totalAmount}>
                        ₩{order.totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.orderStatus}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span className={styles.statusLabel}>주문 상태:</span>
                      {getStatusBadge(order.orderStatus)}
                    </div>
                    <div className={styles.orderDetails}>
                      <div className={styles.orderDetailItem}>배송지: {order.shippingAddress || '기본 배송지'}</div>
                      <div className={styles.orderDetailItem}>주문자: {order.buyerName || '알 수 없음'}</div>
                      <div className={styles.orderDetailItem}>연락처: {order.buyerPhone || '알 수 없음'}</div>
                    </div>
                  </div>
                  
                  <div className={styles.orderDetails}>
                    <div className={styles.orderDetailItem}>주문일: {formatDate(order.createdAt)}</div>
                    {order.updatedAt && (
                      <div className={styles.orderDetailItem}>최종 업데이트: {formatDate(order.updatedAt)}</div>
                    )}
                  </div>
                </div>
                
                <div className={styles.orderCardFooter}>
                  <div className={styles.orderActions}>
                    <ButtonComponent variant="outline" size="small" className={styles.actionButton}>
                      배송 조회
                    </ButtonComponent>
                    {order.orderStatus === 'CONFIRMED' && (
                      <ButtonComponent 
                        variant="outline" 
                        size="small"
                        onClick={() => handleCancelOrder(order)}
                        disabled={loading}
                        className={`${styles.actionButton} ${styles.cancelButton}`}
                      >
                        {loading ? '처리중...' : '결제 취소'}
                      </ButtonComponent>
                    )}
                    {order.orderStatus === 'DELIVERED' && (
                      <ButtonComponent 
                        variant="outline" 
                        size="small"
                        onClick={() => openRefundModal(order)}
                        disabled={loading}
                        className={`${styles.actionButton} ${styles.refundButton}`}
                      >
                        환불 요청
                      </ButtonComponent>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* 환불 요청 모달 */}
      <ModalComponent 
        isOpen={showRefundModal} 
        onClose={closeRefundModal} 
        size="large"
        title="🔄 환불 요청"
      >
        {selectedOrder && (
          <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h6 style={{ marginBottom: '12px', color: '#2c3e50' }}>주문 상품 정보</h6>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span>{selectedOrder.productName}</span>
              <span style={{ fontWeight: 'bold', color: '#f39c12' }}>₩{selectedOrder.totalAmount.toLocaleString()}</span>
            </div>
            <small style={{ color: '#7f8c8d' }}>주문번호: {selectedOrder.orderNumber}</small>
          </div>
        )}
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
              환불 사유 <span style={{ color: '#e74c3c' }}>*</span>
            </label>
            <select 
              value={refundReason} 
              onChange={(e) => setRefundReason(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="">환불 사유를 선택하세요</option>
              <option value="상품 불량">상품 불량</option>
              <option value="상품 오배송">상품 오배송</option>
              <option value="상품과 다름">상품과 다름</option>
              <option value="단순 변심">단순 변심</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>환불 금액</label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="환불 받을 금액을 입력하세요"
              min="0"
              max={selectedOrder?.totalAmount || 0}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem'
              }}
            />
            <small style={{ color: '#7f8c8d', marginTop: '4px', display: 'block' }}>
              최대 환불 가능 금액: ₩{selectedOrder?.totalAmount?.toLocaleString() || 0}
            </small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>상품 상태</label>
            <select 
              value={productCondition} 
              onChange={(e) => setProductCondition(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white'
              }}
            >
              <option value="NEW">새상품 (미사용)</option>
              <option value="USED">사용함</option>
              <option value="DAMAGED">파손됨</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>추가 설명</label>
            <textarea
              rows={3}
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="환불 사유에 대한 상세 설명을 입력하세요"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e9ecef',
                borderRadius: '8px',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>
        </div>

        <ModalComponent.Actions align="right">
          <ButtonComponent variant="secondary" onClick={closeRefundModal}>
            취소
          </ButtonComponent>
          <ButtonComponent 
            variant="primary" 
            onClick={handleRefundRequest}
            disabled={loading || !refundReason.trim()}
          >
            {loading ? '처리중...' : '환불 요청'}
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>
    </div>
  );
}
