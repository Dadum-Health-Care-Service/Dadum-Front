// PoseAccuracyMVP.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import "./PoseAccuracyMVP.css";

/* =========================
 * Config
 * ========================= */
const API_BASE = import.meta.env.VITE_AI_BASE || "http://localhost:9000";
const SHOW_ENGINE_TOGGLE = true;
const CFG = { LIVE_FPS: 20, YOLO_FPS: 10, WIN: 60, REF_N: 100 };
const ANGLE_RANGE = {
  knee: { min: 60, max: 180 },
  hip: { min: 50, max: 180 },
  trunk: { min: 0, max: 45 },
};

/* =========================
 * Utils (math/time/canvas)
 * ========================= */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const timeout = (ms) => new Promise((r) => setTimeout(r, ms));
const once = (el, ev) =>
  new Promise((r) => {
    const h = () => {
      el.removeEventListener(ev, h);
      r();
    };
    el.addEventListener(ev, h, { once: true });
  });
const isSecureHost = () =>
  window.isSecureContext ||
  location.protocol === "https:" ||
  ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname);

function angle(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y],
    v2 = [c.x - b.x, c.y - b.y];
  const dot = v1[0] * v2[0] + v1[1] * v2[1];
  const n = Math.hypot(...v1) * Math.hypot(...v2) + 1e-8;
  return (Math.acos(clamp(dot / n, -1, 1)) * 180) / Math.PI;
}
function trunkFlex(ls, rs, lh, rh) {
  const sm = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const hm = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const v = [sm.x - hm.x, sm.y - hm.y];
  const dot = v[0] * 0 + v[1] * -1,
    n = Math.hypot(...v) + 1e-8;
  return (Math.acos(clamp(dot / n, -1, 1)) * 180) / Math.PI;
}
function emaSmooth(seq, a = 0.7) {
  if (!seq.length) return seq;
  const out = new Array(seq.length);
  let p = seq[0];
  out[0] = p;
  for (let i = 1; i < seq.length; i++) {
    const c = seq[i];
    p = [
      a * c[0] + (1 - a) * p[0],
      a * c[1] + (1 - a) * p[1],
      a * c[2] + (1 - a) * p[2],
    ];
    out[i] = p;
  }
  return out;
}
function resampleSeq(seq, N) {
  if (!seq.length) return [];
  const out = new Array(N),
    L = seq.length - 1;
  for (let i = 0; i < N; i++) {
    const t = (i * L) / (N - 1),
      i0 = Math.floor(t),
      i1 = Math.min(L, i0 + 1),
      r = t - i0;
    const a = seq[i0],
      b = seq[i1];
    out[i] = [
      a[0] + (b[0] - a[0]) * r,
      a[1] + (b[1] - a[1]) * r,
      a[2] + (b[2] - a[2]) * r,
    ];
  }
  return out;
}
function normAngles(seq) {
  return seq.map(([k, h, t]) => [
    (clamp(k, ANGLE_RANGE.knee.min, ANGLE_RANGE.knee.max) -
      ANGLE_RANGE.knee.min) /
      (ANGLE_RANGE.knee.max - ANGLE_RANGE.knee.min),
    (clamp(h, ANGLE_RANGE.hip.min, ANGLE_RANGE.hip.max) - ANGLE_RANGE.hip.min) /
      (ANGLE_RANGE.hip.max - ANGLE_RANGE.hip.min),
    (clamp(t, ANGLE_RANGE.trunk.min, ANGLE_RANGE.trunk.max) -
      ANGLE_RANGE.trunk.min) /
      (ANGLE_RANGE.trunk.max - ANGLE_RANGE.trunk.min),
  ]);
}
function weightedRMSE(
  A,
  B,
  frameW = null,
  W = { knee: 0.4, hip: 0.35, trunk: 0.25 }
) {
  if (A.length !== B.length || A.length === 0) return Infinity;
  let seK = 0,
    seH = 0,
    seT = 0,
    ws = 0;
  for (let i = 0; i < A.length; i++) {
    const w = frameW ? frameW[i] ?? 1 : 1;
    if (w <= 0) continue;
    const [ak, ah, at] = A[i],
      [bk, bh, bt] = B[i];
    seK += w * (ak - bk) ** 2;
    seH += w * (ah - bh) ** 2;
    seT += w * (at - bt) ** 2;
    ws += w;
  }
  if (!ws) return Infinity;
  const rK = Math.sqrt(seK / ws),
    rH = Math.sqrt(seH / ws),
    rT = Math.sqrt(seT / ws);
  return W.knee * rK + W.hip * rH + W.trunk * rT;
}
const rmseToScore = (rmse) => {
  const base = 100 * (1 - rmse / 1.0);
  const scaled = base * 2.0;
  return clamp(Math.round(scaled), 1, 100);
};

/* =========================
 * View weights / penalties
 * ========================= */
const normalizeW = (W) => {
  const s = W.knee + W.hip + W.trunk || 1;
  return { knee: W.knee / s, hip: W.hip / s, trunk: W.trunk / s };
};
const blendW = (A, B, alpha = 0.5) =>
  normalizeW({
    knee: A.knee * (1 - alpha) + B.knee * alpha,
    hip: A.hip * (1 - alpha) + B.hip * alpha,
    trunk: A.trunk * (1 - alpha) + B.trunk * alpha,
  });

function inferViewFromKeypoints(kps) {
  const by = Object.fromEntries(kps.map((k) => [k.name, k]));
  const ls = by.left_shoulder,
    rs = by.right_shoulder,
    lh = by.left_hip,
    rh = by.right_hip,
    lk = by.left_knee,
    rk = by.right_knee;
  if (!ls || !rs || !lh || !rh || !lk || !rk)
    return { label: "oblique", conf: 0 };
  const distShoulderX = Math.abs(ls.x - rs.x);
  const distHipX = Math.abs(lh.x - rh.x);
  const distKneeX = Math.abs(lk.x - rk.x);
  const distShoulderY = Math.abs(ls.y - rs.y);
  const avgDistX = (distShoulderX + distHipX + distKneeX) / 3;
  const THRESH_FRONT = 0.4;
  const THRESH_SIDE = 0.2;
  const THRESH_Y_FRONT_MAX = 0.1;
  const THRESH_Y_SIDE_MAX = 0.2;
  let label = "oblique";
  let conf = 0.4;
  if (avgDistX > THRESH_FRONT && distShoulderY < THRESH_Y_FRONT_MAX) {
    label = "front";
    conf = clamp((avgDistX - 0.4) * 2 + (0.3 - distShoulderY) * 2, 0.1, 1.0);
  } else if (avgDistX < THRESH_SIDE && distShoulderY < THRESH_Y_SIDE_MAX) {
    label = "side";
    conf = clamp((0.2 - avgDistX) * 2 + (0.3 - distShoulderY) * 2, 0.1, 1.0);
  }
  return { label, conf: clamp(conf, 0.1, 1.0) };
}
const weightsForView = (l) =>
  l === "side"
    ? { knee: 0.45, hip: 0.4, trunk: 0.15 }
    : l === "front"
    ? { knee: 0.1, hip: 0.1, trunk: 0.2 }
    : { knee: 0.35, hip: 0.35, trunk: 0.3 };
function penaltyForIssues(label, issues) {
  const W_side = {
    kneeAlign: 0.05,
    trunkLean: 0.65,
    pelvisTilt: 0.1,
    asymmetry: 0.2,
  };
  const W_front = {
    kneeAlign: 0.55,
    trunkLean: 0.1,
    pelvisTilt: 0.25,
    asymmetry: 0.1,
  };
  const W_obl = {
    kneeAlign: 0.3,
    trunkLean: 0.3,
    pelvisTilt: 0.2,
    asymmetry: 0.2,
  };
  const W = label === "side" ? W_side : label === "front" ? W_front : W_obl;
  const sum = W.kneeAlign + W.trunkLean + W.pelvisTilt + W.asymmetry;
  const s =
    (issues.kneeAlign ? W.kneeAlign : 0) +
    (issues.trunkLean ? W.trunkLean : 0) +
    (issues.pelvisTilt ? W.pelvisTilt : 0) +
    (issues.asymmetry ? W.asymmetry : 0);
  return clamp(s / (sum || 1), 0, 1);
}

/* =========================
 * Issue detectors
 * ========================= */
const len = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const distPointToLineNorm = (P, A, B) => {
  const ABx = B.x - A.x,
    ABy = B.y - A.y;
  const APx = P.x - A.x,
    APy = P.y - A.y;
  const denom = Math.hypot(ABx, ABy) + 1e-8;
  return Math.abs(ABx * APy - ABy * APx) / denom / denom;
};
const kneeAngle = (by, side = "right") =>
  angle(by[`${side}_hip`], by[`${side}_knee`], by[`${side}_ankle`]);
function assessFrameIssues(kp, exId) {
  const by = Object.fromEntries(kp.map((k) => [k.name, k]));
  let kneeAlign = false,
    trunkLean = false,
    pelvisTilt = false,
    asymmetry = false;
  try {
    const devR = distPointToLineNorm(
      by.right_knee,
      by.right_ankle,
      by.right_hip
    );
    const devL =
      by.left_knee && by.left_ankle && by.left_hip
        ? distPointToLineNorm(by.left_knee, by.left_ankle, by.left_hip)
        : 0;
    kneeAlign = devR > 0.12 || devL > 0.12;
  } catch {}
  try {
    const t = trunkFlex(
      by.left_shoulder,
      by.right_shoulder,
      by.left_hip,
      by.right_hip
    );
    const limit = exId === "pushup" ? 20 : exId === "hinge" ? 40 : 32;
    trunkLean = t > limit;
  } catch {}
  try {
    const sh = len(by.left_shoulder, by.right_shoulder) || 1;
    pelvisTilt =
      Math.abs((by.left_hip?.y ?? 0) - (by.right_hip?.y ?? 0)) / sh > 0.08;
  } catch {}
  try {
    const kr = kneeAngle(by, "right"),
      kl = kneeAngle(by, "left");
    asymmetry =
      Number.isFinite(kr) && Number.isFinite(kl) && Math.abs(kr - kl) > 18;
  } catch {}
  return { kneeAlign, trunkLean, pelvisTilt, asymmetry };
}

/* =========================
 * Segmentation (unified)
 * ========================= */
const segState = () => ({ busy: false, last: null, lastAt: 0 });
async function ensureSeg(segRef) {
  if (segRef.current) return segRef.current;
  const seg = new SelfieSegmentation({
    locateFile: (f) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${f}`,
  });
  seg.setOptions({ modelSelection: 1, selfieMode: true });
  if (typeof seg.initialize === "function")
    try {
      await seg.initialize();
    } catch {}
  segRef.current = seg;
  return seg;
}
async function segOnce(segRef, image, stateRef, intervalMs = 70) {
  const st = stateRef.current,
    now = performance.now();
  if (st.busy || now - st.lastAt < intervalMs) return st.last;
  const hasSize = image?.videoWidth > 0 && image?.videoHeight > 0;
  const hasCanvasSize = image?.width > 0 && image?.height > 0;
  if (!(hasSize || hasCanvasSize)) return st.last;
  st.busy = true;
  const seg = await ensureSeg(segRef);
  const res = await new Promise((resolve) => {
    const h = (r) => {
      seg.onResults(() => {});
      resolve(r);
    };
    seg.onResults(h);
    seg.send({ image });
  });
  st.last = res;
  st.lastAt = performance.now();
  st.busy = false;
  return res;
}
function renderSeg(ctx, { video, mask, mode, w, h }) {
  if (!ctx || !mask) return;
  // draw mask then either overlay or keep person only
  ctx.drawImage(mask, 0, 0, w, h);
  ctx.globalCompositeOperation = "source-in";
  if (mode === "person") ctx.drawImage(video, 0, 0, w, h);
  else {
    ctx.fillStyle = "rgba(36,92,255,.45)";
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalCompositeOperation = "source-over";
}

/* =========================
 * Detector (MoveNet → BlazePose)
 * ========================= */
async function ensureDetector(detectorRef) {
  if (detectorRef.current) return detectorRef.current;
  await tf.ready();
  try {
    await tf.setBackend("webgl");
  } catch {}
  try {
    const opts = {
      modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
    };
    if (import.meta?.env?.VITE_MOVENET_URL)
      opts.modelUrl = import.meta.env.VITE_MOVENET_URL;
    const det = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      opts
    );
    detectorRef.current = det;
    return det;
  } catch (e) {
    console.warn("MoveNet 실패, BlazePose 폴백", e);
  }
  const det = await poseDetection.createDetector(
    poseDetection.SupportedModels.BlazePose,
    {
      runtime: "mediapipe",
      modelType: "full",
      solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose",
    }
  );
  detectorRef.current = det;
  return det;
}

/* =========================
 * Drawing (skeleton/HUD)
 * ========================= */
const EDGES = [
  ["left_shoulder", "right_shoulder"],
  ["left_hip", "right_hip"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
];
function drawSkel(ctx, kps) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(95,212,255,.85)";
  ctx.fillStyle = "#5fd4ff";
  EDGES.forEach(([a, b]) => {
    const A = kps.find((k) => k.name === a),
      B = kps.find((k) => k.name === b);
    if (!A || !B) return;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
  });
  kps.forEach((k) => {
    ctx.beginPath();
    ctx.arc(k.x, k.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}
function drawHUD(ctx, scoreObj, hasRef, canvas, rec = false, sec = 0) {
  const dpr = window.devicePixelRatio || 1,
    x = 8 * dpr,
    y = 8 * dpr,
    w = Math.min(260 * dpr, canvas.width - 16 * dpr),
    h = 36 * dpr,
    r = 12 * dpr,
    p = 10 * dpr;
  const avg = Number.isFinite(scoreObj?.avg) ? scoreObj.avg : null;
  const inst = Number.isFinite(scoreObj?.inst) ? scoreObj.inst : null;

  ctx.save();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(0,12,28,.55)";
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }
  const pct = Number.isFinite(avg) ? avg / 100 : 0,
    bx = x + p,
    by = y + h / 2 - 5 * dpr,
    bw = w - 2 * p - (rec ? 60 * dpr : 0),
    bh = 10 * dpr;
  const grad = ctx.createLinearGradient(bx, by, bx + bw, by);
  grad.addColorStop(0, "#2F6BFF");
  grad.addColorStop(1, "#5FD4FF");
  ctx.fillStyle = "#0E2B57";
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, Math.round(bw * pct), bh);
  ctx.fillStyle = "#fff";
  ctx.font = `${12 * dpr}px system-ui,-apple-system,Roboto,Arial`;
  ctx.textBaseline = "middle";
  const label = hasRef
    ? `정확도 평균: ${Number.isFinite(avg) ? avg + "%" : "--"}${
        Number.isFinite(inst) ? ` (순간 ${inst}%)` : ""
      }`
    : "레퍼런스 필요";
  ctx.fillText(label, bx, y + h / 2);
  if (rec) {
    const rx = x + w - 50 * dpr,
      ry = y + h / 2;
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(rx, ry, 5 * dpr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    const mmss = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(
      sec % 60
    ).padStart(2, "0")}`;
    ctx.fillText(mmss, rx + 10 * dpr, ry);
  }
  ctx.restore();
}

/* =========================
 * Camera / Mock input
 * ========================= */
async function pickDeviceIdForFacing(facingHint = "environment") {
  try {
    const videos = (await navigator.mediaDevices.enumerateDevices()).filter(
      (d) => d.kind === "videoinput"
    );
    if (!videos.length) return null;
    const back = /back|rear|environment|후면/i,
      front = /front|user|전면/i;
    if (facingHint === "environment")
      return (
        videos.find((v) => back.test(v.label))?.deviceId ??
        videos.at(-1)?.deviceId ??
        videos[0].deviceId
      );
    return (
      videos.find((v) => front.test(v.label))?.deviceId ?? videos[0].deviceId
    );
  } catch {
    return null;
  }
}
async function getStreamWithFacing(facing = "user") {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  } catch {
    const deviceId = await pickDeviceIdForFacing(facing);
    if (!deviceId) throw new Error("No camera");
    return await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: deviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    });
  }
}
async function getStreamFromVideoFile(fileOrUrl) {
  const url =
    typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  const vid = document.createElement("video");
  Object.assign(vid, { src: url, muted: true, playsInline: true, loop: true });
  vid.style.cssText =
    "position:fixed;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;";
  document.body.appendChild(vid);
  if (vid.readyState < 1)
    await new Promise((r) =>
      vid.addEventListener("loadedmetadata", r, { once: true })
    );
  try {
    await vid.play();
  } catch {}
  if (vid.paused)
    await new Promise((r) => {
      const on = () => {
        vid.removeEventListener("playing", on);
        r();
      };
      vid.addEventListener("playing", on, { once: true });
      vid.play().catch(() => {});
    });
  const stream = vid.captureStream
    ? vid.captureStream()
    : vid.mozCaptureStream
    ? vid.mozCaptureStream()
    : null;
  if (!stream)
    throw new Error("이 브라우저는 captureStream을 지원하지 않습니다.");
  const cleanup = () => {
    try {
      vid.pause();
      vid.src = "";
      vid.remove();
    } catch {}
    if (typeof fileOrUrl !== "string")
      try {
        URL.revokeObjectURL(url);
      } catch {}
  };
  return { stream, cleanup, vid };
}

/* =========================
 * Exercise DB / weights
 * ========================= */
const EX_DB = [
  {
    id: "squat",
    name: "스쿼트",
    joints: ["knee", "hip", "trunk"],
    desc: "하지 굴곡/신전 패턴.",
    cues: ["무릎=발끝", "가슴 열기", "발 전체로 밀기"],
    proto: { kneeROM: 110, hipROM: 90, trunkROM: 20 },
  },
  {
    id: "lunge",
    name: "런지",
    joints: ["knee", "hip", "trunk"],
    desc: "편측 지지 균형/ROM.",
    cues: ["앞무릎 발끝 넘지 않기", "골반 정렬"],
    proto: { kneeROM: 100, hipROM: 80, trunkROM: 25 },
  },
  {
    id: "pushup",
    name: "푸시업",
    joints: ["trunk"],
    desc: "코어-상지 연계.",
    cues: ["팔꿈치 45°", "몸 일직선"],
    proto: { kneeROM: 10, hipROM: 15, trunkROM: 10 },
  },
  {
    id: "situp",
    name: "싯업",
    joints: ["trunk", "hip"],
    desc: "복부 중심 굴곡.",
    cues: ["턱 가볍게", "반동 금지"],
    proto: { kneeROM: 30, hipROM: 60, trunkROM: 45 },
  },
  {
    id: "plank",
    name: "플랭크",
    joints: ["trunk"],
    desc: "정적 코어 안정.",
    cues: ["복부/둔근 수축", "허리 중립"],
    proto: { kneeROM: 10, hipROM: 10, trunkROM: 8 },
  },
];
function classifyByDB({ kneeROM, hipROM, trunkROM }) {
  const N = (v, max) => v / (max || 1);
  let best = null,
    bestD = 1e9;
  for (const ex of EX_DB) {
    const p = ex.proto;
    const d =
      N(kneeROM - p.kneeROM, 120) ** 2 +
      N(hipROM - p.hipROM, 120) ** 2 +
      N(trunkROM - p.trunkROM, 90) ** 2;
    if (d < bestD) {
      bestD = d;
      best = ex;
    }
  }
  const conf = clamp(Math.round(100 * (1 - Math.min(bestD, 1))), 0, 100);
  return { ...best, conf };
}
const focusToWeights = (joints = []) => {
  const base = { knee: 0.2, hip: 0.2, trunk: 0.2 };
  const pick = joints.filter((j) => ["knee", "hip", "trunk"].includes(j));
  if (pick.length) pick.forEach((j) => (base[j] += 0.6 / pick.length));
  else {
    base.knee = 0.4;
    base.hip = 0.35;
    base.trunk = 0.25;
  }
  const s = base.knee + base.hip + base.trunk;
  return { knee: base.knee / s, hip: base.hip / s, trunk: base.trunk / s };
};

/* =========================
 * Main Component
 * ========================= */
export default function PoseAccuracyMVP() {
  const stageRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const refVideo = useRef(null);
  const refCanvas = useRef(null);

  const detectorRef = useRef(null);
  const segRef = useRef(null);
  const segStateRef = useRef(segState());

  const refSigRef = useRef(null);
  const W_REF = useRef({ knee: 0.4, hip: 0.35, trunk: 0.25 });
  const ring = useRef(Array.from({ length: CFG.WIN }, () => [0, 0, 0]));
  const ringW = useRef(Array.from({ length: CFG.WIN }, () => 1));
  const ptr = useRef(0);
  const lastInfer = useRef(0);
  const runningRef = useRef(false);

  // YOLO
  const yoloBusy = useRef(false);
  const yoloImgRef = useRef(null);
  const offscreen = useRef(null);

  const sessionRef = useRef({
    start: 0,
    t: [],
    score: [],
    knee: [],
    hip: [],
    trunk: [],
    issues: {
      kneeAlign: 0,
      trunkLean: 0,
      pelvisTilt: 0,
      asymmetry: 0,
      total: 0,
    },
  });

  const [status, setStatus] = useState("라이브 대기");
  const [segMode, setSegMode] = useState("off"); // off | overlay
  const [engine, setEngine] = useState("local"); // local | yolo
  const [serverUp, setServerUp] = useState(false);
  const [isRunning, setRunning] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const [score, setScore] = useState({ inst: null, avg: null });

  const [ex, setEx] = useState(null);
  const exRef = useRef(null);
  useEffect(() => {
    exRef.current = ex;
  }, [ex]);
  const [refProg, setRefProg] = useState({
    running: false,
    pct: 0,
    fileName: "",
  });
  const [result, setResult] = useState(null);

  const [camFacing, setCamFacing] = useState("user"); // user | environment
  const streamRef = useRef(null);
  const resultRef = useRef(null);

  // Mock
  const [mockMode, setMockMode] = useState(false);
  const [mockFile, setMockFile] = useState(null);
  const mockCleanupRef = useRef(() => {});
  const mockSrcRef = useRef(null);

  // View/issues
  const viewRef = useRef({ label: "side", conf: 0 });
  const lastIssuesRef = useRef({
    kneeAlign: false,
    trunkLean: false,
    pelvisTilt: false,
    asymmetry: false,
  });

  /* Server availability → engine auto */
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

  /* 세그 모드 바뀔 때 이전 마스크 캐시 초기화 */
  useEffect(() => {
    if (segStateRef.current) {
      segStateRef.current.last = null;
      segStateRef.current.lastAt = 0;
    }
  }, [segMode]);

  /* Timer */
  useEffect(() => {
    if (!isRunning) return;
    setRecSec(0);
    const t = setInterval(() => setRecSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  /* Ingest keypoints */
  const ingestKeypoints = useCallback(
    (named, drawCtxScale = null, drawCtx = null) => {
      if (drawCtx && drawCtxScale) {
        const { sx, sy } = drawCtxScale;
        drawSkel(
          drawCtx,
          named.map((k) => ({ ...k, x: k.x * sx, y: k.y * sy }))
        );
      }
      viewRef.current = inferViewFromKeypoints(named);
      const issues = assessFrameIssues(named, exRef.current?.id);
      lastIssuesRef.current = issues;

      const by = Object.fromEntries(named.map((k) => [k.name, k]));
      const kneeA = angle(by["right_hip"], by["right_knee"], by["right_ankle"]);
      const hipA = angle(
        by["right_shoulder"],
        by["right_hip"],
        by["right_knee"]
      );
      const trunkA = trunkFlex(
        by["left_shoulder"],
        by["right_shoulder"],
        by["left_hip"],
        by["right_hip"]
      );

      ring.current[ptr.current] = [kneeA, hipA, trunkA];
      ringW.current[ptr.current] = Math.min(
        by["right_knee"]?.score ?? 1,
        by["right_hip"]?.score ?? 1,
        by["right_ankle"]?.score ?? 1
      );
      ptr.current = (ptr.current + 1) % CFG.WIN;

      const now = performance.now();
      const S = sessionRef.current;
      S.t.push(now);
      S.knee.push(kneeA);
      S.hip.push(hipA);
      S.trunk.push(trunkA);
      if (issues.kneeAlign) S.issues.kneeAlign++;
      if (issues.trunkLean) S.issues.trunkLean++;
      if (issues.pelvisTilt) S.issues.pelvisTilt++;
      if (issues.asymmetry) S.issues.asymmetry++;
      S.issues.total++;
    },
    []
  );

  /* Start */
  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!mockMode && !isSecureHost()) {
      setStatus("HTTPS 또는 localhost 필요");
      return;
    }
    try {
      const det = await ensureDetector(detectorRef);
      if (!det) {
        setStatus("모델 준비 실패");
        return;
      }

      try {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
      } catch {}
      try {
        mockCleanupRef.current?.();
      } catch {}

      setStatus("입력 초기화 중…");

      let s;
      if (mockMode) {
        if (!mockFile) {
          setStatus("테스트 모드: 영상 파일을 선택하세요");
          return;
        }
        const { stream, cleanup, vid } = await getStreamFromVideoFile(mockFile);
        s = stream;
        mockCleanupRef.current = cleanup;
        mockSrcRef.current = vid;
      } else {
        s = await getStreamWithFacing(camFacing);
        mockCleanupRef.current = () => {};
        mockSrcRef.current = null;
      }
      streamRef.current = s;

      const v = videoRef.current;
      v.srcObject = s;
      v.muted = true;
      v.playsInline = true;
      await v.play().catch(() => {});
      if (v.readyState < 2 || !v.videoWidth) await once(v, "loadedmetadata");

      if (!offscreen.current)
        offscreen.current = document.createElement("canvas");
      const ow = 640,
        oh = Math.round((v.videoHeight / v.videoWidth) * ow);
      offscreen.current.width = ow;
      offscreen.current.height = oh;

      yoloImgRef.current = null;

      runningRef.current = true;
      setRunning(true);
      setStatus("실시간 분석 중");
      sessionRef.current = {
        start: performance.now(),
        t: [],
        score: [],
        knee: [],
        hip: [],
        trunk: [],
        issues: {
          kneeAlign: 0,
          trunkLean: 0,
          pelvisTilt: 0,
          asymmetry: 0,
          total: 0,
        },
      };
      setScore({ inst: null, avg: null });
      loop();
    } catch (e) {
      console.error(e);
      setStatus("카메라 시작 실패");
    }
  }, [camFacing, mockMode, mockFile]);

  /* Stop → summary */
  const stop = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    setRunning(false);
    setStatus("정지됨");

    try {
      streamRef.current?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    try {
      streamRef.current = null;
      videoRef.current.srcObject = null;
    } catch {}
    try {
      mockCleanupRef.current?.();
    } catch {}
    try {
      mockSrcRef.current = null;
    } catch {}

    try {
      const S = sessionRef.current;
      const avg = S.score.length
        ? Math.round(S.score.reduce((a, b) => a + b, 0) / S.score.length)
        : null;
      const reps = (() => {
        const arr = S.knee || [];
        let down = false,
          c = 0;
        for (let i = 1; i < arr.length; i++) {
          const v = arr[i];
          if (!Number.isFinite(v)) continue;
          if (!down && v < 100) down = true;
          else if (down && v > 160) {
            c++;
            down = false;
          }
        }
        return c;
      })();
      const rom = {
        knee: S.knee.length
          ? Math.round(
              Math.max(...S.knee.filter(Number.isFinite)) -
                Math.min(...S.knee.filter(Number.isFinite))
            )
          : null,
        hip: S.hip.length
          ? Math.round(
              Math.max(...S.hip.filter(Number.isFinite)) -
                Math.min(...S.hip.filter(Number.isFinite))
            )
          : null,
        trunk: S.trunk.length
          ? Math.round(
              Math.max(...S.trunk.filter(Number.isFinite)) -
                Math.min(...S.trunk.filter(Number.isFinite))
            )
          : null,
      };
      const I = S.issues || { total: 0 },
        ratio = (n) => (I.total ? n / I.total : 0);
      const fb = [];
      if (ratio(I.kneeAlign) > 0.35)
        fb.push({
          id: "kneeAlign",
          title: "무릎-발목 정렬이 자주 무너져요",
          detail: "무릎이 발목-고관절 라인에서 벗어납니다.",
          fix: "발끝과 같은 방향으로 보냅니다.",
        });
      if (ratio(I.trunkLean) > 0.35)
        fb.push({
          id: "trunkLean",
          title: "몸통 전경사가 과해요",
          detail: "몸통이 자주 과도하게 숙여집니다.",
          fix:
            exRef.current?.id === "hinge"
              ? "힌지는 허리 중립 유지."
              : "가슴 열고 코어 안정화.",
        });
      if (ratio(I.pelvisTilt) > 0.35)
        fb.push({
          id: "pelvisTilt",
          title: "골반 수평 흔들림",
          detail: "좌우 힙 높이 차 큼.",
          fix: "양발로 바닥을 균등히 눌러 지지.",
        });
      if (ratio(I.asymmetry) > 0.35)
        fb.push({
          id: "asymmetry",
          title: "좌우 비대칭 큼",
          detail: "양쪽 무릎 굽힘 차 큼.",
          fix: "약한 쪽에 체중을 더 실어 천천히.",
        });

      setResult({
        score: avg,
        reps,
        rom,
        series: null,
        exName: exRef.current?.name || null,
        feedback: fb.slice(0, 3),
      });
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        0
      );
    } catch {}
  }, []);

  /* Switch camera */
  const switchCamera = useCallback(
    async (nextFacing) => {
      setCamFacing(nextFacing);
      if (!runningRef.current || mockMode) return;
      setStatus("카메라 전환 중…");
      try {
        const newStream = await getStreamWithFacing(nextFacing);
        const v = videoRef.current;
        try {
          streamRef.current?.getTracks?.().forEach((t) => t.stop());
        } catch {}
        streamRef.current = newStream;
        v.srcObject = newStream;
        await v.play().catch(() => {});
        if (v.readyState < 2 || !v.videoWidth) await once(v, "loadedmetadata");
        setStatus("실시간 분석 중");
      } catch (e) {
        console.error(e);
        setStatus("카메라 전환 실패");
      }
    },
    [mockMode]
  );

  /* 엔진 전환 즉시 리셋 */
  const changeEngine = useCallback((v) => {
    setEngine(v);
    yoloBusy.current = false;
    yoloImgRef.current = null;
  }, []);

  /* 공통 스코어링 */
  const computeInstantScore = useCallback(() => {
    if (!refSigRef.current) return null;
    // 워밍업: 포즈 시퀀스가 너무 짧을 때는 계산 보류
    if ((sessionRef.current?.knee?.length ?? 0) < 5) return null;

    const seq = ring.current
      .slice(ptr.current)
      .concat(ring.current.slice(0, ptr.current));
    const ws = ringW.current
      .slice(ptr.current)
      .concat(ringW.current.slice(0, ptr.current));
    const s1 = emaSmooth(seq, 0.7);
    const s2 = resampleSeq(s1, CFG.REF_N);
    const nA = normAngles(s2);
    const wLive = resampleSeq(
      ws.map((w) => [w, 0, 0]),
      CFG.REF_N
    ).map((x) => x[0]);
    const wComb = wLive.map((wl, i) =>
      Math.min(wl, refSigRef.current.w?.[i] ?? 1)
    );
    const WV = weightsForView(viewRef.current.label);
    const Wmix = blendW(
      W_REF.current,
      WV,
      viewRef.current.label === "front" ? 0.75 : 0.5
    );
    const e = weightedRMSE(nA, refSigRef.current.seq, wComb, Wmix);
    if (!Number.isFinite(e)) return null;

    const baseScore = rmseToScore(e);
    const p = penaltyForIssues(viewRef.current.label, lastIssuesRef.current);
    const penaltyScale =
      viewRef.current.label === "front"
        ? 0.4
        : viewRef.current.label === "side"
        ? 0.25
        : 0.33;
    const sc = clamp(Math.round(baseScore * (1 - penaltyScale * p)), 1, 100);
    return sc;
  }, []);

  /* Main loop */
  const loop = async () => {
    const v = videoRef.current,
      c = canvasRef.current;
    if (!v || !c) return;
    const ctx = c.getContext("2d");

    const step = async () => {
      if (!runningRef.current) return;

      const dpr = window.devicePixelRatio || 1,
        rect = c.getBoundingClientRect();
      const cw = Math.round(rect.width * dpr),
        ch = Math.round(rect.height * dpr);
      if (c.width !== cw || c.height !== ch) {
        c.width = cw;
        c.height = ch;
      }

      if (v.readyState >= 2) {
        if (mockMode && mockSrcRef.current && mockSrcRef.current.paused)
          mockSrcRef.current.play().catch(() => {});
        const vw = v.videoWidth,
          vh = v.videoHeight;
        const scale = Math.min(c.width / vw, c.height / vh),
          dw = vw * scale,
          dh = vh * scale;

        ctx.clearRect(0, 0, c.width, c.height);
        ctx.save();

        const flip = mockMode ? 1 : camFacing === "user" ? -1 : 1;
        ctx.translate(c.width / 2, c.height / 2);
        ctx.scale(flip, 1);
        ctx.translate(-dw / 2, -dh / 2);

        // Segmentation (overlay만 UI 제공)
        let segMask = null;
        if (segMode !== "off" && engine === "local") {
          try {
            segMask =
              (await segOnce(segRef, v, segStateRef, 70))?.segmentationMask ||
              null;
          } catch {}
        }
        if (segMask && segMode !== "off") {
          ctx.save();
          renderSeg(ctx, {
            video: v,
            mask: segMask,
            mode: "overlay",
            w: dw,
            h: dh,
          });
          if (segMode === "overlay") {
            ctx.globalCompositeOperation = "destination-over";
            ctx.drawImage(v, 0, 0, dw, dh);
            ctx.globalCompositeOperation = "source-over";
          }
          ctx.restore();
        } else {
          ctx.drawImage(v, 0, 0, dw, dh);
        }

        const now = performance.now();

        // Pose detection
        if (engine === "local") {
          if (now - lastInfer.current > 1000 / CFG.LIVE_FPS) {
            lastInfer.current = now;
            try {
              const poses = await detectorRef.current.estimatePoses(v, {
                flipHorizontal: false,
              });
              const kp = poses?.[0]?.keypoints;
              if (kp) ingestKeypoints(kp, { sx: dw / vw, sy: dh / vh }, ctx);
            } catch {}
          }
        } else {
          if (yoloImgRef.current)
            ctx.drawImage(yoloImgRef.current, 0, 0, dw, dh);
          if (
            !yoloBusy.current &&
            now - lastInfer.current > 1000 / CFG.YOLO_FPS
          ) {
            lastInfer.current = now;
            yoloBusy.current = true;
            try {
              const ofs = offscreen.current,
                pctx = ofs.getContext("2d");
              pctx.drawImage(v, 0, 0, ofs.width, ofs.height);
              const dataURL = ofs.toDataURL("image/jpeg", 0.8);
              const res = await fetch(`${API_BASE}/ai/pose`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ image: dataURL }),
              }).then((r) => r.json());
              if (res?.image) {
                const img = new Image();
                img.onload = () => (yoloImgRef.current = img);
                img.src = res.image;
              }
              if (Array.isArray(res?.keypoints) && res.keypoints.length >= 17)
                ingestKeypoints(yoloKeypointsToNamed(res.keypoints));
            } catch {
            } finally {
              yoloBusy.current = false;
            }
          }
        }

        ctx.restore();
      }

      // Scoring — HUD에 즉시 반영할 값 사용
      let hudScore = score; // 기본은 직전 상태
      if (refSigRef.current) {
        const inst = computeInstantScore();
        if (Number.isFinite(inst)) {
          const S = sessionRef.current;
          S.score.push(inst);
          const avg = Math.round(
            S.score.reduce((a, b) => a + b, 0) / S.score.length
          );
          hudScore = { inst, avg };
          setScore(hudScore); // 상태 갱신(요약 카드 등에서 사용)
        }
      }

      drawHUD(ctx, hudScore, !!refSigRef.current, c, isRunning, recSec);
      typeof v.requestVideoFrameCallback === "function"
        ? v.requestVideoFrameCallback(() => step())
        : requestAnimationFrame(step);
    };
    step();
  };

  /* Reference upload → preprocess & auto match */
  async function onRefFile(e) {
    const file = e.target?.files?.[0] ?? e.dataTransfer?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    await processReference(url, file.name);
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  async function processReference(url, displayName = "reference.mp4") {
    const det = await ensureDetector(detectorRef);
    if (!det) {
      setStatus("포즈 모델 준비 전입니다");
      return;
    }
    setRefProg({ running: true, pct: 0, fileName: displayName });

    const v = refVideo.current,
      c = refCanvas.current,
      ctx = c.getContext("2d");
    c.width = 360;
    c.height = Math.round((c.width * 9) / 16);
    v.src = url;
    v.muted = true;
    v.playsInline = true;
    await v.play().catch(() => {});
    v.pause();
    await once(v, "loadedmetadata");
    if (!v.videoWidth || !v.videoHeight) await once(v, "loadeddata");

    // 30FPS
    const dt = 1 / 30,
      duration = v.duration || 0;
    let t = 0,
      lastUI = 0;
    const seq = [],
      ws = [];

    const proc = document.createElement("canvas");
    proc.width = c.width;
    proc.height = c.height;
    const pctx = proc.getContext("2d");

    while (t <= duration) {
      v.currentTime = Math.min(duration, t);
      await Promise.race([once(v, "seeked"), timeout(1000)]);

      ctx.drawImage(v, 0, 0, c.width, c.height);

      // 전처리는 사람 영역만 남겨 추정 안정화 (UI 모드와 무관)
      let inferInput = v;
      try {
        const s = await segOnce(segRef, v, segStateRef, 90);
        if (s?.segmentationMask) {
          renderSeg(pctx, {
            video: v,
            mask: s.segmentationMask,
            mode: "person",
            w: proc.width,
            h: proc.height,
          });
          inferInput = proc;
        } else {
          pctx.drawImage(v, 0, 0, proc.width, proc.height);
          inferInput = proc;
        }
      } catch {
        pctx.drawImage(v, 0, 0, proc.width, proc.height);
        inferInput = proc;
      }

      try {
        const poses = await det.estimatePoses(inferInput, {
          flipHorizontal: false,
        });
        const kp = poses?.[0]?.keypoints;
        if (kp) {
          const by = Object.fromEntries(kp.map((k) => [k.name, k]));
          const kneeA = angle(
            by["right_hip"],
            by["right_knee"],
            by["right_ankle"]
          );
          const hipA = angle(
            by["right_shoulder"],
            by["right_hip"],
            by["right_knee"]
          );
          const trunkA = trunkFlex(
            by["left_shoulder"],
            by["right_shoulder"],
            by["left_hip"],
            by["right_hip"]
          );
          const conf = Math.min(
            by["right_knee"]?.score ?? 1,
            by["right_hip"]?.score ?? 1,
            by["right_ankle"]?.score ?? 1
          );
          seq.push([kneeA, hipA, trunkA]);
          ws.push(conf);
        }
      } catch {}

      t += dt;
      const now = performance.now();
      if (now - lastUI > 80) {
        setRefProg((p) => ({
          ...p,
          pct: Math.min(100, Math.round((t / duration) * 100)),
        }));
        lastUI = now;
      }
    }

    const s1 = emaSmooth(seq, 0.7),
      s2 = resampleSeq(s1, CFG.REF_N),
      nA = normAngles(s2);
    const w2 = resampleSeq(
      ws.map((w) => [w, 0, 0]),
      CFG.REF_N
    ).map((x) => x[0]);
    refSigRef.current = { seq: nA, w: w2 };
    setRefProg({ running: false, pct: 100, fileName: displayName });

    const ch = (i) => s2.map((a) => a[i] ?? 0);
    const rom = (arr) => {
      let mn = Infinity,
        mx = -Infinity;
      for (const v of arr) {
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      return Math.round(mx - mn);
    };
    const kneeROM = rom(ch(0)),
      hipROM = rom(ch(1)),
      trunkROM = rom(ch(2));
    const picked = classifyByDB({ kneeROM, hipROM, trunkROM });
    setEx({ ...picked, rom: { kneeROM, hipROM, trunkROM } });
    W_REF.current = focusToWeights(picked.joints);
  }

  /* ======= UI ======= */
  const engineOptions = [
    { value: "local", label: "TF", title: "로컬 TFJS" },
    { value: "yolo", label: "YOLO", title: "원격 YOLO 서버" },
  ];
  const segOptions = [
    { value: "off", label: "off" },
    { value: "overlay", label: "overlay" }, // person 제거
  ];
  const camOptions = [
    { value: "user", label: "전면" },
    { value: "environment", label: "후면" },
  ];

  return (
    <div className="pose-page">
      {/* 상단 */}
      <section className="card">
        <div className="card-head">
          <div className={`status ${isRunning ? "is-on" : ""}`}>
            상태: {status}
          </div>
          <Segment
            options={segOptions}
            value={segMode}
            onChange={setSegMode}
            title="세그"
          />
          {SHOW_ENGINE_TOGGLE && (
            <Segment
              options={engineOptions}
              value={engine}
              onChange={changeEngine}
              title="엔진"
            />
          )}
          <Segment
            options={camOptions}
            value={camFacing}
            onChange={(v) => switchCamera(v)}
            disabled={refProg.running || mockMode}
            title="카메라"
          />
          <div className="toolbar-spacer" />
          <label className="toggle" title="녹화영상으로 테스트">
            <span>녹화영상</span>
            <input
              type="checkbox"
              checked={mockMode}
              onChange={(e) => setMockMode(e.target.checked)}
            />
          </label>
          <label
            className={`file-btn ${!mockMode ? "disabled" : ""}`}
            title="비디오 파일 선택"
          >
            <input
              type="file"
              accept="video/*"
              disabled={!mockMode}
              onChange={(e) => setMockFile(e.target.files?.[0] || null)}
            />
            <span>파일 선택</span>
            <span className="file-name">
              {mockFile?.name || "선택된 파일 없음"}
            </span>
          </label>
          <div className="chip" title="현재 상태">
            seg:{segMode} · eng:{engine}
            {serverUp ? "" : " (srv↓)"} · cam:{camFacing} · mock:
            {String(mockMode)}
          </div>
        </div>

        <div className="stage" ref={stageRef}>
          <canvas ref={canvasRef} className="viewport" />
          <video ref={videoRef} className="hidden" playsInline muted />
        </div>

        <button
          type="button"
          className={`cta ${isRunning ? "stop" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            (isRunning ? stop : start)();
          }}
          disabled={refProg.running}
        >
          {isRunning ? "분석 종료" : "분석 시작"}
        </button>
      </section>

      {/* 레퍼런스 */}
      <section className="card">
        <h3 className="card-title">레퍼런스</h3>
        {refProg.running ? (
          <div>
            <div className="progress-row">
              <span className="spinner" /> 전처리 중 · {refProg.fileName} ·{" "}
              <b>{refProg.pct}%</b>
            </div>
            <div className="progress">
              <div
                className="progress-fill"
                style={{ width: `${refProg.pct}%` }}
              />
            </div>
          </div>
        ) : (
          <div
            className="dropzone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onRefFile(e);
            }}
          >
            <input
              id="refFile"
              type="file"
              accept="video/*"
              onChange={onRefFile}
              hidden
            />
            <label htmlFor="refFile">여기로 드래그 또는 탭하여 업로드</label>
            <video ref={refVideo} playsInline muted className="hidden" />
            <canvas
              ref={refCanvas}
              width={360}
              height={180}
              className="hidden"
            />
          </div>
        )}
        <p className="hint">
          레퍼런스를 업로드하면 자동 매칭되어 <b>설명/분석 관절</b>이 아래에
          표시됩니다.
        </p>
      </section>

      {/* 인사이트 */}
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
            {ex.joints.map((j) => (
              <span key={j} className="chip">
                {j}
              </span>
            ))}
          </div>
          {ex.rom && (
            <div className="rom-grid">
              <RomBar label="무릎 ROM" value={ex.rom.kneeROM} max={120} />
              <RomBar label="엉덩이 ROM" value={ex.rom.hipROM} max={120} />
              <RomBar label="몸통 ROM" value={ex.rom.trunkROM} max={90} />
            </div>
          )}
        </section>
      )}

      {/* 요약 */}
      {result && (
        <section className="card" ref={resultRef}>
          <h3 className="card-title">
            분석 요약{result.exName ? ` · ${result.exName}` : ""}
          </h3>
          <div className="metric-grid">
            <Metric
              label="정확도(평균)"
              value={Number.isFinite(result.score) ? `${result.score}%` : "-"}
            />
            <Metric
              label="반복수"
              value={Number.isFinite(result.reps) ? `${result.reps}` : "-"}
            />
          </div>
          <div className="rom-grid">
            <RomBar label="무릎 ROM" value={result.rom?.knee ?? 0} max={120} />
            <RomBar label="엉덩이 ROM" value={result.rom?.hip ?? 0} max={120} />
            <RomBar label="몸통 ROM" value={result.rom?.trunk ?? 0} max={90} />
          </div>

          {result?.feedback?.length > 0 && (
            <div className="issues">
              <div className="issues__title">폼 피드백</div>
              <ul className="issues__list">
                {result.feedback.map((it, i) => (
                  <li className="issues__item" key={i}>
                    <div className="issues__item-title">• {it.title}</div>
                    {it.detail && (
                      <div className="issues__item-detail">{it.detail}</div>
                    )}
                    {it.fix && (
                      <div className="issues__item-fix">TIP: {it.fix}</div>
                    )}
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

/* =========================
 * Small components
 * ========================= */
function Segment({ options, value, onChange, disabled = false, title }) {
  return (
    <div className="camera-switch" role="group" aria-label={title || "segment"}>
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            className={`cam-btn ${active ? "on" : ""}`}
            aria-pressed={active}
            data-seg={title || ""}
            data-value={opt.value}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!disabled) onChange?.(opt.value);
            }}
            disabled={disabled}
            title={opt.title || ""}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
function Metric({ label, value }) {
  return (
    <div className="metric">
      <div className="metric__label">{label}</div>
      <div className="metric__value">{value}</div>
    </div>
  );
}
function RomBar({ label, value, max }) {
  const pct = Math.max(
    0,
    Math.min(100, Math.round((value / (max || 1)) * 100))
  );
  return (
    <div className="rom">
      <div className="rom__label">{label}</div>
      <div className="rom__bar">
        <div className="rom__fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="rom__val">
        {Number.isFinite(value) ? Math.round(value) : 0}°
      </div>
    </div>
  );
}

/* =========================
 * YOLO keypoints → named
 * ========================= */
function yoloKeypointsToNamed(kps) {
  const idx = (i) => kps.find((k) => k.id === i) || {};
  const as = (id, name) => ({
    name,
    x: idx(id).x ?? 0,
    y: idx(id).y ?? 0,
    score: idx(id).conf ?? 0,
  });
  return [
    as(5, "left_shoulder"),
    as(6, "right_shoulder"),
    as(7, "left_elbow"),
    as(8, "right_elbow"),
    as(9, "left_wrist"),
    as(10, "right_wrist"),
    as(11, "left_hip"),
    as(12, "right_hip"),
    as(13, "left_knee"),
    as(14, "right_knee"),
    as(15, "left_ankle"),
    as(16, "right_ankle"),
  ];
}
