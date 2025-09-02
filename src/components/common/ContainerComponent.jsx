import React from 'react';
import './ContainerComponent.css';

const ContainerComponent = ({ 
  children,
  variant = 'default', // default, elevated, outlined, filled
  size = 'medium', // small, medium, large
  padding = 'auto', // auto, none, small, medium, large
  margin = 'none', // none, small, medium, large
  borderRadius = 'auto', // auto, none, small, medium, large
  shadow = 'auto', // auto, none, small, medium, large
  className = '',
  onClick,
  disabled = false
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'elevated':
        return 'container--elevated';
      case 'outlined':
        return 'container--outlined';
      case 'filled':
        return 'container--filled';
      default:
        return 'container--default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'container--small';
      case 'large':
        return 'container--large';
      default:
        return 'container--medium';
    }
  };

  const getPaddingClass = () => {
    if (padding === 'auto') return '';
    switch (padding) {
      case 'none':
        return 'container--padding-none';
      case 'small':
        return 'container--padding-small';
      case 'large':
        return 'container--padding-large';
      default:
        return 'container--padding-medium';
    }
  };

  const getMarginClass = () => {
    if (margin === 'none') return '';
    switch (margin) {
      case 'small':
        return 'container--margin-small';
      case 'large':
        return 'container--margin-large';
      default:
        return 'container--margin-medium';
    }
  };

  const getBorderRadiusClass = () => {
    if (borderRadius === 'auto') return '';
    switch (borderRadius) {
      case 'none':
        return 'container--radius-none';
      case 'small':
        return 'container--radius-small';
      case 'large':
        return 'container--radius-large';
      default:
        return 'container--radius-medium';
    }
  };

  const getShadowClass = () => {
    if (shadow === 'auto') return '';
    switch (shadow) {
      case 'none':
        return 'container--shadow-none';
      case 'small':
        return 'container--shadow-small';
      case 'large':
        return 'container--shadow-large';
      default:
        return 'container--shadow-medium';
    }
  };

  const containerClasses = [
    'container',
    getVariantClass(),
    getSizeClass(),
    getPaddingClass(),
    getMarginClass(),
    getBorderRadiusClass(),
    getShadowClass(),
    disabled ? 'container--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <div 
      className={containerClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {children}
    </div>
  );
};

// 사용 예시 컴포넌트
const ContainerExample = () => {
  const handleContainerClick = (message) => {
    alert(message);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>ContainerComponent 사용 예시</h2>
      
      <h3>1. 기본 컨테이너들</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <ContainerComponent variant="default">
          <h4>기본 컨테이너</h4>
          <p>이것은 기본 스타일의 컨테이너입니다. 흰색 배경과 그림자가 있습니다.</p>
        </ContainerComponent>
        
        <ContainerComponent variant="elevated">
          <h4>높은 그림자 컨테이너</h4>
          <p>더 강한 그림자 효과를 가진 컨테이너입니다.</p>
        </ContainerComponent>
        
        <ContainerComponent variant="outlined">
          <h4>아웃라인 컨테이너</h4>
          <p>테두리만 있는 컨테이너입니다.</p>
        </ContainerComponent>
        
        <ContainerComponent variant="filled">
          <h4>채워진 컨테이너</h4>
          <p>배경색이 채워진 컨테이너입니다.</p>
        </ContainerComponent>
      </div>
      
      <h3>2. 크기별 컨테이너</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <ContainerComponent size="small">
          <h4>작은 컨테이너</h4>
          <p>작은 크기의 컨테이너입니다.</p>
        </ContainerComponent>
        
        <ContainerComponent size="medium">
          <h4>중간 컨테이너</h4>
          <p>중간 크기의 컨테이너입니다.</p>
        </ContainerComponent>
        
        <ContainerComponent size="large">
          <h4>큰 컨테이너</h4>
          <p>큰 크기의 컨테이너입니다.</p>
        </ContainerComponent>
      </div>
      
      <h3>3. 커스텀 스타일링</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <ContainerComponent 
          variant="outlined" 
          padding="large" 
          borderRadius="large"
          shadow="none"
        >
          <h4>커스텀 스타일</h4>
          <p>큰 패딩, 큰 둥근 모서리, 그림자 없는 컨테이너입니다.</p>
        </ContainerComponent>
        
        <ContainerComponent 
          variant="filled" 
          padding="small" 
          margin="large"
          borderRadius="none"
        >
          <h4>미니멀 스타일</h4>
          <p>작은 패딩, 큰 마진, 각진 모서리의 컨테이너입니다.</p>
        </ContainerComponent>
      </div>
      
      <h3>4. 클릭 가능한 컨테이너</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <ContainerComponent 
          variant="elevated" 
          onClick={() => handleContainerClick('첫 번째 컨테이너가 클릭되었습니다!')}
          className="clickable-container"
        >
          <h4>클릭 가능한 컨테이너</h4>
          <p>이 컨테이너를 클릭하면 알림이 표시됩니다.</p>
        </ContainerComponent>
        
        <ContainerComponent 
          variant="outlined" 
          onClick={() => handleContainerClick('두 번째 컨테이너가 클릭되었습니다!')}
          className="clickable-container"
        >
          <h4>또 다른 클릭 가능한 컨테이너</h4>
          <p>이것도 클릭할 수 있습니다.</p>
        </ContainerComponent>
      </div>
      
      <h3>5. 비활성화된 컨테이너</h3>
      <ContainerComponent variant="default" disabled>
        <h4>비활성화된 컨테이너</h4>
        <p>이 컨테이너는 비활성화되어 있습니다.</p>
      </ContainerComponent>
    </div>
  );
};

export default ContainerComponent;
