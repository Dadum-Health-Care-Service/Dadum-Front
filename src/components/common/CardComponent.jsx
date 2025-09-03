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
}) => {
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`${styles.card} ${className} ${
        disabled ? styles["card--disabled"] : ""
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
      <div className={styles["card__content"]}>
        <h3 className={styles["card__title"]}>{title}</h3>
        <p className={styles["card__details"]}>{details}</p>
      </div>
      <div className={styles["card__button-container"]} onClick={handleClick}>
        <ButtonComponent variant="outline" onClick={onClick} size="medium">
          {buttonText}
        </ButtonComponent>
      </div>
    </div>
  );
};

export default CardComponent;
