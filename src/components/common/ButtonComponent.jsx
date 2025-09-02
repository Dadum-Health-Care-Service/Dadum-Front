import React from 'react';
import './ButtonComponent.css';

const ButtonComponent = ({ 
  children,
  variant = 'primary', // primary, secondary, outline, ghost
  size = 'medium', // small, medium, large
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  fullWidth = false
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'secondary':
        return 'button--secondary';
      case 'outline':
        return 'button--outline';
      case 'ghost':
        return 'button--ghost';
      default:
        return 'button--primary';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'button--small';
      case 'large':
        return 'button--large';
      default:
        return 'button--medium';
    }
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      className={`button ${getVariantClass()} ${getSizeClass()} ${fullWidth ? 'button--full-width' : ''} ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
};

// 사용 예시 컴포넌트
const ButtonExample = () => {
  const handleClick = (message) => {
    alert(message);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Button 컴포넌트 사용 예시</h2>
      
      <h3>1. 기본 버튼들</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <ButtonComponent onClick={() => handleClick('기본 버튼 클릭!')}>
          기본 버튼
        </ButtonComponent>
        
        <ButtonComponent variant="secondary" onClick={() => handleClick('보조 버튼 클릭!')}>
          보조 버튼
        </ButtonComponent>
        
        <ButtonComponent variant="outline" onClick={() => handleClick('아웃라인 버튼 클릭!')}>
          아웃라인 버튼
        </ButtonComponent>
        
        <ButtonComponent variant="ghost" onClick={() => handleClick('고스트 버튼 클릭!')}>
          고스트 버튼
        </ButtonComponent>
      </div>
      
      <h3>2. 크기별 버튼</h3>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
        <ButtonComponent size="small" onClick={() => handleClick('작은 버튼!')}>
          작은 버튼
        </ButtonComponent>
        
        <ButtonComponent size="medium" onClick={() => handleClick('중간 버튼!')}>
          중간 버튼
        </ButtonComponent>
        
        <ButtonComponent size="large" onClick={() => handleClick('큰 버튼!')}>
          큰 버튼
        </ButtonComponent>
      </div>
      
      <h3>3. 상태별 버튼</h3>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <ButtonComponent onClick={() => handleClick('활성 버튼!')}>
          활성 버튼
        </ButtonComponent>
        
        <ButtonComponent disabled onClick={() => handleClick('이것은 실행되지 않습니다')}>
          비활성 버튼
        </ButtonComponent>
      </div>
      
      <h3>4. 전체 너비 버튼</h3>
      <div style={{ marginBottom: '20px' }}>
        <ButtonComponent fullWidth onClick={() => handleClick('전체 너비 버튼!')}>
          전체 너비 버튼
        </ButtonComponent>
      </div>
      
      <h3>5. 제출 버튼</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <ButtonComponent type="submit" onClick={() => handleClick('제출 버튼!')}>
          제출
        </ButtonComponent>
        
        <ButtonComponent type="button" variant="outline" onClick={() => handleClick('취소 버튼!')}>
          취소
        </ButtonComponent>
      </div>
    </div>
  );
};

export default ButtonComponent;
