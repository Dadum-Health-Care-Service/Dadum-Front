# SegmentedControl 컴포넌트

이미지와 동일한 디자인의 React 공통 컴포넌트입니다.

## 디자인 특징

- **비활성 상태**: 흰색 배경, 파란색 테두리(2px), 파란색 텍스트
- **활성 상태**: 파란색 그라데이션 배경, 흰색 텍스트
- **모든 버튼**: 둥근 모서리(24px), 일관된 높이(40px), 적절한 간격(6px)

## 사용법

### 기본 사용법

```jsx
import SegmentedControl from './components/SegmentedControl';

function App() {
  const [selectedOption, setSelectedOption] = useState('레벨 및 업적');

  return (
    <SegmentedControl 
      value={selectedOption}
      onChange={setSelectedOption}
    />
  );
}
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `options` | `string[]` | `['운동', '포토', '기록', '레벨 및 업적']` | 선택 가능한 옵션들의 배열 |
| `value` | `string` | `options[3]` | 현재 선택된 옵션 |
| `onChange` | `(value: string) => void` | - | 옵션이 변경될 때 호출되는 콜백 함수 |
| `className` | `string` | `''` | 추가 CSS 클래스명 |

### 커스텀 옵션

```jsx
<SegmentedControl 
  options={['홈', '검색', '프로필', '설정']}
  value="프로필"
  onChange={(value) => console.log('Selected:', value)}
/>
```

## 스타일링

컴포넌트는 CSS 모듈을 사용하며, 다음과 같은 클래스명을 제공합니다:

- `.segmented-control`: 컨테이너
- `.segmented-control__option`: 개별 옵션 버튼
- `.segmented-control__option--active`: 활성화된 옵션

## 접근성

- 키보드 네비게이션 지원
- 포커스 표시
- 스크린 리더 호환
- 적절한 ARIA 속성

## 반응형 디자인

모바일 디바이스에서는 자동으로 크기와 간격이 조정됩니다.

