// /src/api.jsx  또는 /src/components/pages/Social/Api.jsx

import axios from "axios";

/** 프록시 사용 시 /api/v1, 아니면 .env의 VITE_API_BASE 사용 */
const API_BASE = import.meta.env.VITE_API_BASE || "/api/v1";

/* ───── 토큰/유저 유틸 ───── */
function readToken() {
  try {
    // 1) 흔한 키들에서 먼저 조회
    const keys = ["accessToken", "token", "AUTH_TOKEN", "Authorization"];
    for (const k of keys) {
      const v =
        localStorage.getItem(k) ||
        sessionStorage.getItem(k) ||
        null;
      if (v) {
        return String(v)
          .replace(/^"|"$/g, "")       // 양끝 따옴표 제거
          .replace(/^Bearer\s+/i, "")  // 'Bearer ' 접두사 제거
          .trim();
      }
    }
    // 2) user 객체 내부에 토큰이 있는 경우
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      const t = u?.accessToken || u?.token || u?.AUTH_TOKEN || null;
      if (t) {
        return String(t)
          .replace(/^"|"$/g, "")
          .replace(/^Bearer\s+/i, "")
          .trim();
      }
    }
  } catch {}
  return null;
}
export const hasToken = () => !!readToken();

function decodeJwtPayload(t) {
  try {
    const p = (t || "").split(".")[1] || "";
    const base64 = p.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

/** 현재 로그인 사용자: email, usersId(문자열), name, profileImage
 *  - 백엔드 로그인 응답에서 usersId / userId 다 지원
 *  - 하위 호환 위해 id도 함께 제공(= usersId || userId || email)
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    const u = raw ? JSON.parse(raw) : {};
    const token = readToken();
    const j = token ? decodeJwtPayload(token) : {};

    const email =
      u.email || u.userEmail || u.username || j.email || j.sub || "";

    // ✅ 숫자 ID 우선: usersId → userId → jwt 내 필드
    const usersId =
      u.usersId ?? u.userId ?? j.usersId ?? j.userId ?? null;

    const idLegacy = usersId ?? u.userId ?? u.username ?? email;

    return {
      email: String(email || "").toLowerCase(),
      usersId: usersId != null ? String(usersId) : "", // 댓글 비교에 사용
      id: String(idLegacy ?? ""),                      // 하위 호환
      name: u.name || u.nickname || u.userName || "",
      profileImage:
        u.profileImage || u.profileImageUrl || u.avatarUrl || null,
    };
  } catch {
    return { email: "", usersId: "", id: "", name: "", profileImage: null };
  }
}

export function sameUser(a = "", b = "") {
  const A = String(a || "").toLowerCase();
  const B = String(b || "").toLowerCase();
  return !!A && !!B && (A === B || A.split("@")[0] === B.split("@")[0]);
}

export function displayHandle(userId = "") {
  const s = String(userId || "");
  return s.includes("@") ? s.split("@")[0] : s;
}

function authHeader(isAuth) {
  const token = readToken();
  return isAuth && token ? { Authorization: `Bearer ${token}` } : {};
}

/* ───── 백엔드 오리진 & 이미지 URL 보정 ───── */
export const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  (API_BASE.startsWith("http")
    ? new URL(API_BASE).origin
    : "http://localhost:8080");

function cleanPath(u) {
  if (u == null) return null;
  return String(u).trim().replace(/^"|"$/g, "");
}

/** 대표 URL 1개 */
export function resolveImageUrl(u) {
  const raw = cleanPath(u);
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^[a-zA-Z]:[\\/]/.test(raw)) {
    const file = raw.split(/[/\\]/).pop();
    return `${BACKEND_ORIGIN}/images/${file}`;
    // 필요시 uploads 등 다른 경로를 추가로 시도하려면 buildImageCandidates 사용
  }
  if (raw.startsWith("/")) return `${BACKEND_ORIGIN}${raw}`;
  return `${BACKEND_ORIGIN}/images/${raw}`;
}

/** 후보 URL 여러 개(표시 실패 시 순차 시도) */
export function buildImageCandidates(u) {
  const raw = cleanPath(u);
  if (!raw) return [];
  const file = raw.split(/[/\\]/).pop();
  const base = BACKEND_ORIGIN;
  const arr = new Set();

  if (/^https?:\/\//i.test(raw)) arr.add(raw);
  if (raw.startsWith("/")) {
    arr.add(`${base}${raw}`);       // ex) /images/xxx.jpg
    arr.add(`${base}/api${raw}`);   // ex) /api/images/xxx.jpg
  }
  arr.add(`${base}/images/${file}`);
  arr.add(`${base}/uploads/${file}`);
  arr.add(`${base}/files/${file}`);
  arr.add(`${base}/api/v1/images/${file}`);
  arr.add(`${base}/${file}`);
  return Array.from(arr);
}

/* ───── 공통 HTTP ───── */
export function GET(url, params = {}, isAuth = true) {
  return axios.get(API_BASE + url, {
    params,
    headers: { ...authHeader(isAuth) },
  });
}
export function POST(url, data = {}, isAuth = true) {
  return axios.post(API_BASE + url, data ?? {}, {
    headers: { "Content-Type": "application/json", ...authHeader(isAuth) },
  });
}
export function PUT(url, data = {}, isAuth = true) {
  return axios.put(API_BASE + url, data ?? {}, {
    headers: { "Content-Type": "application/json", ...authHeader(isAuth) },
  });
}
export function DELETE(url, data = null, isAuth = true) {
  return axios.delete(API_BASE + url, {
    data: data ?? undefined,
    headers: { ...authHeader(isAuth) },
  });
}

/* ───── 소셜 API ───── */
export const fetchFeed       = () => GET("/posts/list", null, false);
export const fetchPostDetail = (postId) => GET(`/posts/${postId}`, null, true);

export const fetchLikes      = (postId) => GET(`/posts/${postId}/likes`, null, true);
export const toggleLike      = (postId) => POST(`/posts/${postId}/likes`, {}, true);

export const fetchComments   = (postId) => GET(`/posts/${postId}/comments`, null, true);
export const addComment      = (postId, content) => POST(`/posts/${postId}/comments`, { content }, true);
export const deleteComment   = (postId, commentId) => DELETE(`/posts/${postId}/comments/${commentId}`, null, true);

/** 댓글 수정(백엔드 PUT 존재 시 정상 동작, 없으면 fallback로 삭제 후 재작성) */
export async function updateComment(postId, commentId, content) {
  try {
    return await PUT(`/posts/${postId}/comments/${commentId}`, { content }, true);
  } catch (err) {
    const s = err?.response?.status;
    if (s === 404 || s === 405 || s === 501) {
      // 백엔드에 수정 API가 없는 프로젝트 대응
      await deleteComment(postId, commentId);
      return await addComment(postId, content);
    }
    throw err;
  }
}

/** 서버 다양한 키 → 프론트 표준키로 정규화(프로필 이미지 포함) */
export function normalizePost(p = {}) {
  const postId       = p.postId ?? p.id ?? p.post_id;
  const postTitle    = p.postTitle ?? p.title ?? "";
  const postContent  = p.postContent ?? p.content ?? "";
  const postImage    = p.postImage ?? p.imageUrl ?? p.image ?? p.postImageUrl ?? p.imgUrl ?? p.image_path ?? null;
  const userName     = p.userName ?? p.nickname ?? p.authorName ?? p.name ?? "사용자";
  const userId       = p.userId ?? p.usersId ?? p.userEmail ?? p.email ?? p.username ?? "user";
  const createdAt    = p.createdAt ?? p.createAt ?? p.created_at ?? p.regDate ?? p.reg_date ?? null;
  const profileImage = p.profileImage ?? p.profileImageUrl ?? p.userProfileImage ?? p.userImage ?? p.avatarUrl ?? null;
  const tags         = p.tags ?? p.hashTags ?? [];

  return {
    ...p,
    postId,
    postTitle,
    postContent,
    postImage,
    userName,
    userId,
    createdAt,
    profileImage,
    tags,
  };
}

/** 게시글 생성(업로드 응답은 그대로 DB에 저장, 렌더링 때만 URL 보정) */
export async function createPost({ content, imageFile, title }) {
  let postImage = null;
  if (imageFile) {
    const form = new FormData();
    form.append("file", imageFile);
    const up = await axios.post(`${BACKEND_ORIGIN}/api/v1/posts/upload`, form, {
      headers: { "Content-Type": "multipart/form-data", ...authHeader(true) },
    });
    postImage = up.data ?? null; // ← 절대 URL로 바꾸지 말고 그대로 저장
  }
  const safeTitle =
    typeof title === "string" && title.length > 0 ? title : " ";
  return POST("/posts", { postTitle: safeTitle, postContent: content, postImage }, true);
}

export const updatePost = (id, { title, content, imageUrl }) => {
  const safeTitle =
    typeof title === "string" && title.length > 0 ? title : " ";
  return PUT(`/posts/${id}`, { postTitle: safeTitle, postContent: content, postImage: imageUrl ?? null }, true);
};

export const deletePost = (id) => DELETE(`/posts/${id}`, null, true);
