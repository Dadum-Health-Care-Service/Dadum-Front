import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useApi } from "../../../../utils/api/useApi";

/** 단일 토글: POST /api/v1/posts/{postId}/likes */
const LikeButton = forwardRef(function LikeButton(
  { postId, initialLiked = false, initialCount = 0, onChange },
  ref
) {
  const { POST } = useApi();
  // 상태 초기화: 컴포넌트가 마운트될 때 initial props를 사용해 한 번만 초기화
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(Number(initialCount) || 0);
  const [pending, setPending] = useState(false);
  const btnRef = useRef(null);

  // 🚫 불필요한 useEffect 제거됨. (이것이 가장 중요)

  const toggle = useCallback(async () => {
    if (pending) return;
    if (postId === undefined || postId === null) return;

    setPending(true);
    const prevLiked = liked;
    const prevCount = count;
    const next = !liked;
    const optimisticCount = prevCount + (next ? 1 : -1);

    // 낙관 갱신
    setLiked(next);
    setCount(optimisticCount);
    onChange?.({ postId, liked: next, count: optimisticCount, optimistic: true });

    try {
      const res = await POST(`/posts/${postId}/likes`, {}); // 토글
      const data = res?.data || {};
      const finalLiked = typeof data.liked === "boolean" ? data.liked : next;
      const finalCount = typeof data.count === "number" ? data.count : optimisticCount;

      setLiked(finalLiked);
      setCount(finalCount);
      onChange?.({ postId, liked: finalLiked, count: finalCount });
    } catch (e) {
      // 롤백
      setLiked(prevLiked);
      setCount(prevCount);
      onChange?.({ postId, liked: prevLiked, count: prevCount, rollback: true });
      console.error("[LikeButton] 토글 실패:", e);
      alert("좋아요 처리 중 문제가 발생했습니다. (경로/권한 확인)");
    } finally {
      setPending(false);
    }
  }, [POST, postId, liked, count, pending, onChange]);

  // 부모가 toggle과 버튼 DOM을 쓸 수 있게 노출
  useImperativeHandle(ref, () => ({ toggle, el: btnRef.current }), [toggle]);

  // 버튼 자체도 onClick 유지(정상 경로)
  const onButtonClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <button
      ref={btnRef}
      type="button"
      className={`like-button ${liked ? "on" : ""}`}
      disabled={pending}
      onClick={onButtonClick}
      aria-pressed={liked}
      title={liked ? "좋아요 취소" : "좋아요"}
      data-testid={`like-btn-${postId}`}
      style={{
        pointerEvents: pending ? "none" : "auto",
        cursor: pending ? "default" : "pointer",
        position: "relative",
        zIndex: 2147483647, // 최상위
        userSelect: "none",
      }}
    >
      <span className="icon" aria-hidden>♥</span>
      <span className="count">{count}</span>
    </button>
  );
});

export default LikeButton;