import React, { useEffect, useMemo, useState } from "react";
import ContainerComponent from "../../common/ContainerComponent";
import FormComponent from "../../common/FormComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";

function Login({ onLoginSuccess }) {
  const [currentView, setCurrentView] = useState("login"); // 'login' | 'register' | 'passwordless'
  const [loginType, setLoginType] = useState("password"); // 'password' | 'passwordless'

  // Login form state
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [registerId, setRegisterId] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");

  // Passwordless (QR) state
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [showQrInfo, setShowQrInfo] = useState(false);

  const handleShowLoginView = () => {
    setCurrentView("login");
  };

  const handleShowRegisterView = () => {
    setCurrentView("register");
  };

  const handleShowPasswordlessView = () => {
    setCurrentView("passwordless");

    // Simulate QR generation
    setIsQrLoading(true);
    setQrUrl("");
    setShowQrInfo(false);

    const mockId = loginId || "testuser";
    setTimeout(() => {
      const generatedUrl = `https://chart.googleapis.com/chart?chs=256x256&cht=qr&chl=passwordless-registration-for-${mockId}`;
      setQrUrl(generatedUrl);
      setIsQrLoading(false);
      setShowQrInfo(true);
      setServerUrl("https://your-server.com");
      setRegistrationCode("ABCD EFGH IJKL MNOP");
    }, 2000);
  };

  const handleToggleLoginType = (value) => {
    setLoginType(value);
  };

  const handleLogin = () => {
    if (!loginId) {
      alert("아이디를 입력해주세요.");
      return;
    }

    if (loginType === "password") {
      if (!loginPassword) {
        alert("비밀번호를 입력해주세요.");
        return;
      }
      console.log("--- 로그인 시도 ---");
      console.log("아이디:", loginId);
      console.log("로그인 방식: 비밀번호");

      alert(`'${loginId}'님, 비밀번호 로그인 성공! (시뮬레이션)\n이제 패스워드리스 등록 화면으로 이동합니다.`);
      handleShowPasswordlessView();
    } else {
      console.log("--- 로그인 시도 ---");
      console.log("아이디:", loginId);
      console.log("로그인 방식: 패스워드리스");
      alert(`'${loginId}'님, 패스워드리스 로그인을 요청했습니다. (시뮬레이션)\n스마트폰 앱에서 승인해주세요.`);
    }
  };

  const handleRegister = () => {
    if (!registerId || !registerPassword || !registerPasswordConfirm) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    if (registerPassword !== registerPasswordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    console.log("--- 회원가입 시도 ---");
    console.log("아이디:", registerId);

    alert(`'${registerId}'님, 회원가입이 완료되었습니다! (시뮬레이션)\n로그인 페이지로 이동합니다.`);
    setRegisterId("");
    setRegisterPassword("");
    setRegisterPasswordConfirm("");
    handleShowLoginView();
  };

  const handleLoginSuccessClick = () => {
    if (typeof onLoginSuccess === "function") {
      onLoginSuccess();
    }
  };

  useEffect(() => {
    // 초기 화면: 로그인
    setCurrentView("login");
  }, []);

  const containerClassName = useMemo(
    () => "bg-slate-100 flex items-center justify-center min-h-screen",
    []
  );

  return (
    <div className={containerClassName}>
      <ContainerComponent variant="default" size="medium" className="w-full" shadow="none" borderRadius="large">
        {/* 로그인 뷰 */}
        {currentView === "login" && (
          <FormComponent
            title="로그인"
            subtitle="다듬에 오신 것을 환영합니다."
            variant="default"
            size="large"
            layout="vertical"
            showActions={false}
            className="slide-up"
          >
            <FormComponent.Field label="아이디" required>
              <InputComponent
                placeholder="아이디를 입력하세요"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                size="large"
              />
            </FormComponent.Field>

            {loginType === "password" && (
              <FormComponent.Field label="비밀번호" required>
                <InputComponent
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  size="large"
                />
              </FormComponent.Field>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', margin: '16px 0' }}>
              <label className="text-slate-600" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="loginType"
                  value="password"
                  checked={loginType === "password"}
                  onChange={() => handleToggleLoginType("password")}
                />
                <span>비밀번호</span>
              </label>
              <label className="text-slate-600" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="radio"
                  name="loginType"
                  value="passwordless"
                  checked={loginType === "passwordless"}
                  onChange={() => handleToggleLoginType("passwordless")}
                />
                <span>패스워드리스</span>
              </label>
            </div>

            <ButtonComponent fullWidth size="large" onClick={handleLogin}>
              로그인
            </ButtonComponent>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <ButtonComponent variant="ghost" onClick={handleShowRegisterView}>
                계정이 없으신가요? 회원가입
              </ButtonComponent>
            </div>
          </FormComponent>
        )}

        {/* 회원가입 뷰 */}
        {currentView === "register" && (
          <FormComponent
            title="회원가입"
            subtitle="몇 가지 정보만 입력하면 바로 시작할 수 있어요."
            variant="default"
            size="large"
            layout="vertical"
            showActions={false}
            className="slide-up"
          >
            <FormComponent.Field label="아이디" required>
              <InputComponent
                placeholder="사용할 아이디를 입력하세요"
                value={registerId}
                onChange={(e) => setRegisterId(e.target.value)}
                size="large"
              />
            </FormComponent.Field>

            <FormComponent.Field label="비밀번호" required>
              <InputComponent
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                size="large"
              />
            </FormComponent.Field>

            <FormComponent.Field label="비밀번호 확인" required>
              <InputComponent
                type="password"
                placeholder="비밀번호를 다시 한번 입력하세요"
                value={registerPasswordConfirm}
                onChange={(e) => setRegisterPasswordConfirm(e.target.value)}
                size="large"
              />
            </FormComponent.Field>

            <ButtonComponent fullWidth size="large" onClick={handleRegister}>
              가입하기
            </ButtonComponent>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <ButtonComponent variant="ghost" onClick={handleShowLoginView}>
                이미 계정이 있으신가요? 로그인
              </ButtonComponent>
            </div>
          </FormComponent>
        )}

        {/* 패스워드리스 등록 뷰 */}
        {currentView === "passwordless" && (
          <FormComponent
            title="패스워드리스 등록"
            subtitle="스마트폰 앱으로 QR 코드를 스캔해주세요."
            variant="default"
            size="large"
            layout="vertical"
            showActions={false}
            className="slide-up"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 256, height: 256, background: '#e5e7eb', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isQrLoading && <div className="loader" />}
                {!isQrLoading && qrUrl && (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={qrUrl} className="w-full h-full rounded-lg" />
                )}
              </div>
              <p className="mt-4 text-slate-600">{isQrLoading ? "QR 코드 생성 중..." : "앱으로 QR 코드를 스캔하세요."}</p>

              {showQrInfo && (
                <div className="w-full mt-4 text-sm text-left space-y-2">
                  <p><span className="font-semibold">서버 URL:</span> <span>{serverUrl}</span></p>
                  <p><span className="font-semibold">등록 코드:</span> <span>{registrationCode}</span></p>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
              <ButtonComponent variant="secondary" onClick={handleShowLoginView}>
                취소
              </ButtonComponent>
              <ButtonComponent variant="primary" onClick={handleLoginSuccessClick}>
                앱 승인 완료 (시뮬레이션)
              </ButtonComponent>
            </div>
          </FormComponent>
        )}
      </ContainerComponent>
    </div>
  );
}

Login.defaultProps = {
  onLoginSuccess: () => {},
};

export default Login;


