import React from "react";
import styles from "./HeaderComponent.module.css";

const HeaderComponent = ({
  children,
  title = "",
  subtitle = "",
  variant = "default", // default, elevated, outlined, filled
  size = "medium", // small, medium, large
  align = "left", // left, center, right
  sticky = false,
  className = "",
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "elevated":
        return styles["header--elevated"];
      case "outlined":
        return styles["header--outlined"];
      case "filled":
        return styles["header--filled"];
      default:
        return styles["header--default"];
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return styles["header--small"];
      case "large":
        return styles["header--large"];
      default:
        return styles["header--medium"];
    }
  };

  const getAlignClass = () => {
    switch (align) {
      case "center":
        return styles["header--center"];
      case "right":
        return styles["header--right"];
      default:
        return styles["header--left"];
    }
  };

  const headerClasses = [
    styles.header,
    getVariantClass(),
    getSizeClass(),
    getAlignClass(),
    sticky ? styles["header--sticky"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <header className={headerClasses} {...props}>
      <div className={styles["header__content"]}>
        {title && <h1 className={styles["header__title"]}>{title}</h1>}

        {subtitle && <p className={styles["header__subtitle"]}>{subtitle}</p>}

        {children && (
          <div className={styles["header__actions"]}>{children}</div>
        )}
      </div>
    </header>
  );
};

// HeaderSection 컴포넌트
const HeaderSection = ({ children, className = "", ...props }) => {
  return (
    <div className={`${styles["header__section"]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// HeaderBrand 컴포넌트
const HeaderBrand = ({ logo, brandName, className = "", ...props }) => {
  return (
    <div className={`${styles["header__brand"]} ${className}`} {...props}>
      {logo && <div className={styles["header__logo"]}>{logo}</div>}
      {brandName && (
        <h2 className={styles["header__brand-name"]}>{brandName}</h2>
      )}
    </div>
  );
};

// HeaderNavigation 컴포넌트
const HeaderNavigation = ({ children, className = "", ...props }) => {
  return (
    <nav className={`${styles["header__navigation"]} ${className}`} {...props}>
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
  const itemClasses = [
    styles["header__menu-item"],
    active ? styles["header__menu-item--active"] : "",
    disabled ? styles["header__menu-item--disabled"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  if (href) {
    return (
      <a href={href} className={itemClasses} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={itemClasses}
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

  const handleMenuClick = (menuId) => {
    setActiveMenu(menuId);
    console.log("선택된 메뉴:", menuId);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px" }}>
      <h2>HeaderComponent 사용 예시</h2>

      <h3>1. 기본 헤더</h3>
      <div style={{ marginBottom: "30px" }}>
        <HeaderComponent
          title="루틴 관리 시스템"
          subtitle="일상의 작은 습관들이 큰 변화를 만듭니다"
        />
      </div>

      <h3>2. Variant별 헤더</h3>
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

      <h3>3. 크기별 헤더</h3>
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

      <h3>4. 정렬별 헤더</h3>
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

      <h3>5. 복잡한 헤더 (브랜드 + 네비게이션)</h3>
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

      <h3>6. 링크가 있는 헤더</h3>
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

      <h3>7. 비활성화된 메뉴가 있는 헤더</h3>
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
    </div>
  );
};

// HeaderComponent에 하위 컴포넌트들을 추가
HeaderComponent.Section = HeaderSection;
HeaderComponent.Brand = HeaderBrand;
HeaderComponent.Navigation = HeaderNavigation;
HeaderComponent.MenuItem = HeaderMenuItem;

export default HeaderComponent;
