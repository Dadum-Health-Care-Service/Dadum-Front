import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ButtonComponent from '../../../common/ButtonComponent';
import { GET } from '../../../../utils/api/api';
import styles from './ProductDetail.module.css';

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = await GET(`/shop/products/${productId}`, {}, null, false);
        setProduct(response.data);
        setQuantity(1); // 상품 로드 시 수량 초기화
      } catch (error) {
        console.error('상품 정보 로드 실패:', error);
        // 상품을 찾을 수 없는 경우 쇼핑몰로 돌아가기
        navigate('/shop');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId, navigate]);


  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  const handleBuyNow = () => {
    if (product) {
      // 상품 정보를 localStorage에 저장하여 OrderPage에서 사용할 수 있도록 함
      const productForOrder = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description,
        stock: product.stock,
        quantity: quantity,
        totalPrice: product.price * quantity
      };
      localStorage.setItem("selectedProduct", JSON.stringify(productForOrder));
      // OrderPage로 이동
      navigate('/order');
    }
  };

  const handleBackToShop = () => {
    navigate('/shop');
  };

  const handleQuantityChange = (newQuantity) => {
    if (product && newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleQuantityInputChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    handleQuantityChange(value);
  };

  const decreaseQuantity = () => {
    handleQuantityChange(quantity - 1);
  };

  const increaseQuantity = () => {
    handleQuantityChange(quantity + 1);
  };

  if (loading) {
    return (
      <div className={styles.productDetailContainer}>
        <div className={styles.loadingContainer}>
          <div className="spinner-border text-warning" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={styles.productDetailContainer}>
        <div className={styles.errorContainer}>
          <h4 className={styles.errorTitle}>상품을 찾을 수 없습니다</h4>
          <p className={styles.errorText}>요청하신 상품이 존재하지 않거나 삭제되었습니다.</p>
          <ButtonComponent variant="primary" onClick={handleBackToShop}>
            쇼핑몰으로 돌아가기
          </ButtonComponent>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.productDetailContainer}>
        {/* 뒤로가기 버튼 */}
        <div className={styles.backButton}>
          <ButtonComponent variant="outline" onClick={handleBackToShop}>
            ← 쇼핑몰으로 돌아가기
          </ButtonComponent>
        </div>

        <div className={styles.productDetailContent}>
          <div className={styles.productDetailGrid}>
            {/* 상품 이미지 */}
            <div className={styles.productImageSection}>
              <div className={styles.productImageContainer}>
                <img 
                  src={product.image} 
                  alt={product.productName}
                  className={styles.productDetailImage}
                  onError={(e) => {
                    e.target.src = "/img/userAvatar.png";
                  }}
                />
              </div>
            </div>

            {/* 상품 정보 */}
            <div className={styles.productInfoSection}>
              <div className={styles.productInfo}>
                {/* 상품명 */}
                <h1 className={styles.productTitle}>{product.productName}</h1>
                
                {/* 원산지/브랜드 */}
                <div className={styles.productMeta}>
                  <span className={styles.productBrand}>Dadum Shop</span>
                </div>

                {/* 평점 (더미 데이터) */}
                <div className={styles.productRating}>
                  <div className={styles.ratingStars}>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.ratingScore}>5.0</span>
                  </div>
                  <span className={styles.reviewCount}>(123개 상품평)</span>
                </div>

                {/* 가격 정보 */}
                <div className={styles.priceContainer}>
                  <div className={styles.priceRow}>
                    <span className={styles.discountRate}>25%</span>
                    <span className={styles.originalPrice}>
                      {Math.round(product.price * 1.33).toLocaleString()}원
                    </span>
                  </div>
                  <div className={styles.currentPriceRow}>
                    <span className={styles.currentPrice}>
                      {product.price.toLocaleString()}원
                    </span>
                    <span className={styles.priceUnit}>
                      (10g당 {Math.round(product.price / 10)}원)
                    </span>
                  </div>
                </div>

                {/* 상품 옵션 */}
                <div className={styles.productOptions}>
                  <div className={styles.optionSection}>
                    <h3 className={styles.optionTitle}>옵션 선택</h3>
                    <div className={styles.optionList}>
                      <div className={styles.optionItem}>
                        <span className={styles.optionName}>기본 옵션</span>
                        <span className={styles.optionPrice}>{product.price.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 수량 선택 */}
                <div className={styles.quantitySection}>
                  <h3 className={styles.quantityTitle}>수량</h3>
                  <div className={styles.quantitySelector}>
                    <button 
                      className={styles.quantityBtn} 
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      value={quantity} 
                      min="1" 
                      max={product.stock} 
                      className={styles.quantityInput}
                      onChange={handleQuantityInputChange}
                    />
                    <button 
                      className={styles.quantityBtn} 
                      onClick={increaseQuantity}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.quantityInfo}>
                    <span className={styles.stockInfo}>재고: {product.stock}개</span>
                    <span className={styles.totalPrice}>
                      총 {(product.price * quantity).toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 배송 정보 */}
                <div className={styles.shippingInfo}>
                  <div className={styles.shippingRow}>
                    <span className={styles.shippingLabel}>무료배송</span>
                    <span className={styles.shippingText}>30,000원 이상 구매 시</span>
                  </div>
                  <div className={styles.shippingRow}>
                    <span className={styles.shippingLabel}>도착 예정</span>
                    <span className={styles.shippingText}>내일(화) 도착 보장 (오늘 주문 시)</span>
                  </div>
                </div>

                {/* 적립 혜택 */}
                <div className={styles.benefitsInfo}>
                  <div className={styles.benefitRow}>
                    <span className={styles.benefitLabel}>적립 혜택</span>
                    <span className={styles.benefitText}>최대 {Math.round(product.price * 0.05)}원 적립</span>
                  </div>
                </div>

                {/* 구매 버튼 */}
                <div className={styles.purchaseActions}>
                  <ButtonComponent 
                    variant="outline" 
                    size="large" 
                    className={styles.cartButton}
                  >
                    🛒 장바구니 담기
                  </ButtonComponent>
                  <ButtonComponent 
                    variant="primary" 
                    size="large" 
                    onClick={handleBuyNow}
                    className={styles.buyButton}
                  >
                    💳 바로구매
                  </ButtonComponent>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 설명 */}
        {(product.description || product.detailFile) && (
          <div className={styles.productDescription}>
            <h3 className={styles.descriptionTitle}>상품 설명</h3>
            <div className={styles.descriptionContent}>
              {/* 텍스트 설명 */}
              {product.description && product.description.split('\n').map((line, index) => (
                <p key={index} className={styles.descriptionLine}>
                  {line}
                </p>
              ))}
              
              {/* 상세정보 파일 */}
              {product.detailFile && (
                <div className={styles.detailFileContent}>
                  {product.detailFileType && product.detailFileType.startsWith('image/') ? (
                    <img 
                      src={product.detailFile} 
                      alt="상품 상세정보"
                      className={styles.detailFileImage}
                    />
                  ) : product.detailFileType === 'application/pdf' ? (
                    <div className={styles.detailFilePdf}>
                      <iframe 
                        src={product.detailFile} 
                        className={styles.detailFileIframe}
                        title="상품 상세정보 PDF"
                      />
                    </div>
                  ) : (
                    <div className={styles.detailFileText}>
                      <pre className={styles.detailFilePre}>{product.detailFile}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 상품 상세 정보 */}
        <div className={styles.productDetailsCard}>
          <div className={styles.productDetailsBody}>
            <div className={styles.detailsGrid}>
              <div className={styles.specificationsSection}>
                <h5 className={styles.sectionTitle}>제품 사양</h5>
                <table className={styles.specificationsTable}>
                  <tbody>
                    <tr>
                      <td>카테고리</td>
                      <td>{product.category}</td>
                    </tr>
                    <tr>
                      <td>가격</td>
                      <td>{product.price.toLocaleString()}원</td>
                    </tr>
                    <tr>
                      <td>재고</td>
                      <td>{product.stock}개</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className={styles.deliverySection}>
                <h5 className={styles.sectionTitle}>배송 정보</h5>
                <ul className={styles.deliveryInfo}>
                  <li>🚚 무료 배송 (5만원 이상 구매 시)</li>
                  <li>📦 배송 기간: 1-3일</li>
                  <li>🔄 교환/반품: 7일 이내</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
