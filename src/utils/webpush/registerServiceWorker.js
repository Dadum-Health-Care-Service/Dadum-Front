export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(function (registration) {
          //console.log("Service Worker 등록됨", registration);
        })
        .catch(function (error) {
          //console.log("Service Worker 등록 실패", error);
        });
    });
  }
}
