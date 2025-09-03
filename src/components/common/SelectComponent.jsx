import React, { useState, useRef, useEffect } from "react";
import styles from "./SelectComponent.module.css";

// 메인 SelectComponent
const SelectComponent = ({
  children,
  label = "",
  value,
  onChange,
  placeholder = "선택해주세요",
  required = false,
  error = false,
  helperText = "",
  disabled = false,
  className = "",
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");
  const dropdownRef = useRef(null);

  // Select 클래스명 생성
  const getSelectClassName = () => {
    const baseClass = styles["select-field"];
    const errorClass = error ? styles["error"] : "";
    const disabledClass = disabled ? styles["disabled"] : "";
    const openClass = isOpen ? styles["open"] : "";
    const customClass = className;

    return [baseClass, errorClass, disabledClass, openClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  // 선택된 옵션의 라벨 찾기
  useEffect(() => {
    if (children) {
      const options = Array.isArray(children) ? children : [children];
      const selectedOption = options.find(
        (option) => option.props.value === value
      );
      if (selectedOption) {
        setSelectedLabel(selectedOption.props.children);
      } else {
        setSelectedLabel("");
      }
    }
  }, [value, children]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 키보드 이벤트 처리
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  // 옵션 클릭 핸들러
  const handleOptionClick = (optionValue, optionLabel) => {
    onChange({ target: { value: optionValue } });
    setSelectedLabel(optionLabel);
    setIsOpen(false);
  };

  // 드롭다운 토글
  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // 라벨 렌더링
  const renderLabel = () => {
    if (!label) return null;

    return (
      <label htmlFor={label} className={styles["select-label"]}>
        {label}{" "}
        {required && <span className={styles["select-required"]}>*</span>}
      </label>
    );
  };

  // 선택된 텍스트 렌더링
  const renderSelectedText = () => (
    <span className={styles["select-selected-text"]}>
      {selectedLabel || placeholder}
    </span>
  );

  // 화살표 아이콘 렌더링
  const renderArrow = () => <span className={styles["select-arrow"]}>▼</span>;

  // 드롭다운 옵션들 렌더링
  const renderDropdownOptions = () => (
    <div className={styles["select-dropdown-content"]}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            onClick: handleOptionClick,
            selected: child.props.value === value,
          });
        }
        return child;
      })}
    </div>
  );

  // 드롭다운 렌더링
  const renderDropdown = () => {
    if (!isOpen) return null;

    return (
      <div className={styles["select-dropdown"]}>{renderDropdownOptions()}</div>
    );
  };

  // 도움말 텍스트 렌더링
  const renderHelperText = () => {
    if (!helperText) return null;

    return (
      <p
        id={`${label}-helper-text`}
        className={`${styles["select-helper-text"]} ${
          error ? styles["select-helper-text--error"] : ""
        }`}
      >
        {helperText}
      </p>
    );
  };

  return (
    <div
      className={`${styles["select-wrapper"]} ${className}`}
      ref={dropdownRef}
    >
      {renderLabel()}

      <div className={styles["select-custom-wrapper"]}>
        <div
          className={getSelectClassName()}
          onClick={toggleDropdown}
          onKeyDown={handleKeyDown}
          tabIndex={disabled ? -1 : 0}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={label || "선택"}
        >
          {renderSelectedText()}
          {renderArrow()}
        </div>

        {renderDropdown()}
      </div>

      {renderHelperText()}
    </div>
  );
};

// OptionComponent
const OptionComponent = ({
  children,
  value,
  disabled = false,
  selected = false,
  className = "",
  onClick,
  ...props
}) => {
  // 옵션 클릭 핸들러
  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(value, children);
    }
  };

  // 옵션 클래스명 생성
  const getOptionClassName = () => {
    const baseClass = styles["select-option"];
    const selectedClass = selected ? styles["select-option--selected"] : "";
    const disabledClass = disabled ? styles["select-option--disabled"] : "";
    const customClass = className;

    return [baseClass, selectedClass, disabledClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <div
      className={getOptionClassName()}
      onClick={handleClick}
      role="option"
      aria-selected={selected}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </div>
  );
};

// 사용 예시 컴포넌트
const SelectExample = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("");

  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // 기본 Select 렌더링
  const renderBasicSelect = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>기본 Select</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        <SelectComponent
          label="카테고리 선택"
          value={selectedCategory}
          onChange={handleCategoryChange}
          placeholder="카테고리를 선택해주세요"
          helperText="원하는 카테고리를 선택하세요"
          required
        >
          <OptionComponent value="운동">운동</OptionComponent>
          <OptionComponent value="포토">포토</OptionComponent>
          <OptionComponent value="기록">기록</OptionComponent>
          <OptionComponent value="레벨 및 업적">레벨 및 업적</OptionComponent>
        </SelectComponent>

        <p>선택된 카테고리: {selectedCategory || "없음"}</p>
      </div>
    </div>
  );

  // 에러 상태와 비활성화 Select 렌더링
  const renderErrorAndDisabledSelects = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>에러 상태와 비활성화</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        <SelectComponent
          label="에러 상태 Select"
          error
          helperText="필수 항목입니다. 선택해주세요."
          required
        >
          <OptionComponent value="option1">옵션 1</OptionComponent>
          <OptionComponent value="option2">옵션 2</OptionComponent>
        </SelectComponent>

        <SelectComponent
          label="비활성화된 Select"
          disabled
          helperText="현재 사용할 수 없습니다"
        >
          <OptionComponent value="option1">옵션 1</OptionComponent>
          <OptionComponent value="option2">옵션 2</OptionComponent>
        </SelectComponent>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>SelectComponent 사용 예시</h2>

      {renderBasicSelect()}
      {renderErrorAndDisabledSelects()}
    </div>
  );
};

// SelectComponent에 OptionComponent 추가
SelectComponent.Option = OptionComponent;

export default SelectComponent;
