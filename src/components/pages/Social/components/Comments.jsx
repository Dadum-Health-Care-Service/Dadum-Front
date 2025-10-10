// /src/components/pages/Social/components/Comments.jsx
import React, { useEffect, useState } from "react";
import { useApi } from "../../../../utils/api/useApi";

export default function Comments({ postId }) {
  const { GET, POST, PUT, DELETE } = useApi();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");

  // 댓글 목록 조회
  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await GET(`/posts/${postId}/comments`);
      setComments(response.data || []);
    } catch (error) {
      console.error("댓글 조회 실패:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      await POST(`/posts/${postId}/comments`, {
        content: newComment.trim(),
      });
      setNewComment("");
      fetchComments();
    } catch (error) {
      console.error("댓글 작성 실패:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 수정 시작
  const handleStartEdit = (comment) => {
    setEditingComment(comment.commentId || comment.id);
    setEditText(comment.content || comment.content);
  };

  // 댓글 수정 취소
  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  // 댓글 수정 완료
  const handleSaveEdit = async (commentId) => {
    if (!editText.trim()) return;

    try {
      await PUT(`/posts/${postId}/comments/${commentId}`, {
        content: editText.trim(),
      });
      setEditingComment(null);
      setEditText("");
      fetchComments();
    } catch (error) {
      console.error("댓글 수정 실패:", error);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("이 댓글을 삭제할까요?")) return;

    try {
      await DELETE(`/posts/${postId}/comments/${commentId}`);
      fetchComments();
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  return (
    <div
      className="comments-container"
      style={{ padding: "16px", borderTop: "1px solid #eee" }}
    >
      {/* 댓글 작성 폼 */}
      <form
        onSubmit={handleSubmitComment}
        className="comment-form"
        style={{ marginBottom: "16px" }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 작성해주세요..."
            rows={2}
            style={{
              flex: 1,
              padding: "8px 12px",
              border: "1px solid #ddd",
              borderRadius: "8px",
              resize: "vertical",
              minHeight: "40px",
              fontSize: "14px",
              fontFamily: "inherit",
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || submitting}
            style={{
              padding: "8px 16px",
              backgroundColor:
                newComment.trim() && !submitting ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor:
                newComment.trim() && !submitting ? "pointer" : "not-allowed",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {submitting ? "작성 중..." : "댓글"}
          </button>
        </div>
      </form>

      {/* 댓글 목록 */}
      <div className="comments-list">
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#666" }}>
            댓글을 불러오는 중...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#999" }}>
            첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => {
            const commentId = comment.commentId || comment.id;
            const isEditing = editingComment === commentId;

            return (
              <div
                key={commentId}
                className="comment-item"
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {isEditing ? (
                  // 수정 모드
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#333",
                        }}
                      >
                        {comment.user?.userName || comment.userName || "익명"}
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        {formatDate(
                          comment.commentRegDate || comment.createdAt
                        )}
                      </span>
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        border: "1px solid #007bff",
                        borderRadius: "8px",
                        resize: "vertical",
                        fontSize: "14px",
                        fontFamily: "inherit",
                      }}
                    />
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#6c757d",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        취소
                      </button>
                      <button
                        onClick={() => handleSaveEdit(commentId)}
                        disabled={!editText.trim()}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: editText.trim() ? "#28a745" : "#ccc",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: editText.trim() ? "pointer" : "not-allowed",
                          fontSize: "12px",
                        }}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  // 일반 모드
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <div className="comment-content" style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <span
                          className="comment-author"
                          style={{
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#333",
                          }}
                        >
                          {comment.user?.userName || comment.userName || "익명"}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#999",
                          }}
                        >
                          {formatDate(
                            comment.commentRegDate || comment.createdAt
                          )}
                        </span>
                      </div>
                      <p
                        className="comment-text"
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          lineHeight: "1.4",
                          color: "#555",
                        }}
                      >
                        {comment.content || comment.content}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={() => handleStartEdit(comment)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "transparent",
                          color: "#007bff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          borderRadius: "4px",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#f8f9fa")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteComment(commentId)}
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "transparent",
                          color: "#dc3545",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "12px",
                          borderRadius: "4px",
                        }}
                        onMouseOver={(e) =>
                          (e.target.style.backgroundColor = "#f8f9fa")
                        }
                        onMouseOut={(e) =>
                          (e.target.style.backgroundColor = "transparent")
                        }
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 날짜 포맷팅 함수
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "방금 전";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;

  return date.toLocaleDateString("ko-KR");
};
