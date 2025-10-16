# 운동 알림 모듈 사용법

## 📁 파일 구조
```
src/modules/
├── WorkoutNotificationModule.js  # 메인 모듈 파일
└── README.md                     # 사용법 문서
```

## 🚀 설치 방법

1. `WorkoutNotificationModule.js` 파일을 프로젝트의 `src/modules/` 폴더에 복사
2. 필요에 따라 폴더 경로 조정

## 💻 사용법

### 1. 기본 사용법

```jsx
import React from 'react';
import WorkoutNotificationModule from './modules/WorkoutNotificationModule';

function App() {
  return (
    <div>
      {/* 기존 컴포넌트들 */}
      
      {/* 운동 알림 모듈 추가 */}
      <WorkoutNotificationModule />
    </div>
  );
}

export default App;
```

### 2. 챗봇과 연동하여 사용

```jsx
import React, { useState } from 'react';
import WorkoutNotificationModule from './modules/WorkoutNotificationModule';

function App() {
  const [chatbotMessage, setChatbotMessage] = useState('');

  // 챗봇 메시지 핸들러
  const handleChatbotMessage = (message) => {
    setChatbotMessage(message);
    // 여기에 실제 챗봇에 메시지 전달하는 로직 추가
    console.log('챗봇으로 전달될 메시지:', message);
  };

  return (
    <div>
      {/* 기존 컴포넌트들 */}
      
      {/* 운동 알림 모듈 - 챗봇 연동 */}
      <WorkoutNotificationModule onChatbotMessage={handleChatbotMessage} />
      
      {/* 챗봇 메시지 표시 (디버깅용) */}
      {chatbotMessage && (
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          left: '10px', 
          background: '#007bff', 
          color: 'white', 
          padding: '10px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          챗봇 메시지: {chatbotMessage}
        </div>
      )}
    </div>
  );
}

export default App;
```

### 3. 커스텀 스타일 적용

모듈 내부의 인라인 스타일을 수정하여 디자인을 변경할 수 있습니다:

```jsx
// WorkoutNotificationModule.js 파일에서 스타일 수정
const iconStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '90px',  // 위치 조정
  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',  // 색상 변경
  // ... 기타 스타일
};
```

## 🎯 기능 설명

### 운동 알림 아이콘
- **위치**: 화면 우하단 고정
- **표시 조건**: 3일 이상 운동하지 않은 부위가 있을 때
- **디자인**: 파란색 그라데이션 배경, 흰색 테두리
- **애니메이션**: 플로팅 효과, 호버 시 확대

### 알림 팝업
- **트리거**: 알림 아이콘 클릭 시
- **내용**: 운동 부위별 간격 정보 및 권장 메시지
- **네비게이션**: 여러 알림이 있을 때 이전/다음 버튼
- **액션**: 챗봇 연동 또는 나중에 알림

### 더미 데이터
- **운동 부위**: 가슴, 등, 하체, 어깨, 팔
- **데이터 형식**: 날짜, 운동명, 세트, 횟수, 무게
- **날짜**: 2025년 기준으로 설정

## ⚙️ 커스터마이징

### 1. 더미 데이터 수정
```javascript
// WorkoutNotificationModule.js 파일에서 수정
const dummyWorkoutData = {
  chest: [
    { date: '2025-01-15', exercise: '벤치프레스', sets: 3, reps: 10, weight: 80 },
    // 새로운 운동 추가
  ],
  // 새로운 부위 추가
  core: [
    { date: '2025-01-20', exercise: '플랭크', sets: 3, reps: 60, weight: 0 }
  ]
};
```

### 2. 알림 기준 변경
```javascript
// 3일 대신 다른 기준으로 변경
if (gap.daysAgo >= 5) {  // 5일 이상으로 변경
  // 알림 로직
}
```

### 3. 메시지 템플릿 수정
```javascript
// 메시지 형식 변경
if (gap.daysAgo >= 7) {
  message = `🔥 ${gap.part}운동을 ${gap.daysAgo}일 동안 하지 않았습니다!`;
}
```

## 🔧 문제 해결

### 알림이 나타나지 않는 경우
1. 더미 데이터의 날짜가 현재 날짜보다 과거인지 확인
2. 운동 간격이 3일 이상인지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

### 스타일이 깨지는 경우
1. 부모 컴포넌트의 CSS와 충돌 여부 확인
2. z-index 값 조정 (현재 1000 사용)
3. position: fixed 스타일 확인

## 📱 반응형 지원

모듈은 기본적으로 반응형 디자인을 지원하지만, 필요에 따라 미디어 쿼리를 추가할 수 있습니다:

```css
@media (max-width: 768px) {
  .workout-notification-icon {
    width: 50px;
    height: 50px;
    right: 75px;
  }
}
```

## 🎨 디자인 가이드

- **주 색상**: #007bff (파란색)
- **보조 색상**: #ffffff (흰색), #f8f9fa (연한 회색)
- **강조 색상**: #dc3545 (빨간색, 알림 배지용)
- **폰트**: 시스템 기본 폰트 사용
- **둥근 모서리**: 20px (팝업), 50% (아이콘)

## 📝 라이선스

이 모듈은 자유롭게 사용, 수정, 배포할 수 있습니다.

