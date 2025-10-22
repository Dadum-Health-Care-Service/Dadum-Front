import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import "./Social.css";
import PostCard from "./components/PostCard.jsx";
import { useApi } from "../../../utils/api/useApi";

/* ===== util ===== */
function toTime(v) {
  if (!v) return 0;
  const d = new Date(v);
  if (!isNaN(d)) return d.getTime();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function sortPosts(list) {
  return [...(list || [])].sort((a, b) => {
    const ta = toTime(a?.createdAt);
    const tb = toTime(b?.createdAt);
    if (tb !== ta) return tb - ta;
    const ia = Number(a?.postId ?? 0);
    const ib = Number(b?.postId ?? 0);
    return ib - ia;
  });
}
function extractLikeInfo(p) {
  const isLiked = !!(p?.likedByMe ?? p?.isLiked ?? p?.liked ?? p?.userLiked ?? false);
  const rawCount = p?.likeCount ?? p?.likes ?? p?.like_count ?? p?.totalLikes ?? 0;
  return { isLiked, likeCount: Number(rawCount) || 0 };
}
function normalizeMe(d) {
  if (!d) return null;
  return {
    id: d.id ?? d.userId ?? d.memberId ?? d.username ?? "",
    handle: d.username ?? d.userId ?? d.handle ?? d.loginId ?? "",
    name: d.name ?? d.nickname ?? d.displayName ?? d.userName ?? "사용자",
    avatar: d.profileImage ?? d.avatar ?? d.imageUrl ?? d.photoUrl ?? d.picture ?? "",
  };
}

/* ===== 작성 모달 ===== */
function ComposeModal({ open, onClose, onSubmit, me }) {
  const { POST } = useApi();
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) document.body.classList.add("modal-open");
    else document.body.classList.remove("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, [open]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const canPost = text.trim().length > 0;

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result; // data:image/...;base64,....
      setImageFile(base64String);
      setPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);
      await POST("/posts", {
        postContent: text,
        postImage: imageFile ? imageFile : "/images/default.png",
        visibility,
      });
      setText("");
      setImageFile(null);
      setPreview(null);
      onClose();
      onSubmit(); // 피드 새로고침
    } catch (error) {
      console.error("게시글 작성 실패:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="compose-modal open" role="dialog" aria-modal="true" aria-label="게시글 작성">
      <div className="compose-backdrop" onClick={onClose} />
      <div className="compose-card">
        <div className="compose-card-head">
          <h4 className="compose-title">게시글 작성</h4>
          <button className="compose-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="compose-card-body">
          {/* 작성자 미니 프로필 */}
          <div className="compose-author">
            <img
              src={me?.avatar || "/images/default-avatar.png"}
              alt=""
              className="compose-author__img"
            />
            <div className="compose-author__meta">
              <div className="compose-author__name">{me?.name || "사용자"}</div>
              <div className="compose-author__id">@{me?.handle || me?.id || "user"}</div>
            </div>
          </div>

          <div className="compose-row" style={{ marginTop: 8 }}>
            <textarea
              className="textarea"
              placeholder="무슨 일이 벌어지고 있나요?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
            />
          </div>

          {preview && <img src={preview} alt="" className="compose-preview" />}

          <div className="compose-actions">
            <div className="tools">
              <label className="tool-btn" aria-label="사진 첨부">
                <span className="ico">🖼️</span>
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
              </label>
              <button className="tool-btn" type="button" aria-label="효과">🕺</button>
            </div>

            <div className="submit">
              <div className="select pill pill--sm visibility">
                <select aria-label="공개 범위" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">공개</option>
                  <option value="followers">팔로워</option>
                  <option value="private">비공개</option>
                </select>
              </div>
              <button
                className={`post-btn cta${!canPost || uploading ? " disabled" : ""}`}
                type="button"
                disabled={!canPost || uploading}
                onClick={handleSubmit}
              >
                {uploading ? "업로드 중..." : "게시하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== 페이지 ===== */
export default function Social() {
  const { GET } = useApi();
  const getRef = useRef(GET);        // GET 레퍼런스 고정

  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  /* 하단 네비 높이 → CSS var */
  useEffect(() => {
    const root = document.documentElement;
    const pickNav = () =>
      document.querySelector(".bottom-navigation, .bottomNavigation, .bottom-nav, .bottomNav, .bottomBar");
    const setVar = () => {
      const nav = pickNav();
      const h = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
      root.style.setProperty("--bottom-nav-h", `${h}px`);
    };
    setVar();
    window.addEventListener("resize", setVar);
    const nav = pickNav();
    const mo = nav ? new MutationObserver(setVar) : null;
    if (nav && mo) mo.observe(nav, { attributes: true, childList: true, subtree: true });
    return () => { window.removeEventListener("resize", setVar); mo?.disconnect(); };
  }, []);

  /* 현재 사용자 — 백엔드 실제 경로에 맞춰 변경 */
  const ME_ENDPOINT = "/members/me"; // 예: '/auth/me' 또는 '/users/me'

  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        const r = await getRef.current(ME_ENDPOINT);
        if (aborted) return;
        const nm = normalizeMe(r?.data);
        if (nm) setMe(nm);
      } catch { /* 미표시만, 조용히 무시 */ }
    })();
    return () => { aborted = true; };
  }, []);

  /* 피드 */
  const loadFeed = useCallback(async () => {
    try {
      setLoading(true);
      const resp =
        tab === "all" ? await getRef.current("/posts/list") : await getRef.current("/posts");
      const list = Array.isArray(resp?.data) ? resp.data : [];
      setPosts(sortPosts(list));
    } catch (e) {
      console.error("피드 로딩 실패:", e);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { loadFeed(); }, [tab, loadFeed]);

  const handleLikeChange = useCallback(({ postId, liked, count }) => {
    setPosts((prev) =>
      prev.map((p) => {
        const pid = p.postId ?? p.id;
        if (pid !== postId) return p;
        const current = extractLikeInfo(p).likeCount;
        const nextCount =
          typeof count === "number" ? count : Math.max(0, current + (liked ? 1 : -1));
        return {
          ...p,
          likedByMe: !!liked,
          isLiked: !!liked,
          liked: !!liked,
          userLiked: !!liked,
          likeCount: nextCount,
          likes: nextCount,
          like_count: nextCount,
          totalLikes: nextCount,
        };
      })
    );
  }, []);

  const filtered = useMemo(() => (tab === "all" ? posts : posts.slice(0, 20)), [tab, posts]);

  /* 단축키: N → 작성 */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "n" || e.key === "N") && !isComposeOpen) {
        e.preventDefault();
        setComposeOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isComposeOpen]);

  return (
    <div className="social-page">
      {/* ===== 상단 툴바: 스크롤 시 고정됨 (CSS로 처리) ===== */}
      <div className="page-toolbar">
        <div className="left">
          <div className="seg" role="tablist" aria-label="피드 범위 선택">
            <button
              className={`seg-btn ${tab === "all" ? "is-active" : ""}`}
              onClick={() => setTab("all")}
              role="tab"
              aria-selected={tab === "all"}
            >전체</button>
            <button
              className={`seg-btn ${tab === "following" ? "is-active" : ""}`}
              onClick={() => setTab("following")}
              role="tab"
              aria-selected={tab === "following"}
            >내 게시글</button>
          </div>
        </div>
        <div className="right">
          {/* [수정] desktop-write 클래스 제거: 모바일/데스크톱 모두 상단 버튼 사용 */}
          <button className="btn-primary" onClick={() => setComposeOpen(true)}>
            ✍️ 글쓰기
          </button>
        </div>
      </div>

      {/* ===== 3-열 그리드 ===== */}
      <div className="page-grid">
        {/* 좌측 사이드 */}
        <aside className="col left-col">
          {/* [수정] 미니 사용자 프로필 삭제됨 */}
        </aside>

        {/* 가운데 피드 */}
        <main className="col feed-col">
          {loading ? (
            <div className="loading">게시글을 불러오는 중...</div>
          ) : (
            <div className="m-feed">
              {filtered.map((p) => {
                const likeInfo = extractLikeInfo(p);
                return (
                  <PostCard
                    key={p.postId ?? p.id}
                    post={p}
                    likeInfo={likeInfo}
                    onLikeChange={handleLikeChange}
                    onAfterMutate={loadFeed}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* 우측 사이드(향후 위젯/추천 영역) */}
        <aside className="col right-col">
          {/* 필요시 컴포넌트 배치 */}
        </aside>
      </div>

      {/* [수정] 모바일 전용 FAB 버튼 삭제됨 */}

      {/* 작성 모달 */}
      <ComposeModal
        open={isComposeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={loadFeed}
        me={me}
      />
    </div>
  );
}