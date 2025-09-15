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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (inputValue.trim() && onSendMessage && !isLoading) {
      const messageText = inputValue.trim();
      
      // 입력창을 먼저 비우기 (사용자 경험 개선)
      setInputValue('');
      
      try {
        // onSendMessage가 async 함수이므로 await로 기다림
        await onSendMessage(messageText);
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        // 실패 시 입력창에 다시 텍스트 복원
        setInputValue(messageText);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
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
              <span className="chat-window__avatar-text">🤖</span>
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
                    🤖
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
                🤖
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

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

