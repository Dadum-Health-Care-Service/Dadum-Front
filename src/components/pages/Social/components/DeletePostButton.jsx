import React from "react";
import { useApi } from "../../../../utils/api/useApi";

export default function DeletePostButton({ postId, onDeleted }) {
  const { DELETE } = useApi();
  const onDelete = async () => {
    if (!window.confirm("정말 삭제하시겠어요?")) return;
    try {
      await DELETE(`/posts/${postId}`);
      onDeleted?.();
    } catch (e) {
      alert("삭제 실패(권한/토큰 확인).");
      console.error(e);
    }
  };

  return (
    <button className="icon-txt" onClick={onDelete}>
      🗑️ 삭제
    </button>
  );
}
