// src/pages/DailySummary.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import ButtonComponent from "../../common/ButtonComponent";
import "./DailySummary.css";

/**
 *  전역 axios 설정
 * - 스프링 세션/쿠키 인증을 쓰는 경우 필요한 옵션
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

  /* ---------- 프론트엔드 자체 분석 (API 호출 없이 종합 분석) ---------- */
  const generateLocalAnalysis = () => {
    // 1) 워치 데이터 분석
    const watchSummary = [];
    if (healthItems && healthItems.length > 0) {
      const totalSteps = healthItems.reduce((sum, item) => sum + Number(item.steps || 0), 0);
      const totalCaloriesBurned = healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0);
      const totalDistance = healthItems.reduce((sum, item) => sum + Number(item.distanceKm || 0), 0);
      
      const heartRates = healthItems
        .map(item => Number(item.heartRateAvg || 0))
        .filter(hr => hr > 0);
      const avgHeartRate = heartRates.length > 0 
        ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
        : 0;
      
      watchSummary.push(`• 걸음수: ${totalSteps.toLocaleString()}보`);
      watchSummary.push(`• 이동거리: ${totalDistance.toFixed(1)}km`);
      watchSummary.push(`• 소모 칼로리: ${totalCaloriesBurned}kcal`);
      if (avgHeartRate > 0) {
        watchSummary.push(`• 평균 심박수: ${avgHeartRate}bpm`);
      }
    }
    
    // 2) 식단 데이터 분석
    const mealSummary = [];
    if (meals && meals.length > 0) {
      mealSummary.push(`• 총 ${meals.length}끼 식사 기록`);
      mealSummary.push(`• 섭취 칼로리: ${totals.calories}kcal`);
      mealSummary.push(`• 단백질: ${totals.protein_g}g | 탄수화물: ${totals.carbs_g}g | 지방: ${totals.fat_g}g`);
      
      // 칼로리 수지 분석
      if (healthItems && healthItems.length > 0) {
        const burned = healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0);
        const balance = totals.calories - burned;
        const balanceText = balance > 0 ? `+${balance}` : `${balance}`;
        mealSummary.push(`• 칼로리 수지: ${balanceText}kcal (섭취 - 소모)`);
      }
    } else {
      mealSummary.push("• 아직 등록된 식사가 없습니다.");
    }
    
    // 3) 건강 조언 생성 (규칙 기반)
    const advice = [];
    
    // 활동량 평가
    if (healthItems && healthItems.length > 0) {
      const totalSteps = healthItems.reduce((sum, item) => sum + Number(item.steps || 0), 0);
      if (totalSteps < 5000) {
        advice.push("오늘 활동량이 부족합니다. 가벼운 산책이나 스트레칭을 추천합니다.");
      } else if (totalSteps >= 10000) {
        advice.push("훌륭합니다! 오늘 활동량 목표를 달성했습니다.");
      } else {
        advice.push("적당한 활동량을 유지하고 있습니다. 조금만 더 움직이면 1만보 달성입니다.");
      }
    }
    
    // 영양 균형 평가
    if (meals && meals.length > 0) {
      const proteinRatio = (totals.protein_g * 4) / Math.max(1, totals.calories) * 100;
      const carbsRatio = (totals.carbs_g * 4) / Math.max(1, totals.calories) * 100;
      const fatRatio = (totals.fat_g * 9) / Math.max(1, totals.calories) * 100;
      
      if (proteinRatio < 15) {
        advice.push("단백질이 부족합니다. 달걀, 두부, 살코기 섭취를 늘려보세요.");
      }
      if (totals.fiber_g < 15) {
        advice.push("식이섬유가 부족합니다. 샐러드, 과일, 통곡물을 더 드세요.");
      }
      if (carbsRatio > 70) {
        advice.push("탄수화물 비중이 높습니다. 단백질과 채소를 늘려 균형을 맞추세요.");
      }
      if (fatRatio > 35) {
        advice.push("지방 비중이 높습니다. 튀김이나 기름진 음식을 줄여보세요.");
      }
      
      // 칼로리 수지 평가
      if (healthItems && healthItems.length > 0) {
        const burned = healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0);
        const balance = totals.calories - burned;
        if (balance > 500) {
          advice.push("섭취 칼로리가 소모량보다 많습니다. 활동량을 늘리거나 식사량을 조절하세요.");
        } else if (balance < -500) {
          advice.push("소모 칼로리가 섭취량보다 많습니다. 충분한 영양 섭취에 유의하세요.");
        }
      }
    }
    
    // 전반적인 평가가 없으면 긍정 메시지
    if (advice.length === 0) {
      advice.push("오늘 하루 영양과 활동량의 균형이 좋습니다. 계속 유지하세요.");
    }
    
    return {
      watchSummary: watchSummary.join('\n'),
      mealSummary: mealSummary.join('\n'),
      advice: advice.join('\n\n')
    };
  };

  /* ---------- 요약 생성 (LLM 우선, 실패 시 로컬 분석) ---------- */
  const generateSummary = async () => {
    setDailyText("분석 중…");
    setSummaryModel("");
    setHealthHint("");
    
    try {
      // usersId 확인 및 워치 데이터 최신화
      let id = usersId || localStorage.getItem("usersId");
      if (!id) {
        id = await fetchUsersIdFromSTS();
      }
      
      if (id) {
        const latestHealthItems = await fetchHealthRaw(id);
        setHealthItems(latestHealthItems);

        // LLM 요약 시도
        const watchData = prepareWatchDataForLLM(latestHealthItems);
        try {
          const res = await fetch(`${ML_BASE}/summary/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: USER_ID,
              date,
              model: SUMMARY_MODEL,
              use_llm: SUMMARY_MODEL === "llm",
              watch_data: watchData,
              include_exercise_recommendation: true,
            }),
          });
          const j = await res.json();
          if (res.ok && (j.summary || j.summary === "")) {
            setDailyText(j.summary || "");
            setSummaryModel(j.model_used || "llm");
            setHealthHint(watchData ? watchData.summary : "");
            return; // LLM 결과 사용 완료
          }
        } catch (e) {
          console.warn("LLM 요약 실패, 로컬 분석으로 대체", e);
        }
      }
      
      // 잠시 대기 (데이터 업데이트 반영)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 프론트엔드 자체 분석 수행
      const analysis = generateLocalAnalysis();
      
      // 결과 조합 (AI 섹션은 조언만 표시)
      const fullSummary = analysis.advice || "";
      
      setDailyText(fullSummary);
      setHealthHint(analysis.watchSummary);
      setSummaryModel("local-analysis");
      
    } catch (e) {
      console.error("분석 실패:", e);
      setDailyText(`분석 중 오류가 발생했습니다: ${e.message}`);
    }
  };

  /* ---------- UI ---------- */
  // 영양소 비율 계산
  const calculateNutritionRatios = () => {
    if (!totals || totals.calories === 0) return null;
    
    const proteinCal = totals.protein_g * 4;
    const carbsCal = totals.carbs_g * 4;
    const fatCal = totals.fat_g * 9;
    const totalCal = proteinCal + carbsCal + fatCal || 1;
    
    return {
      protein: Math.round((proteinCal / totalCal) * 100),
      carbs: Math.round((carbsCal / totalCal) * 100),
      fat: Math.round((fatCal / totalCal) * 100),
    };
  };

  const ratios = calculateNutritionRatios();

  // 활동량 계산
  const calculateActivityStats = () => {
    if (!healthItems || healthItems.length === 0) return null;
    
    const totalSteps = healthItems.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const totalCaloriesBurned = healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0);
    const totalDistance = healthItems.reduce((sum, item) => sum + Number(item.distanceKm || 0), 0);
    const heartRates = healthItems.map(item => Number(item.heartRateAvg || 0)).filter(hr => hr > 0);
    const avgHeartRate = heartRates.length > 0 
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : 0;
    
    return {
      totalSteps,
      totalCaloriesBurned,
      totalDistance,
      avgHeartRate,
      stepsGoal: 10000,
      stepsProgress: Math.min(100, (totalSteps / 10000) * 100),
    };
  };

  const activityStats = calculateActivityStats();
  const calorieBalance = activityStats ? totals.calories - activityStats.totalCaloriesBurned : 0;

  // 하이라이트 인사이트(칩) 생성
  const buildInsightChips = () => {
    const chips = [];
    if (activityStats) {
      if (activityStats.totalSteps >= 10000) chips.push({ text: "목표 달성", tone: "good" });
      else if (activityStats.totalSteps < 5000) chips.push({ text: "활동량 낮음", tone: "warn" });
    }

    if (totals && totals.calories > 0) {
      const proteinRatio = (totals.protein_g * 4) / Math.max(1, totals.calories) * 100;
      const carbsRatio = (totals.carbs_g * 4) / Math.max(1, totals.calories) * 100;
      const fatRatio = (totals.fat_g * 9) / Math.max(1, totals.calories) * 100;
      if (proteinRatio < 15) chips.push({ text: "단백질 보강", tone: "warn" });
      if (totals.fiber_g < 15) chips.push({ text: "식이섬유 부족", tone: "warn" });
      if (carbsRatio > 70) chips.push({ text: "탄수화물 과다", tone: "warn" });
      if (fatRatio > 35) chips.push({ text: "지방 과다", tone: "warn" });
    }

    if (activityStats) {
      if (calorieBalance > 0) chips.push({ text: `+${calorieBalance}kcal`, tone: "warn" });
      if (calorieBalance < -200) chips.push({ text: `${calorieBalance}kcal`, tone: "good" });
    }
    return chips.slice(0, 4);
  };

  // 분석 텍스트 정리: 줄단위 → 불릿 목록
  const toBulletedLines = (text) => {
    if (!text) return [];
    return String(text)
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  // 건강 조언 가시성 톤 분류
  const adviceTone = (line) => {
    const warnKeys = ["부족", "높", "위험", "주의", "줄이", "증가", "과다", "불균형", "부담", "초과"];
    const goodKeys = ["유지", "좋", "적정", "안정", "달성", "양호", "괜찮"];
    const has = (arr) => arr.some((k) => line.includes(k));
    if (has(warnKeys)) return "warning";
    if (has(goodKeys)) return "success";
    return "";
  };

  // 활동 현황 칩
  const buildActivityChips = () => {
    if (!activityStats) return [];
    const chips = [];
    chips.push({ label: "걸음수", value: activityStats.totalSteps.toLocaleString()+"보" });
    chips.push({ label: "이동거리", value: activityStats.totalDistance.toFixed(1)+"km" });
    chips.push({ label: "소모 칼로리", value: `${activityStats.totalCaloriesBurned}kcal` });
    if (activityStats.avgHeartRate) chips.push({ label: "평균 심박", value: `${activityStats.avgHeartRate}bpm` });
    return chips;
  };

  // 운동 추천(간단 휴리스틱)
  const buildExerciseRecommendations = () => {
    const rec = [];
    if (activityStats) {
      if (activityStats.totalSteps < 6000) rec.push("빠른 걷기 30분 또는 가벼운 조깅 20분");
      else if (activityStats.totalSteps < 10000) rec.push("빠른 걷기 15분 + 스트레칭 10분");
      else rec.push("휴식 겸 스트레칭 10분, 가벼운 코어 운동 10분");
    }
    if (ratios) {
      if (ratios.protein < 15) rec.push("상/하체 근력운동 20분 (스쿼트·푸시업·플랭크)");
      if (ratios.fat > 35) rec.push("인터벌 자전거/런 15분으로 지질 대사 개선");
    }
    return rec.slice(0, 3);
  };

  // 식단 기반 리스크 힌트(간단 휴리스틱)
  const buildRiskHints = () => {
    const risk = [];
    if (totals) {
      const surplus = calorieBalance > 300;
      const lowFiber = totals.fiber_g < 15;
      const highFat = (totals.fat_g * 9) / Math.max(1, totals.calories) * 100 > 35;
      const highCarb = (totals.carbs_g * 4) / Math.max(1, totals.calories) * 100 > 70;
      if (surplus && highFat) risk.push("지방간/대사증후군 위험 증가 (칼로리·지방 과다)");
      if (highCarb && activityStats && activityStats.totalSteps < 6000) risk.push("인슐린 저항성 위험 (탄수화물 높고 활동량 낮음)");
      if (lowFiber) risk.push("변비/지질 이상 위험 (식이섬유 부족)");
    }
    return risk.slice(0, 3);
  };

  return (
    <div className="report-container">
      {/* 보고서 헤더 */}
      <div className="report-header">
        <h1>건강 종합 보고서</h1>
        <div className="date">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <button
              className="btn btn-light btn-sm"
              onClick={() => setDate(fmtDate(addDays(new Date(date), -1)))}
            >
              ← 이전
            </button>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 160 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              className="btn btn-light btn-sm"
              onClick={() => setDate(fmtDate(addDays(new Date(date), +1)))}
            >
              다음 →
            </button>
            <button
              className="btn btn-light btn-sm"
              onClick={() => setDate(fmtDate(new Date()))}
            >
              오늘
            </button>
          </div>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="report-actions">
        <ButtonComponent
          variant="primary"
          size="large"
          onClick={generateSummary}
        >
          종합 분석 생성
        </ButtonComponent>
        <ButtonComponent
          variant="outline"
          size="large"
          onClick={handleShowDetails}
        >
          상세 워치 정보
        </ButtonComponent>
      </div>

      {/* AI 분석 결과 */}
      {dailyText && dailyText !== "요약이 없습니다." && dailyText !== "분석 중…" && (
        <div className="report-section">
          <h2>AI 건강 분석 보고서</h2>
          {/* 인사이트 칩 */}
          <div className="insights">
            {buildInsightChips().map((c, idx) => (
              <span key={idx} className={`chip ${c.tone}`}>{c.text}</span>
            ))}
          </div>
          {/* 활동 현황 칩 */}
          {activityStats && (
            <>
              <div className="subttl">활동 현황</div>
              <div className="activity-chips">
                {buildActivityChips().map((a, i) => (
                  <div key={i} className="activity-chip">
                    <span className="label">{a.label}</span>
                    <span className="value">{a.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 운동 추천 */}
          {buildExerciseRecommendations().length > 0 && (
            <>
              <div className="subttl">운동 추천</div>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {buildExerciseRecommendations().map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {/* 리스크 힌트 */}
          {buildRiskHints().length > 0 && (
            <>
              <div className="subttl">건강 리스크 힌트</div>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {buildRiskHints().map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
          <div style={{ 
            whiteSpace: "pre-wrap", 
            lineHeight: 1.8, 
            color: "#2d3748",
            fontSize: "15px"
          }}>
            {/* 불릿으로 정리된 조언 (운동/리스크 톤과 유사하게 강조) */}
            {/* 섹션 제목 스타일 */}
            <div className="subttl" style={{ marginBottom: 6 }}>건강 조언</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {toBulletedLines(dailyText).map((line, idx) => (
                <li key={idx} className={`advice-line ${adviceTone(line)}`}>{line}</li>
              ))}
            </ul>
          </div>
          {healthItems.length > 0 && (
            <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>
              워치 데이터 {healthItems.length}건 기반 분석
            </div>
          )}
        </div>
      )}

      {/* 활동량 요약 */}
      {activityStats && (
        <div className="report-section">
          <h2>활동량 현황</h2>
          <div className="summary-grid">
            <div className="summary-card primary">
              <div className="summary-card-label">걸음수</div>
              <div className="summary-card-value">{activityStats.totalSteps.toLocaleString()}</div>
              <div className="summary-card-unit">/ 10,000 보</div>
            </div>
            <div className="summary-card primary">
              <div className="summary-card-label">이동 거리</div>
              <div className="summary-card-value">{activityStats.totalDistance.toFixed(1)}</div>
              <div className="summary-card-unit">km</div>
            </div>
            <div className="summary-card primary">
              <div className="summary-card-label">소모 칼로리</div>
              <div className="summary-card-value">{activityStats.totalCaloriesBurned}</div>
              <div className="summary-card-unit">kcal</div>
            </div>
            {activityStats.avgHeartRate > 0 && (
              <div className="summary-card primary">
                <div className="summary-card-label">평균 심박수</div>
                <div className="summary-card-value">{activityStats.avgHeartRate}</div>
                <div className="summary-card-unit">bpm</div>
              </div>
            )}
          </div>
          
          {/* 걸음수 진행바 */}
          <div className="stat-bar">
            <div className="stat-bar-label">목표 달성률</div>
            <div className="stat-bar-visual">
              <div 
                className="stat-bar-fill" 
                style={{ width: `${activityStats.stepsProgress}%` }}
              >
                {activityStats.stepsProgress >= 15 && `${Math.round(activityStats.stepsProgress)}%`}
              </div>
            </div>
            <div className="stat-bar-value">{Math.round(activityStats.stepsProgress)}%</div>
          </div>
        </div>
      )}

      {/* 식단 요약 */}
      {meals && meals.length > 0 && (
        <div className="report-section">
          <h2>식단 현황</h2>
          <div className="summary-grid">
            <div className="summary-card primary">
              <div className="summary-card-label">총 칼로리</div>
              <div className="summary-card-value">{totals.calories}</div>
              <div className="summary-card-unit">kcal</div>
            </div>
            <div className="summary-card primary">
              <div className="summary-card-label">단백질</div>
              <div className="summary-card-value">{totals.protein_g}</div>
              <div className="summary-card-unit">g ({ratios?.protein || 0}%)</div>
            </div>
            <div className="summary-card primary">
              <div className="summary-card-label">탄수화물</div>
              <div className="summary-card-value">{totals.carbs_g}</div>
              <div className="summary-card-unit">g ({ratios?.carbs || 0}%)</div>
            </div>
            <div className="summary-card primary">
              <div className="summary-card-label">지방</div>
              <div className="summary-card-value">{totals.fat_g}</div>
              <div className="summary-card-unit">g ({ratios?.fat || 0}%)</div>
            </div>
          </div>

          {/* 칼로리 수지 */}
          {activityStats && (
            <div className="stat-bar">
              <div className="stat-bar-label">칼로리 수지</div>
              <div className="stat-bar-visual">
                <div 
                  className="stat-bar-fill" 
                  style={{ 
                    width: `${Math.min(100, Math.abs(calorieBalance) / 30)}%`,
                    background: calorieBalance > 0 
                      ? 'linear-gradient(90deg, #ed8936 0%, #dd6b20 100%)'
                      : 'linear-gradient(90deg, #48bb78 0%, #38a169 100%)'
                  }}
                >
                </div>
              </div>
              <div className="stat-bar-value">
                {calorieBalance > 0 ? '+' : ''}{calorieBalance}kcal
              </div>
            </div>
          )}

          {/* 영양소 비율 바 */}
          {ratios && (
            <>
              <div className="stat-bar">
                <div className="stat-bar-label">단백질 비율</div>
                <div className="stat-bar-visual">
                  <div className="stat-bar-fill" style={{ width: `${ratios.protein}%` }}>
                    {ratios.protein >= 15 && `${ratios.protein}%`}
                  </div>
                </div>
                <div className="stat-bar-value">{ratios.protein}%</div>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-label">탄수화물 비율</div>
                <div className="stat-bar-visual">
                  <div className="stat-bar-fill" style={{ width: `${ratios.carbs}%` }}>
                    {ratios.carbs >= 15 && `${ratios.carbs}%`}
                  </div>
                </div>
                <div className="stat-bar-value">{ratios.carbs}%</div>
              </div>
              <div className="stat-bar">
                <div className="stat-bar-label">지방 비율</div>
                <div className="stat-bar-visual">
                  <div className="stat-bar-fill" style={{ width: `${ratios.fat}%` }}>
                    {ratios.fat >= 15 && `${ratios.fat}%`}
                  </div>
                </div>
                <div className="stat-bar-value">{ratios.fat}%</div>
              </div>
            </>
          )}

          <div className="mt-3" style={{ fontSize: "14px", color: "#718096" }}>
            총 {meals.length}끼 식사 기록
          </div>
        </div>
      )}

      {/* 워치 정보 상세 패널 */}
      {showDetails && healthItems && healthItems.length > 0 && (
        <div className="report-section">
          <h2>워치 데이터 상세</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>기록시각</th>
                  <th>걸음수</th>
                  <th>칼로리</th>
                  <th>거리</th>
                  <th>심박수</th>
                </tr>
              </thead>
              <tbody>
                {healthItems.slice(0, 20).map((h) => (
                  <tr key={h.id}>
                    <td>{h.recordTime ? new Date(h.recordTime).toLocaleString() : "-"}</td>
                    <td>{h.steps ? h.steps.toLocaleString() : "-"} 보</td>
                    <td>{h.caloriesKcal ?? "-"} kcal</td>
                    <td>{h.distanceKm ?? "-"} km</td>
                    <td>{h.heartRateAvg ?? "-"} bpm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>
            총 {healthItems.length}건의 워치 데이터
          </div>
        </div>
      )}

      {/* 식사 기록 */}
      {meals && meals.length > 0 && (
        <div className="report-section">
          <h2>식사 기록 상세</h2>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>음식</th>
                  <th>중량</th>
                  <th>칼로리</th>
                  <th>단백질</th>
                  <th>탄수화물</th>
                  <th>지방</th>
                  <th>식이섬유</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {meals.map((m) => (
                  <tr key={m.id}>
                    <td>
                      {new Date(m.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm text-capitalize"
                        style={{ minWidth: "150px" }}
                        value={editLabel[m.id] ?? m.label ?? ""}
                        onChange={(e) =>
                          setEditLabel((s) => ({ ...s, [m.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && saveRow(m.id)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        style={{ width: "80px" }}
                        min={1}
                        step={10}
                        value={editGrams[m.id] ?? m.grams}
                        onChange={(e) =>
                          setEditGrams((s) => ({ ...s, [m.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && saveRow(m.id)}
                      />
                    </td>
                    <td>{m.calories} kcal</td>
                    <td>{m.protein_g}g</td>
                    <td>{m.carbs_g}g</td>
                    <td>{m.fat_g}g</td>
                    <td>{m.fiber_g}g</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn btn-primary btn-sm" onClick={() => saveRow(m.id)}>
                          저장
                        </button>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => deleteRow(m.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>불러오는 중…</div>}
        </div>
      )}

      {/* 빈 상태 메시지 */}
      {(!meals || meals.length === 0) && (!healthItems || healthItems.length === 0) && (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-text">
            아직 등록된 데이터가 없습니다.<br />
            식사 기록이나 워치 데이터를 추가해보세요.
          </div>
        </div>
      )}
    </div>
  );
}