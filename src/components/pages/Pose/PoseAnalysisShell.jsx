import React, { useEffect, useMemo, useRef, useState } from "react";
import PoseAccuracyMVP from "./PoseAccuracyMVP.jsx";

/* ======================================================
 * PoseAnalysisShell: 라이브/업로드 모드 명확화 + 저장/히스토리 + 결과요약(텍스트·그래프)
 * - 라이브/업로드 모드 탭과 상태 바(REC·타이머)
 * - 레퍼런스 라이브러리(4~5개) 중 선택 → PoseAccuracyMVP 에 전달
 * - 분석 종료 콜백으로 요약/시리즈 받아서 결과 패널 표시 + 저장/히스토리
 * ====================================================== */

/* ===== 레퍼런스 라이브러리 (원하는 파일로 교체) =====
 * public/refs 폴더에 mp4를 넣고, 아래 URL을 프로젝트 경로에 맞게 바꾸세요.
 */
const REF_LIBRARY = [
  { id: "squat",  title: "스쿼트(기본)", url: "/refs/squat.mp4",  cues: ["무릎이 안쪽으로 모이지 않게", "엉덩이를 뒤로 빼며 하강"], joints:["knee","hip","trunk"] },
  { id: "pushup", title: "푸시업(기본)", url: " /refs/pushup.mp4", cues: ["팔꿈치 45°", "몸통 일직선 유지"], joints:["shoulder","elbow","trunk"] },
  { id: "lunge",  title: "런지(전진)",  url: "/refs/lunge.mp4",  cues: ["앞무릎 발끝 넘어가지 않게", "상체 곧게"], joints:["knee","hip","trunk"] },
  { id: "situp",  title: "싯업(복근)",  url: "/refs/situp.mp4",  cues: ["턱 당기고 반동 금지"], joints:["trunk","hip"] },
  { id: "plank",  title: "플랭크(정적)", url: "/refs/plank.mp4",  cues: ["어깨-엉덩이-발목 일직선"], joints:["trunk","shoulder","hip"] },
];

/* ===== 로컬 스토리지 유틸 ===== */
const LS_KEY = "MOG_POSE_SESSIONS";
const loadSessions = () => { try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } };
const saveSessions = (arr) => localStorage.setItem(LS_KEY, JSON.stringify(arr));

const formatTime = (s) => { const mm = String(Math.floor(s/60)).padStart(2,"0"); const ss = String(s%60).padStart(2,"0"); return `${mm}:${ss}`; };

export default function PoseAnalysisShell() {
  const [mode, setMode] = useState("live");             // 'live' | 'video'
  const [status, setStatus] = useState("대기 중");
  const [isRecording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [sessions, setSessions] = useState(loadSessions());

  const [referenceUrl, setReferenceUrl] = useState(REF_LIBRARY[0]?.url || "");
  const [lastResult, setLastResult] = useState(null);    // { score, reps, rom, series:{t,score,knee,hip,trunk}, refId/title }
  const [note, setNote] = useState("");
  const [keyword, setKeyword] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [snapshot, setSnapshot] = useState(null);        // dataURL

  const liveVideoRef = useRef(null);     // PoseAccuracyMVP 에 전달(필수는 아님)
  const fileVideoRef = useRef(null);     // 업로드 모드 미리보기
  const hiddenCanvas = useRef(null);

  // 녹화 타이머
  useEffect(() => { if (!isRecording) return; const t = setInterval(() => setRecSec(s => s+1), 1000); return () => clearInterval(t); }, [isRecording]);
  useEffect(() => { setStatus(analyzing ? (mode === "live"? "실시간 분석 중" : "영상 분석 중") : (mode === "live"? "라이브 대기" : "영상 선택 대기")); }, [analyzing, mode]);

  // 썸네일 스냅샷
  const makeSnapshot = async () => {
    const cvs = hiddenCanvas.current; if (!cvs) return null;
    const v = mode === "live" ? liveVideoRef.current : fileVideoRef.current;
    if (!v || !(v.videoWidth>0)) return null;
    const w = Math.min(480, v.videoWidth), h = Math.floor(w * v.videoHeight / v.videoWidth);
    cvs.width = w; cvs.height = h; const ctx = cvs.getContext("2d"); ctx.drawImage(v, 0, 0, w, h);
    return cvs.toDataURL("image/png");
  };

  // 저장
  const handleSave = async () => {
    const snap = (await makeSnapshot()) || snapshot;
    const item = {
      id: Date.now(), ts: new Date().toISOString(),
      mode, keyword: keyword.trim() || null, note: note.trim() || null,
      summary: lastResult, snapshot: snap || null, recDuration: isRecording ? recSec : null,
    };
    const next = [item, ...sessions]; setSessions(next); saveSessions(next); setNote("");
  };

  const handleDelete = (id) => { const next = sessions.filter(s => s.id!==id); setSessions(next); saveSessions(next); };

  // 콜백(하위로 전달)
  const onSummary = (res) => setLastResult(res);
  const onSnapshot = (img) => { if (!img) return; if (typeof img === "string" && img.startsWith("data:")) setSnapshot(img); };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", padding: 12 }}>
      {/* 모드 탭 */}
      <ModeTabs mode={mode} setMode={(m)=>{ setMode(m); }} />

      {/* 상태 바 */}
      <StatusBar mode={mode} status={status} isRecording={isRecording} recSec={recSec} onToggleRecord={()=>setRecording(v=>!v)} />

      {/* 레퍼런스 선택 + 업로드 카드 */}
      <div style={cardBox}>
        <div style={{ display:"grid", gap: 10 }}>
          <label style={label}>운동 키워드(선택)</label>
          <input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="예) squat, push-up" style={input} />

          {/* 업로드 모드일 때 파일 선택 */}
          {mode === "video" && (
            <div>
              <label style={label}>분석할 내 영상</label>
              <input type="file" accept="video/*" onChange={(e)=>{ const f=e.target.files?.[0]; if (!f) return; const url=URL.createObjectURL(f); if (fileVideoRef.current){ fileVideoRef.current.src=url; fileVideoRef.current.onloadeddata=()=>fileVideoRef.current?.play?.(); } }} />
              <video ref={fileVideoRef} controls muted style={{ width:"100%", marginTop:8 }} />
            </div>
          )}

          {/* 레퍼런스 라이브러리 */}
          <div>
            <div style={{ fontSize:12, color:"#64748B", marginBottom:6 }}>레퍼런스 선택(4~5개)</div>
            <ReferenceLibrary list={REF_LIBRARY} selectedUrl={referenceUrl} onPick={(it)=> setReferenceUrl(it.url)} />
          </div>

          {/* Pose Core */}
          <div style={{ border:"1px solid #E2E8F0", borderRadius:8, overflow:"hidden" }}>
            <PoseAccuracyMVP
              mode={mode}
              referenceUrl={referenceUrl}
              liveVideoRef={liveVideoRef}
              onAnalyzingChange={setAnalyzing}
              onSummary={onSummary}
              onSnapshot={onSnapshot}
            />
          </div>

          {/* 결과 요약 */}
          {lastResult && (
            <ResultPanel res={lastResult} />
          )}

          {/* 액션 */}
          <div style={{ display:"flex", gap:8 }}>
            <button style={primaryBtn} onClick={handleSave} disabled={!lastResult}>저장</button>
            <button style={ghostBtn} onClick={()=>setLastResult(null)} disabled={!lastResult}>초기화</button>
          </div>

          <canvas ref={hiddenCanvas} style={{ display:"none" }} />
        </div>
      </div>

      {/* 히스토리 */}
      <div style={{ ...cardBox, marginTop: 16 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
          <div style={{ fontWeight:700 }}>분석 히스토리</div>
          {sessions.length>0 && <button style={tinyGhost} onClick={()=>{ setSessions([]); saveSessions([]); }}>전체 삭제</button>}
        </div>
        {sessions.length===0 ? (
          <div style={{ fontSize:12, color:"#64748B" }}>저장된 분석이 없습니다. 분석 종료 후 <b>저장</b>을 눌러 기록을 남기세요.</div>
        ) : (
          <div style={{ display:"grid", gap:8 }}>
            {sessions.map((s)=> (
              <HistoryItem key={s.id} item={s} onDelete={()=>handleDelete(s.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ==================== Subcomponents ==================== */
function ModeTabs({ mode, setMode }){
  return (
    <div style={{ display:"flex", gap:8, marginBottom:12 }}>
      <TabBtn active={mode==='live'} onClick={()=>setMode('live')}>라이브(카메라)</TabBtn>
      <TabBtn active={mode==='video'} onClick={()=>setMode('video')}>영상 업로드</TabBtn>
    </div>
  );
}
function StatusBar({ mode, status, isRecording, recSec, onToggleRecord }){
  return (
    <div style={{ ...cardBox, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={pill(mode==='live'?"#DBEAFE":"#E2E8F0", mode==='live'?"#1D4ED8":"#475569")}>{mode==='live'? 'LIVE':'VIDEO'}</span>
        <span style={{ fontSize:12, color:"#334155" }}>{status}</span>
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <button style={tinyGhost} onClick={onToggleRecord}>{isRecording? 'REC 중지':'REC 시작'}</button>
        <RecBadge on={isRecording} time={recSec} />
      </div>
    </div>
  );
}
function RecBadge({ on, time }){
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <span style={{ width:8, height:8, borderRadius:999, background:on?"#EF4444":"#CBD5E1", display:"inline-block", boxShadow:on?"0 0 0 2px rgba(239,68,68,0.25)":"none" }} />
      <span style={{ fontSize:12, color:on?"#EF4444":"#64748B", minWidth:42, textAlign:"right" }}>{on? formatTime(time):"00:00"}</span>
    </div>
  );
}

function ReferenceLibrary({ list, selectedUrl, onPick }){
  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {list.map((it)=> (
        <button key={it.id} onClick={()=>onPick(it)} style={{ ...refBtn, outline: selectedUrl===it.url? '2px solid #2563EB':'none' }}>
          <div style={{ fontWeight:700, fontSize:13 }}>{it.title}</div>
          <div style={{ color:'#64748B', fontSize:12 }}>{it.cues?.[0]||''}</div>
        </button>
      ))}
    </div>
  );
}

function ResultPanel({ res }){
  const { score, reps, rom, series, refTitle } = res || {};
  return (
    <div style={{ marginTop:12, background:'#F8FAFC', borderRadius:8, padding:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontWeight:700 }}>분석 요약</div>
        {refTitle && <span style={{ fontSize:12, color:'#475569' }}>레퍼런스: {refTitle}</span>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:10 }}>
        <MetricCard label="정확도(평균)" value={Number.isFinite(score)? `${score}`:'-'} />
        <MetricCard label="반복수" value={Number.isFinite(reps)? `${reps}`:'-'} />
      </div>
      <div style={{ marginTop:12 }}>
        <MiniLineChart series={series?.t?.map((t,i)=> ({ x:t, y: series?.score?.[i] ?? null }))||[]} label="정확도 추이" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:12 }}>
        <Bar label="무릎 ROM" val={rom?.knee ?? 0} max={120} unit="°" />
        <Bar label="엉덩이 ROM" val={rom?.hip ?? 0}  max={120} unit="°" />
        <Bar label="몸통 ROM" val={rom?.trunk ?? 0} max={90}  unit="°" />
      </div>
      <ul style={{ marginTop:10, paddingLeft:18, color:'#334155', fontSize:13 }}>
        <li>파란 게이지가 80 이상 구간이 이상적입니다.</li>
        <li>ROM이 낮게 나온 관절은 가동범위를 더 확보해 보세요.</li>
      </ul>
    </div>
  );
}

function MetricCard({ label, value }){
  return (
    <div style={{ background:'#fff', border:'1px solid #E2E8F0', borderRadius:8, padding:12 }}>
      <div style={{ fontSize:12, color:'#64748B', marginBottom:6 }}>{label}</div>
      <div style={{ fontWeight:800, fontSize:20 }}>{value}</div>
    </div>
  );
}

function MiniLineChart({ series, label }){
  const w = 380, h = 120, pad = 22;
  const xs = series.map(p=>p.x), ys = series.map(p=>p.y).filter(v=>Number.isFinite(v));
  const x0 = xs.length? xs[0]:0; const x1 = xs.length? xs[xs.length-1]:1; const y0 = 0, y1 = 100;
  const xMap = (x)=> pad + (w-2*pad) * ((x - x0) / Math.max(1,(x1 - x0)||1));
  const yMap = (y)=> h-pad - (h-2*pad) * ((y - y0) / Math.max(1,(y1 - y0)||1));
  const path = series.length>1 ? series.map((p,i)=> `${i?'L':'M'}${xMap(p.x)},${yMap(Number.isFinite(p.y)?p.y:0)}`).join(' ') : '';
  return (
    <div>
      <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>{label}</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        <rect x="0" y="0" width={w} height={h} fill="#FFFFFF" stroke="#E2E8F0" rx="8" />
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="2" />
      </svg>
    </div>
  );
}

function Bar({ label, val, max, unit }){
  const pct = Math.max(0, Math.min(100, Math.round((val / (max||1)) * 100)));
  return (
    <div>
      <div style={{ fontSize:12, color:'#64748B', marginBottom:4 }}>{label}</div>
      <div style={{ background:'#E2E8F0', height:10, borderRadius:999, overflow:'hidden' }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'#2563EB' }} />
      </div>
      <div style={{ fontSize:12, color:'#334155', marginTop:4 }}>{val?.toFixed? val.toFixed(0):val}{unit}</div>
    </div>
  );
}

function HistoryItem({ item, onDelete }){
  return (
    <div style={{ border:'1px solid #E2E8F0', borderRadius:8, padding:8, display:'flex', gap:8 }}>
      <div style={{ width:72, height:40, background:'#F1F5F9', borderRadius:6, overflow:'hidden' }}>
        {item.snapshot ? <img src={item.snapshot} alt="thumb" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <div style={{ fontSize:10, color:'#94A3B8', display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>no img</div>}
      </div>
      <div style={{ flex:1 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={pill(item.mode==='live'?"#DBEAFE":"#E2E8F0", item.mode==='live'?"#1D4ED8":"#475569")}>{item.mode.toUpperCase()}</span>
          <span style={{ fontSize:12, color:'#64748B' }}>{new Date(item.ts).toLocaleString()}</span>
        </div>
        <div style={{ fontSize:13, marginTop:2 }}>점수 {item.summary?.score ?? '-'} · 반복 {item.summary?.reps ?? '-'}</div>
        {item.note && <div style={{ fontSize:12, color:'#475569', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item.note}</div>}
        <div style={{ display:'flex', gap:6, marginTop:6 }}>
          <button style={tinyDanger} onClick={onDelete}>삭제</button>
        </div>
      </div>
    </div>
  );
}

/* ========================== Styles ========================== */
const cardBox = { background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: 12 };
const primaryBtn = { background: "#2563EB", color: "#fff", border: 0, borderRadius: 8, height: 40, fontWeight: 700, cursor: "pointer" };
const ghostBtn = { background: "#EFF6FF", color: "#1D4ED8", border: 0, borderRadius: 8, height: 40, fontWeight: 700, cursor: "pointer" };
const tinyGhost = { background: "#F1F5F9", color: "#334155", border: 0, borderRadius: 6, height: 28, padding: "0 10px", cursor: "pointer", fontSize: 12 };
const tinyDanger = { background: "#FEE2E2", color: "#B91C1C", border: 0, borderRadius: 6, height: 28, padding: "0 10px", cursor: "pointer", fontSize: 12 };
const input = { width: "100%", height: 40, borderRadius: 8, border: "1px solid #E2E8F0", padding: "0 10px", fontSize: 14 };
const label = { display: "block", fontSize: 12, color: "#475569", marginBottom: 4 };
const TabBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} style={{ flex:1, background: active ? "#2563EB" : "#E2E8F0", color: active ? "#fff" : "#334155", border:0, borderRadius:10, padding:"10px 12px", fontWeight:700, cursor:"pointer" }}>{children}</button>
);
const pill = (bg, color) => ({ fontSize: 11, fontWeight: 800, background: bg, color, padding: "4px 8px", borderRadius: 999 });
const refBtn = { textAlign:'left', background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8, padding:10, cursor:'pointer' };
