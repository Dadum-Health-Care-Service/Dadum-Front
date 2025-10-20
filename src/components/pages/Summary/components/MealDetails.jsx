import React from "react";
import ContainerComponent from "../../../common/ContainerComponent";
import ButtonComponent from "../../../common/ButtonComponent";

const MealDetails = ({ 
  meals, 
  loading,
  selectedMeals,
  editGrams,
  editLabel,
  toggleMealSelection,
  toggleSelectAll,
  bulkSave,
  bulkDelete,
  handleSaveClick,
  handleDeleteClick,
  setEditGrams,
  setEditLabel,
  setTotals,
  totals,
  setSelectedMeals
}) => {
  if (!meals || meals.length === 0) return null;

  // 실시간 영양소 계산 함수
  const calculateNutrition = (meal, newGrams) => {
    if (!newGrams || newGrams <= 0) return meal;
    
    const ratio = newGrams / meal.grams;
    return {
      ...meal,
      calories: Math.round(meal.calories * ratio),
      protein_g: Math.round(meal.protein_g * ratio * 10) / 10,
      carbs_g: Math.round(meal.carbs_g * ratio * 10) / 10,
      fat_g: Math.round(meal.fat_g * ratio * 10) / 10,
      fiber_g: Math.round(meal.fiber_g * ratio * 10) / 10,
      grams: newGrams
    };
  };

  // 실시간 총합 계산 함수
  const calculateRealTimeTotals = () => {
    const calculatedTotals = meals.reduce((acc, meal) => {
      const currentGrams = editGrams[meal.id] ?? meal.grams;
      const calculatedMeal = calculateNutrition(meal, currentGrams);
      
      return {
        calories: acc.calories + calculatedMeal.calories,
        protein_g: acc.protein_g + calculatedMeal.protein_g,
        carbs_g: acc.carbs_g + calculatedMeal.carbs_g,
        fat_g: acc.fat_g + calculatedMeal.fat_g,
        fiber_g: acc.fiber_g + calculatedMeal.fiber_g,
      };
    }, { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 });

    return calculatedTotals;
  };

  // 중량 변경 시 실시간 계산 및 총합 업데이트
  const handleGramsChange = (mealId, newGrams) => {
    setEditGrams((s) => ({ ...s, [mealId]: newGrams }));
    
    // 실시간 총합 업데이트
    const realTimeTotals = calculateRealTimeTotals();
    setTotals(realTimeTotals);
  };

  return (
    <ContainerComponent className="report-section">
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#212121', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '2px solid #D6E4FF' }}>
        식사 상세 기록
      </h2>
      <div className="table-responsive">
        {/* 일괄 작업 버튼 */}
        {meals.length > 0 && (
          <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: '#64748B', fontWeight: '500' }}>
              선택된 항목: {selectedMeals.length}개
            </span>
            {selectedMeals.length > 0 && (
              <>
                <ButtonComponent
                  variant="primary"
                  size="small"
                  onClick={bulkSave}
                >
                  선택 항목 저장
                </ButtonComponent>
                <ButtonComponent
                  variant="danger"
                  size="small"
                  onClick={bulkDelete}
                >
                  선택 항목 삭제
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  size="small"
                  onClick={() => setSelectedMeals([])}
                >
                  선택 해제
                </ButtonComponent>
              </>
            )}
          </div>
        )}
        
        <table className="data-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedMeals.length === meals.length && meals.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>시간</th>
              <th>음식명</th>
              <th>중량(g)</th>
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
                  <input
                    type="checkbox"
                    checked={selectedMeals.includes(m.id)}
                    onChange={() => toggleMealSelection(m.id)}
                  />
                </td>
                <td>
                  {new Date(m.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td>
                  <input
                    type="text"
                    style={{ 
                      minWidth: "150px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D6E4FF",
                      fontSize: "14px",
                      textTransform: "capitalize"
                    }}
                    value={editLabel[m.id] ?? m.label ?? ""}
                    onChange={(e) =>
                      setEditLabel((s) => ({ ...s, [m.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === "Enter" && handleSaveClick(m.id)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    style={{ 
                      width: "80px",
                      padding: "6px 12px",
                      borderRadius: "8px",
                      border: "1px solid #D6E4FF",
                      fontSize: "14px"
                    }}
                    min={1}
                    step={10}
                    value={editGrams[m.id] ?? m.grams}
                    onChange={(e) => handleGramsChange(m.id, e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveClick(m.id)}
                  />
                </td>
                {(() => {
                  const currentGrams = editGrams[m.id] ?? m.grams;
                  const calculatedMeal = calculateNutrition(m, currentGrams);
                  return (
                    <>
                      <td>{calculatedMeal.calories} kcal</td>
                      <td>{calculatedMeal.protein_g}g</td>
                      <td>{calculatedMeal.carbs_g}g</td>
                      <td>{calculatedMeal.fat_g}g</td>
                      <td>{calculatedMeal.fiber_g}g</td>
                    </>
                  );
                })()}
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <ButtonComponent 
                      variant="primary" 
                      size="small" 
                      onClick={() => handleSaveClick(m.id)}
                    >
                      저장
                    </ButtonComponent>
                    <ButtonComponent
                      variant="danger"
                      size="small"
                      onClick={() => handleDeleteClick(m.id)}
                    >
                      삭제
                    </ButtonComponent>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading && <div className="mt-2" style={{ fontSize: "13px", color: "#718096" }}>불러오는 중…</div>}
    </ContainerComponent>
  );
};

export default MealDetails;
