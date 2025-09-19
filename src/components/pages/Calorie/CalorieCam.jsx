import React, { useState, useRef } from 'react';
import ButtonComponent from '../../common/ButtonComponent';

const CalorieCam = () => {
  console.log("CalorieCam 컴포넌트가 렌더링되었습니다!");
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreviewUrl(url);
      setAnalysisResult(null);
      setErrorMsg('');
      console.log("파일이 선택되었습니다:", file.name);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreviewUrl('');
    setAnalysisResult(null);
    setErrorMsg('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const analyzeImage = async () => {
    if (!imageFile) return;

    setIsLoading(true);
    setErrorMsg('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile); // 'image' 대신 'file' 사용
      formData.append('assume_grams', '200'); // 기본 그램 수
      formData.append('gramsBoost', '1.0'); // 그램 부스트

      console.log('분석 요청 시작...');
      console.log('FormData 내용:', {
        file: imageFile.name,
        assume_grams: '200',
        gramsBoost: '1.0'
      });
      
      const response = await fetch('/ml/analyze', {
        method: 'POST',
        body: formData,
      });

      console.log('응답 상태:', response.status);
      console.log('응답 헤더:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('에러 응답:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('분석 결과:', result);
      
      // 원래 백엔드 응답 형식에 맞게 변환
      const transformedResult = {
        foodName: result.label || '알 수 없는 음식',
        calories: Math.round(result.calories || 0),
        nutrients: {
          '단백질': `${Math.round((result.protein_g || 0) * 10) / 10}g`,
          '탄수화물': `${Math.round((result.carbs_g || 0) * 10) / 10}g`,
          '지방': `${Math.round((result.fat_g || 0) * 10) / 10}g`,
          '식이섬유': `${Math.round((result.fiber_g || 0) * 10) / 10}g`,
        },
        alternatives: result.meta?.clip_top5?.slice(0, 3).map(item => item.label) || [],
        confidence: result.confidence || 0,
        grams: Math.round(result.grams || 0),
        meta: {
          ...result.meta,
          originalAnalysis: {
            calories: result.calories,
            protein_g: result.protein_g,
            carbs_g: result.carbs_g,
            fat_g: result.fat_g,
            fiber_g: result.fiber_g,
            grams: result.grams,
            label: result.label
          }
        }, // 원본 분석 데이터 보존
      };
      
      setAnalysisResult(transformedResult);
      
      // 분석 완료 후 자동으로 식사 로그에 저장
      await saveMealLogAutomatically(result);
      
    } catch (error) {
      console.error('분석 중 오류 발생:', error);
      setErrorMsg('이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 저장 함수 (원래 로직)
  const saveMealLogAutomatically = async (analysisData) => {
    try {
      const mealLogData = {
        user_id: 'demo',
        timestamp: new Date().toISOString(),
        label: analysisData.label,
        grams: Math.round(analysisData.grams),
        calories: Math.round(analysisData.calories),
        protein_g: Math.round(analysisData.protein_g * 10) / 10,
        carbs_g: Math.round(analysisData.carbs_g * 10) / 10,
        fat_g: Math.round(analysisData.fat_g * 10) / 10,
        fiber_g: Math.round(analysisData.fiber_g * 10) / 10,
        meta: analysisData.meta
      };

      console.log('자동 저장 시작:', mealLogData);

      const response = await fetch('/ml/meal-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealLogData),
      });

      if (response.ok) {
        const savedMeal = await response.json();
        console.log('식사 로그 자동 저장 완료:', savedMeal);
        alert(`식사 정보가 자동으로 저장되었습니다!\n음식: ${savedMeal.label}\n칼로리: ${savedMeal.calories}kcal`);
      } else {
        const errorData = await response.json();
        console.error('자동 저장 실패:', errorData);
        alert('자동 저장에 실패했습니다. 수동으로 저장해주세요.');
      }
    } catch (error) {
      console.error('자동 저장 중 오류:', error);
      alert('자동 저장 중 오류가 발생했습니다. 수동으로 저장해주세요.');
    }
  };

  const saveMealData = async () => {
    if (!analysisResult) return;

    try {
      // analysisResult에서 원본 분석 데이터를 추출
      const originalData = analysisResult.meta?.originalAnalysis || {
        calories: analysisResult.calories,
        protein_g: parseFloat(analysisResult.nutrients['단백질'].replace('g', '')),
        carbs_g: parseFloat(analysisResult.nutrients['탄수화물'].replace('g', '')),
        fat_g: parseFloat(analysisResult.nutrients['지방'].replace('g', '')),
        fiber_g: parseFloat(analysisResult.nutrients['식이섬유'].replace('g', ''))
      };

      const mealLogData = {
        user_id: 'demo',
        timestamp: new Date().toISOString(),
        label: analysisResult.foodName,
        grams: analysisResult.grams,
        calories: originalData.calories,
        protein_g: originalData.protein_g,
        carbs_g: originalData.carbs_g,
        fat_g: originalData.fat_g,
        fiber_g: originalData.fiber_g,
        meta: analysisResult.meta
      };

      console.log('수동 저장 시작:', mealLogData);

      const response = await fetch('/ml/meal-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mealLogData),
      });

      if (response.ok) {
        const savedMeal = await response.json();
        console.log('식사 로그 수동 저장 완료:', savedMeal);
        alert(`식사 정보가 저장되었습니다!\n음식: ${savedMeal.label}\n칼로리: ${savedMeal.calories}kcal`);
      } else {
        const errorData = await response.json();
        console.error('수동 저장 실패:', errorData);
        alert(`저장 실패: ${errorData?.detail || response.statusText}`);
      }
    } catch (error) {
      console.error('저장 중 오류:', error);
      alert('식사 정보 저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary mb-2">
              칼로리 캠
            </h2>
            <p className="text-muted">음식 사진을 찍어서 칼로리와 영양소를 분석해보세요</p>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-body text-center p-5">
              {!imagePreviewUrl ? (
                <div>
                  <h5 className="text-muted mb-4">음식 사진을 업로드하세요</h5>
                  <ButtonComponent 
                    variant="primary"
                    size="lg"
                    onClick={handleUploadClick}
                  >
                    사진 업로드
                  </ButtonComponent>
                </div>
              ) : (
                <div>
                  <img
                    src={imagePreviewUrl}
                    alt="업로드된 음식"
                    className="img-fluid rounded mb-3"
                    style={{ maxHeight: "300px", objectFit: "cover" }}
                  />
                  <div className="d-flex gap-2 justify-content-center">
                    <ButtonComponent 
                      variant="outline-secondary"
                      onClick={resetImage}
                    >
                      다른 사진 선택
                    </ButtonComponent>
                    <ButtonComponent 
                      variant="success"
                      onClick={analyzeImage}
                      disabled={isLoading}
                    >
                      {isLoading ? '분석 중...' : '분석하기'}
                    </ButtonComponent>
                  </div>
                </div>
              )}

              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="card shadow-sm mb-4">
              <div className="card-body text-center py-4">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">로딩 중...</span>
                </div>
                <p className="text-muted">이미지를 분석하고 있습니다...</p>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {errorMsg && (
            <div className="alert alert-danger mb-4">
              <strong>오류:</strong> {errorMsg}
            </div>
          )}

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="card shadow-sm mb-4">
              <div className="card-body">
                <h5 className="fw-bold mb-3">분석 결과</h5>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-primary mb-2">음식명</h6>
                      <p className="mb-0 fw-bold">{analysisResult.foodName}</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-primary mb-2">칼로리</h6>
                      <p className="mb-0 fw-bold">{analysisResult.calories} kcal</p>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="bg-light p-3 rounded">
                      <h6 className="text-primary mb-2">예상 중량</h6>
                      <p className="mb-0 fw-bold">{analysisResult.grams}g</p>
                    </div>
                  </div>
                </div>

                {analysisResult.confidence && (
                  <div className="mb-3">
                    <div className="bg-info bg-opacity-10 p-2 rounded">
                      <small className="text-muted">AI 신뢰도: {(analysisResult.confidence * 100).toFixed(1)}%</small>
                    </div>
                  </div>
                )}

                {analysisResult.nutrients && (
                  <div className="mb-3">
                    <h6 className="text-primary mb-2">영양소 정보</h6>
                    <div className="row g-2">
                      {Object.entries(analysisResult.nutrients).map(([key, value]) => (
                        <div key={key} className="col-6 col-md-4">
                          <div className="bg-light p-2 rounded text-center">
                            <small className="text-muted d-block">{key}</small>
                            <span className="fw-bold">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysisResult.alternatives && analysisResult.alternatives.length > 0 && (
                  <div className="mb-3">
                    <h6 className="text-primary mb-2">대안 음식</h6>
                    <div className="d-flex flex-wrap gap-2">
                      {analysisResult.alternatives.map((alt, index) => (
                        <span key={index} className="badge bg-secondary">
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center mt-4">
                  <ButtonComponent 
                    variant="primary"
                    onClick={saveMealData}
                  >
                    식사 정보 저장
                  </ButtonComponent>
                </div>
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <h6 className="alert-heading">💡 사용 방법</h6>
            <ul className="mb-0">
              <li>음식이 잘 보이도록 사진을 찍어주세요</li>
              <li>조명이 충분한 곳에서 촬영하면 더 정확합니다</li>
              <li>한 번에 하나의 음식만 분석할 수 있습니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalorieCam;