/**
 * 운동 알림 모듈
 * 
 * 사용법:
 * 1. 이 파일을 프로젝트에 복사
 * 2. WorkoutNotificationModule을 import하여 사용
 * 3. 컴포넌트에서 <WorkoutNotificationModule /> 추가
 * 
 * 기능:
 * - 운동 간격 계산 및 알림
 * - 팝업으로 운동 권장 메시지 표시
 * - 챗봇과 연동된 자동 질문 생성
 */

import React, { useState, useEffect } from 'react';

// ===== 더미 운동 데이터 =====
const dummyWorkoutData = {
  chest: [
    { date: '2025-01-15', exercise: '벤치프레스', sets: 3, reps: 10, weight: 80 },
    { date: '2025-01-12', exercise: '인클라인 덤벨프레스', sets: 3, reps: 12, weight: 25 },
    { date: '2025-01-08', exercise: '체스트프레스', sets: 3, reps: 15, weight: 60 }
  ],
  back: [
    { date: '2025-01-16', exercise: '데드리프트', sets: 3, reps: 8, weight: 120 },
    { date: '2025-01-13', exercise: '랫풀다운', sets: 3, reps: 12, weight: 70 },
    { date: '2025-01-09', exercise: '로우', sets: 3, reps: 15, weight: 50 }
  ],
  legs: [
    { date: '2025-01-14', exercise: '스쿼트', sets: 4, reps: 12, weight: 100 },
    { date: '2025-01-11', exercise: '레그프레스', sets: 3, reps: 15, weight: 80 },
    { date: '2025-01-07', exercise: '런지', sets: 3, reps: 12, weight: 40 }
  ],
  shoulders: [
    { date: '2025-01-17', exercise: '오버헤드프레스', sets: 3, reps: 10, weight: 40 },
    { date: '2025-01-10', exercise: '사이드레터럴레이즈', sets: 3, reps: 15, weight: 15 },
    { date: '2025-01-06', exercise: '프론트레이즈', sets: 3, reps: 12, weight: 12 }
  ],
  arms: [
    { date: '2025-01-18', exercise: '바이셉컬', sets: 3, reps: 12, weight: 20 },
    { date: '2025-01-15', exercise: '트라이셉 딥스', sets: 3, reps: 10, weight: 0 },
    { date: '2025-01-11', exercise: '해머컬', sets: 3, reps: 15, weight: 18 }
  ]
};

const workoutPartNames = {
  chest: '가슴',
  back: '등',
  legs: '하체',
  shoulders: '어깨',
  arms: '팔'
};

// ===== 유틸리티 함수들 =====
const calculateWorkoutGap = (workoutPart) => {
  const workouts = dummyWorkoutData[workoutPart];
  if (!workouts || workouts.length === 0) return null;
  
  const latestWorkout = workouts[0];
  const latestDate = new Date(latestWorkout.date);
  const today = new Date();
  
  const diffTime = today - latestDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return {
    part: workoutPartNames[workoutPart],
    daysAgo: diffDays,
    lastExercise: latestWorkout.exercise,
    lastDate: latestWorkout.date
  };
};

const getAllWorkoutGaps = () => {
  const gaps = [];
  
  Object.keys(dummyWorkoutData).forEach(part => {
    const gap = calculateWorkoutGap(part);
    if (gap) {
      gaps.push(gap);
    }
  });
  
  return gaps.sort((a, b) => b.daysAgo - a.daysAgo);
};

const generateWorkoutReminder = () => {
  const gaps = getAllWorkoutGaps();
  const reminders = [];
  
  gaps.forEach(gap => {
    if (gap.daysAgo >= 3) {
      let message = '';
      if (gap.daysAgo >= 7) {
        message = `💪 ${gap.part}운동을 ${gap.daysAgo}일 동안 하지 않았어요! 오늘 ${gap.part}운동 해보시는 건 어때요?`;
      } else if (gap.daysAgo >= 5) {
        message = `⏰ ${gap.part}운동한 지 ${gap.daysAgo}일이 지났습니다. ${gap.part} 루틴을 계획해보세요!`;
      } else {
        message = `📅 ${gap.part}운동한 지 ${gap.daysAgo}일이 지났습니다. 언제 다시 하실 예정인가요?`;
      }
      
      reminders.push({
        part: gap.part,
        daysAgo: gap.daysAgo,
        message: message,
        lastExercise: gap.lastExercise,
        lastDate: gap.lastDate
      });
    }
  });
  
  return reminders;
};

// ===== 알림 아이콘 컴포넌트 =====
const WorkoutNotificationIcon = ({ onClick, isVisible }) => {
  const [hasReminders, setHasReminders] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  useEffect(() => {
    const reminders = generateWorkoutReminder();
    setHasReminders(reminders.length > 0);
    setReminderCount(reminders.length);
  }, []);

  if (!hasReminders || !isVisible) return null;

  return (
    <div 
      className="workout-notification-icon"
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '90px',
        width: '60px',
        height: '60px',
        background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0, 123, 255, 0.4)',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        border: '3px solid white'
      }}
    >
      <div style={{ fontSize: '24px' }}>🔔</div>
      {reminderCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          background: '#dc3545',
          color: 'white',
          borderRadius: '50%',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid white'
        }}>
          {reminderCount}
        </div>
      )}
    </div>
  );
};

// ===== 팝업 컴포넌트 =====
const WorkoutReminderPopup = ({ isVisible, onClose, onChatbotOpen }) => {
  const [reminders, setReminders] = useState([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);

  useEffect(() => {
    if (isVisible) {
      const workoutReminders = generateWorkoutReminder();
      setReminders(workoutReminders);
      setCurrentReminderIndex(0);
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentReminderIndex < reminders.length - 1) {
      setCurrentReminderIndex(currentReminderIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentReminderIndex > 0) {
      setCurrentReminderIndex(currentReminderIndex - 1);
    }
  };

  const handleChatbotOpen = () => {
    onClose();
    onChatbotOpen();
  };

  if (!isVisible || reminders.length === 0) return null;

  const currentReminder = reminders[currentReminderIndex];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        borderRadius: '20px',
        maxWidth: '500px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0, 123, 255, 0.2)',
        color: '#2c3e50',
        border: '2px solid #007bff'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 25px',
          borderBottom: '2px solid #007bff',
          background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
          borderRadius: '18px 18px 0 0'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
            💪 운동 알림
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '2px solid white',
              color: 'white',
              fontSize: '1.5rem',
              cursor: 'pointer',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
        
        {/* 내용 */}
        <div style={{ padding: '25px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
            {currentReminder.daysAgo >= 7 ? '🚨' : currentReminder.daysAgo >= 5 ? '⏰' : '📅'}
          </div>
          
          <div style={{ fontSize: '1.2rem', lineHeight: 1.6, marginBottom: '25px', fontWeight: 500 }}>
            {currentReminder.message}
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #e3f2fd 0%, #f0f8ff 100%)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '25px',
            border: '1px solid #007bff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#495057' }}>마지막 운동:</span>
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>{currentReminder.lastExercise}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, color: '#495057' }}>운동 날짜:</span>
              <span style={{ fontWeight: 'bold', color: '#2c3e50' }}>{currentReminder.lastDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 600, color: '#495057' }}>경과 일수:</span>
              <span style={{ 
                color: '#007bff', 
                fontSize: '1.1rem', 
                background: 'rgba(0, 123, 255, 0.1)', 
                padding: '4px 8px', 
                borderRadius: '8px',
                fontWeight: 'bold'
              }}>
                {currentReminder.daysAgo}일
              </span>
            </div>
          </div>
        </div>
        
        {/* 액션 버튼들 */}
        <div style={{
          padding: '20px 25px',
          borderTop: '2px solid #007bff',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '0 0 18px 18px'
        }}>
          {reminders.length > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
              <button 
                onClick={handlePrevious}
                disabled={currentReminderIndex === 0}
                style={{
                  background: 'white',
                  border: '2px solid #007bff',
                  color: '#007bff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                이전
              </button>
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#495057' }}>
                {currentReminderIndex + 1} / {reminders.length}
              </span>
              <button 
                onClick={handleNext}
                style={{
                  background: 'white',
                  border: '2px solid #007bff',
                  color: '#007bff',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {currentReminderIndex === reminders.length - 1 ? '닫기' : '다음'}
              </button>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={handleChatbotOpen}
              style={{
                background: 'linear-gradient(45deg, #007bff, #0056b3)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem'
              }}
            >
              🤖 챗봇에게 물어보기
            </button>
            <button 
              onClick={onClose}
              style={{
                background: 'white',
                border: '2px solid #007bff',
                color: '#007bff',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '1rem'
              }}
            >
              나중에 알림
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== 메인 모듈 컴포넌트 =====
const WorkoutNotificationModule = ({ onChatbotMessage }) => {
  const [showWorkoutReminder, setShowWorkoutReminder] = useState(false);

  const handleNotificationClick = () => {
    const reminders = generateWorkoutReminder();
    if (reminders.length > 0) {
      setShowWorkoutReminder(true);
    }
  };

  const handleWorkoutReminderClose = () => {
    setShowWorkoutReminder(false);
  };

  const handleWorkoutReminderChatbot = () => {
    setShowWorkoutReminder(false);
    const reminders = generateWorkoutReminder();
    if (reminders.length > 0 && onChatbotMessage) {
      const firstReminder = reminders[0];
      const autoMessage = `${firstReminder.part}운동 루틴을 추천해줘`;
      onChatbotMessage(autoMessage);
    }
  };

  return (
    <>
      <WorkoutNotificationIcon
        onClick={handleNotificationClick}
        isVisible={true}
      />
      <WorkoutReminderPopup
        isVisible={showWorkoutReminder}
        onClose={handleWorkoutReminderClose}
        onChatbotOpen={handleWorkoutReminderChatbot}
      />
    </>
  );
};

export default WorkoutNotificationModule;

// ===== 사용법 예시 =====
/*
// 1. 컴포넌트에서 import
import WorkoutNotificationModule from './modules/WorkoutNotificationModule';

// 2. 챗봇 메시지 핸들러 함수 정의
const handleChatbotMessage = (message) => {
  // 챗봇에 메시지 전달하는 로직
  console.log('챗봇 메시지:', message);
};

// 3. JSX에서 사용
function App() {
  return (
    <div>
      // 기존 컴포넌트들...
      
      <WorkoutNotificationModule onChatbotMessage={handleChatbotMessage} />
    </div>
  );
}
*/

