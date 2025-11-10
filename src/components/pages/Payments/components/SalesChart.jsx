import React from 'react';
import styles from './SalesChart.module.css';

const SalesChart = ({ data, type = 'line', title }) => {
  // 데이터가 없을 때의 기본 처리
  if (!data || data.length === 0) {
    return (
      <div className={styles.chartContainer}>
        <div className={styles.noDataMessage}>
          <p>표시할 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 안전한 숫자 변환 함수
  const safeNumber = (value) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // 최대값 계산 (차트 스케일링용)
  const salesValues = data.map(item => safeNumber(item.sales || item.value || 0));
  const maxValue = salesValues.length > 0 ? Math.max(...salesValues) : 1;
  
  // 간단한 막대 차트 렌더링
  const renderBarChart = () => {
    return (
      <div className={styles.barChart}>
        {data.map((item, index) => {
          const salesValue = safeNumber(item.sales || item.value || 0);
          const height = maxValue > 0 ? (salesValue / maxValue) * 100 : 0;
          return (
            <div key={index} className={styles.barContainer}>
              <div 
                className={styles.bar}
                style={{ height: `${height}%` }}
                title={`${item.date || item.label}: ${salesValue}원`}
              />
              <div className={styles.barLabel}>
                {item.date ? item.date.split('-')[2] : item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 간단한 라인 차트 렌더링
  const renderLineChart = () => {
    return (
      <div className={styles.lineChart}>
        <svg viewBox="0 0 400 200" className={styles.lineSvg}>
          <polyline
            fill="none"
            stroke="#4facfe"
            strokeWidth="2"
            points={data.map((item, index) => {
              const x = (index / (data.length - 1)) * 380 + 10;
              const salesValue = safeNumber(item.sales || item.value || 0);
              const y = 190 - (maxValue > 0 ? (salesValue / maxValue) * 180 : 0);
              return `${x},${y}`;
            }).join(' ')}
          />
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 380 + 10;
            const salesValue = safeNumber(item.sales || item.value || 0);
            const y = 190 - (maxValue > 0 ? (salesValue / maxValue) * 180 : 0);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#4facfe"
                className={styles.dataPoint}
              />
            );
          })}
        </svg>
      </div>
    );
  };

  // 파이 차트 렌더링
  const renderPieChart = () => {
    let cumulativePercentage = 0;
    const colors = ['#4facfe', '#00d4aa', '#ff6b6b', '#ffd93d', '#6c5ce7'];
    
    return (
      <div className={styles.pieChart}>
        <svg viewBox="0 0 200 200" className={styles.pieSvg}>
          {data.map((item, index) => {
            const salesValue = safeNumber(item.sales || item.value || 0);
            const totalSales = data.reduce((sum, d) => sum + safeNumber(d.sales || d.value || 0), 0);
            const percentage = item.percentage || (totalSales > 0 ? (salesValue / totalSales) * 100 : 0);
            const startAngle = (cumulativePercentage / 100) * 360;
            const endAngle = ((cumulativePercentage + percentage) / 100) * 360;
            cumulativePercentage += percentage;
            
            const startAngleRad = (startAngle - 90) * (Math.PI / 180);
            const endAngleRad = (endAngle - 90) * (Math.PI / 180);
            
            const x1 = 100 + 80 * Math.cos(startAngleRad);
            const y1 = 100 + 80 * Math.sin(startAngleRad);
            const x2 = 100 + 80 * Math.cos(endAngleRad);
            const y2 = 100 + 80 * Math.sin(endAngleRad);
            
            const largeArcFlag = percentage > 50 ? 1 : 0;
            
            const pathData = [
              `M 100 100`,
              `L ${x1} ${y1}`,
              `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            return (
              <path
                key={index}
                d={pathData}
                fill={colors[index % colors.length]}
                className={styles.pieSlice}
              />
            );
          })}
        </svg>
        <div className={styles.pieLegend}>
          {data.map((item, index) => (
            <div key={index} className={styles.legendItem}>
              <div 
                className={styles.legendColor}
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className={styles.legendLabel}>
                {item.name || item.label}: {item.percentage || (totalSales > 0 ? (salesValue / totalSales) * 100 : 0).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.chartContainer}>
      {title && <h4 className={styles.chartTitle}>{title}</h4>}
      <div className={styles.chartContent}>
        {type === 'bar' && renderBarChart()}
        {type === 'line' && renderLineChart()}
        {type === 'pie' && renderPieChart()}
      </div>
    </div>
  );
};

export default SalesChart;
