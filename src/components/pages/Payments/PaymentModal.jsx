import { useState, useEffect } from 'react';
import axios from 'axios';
import ModalComponent from '../../common/ModalComponent';
import ButtonComponent from '../../common/ButtonComponent';
import { getPaymentConfig } from '../../../config/payment.config';
import styles from './PaymentModal.module.css';

const PaymentModal = ({ show, onHide, product, deliveryInfo, user, onPaymentSuccess }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userDetails, setUserDetails] = useState(null);
  const [userDetailsLoading, setUserDetailsLoading] = useState(false);

  // 사용자 상세 정보 가져오기
  useEffect(() => {
    if (show && user?.usersId) {
      setUserDetailsLoading(true);
      setError('');
      
      const fetchUserDetails = async () => {
        try {
          // user 객체에서 accessToken 가져오기
          const token = user.accessToken;
          
          if (!token) {
            setError('로그인이 필요합니다. 다시 로그인해주세요.');
            setUserDetailsLoading(false);
            return;
          }
          
          const response = await axios.get(
            `http://localhost:8080/api/v1/users/${user.usersId}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          setUserDetails(response.data);
          setUserDetailsLoading(false);
          setError(''); // 성공 시 에러 메시지 초기화
        } catch (error) {
          setError('사용자 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
          setUserDetailsLoading(false);
        }
      };
      
      fetchUserDetails();
    }
  }, [show, user?.usersId, user?.accessToken]);

  // 아임포트 초기화
  useEffect(() => {
    if (show) {
      // 모달이 열릴 때 에러 메시지 초기화
      setError('');
      
      if (window.IMP) {
        // 환경별 설정에서 가맹점 코드 가져오기
        const config = getPaymentConfig();
        window.IMP.init(config.IAMPORT_MERCHANT_ID);
      } else {
        setError('아임포트 SDK를 불러올 수 없습니다. 페이지를 새로고침해주세요.');
      }
    }
  }, [show]);

  // 모달이 닫힐 때 상태 초기화
  const handleModalClose = () => {
    setError('');
    setLoading(false);
    setUserDetails(null);
    setUserDetailsLoading(false);
    onHide();
  };

    const sendPaymentToBackend = async (impResponse, paymentData) => {
    try {
      // user 객체에서 accessToken 가져오기
      const token = user.accessToken;
      if (!token) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
        return;
      }

      const paymentRequest = {
        merchantUid: paymentData.merchant_uid,
        impUid: impResponse.imp_uid,
        productName: paymentData.name,
        amount: paymentData.amount,
        paymentMethod: paymentData.pay_method,
        productCategory: product?.category || 'general',
        quantity: 1,
        shippingAddress: deliveryInfo ? `${deliveryInfo.address} ${deliveryInfo.detailAddress}`.trim() : '배송지 정보 없음',
        // shippingPhone: paymentData.buyer_tel, - UsersEntity.phoneNum 사용
        orderNotes: deliveryInfo?.deliveryMessage || ''
      };

      const response = await axios.post(
        'http://localhost:8080/api/v1/payments/process',
        paymentRequest,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onPaymentSuccess(response.data);
      onHide();
      
    } catch (error) {
      if (error.response?.status === 401) {
        setError('로그인이 필요합니다. 다시 로그인해주세요.');
      } else {
        setError('결제 정보 저장에 실패했습니다. 관리자에게 문의해주세요.');
      }
    }
  };

  const handlePayment = () => {
    if (!product) {
      setError('상품 정보가 없습니다.');
      return;
    }

    if (!window.IMP) {
      setError('아임포트 SDK를 불러올 수 없습니다.');
      return;
    }

    setLoading(true);
    setError('');

    // AuthContext에서 사용자 정보 가져오기
    if (!user) {
      setError('로그인이 필요합니다. 다시 로그인해주세요.');
      setLoading(false);
      return;
    }
    
    // 설정값 확인 로그
    const config = getPaymentConfig();

    
    // 사용자 상세 정보가 로드되지 않은 경우 - 기본 정보로 진행
    if (!userDetails) {
      // 기본 사용자 정보로 결제 진행 (임시 해결책)
    }
    
    // 필수 사용자 정보 검증 (이메일만 있으면 통과)
    if (!user.email) {
      setError('사용자 정보가 불완전합니다. 로그인 후 다시 시도해주세요.');
      setLoading(false);
      return;
    }

    const paymentData = {
      // channelKey 방식이 작동하지 않으므로 pg 방식 사용
      // channelKey: config.CHANNEL_KEY, // 주석 처리
      pg: config.PG_PROVIDER, // 'nice_v2' 사용
      pay_method: 'card', // 테스트 환경에서는 신용카드만 사용 (오타 수정됨)
      merchant_uid: `mid_${new Date().getTime()}`,
      amount: product.price,
      name: product.name,
      buyer_email: user.email,
      buyer_name: userDetails ? (userDetails.usersName || userDetails.nickName || '사용자') : '사용자',
      buyer_tel: userDetails ? (userDetails.phoneNum || '') : ''
    };



    window.IMP.request_pay(paymentData, (response) => {
      setLoading(false);
      
      // 응답 데이터 검증 및 정규화
      const normalizedResponse = {
        success: response.success,
        error_code: response.error_code || response.error_oode,
        error_msg: response.error_msg || response.error_mag,
        imp_uid: response.imp_uid,
        merchant_uid: response.merchant_uid
      };
      
      // 사용자 취소 케이스 우선 확인 (X 버튼 클릭 등)
      if (normalizedResponse.error_code === 'F400' && 
          normalizedResponse.error_msg && 
          normalizedResponse.error_msg.includes('1009')) {
        setError('결제가 취소되었습니다.');
        return;
      }
      
      // 결제 취소 케이스 확인
      if (normalizedResponse.error_code === 'PAY_CANCEL') {
        setError('결제가 취소되었습니다.');
        return;
      }
      
      if (normalizedResponse.success) {
        // 결제 성공
        
        // 백엔드에 결제 정보 전송
        sendPaymentToBackend(normalizedResponse, paymentData);
      } else {
        // 결제 실패
        
        // 기타 결제 실패 시 메시지 표시
        const errorMessage = normalizedResponse.error_msg || '알 수 없는 오류';
        setError(`결제 실패: ${errorMessage}`);
      }
    });
  };
  return (
    <ModalComponent 
      isOpen={show} 
      onClose={handleModalClose} 
      size="large"
      title="💳 결제하기"
      className={styles.wideModal}
    >
      <div className={styles.paymentForm}>
        {product && (
          <div className={styles.productSummary}>
            <h5 className={styles.productSummaryTitle}>주문 상품</h5>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{product.name}</span>
              <span style={{ fontWeight: 'bold', color: '#f39c12' }}>₩{product.price.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className={styles.paymentMethodGroup}>
          <label className={styles.paymentMethodLabel}>결제 수단</label>
          <select
            className={styles.paymentMethodSelect}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="card">신용카드</option>
            <option value="trans" disabled>실시간 계좌이체 (테스트 불가)</option>
            <option value="vbank" disabled>가상계좌 (테스트 불가)</option>
            <option value="phone" disabled>휴대폰 소액결제 (테스트 불가)</option>
          </select>
        </div>

        {userDetailsLoading && (
          <div className={`${styles.alertContainer} ${styles.alertInfo}`}>
            🔄 사용자 정보를 불러오는 중입니다...
          </div>
        )}
        
        {error && (
          <div className={`${styles.alertContainer} ${styles.alertDanger}`}>
            {error}
            <div style={{ marginTop: '8px' }}>
              <ButtonComponent 
                variant="outline" 
                size="small"
                onClick={() => {
                  setError('');
                  if (user?.usersId) {
                    setUserDetailsLoading(true);
                    // 사용자 상세 정보 다시 가져오기
                    const fetchUserDetails = async () => {
                      try {
                        const token = user.accessToken;
                        const response = await axios.get(
                          `http://localhost:8080/api/v1/users/${user.usersId}`,
                          {
                            headers: {
                              'Authorization': `Bearer ${token}`,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        setUserDetails(response.data);
                        setUserDetailsLoading(false);
                      } catch (error) {
                        setError('사용자 정보를 가져오는데 실패했습니다. 다시 시도해주세요.');
                        setUserDetailsLoading(false);
                      }
                    };
                    fetchUserDetails();
                  }
                }}
              >
                🔄 다시 시도
              </ButtonComponent>
            </div>
          </div>
        )}
      </div>

      <ModalComponent.Actions align="right">
        <ButtonComponent variant="secondary" onClick={handleModalClose}>
          취소
        </ButtonComponent>
        <ButtonComponent
          variant="primary"
          onClick={handlePayment}
          disabled={loading || userDetailsLoading}
          className={styles.warningButton}
        >
          {loading ? '결제 처리중...' : 
           userDetailsLoading ? '사용자 정보 로딩중...' : 
           '결제하기'}
        </ButtonComponent>
      </ModalComponent.Actions>
    </ModalComponent>
  );
};

export default PaymentModal;