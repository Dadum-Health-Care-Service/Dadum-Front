import { useState, useEffect,useRef } from "react";

import ContainerComponent from "../../common/ContainerComponent";
import styles from "./Admin.module.css";

export default function Admin() {
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return; // 이미 연결되어 있으면 연결하지 않음
    }

    ws = new WebSocket("ws://172.24.137.184:8000/ws");

    ws.onopen = function (event) {
      console.log("WebSocket 연결됨");
      reconnectAttempts = 0;
    };

    ws.onclose = function (event) {
      console.log("WebSocket 연결 종료됨");
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(connectWebSocket, 5000); // 5초 후 재연결
      }
    };

    ws.onmessage = function (event) {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data.log_data.raw_log]);
    };

    ws.onerror = function (error) {
      console.error("WebSocket 에러:", error);
    };
  }
  useEffect(() => {
    connectWebSocket();
  }, []);
  useEffect(() => {
    logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [logs]);
  return (
    <ContainerComponent
      variant="elevated"
      size="large"
      className={styles.admin}
    >
      <h1>관리자 페이지</h1>
      <p>관리자 페이지 기능은 개발 중입니다.</p>
      <ContainerComponent variant="elevated" size="large">
        <h3>로그 모니터링</h3>
        <div className={styles.logContainer} ref={logContainerRef}>
          {logs.map((log) => {
            return <p>{log}</p>;
          })}
        </div>
      </ContainerComponent>
    </ContainerComponent>
  );
}
