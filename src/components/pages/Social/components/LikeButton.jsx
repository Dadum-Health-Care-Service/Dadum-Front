// src/components/pages/Social/LikeButton.jsx
import { useState, useCallback } from "react";
import { useApi } from "../../../../utils/api/useApi";

export default function LikeButton({ postId, initialLiked = false, initialCount = 0, onChange }) {
  const { POST, DELETE } = useApi();
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount);

  const optimistic = (nextLiked) => {
    setLiked(nextLiked);
    setCount((n) => n + (nextLiked ? 1 : -1));
    onChange?.(nextLiked);
  };

  // 백엔드가 /likes/toggle 또는 POST/DELETE 를 쓰는 두 경우 모두 지원
  const toggle = useCallback(async () => {
    const next = !liked;
    optimistic(next);
    try {
      // 1차: 토글 엔드포인트 시도
      await POST(`/posts/${postId}/likes/toggle`, {});
    } catch (err1) {
      try {
        if (next) {
          await POST(`/posts/${postId}/likes`, {});   // 좋아요
        } else {
          await DELETE(`/posts/${postId}/likes`);      // 좋아요 취소
        }
      } catch (err2) {
        console.error("좋아요 토글 실패", err1, err2);
        // 롤백
        optimistic(!next);
      }
    }
  }, [POST, DELETE, postId, liked]);

  return (
    <button className={`like-button ${liked ? "on" : ""}`} onClick={toggle}>
      <span className="icon">♥</span>
      <span className="count">{count}</span>
    </button>
  );
}
