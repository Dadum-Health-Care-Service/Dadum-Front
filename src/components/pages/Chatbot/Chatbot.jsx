import React, { useState, useEffect, useRef } from "react";
import FloatingChatIcon from "../../common/FloatingChatIcon";
import ChatWindow from "../../common/ChatWindow";
import "./Chatbot.module.css";

const Chatbot = ({ className = "", onMessageSend }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const streamingMsgIdRef = useRef(null);

  // 초기 환영 메시지
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        sender: "bot",
        text: "안녕하세요! 다듬 챗봇입니다. 운동이나 건강에 대해 궁금한 것이 있으시면 언제든 물어보세요! 💪",
        timestamp: new Date().toISOString(),
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
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 스트리밍용 봇 메시지 빈 틀 생성
    const streamingId = Date.now() + 1;
    streamingMsgIdRef.current = streamingId;

    // 로딩 상태를 false로 바꾸고 빈 봇 메시지 생성
    setIsLoading(false);
    const botMessage = {
      id: streamingId,
      sender: "bot",
      text: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMessage]);

    // 간단한 오프토픽 프론트 가드
    const offTopic =
      /(근황|뉴스|정치|연예|주가|스캔들|가십|드라마|영화|주식|코인)/i.test(
        text.trim()
      );
    const onTopic =
      /(운동|루틴|스트레칭|유산소|근력|웨이트|스쿼트|벤치|데드|재활|부상|체지방|다이어트|식단)/i.test(
        text.trim()
      );

    if (!onTopic && offTopic) {
      // 오프토픽 메시지로 교체
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                text: "그 주제는 제 범위 밖이에요. 운동/건강 관련해서는 도와드릴게요. 예: 어깨 통증 스트레칭, 체지방 감량 식단, 3일 분할 루틴 💪",
              }
            : m
        )
      );
      streamingMsgIdRef.current = null;
      return;
    }

    try {
      await streamChatResponse(text.trim(), streamingId);
    } catch (error) {
      console.error("챗봇 응답 오류:", error);

      // 에러 메시지로 교체
      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId
            ? {
                ...m,
                text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
              }
            : m
        )
      );
    } finally {
      streamingMsgIdRef.current = null;
    }
  };

  // 실시간 스트리밍 응답 처리 (완벽한 SSE 파서)
  const streamChatResponse = async (userMessage, streamingId) => {
    const response = await fetch("http://localhost:8080/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content: `당신은 다듬(Dadum) '운동/건강' 전용 챗봇이다.

[역할] 운동/루틴/부상예방/회복/영양·식단/운동생리만 다룬다. 연예·정치·유명인 근황·일반 시사 등은 다루지 않는다.

[규칙]
1) 스코프 밖이면 정중히 거절: "그 주제는 제 범위 밖이에요. 운동/건강 관련해서는 도와드릴게요. 예: 어깨 통증 스트레칭, 체지방 감량 식단, 3일 분할 루틴"
2) 운동으로 재구성 제안 1줄.
3) 최신뉴스/근황 요청은 답변하지 않음.
4) 한국어, 5문장 이내, 이모지는 최대 1개.`,
          },
          { role: "user", content: userMessage },
        ],
      }),
    });
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    let carry = "";
    let eventBuffer = [];

    const flush = () => {
      if (!eventBuffer.length) return false;

      // DONE 패턴: [DONE] 혹은 data: [DONE] 등 모든 변형(대소문자/공백 포함)
      const isDone = eventBuffer.some(
        (p) => /\bdata:\s*\[DONE\]\b/i.test(p) || /\[\s*DONE\s*\]/i.test(p)
      );

      // 본문 만들 때 DONE 관련 토막은 싹 제거
      let body = eventBuffer
        .filter(
          (p) => !(/\bdata:\s*\[DONE\]\b/i.test(p) || /\[\s*DONE\s*\]/i.test(p))
        )
        .join("");

      // 혹시 본문 끝/중간에 섞여들어간 잔여 문자열도 제거(방탄)
      body = body
        .replace(/\bdata:\s*\[DONE\]\b/gi, "")
        .replace(/\[\s*DONE\s*\]/gi, "");

      // 혹시라도 남아버린 'data:'가 body의 시작에 붙었으면 제거
      body = body.replace(/^\s*data:\s*/i, "");

      eventBuffer = [];

      if (body) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === streamingId ? { ...m, text: m.text + body } : m
          )
        );
      }
      return isDone; // true면 스트림 종료
    };

    while (true) {
      const { done, value } = await reader.read();
      const chunk = decoder.decode(value ?? new Uint8Array(), {
        stream: !done,
      });

      const raw = carry + chunk;
      const lines = raw.split("\n");
      carry = lines.pop() ?? "";

      for (let line of lines) {
        // 1) 라인 정규화: 앞 BOM, 뒤 CR 제거
        line = line.replace(/^\uFEFF/, "").replace(/\r$/, "");

        // 2) data: 본문만 캡처 (공백 포함 그대로 살림)
        const m = line.match(/^\s*data:\s*(.*)$/i);
        if (m) {
          // 캡처된 본문에서 BOM만 제거하고 공백은 그대로 유지
          let payload = m[1].replace(/^\uFEFF/, "");
          
          // data:data: 중복 제거
          if (payload.startsWith("data: ")) {
            payload = payload.substring(6);
          }
          
          eventBuffer.push(payload);
          continue;
        }

        // 3) 이벤트 경계 (빈 줄/공백만)
        if (/^\s*$/.test(line)) {
          if (flush()) return; // [DONE]이면 종료
          continue;
        }

        // 4) 그 밖의 헤더(event:, id:, retry:)는 무시
      }

      if (done) {
        // carry 처리
        if (carry) {
          let l = carry.replace(/^\uFEFF/, "").replace(/\r$/, "");
          const m = l.match(/^\s*data:\s*(.*)$/i);
          if (m) {
            let payload = m[1].replace(/^\uFEFF/, "");
            eventBuffer.push(payload);
          } else if (/^\s*$/.test(l)) {
            /* 경계 */
          }
        }
        flush();
        break;
      }
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
