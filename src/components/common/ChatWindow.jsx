import React, { useState, useRef, useEffect } from 'react';
import ContainerComponent from './ContainerComponent';
import ButtonComponent from './ButtonComponent';
import InputComponent from './InputComponent';
import './ChatWindow.css';

const ChatWindow = ({ 
  isOpen = false,
  onClose,
  className = '',
  messages = [],
  onSendMessage,
  isLoading = false
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // 메시지가 추가될 때마다 스크롤을 맨 아래로
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // 챗봇이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  const handleSendMessage = async (e, suggestionText = null) => {
    e.preventDefault();
    const messageText = suggestionText || inputValue.trim();
    
    if (messageText && onSendMessage && !isLoading) {
      // 입력창을 먼저 비우기 (사용자 경험 개선)
      if (!suggestionText) {
        setInputValue('');
      }
      
      try {
        // onSendMessage가 async 함수이므로 await로 기다림
        await onSendMessage(messageText);
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        // 실패 시 입력창에 다시 텍스트 복원
        if (!suggestionText) {
          setInputValue(messageText);
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // 추천 질문 클릭 핸들러
  const handleSuggestionClick = (suggestion) => {
    // 바로 전송 (입력 필드에 입력하지 않고)
    handleSendMessage({ preventDefault: () => {} }, suggestion);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`chat-window-overlay ${isOpen ? 'chat-window--open' : ''}`}>
      <ContainerComponent 
        variant="elevated" 
        size="large"
        className={`chat-window ${className}`}
        padding="none"
        borderRadius="large"
        shadow="large"
      >
        {/* 챗봇 헤더 */}
        <div className="chat-window__header">
          <div className="chat-window__header-info">
            <div className="chat-window__avatar">
              <svg 
                className="chat-window__avatar-icon" 
                viewBox="0 0 20 20" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="m 10,4.31 c -1.44,0 -2.88,0.49 -4.05,1.47 -0.71,0.59 -1.25,1.31 -1.63,2.1 -0.05,0 -0.10,0 -0.16,0 -0.94,0 -1.70,0.76 -1.70,1.70 v 2.10 c 0,0.94 0.76,1.70 1.70,1.70 0.05,0 0.11,0 0.16,0 0.07,0.14 0.14,0.28 0.22,0.42 0.31,0.55 1.13,0.08 0.82,-0.47 -1.30,-2.26 -0.80,-5.12 1.20,-6.80 2.00,-1.68 4.90,-1.68 6.90,0 2.00,1.68 2.50,4.54 1.20,6.80 l -0.01,0.02 -0.01,0.02 c 0,0 -0.63,1.40 -1.88,1.40 l -1.58,0 c -0.15,-0.22 -0.38,-0.37 -0.67,-0.37 h -1.02 c -0.46,0 -0.82,0.37 -0.82,0.82 0,0.28 0.18,0.49 0.59,0.49 l 3.49,0 c 1.87,0 2.68,-1.83 2.71,-1.92 v 0 c 0.08,-0.14 0.15,-0.28 0.21,-0.41 0.05,0 0.11,0 0.16,0 0.94,0 1.70,-0.76 1.70,-1.70 v -2.10 c 0,-0.94 -0.76,-1.70 -1.70,-1.70 -0.05,0 -0.11,0 -0.16,0 -0.38,-0.79 -0.92,-1.51 -1.63,-2.10 -1.17,-0.98 -2.62,-1.47 -4.06,-1.47 z m -2.05,2.99 c -0.37,0 -0.70,0.05 -0.99,0.36 -0.78,0.82 -1.26,1.94 -1.26,3.13 0,0.98 0.33,2.08 0.88,2.12 0.79,0.06 2.03,-0.46 3.42,-0.46 1.48,0 2.79,0.58 3.56,0.44 0.47,-0.08 0.74,-1.21 0.74,-2.10 0,-1.19 -0.48,-2.31 -1.26,-3.13 -0.78,-0.82 -1.86,0 -3.04,0 -0.74,0 -1.44,-0.32 -2.05,-0.36 z m -0.17,2.02 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z m 4.45,0 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z"
                  fill="#ffffff"
                />
              </svg>
            </div>
            <div className="chat-window__header-text">
              <h3 className="chat-window__title">다듬 챗봇</h3>
              <p className="chat-window__subtitle">운동 관련 질문을 도와드려요</p>
            </div>
          </div>
          <ButtonComponent
            variant="ghost"
            size="small"
            onClick={onClose}
            className="chat-window__close-btn"
            aria-label="챗봇 닫기"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </ButtonComponent>
        </div>

        {/* 메시지 목록 */}
        <div className="chat-window__messages">
          {messages.length === 0 ? (
            <div className="chat-window__empty">
              <div className="chat-window__empty-icon">💬</div>
              <h4>안녕하세요! 다듬 챗봇입니다</h4>
              <p>운동이나 건강에 대해 궁금한 것이 있으시면 언제든 물어보세요!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`chat-window__message ${message.sender === 'user' ? 'chat-window__message--user' : 'chat-window__message--bot'}`}
              >
                <div className="chat-window__message-content">
                  <div className="chat-window__message-text">
                    {message.text}
                    {message.text === '' && message.sender === 'bot' && (
                      <span className="chat-window__cursor">|</span>
                    )}
                  </div>
                  <div className="chat-window__message-time">
                    {formatTime(message.timestamp)}
                  </div>
                </div>
                {message.sender === 'bot' && (
                  <div className="chat-window__message-avatar">
                    <svg 
                      className="chat-window__message-avatar-icon" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="m 10,4.31 c -1.44,0 -2.88,0.49 -4.05,1.47 -0.71,0.59 -1.25,1.31 -1.63,2.1 -0.05,0 -0.10,0 -0.16,0 -0.94,0 -1.70,0.76 -1.70,1.70 v 2.10 c 0,0.94 0.76,1.70 1.70,1.70 0.05,0 0.11,0 0.16,0 0.07,0.14 0.14,0.28 0.22,0.42 0.31,0.55 1.13,0.08 0.82,-0.47 -1.30,-2.26 -0.80,-5.12 1.20,-6.80 2.00,-1.68 4.90,-1.68 6.90,0 2.00,1.68 2.50,4.54 1.20,6.80 l -0.01,0.02 -0.01,0.02 c 0,0 -0.63,1.40 -1.88,1.40 l -1.58,0 c -0.15,-0.22 -0.38,-0.37 -0.67,-0.37 h -1.02 c -0.46,0 -0.82,0.37 -0.82,0.82 0,0.28 0.18,0.49 0.59,0.49 l 3.49,0 c 1.87,0 2.68,-1.83 2.71,-1.92 v 0 c 0.08,-0.14 0.15,-0.28 0.21,-0.41 0.05,0 0.11,0 0.16,0 0.94,0 1.70,-0.76 1.70,-1.70 v -2.10 c 0,-0.94 -0.76,-1.70 -1.70,-1.70 -0.05,0 -0.11,0 -0.16,0 -0.38,-0.79 -0.92,-1.51 -1.63,-2.10 -1.17,-0.98 -2.62,-1.47 -4.06,-1.47 z m -2.05,2.99 c -0.37,0 -0.70,0.05 -0.99,0.36 -0.78,0.82 -1.26,1.94 -1.26,3.13 0,0.98 0.33,2.08 0.88,2.12 0.79,0.06 2.03,-0.46 3.42,-0.46 1.48,0 2.79,0.58 3.56,0.44 0.47,-0.08 0.74,-1.21 0.74,-2.10 0,-1.19 -0.48,-2.31 -1.26,-3.13 -0.78,-0.82 -1.86,0 -3.04,0 -0.74,0 -1.44,-0.32 -2.05,-0.36 z m -0.17,2.02 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z m 4.45,0 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z"
                        fill="#000000"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))
          )}
          
          {/* 로딩 인디케이터 */}
          {isLoading && (
            <div className="chat-window__message chat-window__message--bot">
              <div className="chat-window__message-content">
                <div className="chat-window__message-text chat-window__typing">
                  <div className="chat-window__typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
              <div className="chat-window__message-avatar">
                <svg 
                  className="chat-window__message-avatar-icon" 
                  viewBox="0 0 20 20" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m 10,4.31 c -1.44,0 -2.88,0.49 -4.05,1.47 -0.71,0.59 -1.25,1.31 -1.63,2.1 -0.05,0 -0.10,0 -0.16,0 -0.94,0 -1.70,0.76 -1.70,1.70 v 2.10 c 0,0.94 0.76,1.70 1.70,1.70 0.05,0 0.11,0 0.16,0 0.07,0.14 0.14,0.28 0.22,0.42 0.31,0.55 1.13,0.08 0.82,-0.47 -1.30,-2.26 -0.80,-5.12 1.20,-6.80 2.00,-1.68 4.90,-1.68 6.90,0 2.00,1.68 2.50,4.54 1.20,6.80 l -0.01,0.02 -0.01,0.02 c 0,0 -0.63,1.40 -1.88,1.40 l -1.58,0 c -0.15,-0.22 -0.38,-0.37 -0.67,-0.37 h -1.02 c -0.46,0 -0.82,0.37 -0.82,0.82 0,0.28 0.18,0.49 0.59,0.49 l 3.49,0 c 1.87,0 2.68,-1.83 2.71,-1.92 v 0 c 0.08,-0.14 0.15,-0.28 0.21,-0.41 0.05,0 0.11,0 0.16,0 0.94,0 1.70,-0.76 1.70,-1.70 v -2.10 c 0,-0.94 -0.76,-1.70 -1.70,-1.70 -0.05,0 -0.11,0 -0.16,0 -0.38,-0.79 -0.92,-1.51 -1.63,-2.10 -1.17,-0.98 -2.62,-1.47 -4.06,-1.47 z m -2.05,2.99 c -0.37,0 -0.70,0.05 -0.99,0.36 -0.78,0.82 -1.26,1.94 -1.26,3.13 0,0.98 0.33,2.08 0.88,2.12 0.79,0.06 2.03,-0.46 3.42,-0.46 1.48,0 2.79,0.58 3.56,0.44 0.47,-0.08 0.74,-1.21 0.74,-2.10 0,-1.19 -0.48,-2.31 -1.26,-3.13 -0.78,-0.82 -1.86,0 -3.04,0 -0.74,0 -1.44,-0.32 -2.05,-0.36 z m -0.17,2.02 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z m 4.45,0 c 0.43,0 0.79,0.35 0.79,0.79 0,0.43 -0.35,0.79 -0.79,0.79 -0.43,0 -0.79,-0.35 -0.79,-0.79 0,-0.43 0.35,-0.79 0.79,-0.79 z"
                    fill="#000000"
                  />
                </svg>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 추천 질문 */}
        {!isLoading && (
          <div className="chat-window__suggestions">
            <div className="chat-window__suggestions-title">추천 질문</div>
            <div className="chat-window__suggestions-list">
              {[
                "어깨 통증 스트레칭 방법",
                "체지방 감량 식단 추천",
                "3일 분할 루틴 만들기",
                "운동 전후 스트레칭"
              ].map((suggestion, index) => (
                <button
                  key={index}
                  className="chat-window__suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 메시지 입력 */}
        <div className="chat-window__input">
          <form onSubmit={handleSendMessage} className="chat-window__form">
            <div className="chat-window__input-wrapper">
              <InputComponent
                ref={inputRef}
                placeholder="메시지를 입력하세요..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="chat-window__input-field"
                variant="filled"
                size="medium"
              />
              <ButtonComponent
                type="submit"
                variant="primary"
                size="medium"
                disabled={!inputValue.trim() || isLoading}
                className="chat-window__send-btn"
              >
                {isLoading ? (
                  <div className="chat-window__loading-spinner">
                    <div></div>
                  </div>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </ButtonComponent>
            </div>
          </form>
        </div>
      </ContainerComponent>
    </div>
  );
};

export default ChatWindow;

