import React from 'react';
import './FloatingChatIcon.css';

const FloatingChatIcon = ({ 
  isOpen = false,
  onClick,
  className = '',
  size = 'large' // small, medium, large
}) => {
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

  return (
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
  );
};

export default FloatingChatIcon;

