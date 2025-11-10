import React, { useState, useEffect, useRef } from "react";
import ContainerComponent from "../../../../common/ContainerComponent";
import ButtonComponent from "../../../../common/ButtonComponent";
import InputComponent from "../../../../common/InputComponent";
import ToggleComponent from "../../../../common/ToggleComponent";
import { useApi } from "../../../../../utils/api/useApi";
import IPManagement from "./components/IPManagement";
import styles from "./Security.module.css";

export default function Security() {
  const [logs, setLogs] = useState([]);
  const [blockedIPs, setBlockedIPs] = useState([]);
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const ipInputRef = useRef(null);
  const reasonInputRef = useRef(null);
  const logContainerRef = useRef(null);
  let ws = null;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 3;
  const { GET, POST } = useApi();

  function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return;
    }

    ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL + ":8000/ws");

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
      let parsed;
      try {
        parsed = JSON.parse(event.data);
      } catch (e) {
        // 문자열 그대로 오는 경우 대비
        parsed = { log_data: { raw_log: event.data } };
      }

      const raw = parsed?.log_data?.raw_log;
      const safeText =
        typeof raw === "string"
          ? raw
          : (() => {
              try {
                return JSON.stringify(raw);
              } catch (_) {
                return String(raw);
              }
            })();

      setLogs((prev) => {
        const next = [...prev, safeText];
        // 너무 많아지지 않도록 최근 1000개만 유지
        return next.length > 1000 ? next.slice(-1000) : next;
      });
    };

    ws.onerror = function (error) {
      console.error("WebSocket 에러:", error);
    };
  }

  const fetchBlockedIPs = async () => {
    const res = await GET("/firewall/blocked-details", {}, false);
    setBlockedIPs(res.data.blockedDetails);
  };

  useEffect(() => {
    fetchBlockedIPs();
    connectWebSocket();
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleBlockIP = () => {
    if (ip && reason) {
      const blockIp = async () => {
        const newBlockedIP = {
          ipAddress: ip,
          reason: reason,
        };
        const res = await POST("/firewall/block", newBlockedIP, false);
        setBlockedIPs((prev) => [...prev, newBlockedIP]);
        setIp("");
        setReason("");
      };
      blockIp();
    }
  };

  const handleUnblockIP = (ipAddress) => {
    const unblockIp = async () => {
      const unblockedIP = {
        ipAddress: ipAddress,
      };
      const res = await POST("/firewall/unblock", unblockedIP, false);
      setBlockedIPs((prev) => prev.filter((ip) => ip.ipAddress !== ipAddress));
      setIp("");
      setReason("");
    };
    unblockIp();
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

  return (
    <div className={styles["security-container"]}>
      <ToggleComponent
        content={["로그 모니터링", "IP 관리"]}
        isNotify={null}
        viewNotify={() => {}}
        notifyIndex={0}
        onChange={(idx) => {
          if (idx === 1) {
            fetchBlockedIPs();
          }
        }}
      >
        {[
          <LogMonitoring />,
          <IPManagement
            blockedIPs={blockedIPs}
            ipInputRef={ipInputRef}
            reasonInputRef={reasonInputRef}
            ip={ip}
            reason={reason}
            setIp={setIp}
            setReason={setReason}
            handleBlockIP={handleBlockIP}
            handleUnblockIP={handleUnblockIP}
          />,
        ]}
      </ToggleComponent>
    </div>
  );
}
