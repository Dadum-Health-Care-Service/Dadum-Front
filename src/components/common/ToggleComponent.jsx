import { useState } from "react";
import styles from "./ToggleComponent.module.css";

export default function ToggleComponent({
  content,
  variant = "primary",
  children,
}) {
  const [active, setActive] = useState(0);
  const handleClick = (index) => {
    setActive(index);
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
        <h5>{content[active]}</h5>
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
            </button>
          ))}
        </div>
      </div>
      {children[active]}
    </div>
  );
}
