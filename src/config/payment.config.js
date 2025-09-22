// 환경별 결제 설정
// 개발/운영 환경에 따라 다른 설정 사용
// 버전: 1.0.1 (캐시 문제 해결)

// 개발 환경 (테스트용) - V2 API 사용
const DEV_CONFIG = {
    IAMPORT_MERCHANT_ID: 'imp45586541', // ✅ V2 API 가맹점 식별코드
    // channelKey 방식 사용 (권장)
    CHANNEL_KEY: 'channel-key-9671eef5-0c71-4a3a-984b-51f4db9cc743',
    // pg 방식 (대안)
    PG_PROVIDER: 'nice_v2', // 나이스페이먼츠 신모듈(V2)
    // V2 API는 API Key가 없고 API Secret만 제공
    // API_KEY: '', // V2 API에는 없음
    API_SECRET: 'hRILlnbJnma5kNc1GFc6EBzCiL89Dch8vNV23hXw3274QoXAE7ft2B8cdgQtRM99PZiL2TVSZxFQTb3M', // ✅ V2 API Secret
    IS_TEST_MODE: true,
    PAYMENT_METHODS: ['card'],
    CURRENCY: 'KRW'
  };
  
  /*
  const PROD_CONFIG = {
    IAMPORT_MERCHANT_ID: '', // 🔴 실제 운영 가맹점 코드 입력
    PG_PROVIDER: 'nice_v2',  // 🔴 실제 운영 PG 설정
    API_KEY: '',             // 🔴 실제 운영 API Key 입력
    CANCEL_PASSWORD: '',     // 🔴 실제 운영 결제취소 비밀번호 입력
    IS_TEST_MODE: false,
    PAYMENT_METHODS: ['card', 'trans', 'vbank', 'phone'],
    CURRENCY: 'KRW'
  };
  */
  
  // 현재 환경 설정 (개발/운영 구분)
  const CURRENT_ENV = process.env.NODE_ENV || 'development';
  
  // 환경에 따른 설정 반환
  export const getPaymentConfig = () => {
    return CURRENT_ENV === 'production' ? PROD_CONFIG : DEV_CONFIG;
  };
  
  // 환경 확인
  export const isProduction = () => CURRENT_ENV === 'production';
  export const isDevelopment = () => CURRENT_ENV === 'development';
  
  // 설정 업데이트 함수
  export const updatePaymentConfig = (newConfig) => {
    if (CURRENT_ENV === 'development') {
      Object.assign(DEV_CONFIG, newConfig);
    } else {
      Object.assign(PROD_CONFIG, newConfig);
    }
  };
  