import React, { useEffect } from "react";
import "./ModalComponent.css";

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
  [MODAL_SIZES.SMALL]: "modal--small",
  [MODAL_SIZES.MEDIUM]: "modal--medium",
  [MODAL_SIZES.LARGE]: "modal--large",
};

// 모달 스타일별 CSS 클래스 매핑
const VARIANT_CLASSES = {
  [MODAL_VARIANTS.DEFAULT]: "modal--default",
  [MODAL_VARIANTS.ELEVATED]: "modal--elevated",
  [MODAL_VARIANTS.OUTLINED]: "modal--outlined",
  [MODAL_VARIANTS.FILLED]: "modal--filled",
};

// 유틸리티 함수: CSS 클래스 생성
const createModalClasses = (size, variant, className) => {
  const classes = [
    "modal",
    SIZE_CLASSES[size] || SIZE_CLASSES[MODAL_SIZES.MEDIUM],
    VARIANT_CLASSES[variant] || VARIANT_CLASSES[MODAL_VARIANTS.DEFAULT],
    className,
  ];
  return classes.filter(Boolean).join(" ");
};

// 유틸리티 함수: body 스타일 관리
const manageBodyStyles = (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = "0px";
  } else {
    document.body.style.overflow = "unset";
    document.body.style.paddingRight = "0px";
  }
};

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
  ...props
}) => {
  // 모달 열림/닫힘에 따른 body 스타일 관리
  useEffect(() => {
    manageBodyStyles(isOpen);

    return () => {
      manageBodyStyles(false);
    };
  }, [isOpen]);

  // 오버레이 클릭 처리
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target.classList.contains("modal-overlay")) {
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

  // 모달이 닫혀있으면 렌더링하지 않음
  if (!isOpen) return null;

  // 모달 CSS 클래스 생성
  const modalClasses = createModalClasses(size, variant, className);

  // 헤더가 필요한지 확인
  const shouldShowHeader = title || subtitle || showCloseButton;

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={modalClasses} onClick={handleModalClick} {...props}>
        {/* 헤더 영역 */}
        {shouldShowHeader && (
          <div className="modal__header">
            <div className="modal__header-content">
              {title && <h2 className="modal__title">{title}</h2>}
              {subtitle && <p className="modal__subtitle">{subtitle}</p>}
            </div>
            {showCloseButton && (
              <button
                type="button"
                className="modal__close-button"
                onClick={onClose}
                aria-label="닫기"
              >
                <span>×</span>
              </button>
            )}
          </div>
        )}

        {/* 콘텐츠 영역 */}
        <div className="modal__content">{children}</div>

        {/* 푸터 영역 */}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

// 모달 섹션 컴포넌트
const ModalSection = ({ children, className = "", ...props }) => {
  return (
    <div className={`modal__section ${className}`} {...props}>
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
  const alignClass = `modal__actions--${align}`;
  return (
    <div className={`modal__actions ${alignClass} ${className}`} {...props}>
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
