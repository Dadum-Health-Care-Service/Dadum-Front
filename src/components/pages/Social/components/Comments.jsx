// /src/components/pages/Social/components/Comments.jsx
import React, { useEffect, useState, useEffect as UseEffect } from "react";
import {
  fetchComments, addComment, deleteComment, updateComment,
  getCurrentUser, sameUser, displayHandle
} from "../Api.jsx";

export default function Comments({ postId }) {
  const me = getCurrentUser();

  const [items, setItems] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null); // ⋯ 메뉴 오픈된 댓글 ID

  // 댓글 목록 로드
  const load = async () => {
    const { data } = await fetchComments(postId);
    setItems(Array.isArray(data) ? data : []);
  };
  useEffect(() => { load(); }, [postId]);

  // 내 댓글인지 판정
  const str = (v) => String(v ?? "").toLowerCase();
  const canControl = (c) => {
    const cid = str(c.userId ?? c.usersId);
    const cmail = str(c.userEmail ?? c.email);
    const mid = str(me?.usersId ?? me?.userId ?? me?.id);
    const mmail = str(me?.email);
    return (cid && mid && cid === mid) || (cmail && mmail && (cmail === mmail || sameUser(mmail, cmail)));
  };

  // 입력/등록
  const onSubmit = async (e) => {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    await addComment(postId, v);
    setText("");
    await load();
  };

  // 편집
  const onEdit = (c) => {
    setOpenMenuId(null);
    setEditingId(c.commentId ?? c.id);
    setEditingText(c.content || "");
  };
  const onSaveEdit = async () => {
    const v = editingText.trim();
    if (!v) return;
    await updateComment(postId, editingId, v);
    setEditingId(null);
    setEditingText("");
    await load();
  };
  const onCancelEdit = () => {
    setEditingId(null);
    setEditingText("");
  };

  // 삭제
  const onDeleteClick = async (cid) => {
    setOpenMenuId(null);
    if (!window.confirm("댓글을 삭제할까요?")) return;
    await deleteComment(postId, cid);
    await load();
  };

  // ⋯ 메뉴 토글/닫기
  const toggleMenu = (id) => {
    setOpenMenuId((cur) => (cur === id ? null : id));
  };
  useEffect(() => {
    const onDocClick = (e) => {
      // 메뉴/버튼 바깥 클릭 시 닫기
      const el = e.target.closest?.(".comment-menu, .comment-menu-btn");
      if (!el) setOpenMenuId(null);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const fmt = (t) => (t ? new Date(t).toLocaleString() : "");

  // 공용 스타일
  const s = {
    card: { padding: 12, border: "1px solid #e2e8f0", borderRadius: 12, position: "relative", background: "#fff" },
    row: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },
    input: { flex: 1, padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0" },
    btnPrimaryGhost: { padding: "10px 14px", borderRadius: 10, border: "1px solid #0A66FF", background: "#fff", color: "#0A66FF" },
    smallBtn: { fontSize: 12, padding: "6px 10px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff" },
    dotBtn: {
      width: 28, height: 28, borderRadius: 8, border: "1px solid #e2e8f0",
      background: "#fff", lineHeight: "1", display: "grid", placeItems: "center", cursor: "pointer"
    },
    menu: {
      position: "absolute", top: 8, right: 8, minWidth: 120, background: "#fff",
      border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.08)", zIndex: 20
    },
    menuItem: {
      display: "block", width: "100%", textAlign: "left", padding: "10px 12px",
      background: "transparent", border: "none", cursor: "pointer", fontSize: 14
    },
    menuDivider: { height: 1, background: "#eef2f7", margin: "0 8px" },
  };

  return (
    <div className="comments">
      {/* 입력 카드 */}
      <form onSubmit={onSubmit} className="comment-editor" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          placeholder="댓글을 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={s.input}
        />
        <button type="submit" style={s.btnPrimaryGhost}>등록</button>
      </form>

      {/* 목록 */}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
        {items.map((c) => {
          const cid = c.commentId ?? c.id;
          const isMine = canControl(c);
          const menuOpen = openMenuId === cid;
          return (
            <li key={cid} className="comment" style={s.card}>
              <div className="meta" style={s.row}>
                <b style={{ fontWeight: 700 }}>{c.userName ?? "사용자"}</b>
                <span className="handle" style={{ color: "#64748B" }}>
                  @{displayHandle(c.userId ?? c.usersId ?? c.userEmail)}
                </span>
                {c.createdAt && (
                  <span className="time" style={{ marginLeft: "auto", color: "#64748B", fontSize: 12 }}>
                    {fmt(c.createdAt)}
                  </span>
                )}

                {/* ⋯ 메뉴 버튼 */}
                {isMine && (
                  <button
                    type="button"
                    className="comment-menu-btn"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={(e) => { e.stopPropagation(); toggleMenu(cid); }}
                    style={s.dotBtn}
                    title="메뉴"
                  >
                    ⋯
                  </button>
                )}
              </div>

              {/* 편집 중 UI */}
              {editingId === cid ? (
                <>
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #e2e8f0" }}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" onClick={onSaveEdit} style={{ ...s.smallBtn, borderColor: "#0A66FF", color: "#0A66FF" }}>저장</button>
                    <button type="button" onClick={onCancelEdit} style={s.smallBtn}>취소</button>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{c.content}</p>
              )}

              {/* ⋯ 팝오버 메뉴 */}
              {isMine && menuOpen && (
                <div
                  className="comment-menu"
                  role="menu"
                  style={s.menu}
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    role="menuitem"
                    style={s.menuItem}
                    onClick={() => onEdit(c)}
                  >
                    수정
                  </button>
                  <div style={s.menuDivider} />
                  <button
                    type="button"
                    role="menuitem"
                    style={{ ...s.menuItem, color: "#E11D48" }}
                    onClick={() => onDeleteClick(cid)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
