import React, { useEffect } from "react";
import "./ModalComponent.css";

const ModalComponent = ({
  isOpen,
  onClose,
  title = "",
  subtitle = "",
  children,
  size = "medium", // small, medium, large
  variant = "default", // default, elevated, outlined, filled
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = "",
  ...props
}) => {
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

  const handleOverlayClick = (e) => {
    // 오버레이 자체를 클릭했을 때만 모달을 닫음
    if (closeOnOverlayClick && e.target.classList.contains("modal-overlay")) {
      onClose();
    }
  };

  const handleModalClick = (e) => {
    // 모달 내부 클릭 시 이벤트 전파 방지
    e.stopPropagation();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "modal--small";
      case "large":
        return "modal--large";
      default:
        return "modal--medium";
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "elevated":
        return "modal--elevated";
      case "outlined":
        return "modal--outlined";
      case "filled":
        return "modal--filled";
      default:
        return "modal--default";
    }
  };

  const modalClasses = ["modal", getSizeClass(), getVariantClass(), className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className={modalClasses} onClick={handleModalClick} {...props}>
        {/* Header */}
        {(title || subtitle || showCloseButton) && (
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

        {/* Content */}
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
};

// ModalSection 컴포넌트
const ModalSection = ({ children, className = "", ...props }) => {
  return (
    <div className={`modal__section ${className}`} {...props}>
      {children}
    </div>
  );
};

// ModalActions 컴포넌트
const ModalActions = ({
  children,
  className = "",
  align = "right",
  ...props
}) => {
  const alignClass = `modal__actions--${align}`;
  return (
    <div className={`modal__actions ${alignClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// ModalComponent에 하위 컴포넌트들을 추가
ModalComponent.Section = ModalSection;
ModalComponent.Actions = ModalActions;

export default ModalComponent;
