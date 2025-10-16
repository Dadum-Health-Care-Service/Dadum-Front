import { useState } from "react";
import FormComponent from "../../common/FormComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";

export default function FindPw() {
  const navigate = useNavigate();
  const { POST, GET } = useApi();
  const { showBasicModal, showConfirmModal, showLoadingModal, closeModal } =
    useModal();
  const [formData, setFormData] = useState({
    email: "",
    usersName: "",
  });
  const [errors, setErrors] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setFormData({
      email: "",
      usersName: "",
    });
    if (errors) {
      setErrors({});
    }
  };

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.usersName) newErrors.usersName = "반드시 이름을 입력해주세요";
    else if (!formData.email) newErrors.email = "반드시 이메일을 입력해주세요";
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setLoading(true);
      try {
        const res1 = await GET(`/users/email/${formData.email}`, {}, false);
        const usersData = res1.data;
        if (usersData.usersName === formData.usersName) {
          showLoadingModal(
            "이메일 전송중...",
            "비밀번호 찾기",
            "이메일 전송 후 자동으로 닫힙니다. 잠시만 기다려 주세요."
          );
          const res2 = await POST("/users/send/password", formData, false);
          console.log(res2);
          closeModal();
          showConfirmModal(
            "비밀번호 찾기 이메일 전송을 성공하였습니다. 로그인으로 이동하시겠습니까?",
            "비밀번호 찾기",
            "임시 비밀번호가 이메일로 전송되었습니다.",
            () => {
              navigate("/login");
            }
          );
        } else {
          showBasicModal("가입된 이름이 일치하지 않습니다.", "비밀번호 찾기");
        }
      } catch (err) {
        console.log(err);

        if (err.request?.responseURL?.includes("/send/password")) {
          closeModal();
          showBasicModal(
            "비밀번호 찾기 이메일 전송을 실패하였습니다.",
            "네트워크 에러"
          );
        } else if (err.response?.status === 400)
          showBasicModal("해당 회원이 존재하지 않습니다.", "비밀번호 찾기");
        else showBasicModal("비밀번호 찾기에 실패하였습니다.", "네트워크 에러");
      } finally {
        handleReset();
        setLoading(false);
      }
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">🎯 다듬</h1>
          <p className="login-subtitle">루틴을 관리하고 자세를 분석해보세요</p>
        </div>
        <FormComponent
          title="비밀번호 찾기"
          onSubmit={handleSubmit}
          onReset={handleReset}
          variant="elevated"
          size="large"
          layout="vertical"
          className="w-75 px-3"
        >
          <FormComponent.Field label="이름" required className="mb-3">
            <InputComponent
              placeholder="가입한 이름을 입력해주세요"
              value={formData.usersName}
              onChange={handleChange("usersName")}
              required
              variant="outlined"
              error={errors.usersName}
              size="medium"
            />
          </FormComponent.Field>
          <FormComponent.Field label="이메일" required className="mb-3">
            <InputComponent
              placeholder="가입한 이메일을 입력해주세요"
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              required
              variant="outlined"
              error={errors.email}
              size="medium"
            />
          </FormComponent.Field>

          <div className="my-4">
            <ButtonComponent
              type="submit"
              variant="outline-primary"
              size="large"
              fullWidth
              className="my-1"
            >
              비밀번호 찾기
            </ButtonComponent>
          </div>
          <div>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => navigate("/findid")}
              fullWidth
              className="my-1"
            >
              아이디 찾기로 이동
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => navigate("/signup")}
              fullWidth
              className="my-1"
            >
              회원가입으로 이동
            </ButtonComponent>
          </div>
        </FormComponent>
      </div>
    </>
  );
}
