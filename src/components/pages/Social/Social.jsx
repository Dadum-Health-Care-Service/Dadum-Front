import React, { useEffect, useMemo, useState } from "react";
import "./Social.css";
import PostCard from "./components/PostCard.jsx";

import {
  fetchFeed,
  fetchLikes,
  fetchPostDetail,
  createPost,
  hasToken,
  normalizePost,
} from "./Api.jsx";

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
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [visibility, setVisibility] = useState("public");

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
    await onSubmit({ content: text, imageFile });
    setText("");
    setImageFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onClose();
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
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={onFileChange} />
              </label>
              <button className="tool-btn" type="button" aria-label="효과">🕺</button>
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
                className={`post-btn cta${!canPost ? " disabled" : ""}`}
                type="button"
                disabled={!canPost}
                onClick={handleSubmit}
              >
                게시하기
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
  const [tab, setTab] = useState("all");
  const [posts, setPosts] = useState([]);
  const [likesMap, setLikesMap] = useState({});
  const [isComposeOpen, setComposeOpen] = useState(false);

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
    if (nav && mo) mo.observe(nav, { attributes: true, childList: true, subtree: true });
    return () => {
      window.removeEventListener("resize", setVar);
      mo?.disconnect();
    };
  }, []);

  /* 피드 로딩: 정규화 → 필요 시 단건 보충 → 최신순 */
  const loadFeed = async () => {
    const { data } = await fetchFeed();
    let list = Array.isArray(data) ? data.map(normalizePost) : [];

    const needDetails = list.filter((p) => p.postId && !p.postImage);
    if (needDetails.length) {
      const details = await Promise.all(
        needDetails.map((p) =>
          fetchPostDetail(p.postId)
            .then((r) => normalizePost(r.data))
            .catch(() => null)
        )
      );
      const byId = Object.fromEntries(details.filter(Boolean).map((d) => [d.postId, d]));
      list = list.map((p) => (byId[p.postId]?.postImage ? { ...p, postImage: byId[p.postId].postImage } : p));
    }

    list = sortPosts(list);
    setPosts(list);

    const map = {};
    if (hasToken()) {
      const pairs = await Promise.all(
        list.map((p) => fetchLikes(p.postId).then((r) => r.data).catch(() => null))
      );
      pairs.forEach((d) => {
        if (d) map[d.postId] = { isLiked: d.isLiked, likeCount: d.likeCount };
      });
    }
    setLikesMap(map);
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const filtered = useMemo(() => (tab === "all" ? posts : posts.slice(0, 20)), [tab, posts]);

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
            팔로워
          </button>
        </div>
      </div>

      <div className="m-feed">
        {filtered.map((p) => (
          <PostCard
            key={p.postId}
            post={p}
            likeInfo={likesMap[p.postId]}
            onLikeChange={(data) =>
              setLikesMap((prev) => ({
                ...prev,
                [data.postId]: {
                  isLiked: data.isLiked,
                  likeCount: data.likeCount,
                },
              }))
            }
            onAfterMutate={loadFeed}
          />
        ))}
      </div>

      <button className="compose-fab" aria-label="게시글 작성" onClick={() => setComposeOpen(true)}>
        ✍️ 글쓰기
      </button>

      <ComposeModal
        open={isComposeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={async ({ content, imageFile }) => {
          await createPost({ content, imageFile });
          await loadFeed(); // 최신순 갱신
        }}
      />
    </div>
  );
}
