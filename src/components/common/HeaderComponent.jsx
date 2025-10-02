import React from "react";
import { useEffect } from "react";
import styles from "./HeaderComponent.module.css";

// Header variant별 클래스명 매핑
const HEADER_VARIANTS = {
  default: "default",
  elevated: "elevated",
  outlined: "outlined",
  filled: "filled",
};

// Header 크기별 클래스명 매핑
const HEADER_SIZES = {
  small: "small",
  medium: "medium",
  large: "large",
};

// Header 정렬별 클래스명 매핑
const HEADER_ALIGNS = {
  left: "left",
  center: "center",
  right: "right",
};

// 메인 HeaderComponent
const HeaderComponent = ({
  children,
  title = "",
  subtitle = "",
  variant = "default",
  size = "medium",
  align = "left",
  sticky = false,
  className = "",
  ...props
}) => {
  // Header 클래스명 생성
  const getHeaderClassName = () => {
    const baseClass = styles.header;
    const variantClass =
      styles[HEADER_VARIANTS[variant] || HEADER_VARIANTS.default];
    const sizeClass = styles[HEADER_SIZES[size] || HEADER_SIZES.medium];
    const alignClass = styles[HEADER_ALIGNS[align] || HEADER_ALIGNS.left];
    const stickyClass = sticky ? styles["sticky"] : "";
    const customClass = className;

    return [
      baseClass,
      variantClass,
      sizeClass,
      alignClass,
      stickyClass,
      customClass,
    ]
      .filter(Boolean)
      .join(" ");
  };

  // 제목 렌더링
  const renderTitle = () => {
    if (!title) return null;

    return <h1 className={styles["header-title"]}>{title}</h1>;
  };

  // 부제목 렌더링
  const renderSubtitle = () => {
    if (!subtitle) return null;

    return <p className={styles["header-subtitle"]}>{subtitle}</p>;
  };

  // 액션 영역 렌더링
  const renderActions = () => {
    if (!children) return null;

    return <div className={styles["header-actions"]}>{children}</div>;
  };

  return (
    <header className={getHeaderClassName()} {...props}>
      <div className={styles["header-content"]}>
        {renderTitle()}
        {renderSubtitle()}
        {renderActions()}
      </div>
    </header>
  );
};

// HeaderSection 컴포넌트
const HeaderSection = ({ children, className = "", ...props }) => {
  return (
    <div className={`${styles["header-section"]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// HeaderBrand 컴포넌트
const HeaderBrand = ({ logo, brandName, className = "", ...props }) => {
  // 로고 렌더링
  const renderLogo = () => {
    if (!logo) return null;

    return <div className={styles["header-logo"]}>{logo}</div>;
  };

  // 브랜드명 렌더링
  const renderBrandName = () => {
    if (!brandName) return null;

    return <h2 className={styles["header-brand-name"]}>{brandName}</h2>;
  };

  return (
    <div className={`${styles["header-brand"]} ${className}`} {...props}>
      {renderLogo()}
      {renderBrandName()}
    </div>
  );
};

// HeaderNavigation 컴포넌트
const HeaderNavigation = ({ children, className = "", ...props }) => {
  return (
    <nav className={`${styles["header-navigation"]} ${className}`} {...props}>
      {children}
    </nav>
  );
};

// HeaderMenuItem 컴포넌트
const HeaderMenuItem = ({
  children,
  href,
  active = false,
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  // 메뉴 아이템 클래스명 생성
  const getMenuItemClassName = () => {
    const baseClass = styles["header-menu-item"];
    const activeClass = active ? styles["header-menu-item--active"] : "";
    const disabledClass = disabled ? styles["header-menu-item--disabled"] : "";
    const customClass = className;

    return [baseClass, activeClass, disabledClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  // 클릭 핸들러
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };
  // 링크가 있는 경우 렌더링
  if (href) {
    return (
      <a
        href={href}
        className={getMenuItemClassName()}
        onClick={handleClick}
        {...props}
      >
        {children}
        {isNotify && <div className={styles["header-menu-item-notify"]}></div>}
      </a>
    );
  }

  // 버튼으로 렌더링
  return (
    <button
      type="button"
      className={getMenuItemClassName()}
      onClick={handleClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// 사용 예시 컴포넌트
const HeaderExample = () => {
  const [activeMenu, setActiveMenu] = React.useState("home");

  // 메뉴 클릭 핸들러
  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    console.log("선택된 메뉴:", menuId);
  };

  // 기본 헤더 렌더링
  const renderBasicHeader = () => (
    <div style={{ marginBottom: "30px" }}>
      <HeaderComponent
        title="루틴 관리 시스템"
        subtitle="일상의 작은 습관들이 큰 변화를 만듭니다"
      />
    </div>
  );

  // Variant별 헤더 렌더링
  const renderVariantHeaders = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <HeaderComponent
        title="Default Header"
        subtitle="기본 스타일의 헤더입니다"
        variant="default"
      />

      <HeaderComponent
        title="Elevated Header"
        subtitle="그림자가 있는 헤더입니다"
        variant="elevated"
      />

      <HeaderComponent
        title="Outlined Header"
        subtitle="테두리가 있는 헤더입니다"
        variant="outlined"
      />

      <HeaderComponent
        title="Filled Header"
        subtitle="배경색이 채워진 헤더입니다"
        variant="filled"
      />
    </div>
  );

  // 크기별 헤더 렌더링
  const renderSizeHeaders = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <HeaderComponent
        title="Small Header"
        subtitle="작은 크기의 헤더입니다"
        size="small"
      />

      <HeaderComponent
        title="Medium Header"
        subtitle="중간 크기의 헤더입니다"
        size="medium"
      />

      <HeaderComponent
        title="Large Header"
        subtitle="큰 크기의 헤더입니다"
        size="large"
      />
    </div>
  );

  // 정렬별 헤더 렌더링
  const renderAlignHeaders = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <HeaderComponent
        title="Left Aligned Header"
        subtitle="왼쪽 정렬된 헤더입니다"
        align="left"
      />

      <HeaderComponent
        title="Center Aligned Header"
        subtitle="가운데 정렬된 헤더입니다"
        align="center"
      />

      <HeaderComponent
        title="Right Aligned Header"
        subtitle="오른쪽 정렬된 헤더입니다"
        align="right"
      />
    </div>
  );

  // 복잡한 헤더 렌더링 (브랜드 + 네비게이션)
  const renderComplexHeader = () => (
    <div style={{ marginBottom: "30px" }}>
      <HeaderComponent variant="elevated" size="large" sticky>
        <HeaderSection>
          <HeaderBrand logo="🏠" brandName="루틴허브" />
        </HeaderSection>

        <HeaderSection>
          <HeaderNavigation>
            <HeaderMenuItem
              active={activeMenu === "home"}
              onClick={() => handleMenuClick("home")}
            >
              홈
            </HeaderMenuItem>
            <HeaderMenuItem
              active={activeMenu === "routines"}
              onClick={() => handleMenuClick("routines")}
            >
              루틴
            </HeaderMenuItem>
            <HeaderMenuItem
              active={activeMenu === "statistics"}
              onClick={() => handleMenuClick("statistics")}
            >
              통계
            </HeaderMenuItem>
            <HeaderMenuItem
              active={activeMenu === "settings"}
              onClick={() => handleMenuClick("settings")}
            >
              설정
            </HeaderMenuItem>
          </HeaderNavigation>
        </HeaderSection>

        <HeaderSection>
          <button
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              cursor: "pointer",
            }}
          >
            로그인
          </button>
        </HeaderSection>
      </HeaderComponent>

      <p>선택된 메뉴: {activeMenu}</p>
    </div>
  );

  // 링크가 있는 헤더 렌더링
  const renderLinkHeader = () => (
    <div style={{ marginBottom: "30px" }}>
      <HeaderComponent variant="outlined" align="center">
        <HeaderSection>
          <HeaderBrand logo="📚" brandName="학습 플랫폼" />
        </HeaderSection>

        <HeaderSection>
          <HeaderNavigation>
            <HeaderMenuItem href="#courses">강의</HeaderMenuItem>
            <HeaderMenuItem href="#community">커뮤니티</HeaderMenuItem>
            <HeaderMenuItem href="#about">소개</HeaderMenuItem>
            <HeaderMenuItem href="#contact">문의</HeaderMenuItem>
          </HeaderNavigation>
        </HeaderSection>
      </HeaderComponent>
    </div>
  );

  // 비활성화된 메뉴가 있는 헤더 렌더링
  const renderDisabledMenuHeader = () => (
    <div style={{ marginBottom: "30px" }}>
      <HeaderComponent variant="filled" align="right">
        <HeaderSection>
          <HeaderBrand logo="🎯" brandName="목표 관리" />
        </HeaderSection>

        <HeaderSection>
          <HeaderNavigation>
            <HeaderMenuItem
              active={activeMenu === "dashboard"}
              onClick={() => handleMenuClick("dashboard")}
            >
              대시보드
            </HeaderMenuItem>
            <HeaderMenuItem
              disabled
              onClick={() => handleMenuClick("analytics")}
            >
              분석 (준비중)
            </HeaderMenuItem>
            <HeaderMenuItem onClick={() => handleMenuClick("profile")}>
              프로필
            </HeaderMenuItem>
          </HeaderNavigation>
        </HeaderSection>
      </HeaderComponent>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px" }}>
      <h2>HeaderComponent 사용 예시</h2>

      <h3>1. 기본 헤더</h3>
      {renderBasicHeader()}

      <h3>2. Variant별 헤더</h3>
      {renderVariantHeaders()}

      <h3>3. 크기별 헤더</h3>
      {renderSizeHeaders()}

      <h3>4. 정렬별 헤더</h3>
      {renderAlignHeaders()}

      <h3>5. 복잡한 헤더 (브랜드 + 네비게이션)</h3>
      {renderComplexHeader()}

      <h3>6. 링크가 있는 헤더</h3>
      {renderLinkHeader()}

      <h3>7. 비활성화된 메뉴가 있는 헤더</h3>
      {renderDisabledMenuHeader()}
    </div>
  );
};

// HeaderComponent에 하위 컴포넌트들을 추가
HeaderComponent.Section = HeaderSection;
HeaderComponent.Brand = HeaderBrand;
HeaderComponent.Navigation = HeaderNavigation;
HeaderComponent.MenuItem = HeaderMenuItem;

export default HeaderComponent;
