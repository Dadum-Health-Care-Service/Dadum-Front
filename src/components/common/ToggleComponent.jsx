import { useState } from "react";
import styles from "./ToggleComponent.module.css";
import NotificationDot from "./NotificationDot";

export default function ToggleComponent({
  content,
  variant = "primary",
  isNotify = false,
  viewNotify = null,
  notifyIndex = -1,
  children,
}) {
  const [active, setActive] = useState(0);
  const handleClick = (index) => {
    setActive(index);
    if (index === notifyIndex) {
      viewNotify(false);
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "primary":
        return styles["primary"];
      default:
        return styles["default"];
    }
  };

  return (
    <div className={`${styles.toggleComponent}`}>
      <div className={`${styles.toggleComponentContent}`}>
        {children ? <h5>{content[active]}</h5> : null}
        <div className={`${styles.toggleComponentButtons}`}>
          {content.map((item, index) => (
            <button
              key={index}
              className={`${styles.toggleComponentButton} ${
                active === index ? styles.active : ""
              } ${getVariantClass()}`}
              onClick={() => handleClick(index)}
            >
              {item}
              {isNotify && notifyIndex === index && <NotificationDot />}
            </button>
          ))}
        </div>
      </div>
      {children ? children[active] : null}
    </div>
  );
}
