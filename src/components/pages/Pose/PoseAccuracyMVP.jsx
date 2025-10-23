// PoseAccuracyMVP.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import "./PoseAccuracyMVP.css";

/* =========================
 * 서버 / 표시 토글 설정
 * ========================= */
const API_BASE = import.meta.env.VITE_AI_BASE || "http://localhost:9000";
/** 개발 모드 또는 명시적으로 1이면 ON/OFF 토글을 보여줍니다. 운영 기본은 자동 선택(서버 있으면 yolo 사용) */
const SHOW_ENGINE_TOGGLE =
  (import.meta.env.DEV ?? false) ||
  (import.meta.env.VITE_SHOW_ENGINE_TOGGLE === "1");

/* ===== 분석 상수 ===== */
const LIVE_TARGET_FPS = 20; // TFJS
const YOLO_TARGET_FPS = 10; // 네트워크 왕복 고려
const WIN = 60;             // 라이브 슬라이딩 윈도우
const REF_N = 100;          // 레퍼런스 정규화 길이

const ANGLE_RANGE = {
  knee:  { min: 60, max: 180 },
  hip:   { min: 50, max: 180 },
  trunk: { min:  0, max:  45 },
};

/* ===== 유틸 ===== */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const once  = (el, ev) => new Promise(r => { const h=()=>{el.removeEventListener(ev,h);r();}; el.addEventListener(ev,h,{once:true}); });
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));
const isSecureHost = () => window.isSecureContext || location.protocol==="https:" || ["localhost","127.0.0.1","[::1]"].includes(location.hostname);

function angle(a,b,c){const v1=[a.x-b.x,a.y-b.y],v2=[c.x-b.x,c.y-b.y];const dot=v1[0]*v2[0]+v1[1]*v2[1];const n=(Math.hypot(...v1)*Math.hypot(...v2))+1e-8;return Math.acos(clamp(dot/n,-1,1))*180/Math.PI;}
function trunkFlex(ls,rs,lh,rh){const sm={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2};const hm={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2};const v=[sm.x-hm.x,sm.y-hm.y],up=[0,-1];const dot=v[0]*up[0]+v[1]*up[1],n=Math.hypot(...v)+1e-8;return Math.acos(clamp(dot/n,-1,1))*180/Math.PI;}

function emaSmooth(seq,a=0.3){ if(!seq.length) return seq; const out=new Array(seq.length); let p=seq[0]; out[0]=p;
  for(let i=1;i<seq.length;i++){const c=seq[i]; p=[a*c[0]+(1-a)*p[0],a*c[1]+(1-a)*p[1],a*c[2]+(1-a)*p[2]]; out[i]=p;} return out; }
function resampleSeq(seq,N){ if(!seq.length) return []; const out=new Array(N),L=seq.length-1;
  for(let i=0;i<N;i++){const t=i*(L/(N-1)),i0=Math.floor(t),i1=Math.min(L,i0+1),r=t-i0; const a=seq[i0],b=seq[i1]; out[i]=[a[0]+(b[0]-a[0])*r,a[1]+(b[1]-a[1])*r,a[2]+(b[2]-a[2])*r];}
  return out; }
function normAngles(seq){
  return seq.map(([k,h,t])=>[
    (clamp(k,ANGLE_RANGE.knee.min,ANGLE_RANGE.knee.max)-ANGLE_RANGE.knee.min)/(ANGLE_RANGE.knee.max-ANGLE_RANGE.knee.min),
    (clamp(h,ANGLE_RANGE.hip.min, ANGLE_RANGE.hip.max) -ANGLE_RANGE.hip.min )/(ANGLE_RANGE.hip.max -ANGLE_RANGE.hip.min ),
    (clamp(t,ANGLE_RANGE.trunk.min,ANGLE_RANGE.trunk.max)-ANGLE_RANGE.trunk.min)/(ANGLE_RANGE.trunk.max-ANGLE_RANGE.trunk.min),
  ]);
}
function weightedRMSE(A,B,frameW=null,W={knee:.4,hip:.35,trunk:.25}){ if(A.length!==B.length||A.length===0) return Infinity;
  let seK=0,seH=0,seT=0,ws=0; for(let i=0;i<A.length;i++){ const w=frameW?(frameW[i]??1):1; if(w<=0) continue;
    const [ak,ah,at]=A[i],[bk,bh,bt]=B[i]; seK+=w*(ak-bk)**2; seH+=w*(ah-bh)**2; seT+=w*(at-bt)**2; ws+=w; }
  if(!ws) return Infinity; const rK=Math.sqrt(seK/ws), rH=Math.sqrt(seH/ws), rT=Math.sqrt(seT/ws);
  return W.knee*rK + W.hip*rH + W.trunk*rT; }

const rmseToScore = (rmse)=> clamp(Math.round(100*(1-rmse/0.5)), 1, 100);

/* ===== 가중치: 운동 포커스 관절에 따라 분배 ===== */
const focusToWeights = (joints=[])=>{
  const base={knee:.2,hip:.2,trunk:.2};
  const pick=joints.filter(j=>["knee","hip","trunk"].includes(j));
  if(pick.length){ pick.forEach(j=>{ base[j]+=0.6/pick.length; }); }
  else { base.knee=.4;base.hip=.35;base.trunk=.25; }
  const s=base.knee+base.hip+base.trunk;
  return {knee:base.knee/s,hip:base.hip/s,trunk:base.trunk/s};
};

/* === 뷰 기반 가중치/벌점 유틸(표시는 안 함) === */
const normalizeW = (W)=>{ const s=W.knee+W.hip+W.trunk||1; return {knee:W.knee/s, hip:W.hip/s, trunk:W.trunk/s}; };
const blendW = (A,B,alpha=0.5)=> normalizeW({
  knee: A.knee*(1-alpha)+B.knee*alpha,
  hip:  A.hip *(1-alpha)+B.hip *alpha,
  trunk:A.trunk*(1-alpha)+B.trunk*alpha
});
function inferViewFromKeypoints(kps){
  const by=Object.fromEntries(kps.map(k=>[k.name,k]));
  const ls=by.left_shoulder, rs=by.right_shoulder, lh=by.left_hip, rh=by.right_hip;
  if(!ls||!rs||!lh||!rh) return {label:"oblique", conf:0.0};
  const shoulderW=Math.hypot(ls.x-rs.x,ls.y-rs.y);
  const hipW=Math.hypot(lh.x-rh.x,lh.y-rh.y);
  const sm={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2}, hm={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2};
  const torsoH=Math.hypot(sm.x-hm.x,sm.y-hm.y)+1e-6;
  const ratioW=(shoulderW+hipW*0.5)/torsoH;
  const gapN=clamp(Math.abs((ls.score??0)-(rs.score??0))+Math.abs((lh.score??0)-(rh.score??0))/1.0,0,1);
  let label="oblique";
  if(ratioW<=0.75||gapN>=0.35) label="side";
  else if(ratioW>=1.05&&gapN<=0.2) label="front";
  const sideScore=clamp((0.9-ratioW)/0.6+gapN*0.6,0,1);
  const frontScore=clamp((ratioW-0.95)/0.6+(0.3-gapN)*0.6,0,1);
  const conf=label==="side"?sideScore:label==="front"?frontScore:0.4;
  return {label, conf};
}
function weightsForView(label){
  if(label==="side")  return {knee:.45, hip:.40, trunk:.15};
  if(label==="front") return {knee:.10, hip:.10, trunk:.20}; // 정면은 각도 의존↓, 벌점↑
  return                {knee:.35, hip:.35, trunk:.30};      // oblique
}
function penaltyForIssues(label, issues){
  const W_side    = { kneeAlign:0.05, trunkLean:0.65, pelvisTilt:0.10, asymmetry:0.20 };
  const W_front   = { kneeAlign:0.55, trunkLean:0.10, pelvisTilt:0.25, asymmetry:0.10 };
  const W_oblique = { kneeAlign:0.30, trunkLean:0.30, pelvisTilt:0.20, asymmetry:0.20 };
  const W = label==="side" ? W_side : label==="front" ? W_front : W_oblique;
  const sum = W.kneeAlign + W.trunkLean + W.pelvisTilt + W.asymmetry;
  const s =
    (issues.kneeAlign?W.kneeAlign:0) +
    (issues.trunkLean?W.trunkLean:0) +
    (issues.pelvisTilt?W.pelvisTilt:0) +
    (issues.asymmetry?W.asymmetry:0);
  return clamp(s/(sum||1),0,1);
}

/* ===== 전/후면 선택: facingMode 우선 → deviceId 폴백 ===== */
async function pickDeviceIdForFacing(facingHint = "environment"){
  try{
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videos = devices.filter(d=>d.kind==="videoinput");
    if(!videos.length) return null;
    const labelBack=/back|rear|environment|후면/i, labelFront=/front|user|전면/i;
    if(facingHint==="environment"){
      const by=videos.find(v=>labelBack.test(v.label)); if(by) return by.deviceId;
      return videos[videos.length-1]?.deviceId ?? videos[0].deviceId;
    }else{
      const by=videos.find(v=>labelFront.test(v.label)); if(by) return by.deviceId;
      return videos[0].deviceId;
    }
  }catch{ return null; }
}
async function getStreamWithFacing(facing="user"){
  try{
    return await navigator.mediaDevices.getUserMedia({
      video:{ facingMode:{ ideal:facing }, width:{ideal:1280}, height:{ideal:720} },
      audio:false
    });
  }catch{
    const deviceId = await pickDeviceIdForFacing(facing);
    if(!deviceId) throw new Error("No camera device available");
    return await navigator.mediaDevices.getUserMedia({
      video:{ deviceId:{ exact: deviceId }, width:{ideal:1280}, height:{ideal:720} },
      audio:false
    });
  }
}

/* ====== 카메라 없는 테스트: video 파일/URL -> MediaStream ====== */
async function getStreamFromVideoFile(fileOrUrl){
  const url = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  const vid = document.createElement("video");
  vid.src = url; vid.muted = true; vid.playsInline = true; vid.loop = true;
  try { await vid.play(); } catch {}
  if (vid.readyState < 2 || !vid.videoWidth) {
    await new Promise(r => vid.addEventListener("loadedmetadata", r, { once: true }));
  }
  const stream = vid.captureStream ? vid.captureStream() : (vid.mozCaptureStream ? vid.mozCaptureStream() : null);
  if (!stream) throw new Error("이 브라우저는 captureStream을 지원하지 않습니다.");
  const cleanup = () => { try{vid.pause();}catch{} try{URL.revokeObjectURL(url);}catch{} };
  return { stream, cleanup, vid };
}

/* ===== 운동 DB ===== */
const EX_DB = [
  { id:"squat",  name:"스쿼트", joints:["knee","hip","trunk"],
    desc:"하지 굴곡/신전 패턴. 무릎-발끝 정렬과 중심 안정이 핵심입니다.",
    cues:["무릎은 발끝과 같은 방향","가슴 열기","발 전체로 밀어 일어나기"],
    proto:{ kneeROM:110, hipROM:90, trunkROM:20 } },
  { id:"lunge",  name:"런지", joints:["knee","hip","trunk"],
    desc:"한쪽 지지에서 균형과 ROM을 강조하는 패턴.",
    cues:["앞무릎 발끝 넘지 않기","골반 정렬 유지"],
    proto:{ kneeROM:100, hipROM:80, trunkROM:25 } },
  { id:"pushup", name:"푸시업", joints:["trunk"],
    desc:"상지-코어 연계. 몸통을 일직선으로 유지하세요.",
    cues:["팔꿈치 약 45°","몸통 일직선 유지","내릴 때 숨 들이쉬기"],
    proto:{ kneeROM:10, hipROM:15, trunkROM:10 } },
  { id:"situp",  name:"싯업", joints:["trunk","hip"],
    desc:"복부 중심의 몸통 굴곡. 반동 없이 부드럽게.",
    cues:["턱 가볍게 당기기","반동 금지","올릴 때 숨 내쉬기"],
    proto:{ kneeROM:30, hipROM:60, trunkROM:45 } },
  { id:"plank",  name:"플랭크", joints:["trunk"],
    desc:"정적 코어 안정. 어깨-엉덩이-발목 일직선.",
    cues:["복부/둔근 가볍게 수축","허리 꺾이지 않게"],
    proto:{ kneeROM:10, hipROM:10, trunkROM:8 } },
];

function classifyByDB({kneeROM, hipROM, trunkROM}){
  const N = (v, max)=> v/(max||1);
  let best=null, bestD=1e9;
  for(const ex of EX_DB){
    const p=ex.proto;
    const d =
      (N(kneeROM- p.kneeROM, 120))**2 +
      (N(hipROM - p.hipROM , 120))**2 +
      (N(trunkROM- p.trunkROM, 90))**2;
    if(d<bestD){bestD=d; best=ex;}
  }
  const conf = clamp(Math.round(100*(1 - Math.min(bestD,1))) , 0, 100);
  return { ...best, conf };
}

/* ===== 폼 평가 유틸 ===== */
const len = (a,b)=>Math.hypot(a.x-b.x, a.y-b.y);
const distPointToLineNorm = (P, A, B) => {
  const ABx = B.x - A.x, ABy = B.y - A.y;
  const APx = P.x - A.x, APy = P.y - A.y;
  const denom = Math.hypot(ABx, ABy) + 1e-8;
  return Math.abs(ABx*APy - ABy*APx) / denom / denom; // 정규화된 편차
};
const kneeAngle = (by, side="right") => angle(by[`${side}_hip`], by[`${side}_knee`], by[`${side}_ankle`]);

function assessFrameIssues(kp, exId) {
  const by = Object.fromEntries(kp.map(k => [k.name, k]));
  let kneeAlign=false, trunkLean=false, pelvisTilt=false, asymmetry=false;

  try {
    const devR = distPointToLineNorm(by.right_knee, by.right_ankle, by.right_hip);
    const devL = by.left_knee && by.left_ankle && by.left_hip
      ? distPointToLineNorm(by.left_knee, by.left_ankle, by.left_hip) : 0;
    kneeAlign = (devR > 0.12) || (devL > 0.12);
  } catch {}

  try {
    const t = trunkFlex(by.left_shoulder, by.right_shoulder, by.left_hip, by.right_hip);
    const limit = exId === "pushup" ? 20 : (exId === "hinge" ? 40 : 32);
    trunkLean = t > limit;
  } catch {}

  try {
    const sh = len(by.left_shoulder, by.right_shoulder) || 1;
    const diff = Math.abs((by.left_hip?.y ?? 0) - (by.right_hip?.y ?? 0)) / sh;
    pelvisTilt = diff > 0.08;
  } catch {}

  try {
    const kr = kneeAngle(by, "right");
    const kl = kneeAngle(by, "left");
    asymmetry = Number.isFinite(kr) && Number.isFinite(kl) && Math.abs(kr - kl) > 18;
  } catch {}

  return { kneeAlign, trunkLean, pelvisTilt, asymmetry };
}

/* ===== 세그먼테이션 ===== */
const segState = ()=>({busy:false,last:null,lastAt:0});

async function ensureSeg(segRef){
  if(segRef.current) return segRef.current;
  const seg = new SelfieSegmentation({
    locateFile: (f)=>`https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
  });
  seg.setOptions({ modelSelection: 1, selfieMode: true });
  if (typeof seg.initialize === "function") {
    try { await seg.initialize(); } catch {}
  }
  segRef.current = seg; return seg;
}

async function segOnce(segRef, image, stateRef, intervalMs=70){
  const st = stateRef.current; const now=performance.now();
  if(st.busy || (now-st.lastAt)<intervalMs) return st.last;
  if(!(image?.videoWidth>0 && image?.videoHeight>0)) return st.last;
  st.busy=true;
  const seg=await ensureSeg(segRef);
  const res = await new Promise((resolve)=>{
    const h=(r)=>{ seg.onResults(()=>{}); resolve(r); };
    seg.onResults(h); seg.send({ image });
  });
  st.last=res; st.lastAt=performance.now(); st.busy=false; return res;
}

/* ===== 감지기: MoveNet → 실패시 BlazePose 폴백 ===== */
async function ensureDetector(detectorRef){
  if(detectorRef.current) return detectorRef.current;
  await tf.ready(); try{ await tf.setBackend("webgl"); }catch{}
  try{
    const opts = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
    if (import.meta?.env?.VITE_MOVENET_URL) opts.modelUrl = import.meta.env.VITE_MOVENET_URL;
    const det = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, opts);
    detectorRef.current = det; return det;
  }catch(e){ console.warn("MoveNet 실패, BlazePose 폴백", e); }
  const det = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose, {
    runtime: "mediapipe",
    modelType: "full",
    solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose",
  });
  detectorRef.current = det; return det;
}

/* ===== 스켈레톤/HUD ===== */
const EDGES = [
  ["left_shoulder","right_shoulder"],["left_hip","right_hip"],
  ["left_shoulder","left_elbow"],["left_elbow","left_wrist"],
  ["right_shoulder","right_elbow"],["right_elbow","right_wrist"],
  ["left_hip","left_knee"],["left_knee","left_ankle"],
  ["right_hip","right_knee"],["right_knee","right_ankle"],
  ["left_shoulder","left_hip"],["right_shoulder","right_hip"]
];
function drawSkel(ctx,kps){
  ctx.save(); ctx.lineWidth=3; ctx.strokeStyle="rgba(95,212,255,.85)"; ctx.fillStyle="#5fd4ff";
  EDGES.forEach(([a,b])=>{const A=kps.find(k=>k.name===a),B=kps.find(k=>k.name===b); if(!A||!B) return; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();});
  kps.forEach(k=>{ctx.beginPath(); ctx.arc(k.x,k.y,4,0,Math.PI*2); ctx.fill();});
  ctx.restore();
}
function drawHUD(ctx,score,hasRef,canvas,rec=false,sec=0){
  const dpr=window.devicePixelRatio||1,x=8*dpr,y=8*dpr,w=Math.min(240*dpr,canvas.width-16*dpr),h=28*dpr,r=12*dpr,p=10*dpr;
  ctx.save(); ctx.globalAlpha=.88; ctx.fillStyle="rgba(0,12,28,.55)";
  if(ctx.roundRect){ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill();}
  else{ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill();}
  const pct=Number.isFinite(score)?score/100:0, bx=x+p, by=y+h/2-4*dpr, bw=w-2*p-(rec?52*dpr:0), bh=8*dpr;
  const grad=ctx.createLinearGradient(bx,by,bx+bw,by); grad.addColorStop(0,"#2F6BFF"); grad.addColorStop(1,"#5FD4FF");
  ctx.fillStyle="#0E2B57"; ctx.fillRect(bx,by,bw,bh); ctx.fillStyle=grad; ctx.fillRect(bx,by,Math.round(bw*pct),bh);
  ctx.fillStyle="#fff"; ctx.font=`${12*dpr}px system-ui,-apple-system,Roboto,Arial`; ctx.textBaseline="middle";
  ctx.fillText(hasRef?`정확도: ${Number.isFinite(score)?score+"%":"--"}`:"레퍼런스 필요", bx, y+h/2);
  if(rec){ const rx=x+w-44*dpr, ry=y+h/2; ctx.fillStyle="#EF4444"; ctx.beginPath(); ctx.arc(rx,ry,5*dpr,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#fff"; const mmss=`${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`; ctx.fillText(mmss, rx+10*dpr, ry); }
  ctx.restore();
}

/* ===== 스크롤 유틸 ===== */
function getScrollContainer(el) {
  const regex = /(auto|scroll)/;
  let node = el?.parentElement;
  while (node) {
    const s = getComputedStyle(node);
    if (regex.test(s.overflowY)) return node;
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}
function scrollResultIntoView(el) {
  if (!el) return;
  const sc = getScrollContainer(el);
  const rect = el.getBoundingClientRect();
  const scTop = sc.scrollTop || window.pageYOffset || 0;
  const offset = 16;
  const topTarget =
    scTop + rect.top - (sc === document.documentElement ? 0 : sc.getBoundingClientRect().top) - offset;
  sc.scrollTo({ top: Math.max(0, topTarget), behavior: "smooth" });
  setTimeout(() => sc.scrollTo({ top: sc.scrollHeight, behavior: "smooth" }), 180);
}

/* ===== YOLO keypoint → TFJS 네이밍 매핑 ===== */
function yoloKeypointsToNamed(kps){
  const idx = (i)=>kps.find(k=>k.id===i) || {};
  const as = (id,name)=>({ name, x: idx(id).x ?? 0, y: idx(id).y ?? 0, score: idx(id).conf ?? 0 });
  return [
    as(5,"left_shoulder"), as(6,"right_shoulder"),
    as(7,"left_elbow"),    as(8,"right_elbow"),
    as(9,"left_wrist"),    as(10,"right_wrist"),
    as(11,"left_hip"),     as(12,"right_hip"),
    as(13,"left_knee"),    as(14,"right_knee"),
    as(15,"left_ankle"),   as(16,"right_ankle"),
  ];
}

/* ===== 로컬스토리지 bool ===== */
const LS_KEY_YOLO_OVERLAY = "mog.yoloOverlayOn";
function usePersistentBool(key, initial = true) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

/* =========================
 * 메인 컴포넌트
 * ========================= */
export default function PoseAccuracyMVP(){
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef= useRef(null);
  const refVideo = useRef(null);
  const refCanvas= useRef(null);

  const detectorRef= useRef(null);
  const segRef     = useRef(null);
  const segStateRef= useRef(segState());

  const refSigRef  = useRef(null);
  const W_REF      = useRef({knee:.4,hip:.35,trunk:.25});
  const ring       = useRef(Array.from({length:WIN},()=>[0,0,0]));
  const ringW      = useRef(Array.from({length:WIN},()=>1));
  const ptr        = useRef(0);
  const lastInfer  = useRef(0);
  const runningRef = useRef(false);

  // YOLO 전송용
  const yoloBusy   = useRef(false);
  const yoloImgRef = useRef(null);
  const offscreen  = useRef(null);

  const sessionRef = useRef({
    start: 0, t: [], score: [], knee: [], hip: [], trunk: [],
    issues: { kneeAlign:0, trunkLean:0, pelvisTilt:0, asymmetry:0, total:0 },
  });

  const [status,setStatus]     = useState("라이브 대기");
  const [segMode,setSegMode]   = useState("off"); // UI는 숨김
  const [isRunning,setRunning] = useState(false);
  const [recSec,setRecSec]     = useState(0);
  const [score,setScore]       = useState(null);

  // 엔진 토글 & 서버 상태
  const [engine,setEngine]     = useState("local");   // 'local' | 'yolo'
  const [serverUp,setServerUp] = useState(false);

  const [ex,setEx]             = useState(null);
  const exRef = useRef(null);  useEffect(()=>{ exRef.current = ex; }, [ex]);

  const [refProg,setRefProg]   = useState({running:false,pct:0,fileName:""});
  const [result,setResult]     = useState(null);

  const [camFacing, setCamFacing] = useState("user"); // "user" | "environment"
  const streamRef = useRef(null);
  const resultRef = useRef(null);

  // ▼ 카메라 없는 테스트 모드 (녹화영상)
  const [mockMode, setMockMode] = useState(false);
  const [mockFile, setMockFile] = useState(null);
  const mockCleanupRef = useRef(()=>{});

  // ▼ 뷰/이슈(표시는 안 함, 점수용) 
  const viewRef = useRef({ label: "side", conf: 0 });
  const lastIssuesRef = useRef({ kneeAlign:false, trunkLean:false, pelvisTilt:false, asymmetry:false });

  // ▼ YOLO 오버레이 ON/OFF (draw만 제어, 로컬스토리지에 기억)
  const [yoloOverlayOn, setYoloOverlayOn] = usePersistentBool(LS_KEY_YOLO_OVERLAY, true);

  /* 서버 가용성 체크 → 자동 엔진선택 + 토글 노출 제어 */
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/docs`, { method: "HEAD" });
        if (r.ok) {
          setServerUp(true);
          if (!SHOW_ENGINE_TOGGLE) setEngine("yolo");
        } else {
          setServerUp(false);
          setEngine("local");
        }
      } catch {
        setServerUp(false);
        setEngine("local");
      }
    })();
  }, []);

  /* 타이머 */
  useEffect(()=>{ if(!isRunning) return; setRecSec(0); const t=setInterval(()=>setRecSec(s=>s+1),1000); return ()=>clearInterval(t); },[isRunning]);

  /* 시작 */
  const start = useCallback(async ()=>{
    if(runningRef.current) return;
    if(!mockMode && !isSecureHost()){ setStatus("HTTPS 또는 localhost 필요"); return; }

    try{
      const det = await ensureDetector(detectorRef); if(!det){ setStatus("모델 준비 실패"); return; }

      // 기존 스트림/리소스 정리
      try{ streamRef.current?.getTracks?.().forEach(t=>t.stop()); }catch{}
      try{ mockCleanupRef.current?.(); }catch{}

      setStatus("입력 초기화 중…");

      // 입력 스트림 준비
      let s;
      if (mockMode) {
        if (!mockFile) { setStatus("테스트 모드: 영상 파일을 선택하세요"); return; }
        const { stream, cleanup } = await getStreamFromVideoFile(mockFile);
        s = stream; mockCleanupRef.current = cleanup;
      } else {
        s = await getStreamWithFacing(camFacing); mockCleanupRef.current = ()=>{};
      }
      streamRef.current = s;

      const v = videoRef.current; v.srcObject=s; v.muted=true; v.playsInline=true;
      await v.play().catch(()=>{}); if(v.readyState<2||!v.videoWidth) await once(v,"loadedmetadata");

      if(!offscreen.current){ offscreen.current = document.createElement("canvas"); }
      const ow = 640, oh = Math.round((v.videoHeight / v.videoWidth) * ow);
      offscreen.current.width = ow; offscreen.current.height = oh;

      yoloImgRef.current = null;

      runningRef.current = true; setRunning(true); setStatus("실시간 분석 중");
      sessionRef.current = {
        start: performance.now(), t: [], score: [], knee: [], hip: [], trunk: [],
        issues: { kneeAlign:0, trunkLean:0, pelvisTilt:0, asymmetry:0, total:0 },
      };
      loop();
    }catch(e){ console.error(e); setStatus("카메라 시작 실패"); }
  },[camFacing, mockMode, mockFile]);

  /* 정지 → 요약 계산 + 결과로 스크롤 */
  const stop = useCallback(()=>{
    if(!runningRef.current) return;
    runningRef.current=false; setRunning(false); setStatus("정지됨");

    try{ streamRef.current?.getTracks?.().forEach(t=>t.stop()); }catch{}
    try{ streamRef.current=null; videoRef.current.srcObject=null; }catch{}
    try{ mockCleanupRef.current?.(); }catch{}

    try{
      const S=sessionRef.current;
      const avg = S.score.length? Math.round(S.score.reduce((a,b)=>a+b,0)/S.score.length): null;
      const reps=(()=>{ const arr=S.knee||[]; let down=false,c=0; for(let i=1;i<arr.length;i++){const v=arr[i]; if(!Number.isFinite(v))continue; if(!down&&v<100)down=true; else if(down&&v>160){c++;down=false;}} return c;})();
      const rom = {
        knee:  S.knee.length?  Math.round(Math.max(...S.knee.filter(Number.isFinite))-Math.min(...S.knee.filter(Number.isFinite))):null,
        hip:   S.hip.length?   Math.round(Math.max(...S.hip.filter(Number.isFinite)) -Math.min(...S.hip.filter(Number.isFinite))) :null,
        trunk: S.trunk.length? Math.round(Math.max(...S.trunk.filter(Number.isFinite))-Math.min(...S.trunk.filter(Number.isFinite))):null,
      };
      const t0=S.start||0; const series={ t:S.t.map(x=>Math.round((x-t0)/100)/10), score:S.score };

      const romFeedback = [];
      if (exRef.current?.proto) {
        const pct = (v, ref) => (Number.isFinite(v) && ref) ? (v / ref) : 1;
        if (pct(rom.knee,  exRef.current.proto.kneeROM)  < 0.7) romFeedback.push("무릎 ROM이 부족합니다. 하강 시 엉덩이를 더 뒤로 빼고 발 전체에 체중을 분산해 내려가 보세요.");
        if (pct(rom.hip,   exRef.current.proto.hipROM)   < 0.7) romFeedback.push("고관절(엉덩이) ROM이 부족합니다. 힙 힌지를 더 사용하며 엉덩이를 뒤로 접어 주세요.");
        if (pct(rom.trunk, exRef.current.proto.trunkROM) < 0.7) romFeedback.push("몸통 ROM/조절이 부족합니다. 갈비를 가볍게 내리고 코어에 힘을 주세요.");
      }
      const I = S.issues || { total: 0 };
      const ratio = (n) => I.total ? n / I.total : 0;
      const fb = [];
      if (ratio(I.kneeAlign)  > 0.35) fb.push({ id:"kneeAlign",  title:"무릎-발목 정렬이 자주 무너져요", detail:"하강/상승 중 무릎이 발목-고관절 라인에서 벗어납니다.", fix:"발끝과 같은 방향으로 무릎을 보내고, 발 아치를 유지하세요." });
      if (ratio(I.trunkLean)  > 0.35) fb.push({ id:"trunkLean",  title:"몸통 전경사가 과해요", detail:"몸통이 목표치보다 자주 숙여집니다.", fix: exRef.current?.id==="hinge" ? "힌지에서는 허리 중립만 유지하면 됩니다. 갈비를 살짝 내리고 쇄골을 넓혀 주세요." : "스쿼트/런지에서는 가슴을 열고 배꼽을 가볍게 당겨 코어를 안정화하세요." });
      if (ratio(I.pelvisTilt) > 0.35) fb.push({ id:"pelvisTilt", title:"골반 수평이 흔들려요", detail:"좌우 힙의 높이 차가 큽니다.", fix:"양발로 바닥을 ‘쫙’ 눌러 지지하고, 올라올 때 엉덩이를 동시에 밀어 올려 보세요." });
      if (ratio(I.asymmetry) > 0.35) fb.push({ id:"asymmetry",  title:"좌우 비대칭이 커요", detail:"양쪽 무릎 굽힘 각도의 차이가 큽니다.", fix:"약한 쪽에 체중을 더 실어 균형을 맞추고, 반복 속도를 천천히 맞춰 보세요." });
      const feedback = [...fb, ...romFeedback.map(t => ({ id:"rom", title:"가동범위 보완", detail:t, fix:null }))].slice(0,3);

      setResult({ score: avg, reps, rom, series, exName: exRef.current?.name || null, feedback });
      setTimeout(()=> scrollResultIntoView(resultRef.current), 0);
    }catch{}
  },[]);

  /* 전/후면 카메라 전환 */
  const switchCamera = useCallback(async (nextFacing)=>{
    setCamFacing(nextFacing);
    if(!runningRef.current || mockMode) return;
    setStatus("카메라 전환 중…");
    try{
      const newStream = await getStreamWithFacing(nextFacing);
      const v = videoRef.current;
      try{ streamRef.current?.getTracks?.().forEach(t=>t.stop()); }catch{}
      streamRef.current = newStream;
      v.srcObject = newStream;
      await v.play().catch(()=>{});
      if (v.readyState < 2 || !v.videoWidth) await once(v, "loadedmetadata");
      setStatus("실시간 분석 중");
    }catch(e){
      console.error(e);
      setStatus("카메라 전환 실패");
    }
  },[mockMode]);

  /* 메인 루프 */
  const loop = async ()=>{
    const v=videoRef.current, c=canvasRef.current; if(!v||!c) return;
    const ctx=c.getContext("2d");
    const step = async ()=>{
      if(!runningRef.current) return;
      const dpr=window.devicePixelRatio||1, rect=c.getBoundingClientRect(); const cw=Math.round(rect.width*dpr), ch=Math.round(rect.height*dpr);
      if(c.width!==cw||c.height!==ch){ c.width=cw; c.height=ch; }

      if(v.readyState>=2){
        const vw=v.videoWidth, vh=v.videoHeight;
        const scale=Math.max(c.width/vw, c.height/vh), dw=vw*scale, dh=vh*scale;
        ctx.clearRect(0,0,c.width,c.height);
        ctx.save();
        const flip = mockMode ? 1 : (camFacing==="user" ? -1 : 1);
        ctx.translate(c.width/2,c.height/2);
        ctx.scale(flip, 1);
        ctx.translate(-dw/2,-dh/2);

        // 세그 마스크 (local 엔진에서만 의미)
        let segMask = null;
        if(segMode!=="off" && engine==="local"){
          try{
            const s=await segOnce(segRef,v,segStateRef,70);
            segMask = s?.segmentationMask || null;
          }catch{}
        }

        if (segMask && segMode==="person") {
          ctx.save();
          ctx.drawImage(segMask,0,0,dw,dh);
          ctx.globalCompositeOperation="source-in";
          ctx.drawImage(v,0,0,dw,dh);
          ctx.globalCompositeOperation="source-over";
          ctx.restore();
        } else {
          ctx.drawImage(v,0,0,dw,dh);
          if (segMask && segMode==="overlay") {
            ctx.save();
            ctx.drawImage(segMask,0,0,dw,dh);
            ctx.globalCompositeOperation="source-in";
            ctx.fillStyle="rgba(36, 92, 255, 0.45)";
            ctx.fillRect(0,0,dw,dh);
            ctx.globalCompositeOperation="source-over";
            ctx.restore();
          }
        }

        const now=performance.now();

        if(engine==="local"){
          if(now-lastInfer.current > 1000/LIVE_TARGET_FPS){
            lastInfer.current=now;
            try{
              const det = detectorRef.current;
              const poses = await det.estimatePoses(v, { flipHorizontal:false });
              const kp=poses?.[0]?.keypoints;
              if(kp){
                const sx=dw/vw, sy=dh/vh; drawSkel(ctx, kp.map(k=>({...k, x:k.x*sx, y:k.y*sy})));

                // 뷰/이슈 갱신
                viewRef.current = inferViewFromKeypoints(kp);
                const issues = assessFrameIssues(kp, exRef.current?.id);
                lastIssuesRef.current = issues;

                // 각도 누적
                const by=Object.fromEntries(kp.map(k=>[k.name,k]));
                const kneeA = angle(by["right_hip"],by["right_knee"],by["right_ankle"]);
                const hipA  = angle(by["right_shoulder"],by["right_hip"],by["right_knee"]);
                const trunkA= trunkFlex(by["left_shoulder"],by["right_shoulder"],by["left_hip"],by["right_hip"]);

                ring.current[ptr.current]=[kneeA,hipA,trunkA];
                ringW.current[ptr.current]=Math.min(by["right_knee"]?.score ?? 1, by["right_hip"]?.score ?? 1, by["right_ankle"]?.score ?? 1);
                ptr.current=(ptr.current+1)%WIN;

                sessionRef.current.t.push(now);
                sessionRef.current.knee.push(kneeA); sessionRef.current.hip.push(hipA); sessionRef.current.trunk.push(trunkA);

                // 통계 이슈 누적
                try{
                  const s = sessionRef.current.issues;
                  if (issues.kneeAlign)  s.kneeAlign++;
                  if (issues.trunkLean)  s.trunkLean++;
                  if (issues.pelvisTilt) s.pelvisTilt++;
                  if (issues.asymmetry)  s.asymmetry++;
                  s.total++;
                }catch{}
              }
            }catch(e){/* noop */}
          }
        } else { // engine === 'yolo'
          // ▼ YOLO 오버레이는 토글 ON일 때만 그림
          if (yoloOverlayOn && yoloImgRef.current) {
            ctx.drawImage(yoloImgRef.current, 0, 0, dw, dh);
          }

          if (!yoloBusy.current && (now - lastInfer.current > 1000/YOLO_TARGET_FPS)) {
            lastInfer.current = now;
            yoloBusy.current = true;
            try{
              const ofs = offscreen.current;
              const pctx = ofs.getContext("2d");
              pctx.drawImage(v, 0, 0, ofs.width, ofs.height);
              const dataURL = ofs.toDataURL("image/jpeg", 0.8);
              const res = await fetch(`${API_BASE}/ai/pose`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataURL })
              }).then(r=>r.json());

              if (res?.image) {
                const img = new Image();
                img.onload = () => { yoloImgRef.current = img; };
                img.src = res.image;
              }

              if (Array.isArray(res?.keypoints) && res.keypoints.length >= 17) {
                const named = yoloKeypointsToNamed(res.keypoints);

                // 뷰/이슈 갱신
                viewRef.current = inferViewFromKeypoints(named);
                const issues = assessFrameIssues(named, exRef.current?.id);
                lastIssuesRef.current = issues;

                const by = Object.fromEntries(named.map(k=>[k.name,k]));
                const kneeA = angle(by["right_hip"],by["right_knee"],by["right_ankle"]);
                const hipA  = angle(by["right_shoulder"],by["right_hip"],by["right_knee"]);
                const trunkA= trunkFlex(by["left_shoulder"],by["right_shoulder"],by["left_hip"],by["right_hip"]);

                ring.current[ptr.current]=[kneeA,hipA,trunkA];
                const confMin = Math.min(by["right_knee"]?.score ?? 1, by["right_hip"]?.score ?? 1, by["right_ankle"]?.score ?? 1);
                ringW.current[ptr.current]=confMin;
                ptr.current=(ptr.current+1)%WIN;

                sessionRef.current.t.push(now);
                sessionRef.current.knee.push(kneeA); sessionRef.current.hip.push(hipA); sessionRef.current.trunk.push(trunkA);

                try{
                  const s = sessionRef.current.issues;
                  if (issues.kneeAlign)  s.kneeAlign++;
                  if (issues.trunkLean)  s.trunkLean++;
                  if (issues.pelvisTilt) s.pelvisTilt++;
                  if (issues.asymmetry)  s.asymmetry++;
                  s.total++;
                }catch{}
              }
            }catch(e){ /* ignore */ }
            finally{ yoloBusy.current = false; }
          }
        }

        ctx.restore();
      }

      // ===== 점수 계산 (뷰 가중치 + 벌점) =====
      if(refSigRef.current){
        const seq = ring.current.slice(ptr.current).concat(ring.current.slice(0,ptr.current));
        const ws  = ringW.current.slice(ptr.current).concat(ringW.current.slice(0,ptr.current));
        const s1=emaSmooth(seq,.3), s2=resampleSeq(s1,REF_N), nA=normAngles(s2);
        const wLive=resampleSeq(ws.map(w=>[w,0,0]),REF_N).map(x=>x[0]);
        const wComb=wLive.map((wl,i)=>Math.min(wl, (refSigRef.current.w?.[i]??1)));

        const WV  = weightsForView(viewRef.current.label);
        const alpha = viewRef.current.label==="front" ? 0.75 : 0.5; // 정면일수록 각도 비중↓
        const Wmix = blendW(W_REF.current, WV, alpha);

        const e = weightedRMSE(nA, refSigRef.current.seq, wComb, Wmix);
        const baseScore = rmseToScore(e);

        const p = penaltyForIssues(viewRef.current.label, lastIssuesRef.current); // 0..1
        const penaltyScale = viewRef.current.label === "front" ? 0.40 : (viewRef.current.label === "side" ? 0.25 : 0.33);
        const sc = clamp(Math.round(baseScore * (1 - penaltyScale * p)), 1, 100);

        setScore(sc);
        sessionRef.current.score.push(sc);
      }

      drawHUD(ctx,score,!!refSigRef.current,c,isRunning,recSec);
      (typeof v.requestVideoFrameCallback==="function")
        ? v.requestVideoFrameCallback(()=>step())
        : requestAnimationFrame(step);
    };
    step();
  };

  /* 레퍼런스 업로드 → 전처리 + 자동 매칭 */
  async function onRefFile(e){
    const file = e.target?.files?.[0] ?? e.dataTransfer?.files?.[0]; if(!file) return;
    const url = URL.createObjectURL(file);
    await processReference(url, file.name);
    try{ URL.revokeObjectURL(url);}catch{}
  }
  async function processReference(url, displayName="reference.mp4"){
    const det = await ensureDetector(detectorRef); if(!det){ setStatus("포즈 모델 준비 전입니다"); return; }
    setRefProg({running:true,pct:0,fileName:displayName});

    const v=refVideo.current, c=refCanvas.current, ctx=c.getContext("2d");
    c.width=360; c.height=Math.round((c.width*9)/16);
    v.src=url; v.muted=true; v.playsInline=true; await v.play().catch(()=>{}); v.pause();
    await once(v,"loadedmetadata"); if(!v.videoWidth||!v.videoHeight) await once(v,"loadeddata");

    const dt=1/15, duration=v.duration||0; let t=0, lastUI=0;
    const seq=[], ws=[];
    const proc=document.createElement("canvas"); proc.width=c.width; proc.height=c.height; const pctx=proc.getContext("2d");

    while(t<=duration){
      v.currentTime=Math.min(duration,t); await once(v,"seeked");
      ctx.drawImage(v,0,0,c.width,c.height);

      let inferInput=v;
      if(segMode!=="off"){
        pctx.clearRect(0,0,proc.width,proc.height); pctx.drawImage(v,0,0,proc.width,proc.height);
        try{
          const s=await segOnce(segRef,v,segStateRef,90);
          if(s?.segmentationMask){ pctx.globalCompositeOperation="destination-in"; pctx.drawImage(s.segmentationMask,0,0,proc.width,proc.height); pctx.globalCompositeOperation="source-over"; inferInput=proc; }
        }catch{}
      }

      try{
        const poses=await det.estimatePoses(inferInput,{flipHorizontal:false});
        const kp=poses?.[0]?.keypoints;
        if(kp){
          const by=Object.fromEntries(kp.map(k=>[k.name,k]));
          const kneeA = angle(by["right_hip"],by["right_knee"],by["right_ankle"]);
          const hipA  = angle(by["right_shoulder"],by["right_hip"],by["right_knee"]);
          const trunkA= trunkFlex(by["left_shoulder"],by["right_shoulder"],by["left_hip"],by["right_hip"]);
          const conf  = Math.min(by["right_knee"]?.score??1, by["right_hip"]?.score??1, by["right_ankle"]?.score??1);
          seq.push([kneeA,hipA,trunkA]); ws.push(conf);
        }
      }catch{}

      t += dt;
      const now=performance.now(); if(now-lastUI>80){ setRefProg(p=>({ ...p, pct: Math.min(100, Math.round((t/duration)*100)) })); lastUI=now; }
    }

    const s1=emaSmooth(seq,.3), s2=resampleSeq(s1,REF_N), nA=normAngles(s2);
    const w2=resampleSeq(ws.map(w=>[w,0,0]),REF_N).map(x=>x[0]);
    refSigRef.current={ seq:nA, w:w2 };
    setRefProg({running:false,pct:100,fileName:displayName });

    const ch=(i)=>s2.map(a=>a[i]??0);
    const rom=(arr)=>{ let mn=Infinity,mx=-Infinity; for(const v of arr){ if(v<mn) mn=v; if(v>mx) mx=v; } return Math.round(mx-mn); };
    const kneeROM=rom(ch(0)), hipROM=rom(ch(1)), trunkROM=rom(ch(2));
    const picked = classifyByDB({kneeROM,hipROM,trunkROM});
    setEx({ ...picked, rom:{kneeROM,hipROM,trunkROM} });
    W_REF.current = focusToWeights(picked.joints);
  }

  return (
    <div className="pose-page">
      {/* 상단 카드 */}
      <section className="card">
        <div className="card-head">
          {/* 상태 */}
          <div className="status">상태: {status}</div>

          {/* 전/후면 카메라 전환 */}
          <div className="camera-switch">
            <button
              className={`cam-btn ${camFacing==="user" ? "on":""}`}
              onClick={()=>switchCamera("user")}
              disabled={refProg.running || mockMode}
              title="전면 카메라"
            >전면</button>
            <button
              className={`cam-btn ${camFacing==="environment" ? "on":""}`}
              onClick={()=>switchCamera("environment")}
              disabled={refProg.running || mockMode}
              title="후면 카메라"
            >후면</button>
          </div>

          {/* 공간 벌림 */}
          <div className="toolbar-spacer" />

          {/* 녹화영상/파일 + YOLO 표시 */}
          <div className="mock-controls">
            {/* 녹화영상: 전/후면과 동일 팔레트(.cam-btn) */}
            <button
              className={`cam-btn ${mockMode ? "on" : ""}`}
              aria-pressed={mockMode}
              onClick={()=>setMockMode(v=>!v)}
              title="녹화영상(파일) 모드 전환"
            >
              녹화영상
            </button>

            <label className={`file-btn ${!mockMode ? "disabled" : ""}`} title="동영상 파일 선택">
              <input
                type="file"
                accept="video/*"
                disabled={!mockMode}
                onChange={(e)=>setMockFile(e.target.files?.[0] || null)}
              />
              <span className="file-icon" aria-hidden>📁</span>
              <span>파일 선택</span>
            </label>

            <span className="file-name">
              {mockFile ? mockFile.name : "선택된 파일 없음"}
            </span>

            {/* YOLO 오버레이 표시 ON/OFF: 동일 팔레트(.cam-btn) */}
            <button
              className={`cam-btn ${yoloOverlayOn ? "on" : ""}`}
              aria-pressed={yoloOverlayOn}
              onClick={()=>setYoloOverlayOn(v=>!v)}
              title="YOLO 적용 결과(마스크/박스) 표시 토글"
            >
              YOLO 표시
            </button>
          </div>
        </div>

        <div className="stage" ref={stageRef}>
          <canvas ref={canvasRef} className="viewport" />
          <video ref={videoRef} className="hidden" playsInline muted />
        </div>

        <button className={`cta ${isRunning?"stop":""}`} onClick={isRunning?stop:start} disabled={refProg.running}>
          {isRunning ? "분석 종료" : "분석 시작"}
        </button>
      </section>

      {/* 레퍼런스 업로드 */}
      <section className="card">
        <h3 className="card-title">레퍼런스</h3>
        {refProg.running ? (
          <div>
            <div className="progress-row">
              <span className="spinner" /> 전처리 중 · {refProg.fileName} · <b>{refProg.pct}%</b>
            </div>
            <div className="progress">
              <div className="progress-fill" style={{ width: `${refProg.pct}%` }} />
            </div>
          </div>
        ) : (
          <div className="dropzone" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); onRefFile(e);}}>
            <input id="refFile" type="file" accept="video/*" onChange={onRefFile} hidden />
            <label htmlFor="refFile">여기로 드래그 또는 탭하여 업로드</label>
            <video ref={refVideo} playsInline muted className="hidden" />
            <canvas ref={refCanvas} width={360} height={180} className="hidden" />
          </div>
        )}
        <p className="hint">레퍼런스를 업로드하면 운동 데이터와 자동 매칭되어 <b>설명/분석 관절</b>이 아래에 표시됩니다.</p>
      </section>

      {/* 자동 매칭 인사이트 */}
      {ex && (
        <section className="card">
          <h3 className="card-title">운동 분석 · 인사이트</h3>
          <div className="ex-top">
            <div className="ex-name">{ex.name}</div>
            <div className="ex-conf">일치도 {ex.conf}%</div>
          </div>
          <p className="ex-desc">{ex.desc}</p>
          <div className="chips">
            <span className="chip chip--title">분석 관절</span>
            {ex.joints.map(j=><span key={j} className="chip">{j}</span>)}
          </div>
          {ex.cues?.length>0 && (
            <ul className="cue-list">
              {ex.cues.map((c,i)=><li key={i}>{c}</li>)}
            </ul>
          )}
          {ex.rom && (
            <div className="rom-grid">
              <RomBar label="무릎 ROM"  value={ex.rom.kneeROM}  max={120} />
              <RomBar label="엉덩이 ROM" value={ex.rom.hipROM}   max={120} />
              <RomBar label="몸통 ROM"  value={ex.rom.trunkROM} max={90}  />
            </div>
          )}
        </section>
      )}

      {/* 세션 요약 */}
      {result && (
        <section className="card" ref={resultRef}>
          <h3 className="card-title">분석 요약{result.exName ? ` · ${result.exName}` : ""}</h3>
          <div className="metric-grid">
            <Metric label="정확도(평균)" value={Number.isFinite(result.score)?`${result.score}%`:"-"} />
            <Metric label="반복수" value={Number.isFinite(result.reps)?`${result.reps}`:"-"} />
          </div>
          <div className="rom-grid">
            <RomBar label="무릎 ROM"  value={result.rom?.knee ?? 0}  max={120} />
            <RomBar label="엉덩이 ROM" value={result.rom?.hip ?? 0}   max={120} />
            <RomBar label="몸통 ROM"  value={result.rom?.trunk ?? 0} max={90}  />
          </div>

          {result?.feedback?.length > 0 && (
            <div className="issues">
              <div className="issues__title">폼 피드백</div>
              <ul className="issues__list">
                {result.feedback.map((it, i) => (
                  <li className="issues__item" key={i}>
                    <div className="issues__item-title">• {it.title}</div>
                    {it.detail && <div className="issues__item-detail">{it.detail}</div>}
                    {it.fix && <div className="issues__item-fix">TIP: {it.fix}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

/* 소형 컴포넌트 */
function Metric({label,value}){ return (
  <div className="metric">
    <div className="metric__label">{label}</div>
    <div className="metric__value">{value}</div>
  </div>
);}
function RomBar({label,value,max}){
  const pct = Math.max(0, Math.min(100, Math.round((value/(max||1))*100)));
  return (
    <div className="rom">
      <div className="rom__label">{label}</div>
      <div className="rom__bar"><div className="rom__fill" style={{width:`${pct}%`}}/></div>
      <div className="rom__val">{Number.isFinite(value)?Math.round(value):0}°</div>
    </div>
  );
}
