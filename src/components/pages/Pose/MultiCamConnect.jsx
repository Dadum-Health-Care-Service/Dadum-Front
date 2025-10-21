import { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import QRCode from "qrcode";

/** 퍼블릭 PeerJS 서버로 피어 열기 */
async function openPeer() {
  const peer = new Peer(undefined, {
    host: "0.peerjs.com",
    port: 443,
    secure: true,
    path: "/",
    pingInterval: 10000,
    debug: 0,
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ],
    },
  });
  await new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error("Peer timeout")), 8000);
    peer.on("open", () => { clearTimeout(to); res(); });
    peer.on("error", (e) => { clearTimeout(to); rej(e); });
  });
  return peer;
}

/**
 * props:
 *  - onAddStream(stream, id)
 *  - onRemoveStream(id)
 */
export default function MultiCamConnect({ onAddStream, onRemoveStream }) {
  const [role, setRole] = useState(() =>
    new URLSearchParams(location.search).get("role") === "second" ? "second" : "host"
  );
  const [hostId, setHostId] = useState(() => new URLSearchParams(location.search).get("host") || "");
  const [peerId, setPeerId] = useState("");
  const [status, setStatus] = useState("대기 중");
  const [qr, setQr] = useState("");
  const [lens, setLens] = useState("user"); // 'user' | 'environment'

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const callsRef = useRef(new Map());

  function mkUrl(id) {
    const u = new URL(location.href);
    u.searchParams.set("role", "second");
    u.searchParams.set("host", id);
    return u.toString();
  }

  function safeCleanupCall(id, call) {
    try { call?.close?.(); } catch {}
    try { onRemoveStream?.(id); } catch {}
    callsRef.current.delete(id);
  }

  async function startHost() {
    setStatus("호스트 시작 중...");
    try {
      const peer = await openPeer();
      peerRef.current = peer;
      setPeerId(peer.id);
      setStatus(`호스트 준비: ${peer.id}`);

      peer.on("call", (call) => {
        setStatus(`수신: ${call.peer}`);
        call.answer();
        callsRef.current.set(call.peer, call);

        const id = call.peer;
        const cleanup = () => safeCleanupCall(id, call);

        call.on("stream", (remote) => {
          onAddStream?.(remote, id);

          // 끊김 자동 정리 + 워치독
          remote.addEventListener?.("inactive", cleanup);
          remote.getTracks?.().forEach(t => t.addEventListener("ended", cleanup));
          let lastAlive = Date.now();
          let timer = setTimeout(function tick() {
            if (Date.now() - lastAlive > 5000) { cleanup(); return; }
            timer = setTimeout(tick, 2500);
          }, 2500);
          remote.getVideoTracks?.().forEach(tr => { tr.onunmute = () => { lastAlive = Date.now(); }; });

          call.on("close", () => { clearTimeout(timer); cleanup(); });
          call.on("error", () => { clearTimeout(timer); cleanup(); });
        });

        call.on("close", cleanup);
        call.on("error", cleanup);
      });

      setQr(await QRCode.toDataURL(mkUrl(peer.id), { width: 220, margin: 1 }));
    } catch (e) {
      console.error(e);
      setStatus("호스트 실패");
    }
  }

  async function startSecond() {
    if (!hostId) { setStatus("Host ID 필요"); return; }
    setStatus("세컨드 시작 중...");
    try {
      const peer = await openPeer();
      peerRef.current = peer;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: lens }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      localStreamRef.current = stream;

      const call = peer.call(hostId, stream);
      callsRef.current.set(hostId, call);

      const cleanup = () => safeCleanupCall(hostId, call);
      call.on("close", cleanup);
      call.on("error", cleanup);

      setStatus(`세컨드 연결됨 → ${hostId}`);
    } catch (e) {
      console.error(e);
      setStatus("세컨드 실패");
    }
  }

  function stopAll() {
    setStatus("연결 종료");
    for (const [id, call] of callsRef.current.entries()) {
      try { call.close(); } catch {}
      onRemoveStream?.(id);
    }
    callsRef.current.clear();
    try { localStreamRef.current?.getTracks?.().forEach(t=>t.stop()); } catch {}
    localStreamRef.current = null;
    try { peerRef.current?.destroy?.(); } catch {}
    peerRef.current = null;
    setPeerId(""); setQr("");
  }

  useEffect(() => {
    if (role === "second" && hostId) startSecond();
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="card">
      <h2 className="card__title">멀티카메라 연결</h2>

      <div style={{display:"flex", gap:8, marginBottom:8}}>
        <button className={`btn ${role==='host'?'btn-primary':''}`} onClick={()=>setRole('host')}>Host</button>
        <button className={`btn ${role==='second'?'btn-primary':''}`} onClick={()=>setRole('second')}>Second</button>
      </div>

      {role === "host" ? (
        <div style={{display:"grid", gap:10}}>
          {!peerId ? (
            <button className="btn btn-secondary" onClick={startHost}>호스트 시작</button>
          ) : (
            <>
              <div style={{fontSize:13, opacity:.8}}>Host ID</div>
              <div style={{fontWeight:700}}>{peerId}</div>

              {qr && (
                <div style={{display:"flex", alignItems:"center", gap:12}}>
                  <img src={qr} alt="QR" width={120} height={120}/>
                  <div style={{fontSize:12, opacity:.8, wordBreak:"break-all"}}>
                    다른 기기에서 QR 스캔 또는 링크 열기
                    <br/><code>{mkUrl(peerId)}</code>
                  </div>
                </div>
              )}
              <button className="btn btn-secondary" onClick={stopAll}>모든 연결 해제</button>
            </>
          )}
        </div>
      ) : (
        <div>
          <div style={{display:"grid", gap:6, marginBottom:8}}>
            <label style={{fontSize:13, opacity:.8}}>Host ID</label>
            <input
              value={hostId}
              onChange={(e)=>setHostId(e.target.value)}
              placeholder="예: abcd1234"
              style={{padding:"8px 10px", border:"1px solid #e6eef7", borderRadius:8}}
            />
          </div>

          <div style={{display:"grid", gap:6, marginBottom:8}}>
            <label style={{fontSize:13, opacity:.8}}>렌즈</label>
            <select className="pill-select" value={lens} onChange={(e)=>setLens(e.target.value)} style={{maxWidth:240}}>
              <option value="user">전면(셀피)</option>
              <option value="environment">후면</option>
            </select>
          </div>

          <div style={{display:"flex", gap:8}}>
            <button className="btn btn-primary" onClick={startSecond}>세컨드 시작</button>
            <button className="btn btn-secondary" onClick={stopAll}>종료</button>
          </div>
        </div>
      )}

      <div style={{marginTop:10, fontSize:12, opacity:.7}}>상태: {status}</div>
    </section>
  );
}
