import React, { useState } from "react";
import styles from "./FormComponent.module.css";

const FormComponent = ({
  children,
  title = "",
  subtitle = "",
  onSubmit,
  onReset,
  variant = "default", // default, outlined, filled, elevated
  size = "medium", // small, medium, large
  layout = "vertical", // vertical, horizontal, grid
  className = "",
  disabled = false,
  showActions = true,
  submitText = "제출",
  resetText = "초기화",
  submitVariant = "primary",
  resetVariant = "outline",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(e);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = (e) => {
    e.preventDefault();
    if (disabled) return;

    if (onReset) {
      onReset(e);
    } else {
      // 기본 리셋 동작
      const form = e.target.closest("form");
      if (form) {
        form.reset();
      }
    }
  };

  const getVariantClass = () => {
    switch (variant) {
      case "outlined":
        return "form--outlined";
      case "filled":
        return "form--filled";
      case "elevated":
        return "form--elevated";
      default:
        return "form--default";
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return "form--small";
      case "large":
        return "form--large";
      default:
        return "form--medium";
    }
  };

  const getLayoutClass = () => {
    switch (layout) {
      case "horizontal":
        return "form--horizontal";
      case "grid":
        return "form--grid";
      default:
        return "form--vertical";
    }
  };

  const formClasses = [
    "form-component",
    getVariantClass(),
    getSizeClass(),
    getLayoutClass(),
    disabled ? "form--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={formClasses}>
      {(title || subtitle) && (
        <div className={styles["form__header"]}>
          {title && <h2 className="form__title">{title}</h2>}
          {subtitle && <p className="form__subtitle">{subtitle}</p>}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        onReset={handleReset}
        className={styles["form__content"]}
      >
        <div className="form__fields">{children}</div>

        {showActions && (
          <div className={styles["form__actions"]}>
            <button
              type="submit"
              className={`${styles["form__submit"]} ${
                styles[`form__submit--${submitVariant}`]
              }`}
              disabled={disabled || isSubmitting}
            >
              {isSubmitting ? "처리 중..." : submitText}
            </button>

            <button
              type="reset"
              className={`${styles["form__reset"]} ${
                styles[`form__reset--${resetVariant}`]
              }`}
              disabled={disabled}
            >
              {resetText}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

// FormField 컴포넌트 (폼 내부 필드들을 그룹화)
const FormField = ({
  children,
  label = "",
  required = false,
  error = "",
  helperText = "",
  className = "",
  size = "auto", // auto, small, medium, large
}) => {
  const getSizeClass = () => {
    if (size === "auto") return "";
    return `form-field--${size}`;
  };

  const fieldClasses = ["form-field", getSizeClass(), className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={fieldClasses}>
      {label && (
        <label className={styles["form-field__label"]}>
          {label}
          {required && <span className="form-field__required">*</span>}
        </label>
      )}

      <div className={styles["form-field__content"]}>{children}</div>

      {(error || helperText) && (
        <div
          className={styles["form-field__helper"]}
          onClick={handleHelperClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleHelperClick();
            }
          }}
        >
          {error ? (
            <span className={styles["form-field__error-text"]}>{error}</span>
          ) : (
            <span className={styles["form-field__helper-text"]}>
              {helperText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

// FormSection 컴포넌트 (폼을 섹션별로 구분)
const FormSection = ({
  children,
  title = "",
  subtitle = "",
  className = "",
  variant = "default", // default, outlined, filled
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "outlined":
        return "form-section--outlined";
      case "filled":
        return "form-section--filled";
      default:
        return "form-section--default";
    }
  };

  const sectionClasses = ["form-section", getVariantClass(), className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={sectionClasses}>
      {(title || subtitle) && (
        <div className={styles["form-section__header"]}>
          {title && <h3 className="form-section__title">{title}</h3>}
          {subtitle && <p className="form-section__subtitle">{subtitle}</p>}
        </div>
      )}

      <div className={styles["form-section__content"]}>{children}</div>
    </div>
  );
};

// 사용 예시 컴포넌트
const FormExample = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    category: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 에러 제거
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.name) newErrors.name = "이름을 입력해주세요.";
    if (!formData.email) newErrors.email = "이메일을 입력해주세요.";
    if (!formData.agree) newErrors.agree = "약관에 동의해주세요.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // 실제 제출 로직 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("폼이 성공적으로 제출되었습니다!");
      console.log("Form data:", formData);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      message: "",
      category: "",
      agree: false,
    });
    setErrors({});
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>FormComponent 사용 예시</h2>

      <FormComponent
        title="문의 양식"
        subtitle="궁금한 점이나 문의사항을 작성해주세요"
        onSubmit={handleSubmit}
        onReset={handleReset}
        variant="elevated"
        size="large"
        layout="vertical"
        submitText="문의하기"
        resetText="다시 작성"
      >
        <FormSection title="기본 정보" variant="outlined">
          <FormField
            label="이름"
            required
            error={errors.name}
            helperText="실명을 입력해주세요"
          >
            <input
              type="text"
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChange={handleInputChange("name")}
              className={styles["form-input"]}
            />
          </FormField>

          <FormField label="이메일" required error={errors.email}>
            <input
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleInputChange("email")}
              className={styles["form-input"]}
            />
          </FormField>

          <FormField label="연락처" helperText="선택사항입니다">
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={formData.phone}
              onChange={handleInputChange("phone")}
              className={styles["form-input"]}
            />
          </FormField>
        </FormSection>

        <FormSection title="문의 내용" variant="filled">
          <FormField label="문의 유형" helperText="문의 유형을 선택해주세요">
            <select
              value={formData.category}
              onChange={handleInputChange("category")}
              className={styles["form-select"]}
            >
              <option value="">선택해주세요</option>
              <option value="general">일반 문의</option>
              <option value="technical">기술 문의</option>
              <option value="billing">결제 문의</option>
              <option value="other">기타</option>
            </select>
          </FormField>

          <FormField
            label="문의 내용"
            helperText="구체적인 내용을 작성해주세요"
          >
            <textarea
              placeholder="문의하실 내용을 자세히 작성해주세요"
              value={formData.message}
              onChange={handleInputChange("message")}
              rows={4}
              className={styles["form-textarea"]}
            />
          </FormField>

          <FormField>
            <label className={styles["form-checkbox"]}>
              <input
                type="checkbox"
                checked={formData.agree}
                onChange={handleInputChange("agree")}
              />
              <span className={styles["form-checkbox__text"]}>
                개인정보 수집 및 이용에 동의합니다
              </span>
            </label>
            {errors.agree && (
              <span className={styles["form-field__error-text"]}>
                {errors.agree}
              </span>
            )}
          </FormField>
        </FormSection>
      </FormComponent>
    </div>
  );
};

// FormComponent에 하위 컴포넌트들을 추가
FormComponent.Field = FormField;
FormComponent.Section = FormSection;

export default FormComponent;
