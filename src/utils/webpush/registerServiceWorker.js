export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    // window.load 이벤트 대신 즉시 등록 시도
    navigator.serviceWorker
      .register("/firebase-messaging-sw.js")
      .then(function (registration) {
        console.log("Service Worker 등록 성공:", registration);

        // 등록 상태 확인
        if (registration.installing) {
          console.log("Service Worker 설치 중...");
          registration.installing.addEventListener("statechange", (e) => {
            if (e.target.state === "activated") {
              console.log("Service Worker 활성화 완료");
            }
          });
        } else if (registration.active) {
          console.log("Service Worker 이미 활성 상태");
        }
      })
      .catch(function (error) {
        console.error("Service Worker 등록 실패:", error);
      });
  }
}
