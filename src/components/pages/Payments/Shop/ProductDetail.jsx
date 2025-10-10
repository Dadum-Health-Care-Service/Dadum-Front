import React, { useState, useEffect } from 'react';
import ButtonComponent from '../../../common/ButtonComponent';
import styles from './ProductDetail.module.css';

export default function ProductDetail({ product: propProduct, onClose, onBuyNow }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('ProductDetail 렌더링됨, product:', propProduct);

  useEffect(() => {
    console.log('useEffect 실행됨, propProduct:', propProduct);
    if (propProduct) {
      setProduct(propProduct);
      setLoading(false);
    }
  }, [propProduct]);


  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  const handleBuyNow = () => {
    if (onBuyNow && product) {
      onBuyNow(product);
    }
  };

  const handleBackToShop = () => {
    if (onClose) {
      onClose();
    }
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
                  src={product.imageData || product.imageUrl || "https://via.placeholder.com/500x300?text=No+Image"} 
                  alt={product.productName}
                  className={styles.productDetailImage}
                />
                {product.stock > 0 && (
                  <span className={styles.productBadge}>
                    재고있음
                  </span>
                )}
              </div>
            </div>

            {/* 상품 정보 */}
            <div className={styles.productInfoSection}>
              <div className={styles.productInfo}>
                <h1 className={styles.productTitle}>{product.productName}</h1>
                <p className={styles.productCategory}>{product.category}</p>
                
                <div className={styles.priceContainer}>
                  <span className={styles.currentPrice}>
                    {product.price.toLocaleString()}원
                  </span>
                </div>

                <p className={styles.productDescription}>
                  {product.detailedDescription || product.description}
                </p>

                {/* 구매 버튼 */}
                <div className={styles.purchaseActions}>
                  <ButtonComponent 
                    variant="primary" 
                    size="large" 
                    fullWidth
                    onClick={handleBuyNow}
                    className={styles.buyButton}
                  >
                    💳 구매하기
                  </ButtonComponent>
                  <ButtonComponent 
                    variant="outline" 
                    fullWidth
                    className={styles.wishlistButton}
                  >
                    💝 위시리스트에 추가
                  </ButtonComponent>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상품 상세 정보 */}
        <div className={styles.productDetailsCard}>
          <h4 className={styles.productDetailsHeader}>상품 상세 정보</h4>
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
                  <li>💳 안전한 결제 시스템</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}
