import React from 'react';
import './ListComponent.css';

const ListComponent = ({
  children,
  variant = 'default', // default, bordered, filled, elevated
  size = 'medium', // small, medium, large
  direction = 'vertical', // vertical, horizontal
  spacing = 'medium', // none, small, medium, large
  divider = false,
  className = '',
  ...props
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'bordered':
        return 'list--bordered';
      case 'filled':
        return 'list--filled';
      case 'elevated':
        return 'list--elevated';
      default:
        return 'list--default';
    }
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small':
        return 'list--small';
      case 'large':
        return 'list--large';
      default:
        return 'list--medium';
    }
  };

  const getDirectionClass = () => {
    return direction === 'horizontal' ? 'list--horizontal' : 'list--vertical';
  };

  const getSpacingClass = () => {
    switch (spacing) {
      case 'none':
        return 'list--spacing-none';
      case 'small':
        return 'list--spacing-small';
      case 'large':
        return 'list--spacing-large';
      default:
        return 'list--spacing-medium';
    }
  };

  const listClasses = [
    'list',
    getVariantClass(),
    getSizeClass(),
    getDirectionClass(),
    getSpacingClass(),
    divider ? 'list--divider' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <ul className={listClasses} {...props}>
      {children}
    </ul>
  );
};

// ListItem 컴포넌트
const ListItem = ({
  children,
  primary = '',
  secondary = '',
  icon,
  avatar,
  action,
  selected = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) => {
  const itemClasses = [
    'list__item',
    selected ? 'list__item--selected' : '',
    disabled ? 'list__item--disabled' : '',
    onClick ? 'list__item--clickable' : '',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  const handleKeyDown = (e) => {
    if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <li
      className={itemClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick && !disabled ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-disabled={disabled}
      {...props}
    >
      {(icon || avatar) && (
        <div className="list__item-start">
          {avatar && <div className="list__item-avatar">{avatar}</div>}
          {icon && <div className="list__item-icon">{icon}</div>}
        </div>
      )}
      
      <div className="list__item-content">
        {primary && <div className="list__item-primary">{primary}</div>}
        {secondary && <div className="list__item-secondary">{secondary}</div>}
        {!primary && !secondary && children}
      </div>
      
      {action && (
        <div className="list__item-end">
          <div className="list__item-action">{action}</div>
        </div>
      )}
    </li>
  );
};

// ListHeader 컴포넌트
const ListHeader = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <li className={`list__header ${className}`} {...props}>
      {children}
    </li>
  );
};

// ListDivider 컴포넌트
const ListDivider = ({
  className = '',
  ...props
}) => {
  return (
    <li className={`list__divider ${className}`} {...props} />
  );
};

// 사용 예시 컴포넌트
const ListExample = () => {
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedTags, setSelectedTags] = React.useState(['react']);

  const handleItemClick = (itemId) => {
    setSelectedItem(itemId);
    console.log('선택된 항목:', itemId);
  };

  const handleTagClick = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: '📊', description: '전체 현황 보기' },
    { id: 'routines', label: '루틴 관리', icon: '📋', description: '루틴 생성 및 관리' },
    { id: 'statistics', label: '통계', icon: '📈', description: '성과 분석' },
    { id: 'settings', label: '설정', icon: '⚙️', description: '앱 설정' }
  ];

  const users = [
    { id: 1, name: '김철수', email: 'kim@example.com', avatar: '👨‍💼', status: 'active' },
    { id: 2, name: '이영희', email: 'lee@example.com', avatar: '👩‍💼', status: 'active' },
    { id: 3, name: '박민수', email: 'park@example.com', avatar: '👨‍💻', status: 'inactive' }
  ];

  const tags = ['react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js'];

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>ListComponent 사용 예시</h2>
      
      <h3>1. 기본 리스트</h3>
      <div style={{ marginBottom: '30px' }}>
        <ListComponent>
          <ListItem primary="첫 번째 항목" secondary="부가 설명" />
          <ListItem primary="두 번째 항목" secondary="부가 설명" />
          <ListItem primary="세 번째 항목" secondary="부가 설명" />
        </ListComponent>
      </div>

      <h3>2. 아이콘이 있는 메뉴 리스트</h3>
      <div style={{ marginBottom: '30px' }}>
        <ListComponent variant="bordered" divider>
          {menuItems.map(item => (
            <ListItem
              key={item.id}
              primary={item.label}
              secondary={item.description}
              icon={item.icon}
              selected={selectedItem === item.id}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </ListComponent>
        <p>선택된 메뉴: {selectedItem || '없음'}</p>
      </div>

      <h3>3. 사용자 리스트 (아바타 포함)</h3>
      <div style={{ marginBottom: '30px' }}>
        <ListComponent variant="elevated">
          <ListHeader>팀 멤버</ListHeader>
          {users.map(user => (
            <ListItem
              key={user.id}
              primary={user.name}
              secondary={user.email}
              avatar={user.avatar}
              action={
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '12px', 
                  fontSize: '12px',
                  background: user.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: user.status === 'active' ? '#166534' : '#92400e'
                }}>
                  {user.status === 'active' ? '활성' : '비활성'}
                </span>
              }
              onClick={() => handleItemClick(user.id)}
            />
          ))}
        </ListComponent>
      </div>

      <h3>4. Variant별 리스트</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h4>Default</h4>
          <ListComponent variant="default">
            <ListItem primary="기본 스타일" secondary="배경 없음" />
            <ListItem primary="두 번째 항목" secondary="심플한 디자인" />
          </ListComponent>
        </div>
        
        <div>
          <h4>Bordered</h4>
          <ListComponent variant="bordered">
            <ListItem primary="테두리 스타일" secondary="경계선이 있음" />
            <ListItem primary="두 번째 항목" secondary="구분이 명확" />
          </ListComponent>
        </div>
        
        <div>
          <h4>Filled</h4>
          <ListComponent variant="filled">
            <ListItem primary="채워진 스타일" secondary="배경색이 있음" />
            <ListItem primary="두 번째 항목" secondary="부드러운 느낌" />
          </ListComponent>
        </div>
        
        <div>
          <h4>Elevated</h4>
          <ListComponent variant="elevated">
            <ListItem primary="그림자 스타일" secondary="입체감이 있음" />
            <ListItem primary="두 번째 항목" secondary="현대적인 느낌" />
          </ListComponent>
        </div>
      </div>

      <h3>5. 가로 방향 리스트 (태그)</h3>
      <div style={{ marginBottom: '30px' }}>
        <ListComponent 
          direction="horizontal" 
          spacing="small"
          variant="filled"
        >
          {tags.map(tag => (
            <ListItem
              key={tag}
              selected={selectedTags.includes(tag)}
              onClick={() => handleTagClick(tag)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              {tag}
            </ListItem>
          ))}
        </ListComponent>
        <p>선택된 태그: {selectedTags.join(', ')}</p>
      </div>

      <h3>6. 크기별 리스트</h3>
      <div style={{ display: 'grid', gap: '20px', marginBottom: '30px' }}>
        <div>
          <h4>Small</h4>
          <ListComponent size="small" variant="bordered">
            <ListItem primary="작은 크기" secondary="컴팩트한 디자인" />
            <ListItem primary="두 번째 항목" secondary="공간 절약" />
          </ListComponent>
        </div>
        
        <div>
          <h4>Medium</h4>
          <ListComponent size="medium" variant="bordered">
            <ListItem primary="중간 크기" secondary="일반적인 크기" />
            <ListItem primary="두 번째 항목" secondary="균형잡힌 디자인" />
          </ListComponent>
        </div>
        
        <div>
          <h4>Large</h4>
          <ListComponent size="large" variant="bordered">
            <ListItem primary="큰 크기" secondary="넉넉한 공간" />
            <ListItem primary="두 번째 항목" secondary="읽기 편한 크기" />
          </ListComponent>
        </div>
      </div>

      <h3>7. 구분선과 헤더가 있는 리스트</h3>
      <div style={{ marginBottom: '30px' }}>
        <ListComponent variant="bordered" divider>
          <ListHeader>개인 정보</ListHeader>
          <ListItem primary="이름" secondary="홍길동" />
          <ListItem primary="이메일" secondary="hong@example.com" />
          <ListDivider />
          <ListHeader>계정 설정</ListHeader>
          <ListItem primary="알림 설정" secondary="활성화됨" />
          <ListItem primary="개인정보 보호" secondary="높음" />
          <ListItem primary="로그아웃" disabled />
        </ListComponent>
      </div>
    </div>
  );
};

// ListComponent에 하위 컴포넌트들을 추가
ListComponent.Item = ListItem;
ListComponent.Header = ListHeader;
ListComponent.Divider = ListDivider;

export default ListComponent;
