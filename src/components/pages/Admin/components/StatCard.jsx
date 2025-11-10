import React from 'react';
import styles from './StatCard.module.css';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = 'blue',
  loading = false 
}) => {
  const getTrendIcon = () => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (trend === 'up') return '#10b981';
    if (trend === 'down') return '#ef4444';
    return '#6b7280';
  };

  if (loading) {
    return (
      <div className={`${styles.statCard} ${styles.loading}`}>
        <div className={styles.skeleton}></div>
      </div>
    );
  }

  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.header}>
        <div className={styles.icon}>{icon}</div>
        <div className={styles.title}>{title}</div>
      </div>
      
      <div className={styles.value}>{value}</div>
      
      {subtitle && (
        <div className={styles.subtitle}>{subtitle}</div>
      )}
      
      {trend && trendValue && (
        <div className={styles.trend} style={{ color: getTrendColor() }}>
          <span className={styles.trendIcon}>{getTrendIcon()}</span>
          <span className={styles.trendText}>{trendValue}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
