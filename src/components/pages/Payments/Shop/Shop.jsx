import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import ButtonComponent from "../../../common/ButtonComponent";
import ModalComponent from "../../../common/ModalComponent";
import ProductDetail from "./ProductDetail";
import styles from "./Shop.module.css";

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const navigate = useNavigate();

  // 샘플 상품 데이터
  const products = [
    {
      id: 1,
      name: "프리미엄 요가매트",
      category: "equipment",
      price: 45000,
      originalPrice: 60000,
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&crop=center",
      badge: "BEST",
      description: "고급 실리콘 소재의 안전한 요가매트",
    },
    {
      id: 2,
      name: "스마트 웨이트",
      category: "equipment",
      price: 120000,
      originalPrice: 150000,
      image:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center",
      badge: "NEW",
      description: "블루투스 연결 가능한 스마트 웨이트",
    },
    {
      id: 3,
      name: "프리미엄 운동복",
      category: "clothing",
      price: 89000,
      originalPrice: 120000,
      image:
        "https://images.unsplash.com/photo-1594736797933-d0c0a0b0b0b0?w=400&h=300&fit=crop&crop=center",
      badge: "SALE",
      description: "편안하고 스타일리시한 운동복",
    },
    {
      id: 4,
      name: "단백질 보충제",
      category: "supplement",
      price: 65000,
      originalPrice: 80000,
      image:
        "https://images.unsplash.com/photo-1594736797933-d0c0a0b0b0b0?w=400&h=300&fit=crop&crop=center",
      badge: "HOT",
      description: "고품질 단백질 보충제",
    },
    {
      id: 5,
      name: "테스트 상품",
      category: "equipment",
      price: 100, // ✅ 아임포트 최소 금액으로 조정
      originalPrice: 1000,
      image:
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=300&fit=crop&crop=center",
      badge: "TEST",
      description: "100원 테스트용 상품입니다 (아임포트 최소 금액)",
    },
  ];

  const categories = [
    { id: "all", name: "전체" },
    { id: "equipment", name: "운동기구" },
    { id: "clothing", name: "운동복" },
    { id: "supplement", name: "보충제" },
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((product) => product.category === selectedCategory);

  const calculateDiscount = (original, current) => {
    return Math.round(((original - current) / original) * 100);
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setProductModalOpen(false);
    setSelectedProduct(null);
  };

  const handleBuyNow = (product) => {
    // ProductDetail에서 구매하기 버튼을 눌렀을 때의 처리
    console.log("구매하기:", product);
    // OrderPage로 이동하기 위해 상품 정보를 저장하고 navigate 사용
    // 상품 정보를 localStorage에 저장하여 OrderPage에서 사용할 수 있도록 함
    localStorage.setItem("selectedProduct", JSON.stringify(product));
    // OrderPage로 이동
    navigate("/order");
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
            onClick={() => {
              console.log("주문내역 버튼 클릭됨");
              navigate("/orders");
            }}
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
        {filteredProducts.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <div className={styles.productImageContainer}>
              <img
                src={product.image}
                alt={product.name}
                className={styles.productImage}
              />
              {product.badge && (
                <span className={styles.productBadge}>{product.badge}</span>
              )}
              {product.originalPrice > product.price && (
                <span className={styles.discountBadge}>
                  {calculateDiscount(product.originalPrice, product.price)}%
                  할인
                </span>
              )}
            </div>
            <div className={styles.productContent}>
              <h3 className={styles.productTitle}>{product.name}</h3>
              <p className={styles.productDescription}>{product.description}</p>
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
              <div className={styles.productActions}>
                <ButtonComponent
                  variant="primary"
                  fullWidth
                  onClick={() => handleProductClick(product)}
                  className={styles.buyButton}
                >
                  💳 구매하기
                </ButtonComponent>
                <ButtonComponent
                  variant="outline"
                  fullWidth
                  className={styles.wishlistButton}
                >
                  💝 위시리스트
                </ButtonComponent>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {filteredProducts.length === 0 && (
        <div className={styles.emptyState}>
          <h4 className={styles.emptyStateTitle}>
            😔 해당 카테고리의 상품이 없습니다
          </h4>
          <p className={styles.emptyStateText}>다른 카테고리를 확인해보세요!</p>
        </div>
      )}

      {/* ProductDetail 모달 */}
      <ModalComponent
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        size="large"
        title="상품 상세 정보"
      >
        {selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={handleCloseProductModal}
            onBuyNow={handleBuyNow}
          />
        )}
      </ModalComponent>
    </div>
  );
}
