import React, { useState } from "react";
import styles from "./TextareaComponent.module.css";

// 메인 TextareaComponent
const TextareaComponent = ({
  id,
  name,
  value = "",
  onChange,
  placeholder = "",
  label,
  required = false,
  error = false,
  helperText = "",
  disabled = false,
  rows = 4,
  maxLength,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // 텍스트영역 클래스명 생성
  const getTextareaClassName = () => {
    const baseClass = styles["textarea-component"];
    const focusedClass = isFocused ? styles["focused"] : "";
    const errorClass = error ? styles["error"] : "";
    const disabledClass = disabled ? styles["disabled"] : "";
    const customClass = className;

    return [baseClass, focusedClass, errorClass, disabledClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  // 입력 변경 핸들러
  const handleChange = (e) => {
    if (onChange) {
      onChange(e);
    }
  };

  // 포커스 핸들러
  const handleFocus = () => {
    setIsFocused(true);
  };

  // 블러 핸들러
  const handleBlur = () => {
    setIsFocused(false);
  };

  // 라벨 렌더링
  const renderLabel = () => {
    if (!label) return null;

    return (
      <label className={styles["textarea-label"]}>
        {label}
        {required && <span className={styles["textarea-required"]}>*</span>}
      </label>
    );
  };

  // 문자 수 카운트 렌더링
  const renderCharCount = () => {
    if (!maxLength) return null;

    const currentLength = value.length;
    const remaining = maxLength - currentLength;

    return (
      <div className={styles["textarea-char-count"]}>
        {currentLength}/{maxLength}
      </div>
    );
  };

  // 도움말 텍스트 렌더링
  const renderHelperText = () => {
    if (!error && !helperText) return null;

    return (
      <div className={styles["textarea-helper"]}>
        {error && <span className={styles["textarea-error"]}>{error}</span>}
        {helperText && !error && (
          <span className={styles["textarea-text"]}>{helperText}</span>
        )}
      </div>
    );
  };

  return (
    <div className={getTextareaClassName()}>
      {renderLabel()}
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        className={styles["textarea-field"]}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
      {renderCharCount()}
      {renderHelperText()}
    </div>
  );
};

// 사용 예시 컴포넌트
const TextareaExample = () => {
  const [formData, setFormData] = React.useState({
    description: "",
    feedback: "",
    notes: "",
  });

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 기본 텍스트영역 렌더링
  const renderBasicTextarea = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>기본 텍스트영역</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        <TextareaComponent
          label="설명"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="설명을 입력하세요"
          rows={3}
        />
        <TextareaComponent
          label="피드백"
          name="feedback"
          value={formData.feedback}
          onChange={handleInputChange}
          placeholder="피드백을 입력하세요"
          rows={5}
        />
      </div>
    </div>
  );

  // 에러 상태 텍스트영역 렌더링
  const renderErrorTextarea = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>에러 상태 텍스트영역</h3>
      <TextareaComponent
        label="에러가 있는 텍스트영역"
        error="이 필드는 필수입니다"
        placeholder="에러 상태 예시"
      />
    </div>
  );

  // 비활성화된 텍스트영역 렌더링
  const renderDisabledTextarea = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>비활성화된 텍스트영역</h3>
      <TextareaComponent
        label="비활성화된 텍스트영역"
        value="수정할 수 없는 내용입니다"
        disabled
        helperText="이 필드는 수정할 수 없습니다"
      />
    </div>
  );

  // 최대 길이 제한 텍스트영역 렌더링
  const renderMaxLengthTextarea = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>최대 길이 제한 텍스트영역</h3>
      <TextareaComponent
        label="메모 (최대 100자)"
        name="notes"
        value={formData.notes}
        onChange={handleInputChange}
        placeholder="100자 이내로 메모를 입력하세요"
        maxLength={100}
        rows={3}
      />
    </div>
  );

  // 제출 버튼 렌더링
  const renderSubmitButton = () => (
    <div style={{ marginTop: "20px" }}>
      <button type="submit" style={{ padding: "12px 24px", fontSize: "16px" }}>
        제출
      </button>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>TextareaComponent 사용 예시</h2>

      {renderBasicTextarea()}
      {renderErrorTextarea()}
      {renderDisabledTextarea()}
      {renderMaxLengthTextarea()}
      {renderSubmitButton()}
    </div>
  );
};

export default TextareaComponent;
