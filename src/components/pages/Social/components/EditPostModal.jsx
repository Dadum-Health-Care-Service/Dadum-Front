import React, { useEffect, useState } from "react";
import { useApi } from "../../../../utils/api/useApi";
import ButtonComponent from "../../../common/ButtonComponent";
import { FaCamera } from "react-icons/fa";

export default function EditPostModal({ open, onClose, post, onUpdated }) {
  const [title, setTitle] = useState(post?.postTitle ?? "");
  const [content, setContent] = useState(post?.postContent ?? "");
  const [imageFile, setImageFile] = useState("");
  const [preview, setPreview] = useState("");
  const [imageUrl, setImageUrl] = useState(post?.postImage ?? "");
  const { PUT } = useApi();

  useEffect(() => {
    if (open) {
      setTitle(post?.postTitle ?? "");
      setContent(post?.postContent ?? "");
      setImageUrl(post?.postImage ?? "");
      setImageFile(post?.postImage ?? "");
      setPreview(post?.postImage ?? "");
    }
  }, [open, post]);
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  if (!open) return null;

  const onSave = async () => {
    await PUT(`/posts/${post.postId}`, {
      postTitle: title,
      postContent: content,
      postImage: imageFile,
    });
    onUpdated?.();
    onClose();
  };
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result; // data:image/...;base64,....
      console.log(base64String);
      setImageFile(base64String);
      setPreview(base64String);
    };
    reader.readAsDataURL(file);
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
          <textarea
            placeholder="내용"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{ width: "100%", marginBottom: 8 }}
          />
          {/* 이미지 미리보기 */}
          {preview && <img src={preview} alt="" className="compose-preview" />}

          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={onFileChange}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "8px",
            }}
          >
            <label className="tool-btn" aria-label="사진 첨부">
              <span className="ico">
                <FaCamera />
              </span>
              <span className="tool-label">사진</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onFileChange}
              />
            </label>
            <div style={{ display: "flex", gap: "4px" }}>
              <ButtonComponent onClick={onSave}>저장</ButtonComponent>
              <ButtonComponent onClick={onClose} variant="secondary">
                취소
              </ButtonComponent>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
