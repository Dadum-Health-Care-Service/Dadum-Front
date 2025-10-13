import { getMessaging, getToken } from "firebase/messaging";
import { app } from "../../../firebase";
import { registerServiceWorker } from "./registerServiceWorker";
import { POST } from "../api/api";

export async function handleAllowNotification(accessToken) {
  registerServiceWorker();
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const messaging = getMessaging(app);
      const token = await getToken(getMessaging(), {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      });
      if (token) {
        await POST(
          "/users/webpush/token",
          {
            token: token,
          },
          accessToken,
          true
        );
      } else {
        alert("토큰 등록이 불가능합니다. 다시 시도해주세요.");
      }
    } else if (permission === "denied") {
      console.log("알림 권한이 거절되었습니다. 설정에서 다시 허용해주세요.");
    } else {
      console.log("알림 권한이 거절되었습니다. 설정에서 다시 허용해주세요.");
    }
  } catch (error) {
    console.error("푸시 토큰 가져오는 중 에러 발생:", error);
  }
}
