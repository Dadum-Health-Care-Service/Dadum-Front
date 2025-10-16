import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalComponent from './ModalComponent';
import './NotificationPopup.css';

// 더미 데이터 (컴포넌트 외부로 이동)
const dummyNotifications = [
  {
    id: 1,
    type: 'workout_reminder',
    title: '상체 운동 알림',
    message: '상체 운동한지 3일이 되었습니다. 상체 운동을 추가해 주세요.',
    time: '2시간 전',
    isRead: false
  },
  {
    id: 2,
    type: 'achievement',
    title: '목표 달성',
    message: '이번 주 운동 목표를 달성했습니다.',
    time: '1일 전',
    isRead: true
  },
  {
    id: 3,
    type: 'routine_suggestion',
    title: '루틴 추천',
    message: '새로운 하체 운동 루틴을 추천드립니다.',
    time: '2일 전',
    isRead: false
  }
];

const NotificationPopup = ({ isOpen, onClose, notifications = [] }) => {
  const navigate = useNavigate();
  const [localNotifications, setLocalNotifications] = useState(dummyNotifications);
  
  if (!isOpen) return null;

  const displayNotifications = notifications.length > 0 ? notifications : localNotifications;


  const handleBackdropClick = (e) => {
    // 백드롭 클릭 시 팝업 닫기 (현재는 pointer-events: none이므로 작동하지 않음)
    onClose();
  };

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    if (notification.type === 'routine_suggestion' || notification.type === 'workout_reminder') {
      // 루틴 추천 또는 운동 알림인 경우 루틴 페이지로 이동
      navigate('/routine');
      onClose();
    } else {
      // 다른 알림인 경우 읽음 처리하고 제거
      setLocalNotifications(prev => 
        prev.filter(notif => notif.id !== notification.id)
      );
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllRead = () => {
    setLocalNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={onClose}
      title="알림"
      size="small"
      showCloseButton={true}
      closeOnOverlayClick={false}
    >
      <div className="notification-popup__content">
                  {displayNotifications.length === 0 ? (
                    <div className="notification-empty">
                      <p className="notification-empty__message">새로운 알림이 없습니다</p>
                    </div>
                  ) : (
                  displayNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                    <div className="notification-item__content">
                      <div className="notification-item__header">
                        <h4 className="notification-item__title">{notification.title}</h4>
                        <span className="notification-item__time">{notification.time}</span>
                      </div>
                      <p className="notification-item__message">{notification.message}</p>
                    </div>
                    {!notification.isRead && <div className="notification-item__badge"></div>}
                    </div>
                  ))
        )}
      </div>
      
      {displayNotifications.length > 0 && (
        <ModalComponent.Actions>
          <button 
            className="notification-popup__action"
            onClick={handleMarkAllRead}
          >
            모든 알림 읽음
          </button>
        </ModalComponent.Actions>
      )}
    </ModalComponent>
  );
};

export default NotificationPopup;
