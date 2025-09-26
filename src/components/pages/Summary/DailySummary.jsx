// src/pages/DailySummary.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";

/**
 *  전역 axios 설정
 * - 스프링 루틴/쿠키 인증을 쓰는 경우 필요한 옵션
 * - 필요 없으면 이 줄 삭제해도 됩니다.
 */
axios.defaults.withCredentials = true;

/**
 *  ML 서버 베이스
 * - dev: Vite 프록시를 이용해 /ml → 127.0.0.1:8000 로 라우팅
 * - prod: VITE_API_URL 환경변수 사용
 */
const ML_BASE = import.meta.env.VITE_API_URL || "/ml";
const SUMMARY_MODEL = import.meta.env.VITE_SUMMARY_MODEL || "llm"; 

/**
 *  ML 서버에서 쓰는 user_id (식단 저장용)
 * - 로그인 연동 전까지는 임시로 demo 사용
 */
const USER_ID = "demo";

/* ----------------- 유틸 ----------------- */
const fmtDate = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/* -----------------  더미 유저 하드코딩 유틸 -----------------
 * - 이미 localStorage에 값이 있으면 그대로 둠 (덮어쓰지 않음)
 */
const ensureDummyUser = () => {
  const DUMMY_USERS_ID = "21";             
  const DUMMY_EMAIL   = "test@test.com";   

  if (!localStorage.getItem("usersId") && DUMMY_USERS_ID) {
    localStorage.setItem("usersId", DUMMY_USERS_ID);
  }
  if (!localStorage.getItem("email") && DUMMY_EMAIL) {
    localStorage.setItem("email", DUMMY_EMAIL);
  }
};


/* -----------------  백엔드 응답 → 화면용 정규화 -----------------
 * 백엔드가 stepData/heartRateData/distanceWalked 등으로 내려줄 때
 * 화면에서 쓰는 키(recordTime, steps, caloriesKcal, distanceKm, heartRateAvg, id)로 변환
 */
const normalizeHealthItems = (rawArr = [], usersIdForKey = "u") => {
  if (!Array.isArray(rawArr)) return [];

  return rawArr.map((x, idx) => {
    // steps: 배열 합 or 단일 값
    const steps = Array.isArray(x.stepData)
      ? x.stepData.reduce((a, b) => a + Number(b || 0), 0)
      : Number(x.steps ?? 0);

    // 심박: 배열 평균 or 단일 값
    const hrArr = Array.isArray(x.heartRateData) ? x.heartRateData : [];
    const heartRateAvg = hrArr.length
      ? Math.round(
          hrArr.reduce((a, b) => a + Number(b?.bpm || 0), 0) / hrArr.length
        )
      : Number(x.heartRateAvg ?? 0);

    // 기록 시각: 심박 첫 타임스탬프 or 기존 값
    const recordTime = hrArr[0]?.time || x.recordTime || null;

    // 칼로리/거리: 다양한 키 대응
    const caloriesKcal = Number(
      x.caloriesBurnedData ?? x.activeCaloriesBurned ?? x.calories ?? 0
    );
    const distanceKm = Number(x.distanceWalked ?? x.distanceKm ?? 0);

    // React key 경고 방지용 id
    const id =
      x.id ??
      (recordTime ? `${usersIdForKey}-${recordTime}-${idx}` : `${usersIdForKey}-${idx}`);

    return {
      id,
      recordTime,
      steps,
      caloriesKcal,
      distanceKm,
      heartRateAvg,
      _raw: x,
    };
  });
};


/* ----------------- 컴포넌트 ----------------- */
export default function DailySummary() {
  // 날짜/요약/합계/목록
  const [date, setDate] = useState(() => fmtDate(new Date()));
  const [totals, setTotals] = useState({
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
  });
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  // 편집 상태
  const [editGrams, setEditGrams] = useState({});
  const [editLabel, setEditLabel] = useState({});

  // 문장 요약/모델
  const [dailyText, setDailyText] = useState("");
  const [summaryModel, setSummaryModel] = useState("");

  // 건강지표 요약 텍스트
  const [healthHint, setHealthHint] = useState("");

  // STS(스프링) 쪽 usersId (워치/건강데이터용)
  const [usersId, setUsersId] = useState("");
  const [healthItems, setHealthItems] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  /* ---------- helpers ---------- */
  const findById = (id) => meals.find((m) => m.id === id) || {};

  // 워치 데이터를 LLM 분석용으로 정리
  const prepareWatchDataForLLM = (items = []) => {
    if (!items || items.length === 0) return null;
    
    // 최근 데이터 집계
    const totalSteps = items.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const totalCalories = items.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0);
    const totalDistance = items.reduce((sum, item) => sum + Number(item.distanceKm || 0), 0);
    
    // 심박수 평균 계산
    const heartRates = items
      .map(item => Number(item.heartRateAvg || 0))
      .filter(hr => hr > 0);
    const avgHeartRate = heartRates.length > 0 
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : 0;
    
    // 최신 기록 시간
    const latestRecord = items[0]?.recordTime ? new Date(items[0].recordTime).toLocaleString() : null;
    
    return {
      totalSteps,
      totalCalories,
      totalDistance,
      avgHeartRate,
      latestRecord,
      dataCount: items.length,
      // LLM이 이해하기 쉬운 형태로 변환
      summary: `오늘 총 걸음수: ${totalSteps.toLocaleString()}보, 소모 칼로리: ${totalCalories}kcal, 이동거리: ${totalDistance.toFixed(1)}km, 평균 심박수: ${avgHeartRate}bpm`
    };
  };

  /* ---------- STS에서 usersId 읽기 ---------- */
  /**
   * 아래 엔드포인트는 예시입니다.
   * 실제 사용하는 스프링 API로 바꿔주세요.
   *   - 예시1) /api/v1/users/me  (현재 로그인 유저)
   *   - 예시2) /api/v1/health/{username 또는 usersId}
   *
   * Vite 프록시를 쓰고 있다면 'http://localhost:8080' 대신
   * 프론트에서 '/api/...'로 호출해도 됩니다.
   */
  const fetchUsersIdFromSTS = async () => {
    try {
      const savedEmail =
        localStorage.getItem("usersEmail") || localStorage.getItem("email");
      if (savedEmail) {
        const res = await axios.get(
          `/api/v1/users/email/${encodeURIComponent(savedEmail)}`
        );
        console.log("[STS users email] res:", res); // 사용자 응답 전체 확인
        const id = res?.data?.usersId ?? res?.data?.id; // DTO 키가 usersId
        if (id) {
          setUsersId(String(id));
          return String(id);
        }
      }
    } catch (e) {
      console.warn("usersId 조회 실패:", e?.response?.data || e.message);
    }
    // 이메일이 없거나 조회 실패 시 빈 문자열 반환(데모 호출로 인한 401 회피)
    setUsersId("");
    return "";
  };

  // Dadum-Back에서 건강데이터 바로 불러오기(프록시 사용)
  const fetchHealthDirect = async (id) => {
    if (!id) return;
    try {
      const res = await axios.get(`/api/v1/health/${id}`);
      console.log(res)
      const arr = Array.isArray(res.data) ? res.data : [];
      // [ADD] 백엔드 스키마를 화면용으로 정규화 (가능하면 정규화 사용, 아니면 원본 유지)
      const normalized = normalizeHealthItems(arr, String(id));
      setHealthItems(normalized.length ? normalized : arr); // [ADD]
    } catch (e) {
      console.warn("health GET 실패:", e?.response?.data || e.message);
      setHealthItems([]);
    }
  };

  // 직접 배열을 반환하는 raw fetch (요약 생성 시 동기 계산용)
  const fetchHealthRaw = async (id) => {
    if (!id) return [];
    try {
      const res = await axios.get(`/api/v1/health/${id}`);
      const arr = Array.isArray(res.data) ? res.data : [];
      //  요약 계산도 정규화된 데이터를 사용
      const normalized = normalizeHealthItems(arr, String(id));
      return normalized.length ? normalized : arr; // [ADD]
    } catch (e) {
      console.warn("health GET 실패:", e?.response?.data || e.message);
      return [];
    }
  };


  // 워치 정보 표시: usersId 해석 → 워치 데이터 조회 → 워치 정보 열기
  const handleShowDetails = async () => {
    let id = usersId || localStorage.getItem("usersId");
    if (!id) {
      id = await fetchUsersIdFromSTS();
    }
    if (!id) {
      alert("사용자 ID를 찾을 수 없습니다. 로그인 또는 이메일 저장을 확인하세요.");
      return;
    }
    setUsersId(String(id));
    await fetchHealthDirect(id); // 워치 데이터만 조회
    setShowDetails(true);
  };

  /* ---------- ML: 하루 합계/목록 불러오기 ---------- */
  const loadDaily = async (d) => {
    setLoading(true);
    try {
      const res = await fetch(`${ML_BASE}/summary/daily?user_id=${USER_ID}&date=${d}`);
      const j = await res.json();
      if (res.ok) {
        setTotals(
          j.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
        );
        setMeals(j.meals || []);
        setEditGrams({});
        setEditLabel({});
        setDailyText("");
        setSummaryModel("");
        setHealthHint("");
      } else {
        console.error("daily load 실패:", j);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ----------  더미 유저 자동 세팅 ---------- */
  useEffect(() => {
    ensureDummyUser();
  }, []);
  

  /* ---------- 최초 로딩 ---------- */
  useEffect(() => {
    (async () => {
      // 1) localStorage에 usersId가 있으면 우선 사용
      const storedId = localStorage.getItem("usersId");
      if (storedId) {
        setUsersId(String(storedId));
      } else {
        // 2) 없으면 이메일로 조회 시도
        const id = await fetchUsersIdFromSTS();
        console.log("확정 usersId:", id);
        if (id) {
          setUsersId(id);
        }
      }
      await loadDaily(fmtDate(new Date()));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- 날짜 변경 시 재로딩 ---------- */
  useEffect(() => {
    loadDaily(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  // usersId 바뀌면 건강데이터 재조회
  useEffect(() => {
    fetchHealthDirect(usersId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usersId]);

  /* ---------- 행 저장(이름+중량 동시) ---------- */
  const saveRow = async (mealId) => {
    const prev = findById(mealId);
    const nextGrams = Number(editGrams[mealId] ?? prev.grams);

    const nextLabelRaw = (editLabel[mealId] ?? prev.label) || "";
    const nextLabel = String(nextLabelRaw).trim();

    if (!Number.isFinite(nextGrams) || nextGrams <= 0) return;

    const body = {
      grams: nextGrams,
      ...(nextLabel && nextLabel !== prev.label ? { label: nextLabel } : {}),
    };

    const res = await fetch(`${ML_BASE}/meal-log/${mealId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (res.ok) {
      setMeals((arr) => arr.map((m) => (m.id === mealId ? data : m)));
      setTotals((t) => ({
        calories: t.calories - (prev.calories || 0) + data.calories,
        protein_g: t.protein_g - (prev.protein_g || 0) + data.protein_g,
        carbs_g: t.carbs_g - (prev.carbs_g || 0) + data.carbs_g,
        fat_g: t.fat_g - (prev.fat_g || 0) + data.fat_g,
        fiber_g: t.fiber_g - (prev.fiber_g || 0) + data.fiber_g,
      }));
      setDailyText(""); // 수정 후 다시 생성하도록 비움
      setSummaryModel("");
      setHealthHint("");
    } else {
      alert(`저장 실패: ${data?.detail || res.statusText}`);
    }
  };

  /* ---------- 행 삭제 ---------- */
  const deleteRow = async (mealId) => {
    const prev = findById(mealId);
    if (!prev?.id) return;
    if (!confirm("이 항목을 삭제할까요?")) return;

    const res = await fetch(`${ML_BASE}/meal-log/${mealId}`, { method: "DELETE" });
    const data = await res.json();

    if (res.ok) {
      setMeals((arr) => arr.filter((m) => m.id !== mealId));
      setTotals((t) => ({
        calories: t.calories - (prev.calories || 0),
        protein_g: t.protein_g - (prev.protein_g || 0),
        carbs_g: t.carbs_g - (prev.carbs_g || 0),
        fat_g: t.fat_g - (prev.fat_g || 0),
        fiber_g: t.fiber_g - (prev.fiber_g || 0),
      }));
      setDailyText(""); // 다시 생성하도록
      setSummaryModel("");
      setHealthHint("");
    } else {
      alert(`삭제 실패: ${data?.detail || res.statusText}`);
    }
  };

  /* ---------- 요약 생성(식단 + 워치 데이터 통합 분석) ---------- */
  const generateSummary = async () => {
    setDailyText("요약 생성 중…");
    setSummaryModel("");
    setHealthHint("");
    try {
      // 0) 최신 워치 데이터 동기화: usersId 우선 결정 → 백엔드에서 직접 조회
      let id = usersId || localStorage.getItem("usersId");
      if (!id) {
        id = await fetchUsersIdFromSTS();
      }
      let latestHealthItems = [];
      if (id) {
        latestHealthItems = await fetchHealthRaw(id);
        setHealthItems(latestHealthItems);
      }

      // 1) 워치 데이터를 LLM 분석용으로 준비
      const watchData = prepareWatchDataForLLM(latestHealthItems);
      
      // 2) 식단 + 워치 데이터 통합 요약(ML)
      const res = await fetch(`${ML_BASE}/summary/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          date,
          model: SUMMARY_MODEL,
          use_llm: SUMMARY_MODEL === "llm",
          // 워치 데이터 추가
          watch_data: watchData,
          include_exercise_recommendation: true,
        }),
      });
      const j = await res.json();
      let comprehensiveSummary = "";
      let modelUsed = "";

      if (res.ok) {
        comprehensiveSummary = j.summary || "";
        modelUsed = j.model_used || "";
      } else {
        comprehensiveSummary = `요약 생성 실패: ${j?.detail || res.statusText}`;
      }

      // 3) 워치 데이터 요약 표시
      const healthSummary = watchData ? watchData.summary : "";
      setHealthHint(healthSummary);

      // 4) 최종 결과 표시
      setDailyText(comprehensiveSummary || "요약이 없습니다.");
      setSummaryModel(modelUsed);
    } catch (e) {
      setDailyText(`요약 생성 실패: ${e.message}`);
    }
  };

  /* ---------- UI ---------- */
  const Card = ({ title, value, unit }) => (
    <div className="card shadow-sm h-100">
      <div className="card-body py-2 py-md-3">
        <div className="text-muted small mb-1">{title}</div>
        <div className="fw-bold d-flex align-items-center justify-content-center" style={{ fontSize: "clamp(16px, 4vw, 20px)" }}>
          <span>{value}</span>
          <span className="ms-1">{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container py-4">
      {/* 날짜 바 */}
      <div className="d-flex align-items-center mb-3 gap-2">
        <button
          className="btn btn-light border"
          onClick={() => setDate(fmtDate(addDays(new Date(date), -1)))}
        >
          ← 이전
        </button>
        <input
          type="date"
          className="form-control"
          style={{ width: 180 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="btn btn-light border"
          onClick={() => setDate(fmtDate(addDays(new Date(date), +1)))}
        >
          다음 →
        </button>
        <button
          className="btn btn-outline-secondary ms-2"
          onClick={() => setDate(fmtDate(new Date()))}
        >
          오늘
        </button>
      </div>

      {/* 하루 종합 분석 (문장) */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0 fw-semibold text-dark">하루 종합 분석</h4>
        </div>
        <div className="d-flex flex-column flex-md-row gap-2">
          <ButtonComponent
            variant="primary"
            size="large"
            className="flex-fill"
            onClick={generateSummary}
          >
            요약 생성
          </ButtonComponent>
          <ButtonComponent
            variant="primary"
            size="large"
            className="flex-fill"
            onClick={handleShowDetails}
          >
            내 워치정보
          </ButtonComponent>
        </div>
      </div>
      <div className="mb-4">
        {healthItems.length > 0 && (
          <div className="small text-muted mb-2">
            건강데이터 {healthItems.length}건 수신됨
          </div>
        )}
        {healthHint && (
          <div className="small text-success mb-1">건강지표: {healthHint}</div>
        )}
        <div
          className="p-3 bg-light rounded"
          style={{ 
            whiteSpace: "pre-wrap", 
            fontSize: "clamp(14px, 4vw, 16px)", 
            lineHeight: 1.6, 
            color: "#111827",
            minHeight: "60px"
          }}
        >
          {dailyText || "요약이 없습니다."}
        </div>
      </div>

      {/* 합계 카드 */}
      <div className="row g-2 g-md-3">
        <div className="col-6 col-md">
          <Card title="칼로리" value={totals.calories} unit="kcal" />
        </div>
        <div className="col-6 col-md">
          <Card title="단백질" value={totals.protein_g} unit="g" />
        </div>
        <div className="col-6 col-md">
          <Card title="탄수화물" value={totals.carbs_g} unit="g" />
        </div>
        <div className="col-6 col-md">
          <Card title="지방" value={totals.fat_g} unit="g" />
        </div>
        <div className="col-6 col-md">
          <Card title="식이섬유" value={totals.fiber_g} unit="g" />
        </div>
      </div>

      {/* 워치 정보 패널 */}
      {showDetails && (
        <div className="card shadow-sm mb-3">
          <div className="card-body">
            <h6 className="fw-semibold mb-3">내 워치 정보</h6>
            <div className="row g-2 g-md-3">
              <div className="col-12 col-md-6">
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold mb-2">오늘의 활동</div>
                  {healthItems && healthItems.length > 0 ? (
                    <ul className="mb-0 small">
                      <li>총 걸음수: {
                        (() => {
                          const sum = healthItems.map(h => Number(h.steps || 0)).reduce((a,b)=>a+b,0);
                          return sum.toLocaleString();
                        })()
                      } 보</li>
                      <li>소모 칼로리: {
                        (() => {
                          const sum = healthItems.map(h => Number(h.caloriesKcal || 0)).reduce((a,b)=>a+b,0);
                          return `${sum} kcal`;
                        })()
                      }</li>
                      <li>이동 거리: {
                        (() => {
                          const sum = healthItems.map(h => Number(h.distanceKm || 0)).reduce((a,b)=>a+b,0);
                          return `${sum.toFixed(1)} km`;
                        })()
                      }</li>
                      <li>평균 심박수: {
                        (() => {
                          const vals = healthItems.map(h => Number(h.heartRateAvg || 0)).filter(n => n > 0);
                          if (!vals.length) return "-";
                          const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
                          return `${avg} bpm`;
                        })()
                      }</li>
                    </ul>
                  ) : (
                    <div className="text-muted small">워치 데이터를 불러오지 못했습니다.</div>
                  )}
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="border rounded p-3 h-100">
                  <div className="fw-semibold mb-2">데이터 정보</div>
                  {healthItems && healthItems.length > 0 ? (
                    <ul className="mb-0 small">
                      <li>총 수신 항목: {healthItems.length}건</li>
                      <li>
                        최신 기록: {healthItems[0]?.recordTime ? new Date(healthItems[0].recordTime).toLocaleString() : "-"}
                      </li>
                      <li>데이터 상태: 정상 수신</li>
                      <li>동기화 시간: {new Date().toLocaleString()}</li>
                    </ul>
                  ) : (
                    <div className="text-muted small">워치 데이터를 불러오지 못했습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 식사 테이블 */}
      <div className="card shadow-sm">
        <div className="card-body">
          {/* 워치/건강 데이터 간단 리스트 */}
          <div className="mb-4">
            <h6 className="fw-semibold mb-2">워치 데이터(백엔드 GET 확인용)</h6>
            {healthItems.length === 0 ? (
              <div className="text-muted small">데이터가 없습니다.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>기록시각</th>
                      <th>걸음수</th>
                      <th>칼로리(kcal)</th>
                      <th>거리(km)</th>
                      <th>평균심박</th>
                    </tr>
                  </thead>
                  <tbody>
                    {healthItems.slice(0, 20).map((h) => (
                      <tr key={h.id}>
                        <td>{h.recordTime ? new Date(h.recordTime).toLocaleString() : "-"}</td>
                        <td>{h.steps ?? "-"}</td>
                        <td>{h.caloriesKcal ?? "-"}</td>
                        <td>{h.distanceKm ?? "-"}</td>
                        <td>{h.heartRateAvg ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 90  }}>시간</th>
                  <th style={{ width: 220 }}>음식</th>
                  <th style={{ width: 130 }}>중량(g)</th>
                  <th>칼로리(kcal)</th>
                  <th>단백질(g)</th>
                  <th>탄수화물(g)</th>
                  <th>지방(g)</th>
                  <th>식이섬유(g)</th>
                  <th style={{ width: 150 }} />
                </tr>
              </thead>
              <tbody>
                {meals.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      기록이 없습니다.
                    </td>
                  </tr>
                )}
                {meals.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ maxWidth: 220 }}>
                      <input
                        type="text"
                        className="form-control text-capitalize"
                        value={editLabel[m.id] ?? m.label ?? ""}
                        onChange={(e) =>
                          setEditLabel((s) => ({ ...s, [m.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && saveRow(m.id)}
                      />
                    </td>
                    <td style={{ maxWidth: 130 }}>
                      <input
                        type="number"
                        className="form-control"
                        min={1}
                        step={10}
                        value={editGrams[m.id] ?? m.grams}
                        onChange={(e) =>
                          setEditGrams((s) => ({ ...s, [m.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && saveRow(m.id)}
                      />
                    </td>
                    <td>{m.calories}</td>
                    <td>{m.protein_g}</td>
                    <td>{m.carbs_g}</td>
                    <td>{m.fat_g}</td>
                    <td>{m.fiber_g}</td>
                    <td className="d-flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={() => saveRow(m.id)}>
                        저장
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => deleteRow(m.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {loading && <div className="text-muted small mt-2">불러오는 중…</div>}
          </div>
        </div>
      </div>
    </div>
  );
}