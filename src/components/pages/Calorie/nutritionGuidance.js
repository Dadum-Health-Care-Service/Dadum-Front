// nutritionGuidance.js
// ─────────────────────────────────────────────────────────────
// KDRI 기반 코칭 유틸
// - 단백질 RNI: ~0.91 g/kg/day (성인)
// - 식이섬유 AI(하루): 남 25 g, 여 20 g
// - AMDR(에너지 비율): 탄수 55–65%, 지방 15–30%, 단백질 7–20%
// 앱은 "한 끼" 분석이므로 일일 기준을 mealsPerDay(기본 3끼)로 나눠 판단
// ─────────────────────────────────────────────────────────────

export const KDRI = {
  PROTEIN_RNI_G_PER_KG_PER_DAY: 0.91, // g/kg/day
  FIBER_AI_DAY: { male: 25, female: 20 }, // g/day
  AMDR: {
    carb:   { min: 55, max: 65 }, // %
    fat:    { min: 15, max: 30 }, // %
    protein:{ min: 7,  max: 20 }, // %
  },
};

export function deriveBasics({ calories, protein_g, carb_g, fat_g, grams }) {
  const Pkcal = (Number(protein_g) || 0) * 4;
  const Ckcal = (Number(carb_g) || 0) * 4;
  const Fkcal = (Number(fat_g) || 0) * 9;
  const total = Math.max(1, Pkcal + Ckcal + Fkcal);

  const pctProtein = Math.round((Pkcal / total) * 1000) / 10; // 소수 1자리
  const pctCarb    = Math.round((Ckcal / total) * 1000) / 10;
  const pctFat     = Math.round((Fkcal / total) * 1000) / 10;

  const safeGrams = Math.max(1, Number(grams) || 0);
  const kcalPer100g = Math.round(((Number(calories) || total) / safeGrams) * 100);

  return { totalKcal: total, pctProtein, pctCarb, pctFat, kcalPer100g };
}

/**
 * KDRI 근거 코칭 생성
 * @param {{ calories:number, grams:number, protein_g:number, carb_g:number, fat_g:number, fiber_g:number }} data
 * @param {{ sex?:'male'|'female', weightKg?:number, mealsPerDay?:number }} user
 * @returns {string}
 */
export function getCoachingTipKDRI(data, user = {}) {
  const sex = user.sex === 'female' ? 'female' : (user.sex === 'male' ? 'male' : undefined);
  const weightKg = Number(user.weightKg) || undefined;
  const mealsPerDay = Math.max(1, Number(user.mealsPerDay) || 3);

  const p = Number(data.protein_g)||0;
  const c = Number(data.carb_g)||0;
  const f = Number(data.fat_g)||0;
  const fi = Number(data.fiber_g)||0;
  const kcal = Number(data.calories)||0;
  const g = Number(data.grams)||0;

  const { pctProtein, pctCarb, pctFat, kcalPer100g } = deriveBasics({
    calories: kcal, protein_g: p, carb_g: c, fat_g: f, grams: g
  });

  // 한 끼 목표치
  const fiberTargetPerMeal =
    (sex ? KDRI.FIBER_AI_DAY[sex] : 22.5) / mealsPerDay; // 성별 미상 시 남녀 평균 22.5g/일 사용
  const proteinTargetPerMeal_g = weightKg
    ? (KDRI.PROTEIN_RNI_G_PER_KG_PER_DAY * weightKg) / mealsPerDay
    : undefined; // 체중 없으면 AMDR로 대신 평가

  const tips = [];

  // 1) 식이섬유
  if (fi >= fiberTargetPerMeal + 1) {
    tips.push("식이섬유가 충분합니다. 포만감과 혈당 관리에 도움이 됩니다.");
  } else if (fi < fiberTargetPerMeal - 1) {
    tips.push("식이섬유가 부족합니다. 샐러드, 통곡물, 과일을 곁들여 보세요.");
  }

  // 2) 단백질
  if (proteinTargetPerMeal_g != null) {
    if (p >= proteinTargetPerMeal_g) {
      tips.push("단백질이 권장량을 잘 채웠습니다.");
    } else {
      tips.push(`단백질이 부족합니다(목표 약 ${Math.round(proteinTargetPerMeal_g)}g/끼). 달걀, 두부, 살코기를 추가해 보세요.`);
    }
  } else {
    if (pctProtein < KDRI.AMDR.protein.min) {
      tips.push("단백질 비중이 낮습니다(AMDR 미만). 단백질 식품을 추가해 보세요.");
    } else if (pctProtein > KDRI.AMDR.protein.max) {
      tips.push("단백질 비중이 높습니다. 전체 균형을 확인해 보세요.");
    } else {
      tips.push("단백질 비중이 권장 범위(AMDR) 내에 있습니다.");
    }
  }

  // 3) 탄수화물·지방 AMDR
  const carbR = KDRI.AMDR.carb, fatR = KDRI.AMDR.fat;
  if (pctCarb < carbR.min) tips.push("탄수화물 비중이 낮습니다. 통곡물과 과일로 균형을 맞춰보세요.");
  else if (pctCarb > carbR.max) tips.push("탄수화물 비중이 높습니다. 단백질과 채소를 늘려 균형을 맞춰보세요.");

  if (pctFat < fatR.min) tips.push("지방 비중이 낮습니다. 견과류와 올리브오일 등 건강한 지방을 보충해 보세요.");
  else if (pctFat > fatR.max) tips.push("지방 비중이 높은 편입니다. 조리법을 담백하게 조절해 보세요.");

  // 4) 에너지 밀도(참고)
  if (kcalPer100g >= 250) tips.push("에너지 밀도가 높은 음식입니다(≥250kcal/100g). 양 조절이나 채소 곁들이기를 권장합니다.");
  else if (kcalPer100g <= 150) tips.push("에너지 밀도가 낮아 비교적 가볍게 드실 수 있습니다.");

  const unique = Array.from(new Set(tips));
  if (!unique.length) return "균형 잡힌 식사를 위해 단백질과 식이섬유, 채소를 함께 챙겨보세요.";
  return unique.slice(0, 2).join(" ");
}
