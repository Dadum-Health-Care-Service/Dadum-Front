import React, { useState, useEffect, useRef } from 'react';
import CardComponent from '../../../common/CardComponent';
import ButtonComponent from '../../../common/ButtonComponent';
import MonitorCard from './MonitorCard';
import styles from './RealTimeMonitor.module.css';

const RealTimeMonitor = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [monitoringStats, setMonitoringStats] = useState({
    totalTransactions: 0,
    anomalyCount: 0,
    lastAlert: null,
    connectionTime: null
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5초
  const wsRef = useRef(null);
  const stompClientRef = useRef(null);
  const intervalRef = useRef(null);

  // WebSocket 연결 (SockJS + STOMP)
  const connectWebSocket = () => {
    try {
      // SockJS와 STOMP가 로드되었는지 확인
      if (typeof window.SockJS === 'undefined') {
        console.error('SockJS가 로드되지 않았습니다. 폴링 모드로 전환합니다.');
        startPolling();
        return;
      }
      
      if (typeof window.Stomp === 'undefined') {
        console.error('STOMP가 로드되지 않았습니다. 폴링 모드로 전환합니다.');
        startPolling();
        return;
      }

      const socket = new window.SockJS('http://localhost:8080/ws/fraud-monitor');
      const stompClient = window.Stomp.over(socket);
      
      stompClient.debug = false; // 디버그 로그 비활성화
      
      stompClient.connect({}, (frame) => {
        console.log('WebSocket 연결됨:', frame);
        setIsConnected(true);
        setMonitoringStats(prev => ({
          ...prev,
          connectionTime: new Date().toLocaleString()
        }));
        
        // 이상거래 알림 구독
        stompClient.subscribe('/topic/fraud-alerts', (message) => {
          try {
            const data = JSON.parse(message.body);
            handleRealtimeData(data);
          } catch (e) {
            console.error('WebSocket 메시지 파싱 오류:', e);
          }
        });
        
        // 통계 업데이트 구독
        stompClient.subscribe('/topic/stats-updates', (message) => {
          try {
            const data = JSON.parse(message.body);
            handleRealtimeData(data);
          } catch (e) {
            console.error('통계 업데이트 파싱 오류:', e);
          }
        });
        
        // 시스템 상태 구독
        stompClient.subscribe('/topic/system-status', (message) => {
          try {
            const data = JSON.parse(message.body);
            handleRealtimeData(data);
          } catch (e) {
            console.error('시스템 상태 파싱 오류:', e);
          }
        });
        
        // 연결 확인 메시지 전송
        stompClient.send('/app/fraud-monitor/connect', {}, JSON.stringify({
          type: 'connection_request',
          timestamp: new Date().toISOString()
        }));
        
      }, (error) => {
        console.error('WebSocket 연결 실패:', error);
        setIsConnected(false);
        // 자동 재연결 시도
        if (autoRefresh) {
          setTimeout(connectWebSocket, 3000);
        }
      });
      
      stompClientRef.current = stompClient;
      
    } catch (error) {
      console.error('WebSocket 연결 실패:', error);
      setIsConnected(false);
    }
  };

  // 실시간 데이터 처리
  const handleRealtimeData = (data) => {
    if (data.type === 'fraud_alert') {
      const newAlert = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        transactionId: data.transactionId,
        userId: data.userId,
        amount: data.amount,
        riskScore: data.riskScore,
        message: data.message,
        severity: data.riskScore >= 80 ? 'high' : data.riskScore >= 60 ? 'medium' : 'low'
      };
      
      setAlerts(prev => [newAlert, ...prev.slice(0, 49)]); // 최대 50개 유지
      
      // 브라우저 알림
      if (Notification.permission === 'granted') {
        new Notification('🚨 이상거래 감지!', {
          body: `거래 ID: ${data.transactionId}\n위험도: ${data.riskScore}%`,
          icon: '/img/userAvatar.png',
          tag: 'fraud-alert'
        });
      }
    } else if (data.type === 'stats_update') {
      setMonitoringStats(prev => ({
        ...prev,
        totalTransactions: data.totalTransactions || prev.totalTransactions,
        anomalyCount: data.anomalyCount || prev.anomalyCount,
        lastAlert: data.lastAlert || prev.lastAlert
      }));
    }
  };

  // 폴링 방식으로 데이터 업데이트 (WebSocket 대안)
  const startPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        // 통계 데이터 업데이트
        const statsResponse = await fetch('/api/ai/statistics');
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setMonitoringStats(prev => ({
            ...prev,
            totalTransactions: stats.totalTransactions || 0,
            anomalyCount: stats.anomalyCount || 0
          }));
        }

        // 최근 거래 데이터 확인
        const transactionsResponse = await fetch('/api/ai/transactions?size=5');
        if (transactionsResponse.ok) {
          const data = await transactionsResponse.json();
          const recentTransactions = data.transactions || [];
          
          // 새로운 이상거래 확인
          recentTransactions.forEach(transaction => {
            if (transaction.isAnomaly && transaction.createdAt) {
              const alertTime = new Date(transaction.createdAt);
              const now = new Date();
              const timeDiff = now - alertTime;
              
              // 1분 이내의 새로운 이상거래만 알림
              if (timeDiff < 60000) {
                const newAlert = {
                  id: transaction.id,
                  timestamp: alertTime.toLocaleString(),
                  transactionId: transaction.transactionId,
                  userId: transaction.userId,
                  amount: transaction.amount,
                  riskScore: transaction.riskScore,
                  message: transaction.recommendation || '이상거래가 감지되었습니다.',
                  severity: transaction.riskScore >= 80 ? 'high' : 
                           transaction.riskScore >= 60 ? 'medium' : 'low'
                };
                
                setAlerts(prev => {
                  const exists = prev.some(alert => alert.id === newAlert.id);
                  if (!exists) {
                    return [newAlert, ...prev.slice(0, 49)];
                  }
                  return prev;
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('폴링 데이터 업데이트 실패:', error);
      }
    }, refreshInterval);
  };

  // 알림 권한 요청
  const requestmission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('알림 권한이 허용되었습니다.');
      }
    }
  };

  // 연결 시작/중지
  const toggleConnection = () => {
    if (isConnected) {
      // 연결 중지
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setIsConnected(false);
    } else {
      // 연결 시작
      if (autoRefresh) {
        startPolling();
      } else {
        connectWebSocket();
      }
      setIsConnected(true);
    }
  };

  // 알림 지우기
  const clearAlerts = () => {
    setAlerts([]);
  };

  // 특정 알림 지우기
  const removeAlert = (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 알림 권한 요청
    requestNotificationPermission();

    // 자동 시작
    if (autoRefresh) {
      startPolling();
      setIsConnected(true);
    }

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return styles.highSeverity;
      case 'medium': return styles.mediumSeverity;
      case 'low': return styles.lowSeverity;
      default: return styles.lowSeverity;
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '🔍';
      default: return '🔍';
    }
  };

  return (
    <div className={styles.monitorContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>⚡ 실시간 이상거래 모니터링</h2>
            <p className={styles.subtitle}>AI 기반 실시간 이상거래 탐지 및 알림 시스템</p>
          </div>
          <div className={styles.controls}>
            <div className={styles.connectionStatus}>
              <span className={`${styles.statusIndicator} ${isConnected ? styles.connected : styles.disconnected}`}>
                {isConnected ? '🟢 연결됨' : '🔴 연결 끊김'}
              </span>
            </div>
            <ButtonComponent 
              onClick={toggleConnection}
              variant={isConnected ? 'secondary' : 'primary'}
              size="small"
            >
              {isConnected ? '모니터링 중지' : '모니터링 시작'}
            </ButtonComponent>
          </div>
        </div>
      </div>

      {/* 모니터링 설정 */}
      <CardComponent title="모니터링 설정" className={styles.settingsCard}>
        <div className={styles.settingsGrid}>
          <div className={styles.settingItem}>
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                style={{ 
                  width: '18px', 
                  height: '18px',
                  touchAction: 'manipulation'
                }}
              />
              자동 새로고침
            </label>
          </div>
          <div className={styles.settingItem}>
            <label>
              새로고침 간격:
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                disabled={!autoRefresh}
                style={{ 
                  fontSize: '16px', // iOS 줌 방지
                  touchAction: 'manipulation',
                  padding: '8px 12px'
                }}
              >
                <option value={1000}>1초</option>
                <option value={3000}>3초</option>
                <option value={5000}>5초</option>
                <option value={10000}>10초</option>
              </select>
            </label>
          </div>
          <div className={styles.settingItem}>
            <ButtonComponent onClick={requestNotificationPermission} size="small">
              알림 권한 설정
            </ButtonComponent>
          </div>
        </div>
      </CardComponent>

      {/* 개선된 모니터링 통계 */}
      <div className={styles.statsGrid}>
        <MonitorCard
          title="총 거래 수"
          value={monitoringStats.totalTransactions.toLocaleString()}
          subtitle="실시간 모니터링 중인 거래"
          icon="💳"
          status="info"
          trend="up"
          trendValue="+5분"
        />
        
        <MonitorCard
          title="이상거래 탐지"
          value={monitoringStats.anomalyCount.toLocaleString()}
          subtitle="AI가 탐지한 이상거래"
          icon="🚨"
          status={monitoringStats.anomalyCount > 0 ? "warning" : "success"}
          trend="up"
          trendValue="실시간"
        />
        
        <MonitorCard
          title="마지막 알림"
          value={monitoringStats.lastAlert || '없음'}
          subtitle="최근 이상거래 알림 시간"
          icon="🔔"
          status={monitoringStats.lastAlert ? "warning" : "normal"}
        />
        
        <MonitorCard
          title="연결 상태"
          value={isConnected ? '연결됨' : '연결 안됨'}
          subtitle={isConnected ? 
            `연결 시간: ${monitoringStats.connectionTime || '방금 전'}` : 
            'WebSocket 연결 필요'
          }
          icon={isConnected ? "🟢" : "🔴"}
          status={isConnected ? "success" : "error"}
        />
      </div>

      {/* 실시간 알림 목록 */}
      <CardComponent 
        title={`실시간 알림 (${alerts.length}개)`}
        className={styles.alertsCard}
      >
        <div className={styles.alertsHeader}>
          <ButtonComponent 
            onClick={clearAlerts}
            variant="secondary"
            size="small"
            disabled={alerts.length === 0}
          >
            모든 알림 지우기
          </ButtonComponent>
        </div>
        
        <div className={styles.alertsList}>
          {alerts.length === 0 ? (
            <div className={styles.noAlerts}>
              <p>현재 알림이 없습니다.</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`${styles.alertItem} ${getSeverityColor(alert.severity)}`}>
                <div className={styles.alertHeader}>
                  <span className={styles.alertIcon}>
                    {getSeverityIcon(alert.severity)}
                  </span>
                  <span className={styles.alertTime}>{alert.timestamp}</span>
                  <button 
                    onClick={() => removeAlert(alert.id)}
                    className={styles.removeButton}
                  >
                    ✕
                  </button>
                </div>
                <div className={styles.alertContent}>
                  <div className={styles.alertTitle}>
                    이상거래 감지: {alert.transactionId}
                  </div>
                  <div className={styles.alertDetails}>
                    <div>사용자: {alert.userId}</div>
                    <div>금액: {alert.amount?.toLocaleString()}원</div>
                    <div>위험도: {alert.riskScore}%</div>
                  </div>
                  <div className={styles.alertMessage}>
                    {alert.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardComponent>
    </div>
  );
};

export default RealTimeMonitor;
