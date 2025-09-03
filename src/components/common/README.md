# 공통 컴포넌트 사용법

이 문서는 프로젝트에서 사용하는 공통 컴포넌트들의 기본 사용법과 props를 설명합니다.

## 📋 목차

- [ButtonComponent](#buttoncomponent)
- [CardComponent](#cardcomponent)
- [ContainerComponent](#containercomponent)
- [FormComponent](#formcomponent)
- [HeaderComponent](#headercomponent)
- [InputComponent](#inputcomponent)
- [ListComponent](#listcomponent)
- [ModalComponent](#modalcomponent)
- [SelectComponent](#selectcomponent)
- [TextareaComponent](#textareacomponent)

---

## ButtonComponent

### 기본 사용법

```jsx
<ButtonComponent onClick={handleClick}>클릭하세요</ButtonComponent>
```

### Props

| Prop        | 타입      | 기본값      | 설명                                                                         |
| ----------- | --------- | ----------- | ---------------------------------------------------------------------------- |
| `children`  | ReactNode | -           | 버튼 내부 텍스트/컨텐츠                                                      |
| `variant`   | string    | `"primary"` | 버튼 스타일 (`primary`, `secondary`, `success`, `danger`, `warning`, `info`) |
| `size`      | string    | `"medium"`  | 버튼 크기 (`small`, `medium`, `large`)                                       |
| `disabled`  | boolean   | `false`     | 비활성화 여부                                                                |
| `fullWidth` | boolean   | `false`     | 전체 너비 사용 여부                                                          |
| `onClick`   | function  | -           | 클릭 이벤트 핸들러                                                           |
| `type`      | string    | `"button"`  | 버튼 타입 (`button`, `submit`, `reset`)                                      |
| `className` | string    | `""`        | 추가 CSS 클래스                                                              |

---

## CardComponent

### 기본 사용법

```jsx
<CardComponent
  title="카드 제목"
  details="카드 설명"
  buttonText="버튼"
  onClick={handleCardClick}
/>
```

### Props

| Prop         | 타입     | 기본값              | 설명                    |
| ------------ | -------- | ------------------- | ----------------------- |
| `title`      | string   | `"루틴 제목"`       | 카드 제목               |
| `details`    | string   | `"월/수/금 · 45분"` | 카드 상세 정보          |
| `buttonText` | string   | `"시작"`            | 버튼 텍스트             |
| `onClick`    | function | -                   | 카드 클릭 이벤트 핸들러 |
| `className`  | string   | `""`                | 추가 CSS 클래스         |
| `disabled`   | boolean  | `false`             | 비활성화 여부           |

---

## ContainerComponent

### 기본 사용법

```jsx
<ContainerComponent>컨테이너 내용</ContainerComponent>
```

### Props

| Prop        | 타입      | 기본값      | 설명                                                          |
| ----------- | --------- | ----------- | ------------------------------------------------------------- |
| `children`  | ReactNode | -           | 컨테이너 내부 컨텐츠                                          |
| `variant`   | string    | `"default"` | 컨테이너 스타일 (`default`, `elevated`, `outlined`, `filled`) |
| `size`      | string    | `"medium"`  | 컨테이너 크기 (`small`, `medium`, `large`)                    |
| `onClick`   | function  | -           | 클릭 이벤트 핸들러                                            |
| `className` | string    | `""`        | 추가 CSS 클래스                                               |

---

## FormComponent

### 기본 사용법

```jsx
<FormComponent onSubmit={handleSubmit} onReset={handleReset}>
  <FormComponent.Field label="이름" required>
    <input type="text" />
  </FormComponent.Field>

  <FormComponent.Section title="기본 정보">폼 섹션 내용</FormComponent.Section>

  <FormComponent.Actions>
    <button type="submit">제출</button>
    <button type="reset">초기화</button>
  </FormComponent.Actions>
</FormComponent>
```

### Props

#### FormComponent

| Prop        | 타입      | 기본값 | 설명                    |
| ----------- | --------- | ------ | ----------------------- |
| `children`  | ReactNode | -      | 폼 내부 컨텐츠          |
| `onSubmit`  | function  | -      | 폼 제출 이벤트 핸들러   |
| `onReset`   | function  | -      | 폼 초기화 이벤트 핸들러 |
| `className` | string    | `""`   | 추가 CSS 클래스         |

#### FormComponent.Field

| Prop         | 타입      | 기본값  | 설명             |
| ------------ | --------- | ------- | ---------------- |
| `children`   | ReactNode | -       | 필드 내부 컨텐츠 |
| `label`      | string    | -       | 필드 라벨        |
| `required`   | boolean   | `false` | 필수 입력 여부   |
| `error`      | string    | -       | 에러 메시지      |
| `helperText` | string    | -       | 도움말 텍스트    |
| `className`  | string    | `""`    | 추가 CSS 클래스  |

#### FormComponent.Section

| Prop        | 타입      | 기본값 | 설명             |
| ----------- | --------- | ------ | ---------------- |
| `children`  | ReactNode | -      | 섹션 내부 컨텐츠 |
| `title`     | string    | -      | 섹션 제목        |
| `subtitle`  | string    | -      | 섹션 부제목      |
| `className` | string    | `""`   | 추가 CSS 클래스  |

#### FormComponent.Actions

| Prop        | 타입      | 기본값 | 설명            |
| ----------- | --------- | ------ | --------------- |
| `children`  | ReactNode | -      | 액션 버튼들     |
| `className` | string    | `""`   | 추가 CSS 클래스 |

---

## HeaderComponent

### 기본 사용법

```jsx
<HeaderComponent>
  <HeaderComponent.Section>
    <HeaderComponent.Title>제목</HeaderComponent.Title>
    <HeaderComponent.Subtitle>부제목</HeaderComponent.Subtitle>
  </HeaderComponent.Section>

  <HeaderComponent.Actions>
    <button>액션</button>
  </HeaderComponent.Actions>
</HeaderComponent>
```

### Props

#### HeaderComponent

| Prop        | 타입      | 기본값      | 설명                                                      |
| ----------- | --------- | ----------- | --------------------------------------------------------- |
| `children`  | ReactNode | -           | 헤더 내부 컨텐츠                                          |
| `variant`   | string    | `"default"` | 헤더 스타일 (`default`, `elevated`, `outlined`, `filled`) |
| `size`      | string    | `"medium"`  | 헤더 크기 (`small`, `medium`, `large`)                    |
| `align`     | string    | `"left"`    | 정렬 방식 (`left`, `center`, `right`)                     |
| `className` | string    | `""`        | 추가 CSS 클래스                                           |

#### HeaderComponent.Section

| Prop        | 타입      | 기본값 | 설명             |
| ----------- | --------- | ------ | ---------------- |
| `children`  | ReactNode | -      | 섹션 내부 컨텐츠 |
| `className` | string    | `""`   | 추가 CSS 클래스  |

#### HeaderComponent.Title

| Prop        | 타입      | 기본값 | 설명            |
| ----------- | --------- | ------ | --------------- |
| `children`  | ReactNode | -      | 제목 텍스트     |
| `className` | string    | `""`   | 추가 CSS 클래스 |

#### HeaderComponent.Subtitle

| Prop        | 타입      | 기본값 | 설명            |
| ----------- | --------- | ------ | --------------- |
| `children`  | ReactNode | -      | 부제목 텍스트   |
| `className` | string    | `""`   | 추가 CSS 클래스 |

#### HeaderComponent.Actions

| Prop        | 타입      | 기본값 | 설명            |
| ----------- | --------- | ------ | --------------- |
| `children`  | ReactNode | -      | 액션 버튼들     |
| `className` | string    | `""`   | 추가 CSS 클래스 |

---

## InputComponent

### 기본 사용법

```jsx
<InputComponent
  label="이름"
  value={name}
  onChange={handleChange}
  placeholder="이름을 입력하세요"
  required
/>
```

### Props

| Prop          | 타입     | 기본값       | 설명                                       |
| ------------- | -------- | ------------ | ------------------------------------------ |
| `label`       | string   | -            | 입력 필드 라벨                             |
| `value`       | string   | `""`         | 입력 값                                    |
| `onChange`    | function | -            | 값 변경 이벤트 핸들러                      |
| `placeholder` | string   | `""`         | 플레이스홀더 텍스트                        |
| `type`        | string   | `"text"`     | 입력 타입 (`text`, `email`, `password` 등) |
| `disabled`    | boolean  | `false`      | 비활성화 여부                              |
| `required`    | boolean  | `false`      | 필수 입력 여부                             |
| `error`       | string   | -            | 에러 메시지                                |
| `helperText`  | string   | -            | 도움말 텍스트                              |
| `size`        | string   | `"medium"`   | 크기 (`small`, `medium`, `large`)          |
| `variant`     | string   | `"outlined"` | 스타일 (`outlined`, `filled`, `standard`)  |
| `className`   | string   | `""`         | 추가 CSS 클래스                            |

---

## ListComponent

### 기본 사용법

```jsx
<ListComponent variant="bordered" size="medium">
  <ListComponent.Item primary="첫 번째 항목" />
  <ListComponent.Item primary="두 번째 항목" secondary="부가 설명" />
  <ListComponent.Item primary="세 번째 항목" icon="🏠" />
</ListComponent>
```

### Props

#### ListComponent

| Prop        | 타입      | 기본값      | 설명                                                        |
| ----------- | --------- | ----------- | ----------------------------------------------------------- |
| `children`  | ReactNode | -           | 리스트 아이템들                                             |
| `variant`   | string    | `"default"` | 리스트 스타일 (`default`, `bordered`, `filled`, `elevated`) |
| `size`      | string    | `"medium"`  | 리스트 크기 (`small`, `medium`, `large`)                    |
| `className` | string    | `""`        | 추가 CSS 클래스                                             |

#### ListComponent.Item

| Prop        | 타입      | 기본값  | 설명               |
| ----------- | --------- | ------- | ------------------ |
| `children`  | ReactNode | -       | 아이템 내부 컨텐츠 |
| `primary`   | string    | -       | 주요 텍스트        |
| `secondary` | string    | -       | 보조 텍스트        |
| `icon`      | ReactNode | -       | 아이콘             |
| `avatar`    | ReactNode | -       | 아바타 이미지      |
| `action`    | ReactNode | -       | 액션 버튼/링크     |
| `selected`  | boolean   | `false` | 선택 상태 여부     |
| `disabled`  | boolean   | `false` | 비활성화 여부      |
| `onClick`   | function  | -       | 클릭 이벤트 핸들러 |
| `className` | string    | `""`    | 추가 CSS 클래스    |

#### ListComponent.Header

| Prop        | 타입      | 기본값 | 설명            |
| ----------- | --------- | ------ | --------------- |
| `children`  | ReactNode | -      | 헤더 텍스트     |
| `className` | string    | `""`   | 추가 CSS 클래스 |

#### ListComponent.Divider

| Prop        | 타입   | 기본값 | 설명            |
| ----------- | ------ | ------ | --------------- |
| `className` | string | `""`   | 추가 CSS 클래스 |

---

## ModalComponent

### 기본 사용법

```jsx
<ModalComponent
  isOpen={isModalOpen}
  onClose={closeModal}
  title="모달 제목"
  size="medium"
>
  <ModalComponent.Section>모달 내용</ModalComponent.Section>

  <ModalComponent.Actions align="right">
    <button onClick={closeModal}>닫기</button>
    <button onClick={handleSubmit}>확인</button>
  </ModalComponent.Actions>
</ModalComponent>
```

### Props

#### ModalComponent

| Prop              | 타입      | 기본값      | 설명                                                      |
| ----------------- | --------- | ----------- | --------------------------------------------------------- |
| `children`        | ReactNode | -           | 모달 내부 컨텐츠                                          |
| `isOpen`          | boolean   | `false`     | 모달 열림/닫힘 상태                                       |
| `onClose`         | function  | -           | 모달 닫기 이벤트 핸들러                                   |
| `title`           | string    | -           | 모달 제목                                                 |
| `subtitle`        | string    | -           | 모달 부제목                                               |
| `size`            | string    | `"medium"`  | 모달 크기 (`small`, `medium`, `large`)                    |
| `variant`         | string    | `"default"` | 모달 스타일 (`default`, `elevated`, `outlined`, `filled`) |
| `showCloseButton` | boolean   | `true`      | 닫기 버튼 표시 여부                                       |
| `footer`          | ReactNode | -           | 푸터 영역 (ModalActions)                                  |
| `className`       | string    | `""`        | 추가 CSS 클래스                                           |

#### ModalComponent.Section

| Prop        | 타입      | 기본값 | 설명             |
| ----------- | --------- | ------ | ---------------- |
| `children`  | ReactNode | -      | 섹션 내부 컨텐츠 |
| `className` | string    | `""`   | 추가 CSS 클래스  |

#### ModalComponent.Actions

| Prop        | 타입      | 기본값    | 설명                                  |
| ----------- | --------- | --------- | ------------------------------------- |
| `children`  | ReactNode | -         | 액션 버튼들                           |
| `align`     | string    | `"right"` | 정렬 방식 (`left`, `center`, `right`) |
| `className` | string    | `""`      | 추가 CSS 클래스                       |

---

## SelectComponent

### 기본 사용법

```jsx
<SelectComponent
  label="카테고리 선택"
  value={selectedCategory}
  onChange={handleCategoryChange}
  placeholder="카테고리를 선택하세요"
  required
>
  <SelectComponent.Option value="운동">운동</SelectComponent.Option>
  <SelectComponent.Option value="포토">포토</SelectComponent.Option>
  <SelectComponent.Option value="기록">기록</SelectComponent.Option>
</SelectComponent>
```

### Props

#### SelectComponent

| Prop          | 타입      | 기본값           | 설명                  |
| ------------- | --------- | ---------------- | --------------------- |
| `children`    | ReactNode | -                | Select 옵션들         |
| `label`       | string    | -                | Select 라벨           |
| `value`       | string    | -                | 선택된 값             |
| `onChange`    | function  | -                | 값 변경 이벤트 핸들러 |
| `placeholder` | string    | `"선택해주세요"` | 플레이스홀더 텍스트   |
| `required`    | boolean   | `false`          | 필수 선택 여부        |
| `error`       | boolean   | `false`          | 에러 상태 여부        |
| `helperText`  | string    | -                | 도움말 텍스트         |
| `disabled`    | boolean   | `false`          | 비활성화 여부         |
| `className`   | string    | `""`             | 추가 CSS 클래스       |

#### SelectComponent.Option

| Prop        | 타입      | 기본값  | 설명                           |
| ----------- | --------- | ------- | ------------------------------ |
| `children`  | ReactNode | -       | 옵션 텍스트                    |
| `value`     | string    | -       | 옵션 값                        |
| `disabled`  | boolean   | `false` | 비활성화 여부                  |
| `selected`  | boolean   | `false` | 선택 상태 여부                 |
| `onClick`   | function  | -       | 클릭 이벤트 핸들러 (내부 사용) |
| `className` | string    | `""`    | 추가 CSS 클래스                |

---

## TextareaComponent

### 기본 사용법

```jsx
<TextareaComponent
  label="설명"
  value={description}
  onChange={handleChange}
  placeholder="설명을 입력하세요"
  rows={4}
  maxLength={100}
/>
```

### Props

| Prop          | 타입     | 기본값  | 설명                  |
| ------------- | -------- | ------- | --------------------- |
| `label`       | string   | -       | 텍스트영역 라벨       |
| `value`       | string   | `""`    | 텍스트 값             |
| `onChange`    | function | -       | 값 변경 이벤트 핸들러 |
| `placeholder` | string   | `""`    | 플레이스홀더 텍스트   |
| `required`    | boolean  | `false` | 필수 입력 여부        |
| `error`       | boolean  | `false` | 에러 상태 여부        |
| `helperText`  | string   | -       | 도움말 텍스트         |
| `disabled`    | boolean  | `false` | 비활성화 여부         |
| `rows`        | number   | `4`     | 텍스트영역 행 수      |
| `maxLength`   | number   | -       | 최대 입력 길이        |
| `className`   | string   | `""`    | 추가 CSS 클래스       |

---

## 🎯 공통 Props

모든 컴포넌트에서 공통으로 사용할 수 있는 props:

| Prop        | 타입     | 기본값 | 설명                                     |
| ----------- | -------- | ------ | ---------------------------------------- |
| `className` | string   | `""`   | 추가 CSS 클래스                          |
| `style`     | object   | -      | 인라인 스타일                            |
| `id`        | string   | -      | HTML id 속성                             |
| `onClick`   | function | -      | 클릭 이벤트 핸들러 (지원하는 컴포넌트)   |
| `onKeyDown` | function | -      | 키보드 이벤트 핸들러 (지원하는 컴포넌트) |

---

## 💡 사용 팁

1. **기본값 활용**: 대부분의 컴포넌트는 적절한 기본값을 제공하므로 필요한 props만 전달하면 됩니다.

2. **className 활용**: 추가 스타일링이 필요한 경우 `className`을 통해 커스텀 CSS를 적용할 수 있습니다.

3. **조합 사용**: 여러 컴포넌트를 조합하여 복잡한 UI를 구성할 수 있습니다.

4. **접근성**: `required`, `disabled`, `error` 등의 props를 활용하여 접근성을 향상시킬 수 있습니다.

5. **이벤트 핸들링**: `onChange`, `onClick` 등의 이벤트 핸들러를 통해 사용자 상호작용을 처리할 수 있습니다.
