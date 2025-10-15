import React, { useState, useEffect } from 'react';
import ContainerComponent from '@/components/common/ContainerComponent';
import ButtonComponent from '@/components/common/ButtonComponent';
import InputComponent from '@/components/common/InputComponent';
import CardComponent from '@/components/common/CardComponent';
import styles from './FraudDetection.module.css';

const FraudDetection = ({ hideHeader = false }) => {
  const [transactions, setTransactions] = useState([]);
  const [riskScores, setRiskScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [aiServiceStatus, setAiServiceStatus] = useState(null);
  const [modelStatus, setModelStatus] = useState(null);
  
  // 테스트용 거래 데이터
  const [testTransaction, setTestTransaction] = useState({
    amount: '',
    userId: ''
  });

  useEffect(() => {
    loadAIServiceStatus();
    loadModelStatus();
  }, []);

  const loadAIServiceStatus = async () => {
    try {
      const response = await fetch('/api/ai/health');
      if (response.ok) {
        const data = await response.json();
        setAiServiceStatus(data);
      } else {
        console.error('AI 서비스 상태 확인 실패:', response.status);
        setAiServiceStatus({ ai_service_healthy: false, status: 'unhealthy' });
      }
    } catch (error) {
      console.error('AI 서비스 상태 확인 실패:', error);
      setAiServiceStatus({ ai_service_healthy: false, status: 'unhealthy' });
    }
  };

  const loadModelStatus = async () => {
    try {
      const response = await fetch('/api/ai/model-status');
      if (response.ok) {
        const data = await response.json();
        setModelStatus(data);
      } else {
        console.error('모델 상태 확인 실패:', response.status);
        setModelStatus({ is_trained: false, error: '모델 상태 확인 실패' });
      }
    } catch (error) {
      console.error('모델 상태 확인 실패:', error);
      setModelStatus({ is_trained: false, error: error.message });
    }
  };

  const detectFraud = async (transaction) => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/detect-fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
      });
      const result = await response.json();
      setRiskScores(prev => ({ ...prev, [transaction.transactionId]: result }));
      
      // 이상거래 발생 시 알림
      if (result.isAnomaly) {
        showFraudAlert(result);
      }
    } catch (error) {
      console.error('AI 탐지 실패:', error);
      setRiskScores(prev => ({ 
        ...prev, 
        [transaction.transactionId]: { 
          riskScore: 0, 
          isAnomaly: false, 
          error: `AI 서비스 연결 실패: ${error.message}`,
          recommendation: '네트워크 연결을 확인하고 다시 시도해주세요.'
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const detectFraudSimple = async () => {
    if (!testTransaction.amount || !testTransaction.userId) {
      alert('거래 금액과 사용자 ID를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 고유한 거래 ID 생성 (타임스탬프 + 랜덤)
      const uniqueTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('=== AI 탐지 요청 시작 ===');
      console.log('요청 데이터:', { ...testTransaction, transactionId: uniqueTransactionId });
      
      const response = await fetch(`/api/ai/detect-fraud-simple?transactionId=${uniqueTransactionId}&amount=${testTransaction.amount}&userId=${testTransaction.userId}`, {
        method: 'POST'
      });
      
      console.log('=== 백엔드 응답 ===');
      console.log('Status:', response.status);
      console.log('OK:', response.ok);
      
      const result = await response.json();
      console.log('=== AI 분석 결과 ===');
      console.log('결과:', result);
      
      setRiskScores(prev => ({ ...prev, [testTransaction.transactionId]: result }));
      
      // 이상거래 발생 시 알림
      if (result.isAnomaly) {
        showFraudAlert(result);
      }
    } catch (error) {
      console.error('AI 탐지 실패:', error);
      setRiskScores(prev => ({ 
        ...prev, 
        [testTransaction.transactionId]: { 
          riskScore: 0, 
          isAnomaly: false, 
          error: `AI 서비스 연결 실패: ${error.message}`,
          recommendation: '네트워크 연결을 확인하고 다시 시도해주세요.'
        } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/train-model', {
        method: 'POST'
      });
      const result = await response.json();
      if (result.success) {
        alert('AI 모델 훈련이 시작되었습니다. 잠시 후 상태를 확인해주세요.');
        // 3초 후 모델 상태 다시 확인
        setTimeout(() => {
          loadModelStatus();
        }, 3000);
      } else {
        alert('AI 모델 훈련에 실패했습니다: ' + result.message);
      }
    } catch (error) {
      console.error('모델 훈련 실패:', error);
      alert('모델 훈련 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskScore) => {
    if (riskScore >= 80) return '#ff4444'; // 빨간색
    if (riskScore >= 60) return '#ff8800'; // 주황색
    if (riskScore >= 40) return '#ffaa00'; // 노란색
    return '#44ff44'; // 초록색
  };

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 80) return '🚨 높은 위험';
    if (riskScore >= 60) return '⚠️ 중간 위험';
    if (riskScore >= 40) return '🔍 낮은 위험';
    return '✅ 안전';
  };

  // 이상거래 알림 함수
  const showFraudAlert = (result) => {
    // 브라우저 알림 권한 요청
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // 브라우저 알림 표시
    if (Notification.permission === 'granted') {
      const notification = new Notification('🚨 이상거래 감지!', {
        body: `거래 ID: ${result.transactionId}\n위험도: ${result.riskScore}%\n추천사항: ${result.recommendation}`,
        icon: '/img/userAvatar.png',
        tag: 'fraud-alert'
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // 10초 후 자동 닫기
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
    
    // 페이지 내 알림 표시
    const alertMessage = `🚨 이상거래가 감지되었습니다!\n\n거래 ID: ${result.transactionId}\n위험도: ${result.riskScore}%\n추천사항: ${result.recommendation}`;
    alert(alertMessage);
  };

  return (
    <ContainerComponent>
      <div className={styles.fraudDetection}>
        {!hideHeader && <h2>🤖 AI 이상거래 탐지</h2>}
        
        {/* AI 서비스 상태 */}
        <CardComponent title="AI 서비스 상태" className={styles.statusCard}>
          <div className={styles.statusGrid}>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>AI 서버:</span>
              <span className={`${styles.statusValue} ${aiServiceStatus?.ai_service_healthy ? styles.healthy : styles.unhealthy}`}>
                {aiServiceStatus?.ai_service_healthy ? '🟢 정상' : '🔴 오류'}
              </span>
            </div>
            <div className={styles.statusItem}>
              <span className={styles.statusLabel}>모델 상태:</span>
              <span className={`${styles.statusValue} ${modelStatus?.is_trained ? styles.healthy : styles.unhealthy}`}>
                {modelStatus?.is_trained ? '🟢 훈련됨' : '🔴 미훈련'}
              </span>
            </div>
            <ButtonComponent onClick={loadAIServiceStatus} size="small">
              상태 새로고침
            </ButtonComponent>
            <ButtonComponent onClick={trainModel} size="small" disabled={loading}>
              {loading ? '훈련 중...' : '모델 훈련'}
            </ButtonComponent>
          </div>
        </CardComponent>

        {/* 테스트 거래 입력 */}
        <CardComponent title="테스트 거래 입력" className={styles.testCard}>
          <div className={styles.testForm}>
            <InputComponent
              label="거래 금액"
              type="number"
              value={testTransaction.amount}
              onChange={(e) => setTestTransaction(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="예: 50000"
            />
            <InputComponent
              label="사용자 ID"
              value={testTransaction.userId}
              onChange={(e) => setTestTransaction(prev => ({ ...prev, userId: e.target.value }))}
              placeholder="예: user_123"
            />
            <ButtonComponent 
              onClick={detectFraudSimple} 
              disabled={loading}
              className={styles.detectButton}
            >
              {loading ? '분석 중...' : '🔍 이상거래 탐지'}
            </ButtonComponent>
          </div>
        </CardComponent>

        {/* 탐지 결과 */}
        {Object.keys(riskScores).length > 0 && (
          <CardComponent title="탐지 결과" className={styles.resultsCard}>
            <div className={styles.resultsList}>
              {Object.entries(riskScores).map(([transactionId, result]) => (
                <div key={transactionId} className={styles.resultItem}>
                  <div className={styles.resultHeader}>
                    <h4>거래 ID: {transactionId}</h4>
                    <div 
                      className={styles.riskIndicator}
                      style={{ backgroundColor: getRiskColor(result.riskScore || 0) }}
                    >
                      {getRiskLevel(result.riskScore || 0)}
                    </div>
                  </div>
                  
                  <div className={styles.resultDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>위험도:</span>
                      <span className={styles.detailValue}>{result.riskScore || 0}%</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>이상거래:</span>
                      <span className={styles.detailValue}>
                        {result.isAnomaly ? '🚨 예' : '✅ 아니오'}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>신뢰도:</span>
                      <span className={styles.detailValue}>{result.confidence || 0}%</span>
                    </div>
                    {result.recommendation && (
                      <div className={styles.recommendation}>
                        <strong>추천사항:</strong> {result.recommendation}
                      </div>
                    )}
                    {result.error && (
                      <div className={styles.error}>
                        <strong>오류:</strong> {result.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardComponent>
        )}

        {/* 도움말 */}
        <CardComponent title="사용법" className={styles.helpCard}>
          <div className={styles.helpContent}>
            <h4>🔍 이상거래 탐지 기능</h4>
            <ul>
              <li><strong>위험도 80% 이상:</strong> 🚨 높은 위험 - 즉시 차단 권장</li>
              <li><strong>위험도 60-79%:</strong> ⚠️ 중간 위험 - 추가 인증 필요</li>
              <li><strong>위험도 40-59%:</strong> 🔍 낮은 위험 - 모니터링 권장</li>
              <li><strong>위험도 40% 미만:</strong> ✅ 안전 - 정상 거래</li>
            </ul>
            
            <h4>📊 AI 모델 정보</h4>
            <ul>
              <li><strong>알고리즘:</strong> Isolation Forest (이상치 탐지)</li>
              <li><strong>특징:</strong> 거래 금액, 시간, 위치, 사용자 패턴 등</li>
              <li><strong>학습:</strong> 샘플 데이터로 자동 훈련</li>
            </ul>
          </div>
        </CardComponent>
      </div>
    </ContainerComponent>
  );
};

export default FraudDetection;
