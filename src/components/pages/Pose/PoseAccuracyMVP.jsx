import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "./PoseAccuracyMVP.css";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import MultiCamConnect from "./MultiCamConnect";
import ExerciseInsight from "./ExerciseInsight";

/* ====================== 상수/가중치 ====================== */
const WIN = 60;                 // 라이브 윈도우 길이
const REF_N = 100;              // 참조시퀀스 정규 길이
const LIVE_TARGET_FPS = 20;

const EX_API_SEARCH = import.meta.env.VITE_EX_API_SEARCH || "/api/exercises/search";

const ANGLE_RANGE = { knee: { min: 60, max: 180 }, hip: { min: 50, max: 180 }, trunk: { min: 0, max: 45 } };
const W_CH_DEFAULT = { knee: 0.4, hip: 0.35, trunk: 0.25 };
const W_CH_REF = { current: { ...W_CH_DEFAULT } };

const focusToWeights = (focus = []) => {
  const base = { knee: 0.2, hip: 0.2, trunk: 0.2 };
  const pick = focus.filter(j => j === "knee" || j === "hip" || j === "trunk");
  if (pick.length) pick.forEach(j => { base[j] += 0.6 / pick.length; });
  else { base.knee = 0.4; base.hip = 0.35; base.trunk = 0.25; }
  const s = base.knee + base.hip + base.trunk;
  return { knee: base.knee / s, hip: base.hip / s, trunk: base.trunk / s };
};

/* ====================== 유틸리티 ====================== */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const once  = (el, ev) => new Promise(res => { const h = () => { el.removeEventListener(ev, h); res(); }; el.addEventListener(ev, h, { once: true }); });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const isSecureHost = () => window.isSecureContext === true || location.protocol === "https:" || ["localhost","127.0.0.1","[::1]"].includes(location.hostname);
const hasDim = (el) => !!el && ((el instanceof HTMLVideoElement && el.videoWidth > 0 && el.videoHeight > 0) || (el instanceof HTMLCanvasElement && el.width > 0 && el.height > 0));

function angle(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const n = (Math.hypot(...v1) * Math.hypot(...v2)) + 1e-8;
  return Math.acos(clamp(dot / n, -1, 1)) * 180 / Math.PI;
}
function trunkFlex(ls, rs, lh, rh){
  const sm = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const hm = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const v = [sm.x - hm.x, sm.y - hm.y], up = [0, -1];
  const dot = v[0]*up[0] + v[1]*up[1], n = Math.hypot(...v) + 1e-8;
  return Math.acos(clamp(dot/n, -1, 1)) * 180/Math.PI;
}
function emaSmooth(seq,a=0.3){ if(!seq.length) return seq; const out=new Array(seq.length); let p=seq[0]; out[0]=p; for(let i=1;i<seq.length;i++){const c=seq[i]; p=[a*c[0]+(1-a)*p[0],a*c[1]+(1-a)*p[1],a*c[2]+(1-a)*p[2]]; out[i]=p;} return out; }
function resampleSeq(seq,N){ if(!seq.length) return []; const out=new Array(N),L=seq.length-1; for(let i=0;i<N;i++){const t=i*(L/(N-1)); const i0=Math.floor(t),i1=Math.min(L,i0+1),r=t-i0; const a=seq[i0],b=seq[i1]; out[i]=[a[0]+(b[0]-a[0])*r,a[1]+(b[1]-a[1])*r,a[2]+(b[2]-a[2])*r]; } return out; }
function normAnglesWithRange(seq,range){ const rr=range||ANGLE_RANGE; return seq.map(([k,h,t])=>[(clamp(k,rr.knee.min,rr.knee.max)-rr.knee.min)/Math.max(1e-6,(rr.knee.max-rr.knee.min)),(clamp(h,rr.hip.min,rr.hip.max)-rr.hip.min)/Math.max(1e-6,(rr.hip.max-rr.hip.min)),(clamp(t,rr.trunk.min,rr.trunk.max)-rr.trunk.min)/Math.max(1e-6,(rr.trunk.max-rr.trunk.min))]); }
function weightedRMSE(A,B,frameW=null,W=W_CH_REF.current){ if(A.length!==B.length||A.length===0) return Infinity; let seK=0,seH=0,seT=0,ws=0; for(let i=0;i<A.length;i++){const w=frameW?(frameW[i]??1):1; if(w<=0) continue; const [ak,ah,at]=A[i],[bk,bh,bt]=B[i]; seK+=w*(ak-bk)**2; seH+=w*(ah-bh)**2; seT+=w*(at-bt)**2; ws+=w;} if(ws===0) return Infinity; const rK=Math.sqrt(seK/ws), rH=Math.sqrt(seH/ws), rT=Math.sqrt(seT/ws); return W.knee*rK+W.hip*rH+W.trunk*rT; }
const rmseToScore = (rmse) => clamp(Math.round(100*(1 - rmse/0.5)),0,100);

/** (옵션) DTW 스코어러 — 필요시 교체 가능 */
function dtwWeighted(A,B,W=W_CH_REF.current,frameW=null,bandRatio=0.12){
  const N=A.length,M=B.length,INF=1e12,band=Math.max(1,Math.floor(bandRatio*Math.max(N,M)));
  const dp=Array(N+1).fill(null).map(()=>Array(M+1).fill(INF)); dp[0][0]=0;
  const dist=(i,j)=>{ const a=A[i],b=B[j]; const fw=frameW?Math.min(frameW[i]??1,frameW[j]??1):1;
    const dK=Math.abs(a[0]-b[0]),dH=Math.abs(a[1]-b[1]),dT=Math.abs(a[2]-b[2]);
    return fw*(W.knee*dK+W.hip*dH+W.trunk*dT); };
  for(let i=1;i<=N;i++){const j0=Math.max(1,i-band), j1=Math.min(M,i+band);
    for(let j=j0;j<=j1;j++){const c=dist(i-1,j-1);
      dp[i][j]=c+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);}}
  return dp[N][M]/(N+M);
}
const dtwToScore = (d) => clamp(Math.round(100*(1 - d/0.7)),0,100);

function ensureCanvasHiDPI(canvas){ const dpr=window.devicePixelRatio||1; const rect=canvas.getBoundingClientRect?.(); const cssW=Math.max(1,rect?.width||canvas.clientWidth||canvas.width); const cssH=Math.max(1,rect?.height||canvas.clientHeight||canvas.height); const cw=Math.round(cssW*dpr), ch=Math.round(cssH*dpr); if(canvas.width!==cw||canvas.height!==ch){canvas.width=cw; canvas.height=ch;} }
const afterNextPaint = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
function waitForFirstFrame(video,timeout=4000){ return new Promise(resolve=>{ let done=false; const finish=()=>{ if(done) return; done=true; resolve(); }; const to=setTimeout(finish,timeout); if(typeof video.requestVideoFrameCallback==="function"){ video.requestVideoFrameCallback(()=>{ clearTimeout(to); finish();}); return; } const on=()=>{ ["canplay","loadeddata","playing","timeupdate"].forEach(ev=>video.removeEventListener(ev,on)); clearTimeout(to); finish(); }; ["canplay","loadeddata","playing","timeupdate"].forEach(ev=>video.addEventListener(ev,on,{once:true})); }); }


async function ensureDetector(detectorRef){ if(detectorRef.current) return detectorRef.current; await tf.ready(); try{ await tf.setBackend("webgl"); }catch{} const det=await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet,{ modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }); detectorRef.current=det; return det; }
async function ensureSeg(segRef){ if(segRef.current) return segRef.current; const seg=new SelfieSegmentation({ locateFile:(f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}` }); seg.setOptions({ modelSelection:1, selfieMode:false }); segRef.current=seg; return seg; }
async function segOnce(segRef,image,stateRef,intervalMs=70){ const st=stateRef.current; const now=performance.now(); if(st.busy||(now-st.lastAt)<intervalMs) return st.last; if(!hasDim(image)) return st.last; st.busy=true; const seg=await ensureSeg(segRef); const res=await new Promise((resolve)=>{ const handler=(r)=>{ seg.onResults(()=>{}); resolve(r); }; seg.onResults(handler); seg.send({ image }); }); st.last=res; st.lastAt=performance.now(); st.busy=false; return res; }

/* 스켈레톤 렌더 */
const EDGES=[["left_shoulder","right_shoulder"],["left_hip","right_hip"],["left_shoulder","left_elbow"],["left_elbow","left_wrist"],["right_shoulder","right_elbow"],["right_elbow","right_wrist"],["left_hip","left_knee"],["left_knee","left_ankle"],["right_hip","right_knee"],["right_knee","right_ankle"],["left_shoulder","left_hip"],["right_shoulder","right_hip"]];
function drawSkeleton(ctx,kps){ ctx.save(); ctx.lineWidth=3; ctx.strokeStyle="rgba(95,212,255,.85)"; ctx.fillStyle="#5fd4ff"; EDGES.forEach(([a,b])=>{ const A=kps.find(k=>k.name===a), B=kps.find(k=>k.name===b); if(!A||!B) return; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();}); kps.forEach(k=>{ ctx.beginPath(); ctx.arc(k.x,k.y,4,0,Math.PI*2); ctx.fill(); }); ctx.restore(); }

/* HUD */
function drawAccuracyHUD(ctx,score,hasRef,canvas){ const dpr=window.devicePixelRatio||1,x=8*dpr,y=8*dpr; const w=Math.min(220*dpr,canvas.width-16*dpr),h=26*dpr,r=12*dpr,pad=10*dpr; ctx.save(); ctx.globalAlpha=.88; ctx.fillStyle="rgba(0,12,28,.55)"; if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }else{ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); } const pct=Number.isFinite(score)?score/100:0; const bx=x+pad,by=y+(h/2)-4*dpr,bw=w-2*pad,bh=8*dpr; const grad=ctx.createLinearGradient(bx,by,bx+bw,by); grad.addColorStop(0,"#2F6BFF"); grad.addColorStop(1,"#5FD4FF"); ctx.fillStyle="#0E2B57"; ctx.fillRect(bx,by,bw,bh); ctx.fillStyle=grad; ctx.fillRect(bx,by,Math.round(bw*pct),bh); ctx.fillStyle="#fff"; ctx.font=`${12*dpr}px system-ui,-apple-system,Roboto,Arial`; ctx.textBaseline="middle"; ctx.fillText(hasRef?`정확도: ${Number.isFinite(score)?score:"--"}`:"레퍼런스 업로드 필요", bx, y+h/2); ctx.restore(); }

/* 좌/우 자동선택 + 관절 가중용 */
function chainAngles(by,side){ const hip=by[`${side}_hip`],knee=by[`${side}_knee`],ankle=by[`${side}_ankle`]; const shoulder=by[`${side}_shoulder`]; const kneeA=angle(hip,knee,ankle); const hipA=angle(shoulder,hip,knee); const confK=Math.min(hip?.score??0,knee?.score??0,ankle?.score??0); const confH=Math.min(shoulder?.score??0,hip?.score??0,knee?.score??0); const chainConf=Math.min(confK,confH); return {kneeA,hipA,chainConf}; }
function anglesAndWeightFromKP(kp){ const by=Object.fromEntries(kp.map(k=>[k.name,k])); const L=chainAngles(by,"left"); const R=chainAngles(by,"right"); const useLeft=L.chainConf>=R.chainConf; const kneeA=useLeft?L.kneeA:R.kneeA; const hipA=useLeft?L.hipA:R.hipA; const trunkA=trunkFlex(by["left_shoulder"],by["right_shoulder"],by["left_hip"],by["right_hip"]); const confT=Math.min(by["left_shoulder"]?.score??0,by["right_shoulder"]?.score??0,by["left_hip"]?.score??0,by["right_hip"]?.score??0); const chainConf=useLeft?L.chainConf:R.chainConf; const wRaw=Math.min(chainConf,confT); const w=wRaw<=0.2?0:wRaw; return { angles:[kneeA,hipA,trunkA], w }; }

/* ---- API 헬퍼 (401 방지) ---- */
let AUTH_FAILED = false;
function authHeaders() {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function searchExercisesApi(q) {
  if (AUTH_FAILED) return [];
  try {
    const res = await fetch(`${EX_API_SEARCH}?q=${encodeURIComponent(q)}`, {
      credentials: "include",
      headers: { ...authHeaders() },
    });
    if (res.status === 401) { AUTH_FAILED = true; console.warn("Exercise API 401: 로그인 필요"); return []; } // :contentReference[oaicite:7]{index=7}
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
  } catch (e) { console.warn("Exercise API error:", e); return []; }
}
function jointsFromText(s=""){ const t=String(s).toLowerCase(); const hit=new Set(); const add=(...xs)=>xs.forEach(x=>hit.add(x)); if(/knee|무릎|quads?/.test(t)) add("knee"); if(/hip|고관절|엉덩|glute/.test(t)) add("hip"); if(/trunk|core|spine|몸통|코어|척추|허리/.test(t)) add("trunk"); if(/shoulder|어깨/.test(t)) add("shoulder"); if(/elbow|팔꿈치/.test(t)) add("elbow"); if(/ankle|발목|calf/.test(t)) add("ankle"); return Array.from(hit); }
const normJ = (arr=[]) => { const map={knee:"knee",knees:"knee",hip:"hip",hips:"hip",trunk:"trunk",core:"trunk",spine:"trunk",shoulder:"shoulder",elbow:"elbow",ankle:"ankle"}; return Array.from(new Set(arr.map(x=>map[String(x).toLowerCase()]).filter(Boolean))); };

/** API 자동매칭: 간이 분류 + 관절 포커스 → 후보 검색 → Jaccard + 이름 부스팅 */
async function autoMatchByAPI(initial, setRefMeta) {
  if (AUTH_FAILED) return;
  const clsName = (initial?.clsName || "").trim();
  const focus = normJ(initial?.focusJoints || []);
  const seeds = [];
  if (clsName && clsName !== "패턴 인식 중") seeds.push(clsName);
  if (focus.length) seeds.push(focus.join(" "));
  seeds.push("squat lunge","sit-up crunch plank","hip hinge deadlift good-morning","push-up press shoulder","knee hip trunk");

  const pool = new Map();
  for (const q of seeds) {
    if (AUTH_FAILED) break;
    const res = await searchExercisesApi(q);
    for (const it of res) if (!pool.has(it.name)) pool.set(it.name, it);
  }
  const cands = Array.from(pool.values());
  if (!cands.length) return;

  const jf = (it) => {
    const jj = normJ(it.joints && it.joints.length ? it.joints : jointsFromText(it.desc));
    const inter = jj.filter(x => focus.includes(x));
    const union = Array.from(new Set([...jj, ...focus]));
    const jacc = union.length ? inter.length/union.length : 0;
    const nameBoost = clsName ? Number(it.name.toLowerCase().includes(clsName.toLowerCase())) : 0;
    return jacc*0.65 + nameBoost*0.35;
  };
  const ranked = cands.map(c => [c, jf(c)]).sort((a,b)=>b[1]-a[1]);
  const [top, s] = ranked[0] || [];
  if (!top || s < 0.25) return;

  const joints = normJ(top.joints && top.joints.length ? top.joints : jointsFromText(top.desc));
  setRefMeta(prev => ({
    ...(prev || {}),
    clsName: top.name,
    clsDesc: top.desc || prev?.clsDesc,
    cues: top.cues?.length ? top.cues : prev?.cues || [],
    focusJoints: Array.from(new Set([...(prev?.focusJoints || []), ...joints])),
    autoMatched: true,
  }));
  const chFocus = joints.filter(j => ["knee","hip","trunk"].includes(j));
  if (chFocus.length) W_CH_REF.current = focusToWeights(chFocus);

}

/* ====================== 메인 컴포넌트 ====================== */
export default function PoseAccuracyMVP() {
  /** refs */
  const liveStageRef  = useRef(null);
  const liveVideoRef  = useRef(null);
  const liveCanvasRef = useRef(null);
  const refVideoRef   = useRef(null);
  const refCanvasRef  = useRef(null);


  const remoteVideosRef = useRef(new Map());
  const remoteOrderRef  = useRef([]);

  const pipRef        = useRef(null);
  const dragRef       = useRef({ dragging:false, sx:0, sy:0, startL:0, startT:0, moved:false, t0:0 });
  const secondBoxRef  = useRef(null);

  const detectorRef   = useRef(null);
  const segRef        = useRef(null);
  const segStateRef   = useRef({ busy:false, last:null, lastAt:0 });

  const refSigRef     = useRef(null);
  const ring          = useRef(Array.from({ length: WIN }, () => [0, 0, 0]));
  const ringW         = useRef(Array.from({ length: WIN }, () => 1));
  const ptr           = useRef(0);
  const isLiveRef     = useRef(false);
  const liveRafRef    = useRef(null);
  const liveRVFCRef   = useRef(null);
  const liveStreamRef = useRef(null);
  const unmountedRef  = useRef(false);
  const lastInferAt   = useRef(0);
  const lastScoreRef  = useRef(null);
  const lastTapRef    = useRef(0);

  /** state */
  const [ready, setReady]           = useState(false);
  const [status, setStatus]         = useState("대기 중");
  const [score, setScore]           = useState(null);
  const [camOk, setCamOk]           = useState(false);
  const [isRunning, setIsRunning]   = useState(false);
  const [segMode, setSegMode]       = useState("off");
  const segModeRef = useRef(segMode); useEffect(()=>{ segModeRef.current = segMode; }, [segMode]);

  const [showSecond, setShowSecond] = useState(false);
  const [pipVisible, setPipVisible] = useState(true);
  const [pipPos, setPipPos]         = useState({ left: null, top: null });
  const [remoteList, setRemoteList] = useState([]);
  const [secondPick, setSecondPick] = useState("");

  const [refProg, setRefProg]       = useState({ pct: 0, running: false, fileName: "" });
  const refCancelRef                = useRef(false);
  const refCtxRef                   = useRef({ url: null });

  const [refMeta, setRefMeta]       = useState(null);

  /* 모델 준비 */
  useEffect(() => {
    isLiveRef.current = false;
    unmountedRef.current = false;
    (async () => {
      try {
        await tf.ready(); try { await tf.setBackend("webgl"); } catch {}
        const det = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          { modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER }
        );
        detectorRef.current = det; setReady(true); setStatus("모델 준비 완료");
      } catch (e) { console.error(e); setStatus("모델 초기화 실패"); }
    })();

    const onPageHide = () => { try { stopLive(); } catch {} };
    const onPageShow = (e) => {
      if (e.persisted) {
        isLiveRef.current = false; setIsRunning(false); setCamOk(false);
        const v = liveVideoRef.current; if (v) v.srcObject = null;

      }
      requestAnimationFrame(() => ensureCanvasHiDPI(liveCanvasRef.current));
    };
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);


    return () => {
      isLiveRef.current = false; unmountedRef.current = true;
      if (liveRafRef.current) cancelAnimationFrame(liveRafRef.current);
      if (liveRVFCRef.current && typeof liveVideoRef.current?.cancelVideoFrameCallback === "function") {
        try { liveVideoRef.current.cancelVideoFrameCallback(liveRVFCRef.current); } catch {}
      }
      const s = liveStreamRef.current; if (s?.getTracks) s.getTracks().forEach(t => t.stop());
      try { detectorRef.current?.dispose?.(); } catch {}
      try { segRef.current?.close?.(); } catch {}
      segRef.current = null;
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 레퍼런스 파일 처리 ---------- */
  async function handleLoadReferenceFile(e) {
    const file = e.target?.files?.[0] ?? e.dataTransfer?.files?.[0]; if (!file) return;
    const det = await ensureDetector(detectorRef); if (!det) { alert("포즈 모델 준비 전입니다"); return; }

    setStatus("레퍼런스 처리 중..."); setRefProg({ pct: 0, running: true, fileName: file.name });
    refCancelRef.current = false;

    const url = URL.createObjectURL(file); refCtxRef.current.url = url;
    const v = refVideoRef.current, c = refCanvasRef.current, cctx = c.getContext("2d");
    if (!c.width || !c.height) { c.width = 360; c.height = 180; }

    v.src = url; v.muted = true; v.playsInline = true;
    await v.play().catch(() => {}); v.pause();
    await once(v, "loadedmetadata"); if (!v.videoWidth || !v.videoHeight) { await once(v, "loadeddata"); }

    const duration = v.duration || 0; const dt = 1 / 15, seq = [], ws = []; let t = 0;
    const procC = document.createElement("canvas"); procC.width = c.width; procC.height = c.height; const procX = procC.getContext("2d");
    let lastUIAt = 0;

    while (t <= duration && !unmountedRef.current && !refCancelRef.current) {
      v.currentTime = Math.min(duration, t); await once(v, "seeked");
      cctx.drawImage(v, 0, 0, c.width, c.height);

      let inferInput = v;
      if (segModeRef.current !== "off") {
        procX.clearRect(0, 0, procC.width, procC.height);
        procX.drawImage(v, 0, 0, procC.width, procC.height);
        try {
          const segRes = await segOnce(segRef, v, segStateRef, 90);
          if (segRes?.segmentationMask) {
            procX.globalCompositeOperation = "destination-in";
            procX.drawImage(segRes.segmentationMask, 0, 0, procC.width, procC.height);
            procX.globalCompositeOperation = "source-over";
            inferInput = procC;
          }
        } catch {}
      }

      if (hasDim(inferInput)) {
        try {
          const poses = await det.estimatePoses(inferInput, { flipHorizontal: false });
          const p = poses?.[0];
          if (p?.keypoints) {
            const { angles, w } = anglesAndWeightFromKP(p.keypoints);
            seq.push(angles); ws.push(w);
          }
        } catch (err) { console.warn("estimatePoses error", err); }
      }

      t += dt;
      if (duration && isFinite(duration)) {
        const now = performance.now();
        if (now - lastUIAt > 80) {
          setRefProg(p => p.running ? { ...p, pct: Math.max(0, Math.min(100, Math.round((t / duration) * 100))) } : p);
          lastUIAt = now;
        }
      }
    }

    if (refCancelRef.current) {
      try { v.pause(); v.removeAttribute("src"); v.load(); } catch {}
      try { URL.revokeObjectURL(url); } catch {}
      setStatus("레퍼런스 처리 취소"); setRefProg({ pct: 0, running: false, fileName: "" });
      return;
    }

    // 정규화: 레퍼런스 자체 분포를 범위로 삼아 과대/과소 인식 완화
    const s1 = emaSmooth(seq, 0.3);
    const s2 = resampleSeq(s1, REF_N);
    const range = {
      knee:  { min: Math.min(...s2.map(x=>x[0])), max: Math.max(...s2.map(x=>x[0])) },
      hip:   { min: Math.min(...s2.map(x=>x[1])), max: Math.max(...s2.map(x=>x[1])) },
      trunk: { min: Math.min(...s2.map(x=>x[2])), max: Math.max(...s2.map(x=>x[2])) },
    };
    for (const k of ["knee","hip","trunk"]) {
      const span = Math.max(1e-3, range[k].max - range[k].min);
      range[k].min -= 0.05 * span; range[k].max += 0.05 * span;
    }
    const nA_ref = normAnglesWithRange(s2, range);
    const w2 = resampleSeq(ws.map(w => [w,0,0]), REF_N).map(x => x[0]);
    refSigRef.current = { seq: nA_ref, w: w2, range };

    setStatus(`레퍼런스 준비 완료 (프레임:${seq.length}→${REF_N})`);
    setRefProg({ pct: 100, running: false, fileName: file.name });

    // 메타/자동매칭
    try {
      const ch = (i) => s2.map(a => (a?.[i] ?? 0));
      const rom = (arr) => { let mn=Infinity,mx=-Infinity; for(const v of arr){ if(v<mn) mn=v; if(v>mx) mx=v; } return Math.round(mx-mn); };
      const kneeROM = rom(ch(0)), hipROM = rom(ch(1)), trunkROM = rom(ch(2));
      const countDips = (arr, low=80, minDist=8) => { let c=0,last=-999; for(let i=1;i<arr.length-1;i++){ if(arr[i]<low && arr[i]<=arr[i-1] && arr[i]<=arr[i+1] && i-last>minDist){c++; last=i;} } return c; };
      const peaks = countDips(ch(0));

      const cls = classifyFromROM({ kneeROM, hipROM, trunkROM });
      const romFocus=[]; if(kneeROM>=60) romFocus.push("knee"); if(hipROM>=50) romFocus.push("hip"); if(trunkROM>=20) romFocus.push("trunk");

      setRefMeta({
        fileName: file.name,
        kneeROM, hipROM, trunkROM, peaks,
        clsName: cls.name, clsDesc: cls.desc, cues: cls.cues, conf: cls.conf,
        focusJoints: Array.from(new Set([...(cls.focusJoints||[]), ...romFocus])),
      });

      // 관절 가중치 업데이트 → 정확도 계산에 즉시 반영
      W_CH_REF.current = focusToWeights(romFocus.length ? romFocus : ["knee","hip","trunk"]);
      // API 자동 매칭 (401이면 내부에서 자동 중단)  :contentReference[oaicite:8]{index=8}
      autoMatchByAPI({ clsName: cls.name, focusJoints: Array.from(new Set([...(cls.focusJoints||[]), ...romFocus])) }, setRefMeta);
    } catch (err) {
      console.warn("refMeta 추출 실패", err);
      setRefMeta(null);
      W_CH_REF.current = { ...W_CH_DEFAULT };
    }

    // 리소스 해제
    v.pause(); v.removeAttribute("src"); v.load(); URL.revokeObjectURL(url);
  }

  const cancelRefProcessing = () => {
    refCancelRef.current = true; setRefProg(p => ({ ...p, running: false }));
    try { refVideoRef.current?.pause(); refVideoRef.current?.removeAttribute("src"); refVideoRef.current?.load(); } catch {}
    const url = refCtxRef.current.url; if (url) { try { URL.revokeObjectURL(url); } catch {} refCtxRef.current.url = null; }
  };

  /* ---------- 라이브 시작/정지 ---------- */
  const startLive = useCallback(async () => {
    if (isLiveRef.current) return;
    try {
      if (!isSecureHost()) { setStatus("HTTPS(보안 컨텍스트) 필요: localhost 또는 https에서 실행하세요"); return; }
      try { const q = await navigator.permissions?.query?.({ name: "camera" }); if (q?.state === "denied") { setStatus("브라우저에서 카메라가 차단됨"); return; } } catch {}
      const det = await ensureDetector(detectorRef); if (!det) { setStatus("모델 준비 실패"); return; }

      const oldV = liveVideoRef.current; if (oldV) { try { oldV.pause(); } catch {} oldV.srcObject = null; }
      const stream = await getCameraStreamWithRetry(4); liveStreamRef.current = stream;

      const v = liveVideoRef.current;
      v.srcObject = stream; v.muted = true; v.setAttribute("muted",""); v.playsInline = true; v.setAttribute("playsinline",""); v.setAttribute("autoplay","");
      await v.play().catch(() => {}); if (v.readyState < 2 || !v.videoWidth) await once(v, "loadedmetadata");
      await Promise.race([once(v, "playing"), once(v, "loadeddata"), sleep(200)]); await waitForFirstFrame(v);

      const host = liveStageRef.current; if (host) host.style.setProperty("--live-ar", `${v.videoWidth || 16}/${v.videoHeight || 9}`);
      await afterNextPaint(); ensureCanvasHiDPI(liveCanvasRef.current);

      isLiveRef.current = true; setIsRunning(true); setCamOk(true);
      setStatus(`실시간 측정 시작 (카메라 ${v.videoWidth}×${v.videoHeight})`);
      runLiveLoop();
    } catch (e) {
      console.error("startLive error:", e);
      setStatus(`카메라 시작 실패: ${e?.name || ""} ${e?.message || ""}`); setCamOk(false); setIsRunning(false); isLiveRef.current = false;
    }
  }, []);

  const stopLive = useCallback(() => {
    if (!isLiveRef.current) return; isLiveRef.current = false;
    if (liveRafRef.current) { cancelAnimationFrame(liveRafRef.current); liveRafRef.current = null; }
    if (liveRVFCRef.current && typeof liveVideoRef.current?.cancelVideoFrameCallback === "function") {
      try { liveVideoRef.current.cancelVideoFrameCallback(liveRVFCRef.current); } catch {} liveRVFCRef.current = null;
    }
    const s = liveStreamRef.current; if (s?.getTracks) { s.getTracks().forEach(t => t.stop()); liveStreamRef.current = null; }
    const v = liveVideoRef.current; if (v) { try { v.pause(); } catch {} v.srcObject = null; }
    lastScoreRef.current = null; setScore(null); setStatus("정지됨"); setCamOk(false); setIsRunning(false);
    const c = liveCanvasRef.current; if (c) { const ctx = c.getContext("2d"); ctx && ctx.clearRect(0, 0, c.width, c.height); }
  }, []);

  /* ---------- 멀티카메라 콜백 ---------- */
  const onAddStream = useCallback((stream, id) => {
    const v = document.createElement("video");
    v.playsInline = true; v.muted = true; v.srcObject = stream;
    v.onloadedmetadata = () => v.play().catch(() => {});
    remoteVideosRef.current.set(id, v);
    remoteOrderRef.current = [...new Set([...remoteOrderRef.current, id])];

    const cleanup = () => {
      const vv = remoteVideosRef.current.get(id);
      if (vv) { try { vv.pause(); vv.removeAttribute("src"); vv.load(); } catch {} const s = vv.srcObject; s?.getTracks?.().forEach(t => t.stop()); }
      remoteVideosRef.current.delete(id);
      remoteOrderRef.current = remoteOrderRef.current.filter(x => x !== id);
      const list = remoteOrderRef.current.filter(x => x !== "local");
      setRemoteList(list);
      if (secondPick === id) setSecondPick(list[0] || "");
    };
    stream.addEventListener?.("inactive", cleanup);
    stream.getTracks?.().forEach(t => t.addEventListener("ended", cleanup));

    const list = remoteOrderRef.current.filter(x => x !== "local");
    setRemoteList(list);
    if (!secondPick && list.length) setSecondPick(list[0]);
  }, [secondPick]);
  const onRemoveStream = useCallback((id) => {
    const v = remoteVideosRef.current.get(id);
    if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch {} const s = v.srcObject; s?.getTracks?.().forEach(t => t.stop()); }
    remoteVideosRef.current.delete(id);
    remoteOrderRef.current = remoteOrderRef.current.filter(x => x !== id);
    const list = remoteOrderRef.current.filter(x => x !== "local");
    setRemoteList(list);
    if (secondPick && !list.includes(secondPick)) setSecondPick(list[0] || "");
  }, [secondPick]);

  /* PiP 영역에 실제 비디오 삽입 */
  useEffect(() => {
    const host = secondBoxRef.current;
    if (!host) return;
    host.innerHTML = "";
    if (showSecond && pipVisible && secondPick) {
      const v = remoteVideosRef.current.get(secondPick);
      if (v) {
        Object.assign(v.style, { width: "100%", height: "100%", objectFit: "cover", borderRadius: "12px" });
        host.appendChild(v);
      }
    }
  }, [showSecond, pipVisible, secondPick, remoteList]);

  /* PiP 초기 위치(우상단) */
  useLayoutEffect(() => {
    if (!showSecond || !pipVisible) return;
    if (pipPos.left != null && pipPos.top != null) return;
    const stage = liveStageRef.current, pip = pipRef.current; if (!stage || !pip) return;
    const sw = stage.clientWidth; const pw = pip.clientWidth || Math.min(sw * .28, 220);
    setPipPos({ left: sw - pw - 8, top: 48 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSecond, pipVisible]);

  /* PiP 드래그 */
  const onPipPointerDown = (e) => {
    const pip = pipRef.current, stage = liveStageRef.current; if (!pip || !stage) return;
    pip.setPointerCapture?.(e.pointerId);
    const dr = dragRef.current;
    dr.dragging = true; dr.sx = e.clientX; dr.sy = e.clientY;
    dr.startL = pipPos.left ?? 0; dr.startT = pipPos.top ?? 0;
    dr.moved = false; dr.t0 = performance.now();
  };
  const onPipPointerMove = (e) => {
    const dr = dragRef.current; if (!dr.dragging) return;
    const stage = liveStageRef.current, pip = pipRef.current; if (!stage || !pip) return;
    const dx = e.clientX - dr.sx, dy = e.clientY - dr.sy;
    if (Math.abs(dx) + Math.abs(dy) > 3) dr.moved = true;
    const sw = stage.clientWidth, sh = stage.clientHeight;
    const pw = pip.clientWidth, ph = pip.clientHeight;
    const left = clamp(dr.startL + dx, 0, Math.max(0, sw - pw));
    const top  = clamp(dr.startT + dy, 0, Math.max(0, sh - ph));
    setPipPos({ left, top });
  };
  const onPipPointerUp = (e) => {
    const pip = pipRef.current; pip?.releasePointerCapture?.(e.pointerId);
    const dr = dragRef.current;
    const dt = performance.now() - dr.t0;
    const tapped = !dr.moved && dt < 250;
    dr.dragging = false; dr.moved = false;
    if (tapped) setPipVisible(v => !v); // 탭 → 숨김/표시 토글
  };

  /* ---------- 라이브 루프(로컬 분석) ---------- */
  function runLiveLoop() {
    const v = liveVideoRef.current, c = liveCanvasRef.current; if (!v || !c) return;
    const ctx = c.getContext("2d");

    const inferAllowed = () => {
      const now = performance.now();
      if (now - lastInferAt.current < 1000 / LIVE_TARGET_FPS) return false;
      lastInferAt.current = now; return true;
    };

    const step = async () => {
      if (!isLiveRef.current || unmountedRef.current) return;
      ensureCanvasHiDPI(c); ctx.clearRect(0, 0, c.width, c.height);
      if (v.readyState >= 2 && v.videoWidth && v.videoHeight) {
        const vw = v.videoWidth, vh = v.videoHeight, cw = c.width, ch = c.height;
        const scale = Math.max(cw / vw, ch / vh), dw = vw * scale, dh = vh * scale;

        ctx.save(); ctx.translate(cw / 2, ch / 2); ctx.scale(-1, 1); ctx.translate(-dw / 2, -dh / 2);

        // 배경
        ctx.drawImage(v, 0, 0, dw, dh);

        // 세그 오버레이 (옵션)
        const segModeNow = segModeRef.current;
        if (segModeNow !== "off") {
          try {
            const segRes = await segOnce(segRef, v, segStateRef, 70);
            if (segRes?.segmentationMask) {
              if (segModeNow === "person") {
                ctx.globalCompositeOperation = "destination-in";
                ctx.drawImage(segRes.segmentationMask, 0, 0, dw, dh);
                ctx.globalCompositeOperation = "source-over";
              } else {
                ctx.save(); ctx.globalAlpha = .45; ctx.drawImage(segRes.segmentationMask, 0, 0, dw, dh);
                ctx.globalCompositeOperation = "source-in"; ctx.fillStyle = "#245cff"; ctx.fillRect(0, 0, dw, dh); ctx.restore();
              }
            }
          } catch {}
        }

        // 추론 + 스켈레톤 + 점수
        if (inferAllowed() && detectorRef.current) {
          try {
            const poses = await detectorRef.current.estimatePoses(v, { flipHorizontal: false });
            const kp = poses?.[0]?.keypoints;
            if (kp) {
              const sx = dw / vw, sy = dh / vh;
              const adj = kp.map(k => ({ ...k, x: k.x * sx, y: k.y * sy }));
              drawSkeleton(ctx, adj);

              const { angles, w } = anglesAndWeightFromKP(kp);
              ring.current[ptr.current] = angles; ringW.current[ptr.current] = w; ptr.current = (ptr.current + 1) % WIN;
            }

            if (refSigRef.current) {
              const seq = ring.current.slice(ptr.current).concat(ring.current.slice(0, ptr.current));
              const ws  = ringW.current.slice(ptr.current).concat(ringW.current.slice(0, ptr.current));
              const s1  = emaSmooth(seq, 0.3), s2 = resampleSeq(s1, REF_N);
              const nA  = normAnglesWithRange(s2, refSigRef.current.range || ANGLE_RANGE);
              const wLive = resampleSeq(ws.map(x => [x,0,0]), REF_N).map(x => x[0]);
              const wComb = wLive.map((wl, i) => Math.min(wl, (refSigRef.current.w?.[i] ?? 1)));
              const rmse  = weightedRMSE(nA, refSigRef.current.seq, wComb, W_CH_REF.current);
              lastScoreRef.current = rmseToScore(rmse);
              setScore(lastScoreRef.current);
            }
          } catch (err) { console.warn("estimatePoses error", err); }
        }
        ctx.restore();
      }

      drawAccuracyHUD(ctx, lastScoreRef.current, !!refSigRef.current, c);
      scheduleNext();
    };

    const scheduleNext = () => {
      if (!isLiveRef.current || unmountedRef.current) return;

      if (typeof v.requestVideoFrameCallback === "function") {
        liveRVFCRef.current = v.requestVideoFrameCallback(() => { step(); });
      } else { liveRafRef.current = requestAnimationFrame(step); }
    };
    scheduleNext();
  }

  /* 전체화면 */
  const isFullscreen = () =>
    document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement || liveStageRef.current?.classList.contains("pfs");
  async function enterFullscreen() {
    const el = liveStageRef.current; if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else throw new Error("noFS");
      if (screen.orientation?.lock) { try { await screen.orientation.lock("landscape"); } catch {} }
    } catch {
      el.classList.add("pfs"); document.body.style.overflow = "hidden";
    }
    requestAnimationFrame(() => ensureCanvasHiDPI(liveCanvasRef.current));
  }
  async function exitFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      } catch {}
      if (screen.orientation?.unlock) { try { screen.orientation.unlock(); } catch {} }
    } else {
      liveStageRef.current?.classList.remove("pfs"); document.body.style.overflow = "";
    }
    requestAnimationFrame(() => ensureCanvasHiDPI(liveCanvasRef.current));
  }
  const toggleFullscreen = () => { isFullscreen() ? exitFullscreen() : enterFullscreen(); };
  const onTouchEnd = (e) => { const now = Date.now(); if (now - lastTapRef.current < 300) { e.preventDefault(); toggleFullscreen(); } lastTapRef.current = now; };


  /* 인라인 로딩 아이콘 */
  const InlineSpinner = () => (
    <svg width="16" height="16" viewBox="0 0 50 50" style={{ marginRight: 8, flex: "0 0 auto" }}>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#cfe0ff" strokeWidth="6" />
      <path d="M25 5 a20 20 0 0 1 0 40" fill="none" stroke="#0a66ff" strokeWidth="6">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </path>
    </svg>
  );

  /* ---------- 렌더 ---------- */
  return (
    <div className="pose-mog">
      {/* 라이브카메라 */}
      <section className="card">
        <h2 className="card__title">자세 분석</h2>

        <div
          className="live-stage"
          ref={liveStageRef}
          onDoubleClick={toggleFullscreen}
          onTouchEnd={onTouchEnd}
          style={{ position: "relative" }}
        >
          <button className="fs-btn" onClick={toggleFullscreen} title="전체화면">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 10V4h6M20 14v6h-6M20 10V4h-6M4 14v6h6" stroke="#245cff" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {refProg.running && (
            <div
              style={{
                position: "absolute", top: 8, right: 8, padding: "4px 8px",
                borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: "#E8F1FF", color: "#0A66FF",
                boxShadow: "0 2px 8px rgba(10,102,255,0.18)", zIndex: 2,
                display: "flex", alignItems: "center", gap: 6
              }}
              aria-live="polite"
            >
              <InlineSpinner /> Ref {refProg.pct}%
            </div>
          )}

          <div className="live-viewport">
          <video  ref={liveVideoRef} playsInline muted className="live-video" />
            <canvas ref={liveCanvasRef} className="live-canvas" />
          </div>
        </div>

        <div className="status-row">
          <div className="status-left">
            <span className="status-label">상태: {status} {ready ? "✅" : ""}</span>
            <span className={`status-ok ${camOk ? "on" : "off"}`} title={camOk ? "카메라 OK" : "카메라 대기"} />
          </div>
        </div>

        {/* 세그 토글 */}
        <div className="seg-row" style={{ marginTop: 10, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div className="seg-pill">
            <button className={segMode === "off" ? "on" : ""}     onClick={() => setSegMode("off")}>off</button>
            <button className={segMode === "person" ? "on" : ""}  onClick={() => setSegMode("person")}>person</button>
            <button className={segMode === "overlay" ? "on" : ""} onClick={() => setSegMode("overlay")}>overlay</button>
          </div>
        </div>
      </section>

      {/* 파일 업로드 */}
      <section className="card">
        <h2 className="card__title">파일 업로드</h2>
        {refProg.running ? (
          <div role="status" aria-live="polite">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InlineSpinner />
              <span style={{ fontSize: 14, color: "#0b1628", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                레퍼런스 처리 중{refProg.fileName ? ` · ${refProg.fileName}` : ""} · <strong>{refProg.pct}%</strong>
              </span>
              <button onClick={cancelRefProcessing} style={{ border: "none", background: "transparent", color: "#7a8aa0", fontSize: 13, padding: "4px 6px", cursor: "pointer" }} title="취소">취소</button>
            </div>
            <div style={{ height: 6, borderRadius: 999, background: "#e8eef6", overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: `${refProg.pct}%`, height: "100%", background: "linear-gradient(90deg,#0a66ff,#3baaff)", transition: "width .2s ease" }} />
            </div>
          </div>
        ) : (
          <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files?.[0]) handleLoadReferenceFile(e); }}>
            <input id="refFile" type="file" accept="video/*" onChange={handleLoadReferenceFile} hidden />
            <label htmlFor="refFile">여기로 드래그 또는 탭하여 업로드</label>
            <video ref={refVideoRef} playsInline muted style={{ display: "none" }} />
            <canvas ref={refCanvasRef} width={360} height={180} style={{ display: "none" }} />
          </div>
        )}
      </section>

      {/* 카드 밖 CTA */}
      <div className="cta-wrap">
        <button onClick={isRunning ? stopLive : startLive} className={`btn btn-primary cta-primary ${isRunning ? "is-stop" : ""}`} aria-pressed={isRunning} disabled={refProg.running}>
          {isRunning ? "스톱" : "분석 시작"}
        </button>
      </div>

      {/* 통합 카드: 운동 분석·인사이트 + 점수 */}
      <ExerciseInsight
        refMeta={refMeta}
        score={score}
        onPick={(picked) => {
          const fromDesc = picked?.desc || "";
          const jointByText = (() => {
            const t = fromDesc.toLowerCase();
            const s = new Set(picked?.joints || []);
            if (/무릎|knee|quad/.test(t)) s.add("knee");
            if (/엉덩|고관절|hip|glute/.test(t)) s.add("hip");
            if (/몸통|코어|척추|trunk|core|spine|허리/.test(t)) s.add("trunk");
            if (/어깨|shoulder/.test(t)) s.add("shoulder");
            if (/팔꿈치|elbow/.test(t)) s.add("elbow");
            if (/발목|ankle/.test(t)) s.add("ankle");
            return Array.from(s);
          })();

          setRefMeta((prev) => ({
            ...(prev || {}),
            clsName: picked.name,
            clsDesc: picked.desc,
            cues: picked.cues || [],
            focusJoints: Array.from(new Set([...(prev?.focusJoints || []), ...jointByText])),
            conf: 1,
            autoMatched: true,
          }));

          const chFocus = jointByText.filter(j => j === "knee" || j === "hip" || j === "trunk");
          if (chFocus.length) W_CH_REF.current = focusToWeights(chFocus);
        }}
      />

      {/* 멀티 카메라 연결 */}
      <MultiCamConnect onAddStream={onAddStream} onRemoveStream={onRemoveStream} />
    </div>
  );
}

/* 간이 분류기 — 임계치 보정(스쿼트 과대탐지 완화) */  // :contentReference[oaicite:9]{index=9}
function classifyFromROM({ kneeROM, hipROM, trunkROM }) {
  const isSitUp   = trunkROM >= 32 && hipROM >= 42 && kneeROM <= 85;
  const isSquat   = kneeROM  >= 85 && hipROM >= 65 && trunkROM <= 22; // 몸통 허용범위 축소
  const isHinge   = hipROM   >= 75 && kneeROM <= 55 && trunkROM <= 28;

  if (isSitUp) {
    const conf = Math.min((trunkROM - 32) / 30, (hipROM - 42) / 30, (85 - kneeROM) / 35 + 0.4);
    return { name: "Sit-Up", desc: "복부 중심의 몸통 굴곡 패턴.", cues:["턱을 살짝 당기고 반동 금지","올릴 때 숨 내쉬기"], conf: clamp(conf,0,1), focusJoints:["trunk","hip"] };
  }
  if (isHinge) {
    const conf = Math.min((hipROM - 75) / 30, (55 - kneeROM) / 30 + 0.4, (28 - trunkROM) / 20 + 0.3);
    return { name: "Hip Hinge", desc: "둔·햄스트링 중심 힌지.", cues:["허리 중립 유지","엉덩이를 뒤로 보내기"], conf: clamp(conf,0,1), focusJoints:["hip","trunk"] };
  }
  if (isSquat) {
    const conf = Math.min((kneeROM - 85) / 30, (hipROM - 65) / 25, (22 - trunkROM) / 18 + 0.3);
    return { name: "Squat", desc: "하지 굴곡/신전 패턴.", cues:["무릎-발끝 정렬","가슴 열고 중심 안정"], conf: clamp(conf,0,1), focusJoints:["knee","hip","trunk"] };
  }
  // 미확정: 가장 큰 ROM 기준으로 힌트만 제공
  const maxROM = Math.max(kneeROM, hipROM, trunkROM);
  if (maxROM === trunkROM) return { name: "패턴 인식 중", desc: "몸통 굴곡/신전 패턴 계열로 추정.", cues:[], conf:0.2, focusJoints:["trunk","hip"] };
  if (maxROM === hipROM)   return { name: "패턴 인식 중", desc: "엉덩 관절 중심 패턴으로 추정.", cues:[], conf:0.2, focusJoints:["hip","trunk"] };
  return { name: "패턴 인식 중", desc: "하지 중심 패턴으로 추정.", cues:[], conf:0.2, focusJoints:["knee","hip"] };
}

/* 카메라 스트림 재시도 */
async function getCameraStreamWithRetry(retries = 3) {
  let err = null;
  for (let i = 0; i < retries; i++) {
    try {
      const constraints = i === 0
        ? { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: "user" };
      return await navigator.mediaDevices.getUserMedia({ video: constraints, audio: false });
    } catch (e) { err = e; await new Promise(r => setTimeout(r, 250 * (i + 1))); }
  }
  throw err || new Error("getUserMedia failed");
}
