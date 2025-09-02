import React from 'react';
import './SelectComponent.css';

const SelectComponent = ({
  children,
  label = '',
  value,
  onChange,
  placeholder = '선택해주세요',
  variant = 'outlined', // outlined, filled, standard
  size = 'medium', // small, medium, large
  disabled = false,
  required = false,
  error = false,
  helperText = '',
  className = '',
  multiple = false,
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'filled':
        return 'select--filled';
      case 'standard':
        return 'select--standard';
      default:
        return 'select--outlined';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'select--small';
      case 'large':
        return 'select--large';
      default:
        return 'select--medium';
    }
  };

  const selectClasses = [
    'select__field',
    getVariantClass(),
    getSizeClass(),
    error ? 'select--error' : '',
    disabled ? 'select--disabled' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={`select-wrapper ${className}`}>
      {label && (
        <label htmlFor={label} className="select__label">
          {label} {required && <span className="select__required">*</span>}
        </label>
      )}
      
      <select
        id={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        multiple={multiple}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={helperText ? `${label}-helper-text` : undefined}
        {...props}
      >
        {!multiple && placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      
      {helperText && (
        <p id={`${label}-helper-text`} className={`select__helper-text ${error ? 'select__helper-text--error' : ''}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

// OptionComponent
const OptionComponent = ({
  children,
  value,
  disabled = false,
  selected = false,
  className = '',
  ...props
}) => {
  return (
    <option
      value={value}
      disabled={disabled}
      selected={selected}
      className={`select__option ${className}`}
      {...props}
    >
      {children}
    </option>
  );
};

// 사용 예시 컴포넌트
const SelectExample = () => {
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [selectedSize, setSelectedSize] = React.useState('medium');

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  const handleTagsChange = (e) => {
    const values = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedTags(values);
  };

  const handleSizeChange = (e) => {
    setSelectedSize(e.target.value);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>SelectComponent 사용 예시</h2>
      
      <h3>1. 기본 Select</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
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
        
        <p>선택된 카테고리: {selectedCategory || '없음'}</p>
      </div>

      <h3>2. Variant별 Select</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <SelectComponent
          label="Outlined Select"
          variant="outlined"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="small">Small</OptionComponent>
          <OptionComponent value="medium">Medium</OptionComponent>
          <OptionComponent value="large">Large</OptionComponent>
        </SelectComponent>
        
        <SelectComponent
          label="Filled Select"
          variant="filled"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="small">Small</OptionComponent>
          <OptionComponent value="medium">Medium</OptionComponent>
          <OptionComponent value="large">Large</OptionComponent>
        </SelectComponent>
        
        <SelectComponent
          label="Standard Select"
          variant="standard"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="small">Small</OptionComponent>
          <OptionComponent value="medium">Medium</OptionComponent>
          <OptionComponent value="large">Large</OptionComponent>
        </SelectComponent>
      </div>

      <h3>3. 크기별 Select</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <SelectComponent
          label="Small Select"
          size="small"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="option1">옵션 1</OptionComponent>
          <OptionComponent value="option2">옵션 2</OptionComponent>
          <OptionComponent value="option3">옵션 3</OptionComponent>
        </SelectComponent>
        
        <SelectComponent
          label="Medium Select"
          size="medium"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="option1">옵션 1</OptionComponent>
          <OptionComponent value="option2">옵션 2</OptionComponent>
          <OptionComponent value="option3">옵션 3</OptionComponent>
        </SelectComponent>
        
        <SelectComponent
          label="Large Select"
          size="large"
          value={selectedSize}
          onChange={handleSizeChange}
        >
          <OptionComponent value="option1">옵션 1</OptionComponent>
          <OptionComponent value="option2">옵션 2</OptionComponent>
          <OptionComponent value="option3">옵션 3</OptionComponent>
        </SelectComponent>
      </div>

      <h3>4. 다중 선택 Select</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <SelectComponent
          label="태그 선택 (다중)"
          multiple
          value={selectedTags}
          onChange={handleTagsChange}
          helperText="Ctrl/Cmd를 누른 채로 여러 항목을 선택할 수 있습니다"
          size="large"
        >
          <OptionComponent value="react">React</OptionComponent>
          <OptionComponent value="vue">Vue</OptionComponent>
          <OptionComponent value="angular">Angular</OptionComponent>
          <OptionComponent value="svelte">Svelte</OptionComponent>
          <OptionComponent value="next">Next.js</OptionComponent>
          <OptionComponent value="nuxt">Nuxt.js</OptionComponent>
        </SelectComponent>
        
        <p>선택된 태그: {selectedTags.join(', ') || '없음'}</p>
      </div>

      <h3>5. 에러 상태와 비활성화</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
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
};

// SelectComponent에 OptionComponent 추가
SelectComponent.Option = OptionComponent;

export default SelectComponent;
