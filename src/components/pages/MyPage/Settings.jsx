import { useContext, useRef, useState, useEffect } from "react";
import HeaderComponent from "../../common/HeaderComponent";
import ContainerComponent from "../../common/ContainerComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { AuthContext } from "../../../context/AuthContext";
import { useModal } from "../../../context/ModalContext";
import { useNavigate } from "react-router-dom";
import { useApi } from "../../../utils/api/useApi";

import { useLoginView } from "../../../context/LoginViewContext";

export default function Settings() {
  //패스워드리스 등록화면으로 이동
  const { setView, setLoginInfo } = useLoginView();
  const navigate = useNavigate();
  const { DELETE, POST, PUT, GET } = useApi();
  //유저 정보 읽어오기
  const { user, dispatch } = useContext(AuthContext);
  //전역모달 사용
  const { showBasicModal, showConfirmModal } = useModal();
  //설정의 네비게이션헤더탭 제어용 (회원 정보 변경, 비밀번호 변경, 회원 탈퇴)
  const [activeHeaderMenu, setActiveHeaderMenu] = useState("userInfo");
  const handleHeaderMenuClick = (menuId) => {
    setActiveHeaderMenu(menuId);
    console.log("선택된 설정 헤더 메뉴:", menuId);
  };

  //유효성 체크를 위한 state
  const [errors, setErrors] = useState({});
  //인풋을 제어하고 저장하는 state
  const [passwords, setPasswords] = useState({
    existPW: "",
    currentPW: "",
    newPW: "",
    newPWcheck: "",
  });

  //역할 관련 state
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [roleErrors, setRoleErrors] = useState({});

  // 역할 이름 매핑
  const roleNameMap = {
    SUPER_ADMIN: "관리자",
    USER: "사용자",
    SELLER: "판매자",
  };

  //인풋 값 전부 초기화 하기 위한 함수
  const handleReset = () => {
    setPasswords({ existPW: "", currentPW: "", newPW: "", newPWcheck: "" });
    if (errors) {
      setErrors({});
    }
  };

  useEffect(() => {
    handleReset();
  }, [activeHeaderMenu]);

  //역할 관련 함수들
  const loadAvailableRoles = async () => {
    try {
      const response = await GET("/users/role/available", {}, false);
      setAvailableRoles(response.data || []);
    } catch (error) {
      setAvailableRoles([]);
      showBasicModal("역할 목록을 불러오는데 실패했습니다.", "오류");
    }
  };

  const loadUserRoles = async () => {
    try {
      const response = await GET("/users/role/current");
      setUserRoles(response.data || []);
    } catch (error) {
      setUserRoles([]);
    }
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    if (roleErrors.role) {
      setRoleErrors((prev) => ({ ...prev, role: "" }));
    }
  };

  const handleRoleRequest = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!selectedRole) {
      newErrors.role = "권한을 선택해주세요.";
    }
    setRoleErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await POST("/users/role/request", {
          roleName: selectedRole,
        });
        showBasicModal(
          "권한 요청이 완료되었습니다. 관리자 승인을 기다려주세요.",
          "신청 완료"
        );
        setSelectedRole("");
        loadUserRoles(); // 사용자 역할 목록 새로고침
      } catch (error) {
        if (error?.status === 400) {
          showBasicModal(
            error.message || "권한 요청에 실패했습니다.",
            "신청 실패"
          );
        } else {
          showBasicModal("권한 요청 중 오류가 발생했습니다.", "네트워크 오류");
        }
      }
    }
  };

  // 이미 신청된 역할들을 제외한 사용 가능한 역할 목록 필터링
  const getFilteredAvailableRoles = () => {
    if (!userRoles || !availableRoles) return [];
    const userRoleNames = userRoles.map(
      (role) => role.rolesDto?.roleName || role.roleName
    );
    return availableRoles.filter(
      (role) =>
        !userRoleNames.includes(role.roleName) &&
        role.roleName !== "SUPER_ADMIN"
    );
  };

  // 승인된 역할과 대기중인 역할 분리
  const getApprovedRoles = () => {
    if (!userRoles) return [];
    return userRoles.filter((role) => role.isActive === 1);
  };

  const getPendingRoles = () => {
    if (!userRoles) return [];
    return userRoles.filter((role) => role.isActive === 0);
  };

  // 컴포넌트 마운트 시 역할 데이터 로드
  useEffect(() => {
    loadAvailableRoles();
    loadUserRoles();
  }, [user]);

  //인풋 값 변경 시 passwords에 저장 및 에러 초기화
  const handleChange = (field) => (e) => {
    setPasswords((prev) => ({
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

  //회원 탈퇴 확인 버튼 제어용
  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    let res1 = "";

    //인풋 유효성 체크
    const newErrors = {};
    if (!passwords.existPW)
      newErrors.existPW = "현재 비밀번호를 반드시 입력해주세요.";
    setErrors(newErrors);

    //유효성 체크에 통과하면 진행
    if (Object.keys(newErrors).length === 0) {
      //입력한 비밀번호가 맞는지 확인
      try {
        res1 = await POST("/users/auth/password/check", {
          password: passwords.existPW,
        });
      } catch (err1) {
        //오류 발생 시 모달 띄우기
        console.log("비밀번호 확인 호출 중 오류 발생: ", err1);

        //오류 종류에 따라서 2종류 모달 띄우기
        if (err1?.status === 400) {
          showBasicModal("비밀번호가 일치하지 않습니다.", "비밀번호 오류");
        } else {
          showBasicModal(
            "비밀번호 확인 중 오류가 발생하였습니다.",
            "네트워크 에러"
          );
        }
        return;
      } finally {
        //오류 발생 여부와 상관없이 비밀번호 확인 후 저장된 입력값 초기화
        handleReset();
      }

      //회원 탈퇴하는 메소드
      const confirmWithdrawal = async () => {
        try {
          const res2 = await DELETE(`/users/delete/${res1.data.usersId}`);
          //탈퇴 확인 모달 띄우고 로그아웃 처리
          showBasicModal("탈퇴되었습니다", "회원 탈퇴");
          dispatch({ type: "LOGOUT" });
        } catch (err2) {
          console.log("회원 탈퇴 중 오류 발생", err2);
          showBasicModal("회원 탈퇴에 실패하였습니다", "네트워크 에러");
        }
      };

      //입력한 비밀번호가 맞으면 회원 탈퇴 모달 띄우기 -> 확인 눌렀을 경우 탈퇴처리
      showConfirmModal(
        "정말 탈퇴하시겠습니까?",
        "회원 탈퇴",
        "탈퇴는 취소 할 수 없습니다",
        confirmWithdrawal
      );
    }
  };

  //비밀번호 변경 버튼 제어용
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    let res1 = "";

    //인풋 유효성 체크
    const newErrors = {};
    if (!passwords.currentPW)
      newErrors.currentPW = "현재 비밀번호를 반드시 입력해주세요.";
    else if (!passwords.newPW)
      newErrors.newPW = "새 비밀번호를 반드시 입력해주세요.";
    else if (passwords.newPW == passwords.currentPW)
      newErrors.newPW = "같은 비밀번호로는 변경할 수 없습니다";
    else if (!passwords.newPWcheck)
      newErrors.newPWcheck = "새 비밀번호 확인을 반드시 입력해주세요.";
    else if (passwords.newPW != passwords.newPWcheck)
      newErrors.newPWcheck = "비밀번호가 일치하지 않습니다";
    setErrors(newErrors);

    //유효성 체크 통과시 비밀번호 변경 진행
    if (Object.keys(newErrors).length === 0) {
      //입력한 현재 비밀번호가 맞는지 확인
      try {
        res1 = await POST("/users/auth/password/check", {
          password: passwords.currentPW,
        });
      } catch (err1) {
        console.log("비밀번호 확인 호출 중 오류 발생: ", err1);
        //비밀번호 확인 중 오류가 발생하면 저장된 입력값 초기화
        handleReset();
        //오류 종류에 따라 모달 다르게 띄우기
        if (err1?.status === 400) {
          showBasicModal("비밀번호가 일치하지 않습니다.", "비밀번호 오류");
        } else {
          showBasicModal(
            "비밀번호 확인 중 오류가 발생하였습니다.",
            "네트워크 에러"
          );
        }
        return;
      }
      //비밀번호가 맞다면 변경 진행
      try {
        const res2 = await PUT("/users/auth/password/update", {
          originPassword: passwords.currentPW,
          newPassword: passwords.newPWcheck,
        });
        //알림모달 띄우고 로그아웃 처리
        showBasicModal(
          "비밀번호가 변경되었습니다. 다시 로그인 해 주세요.",
          "비밀번호 변경"
        );
        dispatch({ type: "LOGOUT" });
      } catch (err2) {
        console.log("비밀번호 변경 오류 발생:", err2);
        showBasicModal("비밀번호 변경에 실패하였습니다", "네트워크 에러");
      } finally {
        //비밀번호 변경 성공 여부에 관련없이 저장된 입력값 초기화
        handleReset();
      }
    }
  };

  const handleRegisterPasswordless = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!passwords.currentPW)
      newErrors.currentPW = "현재 비밀번호를 반드시 입력해주세요.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      //입력한 현재 비밀번호가 맞는지 확인
      try {
        const res = await POST("/users/auth/password/check", {
          password: passwords.currentPW,
        });
      } catch (err) {
        console.log("비밀번호 확인 호출 중 오류 발생: ", err);
        //비밀번호 확인 중 오류가 발생하면 저장된 입력값 초기화
        handleReset();
        //오류 종류에 따라 모달 다르게 띄우기
        if (err?.status === 400) {
          showBasicModal("비밀번호가 일치하지 않습니다.", "비밀번호 오류");
        } else {
          showBasicModal(
            "비밀번호 확인 중 오류가 발생하였습니다.",
            "네트워크 에러"
          );
        }
        return;
      }
      showConfirmModal(
        "패스워드리스 등록 화면으로 이동하시겠습니까?",
        "패스워드리스 등록",
        "등록후에는 비밀번호로 로그인하실 수 없습니다",
        async () => {
          await setLoginInfo({ id: user.email, pw: passwords.currentPW });
          await setView("passwordless");
          await navigate("/login");
        }
      );
    }
  };

  //settings 탭에 따라 회원 정보 변경/비밀번호 변경/회원 탈퇴 렌더링
  const renderSettingPages = (menuId) => {
    switch (menuId) {
      //회원 정보 변경
      case "userInfo": {
        const approvedRoles = getApprovedRoles() || [];
        const pendingRoles = getPendingRoles() || [];
        const filteredAvailableRoles = getFilteredAvailableRoles() || [];

        return (
          <ContainerComponent variant="filled" size="small" className="p-5">
            {/* 승인된 권한 목록 */}
            <div className="mb-4">
              <h5 className="mb-3">승인된 권한 목록</h5>
              {approvedRoles.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                  {approvedRoles.map((role, index) => {
                    const roleName = role.rolesDto?.roleName || role.roleName;
                    return (
                      <span key={index} className="badge bg-success">
                        {roleNameMap[roleName] || roleName}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted">승인된 권한 목록이 없습니다.</p>
              )}
            </div>

            {/* 대기중인 권한 요청 */}
            {pendingRoles.length > 0 && (
              <div className="mb-4">
                <h5 className="mb-3">대기중인 권한 요청</h5>
                <div className="d-flex flex-wrap gap-2">
                  {pendingRoles.map((role, index) => {
                    const roleName = role.rolesDto?.roleName || role.roleName;
                    return (
                      <span key={index} className="badge bg-warning">
                        {roleNameMap[roleName] || roleName} (대기중)
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <hr className="my-4" />

            {/* 권한 신청 */}
            <div>
              <h5 className="mb-3">권한 요청</h5>
              {filteredAvailableRoles.length > 0 ? (
                <form onSubmit={handleRoleRequest}>
                  <div className="mb-3">
                    <label className="form-label">권한을 선택해주세요</label>
                    <select
                      className={`form-select ${
                        roleErrors.role ? "is-invalid" : ""
                      }`}
                      value={selectedRole}
                      onChange={handleRoleChange}
                    >
                      <option value="">권한을 선택해주세요</option>
                      {filteredAvailableRoles.map((role) => (
                        <option key={role.roleId} value={role.roleName}>
                          {roleNameMap[role.roleName] || role.roleName} -{" "}
                          {role.roleDescription}
                        </option>
                      ))}
                    </select>
                    {roleErrors.role && (
                      <div className="invalid-feedback">{roleErrors.role}</div>
                    )}
                  </div>
                  <div className="d-flex justify-content-center">
                    <ButtonComponent
                      variant="primary"
                      size="small"
                      type="submit"
                      className="h-75"
                    >
                      권한 신청
                    </ButtonComponent>
                  </div>
                </form>
              ) : (
                <p className="text-muted">신청 가능한 권한이 없습니다.</p>
              )}
            </div>
          </ContainerComponent>
        );
      }
      //회원 탈퇴
      case "withdrawalUser": {
        return (
          <ContainerComponent variant="filled" size="small" className="p-5">
            <InputComponent
              label="현재 비밀번호"
              placeholder="현재 비밀번호를 입력해주세요"
              type="password"
              onChange={handleChange("existPW")}
              value={passwords.existPW}
              required
              error={errors.existPW}
              className="mb-3"
            />
            <div className="d-flex justify-content-center">
              <ButtonComponent
                variant="primary"
                size="small"
                onClick={handleWithdrawalSubmit}
                className="m-2 h-75"
              >
                확인
              </ButtonComponent>
            </div>
          </ContainerComponent>
        );
      }
      //비밀번호 변경
      case "updatePassword": {
        return (
          <ContainerComponent variant="filled" size="small">
            <div style={{ padding: "3em 3em 0.5em 3em " }}>
              <InputComponent
                label="현재 비밀번호"
                placeholder="현재 비밀번호를 입력해주세요"
                type="password"
                onChange={handleChange("currentPW")}
                value={passwords.currentPW}
                required
                error={errors.currentPW}
                className="mb-3"
              />
            </div>
            <hr className="text-secondary m-3" />
            <div style={{ padding: "0.5em 3em 2em 3em" }}>
              <InputComponent
                label="새 비밀번호"
                placeholder="새 비밀번호를 입력해주세요"
                type="password"
                onChange={handleChange("newPW")}
                value={passwords.newPW}
                required
                error={errors.newPW}
                className="mb-3"
              />
              <InputComponent
                label="새 비밀번호 확인"
                placeholder="새 비밀번호를 입력해주세요"
                type="password"
                onChange={handleChange("newPWcheck")}
                value={passwords.newPWcheck}
                required
                error={errors.newPWcheck}
                className="mb-3 py-2"
              />
            </div>
            <div className="d-flex justify-content-center">
              <ButtonComponent
                variant="primary"
                size="small"
                onClick={handleUpdateSubmit}
                className="h-75 mb-5"
              >
                확인
              </ButtonComponent>
            </div>
          </ContainerComponent>
        );
      }
      case "passwordless": {
        return (
          <ContainerComponent variant="filled" size="small">
            <div style={{ padding: "3em 3em 0.5em 3em " }}>
              <InputComponent
                label="현재 비밀번호"
                placeholder="현재 비밀번호를 입력해주세요"
                type="password"
                onChange={handleChange("currentPW")}
                value={passwords.currentPW}
                required
                error={errors.currentPW}
                className="mb-3"
              />
            </div>
            <div className="d-flex justify-content-center">
              <ButtonComponent
                variant="primary"
                size="small"
                onClick={handleRegisterPasswordless}
                className="h-75 mb-5"
              >
                확인
              </ButtonComponent>
            </div>
          </ContainerComponent>
        );
      }
      default: {
        return (
          <ContainerComponent variant="filled" size="small" className="p-5">
            <p className="text-muted">잘못된 메뉴입니다.</p>
          </ContainerComponent>
        );
      }
    }
  };

  return (
    <>
      <div style={{ maxWidth: "750px", margin: "0 auto" }}>
        <ContainerComponent variant="default" className="p-3 mb-5">
          <ContainerComponent size="medium" variant="default" className="mb-3">
            <HeaderComponent variant="filled" size="small" align="center">
              <HeaderComponent.Navigation>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "userInfo"}
                  onClick={() => handleHeaderMenuClick("userInfo")}
                >
                  회원 정보 변경
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "updatePassword"}
                  onClick={() => handleHeaderMenuClick("updatePassword")}
                >
                  비밀번호 변경
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "withdrawalUser"}
                  onClick={() => handleHeaderMenuClick("withdrawalUser")}
                >
                  회원 탈퇴
                </HeaderComponent.MenuItem>
                <HeaderComponent.MenuItem
                  active={activeHeaderMenu === "passwordless"}
                  onClick={() => handleHeaderMenuClick("passwordless")}
                >
                  패스워드리스 등록
                </HeaderComponent.MenuItem>
              </HeaderComponent.Navigation>
            </HeaderComponent>
          </ContainerComponent>

          <ContainerComponent size="medium" variant="outlined">
            {renderSettingPages(activeHeaderMenu)}
          </ContainerComponent>
        </ContainerComponent>
      </div>
    </>
  );
}
