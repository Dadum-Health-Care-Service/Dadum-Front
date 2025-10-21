import { useState, useEffect, useContext } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, Badge, Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import PaymentModal from '../PaymentModal';
import AddressSearch from '../AddressSearch';
import { AuthContext } from '../../../../context/AuthContext';
import styles from './OrderPage.module.css';

export default function OrderPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // 주문자 정보 상태
  const [ordererInfo, setOrdererInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    detailAddress: '',
    zipCode: ''
  });
  
  // 배송 정보 상태
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: '',
    contact1: '',
    contact2: '',
    address: '',
    detailAddress: '',
    zipCode: '',
    deliveryMessage: '',
    depositorName: '',
    deliveryType: 'domestic',
    addressType: 'home'
  });
  
  // 할인 정보 상태
  const [discountInfo, setDiscountInfo] = useState({
    deposit: 0,
    coupon: '',
    availableDeposit: 0
  });
  
  // 동의 상태
  const [agreements, setAgreements] = useState({
    allAgree: false,
    personalInfo: false,
    orderAgree: false
  });

  useEffect(() => {
    // localStorage에서 선택된 상품 정보 가져오기
    const selectedProduct = localStorage.getItem('selectedProduct');
    if (selectedProduct) {
      try {
        const productData = JSON.parse(selectedProduct);
        setProduct(productData);
        setLoading(false);
      } catch (error) {
        console.error('상품 정보 파싱 실패:', error);
        setLoading(false);
      }
    } else {
      // 상품 정보가 없으면 기본 상품 사용
      fetchOrderPageData();
    }
    
    // 로그인된 사용자인 경우 사용자 정보로 초기화
    if (user) {
      setOrdererInfo({
        name: user.usersName || '',
        email: user.email || '',
        phone: user.phoneNum || '',
        address: '',
        detailAddress: '',
        zipCode: ''
      });
      
      setDeliveryInfo(prev => ({
        ...prev,
        name: user.usersName || '',
        contact1: user.phoneNum || '',
        contact2: user.phoneNum || ''
      }));
    }
  }, [user]);

  const fetchOrderPageData = async () => {
    try {
      setLoading(true);
    
      const productData = sampleProducts.find(p => p.id === parseInt(productId));
      if (productData) {
        setProduct(productData);
      } else {
        throw new Error('상품을 찾을 수 없습니다.');
      }
      
    } catch (error) {
      console.error('주문 페이지 데이터 로딩 실패:', error);
      // 에러 발생 시 기본 데이터로 폴백
      setFallbackData();
    } finally {
      setLoading(false);
    }
  };

  const setFallbackData = () => {
    // API 호출 실패 시 기본 데이터 설정
    const fallbackProduct = {
      id: parseInt(productId),
      name: '상품 정보를 불러올 수 없습니다',
      category: 'unknown',
      price: 0,
      originalPrice: 0,
      image: '/img/yoga.jpeg',
      badge: '',
      description: '상품 정보를 불러올 수 없습니다'
    };
    
    setProduct(fallbackProduct);
    setOrdererInfo({
      name: '',
      email: '',
      phone: '',
      address: '',
      detailAddress: '',
      zipCode: ''
    });
    setDeliveryInfo({
      name: '',
      contact1: '',
      contact2: '',
      address: '',
      detailAddress: '',
      zipCode: '',
      deliveryMessage: '',
      depositorName: '',
      deliveryType: 'domestic',
      addressType: 'home'
    });
    setDiscountInfo({
      deposit: 0,
      coupon: '',
      availableDeposit: 0
    });
  };

  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  const calculateTotalAmount = () => {
    if (!product) return 0;
    const discountAmount = discountInfo.deposit;
    return product.price - discountAmount;
  };

  const handleInputChange = (section, field, value) => {
    if (section === 'orderer') {
      setOrdererInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'delivery') {
      setDeliveryInfo(prev => ({ ...prev, [field]: value }));
    } else if (section === 'discount') {
      setDiscountInfo(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleAddressSelect = (addressData, section) => {
    if (section === 'orderer') {
      setOrdererInfo(prev => ({
        ...prev,
        zipCode: addressData.zipCode,
        address: addressData.address,
        detailAddress: addressData.detailAddress
      }));
    } else if (section === 'delivery') {
      setDeliveryInfo(prev => ({
        ...prev,
        zipCode: addressData.zipCode,
        address: addressData.address,
        detailAddress: addressData.detailAddress
      }));
    }
  };

  const handleAgreementChange = (field) => {
    if (field === 'allAgree') {
      const newValue = !agreements.allAgree;
      setAgreements({
        allAgree: newValue,
        personalInfo: newValue,
        orderAgree: newValue
      });
    } else {
      setAgreements(prev => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const handleProceedToPayment = () => {
    if (!agreements.personalInfo || !agreements.orderAgree) {
      alert('필수 동의 항목에 체크해주세요.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (orderData) => {
    
    alert(`주문이 완료되었습니다!\n주문번호: ${orderData.orderNumber}\n상품: ${orderData.productName}\n총 금액: ${orderData.totalAmount.toLocaleString()}원`);
    navigate('/orders');
  };

  const handleBackToProduct = () => {
    // Shop 페이지로 이동
    navigate('/shop');
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <div className="spinner-border text-warning" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="danger">
          <h4>상품을 찾을 수 없습니다</h4>
          <p>요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
          <Button variant="warning" onClick={() => navigate('/shop')}>
            쇼핑몰으로 돌아가기
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <div className={styles.orderPageContainer}>
      <Container fluid className="py-5">
        {/* 뒤로가기 버튼 */}
        <div className="mb-4">
          <Button className={styles.backButton} onClick={handleBackToProduct}>
            ← 상품 목록 페이지로 돌아가기
          </Button>
        </div>

        {/* 로그인 상태 안내 */}
        {user ? (
          <Alert className={`${styles.userInfoAlert} mb-4`}>
            <div className="alert-heading">주문자 정보</div>
            <div className="alert-text">
              <strong>{user.email}</strong>님의 정보로 주문 페이지가 구성되었습니다.
            </div>
          </Alert>
        ) : (
          <Alert className={`${styles.warningAlert} mb-4`}>
            <div className="alert-heading">로그인 안내</div>
            <div className="alert-text">
              로그인하지 않았습니다. <Button variant="link" className="p-0" onClick={() => navigate('/login')}>로그인</Button>하여 개인 정보를 자동으로 입력할 수 있습니다.
            </div>
          </Alert>
        )}

        <Row className="g-4">
          <Col lg={8} md={12}>
            {/* 주문자 정보 */}
            <Card className={styles.ordererInfoCard}>
              <Card.Header className={styles.ordererInfoHeader}>
                <h5 className={styles.ordererInfoTitle}>주문자정보</h5>
              </Card.Header>
              <Card.Body className={styles.ordererInfoBody}>
                <Row>
                  <Col md={4} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>이름</Form.Label>
                      <Form.Control
                        type="text"
                        className={styles.formControl}
                        value={ordererInfo.name}
                        onChange={(e) => handleInputChange('orderer', 'name', e.target.value)}
                        placeholder={user ? "자동 입력됨" : "이름을 입력하세요"}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={8} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>연락처</Form.Label>
                      <Form.Control
                        type="tel"
                        className={styles.formControl}
                        value={ordererInfo.phone}
                        onChange={(e) => handleInputChange('orderer', 'phone', e.target.value)}
                        placeholder={user ? "자동 입력됨" : "전화번호 (-을 제외한 숫자만 입력해 주세요)"}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>이메일</Form.Label>
                      <div className={styles.emailInputGroup}>
                        <Form.Control
                          type="text"
                          className={`${styles.formControl} ${styles.emailInput}`}
                          value={ordererInfo.email.split('@')[0] || ''}
                          onChange={(e) => {
                            const domain = ordererInfo.email.split('@')[1] || 'gmail.com';
                            handleInputChange('orderer', 'email', `${e.target.value}@${domain}`);
                          }}
                          placeholder={user ? "자동 입력됨" : "이메일을 입력하세요"}
                        />
                        <span className={styles.emailAt}>@</span>
                        <Form.Select
                          className={`${styles.formControl} ${styles.emailSelect}`}
                          value={ordererInfo.email.split('@')[1] || 'gmail.com'}
                          onChange={(e) => {
                            const username = ordererInfo.email.split('@')[0] || '';
                            handleInputChange('orderer', 'email', `${username}@${e.target.value}`);
                          }}
                        >
                          <option value="gmail.com">gmail.com</option>
                          <option value="naver.com">naver.com</option>
                          <option value="daum.net">daum.net</option>
                          <option value="hanmail.net">hanmail.net</option>
                        </Form.Select>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>주소</Form.Label>
                      <div className={styles.addressInputGroup}>
                        <Form.Control
                          type="text"
                          className={`${styles.formControl} ${styles.zipCodeInput}`}
                          placeholder="우편번호"
                          value={ordererInfo.zipCode || ''}
                          readOnly
                        />
                        <AddressSearch 
                          onAddressSelect={(addressData) => handleAddressSelect(addressData, 'orderer')}
                          buttonText="우편번호"
                          className={styles.addressSearchButton}
                        />
                      </div>
                      <Form.Control
                        type="text"
                        className={`${styles.formControl} ${styles.addressInput}`}
                        placeholder="기본주소"
                        value={ordererInfo.address || ''}
                        readOnly
                      />
                      <Form.Control
                        type="text"
                        className={`${styles.formControl} ${styles.detailAddressInput}`}
                        placeholder="상세주소"
                        value={ordererInfo.detailAddress || ''}
                        onChange={(e) => handleInputChange('orderer', 'detailAddress', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 배송 정보 */}
            <Card className={styles.deliveryInfoCard}>
              <Card.Header className={styles.deliveryInfoHeader}>
                <h5 className={styles.deliveryInfoTitle}>배송 정보</h5>
              </Card.Header>
              <Card.Body className={styles.deliveryInfoBody}>
                <Row>
                  <Col md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>이름</Form.Label>
                      <Form.Control
                        type="text"
                        className={styles.formControl}
                        value={deliveryInfo.name}
                        onChange={(e) => handleInputChange('delivery', 'name', e.target.value)}
                        placeholder={user ? "자동 입력됨" : "수취인 이름을 입력하세요"}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>연락처 1</Form.Label>
                      <Form.Control
                        type="tel"
                        className={styles.formControl}
                        value={deliveryInfo.contact1}
                        onChange={(e) => handleInputChange('delivery', 'contact1', e.target.value)}
                        placeholder={user ? "자동 입력됨" : "전화번호 (-을 제외한 숫자만 입력해 주세요)"}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>연락처 2</Form.Label>
                      <Form.Control
                        type="tel"
                        className={styles.formControl}
                        value={deliveryInfo.contact2}
                        onChange={(e) => handleInputChange('delivery', 'contact2', e.target.value)}
                        placeholder="전화번호 (-을 제외한 숫자만 입력해 주세요)"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className={`${styles.deliveryTypeGroup} mb-3`}>
                      <Form.Label className={styles.deliveryTypeLabel}>배송지 선택</Form.Label>
                      <div className={styles.deliveryTypeOptions}>
                        <div className={styles.deliveryTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="deliveryType"
                            id="domestic"
                            checked={deliveryInfo.deliveryType === 'domestic'}
                            onChange={() => handleInputChange('delivery', 'deliveryType', 'domestic')}
                          />
                          <label htmlFor="domestic">국내배송</label>
                        </div>
                        <div className={styles.deliveryTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="deliveryType"
                            id="overseas"
                            checked={deliveryInfo.deliveryType === 'overseas'}
                            onChange={() => handleInputChange('delivery', 'deliveryType', 'overseas')}
                          />
                          <label htmlFor="overseas">해외배송</label>
                        </div>
                      </div>
                      <div className={styles.addressTypeOptions}>
                        <div className={styles.addressTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="addressType"
                            id="home"
                            checked={deliveryInfo.addressType === 'home'}
                            onChange={() => handleInputChange('delivery', 'addressType', 'home')}
                          />
                          <label htmlFor="home">자택</label>
                        </div>
                        <div className={styles.addressTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="addressType"
                            id="company"
                            checked={deliveryInfo.addressType === 'company'}
                            onChange={() => handleInputChange('delivery', 'addressType', 'company')}
                          />
                          <label htmlFor="company">회사</label>
                        </div>
                        <div className={styles.addressTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="addressType"
                            id="recent"
                            checked={deliveryInfo.addressType === 'recent'}
                            onChange={() => handleInputChange('delivery', 'addressType', 'recent')}
                          />
                          <label htmlFor="recent">최근 배송지</label>
                        </div>
                        <div className={styles.addressTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="addressType"
                            id="list"
                            checked={deliveryInfo.addressType === 'list'}
                            onChange={() => handleInputChange('delivery', 'addressType', 'list')}
                          />
                          <label htmlFor="list">배송지 목록</label>
                        </div>
                        <div className={styles.addressTypeRadio}>
                          <Form.Check
                            type="radio"
                            name="addressType"
                            id="new"
                            checked={deliveryInfo.addressType === 'new'}
                            onChange={() => handleInputChange('delivery', 'addressType', 'new')}
                          />
                          <label htmlFor="new">신규 배송지</label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>주소</Form.Label>
                      <div className={styles.addressInputGroup}>
                        <Form.Control
                          type="text"
                          className={`${styles.formControl} ${styles.zipCodeInput}`}
                          placeholder="우편번호"
                          value={deliveryInfo.zipCode || ''}
                          readOnly
                        />
                        <AddressSearch 
                          onAddressSelect={(addressData) => handleAddressSelect(addressData, 'delivery')}
                          buttonText="우편번호"
                          className={styles.addressSearchButton}
                        />
                      </div>
                      <Form.Control
                        type="text"
                        className={`${styles.formControl} ${styles.addressInput}`}
                        placeholder="기본주소"
                        value={deliveryInfo.address || ''}
                        readOnly
                      />
                      <Form.Control
                        type="text"
                        className={`${styles.formControl} ${styles.detailAddressInput}`}
                        placeholder="상세주소"
                        value={deliveryInfo.detailAddress || ''}
                        onChange={(e) => handleInputChange('delivery', 'detailAddress', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>배송메세지 (100자내외)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        className={styles.deliveryMessageTextarea}
                        value={deliveryInfo.deliveryMessage}
                        onChange={(e) => handleInputChange('delivery', 'deliveryMessage', e.target.value)}
                        placeholder="배송 관련 메시지를 입력해주세요"
                      />
                      <small className={styles.deliveryMessageHelp}>
                        0/200 bytes (* 영문/숫자 기준 200자, 한글 기준 100자까지 입력 가능합니다.)
                      </small>
                      <div className={styles.deliveryMessageWarning}>
                        * 배송기사님이 확인하는 메세지입니다<br/>
                        (ex: 부재시 경비실에 보관해 주세요. 배송전 연락주세요. 등)<br/>
                        * 추가 요청 사항은 게시글 또는 고객센터로 문의주시시기 바랍니다
                      </div>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <Form.Group className="mb-3">
                      <Form.Label className={styles.formLabel}>무통장 입금자명</Form.Label>
                      <Form.Control
                        type="text"
                        className={styles.depositorNameInput}
                        value={deliveryInfo.depositorName}
                        onChange={(e) => handleInputChange('delivery', 'depositorName', e.target.value)}
                        placeholder="입금자명을 입력해주세요"
                      />
                      <small className={styles.depositorNameHelp}>(주문자와 같을경우 생략 가능)</small>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={12} sm={12}>
                    <div className={styles.saveAddressCheckbox}>
                      <Form.Check
                        type="checkbox"
                        id="saveAddress"
                      />
                      <label htmlFor="saveAddress">해당 배송지 정보를 나의 회원정보로 등록합니다.</label>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            {/* 주문자 동의 */}
            <Card className={styles.agreementCard}>
              <Card.Header className={styles.agreementHeader}>
                <h5 className={styles.agreementTitle}>주문자 동의</h5>
              </Card.Header>
              <Card.Body className={styles.agreementBody}>
                <div className="mb-4">
                  <h6>개인정보 수집·이용</h6>
                  <Table bordered className={styles.privacyTable}>
                    <thead>
                      <tr>
                        <th>목적</th>
                        <th>항목</th>
                        <th>보유기간</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>주문자 정보 확인, 주문 내역 안내, 주문 내역 조회</td>
                        <td>주문자 정보(연락처, 이메일)</td>
                        <td rowSpan={2}>주문일로부터 90일까지 보유하며, 관계 법령에 따라 5년간 보관</td>
                      </tr>
                      <tr>
                        <td>상품 배송(구매/환불/취소/교환)을 위한 수취인 정보</td>
                        <td>수취인 정보(이름, 연락처1, 연락처2, 주소)</td>
                      </tr>
                      <tr>
                        <td>서비스 제공(요금정산, 콘텐츠 제공, 구매 및 요금결제, 물품배송, 금융거래 본인 인증 및 금융서비스)</td>
                        <td>무통장입금자명</td>
                        <td>주문일로부터 90일까지(관계 법령에 따라 필요시, 일정기간 보유)</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                <div>
                  <h6>주문동의</h6>
                  <div className={styles.agreementCheckboxes}>
                    <div className={`${styles.agreementCheckbox} ${styles.allAgreeCheckbox}`}>
                      <Form.Check
                        type="checkbox"
                        id="allAgree"
                        checked={agreements.allAgree}
                        onChange={() => handleAgreementChange('allAgree')}
                      />
                      <label htmlFor="allAgree">전체 동의</label>
                    </div>
                    <div className={styles.agreementCheckbox}>
                      <Form.Check
                        type="checkbox"
                        id="personalInfo"
                        checked={agreements.personalInfo}
                        onChange={() => handleAgreementChange('personalInfo')}
                      />
                      <label htmlFor="personalInfo">[개인정보 수집·이용] 동의</label>
                    </div>
                    <div className={styles.agreementCheckbox}>
                      <Form.Check
                        type="checkbox"
                        id="orderAgree"
                        checked={agreements.orderAgree}
                        onChange={() => handleAgreementChange('orderAgree')}
                      />
                      <label htmlFor="orderAgree">주문 / 결제 정보를 확인하여 구매 진행에 동의합니다.</label>
                    </div>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} md={12}>
            {/* 주문 상품 할인적용 */}
            <Card className={styles.discountCard}>
              <Card.Header className={styles.discountHeader}>
                <h5 className={styles.discountTitle}>주문상품 할인적용</h5>
              </Card.Header>
              <Card.Body className={styles.discountBody}>
                <div className={styles.priceBreakdown}>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>상품금액</span>
                    <span className={styles.priceValue}>{product.price.toLocaleString()}원</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>할인금액</span>
                    <span className={`${styles.priceValue} ${styles.discountValue}`}>-{discountInfo.deposit.toLocaleString()}원</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>추가금액</span>
                    <span className={styles.priceValue}>0원</span>
                  </div>
                  <div className={styles.priceItem}>
                    <span className={styles.priceLabel}>결제 예정금액</span>
                    <span className={`${styles.priceValue} ${styles.totalAmount}`}>{calculateTotalAmount().toLocaleString()}원</span>
                  </div>
                </div>

                <div className={styles.depositSection}>
                  <Form.Group>
                    <Form.Label className={styles.depositLabel}>예치금 사용</Form.Label>
                    <div className={styles.depositInputGroup}>
                      <Form.Control
                        type="number"
                        className={styles.depositInput}
                        value={discountInfo.deposit}
                        onChange={(e) => handleInputChange('discount', 'deposit', parseInt(e.target.value) || 0)}
                        min="0"
                        max={product.price}
                      />
                      <div className={styles.depositCheckbox}>
                        <Form.Check
                          type="checkbox"
                          id="useAllDeposit"
                        />
                        <label htmlFor="useAllDeposit">전액사용</label>
                      </div>
                    </div>
                    <small className={styles.depositHelp}>(사용가능 예치금: {discountInfo.availableDeposit.toLocaleString()}원)</small>
                  </Form.Group>
                </div>

                <div className={styles.couponSection}>
                  <Form.Group>
                    <Form.Label className={styles.couponLabel}>쿠폰 사용</Form.Label>
                    <div className={styles.couponInputGroup}>
                      <Form.Control
                        type="text"
                        className={styles.couponInput}
                        value={discountInfo.coupon}
                        onChange={(e) => handleInputChange('discount', 'coupon', e.target.value)}
                        placeholder="쿠폰 코드 입력"
                      />
                      <Button className={styles.couponButton}>쿠폰선택</Button>
                    </div>
                  </Form.Group>
                </div>

                <div className="text-center">
                  <Button
                    className={styles.paymentButton}
                    onClick={handleProceedToPayment}
                    disabled={!agreements.personalInfo || !agreements.orderAgree}
                  >
                    💳 결제하기
                  </Button>
                </div>

                <div className={styles.deliveryNotice}>
                  # 배송준비기간은 재고 유무에 따라 주문일로부터 1~3일 소요되며,<br/>
                  재고가 없는 경우 별도 안내드립니다.
                </div>
              </Card.Body>
            </Card>

            {/* 사이드 네비게이션 */}
            <div className={styles.sideNavigation}>
              <Button className={`${styles.sideNavButton} ${styles.talkButton}`}>
                💬 TALK
              </Button>
              <Button className={`${styles.sideNavButton} ${styles.infoButton}`}>
                매장 안내
              </Button>
              <Button className={`${styles.sideNavButton} ${styles.infoButton}`}>
                교환
              </Button>
            </div>
          </Col>
        </Row>

        {/* 결제 모달 */}
        <PaymentModal
          show={showPaymentModal}
          onHide={() => setShowPaymentModal(false)}
          product={product}
          deliveryInfo={deliveryInfo}
          user={user}
          onPaymentSuccess={handlePaymentSuccess}
        />
      </Container>
    </div>
  );
}
