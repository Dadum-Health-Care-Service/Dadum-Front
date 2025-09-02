# ModalComponent

모달 다이얼로그를 쉽게 구현할 수 있는 공통 컴포넌트입니다.

## 주요 특징

- **간단한 사용법**: 최소한의 props로 모달 구현
- **반응형 디자인**: 모든 화면 크기에서 최적화
- **접근성 지원**: 키보드 네비게이션 및 스크린 리더 지원
- **커스터마이징**: 크기, 스타일, 동작 방식 조정 가능
- **TypeScript 친화적**: 명확한 타입 정의와 상수 제공

## 기본 사용법

```jsx
import ModalComponent from "./ModalComponent";

const MyComponent = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModalComponent
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="모달 제목"
      subtitle="모달 부제목"
    >
      <p>모달 내용입니다.</p>
    </ModalComponent>
  );
};
```

## Props

### 필수 Props

| Prop      | 타입       | 설명                |
| --------- | ---------- | ------------------- |
| `isOpen`  | `boolean`  | 모달 열림/닫힘 상태 |
| `onClose` | `function` | 모달 닫기 함수      |

### 선택 Props

| Prop                  | 타입        | 기본값      | 설명                                                      |
| --------------------- | ----------- | ----------- | --------------------------------------------------------- |
| `title`               | `string`    | `""`        | 모달 제목                                                 |
| `subtitle`            | `string`    | `""`        | 모달 부제목                                               |
| `children`            | `ReactNode` | -           | 모달 내용                                                 |
| `footer`              | `ReactNode` | -           | 모달 푸터 (주로 ModalActions 사용)                        |
| `size`                | `string`    | `"medium"`  | 모달 크기 (`small`, `medium`, `large`)                    |
| `variant`             | `string`    | `"default"` | 모달 스타일 (`default`, `elevated`, `outlined`, `filled`) |
| `showCloseButton`     | `boolean`   | `true`      | 닫기 버튼 표시 여부                                       |
| `closeOnOverlayClick` | `boolean`   | `true`      | 오버레이 클릭 시 닫기 여부                                |
| `className`           | `string`    | `""`        | 추가 CSS 클래스                                           |

## 상수 사용법

타입 안전성을 위해 상수를 사용하는 것을 권장합니다:

```jsx
import ModalComponent from "./ModalComponent";

// 크기 상수 사용
<ModalComponent
  size={ModalComponent.SIZES.LARGE}
  variant={ModalComponent.VARIANTS.ELEVATED}
  // ... 기타 props
>
  내용
</ModalComponent>;
```

### 사용 가능한 상수

#### 크기 (SIZES)

- `ModalComponent.SIZES.SMALL` - 작은 모달
- `ModalComponent.SIZES.MEDIUM` - 중간 모달 (기본값)
- `ModalComponent.SIZES.LARGE` - 큰 모달

#### 스타일 (VARIANTS)

- `ModalComponent.VARIANTS.DEFAULT` - 기본 스타일 (기본값)
- `ModalComponent.VARIANTS.ELEVATED` - 그림자 강화
- `ModalComponent.VARIANTS.OUTLINED` - 테두리 강조
- `ModalComponent.VARIANTS.FILLED` - 배경색 채움

## 하위 컴포넌트

### ModalComponent.Section

모달 내용을 섹션별로 구분할 때 사용합니다.

```jsx
<ModalComponent.Section>
  <h3>섹션 제목</h3>
  <p>섹션 내용</p>
</ModalComponent.Section>
```

### ModalComponent.Actions

모달 하단의 액션 버튼들을 배치할 때 사용합니다.

```jsx
<ModalComponent.Actions align="right">
  <ButtonComponent variant="secondary" onClick={onCancel}>
    취소
  </ButtonComponent>
  <ButtonComponent variant="primary" onClick={onSave}>
    저장
  </ButtonComponent>
</ModalComponent.Actions>
```

#### Actions Props

| Prop       | 타입        | 기본값    | 설명                                  |
| ---------- | ----------- | --------- | ------------------------------------- |
| `align`    | `string`    | `"right"` | 버튼 정렬 (`left`, `center`, `right`) |
| `children` | `ReactNode` | -         | 액션 버튼들                           |

## Footer 사용법

`footer` prop을 사용하여 모달 하단에 고정된 액션 영역을 만들 수 있습니다:

```jsx
<ModalComponent
  isOpen={isOpen}
  onClose={onClose}
  footer={
    <ModalComponent.Actions>
      <ButtonComponent variant="primary" onClick={onSave}>
        저장
      </ButtonComponent>
      <ButtonComponent variant="secondary" onClick={onClose}>
        취소
      </ButtonComponent>
    </ModalComponent.Actions>
  }
>
  모달 내용
</ModalComponent>
```

## 이벤트 처리

### 키보드 이벤트

- **ESC 키**: 모달 닫기
- **Tab 키**: 모달 내부 요소 간 이동

### 마우스 이벤트

- **오버레이 클릭**: 모달 닫기 (설정 가능)
- **모달 내부 클릭**: 이벤트 전파 방지

## 접근성

- `aria-label` 속성으로 닫기 버튼 설명
- `tabIndex` 설정으로 키보드 포커스 관리
- 스크린 리더 지원을 위한 시맨틱 마크업

## 반응형 디자인

모든 화면 크기에서 최적화된 경험을 제공합니다:

- **모바일**: 전체 화면 활용, 터치 친화적
- **태블릿**: 적절한 여백과 크기 조정
- **데스크톱**: 최대 너비 제한으로 가독성 향상

## CSS 클래스 구조

```css
.modal-overlay          /* 모달 배경 오버레이 */
/* 모달 배경 오버레이 */
├── .modal              /* 모달 컨테이너 */
│   ├── .modal--small  /* 작은 크기 */
│   ├── .modal--medium /* 중간 크기 */
│   ├── .modal--large  /* 큰 크기 */
│   ├── .modal--default /* 기본 스타일 */
│   ├── .modal--elevated /* 그림자 강화 */
│   ├── .modal--outlined /* 테두리 강조 */
│   ├── .modal--filled /* 배경색 채움 */
│   ├── .modal__header /* 헤더 영역 */
│   ├── .modal__content /* 내용 영역 */
│   └── .modal__footer; /* 푸터 영역 */
```

## 사용 예시

### 기본 모달

```jsx
<ModalComponent isOpen={isOpen} onClose={onClose} title="알림">
  <p>작업이 완료되었습니다.</p>
</ModalComponent>
```

### 폼 모달

```jsx
<ModalComponent
  isOpen={isOpen}
  onClose={onClose}
  title="사용자 정보 입력"
  size={ModalComponent.SIZES.LARGE}
  variant={ModalComponent.VARIANTS.ELEVATED}
  footer={
    <ModalComponent.Actions>
      <ButtonComponent variant="primary" onClick={onSubmit}>
        제출
      </ButtonComponent>
      <ButtonComponent variant="secondary" onClick={onClose}>
        취소
      </ButtonComponent>
    </ModalComponent.Actions>
  }
>
  <form>
    <ModalComponent.Section>
      <label>
        이름: <input type="text" />
      </label>
    </ModalComponent.Section>
  </form>
</ModalComponent>
```

### 확인 모달

```jsx
<ModalComponent
  isOpen={isOpen}
  onClose={onClose}
  title="삭제 확인"
  size={ModalComponent.SIZES.SMALL}
  variant={ModalComponent.VARIANTS.OUTLINED}
  footer={
    <ModalComponent.Actions>
      <ButtonComponent variant="danger" onClick={onConfirm}>
        삭제
      </ButtonComponent>
      <ButtonComponent variant="secondary" onClick={onClose}>
        취소
      </ButtonComponent>
    </ModalComponent.Actions>
  }
>
  <p>정말로 이 항목을 삭제하시겠습니까?</p>
</ModalComponent>
```

## 주의사항

1. **body 스크롤**: 모달이 열리면 자동으로 body 스크롤을 비활성화합니다.
2. **z-index**: 모달은 높은 z-index 값을 사용하여 다른 요소 위에 표시됩니다.
3. **포커스 관리**: 모달이 열리면 첫 번째 포커스 가능한 요소에 포커스가 이동합니다.
4. **메모리 누수 방지**: 컴포넌트가 언마운트될 때 body 스타일을 자동으로 복원합니다.

## 성능 최적화

- 조건부 렌더링으로 불필요한 DOM 생성 방지
- `useEffect`를 사용한 사이드 이펙트 관리
- 이벤트 핸들러 최적화
