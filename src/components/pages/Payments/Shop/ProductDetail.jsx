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
    } else {
      fetchProduct();
    }
  }, [propProduct]);

  const fetchProduct = async () => {
    try {
      console.log('fetchProduct 시작, productId:', productId);
      setLoading(true);
      // 임시로 샘플 데이터 사용
      const sampleProducts = [
        {
          id: 1,
          name: "프리미엄 요가 매트",
          description: "고품질 TPE 소재로 제작된 안전하고 편안한 요가 매트입니다. 미끄럼 방지 기능과 내구성이 뛰어나며, 모든 수준의 요가 연습에 적합합니다.",
          price: 89000,
          originalPrice: 120000,
          image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&h=300&fit=crop",
          category: "fitness",
          inStock: true,
          rating: 4.8,
          reviews: 156
        },
        {
          id: 2,
          name: "스마트 워치",
          description: "건강 관리와 피트니스 추적에 최적화된 스마트 워치입니다. 24시간 심박수 모니터링, 수면 추적, 운동 모드 등 다양한 기능을 제공합니다.",
          price: 299000,
          originalPrice: 399000,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=300&fit=crop",
          category: "electronics",
          inStock: true,
          rating: 4.6,
          reviews: 89
        },
        {
          id: 3,
          name: "프로틴 쉐이크",
          description: "운동 후 빠른 회복을 위한 고품질 프로틴 파우더입니다. 천연 성분으로 제작되어 부작용 없이 근육 회복을 도와줍니다.",
          price: 45000,
          originalPrice: 60000,
          image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&h=300&fit=crop",
          category: "nutrition",
          inStock: true,
          rating: 4.7,
          reviews: 203
        }
      ];
      
      const productData = sampleProducts[0]; // 기본 상품 사용
      console.log('찾은 상품 데이터:', productData);
      if (productData) {
        setProduct(productData);
        console.log('상품 설정 완료');
      } else {
        console.log('상품을 찾을 수 없음');
        throw new Error('상품을 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('상품 로딩 실패:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

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
          <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
            {/* 상품 이미지 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div className={styles.productImageContainer}>
                <img 
                  src={product.image} 
                  alt={product.name}
                  className={styles.productDetailImage}
                />
                {product.badge && (
                  <span className={styles.productBadge}>
                    {product.badge}
                  </span>
                )}
                {product.originalPrice > product.price && (
                  <span className={styles.discountBadge}>
                    {calculateDiscount(product.originalPrice, product.price)}% 할인
                  </span>
                )}
              </div>
            </div>

            {/* 상품 정보 */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <div className={styles.productInfo}>
                <h1 className={styles.productTitle}>{product.name}</h1>
                <p className={styles.productCategory}>{product.category}</p>
                
                <div className={styles.priceContainer}>
                  {product.originalPrice > product.price ? (
                    <div>
                      <span className={styles.originalPrice}>
                        {product.originalPrice.toLocaleString()}원
                      </span>
                      <span className={styles.currentPrice}>
                        {product.price.toLocaleString()}원
                      </span>
                    </div>
                  ) : (
                    <span className={styles.currentPrice}>
                      {product.price.toLocaleString()}원
                    </span>
                  )}
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
            <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <h5 style={{ marginBottom: '20px', color: '#2c3e50' }}>제품 사양</h5>
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
                    {product.originalPrice > product.price && (
                      <tr>
                        <td>할인율</td>
                        <td>{calculateDiscount(product.originalPrice, product.price)}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <h5 style={{ marginBottom: '20px', color: '#2c3e50' }}>배송 정보</h5>
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
