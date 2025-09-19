import React from "react";
import styles from "./ContainerComponent.module.css";

// Container variant별 클래스명 매핑
const CONTAINER_VARIANTS = {
  default: "default",
  elevated: "elevated",
  outlined: "outlined",
  filled: "filled",
};

// Container 크기별 클래스명 매핑
const CONTAINER_SIZES = {
  small: "small",
  medium: "medium",
  large: "large",
};

// Container 패딩별 클래스명 매핑
const CONTAINER_PADDINGS = {
  none: "padding-none",
  small: "padding-small",
  medium: "padding-medium",
  large: "padding-large",
};

// Container 마진별 클래스명 매핑
const CONTAINER_MARGINS = {
  none: "margin-none",
  small: "margin-small",
  medium: "margin-medium",
  large: "margin-large",
};

// Container 둥근 모서리별 클래스명 매핑
const CONTAINER_RADII = {
  none: "radius-none",
  small: "radius-small",
  medium: "radius-medium",
  large: "radius-large",
};

// Container 그림자별 클래스명 매핑
const CONTAINER_SHADOWS = {
  none: "shadow-none",
  small: "shadow-small",
  medium: "shadow-medium",
  large: "shadow-large",
};

// 메인 ContainerComponent
const ContainerComponent = ({
  children,
  variant = "default",
  size = "medium",
  padding = "auto",
  margin = "none",
  borderRadius = "auto",
  shadow = "auto",
  className = "",
  onClick,
  disabled = false,
}) => {
  // Container 클래스명 생성
  const getContainerClassName = () => {
    const baseClass = styles.container;
    const variantClass =
      styles[CONTAINER_VARIANTS[variant] || CONTAINER_VARIANTS.default];
    const sizeClass = styles[CONTAINER_SIZES[size] || CONTAINER_SIZES.medium];
    const paddingClass =
      padding === "auto"
        ? ""
        : styles[CONTAINER_PADDINGS[padding] || CONTAINER_PADDINGS.medium];
    const marginClass =
      margin === "none"
        ? ""
        : styles[CONTAINER_MARGINS[margin] || CONTAINER_MARGINS.medium];
    const radiusClass =
      borderRadius === "auto"
        ? ""
        : styles[CONTAINER_RADII[borderRadius] || CONTAINER_RADII.medium];
    const shadowClass =
      shadow === "auto"
        ? ""
        : styles[CONTAINER_SHADOWS[shadow] || CONTAINER_SHADOWS.medium];
    const disabledClass = disabled ? styles["disabled"] : "";
    const customClass = className;

    return [
      baseClass,
      variantClass,
      sizeClass,
      paddingClass,
      marginClass,
      radiusClass,
      shadowClass,
      disabledClass,
      customClass,
    ]
      .filter(Boolean)
      .join(" ");
  };

  // 클릭 핸들러
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e) => {
    if (onClick && !disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      className={getContainerClassName()}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

// 사용 예시 컴포넌트
const ContainerExample = () => {
  // 컨테이너 클릭 핸들러
  const handleContainerClick = (message) => {
    alert(message);
  };

  // 기본 컨테이너들 렌더링
  const renderBasicContainers = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <ContainerComponent variant="default">
        <h4>기본 컨테이너</h4>
        <p>
          이것은 기본 스타일의 컨테이너입니다. 흰색 배경과 그림자가 있습니다.
        </p>
      </ContainerComponent>

      <ContainerComponent variant="elevated">
        <h4>높은 그림자 컨테이너</h4>
        <p>더 강한 그림자 효과를 가진 컨테이너입니다.</p>
      </ContainerComponent>

      <ContainerComponent variant="outlined">
        <h4>아웃라인 컨테이너</h4>
        <p>테두리만 있는 컨테이너입니다.</p>
      </ContainerComponent>

      <ContainerComponent variant="filled">
        <h4>채워진 컨테이너</h4>
        <p>배경색이 채워진 컨테이너입니다.</p>
      </ContainerComponent>
    </div>
  );

  // 크기별 컨테이너 렌더링
  const renderSizeContainers = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <ContainerComponent size="small">
        <h4>작은 컨테이너</h4>
        <p>작은 크기의 컨테이너입니다.</p>
      </ContainerComponent>

      <ContainerComponent size="medium">
        <h4>중간 컨테이너</h4>
        <p>중간 크기의 컨테이너입니다.</p>
      </ContainerComponent>

      <ContainerComponent size="large">
        <h4>큰 컨테이너</h4>
        <p>큰 크기의 컨테이너입니다.</p>
      </ContainerComponent>
    </div>
  );

  // 커스텀 스타일링 컨테이너 렌더링
  const renderCustomStylingContainers = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <ContainerComponent
        variant="outlined"
        padding="large"
        borderRadius="large"
        shadow="none"
      >
        <h4>커스텀 스타일</h4>
        <p>큰 패딩, 큰 둥근 모서리, 그림자 없는 컨테이너입니다.</p>
      </ContainerComponent>

      <ContainerComponent
        variant="filled"
        padding="small"
        margin="large"
        borderRadius="none"
      >
        <h4>미니멀 스타일</h4>
        <p>작은 패딩, 큰 마진, 각진 모서리의 컨테이너입니다.</p>
      </ContainerComponent>
    </div>
  );

  // 클릭 가능한 컨테이너 렌더링
  const renderClickableContainers = () => (
    <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
      <ContainerComponent
        variant="elevated"
        onClick={() =>
          handleContainerClick("첫 번째 컨테이너가 클릭되었습니다!")
        }
        className="clickable-container"
      >
        <h4>클릭 가능한 컨테이너</h4>
        <p>이 컨테이너를 클릭하면 알림이 표시됩니다.</p>
      </ContainerComponent>

      <ContainerComponent
        variant="outlined"
        onClick={() =>
          handleContainerClick("두 번째 컨테이너가 클릭되었습니다!")
        }
        className="clickable-container"
      >
        <h4>또 다른 클릭 가능한 컨테이너</h4>
        <p>이것도 클릭할 수 있습니다.</p>
      </ContainerComponent>
    </div>
  );

  // 비활성화된 컨테이너 렌더링
  const renderDisabledContainer = () => (
    <ContainerComponent variant="default" disabled>
      <h4>비활성화된 컨테이너</h4>
      <p>이 컨테이너는 비활성화되어 있습니다.</p>
    </ContainerComponent>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>ContainerComponent 사용 예시</h2>

      <h3>1. 기본 컨테이너들</h3>
      {renderBasicContainers()}

      <h3>2. 크기별 컨테이너</h3>
      {renderSizeContainers()}

      <h3>3. 커스텀 스타일링</h3>
      {renderCustomStylingContainers()}

      <h3>4. 클릭 가능한 컨테이너</h3>
      {renderClickableContainers()}

      <h3>5. 비활성화된 컨테이너</h3>
      {renderDisabledContainer()}
    </div>
  );
};

export default ContainerComponent;
