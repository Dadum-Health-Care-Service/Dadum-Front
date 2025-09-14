import React, { useState, useEffect } from 'react';
import FloatingChatIcon from '../../common/FloatingChatIcon';
import ChatWindow from '../../common/ChatWindow';
import './Chatbot.css';

const Chatbot = ({ 
  className = '',
  onMessageSend
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        sender: 'bot',
        text: '안녕하세요! 다듬 챗봇입니다. 운동이나 건강에 대해 궁금한 것이 있으시면 언제든 물어보세요! 💪',
        timestamp: new Date().toISOString()
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleToggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // 사용자 메시지 추가
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const botResponse = await callBackendAPI(text.trim());
      
      // 봇 응답 추가
      const botMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);

      // 외부 핸들러 호출 (선택사항)
      if (onMessageSend) {
        onMessageSend(text, botResponse);
      }
    } catch (error) {
      console.error('챗봇 응답 오류:', error);
      
      // 에러 메시지 추가
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 백엔드 API 호출 함수
  const callBackendAPI = async (userMessage) => {
    console.log('API 호출 시작:', userMessage);

    try {
      const response = await fetch('http://localhost:8080/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system',
              content: '당신은 다듬(Dadum) 운동 앱의 전문 챗봇입니다. 한국어로 친근하게 답하세요.' },
            { role: 'user', content: userMessage }
          ]
        })
      });

      console.log('API 응답 상태:', response.status);
      console.log('API 응답 헤더:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 에러 응답:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('text/event-stream')) {
        console.error('SSE가 아닌 응답:', ct);
        throw new Error('SSE가 아닌 응답');
      }

      // SSE 스트리밍 응답 처리 (제미나이 방식 - 한글 깨짐 해결)
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';

      while (true) {
        const { done, value } = await reader.read();
        
        // 마지막 청크까지 디코딩 후 루프 종료
        const chunk = decoder.decode(value, { stream: !done });
        console.log('받은 청크:', chunk);

        // 이전 로직과 동일하게 줄 단위로 파싱
        const lines = chunk.split('\n');
        for (const line of lines) {
          console.log('처리할 라인:', line);
          
          if (line.trim() === '') continue;
          
          if (line.startsWith('data: ')) {
            const content = line.substring(6).trim();
            console.log('추출된 내용:', content);

            if (content === '[DONE]') {
              console.log('DONE 신호 감지, 처리 중단');
              return full || '죄송합니다. 응답을 생성할 수 없습니다.';
            }

            if (content) {
              full += content;
              console.log('누적된 전체 텍스트:', full);
            }
          }
        }

        if (done) {
          console.log('스트림 종료');
          break;
        }
      }

      return full || '죄송합니다. 응답을 생성할 수 없습니다.';
    } catch (error) {
      console.error('API 호출 중 에러:', error);
      throw error;
    }
  };

  return (
    <div className={`floating-chatbot ${className}`}>
      <FloatingChatIcon
        isOpen={isOpen}
        onClick={handleToggleChat}
        size="large"
      />
      
      <ChatWindow
        isOpen={isOpen}
        onClose={handleToggleChat}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Chatbot;
