import React, { useState } from "react";
import ModalComponent from "./ModalComponent";
import ButtonComponent from "./ButtonComponent";
import InputComponent from "./InputComponent";
import SelectComponent from "./SelectComponent";
import TextareaComponent from "./TextareaComponent";

const ModalExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState("basic");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
  });

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsOpen(true);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    setFormData({ name: "", email: "", category: "", message: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    handleCloseModal();
  };

  const renderModalContent = () => {
    switch (modalType) {
      case "basic":
        return (
          <div>
            <p>
              이것은 기본 모달입니다. 간단한 메시지나 확인을 위해 사용할 수
              있습니다.
            </p>
            <p>
              모달은 사용자의 주의를 끌고 중요한 정보를 표시하는 데 유용합니다.
            </p>
          </div>
        );

      case "form":
        return (
          <form onSubmit={handleSubmit}>
            <ModalComponent.Section>
              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  이름
                </label>
                <InputComponent
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="이름을 입력하세요"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="email"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  이메일
                </label>
                <InputComponent
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="category"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  카테고리
                </label>
                <SelectComponent
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <SelectComponent.Option value="">
                    카테고리를 선택하세요
                  </SelectComponent.Option>
                  <SelectComponent.Option value="general">
                    일반
                  </SelectComponent.Option>
                  <SelectComponent.Option value="support">
                    지원
                  </SelectComponent.Option>
                  <SelectComponent.Option value="feedback">
                    피드백
                  </SelectComponent.Option>
                </SelectComponent>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  htmlFor="message"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "500",
                  }}
                >
                  메시지
                </label>
                <TextareaComponent
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="메시지를 입력하세요"
                  rows={4}
                  required
                />
              </div>
            </ModalComponent.Section>

            <ModalComponent.Actions>
              <ButtonComponent
                variant="outline-secondary"
                onClick={handleCloseModal}
              >
                취소
              </ButtonComponent>
              <ButtonComponent variant="primary" type="submit">
                제출
              </ButtonComponent>
            </ModalComponent.Actions>
          </form>
        );

      case "confirmation":
        return (
          <div>
            <p>정말로 이 작업을 수행하시겠습니까?</p>
            <p>이 작업은 되돌릴 수 없습니다.</p>

            <ModalComponent.Actions>
              <ButtonComponent
                variant="outline-secondary"
                onClick={handleCloseModal}
              >
                취소
              </ButtonComponent>
              <ButtonComponent variant="danger" onClick={handleCloseModal}>
                확인
              </ButtonComponent>
            </ModalComponent.Actions>
          </div>
        );

      default:
        return <div>기본 내용</div>;
    }
  };

  const getModalProps = () => {
    switch (modalType) {
      case "basic":
        return {
          title: "기본 모달",
          subtitle: "간단한 정보 표시",
          size: "medium",
          variant: "default",
        };
      case "form":
        return {
          title: "폼 모달",
          subtitle: "사용자 정보 입력",
          size: "large",
          variant: "elevated",
        };
      case "confirmation":
        return {
          title: "확인 모달",
          subtitle: "작업 확인",
          size: "small",
          variant: "outlined",
        };
      default:
        return {};
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>ModalComponent 사용 예시</h2>

      <div style={{ display: "grid", gap: "16px", marginBottom: "30px" }}>
        <ButtonComponent
          variant="primary"
          onClick={() => handleOpenModal("basic")}
        >
          기본 모달 열기
        </ButtonComponent>

        <ButtonComponent
          variant="success"
          onClick={() => handleOpenModal("form")}
        >
          폼 모달 열기
        </ButtonComponent>

        <ButtonComponent
          variant="warning"
          onClick={() => handleOpenModal("confirmation")}
        >
          확인 모달 열기
        </ButtonComponent>
      </div>

      <ModalComponent
        isOpen={isOpen}
        onClose={handleCloseModal}
        {...getModalProps()}
      >
        {renderModalContent()}
      </ModalComponent>

      <div
        style={{
          marginTop: "30px",
          padding: "20px",
          background: "#f8f9fa",
          borderRadius: "8px",
        }}
      >
        <h3>ModalComponent 특징</h3>
        <ul>
          <li>
            <strong>접근성</strong>: 키보드 네비게이션 및 스크린 리더 지원
          </li>
          <li>
            <strong>반응형</strong>: 모든 화면 크기에서 최적화
          </li>
          <li>
            <strong>커스터마이징</strong>: 크기, 스타일, 동작 방식 조정 가능
          </li>
          <li>
            <strong>애니메이션</strong>: 부드러운 열기/닫기 효과
          </li>
          <li>
            <strong>다크 모드</strong>: 시스템 설정에 따른 자동 테마 전환
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ModalExample;
