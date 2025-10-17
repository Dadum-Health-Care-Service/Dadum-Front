import React, { useState, useEffect, useContext } from 'react';
import { useApi } from '../../../../utils/api/useApi';
import { AuthContext } from '../../../../context/AuthContext';
import CardComponent from '../../../common/CardComponent';
import ButtonComponent from '../../../common/ButtonComponent';
import styles from './SystemTest.module.css';

const SystemTest = () => {
  const { GET, POST } = useApi();
  const { user } = useContext(AuthContext);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [testLog, setTestLog] = useState([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, { timestamp, message, type }]);
  };

  const updateTestResult = (testName, status, details = '') => {
    setTestResults(prev => ({
      ...prev,
      [testName]: { status, details, timestamp: new Date().toLocaleTimeString() }
    }));
  };

  // 1. AI 서비스 상태 테스트
  const testAIService = async () => {
    addLog('AI 서비스 상태 확인 중...', 'info');
    try {
      const response = await GET('/ai/health', {}, true, 'main');
      console.log('AI Health Response:', response);
      
      if (response && response.data) {
        const data = response.data;
        updateTestResult('ai_service', 'success', `AI 서비스 정상: ${data.message}`);
        addLog('✅ AI 서비스 정상 작동', 'success');
        return true;
      } else {
        updateTestResult('ai_service', 'error', 'AI 서비스 응답 데이터 없음');
        addLog('❌ AI 서비스 응답 데이터 없음', 'error');
        return false;
      }
    } catch (error) {
      updateTestResult('ai_service', 'error', error.message);
      addLog(`❌ AI 서비스 연결 실패: ${error.message}`, 'error');
      return false;
    }
  };

  // 2. AI 모델 상태 테스트
  const testAIModel = async () => {
    addLog('AI 모델 상태 확인 중...', 'info');
    try {
      const response = await GET('/ai/model-status', {}, true, 'main');
      console.log('AI Model Status Response:', response);
      
      if (response && response.data) {
        const data = response.data;
        if (data.is_trained) {
          updateTestResult('ai_model', 'success', '모델 훈련 완료');
          addLog('✅ AI 모델 훈련 완료', 'success');
          return true;
        } else {
          updateTestResult('ai_model', 'warning', '모델 미훈련');
          addLog('⚠️ AI 모델 미훈련 상태', 'warning');
          return false;
        }
      } else {
        updateTestResult('ai_model', 'error', 'AI 모델 상태 확인 실패');
        addLog('❌ AI 모델 상태 확인 실패', 'error');
        return false;
      }
    } catch (error) {
      updateTestResult('ai_model', 'error', error.message);
      addLog(`❌ AI 모델 상태 확인 실패: ${error.message}`, 'error');
      return false;
    }
  };

  // 3. 통계 API 테스트
  const testStatisticsAPI = async () => {
    addLog('통계 API 테스트 중...', 'info');
    try {
      const response = await GET('/ai/statistics', {}, true, 'main');
      console.log('Statistics API Response:', response);
      
      if (response && response.data) {
        const data = response.data;
        updateTestResult('statistics_api', 'success', `총 거래: ${data.total_transactions || 0}`);
        addLog('✅ 통계 API 정상 작동', 'success');
        return true;
      } else {
        updateTestResult('statistics_api', 'error', '통계 API 응답 데이터 없음');
        addLog('❌ 통계 API 응답 데이터 없음', 'error');
        return false;
      }
    } catch (error) {
      updateTestResult('statistics_api', 'error', error.message);
      addLog(`❌ 통계 API 실패: ${error.message}`, 'error');
      return false;
    }
  };

  // 4. 거래 목록 API 테스트
  const testTransactionsAPI = async () => {
    addLog('거래 목록 API 테스트 중...', 'info');
    try {
      const response = await GET('/ai/transactions?size=5', {}, true, 'main');
      console.log('Transactions API Response:', response);
      
      if (response && response.data) {
        const data = response.data;
        updateTestResult('transactions_api', 'success', `거래 수: ${data.transactions?.length || 0}`);
        addLog('✅ 거래 목록 API 정상 작동', 'success');
        return true;
      } else {
        updateTestResult('transactions_api', 'error', '거래 목록 API 응답 데이터 없음');
        addLog('❌ 거래 목록 API 응답 데이터 없음', 'error');
        return false;
      }
    } catch (error) {
      updateTestResult('transactions_api', 'error', error.message);
      addLog(`❌ 거래 목록 API 실패: ${error.message}`, 'error');
      return false;
    }
  };

  // 5. 이상거래 탐지 테스트
  const testFraudDetection = async () => {
    addLog('이상거래 탐지 테스트 중...', 'info');
    try {

      const testTransaction = {
        transactionId: `TEST_${Date.now()}`,
        amount: 100000,
        userId: 'test_user',
        timestamp: new Date().toISOString(),
        hour: 2, // 새벽 시간 (이상거래 가능성 높음)
        dayOfWeek: 0,
        transactionCount24h: 50, // 높은 거래 수
        avgAmount7d: 5000,
        locationDistance: 1000, // 먼 거리
        cardAgeDays: 1, // 새로운 카드
        merchantCategory: 1,
        merchantId: 'test_merchant',
        ipAddress: '192.168.1.1',
        deviceInfo: 'test_device'
      };

      const response = await POST('/ai/detect-fraud', testTransaction, true, 'main');
      console.log('Fraud Detection Response:', response);

      if (response && response.data) {
        const data = response.data;
        updateTestResult('fraud_detection', 'success', 
          `위험도: ${data.riskScore}%, 이상거래: ${data.isAnomaly ? '예' : '아니오'}`);
        addLog(`✅ 이상거래 탐지 완료 - 위험도: ${data.riskScore}%`, 'success');
        return true;
      } else {
        updateTestResult('fraud_detection', 'error', '이상거래 탐지 API 응답 데이터 없음');
        addLog('❌ 이상거래 탐지 API 응답 데이터 없음', 'error');
        return false;
      }
    } catch (error) {
      updateTestResult('fraud_detection', 'error', error.message);
      addLog(`❌ 이상거래 탐지 실패: ${error.message}`, 'error');
      return false;
    }
  };

  // 6. WebSocket 연결 테스트
  const testWebSocket = () => {
    addLog('WebSocket 연결 테스트 중...', 'info');
    return new Promise((resolve) => {
      try {
        // SockJS와 STOMP import 확인
        if (typeof window.SockJS === 'undefined') {
          updateTestResult('websocket', 'error', 'SockJS가 로드되지 않음');
          addLog('❌ SockJS 라이브러리가 로드되지 않았습니다', 'error');
          resolve(false);
          return;
        }
        
        if (typeof window.Stomp === 'undefined') {
          updateTestResult('websocket', 'error', 'STOMP가 로드되지 않음');
          addLog('❌ STOMP 라이브러리가 로드되지 않았습니다', 'error');
          resolve(false);
          return;
        }

        // SockJS와 STOMP를 사용한 WebSocket 연결 테스트
        const socket = new window.SockJS('/ws/fraud-monitor');
        const stompClient = window.Stomp.over(socket);
        
        stompClient.debug = false;
        
        const timeout = setTimeout(() => {
          updateTestResult('websocket', 'error', '연결 시간 초과');
          addLog('❌ WebSocket 연결 시간 초과', 'error');
          resolve(false);
        }, 5000);

        stompClient.connect({}, (frame) => {
          clearTimeout(timeout);
          updateTestResult('websocket', 'success', 'WebSocket 연결 성공');
          addLog('✅ WebSocket 연결 성공', 'success');
          stompClient.disconnect();
          resolve(true);
        }, (error) => {
          clearTimeout(timeout);
          updateTestResult('websocket', 'error', error.toString());
          addLog(`❌ WebSocket 연결 실패: ${error}`, 'error');
          resolve(false);
        });
      } catch (error) {
        updateTestResult('websocket', 'error', error.message);
        addLog(`❌ WebSocket 테스트 실패: ${error.message}`, 'error');
        resolve(false);
      }
    });
  };

  // 전체 테스트 실행
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults({});
    setTestLog([]);
    
    addLog('🚀 시스템 테스트 시작', 'info');
    
    // 사용자 로그인 확인 (경고만 표시하고 계속 진행)
    if (!user || !user.accessToken) {
      addLog('⚠️ 로그인되지 않음 - 일부 테스트가 실패할 수 있습니다.', 'warning');
      addLog('💡 로그인 후 다시 테스트하면 더 정확한 결과를 얻을 수 있습니다.', 'info');
    } else {
      addLog('✅ 사용자 로그인됨 - 전체 테스트 진행', 'success');
    }
    
    const tests = [
      { name: 'AI 서비스', fn: testAIService },
      { name: 'AI 모델', fn: testAIModel },
      { name: '통계 API', fn: testStatisticsAPI },
      { name: '거래 목록 API', fn: testTransactionsAPI },
      { name: '이상거래 탐지', fn: testFraudDetection },
      { name: 'WebSocket', fn: testWebSocket }
    ];

    let successCount = 0;
    for (const test of tests) {
      addLog(`\n📋 ${test.name} 테스트 실행 중...`, 'info');
      const result = await test.fn();
      if (result) successCount++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
    }

    addLog(`\n🎯 테스트 완료: ${successCount}/${tests.length} 성공`, 
      successCount === tests.length ? 'success' : 'warning');
    setIsRunning(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return styles.success;
      case 'error': return styles.error;
      case 'warning': return styles.warning;
      default: return styles.pending;
    }
  };

  return (
    <div className={styles.testContainer}>
      <div className={styles.header}>
        <h3>🧪 AI 이상거래 탐지 시스템 테스트</h3>
        <ButtonComponent 
          onClick={runAllTests} 
          disabled={isRunning}
          variant="primary"
          style={{ 
            touchAction: 'manipulation',
            minHeight: '48px' // 터치 최적화
          }}
        >
          {isRunning ? '테스트 실행 중...' : '전체 테스트 실행'}
        </ButtonComponent>
      </div>

      {/* 테스트 결과 */}
      <CardComponent title="테스트 결과" className={styles.resultsCard}>
        <div className={styles.resultsGrid}>
          {Object.entries(testResults).map(([testName, result]) => (
            <div key={testName} className={`${styles.resultItem} ${getStatusColor(result.status)}`}>
              <div className={styles.resultHeader}>
                <span className={styles.resultIcon}>{getStatusIcon(result.status)}</span>
                <span className={styles.resultName}>{testName}</span>
                <span className={styles.resultTime}>{result.timestamp}</span>
              </div>
              <div className={styles.resultDetails}>{result.details}</div>
            </div>
          ))}
        </div>
      </CardComponent>

      {/* 테스트 로그 */}
      <CardComponent title="테스트 로그" className={styles.logCard}>
        <div className={styles.logContainer}>
          {testLog.length === 0 ? (
            <p className={styles.noLogs}>테스트를 실행하면 로그가 표시됩니다.</p>
          ) : (
            testLog.map((log, index) => (
              <div key={index} className={`${styles.logItem} ${getStatusColor(log.type)}`}>
                <span className={styles.logTime}>[{log.timestamp}]</span>
                <span className={styles.logMessage}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </CardComponent>
    </div>
  );
};

export default SystemTest;
