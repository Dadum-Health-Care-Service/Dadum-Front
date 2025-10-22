const BACKEND_ORIGIN = "http://localhost:8080";

export function toAbsImage(url) {
  if (!url) return url;
  if (url.startsWith("/images/")) return `${BACKEND_ORIGIN}${url}`;
  return url; // 이미 절대경로면 그대로
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
