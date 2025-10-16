import styles from './RadialGradientSpinner.module.css';

export default function RadialGradientSpinner({ isMobile, isText }) {
  return (
    <div className={styles['spinner-container']}>
      <div className={styles['spinner-title']}>
        {isText && (
          <h3>
            <span className={styles['spinner-span']}>로딩 </span>중 입니다...
          </h3>
        )}
      </div>
      <div className={styles['spinner-wrapper']}>
        <div className={styles['spinner']} />
      </div>
    </div>
  );
}
