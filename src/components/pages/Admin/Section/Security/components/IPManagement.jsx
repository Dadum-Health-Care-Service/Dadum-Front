import React, { memo, useEffect } from "react";
import InputComponent from "../../../../../common/InputComponent";
import ButtonComponent from "../../../../../common/ButtonComponent";
import styles from "../Security.module.css";

const IPManagement = memo(function IPManagement({
  blockedIPs,
  ipInputRef,
  reasonInputRef,
  ip,
  reason,
  setIp,
  setReason,
  handleBlockIP,
  handleUnblockIP,
}) {
  
  return (
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
            ref={ipInputRef}
            value={ip}
            onChange={(e) => setIp(e.target.value)}
            className={styles["ip-input"]}
          />
          <InputComponent
            placeholder="차단 사유"
            ref={reasonInputRef}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={styles["reason-input"]}
          />
          <ButtonComponent
            variant="primary"
            onClick={handleBlockIP}
            disabled={!ip || !reason}
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
                  <div className={styles["ip-address"]}>{ip.ipAddress}</div>
                  <div className={styles["ip-details"]}>
                    <span className={styles["ip-reason"]}>{ip.reason}</span>
                    <span className={styles["ip-time"]}>{ip.blockedAt}</span>
                  </div>
                </div>
                <div className={styles["ip-actions"]}>
                  <ButtonComponent
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUnblockIP(ip.ipAddress)}
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
});

export default IPManagement;
