import React, { useEffect, useMemo, useRef, useState } from "react";

/** ====== 설정 ====== */
const EX_API_SEARCH = import.meta.env.VITE_EX_API_SEARCH || "/api/exercises/search";

/** 로컬 후보 */
const LOCAL_DB = [
  {
    key: ["situp", "sit-up", "crunch", "abs", "복근", "윗몸일으키기"],
    name: "Sit-Up",
    desc: "복부 중심의 몸통 굴곡 패턴. 허리를 과하게 꺾지 않도록 주의.",
    cues: ["턱 살짝 당기기", "반동 금지", "올릴 때 숨 내쉬기"],
    joints: ["trunk", "hip"],
  },
  {
    key: ["squat", "스쿼트", "하체"],
    name: "Squat",
    desc: "하지 굴곡/신전 패턴. 무릎-발끝 정렬과 중심 안정.",
    cues: ["무릎은 발끝 방향", "가슴 열기", "발 전체로 눌러 일어나기"],
    joints: ["knee", "hip", "trunk"],
  },
  {
    key: ["hinge", "deadlift", "데드리프트", "힙힌지"],
    name: "Hip Hinge",
    desc: "둔·햄스트링 중심 힌지. 허리 중립, 엉덩이를 뒤로.",
    cues: ["허리 중립", "정강이 수직 가깝게", "하중은 뒤꿈치"],
    joints: ["hip", "trunk"],
  },
];

function jointsFromText(s = "") {
  const t = String(s).toLowerCase();
  const hit = new Set();
  const add = (...xs) => xs.forEach((x) => hit.add(x));
  if (/knee|무릎|quads?/.test(t)) add("knee");
  if (/hip|고관절|엉덩|glute/.test(t)) add("hip");
  if (/trunk|core|spine|몸통|코어|척추|허리/.test(t)) add("trunk");
  if (/shoulder|어깨/.test(t)) add("shoulder");
  if (/elbow|팔꿈치/.test(t)) add("elbow");
  if (/ankle|발목|calf/.test(t)) add("ankle");
  if (/wrist|손목/.test(t)) add("wrist");
  return Array.from(hit);
}

async function searchExercisesApi(q) {
  try {
    const res = await fetch(`${EX_API_SEARCH}?q=${encodeURIComponent(q)}`, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data : (data?.items || data?.results || []);
    return arr.map((raw, idx) => {
      const name = raw.name || raw.title || raw.exerciseName || `Exercise ${idx + 1}`;
      const desc = raw.description || raw.desc || raw.detail || "";
      const cues = raw.cues || raw.tips || [];
      const joints = raw.joints || raw.primary_joints || raw.focusJoints || jointsFromText(desc);
      const tags = raw.tags || raw.keywords || [];
      return { name, desc, cues, joints, tags, _raw: raw };
    });
  } catch {
    return [];
  }
}

function ResultItem({ it, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(it)}
      className="list-item"
      style={{
        display: "grid",
        gap: 2,
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
      }}
    >
      <div style={{ fontWeight: 700 }}>{it.name}</div>
      {Array.isArray(it.tags) && it.tags.length > 0 && (
        <div style={{ fontSize: 12, color: "#6b7b90" }}>{it.tags.slice(0, 4).join(", ")}</div>
      )}
    </button>
  );
}

function JointChip({ j, on }) {
  const label =
    j === "knee" ? "무릎"
    : j === "hip" ? "엉덩이"
    : j === "trunk" ? "몸통"
    : j === "shoulder" ? "어깨"
    : j === "elbow" ? "팔꿈치"
    : j === "ankle" ? "발목"
    : j === "wrist" ? "손목"
    : j;
  return (
    <span
      className={`pill ${on ? "on" : ""}`}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        fontWeight: 700,
        background: on ? "linear-gradient(90deg,#0A66FF,#3BAAFF)" : "#eef4ff",
        color: on ? "#fff" : "#245cff",
      }}
    >
      {label}
    </span>
  );
}

/** props
 * - refMeta: { fileName, peaks, kneeROM, hipROM, trunkROM, clsName, clsDesc, cues[], conf, focusJoints[] }
 * - score: number | null
 * - onPick: (obj:{name,desc,cues,joints[]}) => void
 */
export default function ExerciseInsight({ refMeta, score, onPick }) {
  const [q, setQ] = useState("");
  const [apiRes, setApiRes] = useState([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const pct = Number.isFinite(score) ? score : 0;

  const localResults = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return LOCAL_DB.filter(
      (i) =>
        i.name.toLowerCase().includes(s) ||
        i.key?.some((k) => k.toLowerCase().includes(s))
    )
      .map((i) => ({ name: i.name, desc: i.desc, cues: i.cues, joints: i.joints, tags: i.key }))
      .slice(0, 6);
  }, [q]);

  useEffect(() => {
    let alive = true;
    const s = q.trim();
    if (s.length < 2) { setApiRes([]); return; }
    const t = setTimeout(async () => {
      const res = await searchExercisesApi(s);
      if (alive) setApiRes(res.slice(0, 6));
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, []);

  const display = {
    name: refMeta?.clsName || "운동 감지 대기",
    desc: refMeta?.clsDesc || "레퍼런스 업로드 후 자동 추론되며, 아래 검색으로 수동 선택도 가능합니다.",
    cues: Array.isArray(refMeta?.cues) ? refMeta.cues : [],
    conf: Number.isFinite(refMeta?.conf) ? Math.round(refMeta.conf * 100) : null,
    focusJoints: refMeta?.focusJoints || [],
  };

  const mergedList = [...apiRes, ...localResults].reduce((acc, cur) => {
    if (!acc.find((x) => x.name === cur.name)) acc.push(cur);
    return acc;
  }, []);

  return (
    <section className="card">
      <h2 className="card__title">운동 분석·인사이트</h2>

      {/* 🔎 키워드 검색(예전 스타일) */}
      <div ref={boxRef} className="search" style={{ position: "relative", marginBottom: 12 }}>
        <label htmlFor="ex-search" style={{ fontSize: 12, color: "#6b7b90" }}>
          운동명/키워드 검색
        </label>
        <input
          id="ex-search"
          className="input"
          placeholder="예) squat, push-up, sit-up..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && mergedList.length > 0 && (
          <div
            className="list"
            style={{
              position: "absolute",
              zIndex: 10,
              left: 0,
              right: 0,
              top: "100%",
              marginTop: 6,
              border: "1px solid #D6E4FF",
              borderRadius: 12,
              background: "#fff",
              boxShadow: "0 8px 28px rgba(9,30,66,.15)",
              overflow: "hidden",
              maxHeight: 240,
              overflowY: "auto",
            }}
          >
            {mergedList.map((it) => (
              <ResultItem
                key={`${it.name}-${(it.tags||[]).slice(0,2).join("-")}`}
                it={it}
                onPick={(picked) => {
                  onPick?.(picked);
                  setQ(""); setOpen(false);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 상단 요약 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span
          className="pill"
          style={{
            padding: "6px 10px",
            borderRadius: 999,
            fontWeight: 700,
            background: "#E8F1FF",
            color: "#0A66FF",
          }}
          title={refMeta?.fileName ? `레퍼런스: ${refMeta.fileName}` : "레퍼런스 없음"}
        >
          {display.name}
        </span>
        <span style={{ color: "#6b7b90", fontSize: 13 }}>
          신뢰도 {display.conf ?? "--"}% · 반복수 {refMeta?.peaks ?? 0}회
        </span>
      </div>

      {/* 설명/큐 */}
      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        <p style={{ margin: 0, color: "#0b1628", lineHeight: 1.5 }}>{display.desc}</p>
        {display.cues?.length > 0 && (
          <ul style={{ margin: 0, paddingLeft: 18, color: "#34435a" }}>
            {display.cues.map((c, i) => (
              <li key={i} style={{ margin: "2px 0" }}>{c}</li>
            ))}
          </ul>
        )}
      </div>

      {/* 분석해야 하는 관절 */}
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, color: "#6b7b90", marginBottom: 6 }}>분석해야 하는 관절</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {display.focusJoints.length > 0
            ? display.focusJoints.map((j) => <JointChip key={j} j={j} on />)
            : ["knee","hip","trunk"].map((j) => <JointChip key={j} j={j} on={false} />)}
        </div>
      </div>

      {/* 정확도 게이지 */}
      <div className="analysis" style={{ marginTop: 12 }}>
        <div className="gauge" style={{ "--p": `${pct}%` }} data-val={Number.isFinite(score) ? String(score) : "--"} />
        <div className="bars">
          <ScoreBar label="무릎(패턴)" width={pct} />
          <ScoreBar label="엉덩이(패턴)" width={pct} />
          <ScoreBar label="몸통(패턴)" width={pct} />
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, width }) {
  return (
    <div className="bar">
      <span>{label}</span>
      <div className="bar__track">
        <div className="bar__fill" style={{ width: `${Number.isFinite(width) ? width : 0}%` }} />
      </div>
    </div>
  );
}
