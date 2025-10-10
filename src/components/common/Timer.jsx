import { useEffect, useRef, useState } from 'react';
import styles from './Timer.module.css';

export default function Timer({ hour = 0, minute = 0 }) {
  const [time, setTime] = useState(hour * 3600 + minute * 60);
  const [timeLeft, setTimeLeft] = useState(hour * 3600 + minute * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // 타이머 시작/정지 로직
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // 시간 포맷팅
  const formatTime = seconds => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 타이머 조작 핸들러
  const handleStart = () => {
    if (timeLeft > 0) setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  const handleInitiaize = () => {
    setIsRunning(false);
    setTimeLeft(time);
  };

  const handleAddMinute = () => {
    setTime(prev => prev + 60);
    setTimeLeft(prev => prev + 60);
  };

  const handleSubtractMinute = () => {
    setTime(prev => Math.max(prev - 60, 0));
    setTimeLeft(prev => Math.max(prev - 60, 0));
    if (timeLeft <= 60 && isRunning) {
      // 타이머가 0 되면 멈추기
      setIsRunning(false);
    }
  };

  return (
    <div className={styles['timer-wrapper']}>
      <div className={styles['timer-display']}>{formatTime(timeLeft)}</div>

      <div className={styles['controls-container']}>
        <div className={styles['controls']}>
          <button
            className={styles['time-control']}
            onClick={isRunning ? handlePause : handleStart}
            disabled={timeLeft === 0}
          >
            {isRunning ? <i class="fa-solid fa-pause"></i> : <i class="fa-solid fa-play"></i>}
          </button>
          <button
            className={styles['time-control']}
            onClick={handleInitiaize}
            disabled={!isRunning}
          >
            <i class="fa-solid fa-stop"></i>
          </button>
        </div>
        <div className={styles['addsub']}>
          <button className={styles['time-addsub']} onClick={handleAddMinute}>
            <i class="fa-solid fa-clock"></i> +1분
          </button>
          <button
            className={styles['time-addsub']}
            onClick={handleSubtractMinute}
            disabled={timeLeft < 60}
          >
            <i class="fa-solid fa-clock"></i> -1분
          </button>
        </div>
      </div>
    </div>
  );
}
