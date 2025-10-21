import React, { useState, useRef } from 'react';
import ButtonComponent from '../../common/ButtonComponent';
import ModalComponent from '../../common/ModalComponent';
import CardComponent from '../../common/CardComponent';
import ContainerComponent from '../../common/ContainerComponent';
import { useApi } from '../../../utils/api/useApi';
import { useAuth } from '../../../context/AuthContext';
import styles from './CalorieCam.module.css';

const CalorieCam = () => {
  console.log("CalorieCam 컴포넌트가 렌더링되었습니다!");
  
  const { POST } = useApi();
  const { user } = useAuth();
  
  // ML 서버 베이스 URL 설정 (DailySummary와 동일)
  const ML_BASE = import.meta.env.VITE_API_URL || "/ml";
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
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

  const closeSaveModal = () => {
    setShowSaveModal(false);
    setSaveMessage('');
  };

  const analyzeImage = async () => {
    if (!imageFile) {
      setErrorMsg('이미지를 먼저 업로드해주세요.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setAnalysisResult(null);

    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('assume_grams', '200');
      formData.append('gramsBoost', '1.0');
      
      console.log('이미지 분석 요청 시작...');
      console.log('FormData 내용:', {
        file: imageFile.name,
        assume_grams: '200',
        gramsBoost: '1.0'
      });
      
      const response = await POST('/analyze', formData, false, 'ai');
      const result = response.data;
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
      console.error('오류 상세:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
        isFoodNameSearch: !!foodName
      });
      
      let errorMessage = foodName 
        ? '음식 정보를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.'
        : '이미지 분석 중 오류가 발생했습니다. 다시 시도해주세요.';
      
      if (error.response?.status === 413) {
        errorMessage = '이미지 파일이 너무 큽니다. 더 작은 이미지를 선택해주세요.';
      } else if (error.response?.status === 400) {
        errorMessage = foodName
          ? '해당 음식 정보를 찾을 수 없습니다. 다른 음식을 선택해주세요.'
          : '이미지 형식이 올바르지 않습니다. JPG, PNG 형식의 이미지를 선택해주세요.';
      } else if (error.response?.status === 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      setErrorMsg(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 자동 저장 함수 (원래 로직)
  const saveMealLogAutomatically = async (analysisData) => {
    try {
      // 사용자 ID 가져오기
      let userId = user?.usersId || localStorage.getItem("usersId");
      if (!userId) {
        console.error('사용자 ID를 찾을 수 없습니다.');
        setSaveMessage('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
        setShowSaveModal(true);
        return;
      }

      const mealLogData = {
        user_id: String(userId),
        timestamp: new Date().toISOString(),
        label: analysisData.label,
        grams: Math.round(analysisData.grams),
        calories: Math.round(analysisData.calories),
        protein_g: Math.round(analysisData.protein_g * 10) / 10,
        carbs_g: Math.round(analysisData.carbs_g * 10) / 10,
        fat_g: Math.round(analysisData.fat_g * 10) / 10,
        fiber_g: Math.round(analysisData.fiber_g * 10) / 10
      };

      console.log('[CalorieCam] 자동 저장 시작:', mealLogData);

      const response = await POST('/meal-log', mealLogData, true, 'ai');
      const savedMeal = response.data;
      console.log('[CalorieCam] 식사 로그 자동 저장 완료:', savedMeal);
      setSaveMessage(`식사 정보가 저장되었습니다!\n음식: ${savedMeal.label}\n칼로리: ${savedMeal.calories}kcal`);
      setShowSaveModal(true);
    } catch (error) {
      console.error('[CalorieCam] 자동 저장 중 오류:', error);
      setSaveMessage('저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      setShowSaveModal(true);
    }
  };

  return (
    <div className={styles.calorieCamPage}>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* AI Tag */}
        <div className={styles.aiTag}>
          <span>칼로리 기록</span>
        </div>

        {/* Main Headline */}
        <h1 className={styles.mainHeadline}>
          음식 사진으로 <span className={styles.highlight}>칼로리</span>를 쉽게 기록
        </h1>

        {/* Description */}
        <p className={styles.description}>
          사진을 업로드하고 분석 결과를 확인하여 건강한 식습관을 관리하세요
        </p>

        {/* Upload Section */}
        <ContainerComponent 
          variant="outlined" 
          className={styles.uploadContainer}
          onClick={handleUploadClick}
        >
          {!imagePreviewUrl ? (
            <div className={styles.uploadArea}>
              <div className={styles.uploadIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 9V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className={styles.uploadTitle}>음식 사진을 업로드하세요</h3>
              <p className={styles.uploadSubtitle}>드래그 앤 드롭 또는 클릭하여 선택</p>
              <ButtonComponent 
                variant="primary"
                size="large"
                className={styles.selectButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadClick();
                }}
              >
                사진 선택
              </ButtonComponent>
            </div>
          ) : (
            <div className={styles.imagePreview}>
              <img
                src={imagePreviewUrl}
                alt="업로드된 음식"
                className={styles.previewImage}
              />
              <div className={styles.imageActions}>
                <ButtonComponent 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUploadClick();
                  }}
                >
                  다른 사진 선택
                </ButtonComponent>
                <ButtonComponent 
                  variant="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    analyzeImage();
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? '분석 중...' : '음식 분석하기'}
                </ButtonComponent>
              </div>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </ContainerComponent>

        {/* Loading State */}
        {isLoading && (
          <ContainerComponent variant="default" className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <div className={styles.spinner}></div>
              <p>음식 정보를 분석하고 있습니다...</p>
            </div>
          </ContainerComponent>
        )}

        {/* Error Message */}
        {errorMsg && (
          <ContainerComponent variant="outlined" className={styles.errorContainer}>
            <div className={styles.errorContent}>
              <strong>오류:</strong> {errorMsg}
            </div>
          </ContainerComponent>
        )}

        {/* Analysis Result */}
        {analysisResult && (
          <ContainerComponent variant="default" className={styles.resultContainer}>
            <h3 className={styles.resultTitle}>분석 결과</h3>
            
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <h4>음식명</h4>
                <p>{analysisResult.foodName}</p>
              </div>
              <div className={styles.resultItem}>
                <h4>칼로리</h4>
                <p>{analysisResult.calories} kcal</p>
              </div>
              <div className={styles.resultItem}>
                <h4>예상 중량</h4>
                <p>{analysisResult.grams}g</p>
              </div>
            </div>

            {analysisResult.nutrients && (
              <div className={styles.nutrients}>
                <h4>영양소 정보</h4>
                <div className={styles.nutrientGrid}>
                  {Object.entries(analysisResult.nutrients).map(([key, value]) => (
                    <div key={key} className={styles.nutrientItem}>
                      <small>{key}</small>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ContainerComponent>
        )}

        {/* Features Section */}
        <div className={styles.featuresSection}>
          <h2 className={styles.sectionTitle}>주요 기능</h2>
          <div className={styles.featuresGrid}>
            <CardComponent className={styles.featureCard}>
              <h3>쉬운 확인</h3>
              <p>사진을 업로드하고 간단하게 칼로리를 확인할 수 있습니다</p>
            </CardComponent>
            <CardComponent className={styles.featureCard}>
              <h3>상세한 기록</h3>
              <p>칼로리, 단백질, 탄수화물, 지방 등 상세한 정보를 기록합니다</p>
            </CardComponent>
            <CardComponent className={styles.featureCard}>
              <h3>건강 추적</h3>
              <p>일일 섭취량을 기록하고 건강한 식습관을 관리하세요</p>
            </CardComponent>
          </div>
        </div>

        {/* How to Use Section */}
        <div className={styles.howToUseSection}>
          <h2 className={styles.sectionTitle}>사용 방법</h2>
          <div className={styles.stepsGrid}>
            <CardComponent className={styles.stepCard}>
              <div className={styles.stepNumber}>1</div>
              <h3>음식 사진 촬영</h3>
              <p>기록하고 싶은 음식의 사진을 명확하게 촬영해주세요</p>
            </CardComponent>
            
            <CardComponent className={styles.stepCard}>
              <div className={styles.stepNumber}>2</div>
              <h3>결과 확인</h3>
              <p>분석된 칼로리와 영양소를 확인하고 건강 목표를 관리하세요</p>
            </CardComponent>
          </div>
        </div>
      </div>

      {/* Save Complete Modal */}
      <ModalComponent
        isOpen={showSaveModal}
        onClose={closeSaveModal}
        title="저장 완료"
        size={ModalComponent.SIZES.SMALL}
        variant={ModalComponent.VARIANTS.LIGHT}
        closeOnOverlayClick={true}
      >
        <ModalComponent.Section>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              color: '#28a745'
            }}>
              ✓
            </div>
            <p style={{ 
              fontSize: '16px', 
              color: '#666', 
              margin: '0 0 10px 0',
              lineHeight: '1.5',
              whiteSpace: 'pre-line'
            }}>
              {saveMessage}
            </p>
          </div>
        </ModalComponent.Section>
        <ModalComponent.Actions align="center">
          <ButtonComponent
            variant="primary"
            size="medium"
            onClick={closeSaveModal}
          >
            확인
          </ButtonComponent>
        </ModalComponent.Actions>
      </ModalComponent>
    </div>
  );
};

export default CalorieCam;