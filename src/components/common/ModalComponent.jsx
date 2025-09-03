import React, { useEffect } from "react";
import styles from "./ModalComponent.module.css";

// 모달 크기 상수
const MODAL_SIZES = {
  SMALL: "small",
  MEDIUM: "medium",
  LARGE: "large",
};

// 모달 스타일 상수
const MODAL_VARIANTS = {
  DEFAULT: "default",
  ELEVATED: "elevated",
  OUTLINED: "outlined",
  FILLED: "filled",
};

// 모달 크기별 CSS 클래스 매핑
const SIZE_CLASSES = {
  [MODAL_SIZES.SMALL]: styles["small"],
  [MODAL_SIZES.MEDIUM]: styles["medium"],
  [MODAL_SIZES.LARGE]: styles["large"],
};

// 모달 스타일별 CSS 클래스 매핑
const VARIANT_CLASSES = {
  [MODAL_VARIANTS.DEFAULT]: styles["default"],
  [MODAL_VARIANTS.ELEVATED]: styles["elevated"],
  [MODAL_VARIANTS.OUTLINED]: styles["outlined"],
  [MODAL_VARIANTS.FILLED]: styles["filled"],
};

// 메인 ModalComponent
const ModalComponent = ({
  isOpen,
  onClose,
  title = "",
  subtitle = "",
  children,
  footer,
  size = MODAL_SIZES.MEDIUM,
  variant = MODAL_VARIANTS.DEFAULT,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  // 외부에서 넘어올 수 있으나 DOM으로 전달되면 안 됨
  hasFooter, // eslint-disable-line no-unused-vars
  ...props
}) => {
  // 모달 열림/닫힘에 따른 body 스타일 관리
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = "0px";
    } else {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.style.paddingRight = "0px";
    };
  }, [isOpen]);

  // 모달 CSS 클래스 생성
  const getModalClassName = () => {
    const baseClass = styles.modal;
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES[MODAL_SIZES.MEDIUM];
    const variantClass =
      VARIANT_CLASSES[variant] || VARIANT_CLASSES[MODAL_VARIANTS.DEFAULT];
    const customClass = className;

    return [baseClass, sizeClass, variantClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  // 오버레이 클릭 처리
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // 모달 내부 클릭 시 이벤트 전파 방지
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // 키보드 이벤트 처리 (ESC 키)
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // 헤더가 필요한지 확인
  const shouldShowHeader = () => {
    return title || subtitle || showCloseButton;
  };

  // 제목 렌더링
  const renderTitle = () => {
    if (!title) return null;

    return <h2 className={styles["modal-title"]}>{title}</h2>;
  };

  // 부제목 렌더링
  const renderSubtitle = () => {
    if (!subtitle) return null;

    return <p className={styles["modal-subtitle"]}>{subtitle}</p>;
  };

  // 헤더 콘텐츠 렌더링
  const renderHeaderContent = () => (
    <div className={styles["modal-header-content"]}>
      {renderTitle()}
      {renderSubtitle()}
    </div>
  );

  // 닫기 버튼 렌더링
  const renderCloseButton = () => {
    if (!showCloseButton) return null;

    return (
      <button
        type="button"
        className={styles["modal-close-button"]}
        onClick={onClose}
        aria-label="닫기"
      >
        <span>×</span>
      </button>
    );
  };

  // 헤더 영역 렌더링
  const renderHeader = () => {
    if (!shouldShowHeader()) return null;

    return (
      <div className={styles["modal-header"]}>
        {renderHeaderContent()}
        {renderCloseButton()}
      </div>
    );
  };

  // 콘텐츠 영역 렌더링
  const renderContent = () => (
    <div className={styles["modal-content"]}>{children}</div>
  );

  // 푸터 영역 렌더링
  const renderFooter = () => {
    if (!footer) return null;

    return <div className={styles["modal-footer"]}>{footer}</div>;
  };

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  return (
    <div
      className={styles["modal-overlay"]}
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className={getModalClassName()}
        onClick={handleModalClick}
        {...props}
      >
        {renderHeader()}
        {renderContent()}
        {renderFooter()}
      </div>
    </div>
  );
};

// 모달 섹션 컴포넌트
const ModalSection = ({ children, className = "", ...props }) => {
  return (
    <div className={`${styles["modal-section"]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 모달 액션 컴포넌트
const ModalActions = ({
  children,
  className = "",
  align = "right", // left, center, right
  ...props
}) => {
  // 액션 정렬 클래스명 생성
  const getActionClassName = () => {
    const baseClass = styles["modal-actions"];
    const alignClass = styles[`modal-actions--${align}`];
    const customClass = className;

    return [baseClass, alignClass, customClass].filter(Boolean).join(" ");
  };

  return (
    <div className={getActionClassName()} {...props}>
      {children}
    </div>
  );
};

// 하위 컴포넌트들을 ModalComponent에 추가
ModalComponent.Section = ModalSection;
ModalComponent.Actions = ModalActions;

// 상수들을 외부에서 접근할 수 있도록 추가
ModalComponent.SIZES = MODAL_SIZES;
ModalComponent.VARIANTS = MODAL_VARIANTS;

export default ModalComponent;
