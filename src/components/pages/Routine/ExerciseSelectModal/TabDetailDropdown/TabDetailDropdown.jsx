import { useState } from "react";
// 탭별 세부 옵션 드롭다운 컴포넌트
const TabDetailDropdown = ({
  placeholder,
  options,
  value,
  onChange,
  size = "medium",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");

  const handleOptionClick = (optionValue, optionLabel) => {
    setSelectedValue(optionValue);
    setIsOpen(false);
    if (selectedValue.includes(optionValue)) return;

    if (onChange) {
      onChange({ target: { label: optionLabel, value: optionValue } });
    }
  };

  const selectedLabel =
    options.find((opt) => opt.value === selectedValue)?.label || placeholder;

  const sizeStyles = {
    small: { padding: "8px 12px", fontSize: "12px" },
    medium: { padding: "10px 14px", fontSize: "14px" },
    large: { padding: "12px 16px", fontSize: "16px" },
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          ...sizeStyles[size],
          border: "1px solid #d1d5db",
          borderRadius: "6px",
          backgroundColor: "#ffffff",
          color: selectedValue ? "#374151" : "#9ca3af",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "border-color 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.borderColor = "#3b82f6";
        }}
        onMouseLeave={(e) => {
          e.target.style.borderColor = "#d1d5db";
        }}
      >
        <span>{selectedLabel}</span>
        <span
          style={{
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#ffffff",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleOptionClick(option.label, option.value)}
              style={{
                width: "100%",
                ...sizeStyles[size],
                border: "none",
                backgroundColor:
                  selectedValue === option.value ? "#eff6ff" : "transparent",
                color: selectedValue === option.value ? "#1d4ed8" : "#374151",
                textAlign: "left",
                cursor: "pointer",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (selectedValue !== option.value) {
                  e.target.style.backgroundColor = "#f9fafb";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedValue !== option.value) {
                  e.target.style.backgroundColor = "transparent";
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TabDetailDropdown;
