// src/components/pages/social/social.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Row, Col } from "react-bootstrap";
import ParticipatedGatheringsSidebar from "./components/ParticipatedGatheringsSidebar";
import "./social.css";

/* -----------------------------
   모달(포털)
   - 훅은 항상 호출하고, open으로 효과/렌더만 분기
----------------------------- */
function ComposeModal({ open, onClose, text, setText, privacy, setPrivacy }) {
  const textareaRef = useRef(null);

  // ESC로 닫기 (열렸을 때만 리스너 등록)
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  // 열릴 때 자동 포커스
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  const canPost = text.trim().length > 0;

  // 렌더 분기 (훅 호출 이후에만!)
  if (!open) return null;

  return createPortal(
    <div className="compose-modal open" role="dialog" aria-modal="true" aria-label="게시글 작성">
      <div className="compose-backdrop" onClick={onClose} />
      <div className="compose-card">
        <div className="compose-card-head">
          <h4 className="compose-title">게시글 작성</h4>
          <button className="compose-close" onClick={onClose} aria-label="닫기">✕</button>
        </div>

        <div className="compose-card-body">
          <div className="compose-row">
            <span className="avatar lg" aria-hidden />
            <textarea
              ref={textareaRef}
              placeholder="어떤 운동을 하셨나요?"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          {/* 툴바 버튼 + 공개 셀렉트 + 게시하기 */}
          <div className="compose-actions">
            <div className="tools">
              <button className="tool-btn" type="button" aria-label="사진 또는 영상 첨부"><span className="ico">🖼️</span></button>
              <button className="tool-btn" type="button" aria-label="운동 기록 첨부"><span className="ico">🏋️</span></button>
            </div>

            <div className="submit">
              <select
                className="pill-select"
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                aria-label="공개 범위"
              >
                <option value="public">공개</option>
                <option value="followers">팔로워</option>
                <option value="private">비공개</option>
              </select>

              {/* CHANGED: Bootstrap btn-primary 제거 → 우리 cta만 사용 */}
              <button
                className="post-btn cta"
                type="button"
                disabled={!canPost}
                aria-disabled={!canPost}
                onClick={() => {
                  if (!canPost) return;
                  // TODO: 서버 연동 시 전송 로직
                  setText("");
                  onClose();
                }}
              >
                게시하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* -----------------------------
   소셜 페이지
----------------------------- */
export default function Social() {
  const [tab, setTab] = useState("all");
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [privacy, setPrivacy] = useState("public");
  const [text, setText] = useState("");

  // 모달 열릴 때 바디 스크롤 잠금
  useEffect(() => {
    document.body.classList.toggle("modal-open", isComposeOpen);
    return () => document.body.classList.remove("modal-open");
  }, [isComposeOpen]);

  // 하단 네비 높이 측정 → CSS 변수 주입
  useEffect(() => {
    const selector = ".bottom-navigation, .bottom-nav, [data-bottom-nav], #bottom-nav";
    const nav = document.querySelector(selector);

    const setVar = () => {
      const h = nav ? nav.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty("--bottom-nav-h", `${h}px`);
    };

    setVar();
    const ro = nav ? new ResizeObserver(setVar) : null;
    ro?.observe(nav);
    window.addEventListener("resize", setVar);
    return () => {
      window.removeEventListener("resize", setVar);
      ro?.disconnect();
    };
  }, []);

  // 더미 피드
  const posts = useMemo(
    () => [
      {
        id: "p1",
        name: "테스트1",
        handle: "test1",
        time: "2시간 전",
        body: "오늘은 하체데이! 레그프레스 + 스쿼트. 끝나고 스트레칭 완료!",
        tags: ["#하체", "#스쿼트"],
        stats: { likes: 312, comments: 36, reposts: 18 },
      },
      {
        id: "p2",
        name: "테스트2",
        handle: "test2",
        time: "5시간 전",
        body: "벤치 80kg 5×5 성공! 다음 주엔 82.5 도전합니다.",
        tags: ["#가슴", "#벤치프레스"],
        stats: { likes: 154, comments: 22, reposts: 4 },
      },
      {
        id: "p3",
        name: "테스트3",
        handle: "test3",
        time: "어제",
        body: "헬스장 새 장비 들어왔어요. 시티드 로우 감성 좋네",
        tags: ["#등"],
        stats: { likes: 97, comments: 11, reposts: 3 },
      },
    ],
    []
  );

  const filtered = useMemo(
    () => (tab === "all" ? posts : posts.slice(0, 2)),
    [tab, posts]
  );

  return (
    <div className="social-root">
      {/* 탭 */}
      <div className="m-toolbar">
        <div className="seg" role="tablist" aria-label="피드 필터">
          <button
            className={`seg-btn ${tab === "all" ? "is-active" : ""}`}
            onClick={() => setTab("all")}
            role="tab"
            aria-selected={tab === "all"}
          >
            전체
          </button>
          <button
            className={`seg-btn ${tab === "following" ? "is-active" : ""}`}
            onClick={() => setTab("following")}
            role="tab"
            aria-selected={tab === "following"}
          >
            팔로워
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <Row className="g-4">
        {/* 왼쪽: 참여한 모임 사이드바 */}
        <Col lg={4} md={12}>
          <ParticipatedGatheringsSidebar />
        </Col>

        {/* 오른쪽: 소셜 피드 */}
        <Col lg={8} md={12}>
          <div className="m-feed">
        {filtered.map((p) => (
          <article key={p.id} className="m-card">
            <header className="m-card-head">
              <span className="avatar" aria-hidden />
              <div className="meta">
                <div className="row1">
                  <span className="name">{p.name}</span>
                  <span className="sub">@{p.handle} · {p.time}</span>
                </div>
              </div>
              <button className="more" aria-label="more">⋯</button>
            </header>

            <div className="m-card-body">
              <p className="text">{p.body}</p>
              <div className="tags">
                {p.tags.map((t) => (
                  <span key={t} className="chip">{t}</span>
                ))}
              </div>
              <div className="media-skeleton" />
            </div>

            <footer className="m-card-actions">
              <button className="icon-txt" type="button">💬 <span>{p.stats.comments}</span></button>
              <button className="icon-txt" type="button">🔁 <span>{p.stats.reposts}</span></button>
              <button className="icon-txt" type="button">❤️ <span>{p.stats.likes}</span></button>
            </footer>
          </article>
        ))}
          </div>
        </Col>
      </Row>

      {/* 글쓰기 FAB */}
      <button className="compose-fab" type="button" onClick={() => setComposeOpen(true)}>
        ✍️ 글쓰기
      </button>

      {/* 모달 */}
      <ComposeModal
        open={isComposeOpen}
        onClose={() => setComposeOpen(false)}
        text={text}
        setText={setText}
        privacy={privacy}
        setPrivacy={setPrivacy}
      />
    </div>
  );
}
