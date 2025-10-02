import React, { useEffect, useState } from "react";
import { useApi } from "../../../../utils/api/useApi";

export default function EditPostModal({ open, onClose, post, onUpdated }) {
  const [title, setTitle] = useState(post?.postTitle ?? "");
  const [content, setContent] = useState(post?.postContent ?? "");
  const [imageUrl, setImageUrl] = useState(post?.postImage ?? "");
  const { PUT } = useApi();

  useEffect(() => {
    if (open) {
      setTitle(post?.postTitle ?? "");
      setContent(post?.postContent ?? "");
      setImageUrl(post?.postImage ?? "");
    }
  }, [open, post]);

  if (!open) return null;

  const onSave = async () => {
    await PUT(`/posts/${post.postId}`, {
      postTitle: title,
      postContent: content,
      postImage: imageUrl,
    });
    onUpdated?.();
    onClose();
  };

  return (
    <div
      className="compose-modal open"
      role="dialog"
      aria-modal="true"
      aria-label="게시글 수정"
    >
      <div className="compose-backdrop" onClick={onClose} />
      <div className="compose-card">
        <div className="compose-card-head">
          <h4 className="compose-title">게시글 수정</h4>
          <button className="compose-close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className="compose-card-body">
          <input
            placeholder="제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <input
            placeholder="이미지 URL(/images/xxx 또는 http…)"
            value={imageUrl || ""}
            onChange={(e) => setImageUrl(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
          <div style={{ textAlign: "right" }}>
            <button onClick={onClose} style={{ marginRight: 8 }}>
              취소
            </button>
            <button onClick={onSave}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
