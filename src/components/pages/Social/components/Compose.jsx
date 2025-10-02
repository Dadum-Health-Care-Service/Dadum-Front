import React, { useState } from "react";

export default function Compose({ onSubmit }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState(null);

  const canPost = content.trim().length > 0;

  const handlePost = async () => {
    await onSubmit({ title: title || "무제", content, imageFile });
    setTitle(""); setContent(""); setImageFile(null);
  };

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 12, marginBottom: 16 }}>
      <input
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <textarea
        placeholder="내용을 입력하세요"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        style={{ width: "100%", marginBottom: 8 }}
      />
      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
      <div style={{ marginTop: 8 }}>
        <button onClick={handlePost} disabled={!canPost} aria-disabled={!canPost}>게시</button>
      </div>
    </div>
  );
}
