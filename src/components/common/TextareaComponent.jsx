import React from "react";
import styles from "./TextareaComponent.module.css";

const TextareaComponent = ({
  label = "",
  value,
  onChange,
  placeholder = "",
  variant = "outlined", // outlined, filled, standard
  size = "medium", // small, medium, large
  disabled = false,
  required = false,
  error = false,
  helperText = "",
  className = "",
  rows = 4,
  cols,
  maxLength,
  resize = "vertical", // none, both, horizontal, vertical
  autoFocus = false,
  readOnly = false,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "filled":
        return styles["textarea--filled"];
      case "standard":
        return styles["textarea--standard"];
      default:
        return styles["textarea--outlined"];
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case "small":
        return styles["textarea--small"];
      case "large":
        return styles["textarea--large"];
      default:
        return styles["textarea--medium"];
    }
  };

  const getResizeClass = () => {
    switch (resize) {
      case "none":
        return styles["textarea--resize-none"];
      case "both":
        return styles["textarea--resize-both"];
      case "horizontal":
        return styles["textarea--resize-horizontal"];
      default:
        return styles["textarea--resize-vertical"];
    }
  };

  const textareaClasses = [
    styles["textarea__field"],
    getVariantClass(),
    getSizeClass(),
    getResizeClass(),
    error ? styles["textarea--error"] : "",
    disabled ? styles["textarea--disabled"] : "",
    readOnly ? styles["textarea--readonly"] : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles["textarea-wrapper"]} ${className}`}>
      {label && (
        <label htmlFor={label} className={styles["textarea__label"]}>
          {label}{" "}
          {required && <span className={styles["textarea__required"]}>*</span>}
        </label>
      )}

      <textarea
        id={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        autoFocus={autoFocus}
        rows={rows}
        cols={cols}
        maxLength={maxLength}
        className={textareaClasses}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={helperText ? `${label}-helper-text` : undefined}
        {...props}
      />

      <div className={styles["textarea__info"]}>
        {maxLength && (
          <span className={styles["textarea__char-count"]}>
            {value ? value.length : 0}/{maxLength}
          </span>
        )}
      </div>

      {helperText && (
        <p
          id={`${label}-helper-text`}
          className={`${styles["textarea__helper-text"]} ${
            error ? styles["textarea__helper-text--error"] : ""
          }`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

// 사용 예시 컴포넌트
const TextareaExample = () => {
  const [description, setDescription] = React.useState("");
  const [feedback, setFeedback] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [review, setReview] = React.useState("");

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  const handleFeedbackChange = (e) => {
    setFeedback(e.target.value);
  };

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
  };

  const handleReviewChange = (e) => {
    setReview(e.target.value);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>TextareaComponent 사용 예시</h2>

      <h3>1. 기본 Textarea</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="설명"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="내용을 입력해주세요..."
          helperText="루틴에 대한 자세한 설명을 작성해주세요"
          rows={4}
          required
        />

        <p>입력된 내용: {description || "없음"}</p>
      </div>

      <h3>2. Variant별 Textarea</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="Outlined Textarea"
          variant="outlined"
          value={feedback}
          onChange={handleFeedbackChange}
          placeholder="피드백을 입력해주세요..."
          rows={3}
        />

        <TextareaComponent
          label="Filled Textarea"
          variant="filled"
          value={feedback}
          onChange={handleFeedbackChange}
          placeholder="피드백을 입력해주세요..."
          rows={3}
        />

        <TextareaComponent
          label="Standard Textarea"
          variant="standard"
          value={feedback}
          onChange={handleFeedbackChange}
          placeholder="피드백을 입력해주세요..."
          rows={3}
        />
      </div>

      <h3>3. 크기별 Textarea</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="Small Textarea"
          size="small"
          value={notes}
          onChange={handleNotesChange}
          placeholder="간단한 메모..."
          rows={2}
        />

        <TextareaComponent
          label="Medium Textarea"
          size="medium"
          value={notes}
          onChange={handleNotesChange}
          placeholder="일반적인 내용..."
          rows={3}
        />

        <TextareaComponent
          label="Large Textarea"
          size="large"
          value={notes}
          onChange={handleNotesChange}
          placeholder="상세한 내용..."
          rows={4}
        />
      </div>

      <h3>4. 리사이즈 옵션</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="리사이즈 불가"
          resize="none"
          value={review}
          onChange={handleReviewChange}
          placeholder="크기 조절이 불가능합니다..."
          rows={3}
          helperText="사용자가 크기를 조절할 수 없습니다"
        />

        <TextareaComponent
          label="세로로만 리사이즈"
          resize="vertical"
          value={review}
          onChange={handleReviewChange}
          placeholder="세로로만 크기 조절이 가능합니다..."
          rows={3}
          helperText="세로 방향으로만 크기를 조절할 수 있습니다"
        />

        <TextareaComponent
          label="가로로만 리사이즈"
          resize="horizontal"
          value={review}
          onChange={handleReviewChange}
          placeholder="가로로만 크기 조절이 가능합니다..."
          rows={3}
          helperText="가로 방향으로만 크기를 조절할 수 있습니다"
        />

        <TextareaComponent
          label="양방향 리사이즈"
          resize="both"
          value={review}
          onChange={handleReviewChange}
          placeholder="양방향으로 크기 조절이 가능합니다..."
          rows={3}
          helperText="가로, 세로 양방향으로 크기를 조절할 수 있습니다"
        />
      </div>

      <h3>5. 글자 수 제한과 특별한 상태</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="글자 수 제한 (최대 100자)"
          value={description}
          onChange={handleDescriptionChange}
          placeholder="최대 100자까지 입력 가능합니다..."
          maxLength={100}
          rows={4}
          helperText="제품에 대한 간단한 설명을 작성해주세요"
        />

        <TextareaComponent
          label="에러 상태 Textarea"
          error
          value=""
          placeholder="필수 입력 항목입니다..."
          helperText="이 필드는 필수입니다. 내용을 입력해주세요."
          required
          rows={3}
        />

        <TextareaComponent
          label="비활성화된 Textarea"
          disabled
          value="이 내용은 수정할 수 없습니다."
          helperText="현재 편집이 불가능한 상태입니다"
          rows={3}
        />

        <TextareaComponent
          label="읽기 전용 Textarea"
          readOnly
          value="이 내용은 읽기만 가능합니다. 수정할 수 없습니다."
          helperText="읽기 전용 모드입니다"
          rows={3}
        />
      </div>

      <h3>6. 자동 포커스</h3>
      <div style={{ display: "grid", gap: "20px", marginBottom: "30px" }}>
        <TextareaComponent
          label="자동 포커스 Textarea"
          autoFocus
          placeholder="페이지 로드 시 자동으로 포커스됩니다..."
          helperText="이 필드는 페이지 로드 시 자동으로 포커스됩니다"
          rows={3}
        />
      </div>
    </div>
  );
};

export default TextareaComponent;
