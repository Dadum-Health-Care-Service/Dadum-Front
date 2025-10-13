import React from "react";
import ButtonComponent from "./ButtonComponent";
import styles from "./CardComponent.module.css";

const CardComponent = ({
  title = "루틴 제목",
  details = "월/수/금 · 45분",
  buttonText = "시작",
  onClick,
  className = "",
  disabled = false,
  variant = "default",
  children,
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  // children이 있으면 컨테이너로 사용하되, title도 렌더링
  if (children) {
    return (
      <div
        className={`${styles.card} ${className} ${
          disabled ? styles.disabled : ""
        }`}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {title && (
          <div className={styles["card-content"]}>
            <div className={styles["card-title"]}>{title}</div>
            {details && <p className={styles["card-details"]}>{details}</p>}
          </div>
        )}
        {children}
      </div>
    );
  }

  // children이 없으면 루틴 카드로 사용
  return (
    <div
      className={`${styles.card} ${className} ${
        disabled ? styles.disabled : ""
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className={styles["card-content"]}>
        <div className={styles["card-title"]}>{title}</div>
        <p className={styles["card-details"]}>{details}</p>
      </div>
      {children}
      {buttonText && !disabled && (
        <div className={styles["card-button-container"]} onClick={handleClick}>
          <ButtonComponent variant="outline" onClick={onClick} size="medium">
            {buttonText}
          </ButtonComponent>
        </div>
      )}
    </div>
  );
};

export default CardComponent;
