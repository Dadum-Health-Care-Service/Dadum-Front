import { useState, useEffect, useRef } from "react";
import ContainerComponent from "../../../../common/ContainerComponent";
import ButtonComponent from "../../../../common/ButtonComponent";
import InputComponent from "../../../../common/InputComponent";
import ToggleComponent from "../../../../common/ToggleComponent";
import styles from "./Security.module.css";

export default function Security() {
  const [logs, setLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([
    {
      id: 1,
      ip: "192.168.1.100",
      reason: "의심스러운 활동",
      blockedAt: "2024-01-15 14:30:25",
      status: "blocked",
    },
    {
      id: 2,
      ip: "10.0.0.50",
      reason: "무차별 대입 공격",
      blockedAt: "2024-01-15 13:45:12",
      status: "blocked",
    },
    {
      id: 3,
      ip: "172.16.0.25",
      reason: "스팸 요청",
      blockedAt: "2024-01-15 12:20:08",
      status: "blocked",
    },
  ]);
  const [newIP, setNewIP] = useState("");
  const [newReason, setNewReason] = useState("");
  const logContainerRef = useRef(null);
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;

  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
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
        setTimeout(connectWebSocket, 5000);
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
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleBlockIP = () => {
    if (newIP && newReason) {
      const newBlockedIP = {
        id: Date.now(),
        ip: newIP,
        reason: newReason,
        blockedAt: new Date().toLocaleString(),
        status: "blocked",
      };
      setBlockedIPs((prev) => [...prev, newBlockedIP]);
      setNewIP("");
      setNewReason("");
    }
  };

  const handleUnblockIP = (id) => {
    setBlockedIPs((prev) => prev.filter((ip) => ip.id !== id));
  };

  const LogMonitoring = () => (
    <div className={styles["log-section"]}>
      <div className={styles["log-header"]}>
        <h3>실시간 로그 모니터링</h3>
        <div className={styles["log-status"]}>
          <span className={styles["status-indicator"]}></span>
          <span>연결됨</span>
        </div>
      </div>
      <div className={styles["log-container"]} ref={logContainerRef}>
        {logs.length === 0 ? (
          <div className={styles["no-logs"]}>
            <p>로그를 기다리는 중...</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={styles["log-entry"]}>
              <span className={styles["log-time"]}>
                {new Date().toLocaleTimeString()}
              </span>
              <span className={styles["log-content"]}>{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const IPManagement = () => (
    <div className={styles["ip-section"]}>
      <div className={styles["ip-header"]}>
        <h3>IP 차단 관리</h3>
        <div className={styles["ip-stats"]}>
          <span className={styles["stat-item"]}>
            총 차단: <strong>{blockedIPs.length}</strong>
          </span>
        </div>
      </div>

      {/* IP 차단 추가 */}
      <div className={styles["add-ip-form"]}>
        <h4>새 IP 차단</h4>
        <div className={styles["form-row"]}>
          <InputComponent
            placeholder="IP 주소 (예: 192.168.1.100)"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            className={styles["ip-input"]}
          />
          <InputComponent
            placeholder="차단 사유"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            className={styles["reason-input"]}
          />
          <ButtonComponent
            variant="primary"
            onClick={handleBlockIP}
            disabled={!newIP || !newReason}
          >
            차단
          </ButtonComponent>
        </div>
      </div>

      {/* 차단된 IP 목록 */}
      <div className={styles["blocked-ips"]}>
        <h4>차단된 IP 목록</h4>
        {blockedIPs.length === 0 ? (
          <div className={styles["no-ips"]}>
            <p>차단된 IP가 없습니다.</p>
          </div>
        ) : (
          <div className={styles["ip-list"]}>
            {blockedIPs.map((ip) => (
              <div key={ip.id} className={styles["ip-item"]}>
                <div className={styles["ip-info"]}>
                  <div className={styles["ip-address"]}>{ip.ip}</div>
                  <div className={styles["ip-details"]}>
                    <span className={styles["ip-reason"]}>{ip.reason}</span>
                    <span className={styles["ip-time"]}>{ip.blockedAt}</span>
                  </div>
                </div>
                <div className={styles["ip-actions"]}>
                  <ButtonComponent
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUnblockIP(ip.id)}
                  >
                    해제
                  </ButtonComponent>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={styles["security-container"]}>
      <ToggleComponent
        content={["로그 모니터링", "IP 관리"]}
        isNotify={null}
        viewNotify={() => {}}
        notifyIndex={0}
      >
        {[<LogMonitoring />, <IPManagement />]}
      </ToggleComponent>
    </div>
  );
}
