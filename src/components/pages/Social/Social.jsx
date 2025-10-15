import React, { useEffect, useMemo, useState } from "react";
import "./Social.css";
import PostCard from "./components/PostCard.jsx";
import { useApi } from "../../../utils/api/useApi";

/* util: date → number */
function toTime(v) {
  if (!v) return 0;
  const d = new Date(v);
  if (!isNaN(d)) return d.getTime();
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* 최신순: createdAt desc → postId desc */
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

/* 작성 모달 */
function ComposeModal({ open, onClose, onSubmit }) {
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
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const canPost = text.trim().length > 0;

  const onFileChange = (e) => {
    const f = e.target.files?.[0] ?? null;
    setImageFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async () => {
    try {
      setUploading(true);

      let imageUrl = null;
      if (imageFile) {
        // 이미지 업로드
        const formData = new FormData();
        formData.append("image", imageFile);
        const uploadResponse = await POST("/posts/upload", formData);
        imageUrl = uploadResponse.data.imageUrl;
      }

      // 게시글 작성
      await POST("/posts", {
        postContent: text,
        postImage: imageUrl,
        visibility: visibility,
      });

      setText("");
      setImageFile(null);
      if (preview) URL.revokeObjectURL(preview);
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
    <div
      className="compose-modal open"
      role="dialog"
      aria-modal="true"
      aria-label="게시글 작성"
    >
      <div className="compose-backdrop" onClick={onClose} />
      <div className="compose-card">
        <div className="compose-card-head">
          <h4 className="compose-title">게시글 작성</h4>
          <button className="compose-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="compose-card-body">
          <div className="compose-row">
            <textarea
              className="textarea"
              placeholder="어떤 운동을 하셨나요?"
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
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={onFileChange}
                />
              </label>
              <button className="tool-btn" type="button" aria-label="효과">
                🕺
              </button>
            </div>

            <div className="submit">
              <div className="select pill pill--sm visibility">
                <select
                  aria-label="공개 범위"
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                >
                  <option value="public">공개</option>
                  <option value="followers">팔로워</option>
                  <option value="private">비공개</option>
                </select>
              </div>
              <button
                className={`post-btn cta${
                  !canPost || uploading ? " disabled" : ""
                }`}
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

/* 페이지 */
export default function Social() {
  const { GET } = useApi();
  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  /* 하단 네비 높이 → CSS var */
  useEffect(() => {
    const root = document.documentElement;
    const pickNav = () =>
      document.querySelector(
        ".bottom-navigation, .bottomNavigation, .bottom-nav, .bottomNav, .bottomBar"
      );
    const setVar = () => {
      const nav = pickNav();
      const h = nav ? Math.ceil(nav.getBoundingClientRect().height) : 0;
      root.style.setProperty("--bottom-nav-h", `${h}px`);
    };
    setVar();
    window.addEventListener("resize", setVar);
    const nav = pickNav();
    const mo = nav ? new MutationObserver(setVar) : null;
    if (nav && mo)
      mo.observe(nav, { attributes: true, childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", setVar);
      mo?.disconnect();
    };
  }, []);

  /* 피드 로딩 */
  const loadFeed = async () => {
    try {
      setLoading(true);
      let response;

      if (tab === "all") {
        // 전체 게시글 목록 조회
        response = await GET("/posts/list");
      } else {
        // 내 게시글 목록 조회
        response = await GET("/posts");
      }

      const list = Array.isArray(response.data) ? response.data : [];
      setPosts(sortPosts(list));
    } catch (error) {
      console.error("피드 로딩 실패:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [tab]);

  const filtered = useMemo(
    () => (tab === "all" ? posts : posts.slice(0, 20)),
    [tab, posts]
  );

  return (
    <div className="social-root">
      <div className="m-toolbar">
        <div className="seg" role="tablist" aria-label="피드 범위 선택">
          <button
            className={`seg-btn ${tab === "all" ? "is-active" : ""}`}
            onClick={() => setTab("all")}
            role="tab"
            aria-selected={tab === "all"}
          >
            전체
          </button>
          <button
            className={`seg-btn ${tab === "following" ? "is-active" : ""}`}
            onClick={() => setTab("following")}
            role="tab"
            aria-selected={tab === "following"}
          >
            내 게시글
          </button>
        </div>
      </div>

      <div className="m-feed">
        {loading ? (
          <div className="loading">게시글을 불러오는 중...</div>
        ) : (
          filtered.map((p) => (
            <PostCard key={p.postId} post={p} onAfterMutate={loadFeed} />
          ))
        )}
      </div>

      <button
        className="compose-fab"
        aria-label="게시글 작성"
        onClick={() => setComposeOpen(true)}
      >
        ✍️ 글쓰기
      </button>

      <ComposeModal
        open={isComposeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={loadFeed}
      />
    </div>
  );
}
