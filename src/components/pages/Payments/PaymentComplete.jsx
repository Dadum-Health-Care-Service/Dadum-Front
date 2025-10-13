import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ButtonComponent from '../../common/ButtonComponent';
import styles from './PaymentComplete.module.css';

const PaymentComplete = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentResult, setPaymentResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // URL 파라미터에서 결제 결과 파싱
    const errorCode = searchParams.get('error_code');
    const errorMsg = searchParams.get('error_msg');
    const impUid = searchParams.get('imp_uid');
    const merchantUid = searchParams.get('merchant_uid');

    const result = {
      success: !errorCode || errorCode === '0',
      errorCode,
      errorMsg: errorMsg ? decodeURIComponent(errorMsg) : null,
      impUid,
      merchantUid
    };

    setPaymentResult(result);
    setLoading(false);

    // 결제 취소인 경우 자동으로 쇼핑몰로 돌아가기
    if (errorCode === 'F400' && errorMsg && (errorMsg.includes('취소') || errorMsg.includes('I002'))) {
      setTimeout(() => {
        navigate('/shop');
      }, 3000);
    }
  }, [searchParams, navigate]);

  const handleBackToShop = () => {
    navigate('/shop');
  };

  const handleRetryPayment = () => {
    // 결제 재시도를 위해 쇼핑몰로 돌아가기
    navigate('/shop');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">결제 결과 확인 중...</span>
          </div>
          <p className={styles.loadingText}>결제 결과를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (!paymentResult) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <h2 className={styles.errorTitle}>결제 정보를 확인할 수 없습니다</h2>
          <p className={styles.errorText}>잠시 후 다시 시도해주세요.</p>
          <ButtonComponent variant="primary" onClick={handleBackToShop}>
            쇼핑몰으로 돌아가기
          </ButtonComponent>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {paymentResult.success ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.successTitle}>결제가 완료되었습니다!</h2>
            <p className={styles.successText}>
              결제가 성공적으로 처리되었습니다.
            </p>
            <div className={styles.paymentInfo}>
              <p><strong>결제 번호:</strong> {paymentResult.impUid}</p>
              <p><strong>주문 번호:</strong> {paymentResult.merchantUid}</p>
            </div>
            <ButtonComponent variant="primary" onClick={handleBackToShop}>
              쇼핑몰으로 돌아가기
            </ButtonComponent>
          </div>
        ) : (
          <div className={styles.errorContainer}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.errorTitle}>결제가 취소되었습니다</h2>
            <p className={styles.errorText}>
              {paymentResult.errorMsg || '결제가 취소되었습니다.'}
            </p>
            <div className={styles.buttonGroup}>
              <ButtonComponent variant="outline" onClick={handleBackToShop}>
                쇼핑몰으로 돌아가기
              </ButtonComponent>
              <ButtonComponent variant="primary" onClick={handleRetryPayment}>
                다시 결제하기
              </ButtonComponent>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentComplete;
