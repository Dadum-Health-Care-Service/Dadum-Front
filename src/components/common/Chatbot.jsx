import React, { useState, useEffect } from 'react';
import FloatingChatIcon from './FloatingChatIcon';
import ChatWindow from './ChatWindow';
import './Chatbot.css';

const Chatbot = ({ 
  className = '',
  onMessageSend,
  initialMessages = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
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
      // 외부 API 호출 (현재는 목업)
      const botResponse = await mockBotResponse(text.trim());
      
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

  // 목업 봇 응답 함수
  const mockBotResponse = async (userMessage) => {
    // 실제 API 호출을 시뮬레이션하기 위한 딜레이
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const responses = [
      '좋은 질문이네요! 운동에 대해 더 자세히 알려드릴게요.',
      '운동은 정말 중요하죠! 꾸준히 하시는 것이 핵심입니다.',
      '건강한 생활 습관을 유지하시는 것이 좋겠어요.',
      '운동 강도는 본인의 체력에 맞게 조절하시는 것이 중요합니다.',
      '충분한 휴식과 영양 섭취도 운동만큼 중요해요!',
      '궁금한 점이 더 있으시면 언제든 물어보세요!',
      '운동 루틴을 만드실 때는 점진적으로 강도를 높여가세요.',
      '스트레칭과 워밍업을 잊지 마세요!',
      '수분 섭취도 충분히 하시는 것을 잊지 마세요.',
      '운동 후 쿨다운도 중요합니다!'
    ];

    // 키워드 기반 응답
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('운동') || lowerMessage.includes('exercise')) {
      return '운동에 대해 질문해주셨네요! 어떤 종류의 운동에 관심이 있으신가요? 유산소, 근력운동, 스트레칭 등 다양한 운동을 추천해드릴 수 있어요! 💪';
    }
    
    if (lowerMessage.includes('다이어트') || lowerMessage.includes('체중')) {
      return '다이어트는 운동과 식단 조절이 함께 이루어져야 효과적이에요. 균형 잡힌 식단과 꾸준한 운동을 추천드려요! 🥗';
    }
    
    if (lowerMessage.includes('근육') || lowerMessage.includes('근력')) {
      return '근력 운동은 점진적으로 강도를 높여가며, 충분한 휴식을 취하는 것이 중요해요. 올바른 자세로 운동하시는 것도 잊지 마세요! 💪';
    }
    
    if (lowerMessage.includes('스트레칭') || lowerMessage.includes('유연성')) {
      return '스트레칭은 운동 전후에 꼭 해주세요! 유연성을 높이고 부상을 예방하는 데 도움이 됩니다. 🧘‍♀️';
    }
    
    if (lowerMessage.includes('시간') || lowerMessage.includes('언제')) {
      return '운동 시간은 개인의 일정에 맞게 조절하시면 됩니다. 다만, 식사 후 1-2시간 후에 운동하시는 것을 추천해요! ⏰';
    }
    
    if (lowerMessage.includes('도움') || lowerMessage.includes('help')) {
      return '다듬 챗봇이 도와드릴게요! 운동, 건강, 다이어트, 근력운동, 스트레칭 등에 대해 질문해주세요! 😊';
    }

    // 기본 응답
    return responses[Math.floor(Math.random() * responses.length)];
  };

  return (
    <div className={`chatbot ${className}`}>
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
