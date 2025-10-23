import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ButtonComponent from "../../../common/ButtonComponent";
import { GET } from "../../../../utils/api/api";
import styles from "./Shop.module.css";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const categories = [
    { id: "all", name: "전체" },
    { id: "fitness", name: "피트니스" },
    { id: "nutrition", name: "영양제" },
    { id: "equipment", name: "운동기구" },
    { id: "clothing", name: "운동복" },
  ];

  // 상품 데이터 로드
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await GET('/shop/products', {}, null, false);
      setProducts(response.data || []);
    } catch (error) {
      console.error('상품 목록 로드 실패:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  const handleProductClick = (product) => {
    // 상품 상세 페이지로 이동
    navigate(`/shop/product/${product.id || product.productId}`);
  };

  const handleBuyNow = (product) => {
    // 구매하기 버튼 클릭 시 바로 주문 페이지로 이동
    console.log("구매하기:", product);
    const productForOrder = {
      id: product.id || product.productId,
      name: product.name || product.productName,
      price: product.price,
      image: product.image,
      description: product.description,
      stock: product.stock
    };
    localStorage.setItem("selectedProduct", JSON.stringify(productForOrder));
    navigate('/order');
  };

  return (
    <div className={styles.shopContainer}>
      {/* 헤더 */}
      <div className={styles.shopHeader}>
        <h1 className={styles.shopTitle}>🏪 Dadum Shop</h1>
        <p className={styles.shopSubtitle}>
          당신의 운동을 더욱 특별하게 만들어줄 제품들을 만나보세요
        </p>
        <div className={styles.shopActions}>
          <ButtonComponent
            variant="outline"
            onClick={() => navigate('/orders')}
          >
            📋 주문 내역
          </ButtonComponent>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className={styles.categoryFilter}>
        <div className={styles.categoryButtons}>
          {categories.map((category) => (
            <ButtonComponent
              key={category.id}
              variant={selectedCategory === category.id ? "primary" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={styles.categoryBtn}
            >
              {category.name}
            </ButtonComponent>
          ))}
        </div>
      </div>

      {/* 상품 목록 */}
      <div className={styles.productsGrid}>
        {loading ? (
          <div className="text-center w-100">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">로딩중...</span>
            </div>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div 
              key={product.id || product.productId} 
              className={styles.productCard}
              onClick={() => handleProductClick(product)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.productImageContainer}>
                <img
                  src={product.image || "/img/userAvatar.png"}
                  alt={product.name || product.productName}
                  className={styles.productImage}
                  onError={(e) => {
                    e.target.src = "/img/userAvatar.png";
                  }}
                />
                {product.stock > 0 && (
                  <span className={styles.productBadge}>재고있음</span>
                )}
              </div>
              <div className={styles.productContent}>
                <h3 className={styles.productTitle}>{product.name || product.productName}</h3>
                <p className={styles.productDescription}>{product.description}</p>
                <div className={styles.priceContainer}>
                  <span className={styles.currentPrice}>
                    {product.price.toLocaleString()}원
                  </span>
                </div>
                <div className={styles.stockInfo}>
                  재고: {product.stock}개
                </div>
              <div className={styles.productActions}>
                <ButtonComponent
                  variant="primary"
                  fullWidth
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick(product);
                  }}
                  className={styles.buyButton}
                >
                  💳 구매하기
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  fullWidth
                  onClick={(e) => e.stopPropagation()}
                  className={styles.wishlistButton}
                >
                  💝 위시리스트
                </ButtonComponent>
              </div>
            </div>
          </div>
        ))
        )}
      </div>

      {/* 빈 상태 */}
      {!loading && filteredProducts.length === 0 && (
        <div className={styles.emptyState}>
          <h4 className={styles.emptyStateTitle}>
            😔 해당 카테고리의 상품이 없습니다
          </h4>
          <p className={styles.emptyStateText}>다른 카테고리를 확인해보세요!</p>
        </div>
      )}

    </div>
  );
}
