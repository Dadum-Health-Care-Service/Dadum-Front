// src/components/pages/Pose/MultiStreamPoseAnalyzer.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as poseDetection from "@tensorflow-models/pose-detection";

/** 샘플 비교: 두 포즈의 keypoint L2 거리 평균을 0~100로 뒤집어 스코어링 */
function comparePoses(poseA, poseB) {
  if (!poseA || !poseB) return 0;
  const a = poseA.keypoints || [], b = poseB.keypoints || [];
  const n = Math.min(a.length, b.length);
  let sum = 0, cnt = 0;
  for (let i = 0; i < n; i++) {
    if (a[i]?.score > 0.3 && b[i]?.score > 0.3) {
      const dx = a[i].x - b[i].x, dy = a[i].y - b[i].y;
      sum += Math.hypot(dx, dy); cnt++;
    }
  }
  if (!cnt) return 0;
  const avg = sum / cnt;
  return Math.max(0, Math.min(100, Math.round(100 - avg / 5)));
}

export default function MultiStreamPoseAnalyzer({ streamsMap }) {
  const ids = useMemo(() => Array.from(streamsMap.keys()), [streamsMap]);
  const [refId, setRefId] = useState(() => ids.find(id => id !== "local") || ids[0]);
  const [liveId, setLiveId] = useState("local");

  const detectorRef = useRef(null);
  const vidsRef = useRef(new Map());   // id -> HTMLVideoElement
  const posesRef = useRef(new Map());  // id -> last pose
  const [accuracy, setAccuracy] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await tf.setBackend("webgl");
      const detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        { modelType: "Lightning" }
      );
      detectorRef.current = detector;

      const loop = async () => {
        if (!mounted) return;
        const t0 = performance.now();
        for (const [id, v] of vidsRef.current.entries()) {
          if (!v || v.readyState < 2) continue;
          try {
            const pose = await detector.estimatePoses(v, { flipHorizontal: false });
            if (pose?.[0]) posesRef.current.set(id, pose[0]);
          } catch {}
        }
        const pa = posesRef.current.get(refId), pb = posesRef.current.get(liveId);
        setAccuracy(comparePoses(pa, pb));

        const elapsed = performance.now() - t0;
        setTimeout(loop, Math.max(0, 60 - elapsed)); // ≈16fps 타겟
      };
      loop();
    })();
    return () => { detectorRef.current?.dispose?.(); mounted = false; };
  }, [refId, liveId]);

  // 스트림 변화 → video 노드 갱신
  useEffect(() => {
    for (const id of ids) {
      if (!vidsRef.current.get(id)) {
        const v = document.createElement("video");
        v.playsInline = true; v.muted = id === "local"; v.autoplay = true;
        v.srcObject = streamsMap.get(id);
        v.onloadedmetadata = () => v.play().catch(()=>{});
        vidsRef.current.set(id, v);
      }
    }
    for (const id of Array.from(vidsRef.current.keys())) {
      if (!streamsMap.has(id)) {
        vidsRef.current.get(id)?.pause();
        vidsRef.current.delete(id);
        posesRef.current.delete(id);
      }
    }
  }, [ids, streamsMap]);

  return (
    <section className="card" style={{marginTop:12}}>
      <h2 className="card__title">동시 미리보기 · 포즈 비교</h2>

      <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:8}}>
        <label>Reference:</label>
        <select value={refId || ""} onChange={e=>setRefId(e.target.value)}>
          {ids.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <label style={{marginLeft:12}}>Live:</label>
        <select value={liveId || ""} onChange={e=>setLiveId(e.target.value)}>
          {ids.map(id => <option key={id} value={id}>{id}</option>)}
        </select>
        <div style={{marginLeft:"auto", fontWeight:700}}>Accuracy: {accuracy}%</div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:12}}>
        {ids.map(id => <VideoTile key={id} id={id} getVideoEl={() => vidsRef.current.get(id)} />)}
      </div>
    </section>
  );
}

function VideoTile({ id, getVideoEl }) {
  const wrapRef = useRef(null);
  useEffect(() => {
    const v = getVideoEl();
    if (!v || !wrapRef.current) return;
    wrapRef.current.innerHTML = "";
    wrapRef.current.appendChild(v);
    Object.assign(v.style, { width: "100%", height: "auto", borderRadius: "12px" });
  }, [getVideoEl]);

  return (
    <div style={{border:"1px solid #e6eef7", borderRadius:12, padding:8}}>
      <div style={{fontSize:12, opacity:.7, marginBottom:4}}>{id}</div>
      <div ref={wrapRef}/>
    </div>
  );
}
