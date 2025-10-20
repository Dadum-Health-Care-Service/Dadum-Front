import React, { useState, useRef } from 'react';
import './FloatingChatIcon.css';
import NotificationPopup from './NotificationPopup';
import { useLocation } from 'react-router-dom';

const FloatingChatIcon = ({ 
  isOpen = false,
  onClick,
  className = '',
  size = 'large' // small, medium, large
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const longPressTimer = useRef(null);
  const location=useLocation();
  
  const socialWrapper = location.pathname==='/social'?'social-override':'';


  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'floating-icon--small';
      case 'medium':
        return 'floating-icon--medium';
      default:
        return 'floating-icon--large';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = (e) => {
    // 마우스가 wrapper를 벗어났을 때, 알림 아이콘으로 이동하는지 확인
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && relatedTarget.closest && (
      relatedTarget.closest('.floating-notification-icon') ||
      relatedTarget.closest('.floating-chat-wrapper')
    )) {
      return; // 알림 아이콘으로 이동했다면 숨기지 않음
    }
    setIsHovered(false);
  };

  // 모바일 터치 이벤트 (꾹 누르기)
  const handleTouchStart = (e) => {
    // 챗봇 버튼 자체를 클릭하는 경우 long press 무시
    if (e.target.closest('.floating-chat-icon')) {
      return;
    }
    
    longPressTimer.current = setTimeout(() => {
      setIsHovered(true);
    }, 500); // 500ms 꾹 누르면 알림 아이콘 표시
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    // 터치 이동 시 long press 취소
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // 터치로 wrapper 밖을 터치하면 알림 아이콘 숨김
  const handleTouchOutside = () => {
    setIsHovered(false);
  };

  // 알림 아이콘 클릭 핸들러
  const handleNotificationClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNotificationOpen(true);
  };

  // 알림 팝업 닫기
  const handleNotificationClose = () => {
    setIsNotificationOpen(false);
  };

  // 모바일 감지
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <>
      {/* 모바일에서만 wrapper 밖 터치 감지용 */}
      {isMobile && isHovered && (
        <div 
          className="floating-backdrop-touch"
          onTouchStart={handleTouchOutside}
          onClick={handleTouchOutside}
        />
      )}
      
      <div 
        className={`floating-chat-wrapper ${socialWrapper}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >

              {/* 알림 아이콘 - 호버 시 위로 나타남 */}
              <div 
                className={`floating-notification-icon ${isHovered ? 'show' : ''}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleNotificationClick}
              >
        <svg 
          className="floating-notification-icon__svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9964 12 21.9964C11.6496 21.9964 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* 기존 챗봇 버튼 */}
      <button
        className={`floating-chat-icon ${getSizeClass()} ${isOpen ? 'floating-icon--open' : ''} ${className}`.trim()}
        onClick={handleClick}
        aria-label={isOpen ? '챗봇 닫기' : '챗봇 열기'}
        type="button"
      >
        <div className="floating-icon__content">
          {isOpen ? (
            <svg 
              className="floating-icon__svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg 
              className="floating-icon__svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
              <path 
                d="M8 9H16M8 13H12" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </button>
    </div>
    
    {/* 알림 팝업 */}
    <NotificationPopup 
      isOpen={isNotificationOpen}
      onClose={handleNotificationClose}
    />
    </>
  );
};

export default FloatingChatIcon;

