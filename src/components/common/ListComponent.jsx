import React from "react";
import styles from "./ListComponent.module.css";

// 메인 ListComponent
const ListComponent = ({
  children,
  variant = "default",
  size = "medium",
  className = "",
  ...props
}) => {
  // 리스트 클래스명 생성
  const getListClassName = () => {
    const baseClass = styles.list;
    const variantClass = styles[variant] || styles.default;
    const sizeClass = styles[size] || styles.medium;
    const customClass = className;

    return [baseClass, variantClass, sizeClass, customClass]
      .filter(Boolean)
      .join(" ");
  };

  return (
    <ul className={getListClassName()} {...props}>
      {children}
    </ul>
  );
};

// ListItem 컴포넌트
const ListItem = ({
  children,
  primary = "",
  secondary = "",
  icon,
  avatar,
  action,
  selected = false,
  disabled = false,
  onClick,
  className = "",
  ...props
}) => {
  // 아이템 클래스명 생성
  const getItemClassName = () => {
    const baseClass = styles["list-item"];
    const selectedClass = selected ? styles["list-item--selected"] : "";
    const disabledClass = disabled ? styles["list-item--disabled"] : "";
    const clickableClass = onClick ? styles["list-item--clickable"] : "";
    const customClass = className;

    return [
      baseClass,
      selectedClass,
      disabledClass,
      clickableClass,
      customClass,
    ]
      .filter(Boolean)
      .join(" ");
  };

  // 클릭 핸들러
  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  // 키보드 이벤트 핸들러
  const handleKeyDown = (e) => {
    if (onClick && !disabled && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      handleClick(e);
    }
  };

  // 시작 섹션 렌더링
  const renderStartSection = () => {
    if (!icon && !avatar) return null;

    return (
      <div className={styles["list-item__start"]}>
        {avatar && <div className={styles["list-item__avatar"]}>{avatar}</div>}
        {icon && <div className={styles["list-item__icon"]}>{icon}</div>}
      </div>
    );
  };

  // 콘텐츠 섹션 렌더링
  const renderContentSection = () => (
    <div className={styles["list-item__content"]}>
      {primary && <div className={styles["list-item__primary"]}>{primary}</div>}
      {secondary && (
        <div className={styles["list-item__secondary"]}>{secondary}</div>
      )}
      {children}
    </div>
  );

  // 끝 섹션 렌더링
  const renderEndSection = () => {
    if (!action) return null;

    return <div className={styles["list-item__end"]}>{action}</div>;
  };

  return (
    <li
      className={getItemClassName()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      {...props}
    >
      {renderStartSection()}
      {renderContentSection()}
      {renderEndSection()}
    </li>
  );
};

// ListHeader 컴포넌트
const ListHeader = ({ children, className = "", ...props }) => {
  return (
    <div className={`${styles["list-header"]} ${className}`} {...props}>
      {children}
    </div>
  );
};

// ListDivider 컴포넌트
const ListDivider = ({ className = "", ...props }) => {
  return (
    <div className={`${styles["list-divider"]} ${className}`} {...props}>
      <hr />
    </div>
  );
};

// 사용 예시 컴포넌트
const ListExample = () => {
  const [selectedItem, setSelectedItem] = React.useState(null);

  // 아이템 클릭 핸들러
  const handleItemClick = (itemId) => {
    setSelectedItem(itemId);
    console.log("선택된 아이템:", itemId);
  };

  // 기본 리스트 렌더링
  const renderBasicList = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>기본 리스트</h3>
      <ListComponent>
        <ListItem primary="첫 번째 항목" />
        <ListItem primary="두 번째 항목" />
        <ListItem primary="세 번째 항목" />
      </ListComponent>
    </div>
  );

  // 메뉴 리스트 렌더링
  const renderMenuList = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>메뉴 리스트</h3>
      <ListComponent variant="bordered">
        <ListItem
          primary="홈"
          icon="🏠"
          onClick={() => handleItemClick("home")}
          selected={selectedItem === "home"}
        />
        <ListItem
          primary="설정"
          icon="⚙️"
          onClick={() => handleItemClick("settings")}
          selected={selectedItem === "settings"}
        />
        <ListItem
          primary="프로필"
          icon="👤"
          onClick={() => handleItemClick("profile")}
          selected={selectedItem === "profile"}
        />
      </ListComponent>
    </div>
  );

  // 사용자 리스트 렌더링
  const renderUserList = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>사용자 리스트</h3>
      <ListComponent variant="elevated" size="large">
        <ListItem
          primary="김철수"
          secondary="프론트엔드 개발자"
          avatar="👨‍💻"
          action={<button>연락하기</button>}
        />
        <ListItem
          primary="이영희"
          secondary="백엔드 개발자"
          avatar="👩‍💻"
          action={<button>연락하기</button>}
        />
        <ListItem
          primary="박민수"
          secondary="UI/UX 디자이너"
          avatar="👨‍🎨"
          action={<button>연락하기</button>}
        />
      </ListComponent>
    </div>
  );

  // Variant별 리스트 렌더링
  const renderVariantLists = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>Variant별 리스트</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        <div>
          <h4>Default</h4>
          <ListComponent variant="default">
            <ListItem primary="기본 스타일" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
        <div>
          <h4>Bordered</h4>
          <ListComponent variant="bordered">
            <ListItem primary="테두리 스타일" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
        <div>
          <h4>Filled</h4>
          <ListComponent variant="filled">
            <ListItem primary="채워진 스타일" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
        <div>
          <h4>Elevated</h4>
          <ListComponent variant="elevated">
            <ListItem primary="그림자 스타일" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
      </div>
    </div>
  );

  // 크기별 리스트 렌더링
  const renderSizeLists = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>크기별 리스트</h3>
      <div style={{ display: "grid", gap: "20px" }}>
        <div>
          <h4>Small</h4>
          <ListComponent size="small">
            <ListItem primary="작은 크기" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
        <div>
          <h4>Medium</h4>
          <ListComponent size="medium">
            <ListItem primary="중간 크기" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
        <div>
          <h4>Large</h4>
          <ListComponent size="large">
            <ListItem primary="큰 크기" />
            <ListItem primary="두 번째 항목" />
          </ListComponent>
        </div>
      </div>
    </div>
  );

  // 구분선이 있는 리스트 렌더링
  const renderDividedList = () => (
    <div style={{ marginBottom: "30px" }}>
      <h3>구분선이 있는 리스트</h3>
      <ListComponent variant="bordered">
        <ListItem primary="첫 번째 섹션" />
        <ListDivider />
        <ListItem primary="두 번째 섹션" />
        <ListDivider />
        <ListItem primary="세 번째 섹션" />
      </ListComponent>
    </div>
  );

  return (
    <div style={{ padding: "20px", maxWidth: "800px" }}>
      <h2>ListComponent 사용 예시</h2>

      {renderBasicList()}
      {renderMenuList()}
      {renderUserList()}
      {renderVariantLists()}
      {renderSizeLists()}
      {renderDividedList()}
    </div>
  );
};

// ListComponent에 하위 컴포넌트들을 추가
ListComponent.Item = ListItem;
ListComponent.Header = ListHeader;
ListComponent.Divider = ListDivider;

export default ListComponent;
