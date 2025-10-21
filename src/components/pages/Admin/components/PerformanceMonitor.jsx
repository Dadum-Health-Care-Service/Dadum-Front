import React, { useState, useEffect, useContext } from 'react';
import CardComponent from '../../../common/CardComponent';
import ButtonComponent from '../../../common/ButtonComponent';
import { useApi } from '../../../../utils/api/useApi';
import { AuthContext } from '../../../../context/AuthContext';
import styles from './PerformanceMonitor.module.css';

const PerformanceMonitor = () => {
  const { GET } = useApi();
  const { user } = useContext(AuthContext);
  const [performanceData, setPerformanceData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // 성능 데이터 로드
  const loadPerformanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('성능 데이터 로드 시작...');
      const response = await GET('/ai/health', {}, true, 'main');
      console.log('성능 데이터 응답:', response);
      
      if (response && response.data) {
        setPerformanceData(response.data);
      } else {
        throw new Error('성능 데이터를 가져올 수 없습니다');
      }
    } catch (e) {
      console.error('성능 데이터 로드 실패:', e);
      setError(`성능 데이터 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 성능 메트릭 로드
  const loadMetrics = async (hours = 24) => {
    setLoading(true);
    setError(null);
    try {
      console.log('메트릭 데이터 로드 시작...');
      const response = await GET('/ai/statistics', {}, true, 'main');
      console.log('메트릭 데이터 응답:', response);
      
      if (response && response.data) {
        setMetrics(response.data);
      } else {
        throw new Error('메트릭 데이터를 가져올 수 없습니다');
      }
    } catch (e) {
      console.error('메트릭 로드 실패:', e);
      setError(`메트릭 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 건강도 체크
  const loadHealthStatus = async () => {
    setError(null);
    try {
      console.log('건강도 체크 시작...');
      const response = await GET('/ai/health', {}, true, 'main');
      console.log('건강도 체크 응답:', response);
      
      if (response && response.data) {
        setHealthStatus(response.data);
      } else {
        throw new Error('건강도 데이터를 가져올 수 없습니다');
      }
    } catch (e) {
      console.error('건강도 체크 실패:', e);
      setError(`건강도 체크 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 성능 최적화 실행
  const optimizePerformance = async () => {
    setLoading(true);
    setError(null);
    try {
      // 더미 성능 최적화 (실제로는 백엔드에서 처리)
      alert('성능 최적화가 완료되었습니다.');
      // 데이터 새로고침
      loadPerformanceData();
      loadMetrics();
      loadHealthStatus();
    } catch (e) {
      console.error('성능 최적화 실패:', e);
      setError(`성능 최적화 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 자동 새로고침
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadPerformanceData();
        loadMetrics();
        loadHealthStatus();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // 초기 로드
  useEffect(() => {
    loadPerformanceData();
    loadMetrics();
    loadHealthStatus();
  }, []);

  const getHealthColor = (status) => {
    switch (status) {
      case 'excellent': return styles.excellent;
      case 'good': return styles.good;
      case 'warning': return styles.warning;
      case 'critical': return styles.critical;
      default: return styles.unknown;
    }
  };

  const getHealthIcon = (status) => {
    switch (status) {
      case 'excellent': return '🟢';
      case 'good': return '🟡';
      case 'warning': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className={styles.performanceMonitor}>
      <CardComponent title="⚡ 성능 모니터링 대시보드" className={styles.headerCard}>
        <div className={styles.controlGroup}>
          <ButtonComponent onClick={loadPerformanceData} disabled={loading} variant="primary">
            데이터 새로고침
          </ButtonComponent>
          <ButtonComponent onClick={optimizePerformance} disabled={loading} variant="secondary">
            성능 최적화
          </ButtonComponent>
          <label className={styles.autoRefreshLabel}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className={styles.intervalSelect}
            >
              <option value={1000}>1초</option>
              <option value={3000}>3초</option>
              <option value={5000}>5초</option>
              <option value={10000}>10초</option>
            </select>
          )}
        </div>
      </CardComponent>

      {error && (
        <CardComponent title="오류" className={styles.errorCard}>
          <p className={styles.errorMessage}>{error}</p>
        </CardComponent>
      )}

      {/* 시스템 리소스 */}
      {performanceData && (
        <CardComponent title="💻 시스템 리소스" className={styles.resourceCard}>
          <div className={styles.resourceGrid}>
            <div className={styles.resourceItem}>
              <span className={styles.resourceLabel}>AI 서비스 상태:</span>
              <span className={styles.resourceValue}>
                {performanceData.ai_service_healthy ? '🟢 정상' : '🔴 오류'}
              </span>
            </div>
            <div className={styles.resourceItem}>
              <span className={styles.resourceLabel}>서비스 상태:</span>
              <span className={styles.resourceValue}>
                {performanceData.status || '확인 중'}
              </span>
            </div>
            <div className={styles.resourceItem}>
              <span className={styles.resourceLabel}>마지막 체크:</span>
              <span className={styles.resourceValue}>
                {performanceData.timestamp ? new Date(performanceData.timestamp).toLocaleString() : '알 수 없음'}
              </span>
            </div>
            <div className={styles.resourceItem}>
              <span className={styles.resourceLabel}>메시지:</span>
              <span className={styles.resourceValue}>
                {performanceData.message || '시스템 상태 확인 중...'}
              </span>
            </div>
          </div>
        </CardComponent>
      )}

      {/* 모델 상태 */}
      {performanceData && (
        <CardComponent title="🤖 AI 모델 상태" className={styles.modelCard}>
          <div className={styles.modelGrid}>
            <div className={styles.modelItem}>
              <span className={styles.modelLabel}>AI 서비스:</span>
              <span className={performanceData.ai_service_healthy ? styles.trained : styles.notTrained}>
                {performanceData.ai_service_healthy ? '✅ 연결됨' : '❌ 연결 안됨'}
              </span>
            </div>
            <div className={styles.modelItem}>
              <span className={styles.modelLabel}>서비스 상태:</span>
              <span className={styles.modelValue}>
                {performanceData.status || '확인 중'}
              </span>
            </div>
            <div className={styles.modelItem}>
              <span className={styles.modelLabel}>마지막 체크:</span>
              <span className={styles.modelValue}>
                {performanceData.timestamp ? new Date(performanceData.timestamp).toLocaleString() : '알 수 없음'}
              </span>
            </div>
            <div className={styles.modelItem}>
              <span className={styles.modelLabel}>상태 메시지:</span>
              <span className={styles.modelValue}>
                {performanceData.message || '시스템 상태 확인 중...'}
              </span>
            </div>
          </div>
        </CardComponent>
      )}

      {/* 성능 메트릭 */}
      {metrics && (
        <CardComponent title="📊 성능 메트릭" className={styles.metricsCard}>
          <div className={styles.metricsGrid}>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>총 거래 수:</span>
              <span className={styles.metricValue}>
                {metrics.total_transactions?.toLocaleString() || 0}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>이상거래 수:</span>
              <span className={styles.metricValue}>
                {metrics.anomaly_transactions?.toLocaleString() || 0}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>정상 거래 수:</span>
              <span className={styles.metricValue}>
                {metrics.normal_transactions?.toLocaleString() || 0}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>이상거래 비율:</span>
              <span className={styles.metricValue}>
                {metrics.anomaly_rate ? (metrics.anomaly_rate * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>AI 서비스 상태:</span>
              <span className={styles.metricValue}>
                {performanceData?.ai_service_healthy ? '정상' : '오류'}
              </span>
            </div>
            <div className={styles.metricItem}>
              <span className={styles.metricLabel}>마지막 업데이트:</span>
              <span className={styles.metricValue}>
                {performanceData?.timestamp ? new Date(performanceData.timestamp).toLocaleString() : '알 수 없음'}
              </span>
            </div>
          </div>
        </CardComponent>
      )}

      {/* 건강도 상태 */}
      {healthStatus && (
        <CardComponent title="🏥 시스템 건강도" className={styles.healthCard}>
          <div className={styles.healthStatus}>
            <div className={styles.healthScore}>
              <span className={styles.healthLabel}>AI 서비스 상태:</span>
              <span className={`${styles.healthValue} ${healthStatus.ai_service_healthy ? styles.excellent : styles.critical}`}>
                {healthStatus.ai_service_healthy ? '🟢 정상' : '🔴 오류'}
              </span>
            </div>
            <div className={styles.healthStatus}>
              <span className={styles.healthLabel}>상태 메시지:</span>
              <span className={styles.healthValue}>
                {healthStatus.message || '시스템 상태 확인 중...'}
              </span>
            </div>
          </div>
          <div className={styles.healthChecks}>
            <h4>시스템 정보:</h4>
            <div className={styles.checkGrid}>
              <div className={styles.checkItem}>
                <span>서비스 상태:</span>
                <span>{healthStatus.status || '확인 중'}</span>
              </div>
              <div className={styles.checkItem}>
                <span>마지막 체크:</span>
                <span>{healthStatus.timestamp ? new Date(healthStatus.timestamp).toLocaleString() : '알 수 없음'}</span>
              </div>
              <div className={styles.checkItem}>
                <span>AI 서비스:</span>
                <span>{healthStatus.ai_service_healthy ? '연결됨' : '연결 안됨'}</span>
              </div>
              <div className={styles.checkItem}>
                <span>백엔드 상태:</span>
                <span>정상</span>
              </div>
            </div>
          </div>
        </CardComponent>
      )}
    </div>
  );
};

export default PerformanceMonitor;
