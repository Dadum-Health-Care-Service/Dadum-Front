# ModalComponent

공통 컴포넌트들의 스타일을 참고하여 일관된 디자인으로 제작된 모달 컴포넌트입니다.

## 주요 특징

- **일관된 디자인**: HeaderComponent, ContainerComponent와 동일한 디자인 언어
- **접근성**: 키보드 네비게이션, 스크린 리더 지원
- **반응형**: 모든 화면 크기에서 최적화
- **커스터마이징**: 크기, 스타일, 동작 방식 조정 가능
- **애니메이션**: 부드러운 열기/닫기 효과
- **다크 모드**: 시스템 설정에 따른 자동 테마 전환

## Props

| Prop                  | Type                                              | Default   | Description                |
| --------------------- | ------------------------------------------------- | --------- | -------------------------- |
| `isOpen`              | boolean                                           | -         | 모달 열림/닫힘 상태 (필수) |
| `onClose`             | function                                          | -         | 모달 닫기 함수 (필수)      |
| `title`               | string                                            | ""        | 모달 제목                  |
| `subtitle`            | string                                            | ""        | 모달 부제목                |
| `children`            | ReactNode                                         | -         | 모달 내용                  |
| `size`                | "small" \| "medium" \| "large"                    | "medium"  | 모달 크기                  |
| `variant`             | "default" \| "elevated" \| "outlined" \| "filled" | "default" | 모달 스타일                |
| `showCloseButton`     | boolean                                           | true      | 닫기 버튼 표시 여부        |
| `closeOnOverlayClick` | boolean                                           | true      | 오버레이 클릭 시 닫기 여부 |
| `className`           | string                                            | ""        | 추가 CSS 클래스            |

## 크기별 스타일

- **small**: 400px × 200px (최소)
- **medium**: 600px × 300px (최소)
- **large**: 800px × 400px (최소)

## Variant별 스타일

- **default**: 기본 스타일, 투명 테두리
- **elevated**: 그림자 강화, 입체감 있는 디자인
- **outlined**: 테두리 있는 스타일
- **filled**: 배경색이 채워진 스타일

## 하위 컴포넌트

### ModalComponent.Section

모달 내용을 섹션별로 구분할 때 사용합니다.

```jsx
<ModalComponent.Section>
  <p>섹션 내용</p>
</ModalComponent.Section>
```

### ModalComponent.Actions

모달 하단의 액션 버튼들을 배치할 때 사용합니다.

```jsx
<ModalComponent.Actions align="right">
  <ButtonComponent variant="outline-secondary">취소</ButtonComponent>
  <ButtonComponent variant="primary">확인</ButtonComponent>
</ModalComponent.Actions>
```

`align` prop으로 버튼 정렬을 조정할 수 있습니다:

- `"left"`: 왼쪽 정렬
- `"center"`: 가운데 정렬
- `"right"`: 오른쪽 정렬 (기본값)

## 사용 예시

### 기본 모달

```jsx
import ModalComponent from "./ModalComponent";

const [isOpen, setIsOpen] = useState(false);

<ModalComponent
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="알림"
  subtitle="중요한 메시지입니다"
>
  <p>모달 내용을 여기에 작성하세요.</p>
</ModalComponent>;
```

### 폼 모달

```jsx
<ModalComponent
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="사용자 정보"
  subtitle="새로운 사용자를 추가합니다"
  size="large"
  variant="elevated"
>
  <form onSubmit={handleSubmit}>
    <ModalComponent.Section>
      <InputComponent placeholder="이름" />
      <InputComponent placeholder="이메일" type="email" />
    </ModalComponent.Section>

    <ModalComponent.Actions>
      <ButtonComponent
        variant="outline-secondary"
        onClick={() => setIsOpen(false)}
      >
        취소
      </ButtonComponent>
      <ButtonComponent variant="primary" type="submit">
        저장
      </ButtonComponent>
    </ModalComponent.Actions>
  </form>
</ModalComponent>
```

### 확인 모달

```jsx
<ModalComponent
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="삭제 확인"
  subtitle="이 작업은 되돌릴 수 없습니다"
  size="small"
  variant="outlined"
>
  <p>정말로 삭제하시겠습니까?</p>

  <ModalComponent.Actions>
    <ButtonComponent
      variant="outline-secondary"
      onClick={() => setIsOpen(false)}
    >
      취소
    </ButtonComponent>
    <ButtonComponent variant="danger" onClick={handleDelete}>
      삭제
    </ButtonComponent>
  </ModalComponent.Actions>
</ModalComponent>
```

## 접근성 기능

- **키보드 네비게이션**: ESC 키로 모달 닫기
- **포커스 관리**: 모달 열림 시 자동 포커스
- **스크린 리더**: 적절한 ARIA 레이블 및 역할
- **오버레이 클릭**: 배경 클릭 시 모달 닫기

## 반응형 디자인

- **데스크톱**: 최대 너비 제한, 중앙 정렬
- **태블릿**: 화면 너비에 맞춘 조정
- **모바일**: 전체 화면 활용, 세로 스택 레이아웃

## 스타일 커스터마이징

CSS 변수나 클래스 오버라이드를 통해 추가 스타일링이 가능합니다:

```css
.modal {
  --modal-border-radius: 16px;
  --modal-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
}

.modal--custom {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```
