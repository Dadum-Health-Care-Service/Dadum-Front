import React, { useEffect, useState } from "react";
import ButtonComponent from "../../common/ButtonComponent";
import ModalComponent from "../../common/ModalComponent";
import ContainerComponent from "../../common/ContainerComponent";
import { useApi } from "../../../utils/api/useApi";
import { useAuth } from "../../../context/AuthContext";
import ActivityStats from "./components/ActivityStats";
import NutritionStats from "./components/NutritionStats";
import MealDetails from "./components/MealDetails";
import "./DailySummary.css";

const SUMMARY_MODEL = import.meta.env.VITE_SUMMARY_MODEL || "llm"; 
const fmtDate = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const normalizeHealthItems = (rawArr = [], usersIdForKey = "u") => {
  if (!Array.isArray(rawArr)) return [];

  return rawArr.map((x, idx) => {
    const steps = Array.isArray(x.stepData)
      ? x.stepData.reduce((a, b) => a + Number(b || 0), 0)
      : Number(x.steps ?? 0);

    const hrArr = Array.isArray(x.heartRateData) ? x.heartRateData : [];
    const heartRateAvg = hrArr.length
      ? Math.round(hrArr.reduce((a, b) => a + Number(b?.bpm || 0), 0) / hrArr.length)
      : Number(x.heartRateAvg ?? 0);

    const recordTime = hrArr[0]?.time || x.recordTime || null;
    const caloriesKcal = Number(x.caloriesBurnedData ?? x.activeCaloriesBurned ?? x.calories ?? x.caloriesKcal ?? 0);
    const distanceKm = Number(x.distanceWalked ?? x.distanceKm ?? 0);
    const id = x.id ?? (recordTime ? `${usersIdForKey}-${recordTime}-${idx}` : `${usersIdForKey}-${idx}`);

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

// 중복 제거 유틸리티 (recordTime+steps+distance 기준)
const dedupeHealthItems = (items = []) => {
  const seen = new Set();
  const unique = [];
  for (const it of items) {
    const key = [it.recordTime || '', it.steps || 0, it.distanceKm || 0, it.caloriesKcal || 0].join('|');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(it);
    }
  }
  return unique;
};

export default function DailySummary() {
  const { GET, POST, PUT, DELETE } = useApi();
  const { user } = useAuth();
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
  const [editGrams, setEditGrams] = useState({});
  const [editLabel, setEditLabel] = useState({});
  const [selectedMeals, setSelectedMeals] = useState([]);
  const [dailyText, setDailyText] = useState("");
  const [summaryModel, setSummaryModel] = useState("");
  const [healthHint, setHealthHint] = useState("");
  const [usersId, setUsersId] = useState("");
  const [healthItems, setHealthItems] = useState([]);
  const [healthHints, setHealthHints] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  const [showNoDataModal, setShowNoDataModal] = useState(false);
  const [noDataModalType, setNoDataModalType] = useState('server'); 
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMealId, setDeleteMealId] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMealId, setSaveMealId] = useState(null);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  
  useEffect(() => {
  }, [showNoDataModal]);

  useEffect(() => {
    if (user?.usersId && !usersId) {
      setUsersId(String(user.usersId));
    }
  }, [user, usersId]);

  const findById = (id) => meals.find((m) => m.id === id) || {};
  const prepareWatchDataForLLM = (items = []) => {
    if (!items || items.length === 0) return null;
    
    const totalSteps = items.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const totalCalories = Math.ceil(items.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0));
    const totalDistance = items.reduce((sum, item) => sum + Number(item.distanceKm || 0), 0);
    
    const heartRates = items
      .map(item => Number(item.heartRateAvg || 0))
      .filter(hr => hr > 0);
    const avgHeartRate = heartRates.length > 0 
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : 0;
    
    const latestRecord = items[0]?.recordTime ? new Date(items[0].recordTime).toLocaleString() : null;
    
    
    return {
      totalSteps,
      totalCalories,
      totalDistance,
      avgHeartRate,
      latestRecord,
      dataCount: items.length,
      summary: `오늘 총 걸음수: ${totalSteps.toLocaleString()}보, 소모 칼로리: ${totalCalories}kcal, 이동거리: ${totalDistance.toFixed(1)}km, 평균 심박수: ${avgHeartRate}bpm`,
      // LLM이 질병 발병 가능성과 운동 추천을 할 수 있도록 더 자세한 정보 제공
      activityLevel: totalSteps >= 10000 ? "high" : totalSteps >= 5000 ? "moderate" : "low",
      heartRateStatus: avgHeartRate > 100 ? "elevated" : avgHeartRate > 60 ? "normal" : "low",
      calorieBurnStatus: totalCalories > 800 ? "high" : totalCalories > 400 ? "moderate" : "low"
    };
  };

  // API functions
  const fetchUsersIdFromSTS = async () => {
    try {
      
      if (user?.usersId) {
        setUsersId(String(user.usersId));
        return String(user.usersId);
      }

      
      const savedEmail =
        localStorage.getItem("usersEmail") || localStorage.getItem("email");
      if (savedEmail) {
        const res = await GET(
          `/users/email/${encodeURIComponent(savedEmail)}`,
          {},
          true,
          'main'
        );
        const id = res?.data?.usersId ?? res?.data?.id;
        if (id) {
          setUsersId(String(id));
          return String(id);
        }
      }
    } catch (e) {
    }
    
    setUsersId("");
    return "";
  };

  
  const fetchHealthDirect = async (id) => {
    if (!id) return;
    
    if (healthItems.length > 0) {
      return;
    }
    
    try {
      const startTime = Date.now();
      
      const res = await GET(`/health/${id}`, {}, true, 'main');
      
      const endTime = Date.now();
      
      const arr = Array.isArray(res.data) ? res.data : [];
      const normalized = normalizeHealthItems(arr, String(id));
      const unique = dedupeHealthItems(normalized.length ? normalized : arr);
      setHealthItems(unique);
    } catch (e) {
      if (e?.response?.status === 500) {
        // 서버 데이터베이스 연결 오류
        setNoDataModalType('server');
      } else {
        // 기타 오류 (네트워크 등)
        setNoDataModalType('server');
      }
      setShowNoDataModal(true);
    }
  };

  

  const fetchHealthRaw = async (id) => {
    if (!id) return [];
    try {
      const res = await GET(`/health/${id}`, {}, true, 'main');
      const arr = Array.isArray(res.data) ? res.data : [];
      const normalized = normalizeHealthItems(arr, String(id));
      const unique = dedupeHealthItems(normalized.length ? normalized : arr);
      return unique;
    } catch (e) {
      if (e?.response?.status === 500) {
        return [];
      }
      return [];
    }
  };

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
    
    try {
      const startTime = Date.now();
      
      // 워치 데이터 조회
      const currentHealthItems = await fetchHealthRaw(id);
      
      const endTime = Date.now();
      
      if (!currentHealthItems || currentHealthItems.length === 0) {
        setNoDataModalType('no-data');
        setShowNoDataModal(true);
        return;
      }
      
      // 날짜별 필터링 적용
      console.log("현재 설정된 날짜:", date);
      // 문자열 → Date 객체로 변환
      const dateObj = new Date(`${date}T00:00:00Z`);
      // 한국 시간(KST) 기준 날짜 문자열로 변환
      const dateKST = dateObj.toLocaleDateString("ko-KR", {
        timeZone: "Asia/Seoul",
      });
      console.log(dateKST);
      
      const filteredHealthItems = currentHealthItems.filter((item) => {
        if (!item.recordTime) return false;
        console.log(item.recordTime);
        const dateStr = new Date(item.recordTime).toLocaleDateString("ko-KR", {
          timeZone: "Asia/Seoul",
        });
        return dateStr === dateKST;
      });
      console.log(filteredHealthItems);
      
      setHealthItems(filteredHealthItems.length ? filteredHealthItems : currentHealthItems);
      setShowDetails(true);
    } catch (e) {
      if (e?.response?.status === 500) {
        setNoDataModalType('server');
      } else {
        setNoDataModalType('server');
      }
      setShowNoDataModal(true);
    }
  };

  const loadDaily = async (d) => {
    setLoading(true);
    try {
      let id = usersId || localStorage.getItem("usersId");
      if (!id) {
        id = await fetchUsersIdFromSTS();
      }
      
      console.log('[DailySummary] Loading daily data for:', { userId: id, date: d });
      const res = await GET(`/summary/daily?user_id=${id}&date=${d}`, {}, true, 'ai');
      const j = res.data;
      console.log('[DailySummary] Received data:', j);
      
      if (res.status === 200) {
        setTotals(
          j.totals || { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
        );
        setMeals(j.meals || []);
        console.log('[DailySummary] Set meals:', j.meals?.length || 0, 'items');
        setEditGrams({});
        setEditLabel({});
        setDailyText("");
        setSummaryModel("");
        setHealthHint("");
      } else {
        console.warn('[DailySummary] Unexpected status:', res.status);
      }
    } catch (error) {
      console.error('[DailySummary] Error loading daily data:', error);
      setTotals({ calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });
      setMeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
  
    (async () => {
      if (user?.usersId && mounted) {
        setUsersId(String(user.usersId));
      } else {
      const storedId = localStorage.getItem("usersId");
        if (storedId && mounted) {
        setUsersId(String(storedId));
      } else {
        const id = await fetchUsersIdFromSTS();
          if (id && mounted) {
          setUsersId(id);
        }
      }
      }
    })().catch(err => {
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (usersId) {
    loadDaily(date);
    }
  }, [usersId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDaily(date);
    }, 1000);

    return () => clearTimeout(timer);
  }, [usersId]);

  useEffect(() => {
    loadDaily(date);
    fetchHealthDirect(usersId);
  }, [date]);

  useEffect(() => {
    let hasRefreshed = false;
    
    const handleFocus = () => {
      if (!hasRefreshed && usersId) {
        hasRefreshed = true;
        loadDaily(date);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && !hasRefreshed && usersId) {
        hasRefreshed = true;
        loadDaily(date);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [usersId, date]);

  const handleSaveClick = (mealId) => {
    setSaveMealId(mealId);
    setShowSaveModal(true);
  };

  const confirmSave = async () => {
    if (!saveMealId) return;
    const prev = findById(saveMealId);
    const nextGrams = Number(editGrams[saveMealId] ?? prev.grams);

    const nextLabelRaw = (editLabel[saveMealId] ?? prev.label) || "";
    const nextLabel = String(nextLabelRaw).trim();

    if (!Number.isFinite(nextGrams) || nextGrams <= 0) {
      showAlert("올바른 중량을 입력해주세요.", "error");
      setShowSaveModal(false);
      setSaveMealId(null);
      return;
    }

    const body = {
      grams: nextGrams,
      ...(nextLabel && nextLabel !== prev.label ? { label: nextLabel } : {}),
    };

    const res = await PUT(`/meal-log/${saveMealId}`, body, true, 'ai');
    const data = res.data;

    if (res.status === 200) {
      setMeals((arr) => arr.map((m) => (m.id === saveMealId ? data : m)));
      setTotals((t) => ({
        calories: t.calories - (prev.calories || 0) + data.calories,
        protein_g: t.protein_g - (prev.protein_g || 0) + data.protein_g,
        carbs_g: t.carbs_g - (prev.carbs_g || 0) + data.carbs_g,
        fat_g: t.fat_g - (prev.fat_g || 0) + data.fat_g,
        fiber_g: t.fiber_g - (prev.fiber_g || 0) + data.fiber_g,
      }));
      setDailyText(""); 
      setSummaryModel("");
      setHealthHint("");
      
      showAlert("식사 정보가 저장되었습니다.", "success");
    } else {
      showAlert(`저장 실패: ${data?.detail || res.statusText}`, "error");
    }
    
    setShowSaveModal(false);
    setSaveMealId(null);
  };

  const cancelSave = () => {
    setShowSaveModal(false);
    setSaveMealId(null);
  };

  const handleDeleteClick = (mealId) => {
    setDeleteMealId(mealId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteMealId) return;
    
    const prev = findById(deleteMealId);
    if (!prev?.id) return;

    const res = await DELETE(`/meal-log/${deleteMealId}`, {}, true, 'ai');
    const data = res.data;

    if (res.status === 200) {
      setMeals((arr) => arr.filter((m) => m.id !== deleteMealId));
      setTotals((t) => ({
        calories: t.calories - (prev.calories || 0),
        protein_g: t.protein_g - (prev.protein_g || 0),
        carbs_g: t.carbs_g - (prev.carbs_g || 0),
        fat_g: t.fat_g - (prev.fat_g || 0),
        fiber_g: t.fiber_g - (prev.fiber_g || 0),
      }));
      setDailyText(""); 
      setSummaryModel("");
      setHealthHint("");
      
      showAlert("항목이 성공적으로 삭제되었습니다.", "success");
    } else {
      showAlert(`삭제 실패: ${data?.detail || res.statusText}`, "error");
    }
    
    setShowDeleteModal(false);
    setDeleteMealId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteMealId(null);
  };

  const toggleMealSelection = (mealId) => {
    setSelectedMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMeals.length === meals.length) {
      setSelectedMeals([]);
    } else {
      setSelectedMeals(meals.map(m => m.id));
    }
  };

  const bulkDelete = () => {
    if (selectedMeals.length === 0) {
      showAlert("삭제할 항목을 선택해주세요.", "warning");
      return;
    }

    setShowBulkDeleteModal(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deleteCount = selectedMeals.length;
      
      for (const mealId of selectedMeals) {
        const prev = findById(mealId);
        if (!prev?.id) continue;

        const res = await DELETE(`/meal-log/${mealId}`, {}, true, 'ai');
        
        if (res.status === 200) {
          setMeals((arr) => arr.filter((m) => m.id !== mealId));
          setTotals((t) => ({
            calories: t.calories - (prev.calories || 0),
            protein_g: t.protein_g - (prev.protein_g || 0),
            carbs_g: t.carbs_g - (prev.carbs_g || 0),
            fat_g: t.fat_g - (prev.fat_g || 0),
            fiber_g: t.fiber_g - (prev.fiber_g || 0),
          }));
        }
      }
      
      setSelectedMeals([]);
      setDailyText("");
      setSummaryModel("");
      setHealthHint("");
      setShowBulkDeleteModal(false);
      showAlert(`${deleteCount}개 항목이 삭제되었습니다.`, "success");
    } catch (error) {
      showAlert("일괄 삭제 중 오류가 발생했습니다.", "error");
      setShowBulkDeleteModal(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteModal(false);
  };

  const bulkSave = async () => {
    if (selectedMeals.length === 0) {
      showAlert("저장할 항목을 선택해주세요.", "warning");
      return;
    }

    try {
      const saveCount = selectedMeals.length;
      
      for (const mealId of selectedMeals) {
        const prev = findById(mealId);
        if (!prev?.id) continue;

        const nextGrams = Number(editGrams[mealId] ?? prev.grams);
        const nextLabelRaw = (editLabel[mealId] ?? prev.label) || "";
        const nextLabel = nextLabelRaw.trim().toLowerCase();

        if (nextGrams === prev.grams && (!nextLabel || nextLabel === prev.label)) {
          continue;
        }

        const body = {
          grams: nextGrams,
          ...(nextLabel && nextLabel !== prev.label ? { label: nextLabel } : {}),
        };

        const res = await PUT(`/meal-log/${mealId}`, body, true, 'ai');
        const data = res.data;

        if (res.status === 200) {
          setMeals((arr) => arr.map((m) => (m.id === mealId ? data : m)));
          setTotals((t) => ({
            calories: t.calories - (prev.calories || 0) + data.calories,
            protein_g: t.protein_g - (prev.protein_g || 0) + data.protein_g,
            carbs_g: t.carbs_g - (prev.carbs_g || 0) + data.carbs_g,
            fat_g: t.fat_g - (prev.fat_g || 0) + data.fat_g,
            fiber_g: t.fiber_g - (prev.fiber_g || 0) + data.fiber_g,
          }));
      } else {
          
        }
      }
      
      setSelectedMeals([]);
      setDailyText("");
      setSummaryModel("");
      setHealthHint("");
      showAlert(`${saveCount}개 항목이 저장되었습니다.`, "success");
    } catch (error) {
      
      showAlert("일괄 저장 중 오류가 발생했습니다.", "error");
    }
  };
  const showAlert = (message, type = "success") => {
    setAlertMessage(message);
    setAlertType(type);
    setShowAlertModal(true);
  };

  const closeAlert = () => {
    setShowAlertModal(false);
    setAlertMessage("");
  };
  const generateLocalAnalysis = () => {
    // 데이터가 없을 때 안내 메시지
    if ((!meals || meals.length === 0) && (!healthItems || healthItems.length === 0)) {
      return {
        watchSummary: "",
        mealSummary: "",
        // 식단 조언 영역에 노출될 요약 텍스트는 식단 입력 안내로 설정
        advice: "오늘의 식단을 입력해주세요. 칼로리 페이지에서 사진으로 식사를 기록할 수 있습니다."
      };
    }
    
    if (!meals || meals.length === 0) {
      return {
        watchSummary: "",
        mealSummary: "",
        advice: "워치 데이터를 동기화해주세요. 더 정확한 건강 분석을 위해 활동량 데이터가 필요합니다."
      };
    }
    
    if (!healthItems || healthItems.length === 0) {
      return {
        watchSummary: "",
        mealSummary: "",
        advice: "워치 데이터를 동기화해주세요. 더 정확한 건강 분석을 위해 활동량 데이터가 필요합니다."
      };
    }
    
    // 데이터가 있을 때는 간단한 메시지만 표시
    return {
      watchSummary: "",
      mealSummary: "",
      advice: "AI 건강 분석을 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
    };
  };

  const generateSummary = async () => {
    setDailyText("분석 중…");
    setSummaryModel("");
    setHealthHint("");
    
    try {
      let id = usersId || localStorage.getItem("usersId");
      if (!id) {
        id = await fetchUsersIdFromSTS();
      }
      
      if (id) {
        // 실시간 워치 데이터 조회
        const latestHealthItems = await fetchHealthRaw(id);
        console.log(latestHealthItems);
        
        // 날짜별 필터링 적용
        // 문자열 → Date 객체로 변환
        const dateObj = new Date(`${date}T00:00:00Z`);
        // 한국 시간(KST) 기준 날짜 문자열로 변환
        const dateKST = dateObj.toLocaleDateString("ko-KR", {
          timeZone: "Asia/Seoul",
        });
        console.log(dateKST);
        
        const filteredHealthItems = latestHealthItems.filter((item) => {
          if (!item.recordTime) return false;
          console.log(item.recordTime);
          const dateStr = new Date(item.recordTime).toLocaleDateString("ko-KR", {
            timeZone: "Asia/Seoul",
          });
          return dateStr === dateKST;
        });
        console.log(filteredHealthItems);
        
        if (filteredHealthItems.length > 0) {
          setHealthItems(filteredHealthItems);
        }

        if ((!meals || meals.length === 0) && (!filteredHealthItems || filteredHealthItems.length === 0)) {
        } else {
        const watchData = prepareWatchDataForLLM(filteredHealthItems);
        try {
            const res = await POST(`/summary/analyze`, {
                user_id: id,
              date,
                model: "llm", // 강제로 llm 사용
                use_llm: true, // 강제로 llm 사용
              watch_data: watchData,
              include_exercise_recommendation: true,
              }, true, 'ai');
            const j = res.data;
            
            
            if (res.status === 200 && (j.summary || j.summary === "")) {
            setDailyText(j.summary || "");
            setSummaryModel(j.model_used || "llm");
            setHealthHint(watchData ? watchData.summary : "");
              
              // LLM에서 제공하는 건강 리스크 힌트가 있다면 저장
              if (j.health_hints && Array.isArray(j.health_hints)) {
                setHealthHints(j.health_hints);
              } else if (j.risk_hints && Array.isArray(j.risk_hints)) {
                setHealthHints(j.risk_hints);
              } else if (j.hints && Array.isArray(j.hints)) {
                setHealthHints(j.hints);
              } else {
                // 요약 텍스트에서 문장 단위로 나눠 힌트로 사용 (fallback)
                if (typeof j.summary === 'string' && j.summary.trim().length > 0) {
                  const splitted = j.summary
                    .split(/(?<=[.!?])\s+/) // 문장 경계 기준 분리
                    .map(s => s.trim())
                    .filter(Boolean);
                  if (splitted.length > 0) {
                    setHealthHints(splitted);
                  }
                }
              }
              
              return;
          }
        } catch (e) {
            // LLM 요약 실패, 로컬 분석으로 대체
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 프론트엔드 자체 분석 수행
      const analysis = generateLocalAnalysis();
      
      const fullSummary = analysis.advice || "";
      
      setDailyText(fullSummary);
      setHealthHint(analysis.watchSummary);
      setSummaryModel("local-analysis");
      
    } catch (e) {
      // 분석 실패
      setDailyText(`분석 중 오류가 발생했습니다: ${e.message}`);
    }
  };

  // Calculation functions
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

  const calculateActivityStats = () => {
    if (!healthItems || healthItems.length === 0) return null;
    
    const totalSteps = healthItems.reduce((sum, item) => sum + Number(item.steps || 0), 0);
    const totalCaloriesBurned = Math.ceil(healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0));
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

  // Calculated values
  const ratios = calculateNutritionRatios();
  const activityStats = calculateActivityStats();
  const calorieBalance = activityStats ? totals.calories - activityStats.totalCaloriesBurned : totals.calories;

  // UI helper functions
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

  const toBulletedLines = (text) => {
    if (!text) return [];
    return String(text)
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  const adviceTone = (line) => {
    const warnKeys = ["부족", "높", "위험", "주의", "줄이", "증가", "과다", "불균형", "부담", "초과"];
    const goodKeys = ["유지", "좋", "적정", "안정", "달성", "양호", "괜찮"];
    const has = (arr) => arr.some((k) => line.includes(k));
    if (has(warnKeys)) return "warning";
    if (has(goodKeys)) return "success";
    return "";
  };

  // 식단 기반 간단 팁 1-2줄 생성 (LLM 결과와 함께 노출)
  const buildDietTips = () => {
    if (!totals || !totals.calories) return [];
    const tips = [];
    const proteinPct = ((totals.protein_g * 4) / totals.calories) * 100;
    const fatPct = ((totals.fat_g * 9) / totals.calories) * 100;
    const fiberG = totals.fiber_g || 0;

    if (proteinPct < 15) {
      tips.push("단백질 비율이 낮아요. 달걀·두부·살코기 등 고단백 식품을 추가하세요.");
    }
    if (fatPct > 35) {
      tips.push("지방 비중이 높습니다. 튀김·가공육 대신 구이·찜 조리로 바꿔보세요.");
    }
    if (fiberG < 20) {
      tips.push("식이섬유가 부족해요. 채소·과일·통곡물을 한 끼에 한 가지씩 추가하세요.");
    }

    return tips.slice(0, 2);
  };

  // LLM 조언과 로컬 팁 병합 시 중복 제거
  const mergeAdviceWithoutDuplicates = (llmLines, dietTips) => {
    const normalize = (s) => String(s)
      .toLowerCase()
      .replace(/[\s.,!?:;·–—~…]/g, "")
      .replace(/\u00A0/g, "");

    const unique = [];
    const seen = new Set();
    const seenCategory = new Set();

    const categorize = (s) => {
      const t = String(s);
      // 간단한 의미 기반 카테고리로 유사 문구 중복 제거
      if (t.includes("지방") && (t.includes("높") || t.includes("과다"))) return "fat-high";
      if (t.includes("탄수") && (t.includes("높") || t.includes("과다"))) return "carb-high";
      if (t.includes("단백질") && (t.includes("낮") || t.includes("부족"))) return "protein-low";
      if (t.includes("칼로리") && t.includes("높")) return "calorie-high";
      if (t.includes("식이섬유") && (t.includes("부족") || t.includes("낮"))) return "fiber-low";
      return "";
    };

    const pushIfNew = (line) => {
      const n = normalize(line);
      if (n.length === 0) return;
      // 의미 카테고리 중복 우선 제거
      const cat = categorize(line);
      if (cat && seenCategory.has(cat)) return;
      // 포함 관계까지 간단히 체크
      if ([...seen].some((x) => n.includes(x) || x.includes(n))) return;
      seen.add(n);
      if (cat) seenCategory.add(cat);
      unique.push(line);
    };

    llmLines.forEach(pushIfNew);
    dietTips.forEach(pushIfNew);
    return unique;
  };

  const buildActivityChips = () => {
    if (!activityStats) return [];
    const chips = [];
    chips.push({ label: "걸음수", value: activityStats.totalSteps.toLocaleString()+"보" });
    chips.push({ label: "이동거리", value: activityStats.totalDistance.toFixed(1)+"km" });
    chips.push({ label: "소모 칼로리", value: `${activityStats.totalCaloriesBurned}kcal` });
    if (activityStats.avgHeartRate) chips.push({ label: "평균 심박", value: `${activityStats.avgHeartRate}bpm` });
    return chips;
  };

  const buildExerciseRecommendations = () => {
    // 워치 데이터가 없어도 기본 운동 추천은 제공
    const recommendations = [];

    // 활동 데이터 기반 추천
    if (activityStats) {
      const steps = Number(activityStats.totalSteps || 0);
      if (steps < 5000) {
        recommendations.push("매일 30분 빠른 걷기, 주 3회 근력 운동(스쿼트·푸시업·플랭크)을 시작해보세요.");
      } else if (steps < 10000) {
        recommendations.push("현재 활동량을 유지하고, 주 2-3회 근력 운동과 유연성 운동을 추가하세요.");
      } else {
        recommendations.push("활동량이 충분합니다. 근력·유연성 운동을 병행해 전신 균형을 유지하세요.");
      }
    } else {
      // 워치 데이터가 없는 경우에도 기본 가이드 제공
      recommendations.push("매일 30분 이상 걷기 또는 자전거/수영 등 유산소 운동을 실천하세요.");
      recommendations.push("주 2-3회 전신 근력 운동(하체·상체·코어)을 병행하세요.");
    }

    return recommendations;
  };
  const buildRiskHints = () => {
    // 워치/식단 데이터 모두 없는 경우: 건강 리스크에는 워치 동기화 메시지
    if ((!meals || meals.length === 0) && (!healthItems || healthItems.length === 0)) {
      return ["워치 데이터를 동기화해주세요. 더 정확한 건강 분석을 위해 활동량 데이터가 필요합니다."];
    }

    if (!totals || totals.calories === 0) {
      // 식단만 없는 경우에는 식단 입력 안내를 유지
      return ["오늘의 식단을 입력해주세요. 칼로리 페이지에서 사진으로 식사를 기록할 수 있습니다."];
    }
    
    // 질병 발병 가능성 중심의 리스크 메시지 생성
    const hints = [];
    
    // 워치 데이터 기반 질병 위험 분석
    if (healthItems && healthItems.length > 0) {
      const totalSteps = healthItems.reduce((sum, item) => sum + Number(item.steps || 0), 0);
      const totalCaloriesBurned = Math.ceil(healthItems.reduce((sum, item) => sum + Number(item.caloriesKcal || 0), 0));
      const avgHeartRate = healthItems.reduce((sum, item) => sum + Number(item.heartRateAvg || 0), 0) / healthItems.length;
      
      // 활동량 기반 질병 위험 분석
      if (totalSteps < 5000) {
        hints.push("활동량 부족으로 대사증후군 및 심혈관 질환 위험이 높습니다.");
      }
      
      // 심박수 기반 분석
      if (avgHeartRate > 100) {
        hints.push("평균 심박수가 높아 스트레스나 과도한 운동으로 인한 심혈관 부담이 있을 수 있습니다.");
      } else if (avgHeartRate < 60) {
        hints.push("낮은 심박수는 좋은 심혈관 건강을 나타내지만, 극도로 낮다면 의사 상담을 권장합니다.");
      }
      
      // 칼로리 균형 분석
      const calorieBalance = totals.calories - totalCaloriesBurned;
      if (calorieBalance > 500) {
        hints.push("섭취 칼로리가 소모량보다 많아 체중 증가 및 당뇨병 위험이 있습니다.");
      } else if (calorieBalance < -500) {
        hints.push("칼로리 부족으로 근육 감소 위험이 있습니다.");
      }
    }
    
    // 영양소 기반 질병 위험 분석
    const fatRatio = (totals.fat_g * 9) / Math.max(1, totals.calories) * 100;
    const proteinRatio = (totals.protein_g * 4) / Math.max(1, totals.calories) * 100;
    const carbsRatio = (totals.carbs_g * 4) / Math.max(1, totals.calories) * 100;
    
    if (fatRatio > 35) {
      hints.push("고지방 식단으로 인한 심혈관 질환 및 지방간 위험이 높습니다.");
    }
    
    if (proteinRatio < 15) {
      hints.push("단백질 부족으로 근육 감소 및 면역력 저하 위험이 있습니다.");
    }
    
    if (carbsRatio > 70) {
      hints.push("고탄수화물 식단으로 인한 당뇨병 및 인슐린 저항성 위험이 있습니다.");
    }
    
    if (totals.fiber_g && totals.fiber_g < 15) {
      hints.push("식이섬유 부족으로 대장암 및 심혈관 질환 위험이 있습니다.");
    }
    
    return hints.length > 0 ? hints : ["오늘 하루 영양과 활동량의 균형이 좋습니다. 계속 유지하세요."];
  };

  return (
    <div className="report-container">
      <ContainerComponent className="report-header">
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#0A66FF' }}>
          건강 종합 보고서
        </h1>
        <div className="date">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <ButtonComponent
              variant="outline"
              size="small"
              onClick={() => setDate(fmtDate(addDays(new Date(date), -1)))}
            >
              ← 이전
            </ButtonComponent>
            <input
              type="date"
              style={{ 
                width: 160, 
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #D6E4FF',
                fontSize: '14px'
              }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <ButtonComponent
              variant="outline"
              size="small"
              onClick={() => setDate(fmtDate(addDays(new Date(date), +1)))}
            >
              다음 →
            </ButtonComponent>
            <ButtonComponent
              variant="outline"
              size="small"
              onClick={() => setDate(fmtDate(new Date()))}
            >
              오늘
            </ButtonComponent>
          </div>
        </div>
      </ContainerComponent>

      <div className="report-actions">
        <ButtonComponent
          variant="primary"
          size="large"
          onClick={generateSummary}
        >
          종합 분석 생성
        </ButtonComponent>
      </div>

      <ContainerComponent className="report-section">
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
          나의 워치 정보
        </h2>
        {!showDetails ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <ButtonComponent
              variant="primary"
              size="large"
              onClick={handleShowDetails}
            >
              워치 데이터 조회
            </ButtonComponent>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>기록시각</th>
                  <th>걸음수</th>
                  <th>칼로리 (kcal)</th>
                  <th>거리 (km)</th>
                  <th>심박수 (bpm)</th>
                </tr>
              </thead>
              <tbody>
                {healthItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      {new Date(item.recordTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td>{item.steps || 0}</td>
                    <td>{item.caloriesKcal || 0}</td>
                    <td>{item.distanceKm || 0}</td>
                    <td>{item.heartRateAvg || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {showDetails && healthItems && healthItems.length > 0 && (
          <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>
            총 {healthItems.length}건의 워치 데이터
          </div>
        )}
      </ContainerComponent>

      {dailyText && dailyText !== "요약이 없습니다." && dailyText !== "분석 중…" && (
        <ContainerComponent className="report-section">
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
            AI 건강 분석 보고서
          </h2>
          <div className="insights">
            {buildInsightChips().map((c, idx) => (
              <span key={idx} className={`chip ${c.tone}`}>{c.text}</span>
            ))}
          </div>
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

          {buildExerciseRecommendations().length > 0 && (
            <>
              <div className="subttl"> 운동추천</div>
              <ul style={{ paddingLeft: 18, marginTop: 0 }}>
                {buildExerciseRecommendations().map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {buildRiskHints().length > 0 && (
            <>
              <div className="subttl">건강 리스크</div>
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
            color: "#000000",
            fontSize: "15px"
          }}>
            <div className="subttl" style={{ marginBottom: 6 }}>식단 조언</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {mergeAdviceWithoutDuplicates(toBulletedLines(dailyText), buildDietTips()).map((line, idx) => (
                <li key={idx} className={`advice-line ${adviceTone(line)}`}>{line}</li>
              ))}
            </ul>
          </div>
          {healthItems.length > 0 && (
            <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>
              워치 데이터 {healthItems.length}건 기반 분석
            </div>
          )}
        </ContainerComponent>
      )}

      <ActivityStats activityStats={activityStats} />

      <NutritionStats 
        totals={totals} 
        ratios={ratios} 
        calorieBalance={calorieBalance} 
        meals={meals}
        activityStats={activityStats}
      />


      {meals && meals.length > 0 && (
        <MealDetails 
          meals={meals}
          loading={loading}
          selectedMeals={selectedMeals}
          editGrams={editGrams}
          editLabel={editLabel}
          toggleMealSelection={toggleMealSelection}
          toggleSelectAll={toggleSelectAll}
          bulkSave={bulkSave}
          bulkDelete={bulkDelete}
          handleSaveClick={handleSaveClick}
          handleDeleteClick={handleDeleteClick}
          setEditGrams={setEditGrams}
          setEditLabel={setEditLabel}
          setTotals={setTotals}
          totals={totals}
          setSelectedMeals={setSelectedMeals}
        />
      )}


      <ModalComponent
        isOpen={showNoDataModal}
        onClose={() => setShowNoDataModal(false)}
        title={noDataModalType === 'server' ? "서버 연결 오류" : "워치 정보 없음"}
        size={ModalComponent.SIZES.SMALL}
        variant={ModalComponent.VARIANTS.DEFAULT}
      >
        <ModalComponent.Section>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            {noDataModalType === 'server' ? (
              <>
                <p style={{ fontSize: '16px', color: '#666', margin: '0 0 20px 0' }}>
                  서버 연결에 문제가 있습니다.
                </p>
                <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
                  잠시 후 다시 시도해주세요.
                </p>
              </>
            ) : (
              <>
            <p style={{ fontSize: '16px', color: '#666', margin: '0 0 20px 0' }}>
              워치 정보가 없습니다.
            </p>
            <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
                  워치를 연결하고 데이터를 동기화해주세요.
            </p>
              </>
            )}
          </div>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant="primary"
            size="medium"
            onClick={() => setShowNoDataModal(false)}
            style={{ marginRight: '8px' }}
          >
            확인
          </ButtonComponent>
          <ButtonComponent
            variant="secondary"
            size="medium"
            onClick={() => setShowNoDataModal(false)}
          >
            닫기
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>

      <ModalComponent
        isOpen={showSaveModal}
        onClose={cancelSave}
        title="식사 정보 저장"
        size={ModalComponent.SIZES.SMALL}
        closeOnOverlayClick={true}
      >
        <ModalComponent.Section>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 20px 0', textAlign: 'center' }}>
            식사 정보를 저장하시겠습니까?
          </p>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant="primary"
            size="medium"
            onClick={confirmSave}
            style={{ marginRight: '8px' }}
          >
            저장
          </ButtonComponent>
          <ButtonComponent
            variant="secondary"
            size="medium"
            onClick={cancelSave}
          >
            취소
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>

      <ModalComponent
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        title="항목 삭제"
        size={ModalComponent.SIZES.SMALL}
        closeOnOverlayClick={true}
      >
        <ModalComponent.Section>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 20px 0', textAlign: 'center' }}>
            이 항목을 삭제하시겠습니까?
          </p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0, textAlign: 'center' }}>
            삭제된 항목은 복구할 수 없습니다.
          </p>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant="danger"
            size="medium"
            onClick={confirmDelete}
            style={{ marginRight: '8px' }}
          >
            삭제
          </ButtonComponent>
          <ButtonComponent
            variant="secondary"
            size="medium"
            onClick={cancelDelete}
          >
            취소
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>

      <ModalComponent
        isOpen={showBulkDeleteModal}
        onClose={cancelBulkDelete}
        title="선택 항목 삭제"
        size={ModalComponent.SIZES.SMALL}
        closeOnOverlayClick={true}
      >
        <ModalComponent.Section>
          <p style={{ fontSize: '16px', color: '#666', margin: '0 0 20px 0', textAlign: 'center' }}>
            선택된 <strong style={{ color: '#dc2626' }}>{selectedMeals.length}개</strong> 항목을 삭제하시겠습니까?
          </p>
          <p style={{ fontSize: '14px', color: '#999', margin: 0, textAlign: 'center' }}>
            삭제된 항목은 복구할 수 없습니다.
          </p>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant="danger"
            size="medium"
            onClick={confirmBulkDelete}
            style={{ marginRight: '8px' }}
          >
            삭제
          </ButtonComponent>
          <ButtonComponent
            variant="secondary"
            size="medium"
            onClick={cancelBulkDelete}
          >
            취소
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>

      <ModalComponent
        isOpen={showAlertModal}
        onClose={closeAlert}
        title={alertType === "success" ? "성공" : "오류"}
        size={ModalComponent.SIZES.SMALL}
        closeOnOverlayClick={true}
      >
        <ModalComponent.Section>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              color: alertType === "success" ? '#28a745' : '#dc3545'
            }}>
              {alertType === "success" ? '✓' : '⚠'}
            </div>
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              margin: '0 0 10px 0',
              lineHeight: '1.5'
            }}>
              {alertMessage}
            </p>
          </div>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant={alertType === "success" ? "primary" : "danger"}
            size="medium"
            onClick={closeAlert}
          >
            확인
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>
    </div>
  );
}