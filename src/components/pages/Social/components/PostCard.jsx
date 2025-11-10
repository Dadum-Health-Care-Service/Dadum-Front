import React, { useEffect, useRef, useState } from "react";
import Comments from "./Comments.jsx";
import EditPostModal from "./EditPostModal.jsx";
import LikeButton from "./LikeButton.jsx";
import { useApi } from "../../../../utils/api/useApi";

// 유틸리티 함수들
const buildImageCandidates = (raw) => {
  if (!raw) return [];
  if (typeof raw === "string") return [raw];
  if (Array.isArray(raw)) return raw;
  return [];
};

const resolveImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("data:")) return imagePath; // Base64 데이터 URL 처리
  return `http://localhost:8080${imagePath}`;
};

const displayHandle = (userId, userEmail) => {
  if (userEmail) {
    return userEmail.split('@')[0];
  }
  return userId || "user";
};

// 이미지 실패 시 후보 URL 순차 시도
function SmartImage({ raw, alt = "", style }) {
  const [idx, setIdx] = useState(0);
  const candidates = buildImageCandidates(raw);

  if (!raw || candidates.length === 0) return null;

  const src = candidates[idx];
  if (!src) return null;

  return (
    <img
      src={src}
      alt={alt}
      style={style}
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

export default function PostCard({
  post,
  likeInfo,
  onLikeChange,
  onAfterMutate,
}) {
  const { DELETE } = useApi();
  const {
    postId,
    postTitle,
    postContent,
    postImage,
    userName,
    userId,
    userEmail,
    createdAt,
    profileImage,
    tags = [],
  } = post || {};

  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef(null);

  // 메뉴 바깥 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // 게시글 삭제
  const handleDelete = async () => {
    if (!window.confirm("이 게시글을 삭제할까요?")) return;

    try {
      await DELETE(`/posts/${postId}`);
      setMenuOpen(false);
      onAfterMutate?.();
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
    }
  };

  const profileSrc = profileImage ? resolveImageUrl(profileImage) : null;

  return (
    <article className="m-card">
      {/* 헤더 */}
      <header className="m-card-head">
        {profileSrc ? (
          <img className="avatar-img" src={profileSrc} alt="" />
        ) : (
          <span className="avatar" aria-hidden />
        )}
        <div className="meta">
          <div className="row1">
            <span className="name">{userName || "사용자"}</span>
            <span className="sub">
              @{displayHandle(userId, userEmail)} · {createdAt || ""}
            </span>
          </div>
        </div>

        {/* 케밥 버튼 */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className="more"
            aria-label="메뉴"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="popup-menu">
              <button
                className="menu-item"
                onClick={() => {
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
              >
                수정
              </button>
              <button className="menu-item danger" onClick={handleDelete}>
                삭제
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div className="m-card-body">
        {!!(postTitle && String(postTitle).trim()) && (
          <h4 className="text" style={{ marginTop: 4, marginBottom: 8 }}>
            {postTitle}
          </h4>
        )}
        <p className="text">{postContent}</p>

        {!!tags?.length && (
          <div className="tags">
            {tags.map((t, i) => (
              <span className="chip" key={i}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {!!postImage && (
          <div className="media">
            <SmartImage
              raw={postImage}
              alt=""
              style={{
                width: "100%",
                display: "block",
                borderRadius: 10,
                border: "1.5px solid #E5EDFF",
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 바 */}
      <div className="m-card-actions">
        <button
          className="icon-txt"
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-controls={`comments-${postId}`}
        >
          <span aria-hidden>💬</span>
          <span>댓글</span>
        </button>

        <LikeButton
          postId={postId}
          initialLiked={!!likeInfo?.isLiked}
          initialCount={likeInfo?.likeCount ?? 0}
          onChange={(data) => onLikeChange?.(data)}
        />
      </div>

      {/* 댓글 */}
      {commentsOpen && (
        <div id={`comments-${postId}`} className="m-card-comments">
          <Comments postId={postId} />
        </div>
      )}

      {/* 수정 모달 */}
      <EditPostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        post={post}
        onUpdated={() => {
          setEditOpen(false);
          onAfterMutate?.();
        }}
      />
    </article>
  );
}
