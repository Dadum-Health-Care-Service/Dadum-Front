import React, { useState, useEffect, useContext } from 'react';
import { useApi } from '../../../../utils/api/useApi';
import { AuthContext } from '../../../../context/AuthContext';
import ButtonComponent from '../../../common/ButtonComponent';
import CardComponent from '../../../common/CardComponent';
import InputComponent from '../../../common/InputComponent';
import TextareaComponent from '../../../common/TextareaComponent';
import SelectComponent from '../../../common/SelectComponent';
import AddressSearch from '../AddressSearch';
import styles from './SellerSettings.module.css';

const SellerSettings = () => {
  const { GET, POST, PUT } = useApi();
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 설정 데이터 상태
  const [profileData, setProfileData] = useState({
    businessName: '',
    businessNumber: '',
    representativeName: '',
    address: '',
    zipCode: '',
    detailAddress: '',
    phoneNumber: '',
    email: '',
    bankAccount: '',
    bankName: '',
    accountHolder: ''
  });

  const [storeData, setStoreData] = useState({
    storeName: '',
    storeDescription: '',
    storeLogo: '',
    operatingHours: '',
    deliveryFee: 0,
    freeShippingThreshold: 0,
    shippingPolicy: ''
  });

  const [billingData, setBillingData] = useState({
    settlementCycle: 'weekly',
    settlementAccount: '',
    taxInvoiceEmail: '',
    platformFee: 3.5,
    paymentFee: 2.9
  });

  const [notificationData, setNotificationData] = useState({
    orderNotification: true,
    shippingNotification: true,
    refundNotification: true,
    autoResponse: false,
    responseTemplate: '',
    announcement: ''
  });

  // 설정 섹션 정의
  const settingsSections = [
    {
      id: 'profile',
      label: '계정 정보',
      icon: '👤',
      description: '사업자 정보 및 정산 계좌 관리'
    },
    {
      id: 'store',
      label: '스토어 설정',
      icon: '🏪',
      description: '스토어 정보 및 배송 정책'
    },
    {
      id: 'billing',
      label: '정산 관리',
      icon: '💰',
      description: '정산 주기 및 수수료 정책'
    },
    {
      id: 'notifications',
      label: '알림 설정',
      icon: '🔔',
      description: '자동 알림 및 응답 템플릿'
    }
  ];

  // 데이터 로드
  const loadSettingsData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔧 판매자 설정 데이터 로드 시작');
      console.log('🔧 현재 사용자:', user);
      console.log('🔧 Access Token:', user?.accessToken);

      // 사용자가 로그인하지 않은 경우 처리
      if (!user || !user.accessToken) {
        console.error('❌ 사용자가 로그인하지 않았거나 토큰이 없습니다.');
        setError('로그인이 필요합니다. 로그인 후 다시 시도해주세요.');
        return;
      }

      // 각 섹션별 데이터 로드
      const [profileResponse, storeResponse, billingResponse, notificationResponse] = await Promise.allSettled([
        GET('/seller/settings/profile'),
        GET('/seller/settings/store'),
        GET('/seller/settings/billing'),
        GET('/seller/settings/notifications')
      ]);

      if (profileResponse.status === 'fulfilled') {
        setProfileData(profileResponse.value.data);
      }
      if (storeResponse.status === 'fulfilled') {
        setStoreData(storeResponse.value.data);
      }
      if (billingResponse.status === 'fulfilled') {
        setBillingData(billingResponse.value.data);
      }
      if (notificationResponse.status === 'fulfilled') {
        setNotificationData(notificationResponse.value.data);
      }

    } catch (err) {
      console.error('설정 데이터 로드 실패:', err);
      setError('설정 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 설정 저장
  const saveSettings = async (section, data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await PUT(`/seller/settings/${section}`, data);
      setSuccess('설정이 성공적으로 저장되었습니다.');

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('설정 저장 실패:', err);
      setError('설정 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 사용자가 로그인한 경우에만 데이터 로드
    if (user && user.accessToken) {
      loadSettingsData();
    } else {
      console.log('🔧 사용자가 로그인하지 않음 - 데이터 로드 건너뜀');
    }
  }, [user]);

  // 주소 선택 핸들러
  const handleAddressSelect = (addressData) => {
    setProfileData({
      ...profileData,
      zipCode: addressData.zipCode,
      address: addressData.address,
      detailAddress: addressData.detailAddress
    });
  };

  // 계정 정보 섹션 렌더링
  const renderProfileSection = () => (
    <div className={styles.sectionContent}>
      <h3 className={styles.sectionTitle}>사업자 정보</h3>
      <div className={styles.formGrid}>
        <InputComponent
          label="상호명"
          value={profileData.businessName}
          onChange={(e) => setProfileData({...profileData, businessName: e.target.value})}
          placeholder="회사명 또는 상호명을 입력하세요"
        />
        <InputComponent
          label="사업자등록번호"
          value={profileData.businessNumber}
          onChange={(e) => setProfileData({...profileData, businessNumber: e.target.value})}
          placeholder="000-00-00000"
        />
        <InputComponent
          label="대표자명"
          value={profileData.representativeName}
          onChange={(e) => setProfileData({...profileData, representativeName: e.target.value})}
          placeholder="대표자 성명을 입력하세요"
        />
        <div className={styles.addressSection}>
          <label className={styles.formLabel}>사업장 주소</label>
          <div className={styles.addressRow}>
            <InputComponent
              label=""
              value={profileData.zipCode || ''}
              placeholder="우편번호"
              readOnly
              className={styles.zipCodeInput}
            />
            <AddressSearch 
              onAddressSelect={handleAddressSelect}
              buttonText="우편번호"
            />
          </div>
          <InputComponent
            label=""
            value={profileData.address || ''}
            placeholder="기본주소"
            readOnly
            className={styles.addressInput}
          />
          <InputComponent
            label=""
            value={profileData.detailAddress}
            onChange={(e) => setProfileData({...profileData, detailAddress: e.target.value})}
            placeholder="상세주소 (동/호수 등)"
            className={styles.detailAddressInput}
          />
        </div>
      </div>

      <h3 className={styles.sectionTitle}>정산 계좌 정보</h3>
      <div className={styles.formGrid}>
        <SelectComponent
          label="은행"
          value={profileData.bankName}
          onChange={(e) => setProfileData({...profileData, bankName: e.target.value})}
          options={[
            { value: 'kb', label: '국민은행' },
            { value: 'shinhan', label: '신한은행' },
            { value: 'woori', label: '우리은행' },
            { value: 'hana', label: '하나은행' },
            { value: 'nh', label: '농협은행' }
          ]}
        />
        <InputComponent
          label="계좌번호"
          value={profileData.bankAccount}
          onChange={(e) => setProfileData({...profileData, bankAccount: e.target.value})}
          placeholder="계좌번호를 입력하세요"
        />
        <InputComponent
          label="예금주명"
          value={profileData.accountHolder}
          onChange={(e) => setProfileData({...profileData, accountHolder: e.target.value})}
          placeholder="예금주명을 입력하세요"
        />
      </div>

      <h3 className={styles.sectionTitle}>연락처 정보</h3>
      <div className={styles.formGrid}>
        <InputComponent
          label="연락처"
          value={profileData.phoneNumber}
          onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
          placeholder="010-0000-0000"
        />
        <InputComponent
          label="이메일"
          value={profileData.email}
          onChange={(e) => setProfileData({...profileData, email: e.target.value})}
          placeholder="example@email.com"
          type="email"
        />
      </div>

      <div className={styles.buttonGroup}>
        <ButtonComponent
          variant="primary"
          onClick={() => saveSettings('profile', profileData)}
          disabled={loading}
        >
          {loading ? '저장 중...' : '계정 정보 저장'}
        </ButtonComponent>
      </div>
    </div>
  );

  // 스토어 설정 섹션 렌더링
  const renderStoreSection = () => (
    <div className={styles.sectionContent}>
      <h3 className={styles.sectionTitle}>스토어 기본 정보</h3>
      <div className={styles.formGrid}>
        <InputComponent
          label="스토어 이름"
          value={storeData.storeName}
          onChange={(e) => setStoreData({...storeData, storeName: e.target.value})}
          placeholder="스토어 이름을 입력하세요"
        />
        <TextareaComponent
          label="스토어 소개"
          value={storeData.storeDescription}
          onChange={(e) => setStoreData({...storeData, storeDescription: e.target.value})}
          placeholder="스토어에 대한 간단한 소개를 작성하세요"
          rows={4}
        />
        <InputComponent
          label="운영 시간"
          value={storeData.operatingHours}
          onChange={(e) => setStoreData({...storeData, operatingHours: e.target.value})}
          placeholder="예: 평일 09:00-18:00, 주말 휴무"
        />
      </div>

      <h3 className={styles.sectionTitle}>배송 정책</h3>
      <div className={styles.formGrid}>
        <InputComponent
          label="기본 배송비"
          value={storeData.deliveryFee}
          onChange={(e) => setStoreData({...storeData, deliveryFee: e.target.value})}
          placeholder="3000"
          type="number"
        />
        <InputComponent
          label="무료배송 기준금액"
          value={storeData.freeShippingThreshold}
          onChange={(e) => setStoreData({...storeData, freeShippingThreshold: e.target.value})}
          placeholder="50000"
          type="number"
        />
        <TextareaComponent
          label="배송 정책"
          value={storeData.shippingPolicy}
          onChange={(e) => setStoreData({...storeData, shippingPolicy: e.target.value})}
          placeholder="배송 관련 정책을 작성하세요"
          rows={3}
        />
      </div>

      <div className={styles.buttonGroup}>
        <ButtonComponent
          variant="primary"
          onClick={() => saveSettings('store', storeData)}
          disabled={loading}
        >
          {loading ? '저장 중...' : '스토어 설정 저장'}
        </ButtonComponent>
      </div>
    </div>
  );

  // 정산 관리 섹션 렌더링
  const renderBillingSection = () => (
    <div className={styles.sectionContent}>
      <h3 className={styles.sectionTitle}>정산 설정</h3>
      <div className={styles.formGrid}>
        <SelectComponent
          label="정산 주기"
          value={billingData.settlementCycle}
          onChange={(e) => setBillingData({...billingData, settlementCycle: e.target.value})}
          options={[
            { value: 'weekly', label: '주간 정산 (매주 월요일)' },
            { value: 'biweekly', label: '격주 정산 (2주마다)' },
            { value: 'monthly', label: '월간 정산 (매월 1일)' }
          ]}
        />
        <InputComponent
          label="세금계산서 발행 이메일"
          value={billingData.taxInvoiceEmail}
          onChange={(e) => setBillingData({...billingData, taxInvoiceEmail: e.target.value})}
          placeholder="tax@company.com"
          type="email"
        />
      </div>

      <h3 className={styles.sectionTitle}>수수료 정보</h3>
      <div className={styles.feeInfo}>
        <div className={styles.feeItem}>
          <span className={styles.feeLabel}>플랫폼 수수료</span>
          <span className={styles.feeValue}>{billingData.platformFee}%</span>
        </div>
        <div className={styles.feeItem}>
          <span className={styles.feeLabel}>결제 수수료</span>
          <span className={styles.feeValue}>{billingData.paymentFee}%</span>
        </div>
        <div className={styles.feeItem}>
          <span className={styles.feeLabel}>총 수수료</span>
          <span className={styles.feeValue}>{billingData.platformFee + billingData.paymentFee}%</span>
        </div>
      </div>

      <div className={styles.buttonGroup}>
        <ButtonComponent
          variant="primary"
          onClick={() => saveSettings('billing', billingData)}
          disabled={loading}
        >
          {loading ? '저장 중...' : '정산 설정 저장'}
        </ButtonComponent>
      </div>
    </div>
  );

  // 토글 스위치 컴포넌트
  const ToggleSwitch = ({ label, checked, onChange }) => (
    <div className={styles.toggleItem}>
      <label className={styles.toggleLabel}>
        <span className={styles.toggleText}>{label}</span>
        <div className={styles.toggleSwitch}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className={styles.toggleInput}
          />
          <span className={styles.toggleSlider}></span>
        </div>
      </label>
    </div>
  );

  // 알림 설정 섹션 렌더링
  const renderNotificationSection = () => (
    <div className={styles.sectionContent}>
      <h3 className={styles.sectionTitle}>자동 알림 설정</h3>
      <div className={styles.toggleGroup}>
        <ToggleSwitch
          label="주문 접수 알림"
          checked={notificationData.orderNotification}
          onChange={(checked) => setNotificationData({...notificationData, orderNotification: checked})}
        />
        <ToggleSwitch
          label="배송 시작 알림"
          checked={notificationData.shippingNotification}
          onChange={(checked) => setNotificationData({...notificationData, shippingNotification: checked})}
        />
        <ToggleSwitch
          label="환불 완료 알림"
          checked={notificationData.refundNotification}
          onChange={(checked) => setNotificationData({...notificationData, refundNotification: checked})}
        />
        <ToggleSwitch
          label="자동 응답 활성화"
          checked={notificationData.autoResponse}
          onChange={(checked) => setNotificationData({...notificationData, autoResponse: checked})}
        />
      </div>

      <h3 className={styles.sectionTitle}>응답 템플릿</h3>
      <TextareaComponent
        label="자동 응답 메시지"
        value={notificationData.responseTemplate}
        onChange={(e) => setNotificationData({...notificationData, responseTemplate: e.target.value})}
        placeholder="고객 문의에 대한 자동 응답 메시지를 작성하세요"
        rows={4}
      />

      <h3 className={styles.sectionTitle}>공지사항</h3>
      <TextareaComponent
        label="스토어 공지사항"
        value={notificationData.announcement}
        onChange={(e) => setNotificationData({...notificationData, announcement: e.target.value})}
        placeholder="고객에게 전달할 공지사항을 작성하세요"
        rows={3}
      />

      <div className={styles.buttonGroup}>
        <ButtonComponent
          variant="primary"
          onClick={() => saveSettings('notifications', notificationData)}
          disabled={loading}
        >
          {loading ? '저장 중...' : '알림 설정 저장'}
        </ButtonComponent>
      </div>
    </div>
  );

  // 섹션별 콘텐츠 렌더링
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return renderProfileSection();
      case 'store':
        return renderStoreSection();
      case 'billing':
        return renderBillingSection();
      case 'notifications':
        return renderNotificationSection();
      default:
        return renderProfileSection();
    }
  };

  // 사용자가 로그인하지 않은 경우
  if (!user || !user.accessToken) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>⚙️ 판매자 설정</h1>
          <p className={styles.subtitle}>스토어 운영에 필요한 모든 설정을 관리하세요</p>
        </div>
        <div className={styles.alert}>
          <div className={styles.alertError}>
            ❌ 로그인이 필요합니다. 로그인 후 다시 시도해주세요.
          </div>
        </div>
      </div>
    );
  }

  if (loading && !success) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">로딩중...</span>
        </div>
        <p className={styles.loadingText}>설정 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>⚙️ 판매자 설정</h1>
        <p className={styles.subtitle}>스토어 운영에 필요한 모든 설정을 관리하세요</p>
      </div>

      {/* 성공/에러 메시지 */}
      {success && (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          ✅ {success}
        </div>
      )}
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          ❌ {error}
        </div>
      )}

      <div className={styles.settingsLayout}>
        {/* 사이드바 */}
        <div className={styles.sidebar}>
          <nav className={styles.sidebarNav}>
            {settingsSections.map((section) => (
              <button
                key={section.id}
                className={`${styles.sidebarItem} ${
                  activeSection === section.id ? styles.active : ''
                }`}
                onClick={() => setActiveSection(section.id)}
              >
                <span className={styles.sidebarIcon}>{section.icon}</span>
                <div className={styles.sidebarContent}>
                  <span className={styles.sidebarLabel}>{section.label}</span>
                  <span className={styles.sidebarDescription}>{section.description}</span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* 메인 콘텐츠 */}
        <div className={styles.mainContent}>
          <CardComponent className={styles.contentCard}>
            {renderSectionContent()}
          </CardComponent>
        </div>
      </div>
    </div>
  );
};

export default SellerSettings;
