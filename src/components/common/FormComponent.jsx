import React from "react";
import styles from "./FormComponent.module.css";

// 메인 FormComponent
const FormComponent = ({
  children,
  onSubmit,
  onReset,
  className = "",
  ...props
}) => {
  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  // 폼 초기화 핸들러
  const handleReset = (e) => {
    if (onReset) {
      onReset(e);
    }
  };

  return (
    <form
      className={`${styles.form} ${className}`}
      onSubmit={handleSubmit}
      onReset={handleReset}
      {...props}
    >
      {children}
    </form>
  );
};

// FormField 컴포넌트
const FormField = ({
  children,
  label,
  required = false,
  error,
  helperText,
  className = "",
  ...props
}) => {
  // 필드 클래스명 생성
  const getFieldClassName = () => {
    const baseClass = styles["form-field"];
    const errorClass = error ? styles["form-field--error"] : "";
    const customClass = className;

    return [baseClass, errorClass, customClass].filter(Boolean).join(" ");
  };

  // 라벨 렌더링
  const renderLabel = () => {
    if (!label) return null;

    return (
      <label className={styles["form-field__label"]}>
        {label}
        {required && <span className={styles["form-field__required"]}>*</span>}
      </label>
    );
  };

  // 도움말 텍스트 렌더링
  const renderHelperText = () => {
    if (!helperText && !error) return null;

    return (
      <div className={styles["form-field__helper"]}>
        {error && <span className={styles["form-field__error"]}>{error}</span>}
        {helperText && !error && (
          <span className={styles["form-field__text"]}>{helperText}</span>
        )}
      </div>
    );
  };

  return (
    <div className={getFieldClassName()} {...props}>
      {renderLabel()}
      {children}
      {renderHelperText()}
    </div>
  );
};

// FormSection 컴포넌트
const FormSection = ({
  children,
  title,
  subtitle,
  className = "",
  ...props
}) => {
  // 섹션 클래스명 생성
  const getSectionClassName = () => {
    const baseClass = styles["form-section"];
    const customClass = className;

    return [baseClass, customClass].filter(Boolean).join(" ");
  };

  // 섹션 헤더 렌더링
  const renderSectionHeader = () => {
    if (!title && !subtitle) return null;

    return (
      <div className={styles["form-section__header"]}>
        {title && <h3 className={styles["form-section__title"]}>{title}</h3>}
        {subtitle && (
          <p className={styles["form-section__subtitle"]}>{subtitle}</p>
        )}
      </div>
    );
  };

  return (
    <div className={getSectionClassName()} {...props}>
      {renderSectionHeader()}
      <div className={styles["form-section__content"]}>{children}</div>
    </div>
  );
};

// FormActions 컴포넌트
const FormActions = ({ children, className = "", ...props }) => {
  return (
    <div className={`${styles["form-actions"]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// 사용 예시 컴포넌트
const FormExample = () => {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    message: "",
  });

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("폼 제출:", formData);
    alert("폼이 제출되었습니다!");
  };

  // 폼 초기화 핸들러
  const handleReset = () => {
    setFormData({ name: "", email: "", message: "" });
  };

  // 입력 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 기본 정보 섹션 렌더링
  const renderBasicInfoSection = () => (
    <FormSection title="기본 정보" subtitle="사용자의 기본 정보를 입력해주세요">
      <FormField label="이름" required>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="이름을 입력하세요"
          required
        />
      </FormField>
      <FormField label="이메일" required>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="이메일을 입력하세요"
          required
        />
      </FormField>
    </FormSection>
  );

  // 문의 섹션 렌더링
  const renderInquirySection = () => (
    <FormSection title="문의 내용" subtitle="문의하실 내용을 자세히 적어주세요">
      <FormField label="메시지" required>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          placeholder="문의 내용을 입력하세요"
          rows={4}
          required
        />
      </FormField>
    </FormSection>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
      <h2>FormComponent 사용 예시</h2>

      <FormComponent onSubmit={handleSubmit} onReset={handleReset}>
        {renderBasicInfoSection()}
        {renderInquirySection()}

        <FormActions>
          <button type="submit" style={{ marginRight: "10px" }}>
            제출
          </button>
          <button type="reset">초기화</button>
        </FormActions>
      </FormComponent>
    </div>
  );
};

// FormComponent에 하위 컴포넌트들을 추가
FormComponent.Field = FormField;
FormComponent.Section = FormSection;
FormComponent.Actions = FormActions;

export default FormComponent;
