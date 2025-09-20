/**
 * PoseAccuracyMVP.jsx — 모바일 온디바이스 실시간 자세 정확도 (HUD + 전체화면)
 * 필요 패키지:
 *   npm i @tensorflow/tfjs @tensorflow-models/pose-detection @tensorflow/tfjs-backend-webgl
 */
import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "./PoseAccuracyMVP.css";

/* ===== 설정 ===== */
const WIN = 60;                 // 최근 프레임 윈도우(약 2s@30fps)
const REF_N = 100;              // 비교용 고정길이
const LIVE_TARGET_FPS = 20;     // 추론 호출 주기 제한

const ANGLE_RANGE = { knee:{min:60,max:180}, hip:{min:50,max:180}, trunk:{min:0,max:45} };
const W_CH = { knee:0.4, hip:0.35, trunk:0.25 };

/* ===== 튜닝 상수 (추가) ===== */
const USE_THUNDER = true;       // 가능하면 MoveNet THUNDER로 정확도 ↑ (느리면 false)
const DTW_BAND = 12;            // DTW 사코에-치바 밴드 폭(±12)
const SCORE_ALPHA = 8;          // 로지스틱 스케일(급경사)
const SCORE_BETA  = 0.12;       // 로지스틱 중앙 RMSE(정규화 단위)

/* ===== 유틸 ===== */
const clamp = (x,a,b)=>Math.max(a,Math.min(b,x));
const once = (el,ev)=>new Promise(res=>{
  const h=()=>{ try{ el.removeEventListener(ev,h); }catch{}; res(); };
  el.addEventListener(ev,h,{once:true});
});
const isSecureHost = () => {
  try {
    return (
      window.isSecureContext === true ||
      location.protocol === "https:" ||
      ["localhost","127.0.0.1","[::1]"].includes(location.hostname)
    );
  } catch { return false; }
};
const sleep = (ms)=>new Promise(r=>setTimeout(r,ms));

/* RVFC(webkit) 유틸 */
const requestVFC = (video, cb) => {
  if (!video) return null;
  if (typeof video.requestVideoFrameCallback === "function") return video.requestVideoFrameCallback(cb);
  if (typeof video.webkitRequestVideoFrameCallback === "function") return video.webkitRequestVideoFrameCallback(cb);
  return null;
};
const cancelVFC = (video, id) => {
  if (!video || id == null) return;
  if (typeof video.cancelVideoFrameCallback === "function") video.cancelVideoFrameCallback(id);
  else if (typeof video.webkitCancelVideoFrameCallback === "function") video.webkitCancelVideoFrameCallback(id);
};

function angle(a,b,c){
  const v1=[a.x-b.x,a.y-b.y], v2=[c.x-b.x,c.y-b.y];
  const dot=v1[0]*v2[0]+v1[1]*v2[1];
  const n=(Math.hypot(...v1)*Math.hypot(...v2))+1e-8;
  return Math.acos(clamp(dot/n,-1,1))*180/Math.PI;
}
function trunkFlex(ls,rs,lh,rh){
  const sm={x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2};
  const hm={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2};
  const v=[sm.x-hm.x, sm.y-hm.y], up=[0,-1];
  const dot=v[0]*up[0]+v[1]*up[1], n=Math.hypot(...v)+1e-8;
  return Math.acos(clamp(dot/n,-1,1))*180/Math.PI;
}
function emaSmooth(seq,a=0.3){
  if(!seq.length) return seq;
  const out=new Array(seq.length); let p=seq[0]; out[0]=p;
  for(let i=1;i<seq.length;i++){
    const c=seq[i];
    p=[ a*c[0]+(1-a)*p[0], a*c[1]+(1-a)*p[1], a*c[2]+(1-a)*p[2] ];
    out[i]=p;
  }
  return out;
}
function resampleSeq(seq,N){
  if(!seq.length) return [];
  const out=new Array(N), L=seq.length-1;
  for(let i=0;i<N;i++){
    const t=i*(L/(N-1)), i0=Math.floor(t), i1=Math.min(L,i0+1), r=t-i0;
    const a=seq[i0], b=seq[i1];
    out[i]=[ a[0]+(b[0]-a[0])*r, a[1]+(b[1]-a[1])*r, a[2]+(b[2]-a[2])*r ];
  }
  return out;
}
function normAngles(seq){
  return seq.map(([k,h,t])=>[
    (clamp(k,ANGLE_RANGE.knee.min,ANGLE_RANGE.knee.max)-ANGLE_RANGE.knee.min)/(ANGLE_RANGE.knee.max-ANGLE_RANGE.knee.min),
    (clamp(h,ANGLE_RANGE.hip.min,ANGLE_RANGE.hip.max)-ANGLE_RANGE.hip.min)/(ANGLE_RANGE.hip.max-ANGLE_RANGE.hip.min),
    (clamp(t,ANGLE_RANGE.trunk.min,ANGLE_RANGE.trunk.max)-ANGLE_RANGE.trunk.min)/(ANGLE_RANGE.trunk.max-ANGLE_RANGE.trunk.min),
  ]);
}

/* (기존 RMSE; DTW 도입 후에는 사용 안 해도 무방) */
function weightedRMSE(A,B, frameW=null){
  if(A.length!==B.length||A.length===0) return Infinity;
  let seK=0,seH=0,seT=0,ws=0;
  for(let i=0;i<A.length;i++){
    const w=frameW?(frameW[i]??1):1; if(w<=0) continue;
    const [ak,ah,at]=A[i], [bk,bh,bt]=B[i];
    seK+=w*(ak-bk)**2; seH+=w*(ah-bh)**2; seT+=w*(at-bt)**2; ws+=w;
  }
  if(ws===0) return Infinity;
  const rK=Math.sqrt(seK/ws), rH=Math.sqrt(seH/ws), rT=Math.sqrt(seT/ws);
  return W_CH.knee*rK + W_CH.hip*rH + W_CH.trunk*rT;
}

/* 로지스틱 점수 매핑 (교체) */
const rmseToScore = (rmse) => {
  const s = 100 / (1 + Math.exp(SCORE_ALPHA*(rmse - SCORE_BETA)));
  return clamp(Math.round(s), 0, 100);
};

function ensureCanvasHiDPI(canvas){
  if(!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect?.();
  const cssW = Math.max(1, rect?.width || canvas.clientWidth || canvas.width || 1);
  const cssH = Math.max(1, rect?.height || canvas.clientHeight || canvas.height || 1);
  const cw = Math.round(cssW * dpr);
  const ch = Math.round(cssH * dpr);
  if (canvas.width !== cw || canvas.height !== ch) {
    canvas.width = cw; canvas.height = ch;
  }
}

/* ===== 첫 프레임 & 페인트 보장 ===== */
const afterNextPaint = () =>
  new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

function waitForFirstFrame(video, timeout = 4000) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (done) return; done = true; resolve(); };
    const to = setTimeout(finish, timeout);
    if (typeof video?.requestVideoFrameCallback === 'function' ||
        typeof video?.webkitRequestVideoFrameCallback === 'function') {
      requestVFC(video, () => { clearTimeout(to); finish(); });
      return;
    }
    const off = () => {
      ["canplay","loadeddata","playing","timeupdate"].forEach(ev=>{
        try{ video.removeEventListener(ev,on); }catch{}
      });
      clearTimeout(to); finish();
    };
    const on = () => off();
    ["canplay","loadeddata","playing","timeupdate"].forEach(ev=>video.addEventListener(ev,on,{once:true}));
  });
}

/* ===== detector 준비 보장 (교체) ===== */
async function ensureDetector(detectorRef){
  if (detectorRef.current) return detectorRef.current;
  await tf.ready();
  const modelType = USE_THUNDER
    ? poseDetection.movenet.modelType.SINGLEPOSE_THUNDER
    : poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING;

  const det = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType }
  );
  detectorRef.current = det;
  return det;
}

/* ===== 카메라 스트림 (재시도 포함) ===== */
async function getCameraStreamOnce() {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new Error("브라우저가 카메라 API를 지원하지 않음");
  }
  const base = { width:{ideal:640}, height:{ideal:360}, frameRate:{ideal:20} };
  const prefer = [
    { video: { ...base, facingMode: { ideal: "environment" } }, audio:false },
    { video: { ...base, facingMode: { ideal: "user" } },        audio:false },
    { video: true, audio: false },
  ];
  for (const c of prefer) { try { return await navigator.mediaDevices.getUserMedia(c); } catch(_){} }
  throw new Error("카메라 스트림을 열 수 없습니다 (권한/HTTPS/디바이스 확인)");
}
async function getCameraStreamWithRetry(retry=3){
  let lastErr;
  for (let i=0;i<retry;i++){
    try{
      return await getCameraStreamOnce();
    }catch(e){
      lastErr = e;
      await sleep(150 * (i+1)); // iOS/Safari NotReadableError 등 점유 해제 대기
    }
  }
  throw lastErr;
}

/* 스켈레톤 */
const EDGES=[["left_shoulder","right_shoulder"],["left_hip","right_hip"],
  ["left_shoulder","left_elbow"],["left_elbow","left_wrist"],
  ["right_shoulder","right_elbow"],["right_elbow","right_wrist"],
  ["left_hip","left_knee"],["left_knee","left_ankle"],
  ["right_hip","right_knee"],["right_knee","right_ankle"],
  ["left_shoulder","left_hip"],["right_shoulder","right_hip"]];
function drawSkeleton(ctx,kps){
  if(!ctx || !kps) return;
  ctx.save(); ctx.lineWidth=3; ctx.strokeStyle="rgba(95,212,255,.85)"; ctx.fillStyle="#5fd4ff";
  EDGES.forEach(([a,b])=>{
    const A=kps.find(k=>k.name===a), B=kps.find(k=>k.name===b);
    if(!A||!B) return; ctx.beginPath(); ctx.moveTo(A.x,A.y); ctx.lineTo(B.x,B.y); ctx.stroke();
  });
  kps.forEach(k=>{ if(k?.x!=null&&k?.y!=null){ ctx.beginPath(); ctx.arc(k.x,k.y,4,0,Math.PI*2); ctx.fill(); }});
  ctx.restore();
}

/* ===== One-Euro 필터로 키포인트 지터 억제 (추가) ===== */
function alphaFromCutoff(cutoff, dt){
  const tau = 1/(2*Math.PI*cutoff);
  return 1/(1 + tau/dt);
}
class OneEuro{
  constructor({minCutoff=1.0, beta=0.007, dCutoff=1.0}={}) {
    this.minCutoff=minCutoff; this.beta=beta; this.dCutoff=dCutoff;
    this.xPrev=null; this.dxPrev=0; this.tPrev=null;
  }
  filter(x, t){
    if(this.tPrev==null){ this.tPrev=t; this.xPrev=x; return x; }
    const dt = Math.max(1/120, (t - this.tPrev)/1000);
    const dx = (x - this.xPrev)/dt;
    const aD = alphaFromCutoff(this.dCutoff, dt);
    this.dxPrev = aD*dx + (1-aD)*this.dxPrev;
    const cutoff = this.minCutoff + this.beta*Math.abs(this.dxPrev);
    const a = alphaFromCutoff(cutoff, dt);
    const xHat = a*x + (1-a)*this.xPrev;
    this.xPrev = xHat; this.tPrev = t;
    return xHat;
  }
}
const kpFilterRef = { current: {} };
function smoothKeypoints(kps, t){
  const store = kpFilterRef.current;
  return kps.map(k=>{
    if(k?.x==null || k?.y==null) return k;
    const key = k.name || `kp_${k.index}`;
    if(!store[key]) store[key] = { fx:new OneEuro(), fy:new OneEuro() };
    return {
      ...k,
      x: store[key].fx.filter(k.x, t),
      y: store[key].fy.filter(k.y, t),
    };
  });
}

/* HUD */
function drawAccuracyHUD(ctx, score, hasRef, canvas){
  if(!ctx || !canvas) return;
  const dpr=window.devicePixelRatio||1, x=8*dpr, y=8*dpr;
  const w=Math.min(220*dpr, canvas.width-16*dpr), h=26*dpr, r=12*dpr, pad=10*dpr;
  ctx.save(); ctx.globalAlpha=.88; ctx.fillStyle="rgba(0,12,28,.55)";
  if(ctx.roundRect){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); ctx.fill(); }
  else{ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
        ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); ctx.fill(); }
  const pct=Number.isFinite(score)?score/100:0;
  const bx=x+pad, by=y+(h/2)-4*dpr, bw=w-2*pad, bh=8*dpr;
  const grad=ctx.createLinearGradient(bx,by,bx+bw,by); grad.addColorStop(0,"#2F6BFF"); grad.addColorStop(1,"#5FD4FF");
  ctx.fillStyle="#0E2B57"; ctx.fillRect(bx,by,bw,bh);
  ctx.fillStyle=grad; ctx.fillRect(bx,by,Math.round(bw*pct),bh);
  ctx.fillStyle="#fff"; ctx.font=`${12*dpr}px system-ui,-apple-system,Roboto,Arial`; ctx.textBaseline="middle";
  ctx.fillText(hasRef ? `정확도: ${Number.isFinite(score)?score:'--'}` : "레퍼런스 업로드 필요", bx, y+h/2);
  ctx.restore();
}

/* 키포인트 → 각도/가중치: 좌/우 자동 선택 (교체) */
function anglesForSide(by, side){ // side: 'left' | 'right'
  const s = side;
  const shoulder = by[`${s}_shoulder`], hip = by[`${s}_hip`], knee = by[`${s}_knee`], ankle = by[`${s}_ankle`];

  const kneeA = angle(hip, knee, ankle);
  const hipA  = angle(shoulder, hip, knee);
  const trunkA= trunkFlex(by["left_shoulder"], by["right_shoulder"], by["left_hip"], by["right_hip"]);

  const confK = Math.min(hip?.score??1, knee?.score??1, ankle?.score??1);
  const confH = Math.min(shoulder?.score??1, hip?.score??1, knee?.score??1);
  const confT = Math.min(by["left_shoulder"]?.score??1, by["right_shoulder"]?.score??1, by["left_hip"]?.score??1, by["right_hip"]?.score??1);
  return { angles:[kneeA, hipA, trunkA], conf:(confK+confH+confT)/3 };
}
function anglesAndWeightFromKP(kp){
  const by=Object.fromEntries(kp.map(k=>[k.name,k]));
  const L = anglesForSide(by,'left');
  const R = anglesForSide(by,'right');
  return (R.conf >= L.conf) ? { angles:R.angles, w:R.conf } : { angles:L.angles, w:L.conf };
}

/* 단계(phase) 가중치: 바텀/탑 근처를 더 중요하게 (추가) */
function phaseWeights(nA){
  return nA.map(([k,h,t])=>{
    const eK = (2*Math.abs(k-0.5))**2;  // 0~1, 극단에 가까울수록 ↑
    const eH = (2*Math.abs(h-0.5))**2;
    const e  = Math.max(eK, eH);
    return clamp(0.5 + 0.5*e, 0.3, 1.4); // 0.3~1.4 범위
  });
}

/* DTW with band, 가중 RMSE (추가) */
function dtwWeightedRMSE(A, B, W, band=12, wLive=null, wRef=null, wPhase=null){
  const N=A.length, M=B.length, INF=1e15;
  const D = Array.from({length:N+1},()=>Array(M+1).fill(INF));
  const L = Array.from({length:N+1},()=>Array(M+1).fill(1e9));
  D[0][0]=0; L[0][0]=0;

  for(let i=1;i<=N;i++){
    const j0=Math.max(1, i-band), j1=Math.min(M, i+band);
    for(let j=j0;j<=j1;j++){
      const [ak,ah,at]=A[i-1], [bk,bh,bt]=B[j-1];
      const wf = (wLive ? wLive[i-1] : 1) * (wRef ? wRef[j-1] : 1) * (wPhase ? wPhase[j-1] : 1);
      const c = wf * ( W.knee*(ak-bk)*(ak-bk) + W.hip*(ah-bh)*(ah-bh) + W.trunk*(at-bt)*(at-bt) );

      let best = D[i-1][j-1], steps=L[i-1][j-1]+1;
      if(D[i-1][j] < best){ best=D[i-1][j]; steps=L[i-1][j]+1; }
      if(D[i][j-1] < best){ best=D[i][j-1]; steps=L[i][j-1]+1; }

      D[i][j] = best + c;
      L[i][j] = steps;
    }
  }
  const pathLen = Math.max(1, L[N][M]);
  return Math.sqrt(D[N][M] / pathLen);
}

export default function PoseAccuracyMVP(){
  const liveStageRef = useRef(null);
  const liveVideoRef = useRef(null);
  const liveCanvasRef= useRef(null);
  const refVideoRef  = useRef(null);
  const refCanvasRef = useRef(null);

  const [ready,setReady]=useState(false);
  const [status,setStatus]=useState("대기 중");
  const [score,setScore]=useState(null);
  const [camOk, setCamOk] = useState(false);
  const [progress, setProgress] = useState(0);

  const refSigRef     = useRef(null);
  const ring          = useRef(Array.from({length:WIN},()=>[0,0,0]));
  const ringW         = useRef(Array.from({length:WIN},()=>1));
  const ptr           = useRef(0);
  const detectorRef   = useRef(null);
  const isLiveRef     = useRef(false);
  const liveRafRef    = useRef(null);
  const liveRVFCRef   = useRef(null);
  const liveStreamRef = useRef(null);
  const unmountedRef  = useRef(false);
  const lastInferAt   = useRef(0);
  const lastScoreRef  = useRef(null);
  const lastTapRef    = useRef(0);

  /* 모델 초기화 & 정리 (ensureDetector 사용으로 단일화) */
  useEffect(()=>{
    isLiveRef.current = false;
    unmountedRef.current = false;
    let mounted=true;
    (async()=>{
      try{
        await tf.setBackend("webgl").catch(async()=>{ await tf.setBackend("cpu"); });
        await tf.ready();
        const det = await ensureDetector(detectorRef);
        if(!mounted) return;
        detectorRef.current=det; setReady(true); setStatus(`모델 준비 완료 (${USE_THUNDER?'THUNDER':'LIGHTNING'})`);
      }catch(e){ console.error(e); setStatus("모델 초기화 실패"); }
    })();

    const onPageHide = () => { try{ stopLive(); }catch{} };
    const onPageShow = (e) => {
      if (e.persisted) { // bfcache 복원
        isLiveRef.current = false;
        setCamOk(false);
        const v = liveVideoRef.current; if (v) v.srcObject=null;
      }
      requestAnimationFrame(()=> ensureCanvasHiDPI(liveCanvasRef.current));
    };
    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('pageshow', onPageShow);

    return ()=>{
      mounted=false; unmountedRef.current=true; isLiveRef.current=false;
      if(liveRafRef.current) cancelAnimationFrame(liveRafRef.current);
      cancelVFC(liveVideoRef.current, liveRVFCRef.current); liveRVFCRef.current=null;
      const s=liveStreamRef.current; if(s?.getTracks) s.getTracks().forEach(t=>t.stop()); liveStreamRef.current=null;
      try{ detectorRef.current?.dispose?.(); }catch{}
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('pageshow', onPageShow);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  /* 레퍼런스(mp4) 처리 */
  async function handleLoadReferenceFile(e){
    const file=e.target?.files?.[0] ?? e.dataTransfer?.files?.[0]; if(!file) return;
    const det = await ensureDetector(detectorRef);
    if(!det){ alert("포즈 모델 준비 전입니다"); return; }
    setStatus("레퍼런스 처리 중...");
    setProgress(0);

    const url=URL.createObjectURL(file);
    const v=refVideoRef.current, c=refCanvasRef.current;
    if(!v||!c){ setStatus("레퍼런스 캔버스 초기화 실패"); return; }
    const cctx=c.getContext("2d"); if(!cctx){ setStatus("레퍼런스 컨텍스트 실패"); return; }

    v.src=url; v.muted=true; v.playsInline=true; v.preload="auto";
    try{ await v.play(); }catch{}; v.pause();
    await once(v,"loadedmetadata");

    const dur = Number.isFinite(v.duration) ? v.duration : 0;
    if (dur <= 0){
      setStatus("영상 길이 확인 실패(코덱/파일 손상 가능)");
      v.removeAttribute("src"); v.load(); URL.revokeObjectURL(url);
      return;
    }
    const endSafe = Math.max(0, dur - 0.001);  // 끝단 안전 여유

    const dt=1/5; // 5fps
    const seq=[], ws=[];
    const total = Math.max(1, Math.ceil(endSafe/dt)+1);
    let count = 0;

    // 첫 프레임 프라임
    v.currentTime = 0;
    await once(v, "seeked");

    for (let t=0; t<=endSafe && !unmountedRef.current; t+=dt){
      ensureCanvasHiDPI(c);
      cctx.drawImage(v,0,0,c.width,c.height);
      const poses=await det.estimatePoses(v,{flipHorizontal:false});
      if(poses?.[0]?.keypoints){
        const {angles,w}=anglesAndWeightFromKP(poses[0].keypoints); seq.push(angles); ws.push(w);
      }
      count++; setProgress(Math.min(100, Math.round((count/total)*100)));

      const nextT = t + dt;
      if (nextT > endSafe) break;
      v.currentTime = Math.min(endSafe, nextT);
      await once(v,"seeked");
    }

    const s1=emaSmooth(seq,0.3), s2=resampleSeq(s1,REF_N), nA=normAngles(s2);
    const w2=resampleSeq(ws.map(w=>[w,0,0]),REF_N).map(x=>x[0]);
    const pW = phaseWeights(nA);                       // 추가
    refSigRef.current={seq:nA,w:w2,phase:pW};         // phase 포함
    setStatus(`레퍼런스 준비 완료 (프레임:${seq.length}→${REF_N})`);
    setProgress(100);

    v.pause(); v.removeAttribute("src"); v.load(); URL.revokeObjectURL(url);
  }

  /* 라이브 시작/정지 */
  const startLive = useCallback(async ()=>{
    if (isLiveRef.current) return;
    if (!isSecureHost()) {
      setStatus("HTTPS(또는 localhost)에서만 카메라 사용 가능 — 배포 시 https:// 적용 필요");
      console.warn("Insecure context: getUserMedia blocked", location.href);
      return;
    }
    try{
      const det = await ensureDetector(detectorRef);
      if (!det) { setStatus("모델 준비 실패"); return; }

      const oldV = liveVideoRef.current;
      if (oldV) { try{ oldV.pause(); }catch{} oldV.srcObject = null; }

      const stream = await getCameraStreamWithRetry(4);
      liveStreamRef.current = stream;

      const v = liveVideoRef.current;
      if(!v){ setStatus("비디오 요소 없음"); return; }
      v.srcObject = stream;
      v.muted = true; v.setAttribute('muted','');
      v.playsInline = true; v.setAttribute('playsinline','');
      v.setAttribute('autoplay','');

      try{ await v.play(); }catch{}
      if (v.readyState < 2 || !v.videoWidth) await once(v, "loadedmetadata");
      await Promise.race([once(v,"playing"), once(v,"loadeddata"), sleep(200)]);
      await waitForFirstFrame(v);

      const host = liveStageRef.current;
      if (host) host.style.setProperty("--live-ar", `${v.videoWidth||16}/${v.videoHeight||9}`);
      await afterNextPaint();
      ensureCanvasHiDPI(liveCanvasRef.current);

      isLiveRef.current = true;
      setCamOk(true);
      setStatus(`실시간 측정 시작 (카메라 ${v.videoWidth}×${v.videoHeight})`);
      runLiveLoop();
    }catch(e){
      console.error(e);
      setStatus(`카메라 시작 실패: ${e?.name || 'Unknown'}${e?.message ? ' - ' + e.message : ''}`);
      setCamOk(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  const stopLive = useCallback(()=>{
    if (!isLiveRef.current) return;
    isLiveRef.current = false;

    if (liveRafRef.current) { cancelAnimationFrame(liveRafRef.current); liveRafRef.current = null; }
    cancelVFC(liveVideoRef.current, liveRVFCRef.current); liveRVFCRef.current = null;

    const s = liveStreamRef.current;
    if (s && s.getTracks) { s.getTracks().forEach(t => t.stop()); liveStreamRef.current = null; }

    const v = liveVideoRef.current;
    if (v) { try { v.pause(); } catch {} v.srcObject = null; }

    lastScoreRef.current = null; setScore(null); setStatus("정지됨"); setCamOk(false);
    const c = liveCanvasRef.current; if (c) { const ctx = c.getContext('2d'); ctx && ctx.clearRect(0,0,c.width,c.height); }
  },[]);

  /* 메인 루프 */
  function runLiveLoop(){
    const v = liveVideoRef.current, c = liveCanvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d"); if(!ctx) return;

    const inferAllowed = () => {
      const now = performance.now();
      if (now - lastInferAt.current < 1000 / LIVE_TARGET_FPS) return false;
      lastInferAt.current = now; return true;
    };

    const step = async () => {
      if (!isLiveRef.current || unmountedRef.current) return;

      ensureCanvasHiDPI(c);
      ctx.clearRect(0, 0, c.width, c.height);

      // object-fit: cover + 좌우반전
      if (v.readyState >= 2 && v.videoWidth && v.videoHeight) {
        const vw = v.videoWidth, vh = v.videoHeight;
        const cw = c.width,      ch = c.height;
        const scale = Math.max(cw / vw, ch / vh);
        const dw = vw * scale,   dh = vh * scale;

        ctx.save();
        ctx.translate(cw/2, ch/2);
        ctx.scale(-1, 1);
        ctx.drawImage(v, -dw/2, -dh/2, dw, dh);
        ctx.restore();
      }

      if (inferAllowed() && detectorRef.current) {
        try {
          const poses = await detectorRef.current.estimatePoses(v, { flipHorizontal: true });
          let kp = poses?.[0]?.keypoints;
          if (kp?.length) {
            const tNow = performance.now();
            kp = smoothKeypoints(kp, tNow);       // ★ 지터 억제
            drawSkeleton(ctx, kp);

            const { angles, w } = anglesAndWeightFromKP(kp);
            ring.current[ptr.current] = angles;
            ringW.current[ptr.current] = w;
            ptr.current = (ptr.current + 1) % WIN;
          }

          const ref = refSigRef.current;
          if (ref) {
            const seq = ring.current.slice(ptr.current).concat(ring.current.slice(0, ptr.current));
            const ws  = ringW.current.slice(ptr.current).concat(ringW.current.slice(0, ptr.current));
            const s1    = emaSmooth(seq, 0.3);
            const s2    = resampleSeq(s1, REF_N);
            const nA    = normAngles(s2);
            const wLive = resampleSeq(ws.map(x => [x, 0, 0]), REF_N).map(x => x[0]);
            const wComb = wLive.map((wl, i) => Math.min(wl, (ref.w && ref.w[i] != null) ? ref.w[i] : 1));

            // ★ DTW + phase 가중치
            const rmse = dtwWeightedRMSE(nA, ref.seq, W_CH, DTW_BAND, wComb, ref.w, ref.phase);
            const sc   = rmseToScore(rmse);
            lastScoreRef.current = sc;
            setScore(sc);
          }
        } catch (err) {
          console.warn('estimatePoses error', err);
        }
      }

      drawAccuracyHUD(ctx, lastScoreRef.current, !!refSigRef.current, c);
      scheduleNext();
    };

    const scheduleNext = () => {
      if (!isLiveRef.current || unmountedRef.current) return;
      const id = requestVFC(v, () => { step(); });
      if (id == null) {
        liveRafRef.current = requestAnimationFrame(step);
      } else {
        liveRVFCRef.current = id;
      }
    };

    scheduleNext();
  }

  /* 전체화면(표준 + 폴백) */
  const isFullscreen=()=>document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement||liveStageRef.current?.classList.contains("pfs");
  async function enterFullscreen(){
    const el=liveStageRef.current; if(!el) return;
    try{
      if(el.requestFullscreen) await el.requestFullscreen();
      else if(el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      else throw new Error("noFS");
      if(screen.orientation?.lock){ try{ await screen.orientation.lock("landscape"); }catch{} }
    }catch{
      el.classList.add("pfs"); document.body.style.overflow="hidden";
    }
    requestAnimationFrame(()=> ensureCanvasHiDPI(liveCanvasRef.current));
  }
  async function exitFullscreen(){
    if(document.fullscreenElement||document.webkitFullscreenElement){
      try{
        if(document.exitFullscreen) await document.exitFullscreen();
        else if(document.webkitExitFullscreen) await document.webkitExitFullscreen();
      }catch{}
      if(screen.orientation?.unlock){ try{ screen.orientation.unlock(); }catch{} }
    }else{
      liveStageRef.current?.classList.remove("pfs"); document.body.style.overflow="";
    }
    requestAnimationFrame(()=> ensureCanvasHiDPI(liveCanvasRef.current));
  }
  const toggleFullscreen=()=>{ isFullscreen()? exitFullscreen(): enterFullscreen(); };
  const onTouchEnd=(e)=>{ const now=Date.now(); if(now-lastTapRef.current<300){ e.preventDefault(); toggleFullscreen(); } lastTapRef.current=now; };

  /* 페이지 가시성/리사이즈 복구 */
  useEffect(()=>{
    const onVis = () => {
      if (document.visibilityState === 'visible' && isLiveRef.current) {
        afterNextPaint().then(()=> ensureCanvasHiDPI(liveCanvasRef.current));
      }
    };
    const onResize = () => { if (isLiveRef.current) ensureCanvasHiDPI(liveCanvasRef.current); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('resize', onResize);
    return ()=>{
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('resize', onResize);
    };
  },[]);

  return (
    <div className="pose-mog">
      <header className="mog-header">
        <div className="brand">MOG</div>
        <div className="title">가상 트레이너</div>
        <button className="bell" aria-label="알림" />
      </header>

      <section className="card">
        <h2 className="card__title">실시간 화면</h2>

        <div className="live-stage" ref={liveStageRef} onDoubleClick={toggleFullscreen} onTouchEnd={onTouchEnd}>
          <button className="fs-btn" onClick={toggleFullscreen} title="전체화면">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 10V4h6M20 14v6h-6M20 10V4h-6M4 14v6h6" stroke="#245cff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* ▼ 비율을 관리하는 뷰포트 */}
          <div className="live-viewport">
            {/* 비디오 = 프레임 공급(감춤) */}
            <video ref={liveVideoRef} playsInline muted className="live-video" />
            {/* 캔버스 = 표시층 */}
            <canvas ref={liveCanvasRef} className="live-canvas" />
          </div>
        </div>

        <div className="status-row">
          <div className="status-left">
            <span className="status-label">상태: {status} {ready ? "✅" : ""}</span>
            <span className={`status-ok ${camOk ? 'on':'off'}`} title={camOk ? '카메라 OK' : '카메라 대기'}/>
          </div>
          <div className="status-actions">
            <button onClick={startLive} className="btn btn-sm btn-primary">시작</button>
            <button onClick={stopLive}  className="btn btn-sm btn-secondary">스톱</button>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="card__title">파일 업로드</h2>
        <div className="dropzone"
             onDragOver={(e)=>e.preventDefault()}
             onDrop={(e)=>{ e.preventDefault(); if(e.dataTransfer.files?.[0]) handleLoadReferenceFile(e); }}>
          <input id="refFile" type="file" accept="video/mp4,video/webm" onChange={handleLoadReferenceFile} hidden />
          <label htmlFor="refFile">여기로 드래그 또는 탭하여 업로드</label>
          <video ref={refVideoRef} playsInline muted preload="auto" style={{display:"none"}} />
          <canvas ref={refCanvasRef} width={360} height={180} style={{display:"none"}} />
        </div>
        {status.includes("레퍼런스 처리 중") && (
          <div style={{margin:"8px 0", color:"#245cff"}}>처리 중... {progress}%</div>
        )}
      </section>

      <div className="cta-wrap">
        <button onClick={startLive} className="btn btn-primary cta-primary">분석 시작</button>
      </div>

      <section className="card">
        <h2 className="card__title">정확도 분석</h2>
        <div className="analysis">
          <div
            className="gauge"
            style={{ '--p': `${Number.isFinite(score) ? score : 0}%` }}
            data-val={Number.isFinite(score) ? String(score) : '--'}
          />
          <div className="bars">
            <div className="bar"><span>어깨</span>  <div className="bar__track"><div className="bar__fill" style={{width:'0%'}}/></div></div>
            <div className="bar"><span>팔꿈치</span><div className="bar__track"><div className="bar__fill" style={{width:'0%'}}/></div></div>
            <div className="bar"><span>무릎</span>  <div className="bar__track"><div className="bar__fill" style={{width:`${score ?? 0}%`}}/></div></div>
            <div className="bar"><span>엉덩이</span><div className="bar__track"><div className="bar__fill" style={{width:`${score ?? 0}%`}}/></div></div>
            <div className="bar"><span>발목</span>  <div className="bar__track"><div className="bar__fill" style={{width:'0%'}}/></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}
