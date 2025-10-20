import React from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import CardComponent from "../../../common/CardComponent";

const NutritionStats = ({ totals, ratios, calorieBalance, meals, activityStats }) => {
  if (!totals) return null;

  // 칼로리 비율 계산 (각 영양소 열량 / 총 섭취 열량)
  const totalCalories = totals?.calories || 0;
  const pctProteinCalorie = totalCalories > 0 && totals?.protein_g
    ? Math.round(((totals.protein_g * 4) / totalCalories) * 100)
    : 0;
  const pctCarbsCalorie = totalCalories > 0 && totals?.carbs_g
    ? Math.round(((totals.carbs_g * 4) / totalCalories) * 100)
    : 0;
  const pctFatCalorie = totalCalories > 0 && totals?.fat_g
    ? Math.round(((totals.fat_g * 9) / totalCalories) * 100)
    : 0;

  return (
    <ContainerComponent className="report-section">
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
        식단 현황
      </h2>
      <div className="summary-grid">
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>총 칼로리</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {totals?.calories || 0}kcal
            </div>
            <div style={{ fontSize: '12px', color: '#9AA0A6' }}>
              하루 권장량(성인 남/여): 2600 / 2000 kcal
            </div>
          </div>
        </CardComponent>
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>단백질</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {totals?.protein_g || 0}g
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, color: '#9AA0A6' }}>(칼로리 비율 {pctProteinCalorie}%)</div>
          </div>
        </CardComponent>
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>탄수화물</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {totals?.carbs_g || 0}g
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, color: '#9AA0A6' }}>(칼로리 비율 {pctCarbsCalorie}%)</div>
          </div>
        </CardComponent>
        <CardComponent className="summary-card-component">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px', fontWeight: '500', color: '#0A66FF' }}>지방</div>
            <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px', color: '#0A66FF' }}>
              {totals?.fat_g || 0}g
            </div>
            <div style={{ fontSize: '13px', opacity: 0.8, color: '#9AA0A6' }}>(칼로리 비율 {pctFatCalorie}%)</div>
          </div>
        </CardComponent>
      </div>

      <div className="stat-bar">
        <div className="stat-bar-label">
          칼로리 현황
          {!activityStats && (
            <div style={{ fontSize: '11px', color: '#999', fontWeight: 'normal', marginTop: '2px' }}>
              (워치 데이터 없음 - 섭취 칼로리만 표시)
            </div>
          )}
        </div>
        <div className="stat-bar-visual">
          {Math.abs(calorieBalance || 0) > 0 && (
            <div
              className="stat-bar-fill"
              style={{
                width: `${Math.min(100, Math.abs(calorieBalance || 0) / 30)}%`,
                background: (calorieBalance || 0) > 0 
                  ? 'linear-gradient(90deg, #f56565 0%, #e53e3e 100%)'
                  : 'linear-gradient(90deg, #68d391 0%, #48bb78 100%)'
              }}
            >
              {Math.abs(calorieBalance || 0) >= 30 && `${Math.round(calorieBalance || 0)}kcal`}
            </div>
          )}
        </div>
        <div className="stat-bar-value">
          {(calorieBalance || 0) > 0 ? '+' : ''}{calorieBalance || 0}kcal
        </div>
      </div>

      {/* 영양소 비율 바 */}
      <div className="stat-bar">
        <div className="stat-bar-label">단백질 비율</div>
        <div className="stat-bar-visual">
          {(ratios?.protein || 0) > 0 && (
            <div
              className="stat-bar-fill"
              style={{ width: `${ratios?.protein || 0}%`, height: '100%', minHeight: '21px', minWidth: '40px' }}
            >
              {`${ratios?.protein || 0}%`}
            </div>
          )}
        </div>
        <div className="stat-bar-value">{ratios?.protein || 0}%</div>
      </div>
      <div className="stat-bar">
        <div className="stat-bar-label">탄수화물 비율</div>
        <div className="stat-bar-visual">
          {(ratios?.carbs || 0) > 0 && (
            <div className="stat-bar-fill" style={{ width: `${ratios?.carbs || 0}%` }}>
              {(ratios?.carbs || 0) >= 15 && `${ratios?.carbs || 0}%`}
            </div>
          )}
        </div>
        <div className="stat-bar-value">{ratios?.carbs || 0}%</div>
      </div>
      <div className="stat-bar">
        <div className="stat-bar-label">지방 비율</div>
        <div className="stat-bar-visual">
          {(ratios?.fat || 0) > 0 && (
            <div className="stat-bar-fill" style={{ width: `${ratios?.fat || 0}%` }}>
              {(ratios?.fat || 0) >= 15 && `${ratios?.fat || 0}%`}
            </div>
          )}
        </div>
        <div className="stat-bar-value">{ratios?.fat || 0}%</div>
      </div>

      <div className="mt-3" style={{ fontSize: "14px", color: "#718096" }}>
        총 {meals?.length || 0}끼 식사 기록
      </div>
    </ContainerComponent>
  );
};

export default NutritionStats;
