import React, { useEffect, useRef, useState, useMemo, useCallback } from "react"; // useCallback 추가
import Comments from "./Comments.jsx";
import EditPostModal from "./EditPostModal.jsx";
import LikeButton from "./LikeButton.jsx";
import { useApi } from "../../../../utils/api/useApi";

/* =========================
   URL / 이미지 유틸 (env 없이 자동)
   ========================= */

// .env 없이 백엔드 base 자동 추정(개발 편의 매핑)
const getApiBase = () => {
  const { protocol, hostname, port } = window.location;
  const PORT_MAP = { "3000": "8080", "5173": "8080" };
  const mapped = PORT_MAP[port];
  if (mapped) return `${protocol}//${hostname}:${mapped}`;
  return `${protocol}//${hostname}${port ? `:${port}` : ""}`;
};
const API_BASE = getApiBase();

// 최상위에서 이미지 후보를 최대한 추출
const pickImageList = (post) => {
  if (!post) return [];
  const direct =
    post?.postImage ??
    post?.postImages ??
    post?.images ??
    post?.imageUrl ??
    post?.imageUrls ??
    [];

  // 배열/문자열/객체 배열을 모두 문자열로 풀기
  const normalize = (v) => {
    if (!v) return [];
    if (typeof v === "string") return [v];
    if (Array.isArray(v)) {
      return v
        .map((x) =>
          typeof x === "string"
            ? x
            : x && typeof x === "object"
            ? x.url || x.imageUrl || x.src || x.path || ""
            : ""
        )
        .filter(Boolean);
    }
    if (typeof v === "object")
      return [v.url, v.imageUrl, v.src, v.path].filter(Boolean);
    return [];
  };

  let list = normalize(direct);

  // 예비: 키 이름에 image/img/photo/thumbnail가 들어가는 값도 스캔(최상위만)
  if (list.length === 0) {
    const CAND_KEYS = Object.keys(post || {}).filter((k) =>
      /(image|img|photo|thumbnail)/i.test(k)
    );
    for (const k of CAND_KEYS) list.push(...normalize(post[k]));
  }

  // 중복 제거
  return [...new Set(list.filter(Boolean))];
};

// 루트/상대/절대 경로 처리 + 후보 2종(프론트 오리진, API_BASE) 모두 시도
const expandCandidates = (paths) => {
  const seen = new Set();
  const out = [];
  const sameOrigin = `${window.location.protocol}//${window.location.host}`;

  const add = (u) => {
    if (!u) return;
    if (!seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  };

  for (const raw of paths || []) {
    let p = String(raw).replace(/\\/g, "/");
    if (/^(data:|blob:|https?:\/\/)/i.test(p)) {
      add(p);
      continue;
    }
    // 루트 경로일 때: 같은 오리진 먼저, 이후 API_BASE도 추가
    if (p.startsWith("/")) {
      add(`${sameOrigin}${p}`);
      const api = (() => {
        try {
          const u = new URL(API_BASE);
          return `${u.origin}${p}`;
        } catch {
          return `${API_BASE}${p}`;
        }
      })();
      if (api !== `${sameOrigin}${p}`) add(api);
      continue;
    }
    // 상대경로면 둘 다 합치기
    try {
      add(new URL(p, sameOrigin).toString());
    } catch {
      /* noop */
    }
    try {
      add(new URL(p, API_BASE).toString());
    } catch {
      /* noop */
    }
  }
  return out;
};

const displayHandle = (userId) => userId || "user";

// 모든 후보를 순차 시도, 전부 실패 시 숨김
function SmartImage({ raw, alt = "", style }) {
  const baseList = useMemo(() => {
    if (!raw) return [];
    if (typeof raw === "string") return [raw];
    if (Array.isArray(raw)) return raw;
    return [];
  }, [raw]);

  const candidates = useMemo(
    () => expandCandidates(baseList),
    [baseList]
  );

  const [idx, setIdx] = useState(0);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    // 디버깅에 유용
    if (candidates.length) {
      // eslint-disable-next-line no-console
      console.debug("[PostImage candidates]", candidates);
    }
  }, [candidates]);

  if (hide || !candidates.length) return null;

  const onError = () => {
    if (idx < candidates.length - 1) setIdx((i) => i + 1);
    else setHide(true);
  };

  return (
    <img
      src={candidates[idx]}
      alt={alt}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        borderRadius: 10,
        border: "1.5px solid #E5EDFF",
        background: "#f6f7f9",
        ...style,
      }}
      onError={onError}
      loading="lazy"
    />
  );
}

/* =========================
   메인 카드
   ========================= */
export default function PostCard({
  post,
  likeInfo: initialLikeInfo, // 👈 프롭스 이름을 initialLikeInfo로 변경
  onLikeChange,
  onAfterMutate,
}) {
  const { DELETE } = useApi();
  const {
    postId,
    postTitle,
    postContent,
    userName,
    userId,
    createdAt,
    profileImage,
    tags = [],
  } = post || {};

  // 1. likeInfo를 로컬 상태로 관리
  const [currentLikeInfo, setCurrentLikeInfo] = useState(initialLikeInfo);

  // 2. 외부 initialLikeInfo가 변경되면 로컬 상태를 초기화
  useEffect(() => {
    setCurrentLikeInfo(initialLikeInfo);
  }, [initialLikeInfo]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const menuRef = useRef(null);
  
  // 3. LikeButton의 onChange 이벤트를 처리
  const handleLikeChange = useCallback((data) => {
    // 로컬 상태 갱신: PostCard 내에서 최신 좋아요 상태 유지
    setCurrentLikeInfo({
      isLiked: data.liked,
      likeCount: data.count,
    });
    // 상위 컴포넌트에 알림
    onLikeChange?.(data);
  }, [onLikeChange]);

  // 메뉴 바깥 클릭 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // 게시글 삭제
  const handleDelete = async () => {
    if (!window.confirm("이 게시글을 삭제할까요?")) return;
    try {
      await DELETE(`/posts/${postId}`);
      setMenuOpen(false);
      onAfterMutate?.();
    } catch (error) {
      console.error("게시글 삭제 실패:", error);
    }
  };

  const profileSrc = profileImage ? expandCandidates([profileImage])[0] : null;
  const imageList = useMemo(() => pickImageList(post), [post]);

  useEffect(() => {
    // eslint-disable-next-line no-console
    if (imageList?.length) console.debug("[PostCard] imageList(raw)", imageList);
  }, [imageList]);

  return (
    <article className="m-card">
      {/* 헤더 */}
      <header className="m-card-head">
        {profileSrc ? (
          <img className="avatar-img" src={profileSrc} alt="" />
        ) : (
          <span className="avatar" aria-hidden />
        )}
        <div className="meta">
          <div className="row1">
            <span className="name">{userName || "사용자"}</span>
            <span className="sub">
              @{displayHandle(userId || "user")} · {createdAt || ""}
            </span>
          </div>
        </div>

        {/* 케밥 버튼 */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            className="more"
            aria-label="메뉴"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⋯
          </button>
          {menuOpen && (
            <div className="popup-menu">
              <button
                className="menu-item"
                onClick={() => {
                  setEditOpen(true);
                  setMenuOpen(false);
                }}
              >
                수정
              </button>
              <button className="menu-item danger" onClick={handleDelete}>
                삭제
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 본문 */}
      <div className="m-card-body">
        {!!(postTitle && String(postTitle).trim()) && (
          <h4 className="text" style={{ marginTop: 4, marginBottom: 8 }}>
            {postTitle}
          </h4>
        )}
        <p className="text">{postContent}</p>

        {!!tags?.length && (
          <div className="tags">
            {tags.map((t, i) => (
              <span className="chip" key={i}>
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* 이미지 섹션 */}
        {!!imageList.length && (
          <div className="media" style={{ marginTop: 8 }}>
            <SmartImage raw={imageList} alt="post image" />
          </div>
        )}
      </div>

      {/* 액션 바 */}
      <div className="m-card-actions">
        <button
          className="icon-txt"
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-controls={`comments-${postId}`}
        >
          <span aria-hidden>💬</span>
        </button>

        <LikeButton
          postId={postId}
          initialLiked={!!currentLikeInfo?.isLiked} // 👈 로컬 상태 사용
          initialCount={currentLikeInfo?.likeCount ?? 0} // 👈 로컬 상태 사용
          onChange={handleLikeChange} // 👈 로컬 핸들러 사용
        />
      </div>

      {/* 댓글 */}
      {commentsOpen && (
        <div id={`comments-${postId}`} className="m-card-comments">
          <Comments postId={postId} />
        </div>
      )}

      {/* 수정 모달 */}
      <EditPostModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        post={post}
        onUpdated={() => {
          setEditOpen(false);
          onAfterMutate?.();
        }}
      />
    </article>
  );
}