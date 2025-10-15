import React from 'react';
import CardComponent from '../../../common/CardComponent';
import styles from './ChartCard.module.css';

const ChartCard = ({ 
  title, 
  description, 
  children, 
  loading = false, 
  error = null,
  className = ''
}) => {
  if (loading) {
    return (
      <CardComponent title={title} className={`${styles.chartCard} ${className}`}>
        <div className={styles.chartContainer}>
          <div className={styles.loadingSkeleton}>
            <div className={styles.skeletonBar}></div>
            <div className={styles.skeletonBar}></div>
            <div className={styles.skeletonBar}></div>
            <div className={styles.skeletonBar}></div>
          </div>
        </div>
      </CardComponent>
    );
  }

  if (error) {
    return (
      <CardComponent title={title} className={`${styles.chartCard} ${className}`}>
        <div className={styles.chartContainer}>
          <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <p className={styles.errorMessage}>차트 데이터를 불러올 수 없습니다</p>
            <button className={styles.retryButton}>다시 시도</button>
          </div>
        </div>
      </CardComponent>
    );
  }

  return (
    <CardComponent title={title} className={`${styles.chartCard} ${className}`}>
      {description && (
        <div className={styles.chartDescription}>
          {description}
        </div>
      )}
      <div className={styles.chartContainer}>
        {children}
      </div>
    </CardComponent>
  );
};

export default ChartCard;
