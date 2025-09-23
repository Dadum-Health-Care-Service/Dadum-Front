import React from "react";
import styles from "./ButtonComponent.module.css";

// 메인 ButtonComponent
const ButtonComponent = ({
  children,
  label,
  variant = "primary",
  size = "medium",
  disabled = false,
  fullWidth = false,
  onClick,
  type = "button",
  className = "",
  required = false,
  ...props
}) => {
  // 버튼 클래스명 생성
  const getButtonClassName = () => {
    const baseClass = styles.button;
    const variantClass = styles[variant] || styles.primary;
    const sizeClass = styles[size] || styles.medium;
    const disabledClass = disabled ? styles.disabled : "";
    const fullWidthClass = fullWidth ? styles["full-width"] : "";
    const customClass = className;

    return [
      baseClass,
      variantClass,
      sizeClass,
      disabledClass,
      fullWidthClass,
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

  return (
    <>
      {label && (
        <label className={styles["button-label"]}>
          {label}
          {required && <span className={styles["button-required"]}>*</span>}
        </label>
      )}
      <button
        type={type}
        className={getButtonClassName()}
        onClick={handleClick}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </>
  );
};

// 사용 예시 컴포넌트
const ButtonExample = () => {
  // 기본 버튼 렌더링
  const renderBasicButtons = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>기본 버튼</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <ButtonComponent variant="primary">Primary</ButtonComponent>
        <ButtonComponent variant="secondary">Secondary</ButtonComponent>
        <ButtonComponent variant="success">Success</ButtonComponent>
        <ButtonComponent variant="danger">Danger</ButtonComponent>
        <ButtonComponent variant="warning">Warning</ButtonComponent>
        <ButtonComponent variant="info">Info</ButtonComponent>
      </div>
    </div>
  );

  // 크기별 버튼 렌더링
  const renderSizeButtons = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>크기별 버튼</h3>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <ButtonComponent size="small">Small</ButtonComponent>
        <ButtonComponent size="medium">Medium</ButtonComponent>
        <ButtonComponent size="large">Large</ButtonComponent>
      </div>
    </div>
  );

  // 상태별 버튼 렌더링
  const renderStateButtons = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>상태별 버튼</h3>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <ButtonComponent>Normal</ButtonComponent>
        <ButtonComponent disabled>Disabled</ButtonComponent>
        <ButtonComponent fullWidth>Full Width</ButtonComponent>
      </div>
    </div>
  );

  // 제출 버튼 렌더링
  const renderSubmitButtons = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>제출 버튼</h3>
      <div style={{ display: "flex", gap: "10px" }}>
        <ButtonComponent type="submit" variant="primary">
          제출
        </ButtonComponent>
        <ButtonComponent type="reset" variant="secondary">
          초기화
        </ButtonComponent>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>ButtonComponent 사용 예시</h2>

      {renderBasicButtons()}
      {renderSizeButtons()}
      {renderStateButtons()}
      {renderSubmitButtons()}
    </div>
  );
};

export default ButtonComponent;
