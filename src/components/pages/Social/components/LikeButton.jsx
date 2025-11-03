// src/components/pages/Social/LikeButton.jsx
import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useApi } from "../../../../utils/api/useApi";

export default function LikeButton({
  postId,
  initialLiked = false,
  initialCount = 0,
  onChange,
}) {
  const { POST, GET } = useApi();
  const [liked, setLiked] = useState(!!initialLiked);
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const getLikes = async () => {
      await GET(`/posts/${postId}/likes`).then((res) => {
        setCount(res.data.likeCount);
      });
    };
    getLikes();
  }, [liked]);

  // 백엔드가 /likes/toggle 또는 POST/DELETE 를 쓰는 두 경우 모두 지원
  const toggle = async () => {
    await POST(`/posts/${postId}/likes`, {}).then((res) => {
      setLiked((prev) => {
        return !prev;
      });
    });
  };

  return (
    <button
      className={`like-button ${liked ? "on" : ""}`}
      onClick={toggle}
      style={{
        display: "flex",
        gap: "4px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <span className="icon">
        {liked ? <FaHeart style={{ color: "red" }} /> : <FaRegHeart />}
      </span>
      <span className="count">{count}</span>
    </button>
  );
}
