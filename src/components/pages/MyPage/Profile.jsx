import { useContext, useEffect, useRef, useState } from "react";
import ButtonComponent from "../../common/ButtonComponent";
import ContainerComponent from "../../common/ContainerComponent";
import { AuthContext } from "../../../context/AuthContext";
import InputComponent from "../../common/InputComponent";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";
import styles from "./Profile.module.css";

export default function Profile() {
  const { GET, PUT } = useApi();
  //유저정보,로딩상태,에러상태를 저장하는 state
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  //프로필 수정 버튼 제어용
  const [clickEdit, setClickEdit] = useState(false);
  //유효성 체크용
  const [errors, setErrors] = useState({});
  const { showBasicModal, showConfirmModal } = useModal();

  const imgRef = useRef();

  // 초기 프로필 데이터 설정
  const [profile, setProfile] = useState({
    name: "",
    nickName: "",
    email: user?.email || "",
    profileImg: "/img/userAvatar.png", //초기데이터 기본 프로필이미지로 설정
    phoneNum: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    regDate: "",
  });

  //프로필 수정 시 저장 버튼을 누르기 전에 임시로 데이터 저장
  const [inputs, setInputs] = useState({});
  const [phoneNum, setPhoneNum] = useState({});

  //최초렌더링 및 userId가 변하는 경우에 따라 user정보 네트워크로부터 읽어오기
  useEffect(() => {
    //페이지 렌더 다시 할때마다 스크롤 맨 위로 올리기
    window.scrollTo(0, 0);

    //저장된 user정보가 없을때 알림 모달 띄우고 에러 페이지 렌더
    if (!user || !user.usersId) {
      setError("사용자 정보를 찾을 수 없습니다.");
      showBasicModal("사용자 정보를 찾을 수 없습니다", "네트워크 에러");
      //로딩상태x
      setLoading(false);
      return;
    }

    //프로필 읽어오는 메소드
    const fetchProfile = async () => {
      try {
        //읽어오는 동안 로딩상태 띄우기
        setLoading(true);
        //에러상태 초기화
        setError(null);

        const res = await GET(`/users/${user.usersId}`, {}, false);
        const getUser = res.data;
        const getBio = res.data.biosDto;

        //읽어온 정보로 프로필 state설정
        setProfile((prev) => ({
          ...prev,
          name: getUser.usersName || "",
          nickName: getUser.nickName || "",
          profileImg: getUser.profileImg || "/img/userAvatar.png",
          phoneNum: getUser.phoneNum || "",
          age: getBio?.age || 0,
          gender: getBio?.gender !== undefined ? getBio.gender : null,
          height: getBio?.height || 0,
          weight: getBio?.weight || 0,
          regDate: getUser.regDate ? getUser.regDate.substring(0, 10) : "",
        }));

        //저장된 프로필 state로 프로필 수정 인풋 저장용 state 설정 ->
        // 1. 프로필 수정 페이지에 이미 입력된 유저의 프로필 정보 띄워주기 위함
        // 2. 저장된 인풋 정보로 프로필 수정을 요청할때 사용자가 수정하지 않은 정보가 nullable할때 같이 전달해주기 위함
        setInputs((prev) => ({
          ...prev,
          name: profile.name,
          nickName: profile.nickName,
          profileImg: profile.profileImg,
          age: profile.age,
          gender: profile.gender,
          height: profile.height,
          weight: profile.weight,
        }));

        setPhoneNum((prev) => ({
          ...prev,
          phoneNum1: profile.phoneNum.slice(0, 3),
          phoneNum2: profile.phoneNum.slice(3, 7),
          phoneNum3: profile.phoneNum.slice(7),
        }));
      } catch (e) {
        //에러 발생시 에러상태 저장 및 확인 모달 띄우기
        console.log(e.response?.data, e);
        setError("프로필을 읽어오는 중 오류가 발생하였습니다");
        showBasicModal(
          "프로필을 읽어오는 중 오류가 발생하였습니다",
          "네트워크 에러"
        );
      } finally {
        //조회 성공 여부와 관계없이 로딩상태 없애기
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user?.usersId, clickEdit]); //usersId 및 수정 페이지 렌더 여부에 따라 프로필 정보 다시 조회

  // 로딩 중일 때
  if (loading) {
    return (
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // 에러가 있을 때
  if (error) {
    return (
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  const inputClasses = [
    styles["input-component"],
    styles["medium"],
    styles["outlined"],
    errors.phoneNum1 || errors.phoneNum2 || errors.phoneNum3
      ? styles["error"]
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  //이미지 인풋폼을 통해서 업로드 제어
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("image changed");
        setInputs((prev) => ({ ...prev, profileImg: reader.result })); //base64문자열 저장
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhoneNumChange = (field) => (e) => {
    setPhoneNum((prev) => ({
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

  //프로필 수정 인풋 폼 제어용 함수
  const handleInputChange = (field) => (e) => {
    //성별 라디오 버튼 클릭시 str -> boolean으로 변환해서 저장
    if (field === "gender") {
      if (e.target.value === "true") {
        setInputs((prev) => ({
          ...prev,
          gender: true,
        }));
      } else {
        setInputs((prev) => ({
          ...prev,
          gender: false,
        }));
      }
    } else {
      setInputs((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    }

    //유효성 체크 에러 메세지 초기화
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  //프로필 수정 저장 버튼 제어용
  const handleSubmit = async () => {
    //유효성 체크
    const newErrors = {};
    if (!inputs.name) newErrors.name = "이름은 필수 입력값입니다.";
    if (!inputs.nickName) newErrors.nickName = "닉네임은 필수 입력값입니다.";
    if (!phoneNum.phoneNum1)
      newErrors.phoneNum1 = "전화번호는 필수 입력값입니다.";
    if (!phoneNum.phoneNum2)
      newErrors.phoneNum2 = "전화번호는 필수 입력값입니다.";
    if (!phoneNum.phoneNum3)
      newErrors.phoneNum3 = "전화번호는 필수 입력값입니다.";

    setErrors(newErrors);

    //유효성 체크 통과했을때 서버에 user정보 수정 요청
    if (Object.keys(newErrors).length === 0) {
      try {
        //로딩상태 띄우고 에러상태 초기화
        setLoading(true);
        setError(null);
        const res = await PUT(`/users/update/${user.usersId}`, {
          //변경할 수 없는 데이터인 profileImg는 profile정보 그대로 쓰기
          usersName: inputs.name,
          nickName: inputs.nickName,
          email: profile.email,
          profileImg: inputs.profileImg,
          phoneNum:
            phoneNum.phoneNum1 + phoneNum.phoneNum2 + phoneNum.phoneNum3,
          biosDto: {
            gender: inputs.gender,
            age: inputs.age,
            height: inputs.height,
            weight: inputs.weight,
          },
        });
        //수정완료 모달 띄우고 프로필 페이지 렌더
        showBasicModal("수정 되었습니다", "프로필 수정");
        setClickEdit(false);
      } catch (error) {
        //오류 모달 띄우고 프로필 페이지 렌더
        console.log(error);
        showConfirmModal(
          "프로필 수정 중 오류가 발생하였습니다",
          "네트워크 에러",
          "",
          () => {
            setClickEdit(false);
          }
        );
        setError("프로필 수정 중 오류가 발생하였습니다"); //confirm모달에서 취소 선택시 오류 화면 띄우기
      } finally {
        //로딩 상태 없애기
        setLoading(false);
      }
    }
  };
  return (
    <>
      {
        //clickEdit상태에 따라 프로필/프로필 수정 페이지 렌더링
        !clickEdit ? (
          <ContainerComponent variant="default" className="mb-5">
            <ContainerComponent variant="filled" className="p-4">
              <ContainerComponent
                variant="outlined"
                className="profile-head mb-3"
              >
                <div className="d-flex flex-column align-items-center text-center px-4">
                  <img
                    className="rounded-circle mt-5 mb-3"
                    width="150px"
                    style={{
                      filter:
                        profile.profileImg !== "/img/userAvatar.png"
                          ? "none"
                          : `invert(42%) sepia(92%) saturate(2385%) hue-rotate(199deg)
                                    brightness(95%) contrast(97%)`,
                    }}
                    src={profile.profileImg || "/img/userAvatar.png"}
                  />
                </div>
                <div className="d-flex flex-column p-3">
                  <div>이름</div>
                  <div
                    className="font-weight-bold fs-1 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                    }}
                  >
                    {profile.name || "이름 없음"}
                  </div>
                  <div>닉네임</div>
                  <div
                    className="font-weight-bold fs-3 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                    }}
                  >
                    {profile.nickName || "닉네임 없음"}
                  </div>
                  <div>아이디</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {profile.email || "이메일 없음"}
                  </div>
                </div>
              </ContainerComponent>
              <ContainerComponent
                variant="outlined"
                className="profile-info mb-3"
              >
                <div className="d-flex flex-column p-3">
                  <div>전화번호</div>
                  {profile.phoneNum && profile.phoneNum.trim().length === 11 ? (
                    <div
                      className="text-muted fs-5 mb-3 text-center"
                      style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px",
                      }}
                    >
                      {profile.phoneNum.substring(0, 3)}-
                      {profile.phoneNum.substring(3, 7)}-
                      {profile.phoneNum.substring(7, profile.phoneNum.length)}
                    </div>
                  ) : (
                    <div
                      className="text-muted fs-5 mb-3 text-center"
                      style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px",
                      }}
                    >
                      {profile.phoneNum || "전화번호 정보가 없습니다"}
                    </div>
                  )}
                  <div>가입일</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {profile.regDate || "가입일 정보가 없습니다"}
                  </div>
                </div>
              </ContainerComponent>
              <ContainerComponent variant="outlined" className="body-info">
                <div className="d-flex flex-column p-3">
                  <div>나이</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {
                      //선택정보가 없는 경우 정보가 없다고 표시
                      profile.age && profile.age !== 0 ? (
                        <span>{profile.age}세</span>
                      ) : (
                        <span>나이 정보가 없습니다.</span>
                      )
                    }
                  </div>
                  <div>성별</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {profile.gender === false
                      ? "남자"
                      : profile.gender === true
                      ? "여자"
                      : "성별 정보가 없습니다"}
                  </div>
                  <div>키</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {profile.height && profile.height !== 0 ? (
                      <span>{profile.height}cm</span>
                    ) : (
                      <span>키 정보가 없습니다.</span>
                    )}
                  </div>
                  <div>몸무게</div>
                  <div
                    className="text-muted fs-5 mb-3 text-center"
                    style={{
                      background: "#f8fafc",
                      borderRadius: "15px",
                      height: "30px",
                    }}
                  >
                    {profile.weight && profile.weight !== 0 ? (
                      <span>{profile.weight}kg</span>
                    ) : (
                      <span>몸무게 정보가 없습니다.</span>
                    )}
                  </div>
                </div>
              </ContainerComponent>
              <div className="d-flex pt-3 justify-content-center">
                <ButtonComponent
                  variant="primary"
                  size="medium"
                  className="fs-6"
                  onClick={() => setClickEdit(true)}
                >
                  수정
                </ButtonComponent>
              </div>
            </ContainerComponent>
          </ContainerComponent>
        ) : (
          //프로필 수정 페이지 렌더링 -> 파일 선택 인풋 value 제어를 위해 InputComponent대신 input 사용, style로 스타일 통일
          <ContainerComponent variant="default" className="mb-5">
            <ContainerComponent variant="filled" className="p-4">
              <ContainerComponent
                variant="outlined"
                className="profile-head mb-3"
              >
                <div className="d-flex flex-column align-items-center text-center px-4">
                  <img
                    className="rounded-circle mt-5 mb-3"
                    width="150px"
                    src={inputs.profileImg}
                  />
                </div>
                <div className="d-flex align-items-end justify-content-center px-3">
                  <div className="d-flex flex-column align-items-start w-100">
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#374151",
                        marginBottom: "4px",
                        gap: "4px",
                      }}
                    >
                      프로필 사진
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      size="small"
                      onChange={handleImageChange}
                      className="myFile"
                      ref={imgRef}
                      style={{
                        width: "100%",
                        border: "2px solid #d1d5db",
                        borderRadius: "8px",
                        fontSize: "12px",
                        fontFamily: "inherit",
                        outline: "none",
                        background: "#ffffff",
                        color: "#1f2937",
                        padding: "9px 12px",
                        minHeight: "32px",
                      }}
                    />
                  </div>
                  <ButtonComponent
                    variant="secondary"
                    size="small"
                    onClick={(prev) => {
                      setInputs({ ...prev, profileImg: profile.profileImg });
                      imgRef.current.value = "";
                    }}
                    className="m-2 h-75"
                  >
                    x
                  </ButtonComponent>
                </div>
                <div className="d-flex flex-column p-3">
                  <InputComponent
                    label="이름"
                    placeholder="이름을 입력하세요"
                    value={profile.name}
                    onChange={handleInputChange("name")}
                    required
                    error={errors.name}
                    className="mb-3"
                  />
                  <InputComponent
                    label="닉네임"
                    placeholder="닉네임을 입력하세요"
                    value={profile.nickName}
                    onChange={handleInputChange("nickName")}
                    required
                    error={errors.nickName}
                    className="mb-3"
                  />
                  <InputComponent
                    label="아이디"
                    placeholder="아이디를 입력하세요"
                    value={profile.email}
                    required
                    disabled
                    className="mb-3"
                    helperText="아이디는 수정할 수 없습니다"
                  />
                </div>
              </ContainerComponent>
              <ContainerComponent
                variant="outlined"
                className="profile-info mb-3"
              >
                <div className="d-flex flex-column p-3">
                  <div className={inputClasses}>
                    <label className={styles["input-label"]}>
                      전화번호
                      <span className={styles["input-required"]}>*</span>
                    </label>
                    <div className={styles["input-wrapper"]}>
                      <input
                        type="number"
                        className={styles["input-field"]}
                        placeholder="010"
                        value={phoneNum.phoneNum1}
                        onChange={handlePhoneNumChange("phoneNum1")}
                        required
                      />
                      <span>-</span>
                      <input
                        type="number"
                        className={styles["input-field"]}
                        placeholder="전화번호를"
                        value={phoneNum.phoneNum2}
                        onChange={handlePhoneNumChange("phoneNum2")}
                        required
                      />
                      <span>-</span>
                      <input
                        type="number"
                        className={styles["input-field"]}
                        placeholder="입력하세요"
                        value={phoneNum.phoneNum3}
                        onChange={handlePhoneNumChange("phoneNum3")}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <div className={styles["input-helper"]}>
                        {errors.phoneNum1 ||
                        errors.phoneNum2 ||
                        errors.phoneNum3 ? (
                          <span className={styles["input-error-text"]}>
                            전화번호는 필수 입력값입니다
                          </span>
                        ) : (
                          <span className={styles["input-helper-text"]}>
                            전화번호는 숫자만 입력해주세요
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <InputComponent
                    label="가입일"
                    placeholder="가입일을 입력하세요"
                    value={profile.regDate}
                    disabled
                    required
                    className="mb-3"
                    helperText="가입일은 수정할 수 없습니다"
                  />
                </div>
              </ContainerComponent>
              <ContainerComponent variant="outlined" className="body-info">
                <div className="d-flex flex-column p-3">
                  <InputComponent
                    label="나이"
                    placeholder="나이를 입력하세요"
                    value={profile.age}
                    onChange={handleInputChange("age")}
                    className="mb-3"
                  />
                  <label className="labels">성별</label>
                  <div className="d-flex justify-content-around">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="male"
                        value="false"
                        checked={inputs.gender === false}
                        onChange={handleInputChange("gender")}
                      />
                      <label className="form-check-label" htmlFor="male">
                        남자
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="female"
                        value="true"
                        checked={inputs.gender === true}
                        onChange={handleInputChange("gender")}
                      />
                      <label className="form-check-label" htmlFor="female">
                        여자
                      </label>
                    </div>
                  </div>
                  <InputComponent
                    label="키"
                    placeholder="키를 입력하세요"
                    value={profile.height}
                    onChange={handleInputChange("height")}
                    className="mb-3"
                  />
                  <InputComponent
                    label="몸무게"
                    placeholder="몸무게를 입력하세요"
                    value={profile.weight}
                    onChange={handleInputChange("weight")}
                    className="mb-3"
                  />
                </div>
              </ContainerComponent>
              <div className="d-flex pt-3 justify-content-center">
                <ButtonComponent
                  variant="primary"
                  size="medium"
                  className="fs-6"
                  onClick={() => handleSubmit()}
                >
                  저장
                </ButtonComponent>
              </div>
            </ContainerComponent>
          </ContainerComponent>
        )
      }
    </>
  );
}
