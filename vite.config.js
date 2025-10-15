import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";
// https://vitejs.dev/config/

// Service Worker 환경변수 치환 플러그인
function serviceWorkerEnvPlugin() {
  return {
    name: "service-worker-env",
    generateBundle() {
      // 빌드 시점에 환경변수로 치환
      const swPath = path.resolve(__dirname, "public/firebase-messaging-sw.js");
      let swContent = fs.readFileSync(swPath, "utf8");

      // 환경변수 치환
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_API_KEY\}\}/g,
        process.env.VITE_FIREBASE_API_KEY || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_AUTH_DOMAIN\}\}/g,
        process.env.VITE_FIREBASE_AUTH_DOMAIN || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_PROJECT_ID\}\}/g,
        process.env.VITE_FIREBASE_PROJECT_ID || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_STORAGE_BUCKET\}\}/g,
        process.env.VITE_FIREBASE_STORAGE_BUCKET || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_MESSAGING_SENDER_ID\}\}/g,
        process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_APP_ID\}\}/g,
        process.env.VITE_FIREBASE_APP_ID || ""
      );
      swContent = swContent.replace(
        /\{\{VITE_FIREBASE_MEASUREMENT_ID\}\}/g,
        process.env.VITE_FIREBASE_MEASUREMENT_ID || ""
      );

      // dist 폴더에 치환된 파일 복사
      this.emitFile({
        type: "asset",
        fileName: "firebase-messaging-sw.js",
        source: swContent,
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), serviceWorkerEnvPlugin()],
    // define: {
    //   global: 'globalThis',
    // },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    base: "/", //배포하려는 서버 상황에 맞게 절대 경로로 설정(기본값:/)
    server: {
      port: 3000, // 개발 서버 포트 설정 (기본값: 5173)
      open: true, // 개발 서버 실행 시 자동으로 브라우저 열기
      allowedHosts: "all",
      proxy: {
        "/api": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
        "/passwordless": {
          target: env.PASSWORDLESS_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/passwordless/, "/api/Login"),
        },
        "/passwordless-ws": {
          target: env.PASSWORDLESS_URL + ":15010",
          changeOrigin: true,
          secure: false,
          ws: true,
        },
        "/security": {
          target: env.SECURITY_URL + ":8010/main",
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/security/, ""), // /security -> /main
        },
        "/ml": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/ml/, ""), // ★ /ml 접두어 제거해서 /analyze-coach로 전달
        },
      },
    },

    build: {
      outDir: "dist", // 빌드 결과물 폴더 지정
    },
  };
});
