import React from 'react';
import styles from './MonitorCard.module.css';

const MonitorCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  status = 'normal',
  loading = false,
  trend = null,
  trendValue = null
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className={styles.monitorCard}>
        <div className={styles.skeleton}></div>
      </div>
    );
  }

  return (
    <div className={styles.monitorCard}>
      <div className={styles.header}>
        <div className={styles.icon} style={{ color: getStatusColor() }}>
          {icon}
        </div>
        <div className={styles.title}>{title}</div>
      </div>
      
      <div className={styles.value} style={{ color: getStatusColor() }}>
        {value}
      </div>
      
      {subtitle && (
        <div className={styles.subtitle}>{subtitle}</div>
      )}
      
      {trend && trendValue && (
        <div className={styles.trend}>
          <span className={styles.trendIcon}>{getTrendIcon()}</span>
          <span className={styles.trendText}>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default MonitorCard;
