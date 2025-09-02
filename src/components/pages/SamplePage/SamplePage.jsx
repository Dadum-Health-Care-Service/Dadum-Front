import React, { useState } from "react";
import ButtonComponent from "../components/ButtonComponent";
import Card from "../components/CardComponent";
import InputComponent from "../components/InputComponent";
import ContainerComponent from "../components/ContainerComponent";
import FormComponent from "../components/FormComponent";
import SelectComponent from "../components/SelectComponent";
import TextareaComponent from "../components/TextareaComponent";
import ListComponent from "../components/ListComponent";
import HeaderComponent from "../components/HeaderComponent";
import "./SamplePage.css";

const SamplePage = () => {
  const [selectedTab, setSelectedTab] = useState("운동");
  const [selectedCard, setSelectedCard] = useState(null);
  const [formData, setFormData] = useState({
    routineName: "",
    description: "",
    email: "",
  });

  const [selectData, setSelectData] = useState({
    category: "",
    priority: "",
    tags: [],
  });

  const [textareaData, setTextareaData] = useState({
    feedback: "",
    notes: "",
    review: "",
  });

  const [selectedListItem, setSelectedListItem] = useState(null);
  const [activeHeaderMenu, setActiveHeaderMenu] = useState("home");

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    console.log("선택된 탭:", tab);
  };

  const handleCardClick = (cardId) => {
    setSelectedCard(cardId);
    console.log("선택된 카드:", cardId);
  };

  const handleButtonComponentClick = (action) => {
    alert(`${action} 버튼이 클릭되었습니다!`);
  };

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleSelectChange = (field) => (e) => {
    setSelectData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleTextareaChange = (field) => (e) => {
    setTextareaData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleListItemClick = (itemId) => {
    setSelectedListItem(itemId);
    console.log("선택된 리스트 항목:", itemId);
  };

  const handleHeaderMenuClick = (menuId) => {
    setActiveHeaderMenu(menuId);
    console.log("선택된 헤더 메뉴:", menuId);
  };

  const routineData = [
    {
      id: 1,
      title: "아침 운동 루틴",
      details: "월/수/금 · 45분",
      buttonText: "시작",
      category: "운동",
    },
    {
      id: 2,
      title: "저녁 요가 루틴",
      details: "화/목/토 · 30분",
      buttonText: "시작",
      category: "운동",
    },
    {
      id: 3,
      title: "주말 등산 루틴",
      details: "토/일 · 2시간",
      buttonText: "시작",
      category: "운동",
    },
    {
      id: 4,
      title: "일일 사진 촬영",
      details: "매일 · 15분",
      buttonText: "촬영",
      category: "포토",
    },
    {
      id: 5,
      title: "주간 기록 정리",
      details: "일요일 · 1시간",
      buttonText: "정리",
      category: "기록",
    },
    {
      id: 6,
      title: "업적 달성 체크",
      details: "매월 말 · 30분",
      buttonText: "확인",
      category: "레벨 및 업적",
    },
  ];

  const filteredRoutines =
    selectedTab === "전체"
      ? routineData
      : routineData.filter((routine) => routine.category === selectedTab);

  return (
    <div className="main-page">
      <header className="main-header">
        <h1>루틴 관리 시스템</h1>
        <p>일상의 작은 습관들이 큰 변화를 만듭니다</p>
      </header>

      <section className="tab-section">
        <h2>카테고리 선택</h2>
        <div className="tab-container">
          <ButtonComponent
            variant={selectedTab === "전체" ? "primary" : "outline"}
            onClick={() => handleTabChange("전체")}
            className="tab-button"
          >
            전체
          </ButtonComponent>
          <ButtonComponent
            variant={selectedTab === "운동" ? "primary" : "outline"}
            onClick={() => handleTabChange("운동")}
            className="tab-button"
          >
            운동
          </ButtonComponent>
          <ButtonComponent
            variant={selectedTab === "포토" ? "primary" : "outline"}
            onClick={() => handleTabChange("포토")}
            className="tab-button"
          >
            포토
          </ButtonComponent>
          <ButtonComponent
            variant={selectedTab === "기록" ? "primary" : "outline"}
            onClick={() => handleTabChange("기록")}
            className="tab-button"
          >
            기록
          </ButtonComponent>
          <ButtonComponent
            variant={selectedTab === "레벨 및 업적" ? "primary" : "outline"}
            onClick={() => handleTabChange("레벨 및 업적")}
            className="tab-button"
          >
            레벨 및 업적
          </ButtonComponent>
        </div>
        <p className="selected-info">
          현재 선택: <strong>{selectedTab}</strong>
        </p>
      </section>

      <section className="card-section">
        <h2>루틴 목록</h2>
        <div className="card-grid">
          {filteredRoutines.map((routine) => (
            <Card
              key={routine.id}
              title={routine.title}
              details={routine.details}
              buttonText={routine.buttonText}
              onClick={() => handleCardClick(routine.id)}
              className={selectedCard === routine.id ? "card--selected" : ""}
            />
          ))}
        </div>
      </section>

      <section className="action-section">
        <h2>빠른 액션</h2>
        <div className="action-buttons">
          <ButtonComponent
            variant="primary"
            size="large"
            onClick={() => handleButtonComponentClick("새 루틴 생성")}
          >
            새 루틴 생성
          </ButtonComponent>

          <ButtonComponent
            variant="secondary"
            size="medium"
            onClick={() => handleButtonComponentClick("통계 보기")}
          >
            통계 보기
          </ButtonComponent>

          <ButtonComponent
            variant="outline"
            size="medium"
            onClick={() => handleButtonComponentClick("설정")}
          >
            설정
          </ButtonComponent>

          <ButtonComponent
            variant="ghost"
            size="small"
            onClick={() => handleButtonComponentClick("도움말")}
          >
            도움말
          </ButtonComponent>
        </div>
      </section>

      <section className="input-section">
        <h2>루틴 생성 폼</h2>
        <div className="input-grid">
          <InputComponent
            label="루틴 이름"
            placeholder="새로운 루틴 이름을 입력하세요"
            value={formData.routineName}
            onChange={handleInputChange("routineName")}
            required
            helperText="루틴의 이름을 입력해주세요"
          />

          <InputComponent
            label="설명"
            placeholder="루틴에 대한 설명을 입력하세요"
            value={formData.description}
            onChange={handleInputChange("description")}
            helperText="루틴의 목적이나 내용을 간단히 설명해주세요"
          />

          <InputComponent
            label="알림 이메일"
            type="email"
            placeholder="example@email.com"
            value={formData.email}
            onChange={handleInputChange("email")}
            helperText="루틴 알림을 받을 이메일 주소"
          />
        </div>

        <div className="form-actions">
          <ButtonComponent
            variant="primary"
            size="medium"
            onClick={() => {
              if (formData.routineName) {
                alert(`새 루틴 "${formData.routineName}"이 생성되었습니다!`);
                setFormData({ routineName: "", description: "", email: "" });
              } else {
                alert("루틴 이름을 입력해주세요.");
              }
            }}
          >
            루틴 생성
          </ButtonComponent>

          <ButtonComponent
            variant="outline"
            size="medium"
            onClick={() =>
              setFormData({ routineName: "", description: "", email: "" })
            }
          >
            초기화
          </ButtonComponent>
        </div>
      </section>

      <section className="container-section">
        <h2>컨테이너 컴포넌트</h2>
        <div className="container-grid">
          <ContainerComponent variant="default" size="medium">
            <h3>기본 컨테이너</h3>
            <p>
              이것은 기본 스타일의 컨테이너입니다. 흰색 배경과 그림자가
              있습니다.
            </p>
          </ContainerComponent>

          <ContainerComponent variant="elevated" size="medium">
            <h3>높은 그림자 컨테이너</h3>
            <p>더 강한 그림자 효과를 가진 컨테이너입니다.</p>
          </ContainerComponent>

          <ContainerComponent variant="outlined" size="medium">
            <h3>아웃라인 컨테이너</h3>
            <p>테두리만 있는 컨테이너입니다.</p>
          </ContainerComponent>

          <ContainerComponent variant="filled" size="medium">
            <h3>채워진 컨테이너</h3>
            <p>배경색이 채워진 컨테이너입니다.</p>
          </ContainerComponent>
        </div>

        <div className="container-actions">
          <ButtonComponent
            variant="primary"
            size="medium"
            onClick={() => alert("컨테이너 섹션이 클릭되었습니다!")}
          >
            컨테이너 정보
          </ButtonComponent>
        </div>
      </section>

      <section className="form-section">
        <h2>폼 컴포넌트</h2>
        <FormComponent
          title="문의 양식"
          subtitle="궁금한 점이나 문의사항을 작성해주세요"
          variant="elevated"
          size="large"
          layout="vertical"
          submitText="문의하기"
          resetText="다시 작성"
          onSubmit={(e) => {
            e.preventDefault();
            alert("폼이 제출되었습니다!");
          }}
          onReset={(e) => {
            e.preventDefault();
            alert("폼이 초기화되었습니다!");
          }}
        >
          <FormComponent.Section title="기본 정보" variant="outlined">
            <FormComponent.Field
              label="이름"
              required
              helperText="실명을 입력해주세요"
            >
              <InputComponent type="text" placeholder="이름을 입력하세요" />
            </FormComponent.Field>

            <FormComponent.Field
              label="이메일"
              required
              helperText="연락받을 이메일 주소"
            >
              <InputComponent type="email" placeholder="example@email.com" />
            </FormComponent.Field>
          </FormComponent.Section>

          <FormComponent.Section title="문의 내용" variant="filled">
            <FormComponent.Field
              label="문의 유형"
              helperText="문의 유형을 선택해주세요"
            >
              <SelectComponent>
                <SelectComponent.Option value="">
                  선택해주세요
                </SelectComponent.Option>
                <SelectComponent.Option value="general">
                  일반 문의
                </SelectComponent.Option>
                <SelectComponent.Option value="technical">
                  기술 문의
                </SelectComponent.Option>
                <SelectComponent.Option value="billing">
                  결제 문의
                </SelectComponent.Option>
                <SelectComponent.Option value="other">
                  기타
                </SelectComponent.Option>
              </SelectComponent>
            </FormComponent.Field>

            <FormComponent.Field
              label="문의 내용"
              helperText="구체적인 내용을 작성해주세요"
            >
              <TextareaComponent
                placeholder="문의하실 내용을 자세히 작성해주세요"
                rows={4}
              />
            </FormComponent.Field>
          </FormComponent.Section>
        </FormComponent>
      </section>

      <section className="select-section">
        <h2>Select 컴포넌트</h2>
        <div className="select-grid">
          <SelectComponent
            label="카테고리 선택"
            value={selectData.category}
            onChange={handleSelectChange("category")}
            placeholder="카테고리를 선택해주세요"
            helperText="루틴의 카테고리를 선택하세요"
            required
          >
            <SelectComponent.Option value="운동">운동</SelectComponent.Option>
            <SelectComponent.Option value="포토">포토</SelectComponent.Option>
            <SelectComponent.Option value="기록">기록</SelectComponent.Option>
            <SelectComponent.Option value="레벨 및 업적">
              레벨 및 업적
            </SelectComponent.Option>
          </SelectComponent>

          <SelectComponent
            label="우선순위"
            variant="filled"
            value={selectData.priority}
            onChange={handleSelectChange("priority")}
            helperText="작업의 우선순위를 설정하세요"
          >
            <SelectComponent.Option value="high">높음</SelectComponent.Option>
            <SelectComponent.Option value="medium">보통</SelectComponent.Option>
            <SelectComponent.Option value="low">낮음</SelectComponent.Option>
          </SelectComponent>

          <SelectComponent
            label="크기 선택"
            variant="standard"
            size="large"
            value=""
            onChange={() => {}}
            helperText="컴포넌트 크기를 선택하세요"
          >
            <SelectComponent.Option value="small">Small</SelectComponent.Option>
            <SelectComponent.Option value="medium">
              Medium
            </SelectComponent.Option>
            <SelectComponent.Option value="large">Large</SelectComponent.Option>
          </SelectComponent>
        </div>

        <div className="select-info">
          <p>선택된 카테고리: {selectData.category || "없음"}</p>
          <p>선택된 우선순위: {selectData.priority || "없음"}</p>
        </div>
      </section>

      <section className="textarea-section">
        <h2>Textarea 컴포넌트</h2>
        <div className="textarea-grid">
          <TextareaComponent
            label="피드백"
            value={textareaData.feedback}
            onChange={handleTextareaChange("feedback")}
            placeholder="피드백을 입력해주세요..."
            helperText="제품에 대한 피드백을 자유롭게 작성해주세요"
            rows={4}
            maxLength={200}
            required
          />

          <TextareaComponent
            label="메모"
            variant="filled"
            value={textareaData.notes}
            onChange={handleTextareaChange("notes")}
            placeholder="간단한 메모를 작성하세요..."
            helperText="개인적인 메모나 아이디어를 기록하세요"
            rows={3}
            resize="vertical"
          />

          <TextareaComponent
            label="상세 리뷰"
            variant="standard"
            size="large"
            value={textareaData.review}
            onChange={handleTextareaChange("review")}
            placeholder="상세한 리뷰를 작성해주세요..."
            helperText="경험에 대한 자세한 리뷰를 작성해주세요"
            rows={5}
            maxLength={500}
          />
        </div>
      </section>

      <section className="list-section">
        <h2>List 컴포넌트</h2>
        <div className="list-grid">
          <div className="list-column">
            <h3>메뉴 리스트</h3>
            <ListComponent variant="bordered" divider>
              <ListComponent.Item
                primary="대시보드"
                secondary="전체 현황 보기"
                icon="📊"
                selected={selectedListItem === "dashboard"}
                onClick={() => handleListItemClick("dashboard")}
              />
              <ListComponent.Item
                primary="루틴 관리"
                secondary="루틴 생성 및 관리"
                icon="📋"
                selected={selectedListItem === "routines"}
                onClick={() => handleListItemClick("routines")}
              />
              <ListComponent.Item
                primary="통계"
                secondary="성과 분석"
                icon="📈"
                selected={selectedListItem === "statistics"}
                onClick={() => handleListItemClick("statistics")}
              />
              <ListComponent.Item
                primary="설정"
                secondary="앱 설정"
                icon="⚙️"
                selected={selectedListItem === "settings"}
                onClick={() => handleListItemClick("settings")}
              />
            </ListComponent>
          </div>

          <div className="list-column">
            <h3>사용자 리스트</h3>
            <ListComponent variant="elevated">
              <ListComponent.Header>팀 멤버</ListComponent.Header>
              <ListComponent.Item
                primary="김철수"
                secondary="kim@example.com"
                avatar="👨‍💼"
                action={
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      background: "#dcfce7",
                      color: "#166534",
                    }}
                  >
                    활성
                  </span>
                }
                onClick={() => handleListItemClick("user1")}
              />
              <ListComponent.Item
                primary="이영희"
                secondary="lee@example.com"
                avatar="👩‍💼"
                action={
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      background: "#dcfce7",
                      color: "#166534",
                    }}
                  >
                    활성
                  </span>
                }
                onClick={() => handleListItemClick("user2")}
              />
              <ListComponent.Item
                primary="박민수"
                secondary="park@example.com"
                avatar="👨‍💻"
                action={
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      background: "#fef3c7",
                      color: "#92400e",
                    }}
                  >
                    비활성
                  </span>
                }
                onClick={() => handleListItemClick("user3")}
              />
            </ListComponent>
          </div>
        </div>

        <div className="list-info">
          <p>선택된 항목: {selectedListItem || "없음"}</p>
        </div>
      </section>

      <section className="header-section">
        <h2>Header 컴포넌트</h2>
        <div className="header-grid">
          <div className="header-column">
            <h3>기본 헤더</h3>
            <HeaderComponent
              title="루틴 관리 시스템"
              subtitle="일상의 작은 습관들이 큰 변화를 만듭니다"
              variant="elevated"
              size="medium"
            />
          </div>

          <div className="header-column">
            <h3>브랜드 헤더</h3>
            <HeaderComponent variant="outlined" size="medium" align="center">
              <HeaderComponent.Section>
                <HeaderComponent.Brand logo="🏠" brandName="루틴허브" />
              </HeaderComponent.Section>
            </HeaderComponent>
          </div>
        </div>

        <div className="header-column">
          <h3>네비게이션이 있는 헤더</h3>
          <HeaderComponent variant="elevated" size="large" sticky>
            <HeaderComponent.Section>
              <HeaderComponent.Brand logo="🎯" brandName="목표 관리" />
            </HeaderComponent.Section>

            <HeaderComponent.Section>
              <HeaderComponent.Navigation>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "dashboard"}
                  onClick={() => handleHeaderMenuClick("dashboard")}
                >
                  대시보드
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "routines"}
                  onClick={() => handleHeaderMenuClick("routines")}
                >
                  루틴
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "statistics"}
                  onClick={() => handleHeaderMenuClick("statistics")}
                >
                  통계
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "settings"}
                  onClick={() => handleHeaderMenuClick("settings")}
                >
                  설정
                </HeaderComponent.MenuItem>
              </HeaderComponent.Navigation>
            </HeaderComponent.Section>

            <HeaderComponent.Section>
              <button
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                로그인
              </button>
            </HeaderComponent.Section>
          </HeaderComponent>
        </div>

        <div className="header-info">
          <p>선택된 헤더 메뉴: {activeHeaderMenu || "없음"}</p>
        </div>
      </section>

      <footer className="main-footer">
        <p>&copy; 2024 루틴 관리 시스템. 모든 권리 보유.</p>
      </footer>
    </div>
  );
};

export default MainPage;
