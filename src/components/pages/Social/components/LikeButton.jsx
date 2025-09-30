import React, { useState } from "react";
import { toggleLike } from "../Api.jsx";

export default function LikeButton({ postId, initialLiked = false, initialCount = 0, onChange }) {
  const [liked, setLiked]   = useState(initialLiked);
  const [count, setCount]   = useState(initialCount);
  const optimistic = () => {
    const nextLiked = !liked;
    const nextCnt   = nextLiked ? count + 1 : count - 1;
    setLiked(nextLiked); setCount(nextCnt);
  };

  const onClick = async () => {
    const prev = { liked, count };
    optimistic();
    try {
      const { data } = await toggleLike(postId);
      setLiked(!!data.isLiked);
      setCount(data.likeCount ?? 0);
      onChange?.(data);
    } catch (e) {
      // 롤백
      setLiked(prev.liked); setCount(prev.count);
      alert("좋아요 처리에 실패했습니다. 로그인/네트워크 상태를 확인해 주세요.");
    }
  };

  return (
    <button
      className={`icon-txt ${liked ? "liked" : ""}`}
      onClick={onClick}
      aria-pressed={liked}
      title={liked ? "좋아요 취소" : "좋아요"}
    >
      <span aria-hidden>❤️</span>
      <span>{count}</span>
    </button>
  );
}
