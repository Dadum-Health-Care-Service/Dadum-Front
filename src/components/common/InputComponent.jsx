import React, { useState, useEffect } from 'react';
import styles from "./InputComponent.module.css";

const InputComponent = ({
  label,
  placeholder = "",
  value = "",
  onChange,
  type = "text",
  disabled = false,
  required = false,
  error = "",
  helperText = "",
  className = "",
  size = "medium", // small, medium, large
  variant = "outlined", // outlined, filled, standard
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);

  useEffect(()=>{
    setInternalValue(value);
  },[value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return styles["small"];
      case "large":
        return styles["large"];
      default:
        return styles["medium"];
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "filled":
        return styles["filled"];
      case "standard":
        return styles["standard"];
      default:
        return styles["outlined"];
    }
  };

  const inputClasses = [
    styles["input-component"],
    getSizeClass(),
    getVariantClass(),
    isFocused ? styles["focused"] : "",
    error ? styles["error"] : "",
    disabled ? styles["disabled"] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={inputClasses}>
      {label && (
        <label className={styles["input-label"]}>
          {label}
          {required && <span className={styles["input-required"]}>*</span>}
        </label>
      )}

      <div className={styles["input-wrapper"]}>
        <input
          type={type}
          className={styles["input-field"]}
          placeholder={placeholder}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          required={required}
        />
      </div>

      {(error || helperText) && (
        <div className={styles["input-helper"]}>
          {error ? (
            <span className={styles["input-error-text"]}>{error}</span>
          ) : (
            <span className={styles["input-helper-text"]}>{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

// 사용 예시 컴포넌트
const InputExample = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    description: "",
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    // 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name) newErrors.name = "이름을 입력해주세요.";
    if (!formData.email) newErrors.email = "이메일을 입력해주세요.";
    if (!formData.password) newErrors.password = "비밀번호를 입력해주세요.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      alert("폼이 성공적으로 제출되었습니다!");
      console.log("Form data:", formData);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>InputComponent 사용 예시</h2>

      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "20px" }}
      >
        <h3>1. 기본 입력 필드</h3>
        <InputComponent
          label="이름"
          placeholder="이름을 입력하세요"
          value={formData.name}
          onChange={handleInputChange("name")}
          required
          error={errors.name}
          helperText="실명을 입력해주세요"
        />

        <InputComponent
          label="이메일"
          type="email"
          placeholder="example@email.com"
          value={formData.email}
          onChange={handleInputChange("email")}
          required
          error={errors.email}
        />

        <InputComponent
          label="비밀번호"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={formData.password}
          onChange={handleInputChange("password")}
          required
          error={errors.password}
          helperText="8자 이상 입력해주세요"
        />

        <h3>2. 크기별 입력 필드</h3>
        <InputComponent
          label="작은 입력 필드"
          placeholder="작은 크기"
          size="small"
        />

        <InputComponent
          label="중간 입력 필드"
          placeholder="중간 크기 (기본값)"
          size="medium"
        />

        <InputComponent
          label="큰 입력 필드"
          placeholder="큰 크기"
          size="large"
        />

        <h3>3. 다양한 variant</h3>
        <InputComponent
          label="Outlined (기본값)"
          placeholder="outlined variant"
          variant="outlined"
        />

        <InputComponent
          label="Filled"
          placeholder="filled variant"
          variant="filled"
        />

        <InputComponent
          label="Standard"
          placeholder="standard variant"
          variant="standard"
        />

        <h3>4. 비활성화된 입력 필드</h3>
        <InputComponent
          label="비활성화된 필드"
          placeholder="비활성화됨"
          value="수정할 수 없습니다"
          disabled
        />

        <div style={{ marginTop: "20px" }}>
          <button
            type="submit"
            style={{ padding: "12px 24px", fontSize: "16px" }}
          >
            제출
          </button>
        </div>
      </form>
    </div>
  );
};

export default InputComponent;
