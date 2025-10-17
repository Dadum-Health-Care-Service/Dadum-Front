import React, { useState, useEffect, useContext } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import CardComponent from '../../../common/CardComponent';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { useApi } from '../../../../utils/api/useApi';
import { AuthContext } from '../../../../context/AuthContext';
import styles from './FraudStatistics.module.css';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const FraudStatistics = () => {
  const { GET } = useApi();
  const { user } = useContext(AuthContext);
  const [statistics, setStatistics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d

  // 통계 데이터 로드
  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('통계 데이터 로드 시작...');
      console.log('사용자 상태:', user ? '로그인됨' : '로그인 안됨');
      
      const response = await GET('/ai/statistics', {}, true, 'main');
      console.log('통계 API 응답:', response);
      
      if (response && response.data) {
        console.log('통계 데이터:', response.data);
        setStatistics(response.data);
      } else {
        throw new Error('통계 데이터를 가져올 수 없습니다');
      }
    } catch (e) {
      console.error('통계 데이터 로드 실패:', e);
      setError(`통계 데이터 로드 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 거래 데이터 로드
  const loadTransactions = async () => {
    try {
      console.log('거래 데이터 로드 시작...');
      console.log('사용자 상태:', user ? '로그인됨' : '로그인 안됨');
      
      const response = await GET('/ai/transactions?size=100', {}, true, 'main');
      console.log('거래 API 응답:', response);
      
      if (response && response.data) {
        console.log('거래 데이터:', response.data);
        setTransactions(response.data.transactions || []);
      } else {
        console.log('거래 데이터 없음');
        setTransactions([]);
      }
    } catch (e) {
      console.error('거래 데이터 로드 실패:', e);
      setTransactions([]);
    }
  };

  useEffect(() => {
    console.log('FraudStatistics 컴포넌트 마운트됨');
    console.log('사용자 상태:', user ? '로그인됨' : '로그인 안됨');
    loadStatistics();
    loadTransactions();
  }, [user]);

  // 전체 데이터 새로고침
  const refreshAllData = async () => {
    console.log('데이터 새로고침 시작...');
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        loadStatistics(),
        loadTransactions()
      ]);
    } catch (e) {
      console.error('데이터 새로고침 실패:', e);
      setError('데이터 새로고침에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 시간대별 거래 차트 데이터
  const getHourlyChartData = () => {
    if (!statistics?.transactionsByHour || statistics.transactionsByHour.length === 0) {
      // 백엔드 데이터가 없을 때만 더미 데이터 생성
      const labels = Array.from({ length: 24 }, (_, i) => `${i}시`);
      const data = Array.from({ length: 24 }, (_, i) => {
        // 실제적인 패턴을 가진 더미 데이터
        if (i >= 9 && i <= 18) return Math.floor(Math.random() * 100) + 50; // 업무시간: 50-150건
        if (i >= 19 && i <= 22) return Math.floor(Math.random() * 60) + 20; // 저녁시간: 20-80건
        return Math.floor(Math.random() * 20); // 새벽/밤시간: 0-20건
      });

      return {
        labels,
        datasets: [
          {
            label: '거래 수',
            data,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 4,
          },
        ],
      };
    }

    const hourlyData = statistics.transactionsByHour;
    const labels = Array.from({ length: 24 }, (_, i) => `${i}시`);
    const data = Array.from({ length: 24 }, (_, i) => {
      // 백엔드 데이터 형식: [[hour, count], [hour, count], ...]
      const hourData = hourlyData.find(h => h[0] === i);
      return hourData ? hourData[1] : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: '거래 수',
          data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  };

  // 요일별 거래 차트 데이터
  const getDailyChartData = () => {
    if (!statistics?.transactionsByDayOfWeek || statistics.transactionsByDayOfWeek.length === 0) {
      // 백엔드 데이터가 없을 때만 더미 데이터 생성
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const data = [25, 85, 78, 92, 75, 58, 40]; // 주말은 낮고, 평일은 높은 패턴 (더 큰 값)

      return {
        labels: dayNames,
        datasets: [
          {
            label: '거래 수',
            data,
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',   // 일요일 - 빨간색
              'rgba(59, 130, 246, 0.8)',  // 월요일 - 파란색
              'rgba(16, 185, 129, 0.8)',  // 화요일 - 초록색
              'rgba(245, 158, 11, 0.8)',  // 수요일 - 노란색
              'rgba(139, 92, 246, 0.8)',  // 목요일 - 보라색
              'rgba(236, 72, 153, 0.8)',  // 금요일 - 핑크색
              'rgba(107, 114, 128, 0.8)', // 토요일 - 회색
            ],
            borderColor: [
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(236, 72, 153, 1)',
              'rgba(107, 114, 128, 1)',
            ],
            borderWidth: 2,
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      };
    }

    const dailyData = statistics.transactionsByDayOfWeek;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const labels = dayNames;
    const data = Array.from({ length: 7 }, (_, i) => {
      // 백엔드 데이터 형식: [[dayOfWeek, count], [dayOfWeek, count], ...]
      const dayData = dailyData.find(d => d[0] === i);
      return dayData ? dayData[1] : 0;
    });

    return {
      labels,
      datasets: [
        {
          label: '거래 수',
          data,
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(107, 114, 128, 0.8)',
          ],
          borderColor: [
            'rgba(239, 68, 68, 1)',
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(107, 114, 128, 1)',
          ],
          borderWidth: 2,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    };
  };

  // 위험도 분포 도넛 차트 데이터
  const getRiskDistributionData = () => {
    if (!statistics?.riskDistribution || statistics.riskDistribution.length === 0) {
      // 백엔드 데이터가 없을 때만 더미 데이터 생성
      const labels = ['높은 위험', '중간 위험', '낮은 위험', '안전'];
      const data = [18, 35, 55, 92]; // 안전한 거래가 대부분 (더 큰 값)

      return {
        labels,
        datasets: [
          {
            data,
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',   // 높은 위험 - 빨간색
              'rgba(245, 158, 11, 0.8)',  // 중간 위험 - 노란색
              'rgba(59, 130, 246, 0.8)', // 낮은 위험 - 파란색
              'rgba(16, 185, 129, 0.8)',  // 안전 - 초록색
            ],
            borderColor: [
              'rgba(239, 68, 68, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
            ],
            borderWidth: 2,
          },
        ],
      };
    }

    const riskData = statistics.riskDistribution;
    // 백엔드 데이터 형식: [["LOW",15],["SAFE",8]]
    const labels = riskData.map(r => {
      const level = r[0];
      // 영어 레벨을 한국어로 변환
      const levelMap = {
        'HIGH': '높은 위험',
        'MEDIUM': '중간 위험', 
        'LOW': '낮은 위험',
        'SAFE': '안전'
      };
      return levelMap[level] || level;
    });
    const data = riskData.map(r => r[1]);   // 두 번째 요소가 개수
    const colors = {
      'HIGH': 'rgba(239, 68, 68, 0.8)',
      'MEDIUM': 'rgba(245, 158, 11, 0.8)',
      'LOW': 'rgba(59, 130, 246, 0.8)',
      'SAFE': 'rgba(16, 185, 129, 0.8)',
    };

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: riskData.map(r => {
            const level = r[0];
            return colors[level] || 'rgba(199, 199, 199, 0.8)';
          }),
          borderColor: riskData.map(r => {
            const level = r[0];
            return colors[level]?.replace('0.8', '1') || 'rgba(199, 199, 199, 1)';
          }),
          borderWidth: 2,
        },
      ],
    };
  };

  // 개선된 차트 옵션
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}건`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: '시간',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: function(context) {
          // 데이터의 최대값을 찾아서 10% 여유를 두고 설정
          const data = context.chart.data.datasets[0].data;
          const maxValue = Math.max(...data);
          return Math.ceil(maxValue * 1.1);
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return Math.round(value) + '건';
          },
          stepSize: function(context) {
            const maxValue = Math.max(...context.chart.data.datasets[0].data);
            return Math.ceil(maxValue / 5); // 5개 구간으로 나누기
          },
        },
        title: {
          display: true,
          text: '거래 건수',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  };

  // 요일별 차트 전용 옵션
  const dailyChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: function(context) {
            return context[0].label;
          },
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}건`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
        title: {
          display: true,
          text: '요일',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
      y: {
        beginAtZero: true,
        min: 0,
        max: function(context) {
          // 데이터의 최대값을 찾아서 10% 여유를 두고 설정
          const data = context.chart.data.datasets[0].data;
          const maxValue = Math.max(...data);
          return Math.ceil(maxValue * 1.1);
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function(value) {
            return Math.round(value) + '건';
          },
          stepSize: function(context) {
            const maxValue = Math.max(...context.chart.data.datasets[0].data);
            return Math.ceil(maxValue / 5); // 5개 구간으로 나누기
          },
        },
        title: {
          display: true,
          text: '거래 건수',
          font: {
            size: 12,
            weight: 'bold',
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed}건 (${percentage}%)`;
          },
        },
      },
    },
  };

  // 로그인하지 않은 사용자 처리
  if (!user || !user.accessToken) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>로그인이 필요합니다. 로그인 후 다시 시도해주세요.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>통계 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={refreshAllData} className={styles.retryButton}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className={styles.statisticsContainer}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h2 className={styles.title}>📊 AI 이상거래 통계 대시보드</h2>
            <p className={styles.subtitle}>실시간 이상거래 탐지 현황과 AI 모델 성능을 확인하세요</p>
          </div>
          <div className={styles.controlsSection}>
            <div className={styles.timeRangeSelector}>
              <label className={styles.timeLabel}>기간 선택</label>
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className={styles.timeSelect}
                style={{ 
                  fontSize: '16px', // iOS 줌 방지
                  touchAction: 'manipulation' // 터치 최적화
                }}
              >
                <option value="7d">최근 7일</option>
                <option value="30d">최근 30일</option>
                <option value="90d">최근 90일</option>
              </select>
            </div>
            <button 
              onClick={refreshAllData}
              className={styles.refreshButton}
              disabled={loading}
            >
              <span className={styles.refreshIcon}>🔄</span>
              {loading ? '새로고침 중...' : '최신 데이터 조회'}
            </button>
          </div>
        </div>
      </div>

      {/* 개선된 요약 카드들 */}
      <div className={styles.summaryCards}>
        <StatCard
          title="총 거래 수"
          value={statistics?.totalTransactions?.toLocaleString() || '0'}
          subtitle={statistics?.totalTransactions ? "실제 데이터" : "데모 데이터"}
          icon="💳"
          trend="up"
          trendValue="+12%"
          color="blue"
        />
        
        <StatCard
          title="이상거래 탐지"
          value={statistics?.anomalyCount?.toLocaleString() || '0'}
          subtitle="AI가 탐지한 이상거래"
          icon="🚨"
          trend="down"
          trendValue="-5%"
          color="red"
        />
        
        <StatCard
          title="정상 거래"
          value={statistics?.normalCount?.toLocaleString() || '0'}
          subtitle="검증된 정상 거래"
          icon="✅"
          trend="up"
          trendValue="+8%"
          color="green"
        />
        
        <StatCard
          title="평균 위험도"
          value={`${statistics?.averageRiskScore?.toFixed(1) || 0}%`}
          subtitle="AI 모델 성능"
          icon="🎯"
          trend="up"
          trendValue="+2.1%"
          color="orange"
        />
      </div>

      {/* 개선된 차트들 */}
      <div className={styles.chartsGrid}>
        <ChartCard 
          title="⏰ 시간대별 거래 현황" 
          description={`24시간 동안의 거래 패턴을 확인하세요. Y축은 거래 건수를 나타냅니다. ${statistics?.transactionsByHour ? '(실제 데이터)' : '(데모 데이터)'}`}
          loading={loading}
          error={error}
        >
          <Line data={getHourlyChartData()} options={chartOptions} />
        </ChartCard>

        <ChartCard 
          title="📅 요일별 거래 현황" 
          description={`요일별 거래량 분포를 확인하세요. Y축은 거래 건수를 나타냅니다. ${statistics?.transactionsByDayOfWeek ? '(실제 데이터)' : '(데모 데이터)'}`}
          loading={loading}
          error={error}
        >
          <Bar data={getDailyChartData()} options={dailyChartOptions} />
        </ChartCard>

        <ChartCard 
          title="🎯 위험도 분포" 
          description={`AI가 분석한 거래 위험도 분포입니다 ${statistics?.riskDistribution ? '(실제 데이터)' : '(데모 데이터)'}`}
          loading={loading}
          error={error}
        >
          <Doughnut data={getRiskDistributionData()} options={doughnutOptions} />
        </ChartCard>
      </div>

      {/* 최근 거래 목록 */}
      <CardComponent title="최근 거래 내역" className={styles.transactionListCard}>
        <div className={styles.transactionList}>
          {transactions.length === 0 ? (
            <p>거래 내역이 없습니다.</p>
          ) : (
            <div className={styles.transactionTable}>
              <div className={styles.tableHeader}>
                <div>거래 ID</div>
                <div>사용자</div>
                <div>금액</div>
                <div>위험도</div>
                <div>상태</div>
                <div>시간</div>
              </div>
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className={styles.tableRow}>
                  <div className={styles.transactionId}>{transaction.transactionId}</div>
                  <div>{transaction.userId}</div>
                  <div>{transaction.amount?.toLocaleString()}원</div>
                  <div className={styles.riskScore}>
                    <span 
                      className={`${styles.riskBadge} ${
                        transaction.riskScore >= 80 ? styles.highRisk :
                        transaction.riskScore >= 60 ? styles.mediumRisk :
                        transaction.riskScore >= 40 ? styles.lowRisk : styles.safeRisk
                      }`}
                    >
                      {transaction.riskScore?.toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.status}>
                    <span className={transaction.isAnomaly ? styles.anomaly : styles.normal}>
                      {transaction.isAnomaly ? '🚨 이상' : '✅ 정상'}
                    </span>
                  </div>
                  <div className={styles.timestamp}>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardComponent>
    </div>
  );
};

export default FraudStatistics;
