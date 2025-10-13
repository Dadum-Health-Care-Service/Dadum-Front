import { useState, useEffect, useContext, useRef } from "react";
import ContainerComponent from "../../common/ContainerComponent";
import FormComponent from "../../common/FormComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import ListComponent from "../../common/ListComponent";
import { AuthContext } from "../../../context/AuthContext";
import {
  KAKAO_CLIENT_ID,
  KAKAO_AUTH_URL,
  KAKAO_REDIRECT_URI,
} from "../../../utils/oauth/oAuth";
import styles from "./Login.module.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";
import axios from "axios";

function Login() {
  const { POST } = useApi();
  const navigate = useNavigate();
  const location = useLocation();
  const { showBasicModal } = useModal();

  // 현재 보여줄 뷰를 관리하는 상태 ('login', 'passwordless','loggedIn')
  const [view, setView] = useState("login");
  const { user, dispatch } = useContext(AuthContext);
  // 로그인 타입 라디오 버튼 상태
  const [loginType, setLoginType] = useState("password");

  // 로그인 폼 입력 상태
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  // PushConnector 연결
  const [pushConnectorUrl, setPushConnectorUrl] = useState("");
  const [pushConnectorToken, setPushConnectorToken] = useState("");

  // QR 코드 관련 상태
  const [isQrLoading, setIsQrLoading] = useState(true);
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [serverUrl, setServerUrl] = useState("");
  const [regCode, setRegCode] = useState("");

  //QR 등록 여부
  const [isQrRegistered, setIsQrRegistered] = useState(false);

  //루틴 ID 설정
  const [sessionId, setSessionId] = useState("");

  //서비스 패스워드 설정
  const [servicePassword, setServicePassword] = useState("");
  const [currentTerm, setCurrentTerm] = useState(0);
  const [termLength, setTermLength] = useState(0);

  //쿼리 파라미터 추출
  const query = new URLSearchParams(location.search);

  // 카카오 코드 추출
  const kakaoCode = query.get("code");

  //카카오 로그인용
  const kakaoRef = useRef(null);

  // 최초렌더링 시 user가 있다면

  // view 상태가 'passwordless'로 변경될 때 QR 코드를 생성하는 로직 (Side Effect)
  useEffect(() => {
    const fetchQrCodeData = async () => {
      if (view === "passwordless") {
        setIsQrLoading(true);

        try {
          // 1. 일반 로그인으로 '임시 토큰' 먼저 받기
          const tokenResponse = await POST(
            "/passwordlessManageCheck",
            { id: loginId, pw: loginPw },
            false,
            "passwordless"
          ).then((res) => {
            console.log(res.data);
            return res.data;
          });

          if (tokenResponse.result !== "OK")
            throw new Error(
              "로그인 정보가 올바르지 않아 QR 정보를 가져올 수 없습니다."
            );

          const passwordlessToken = tokenResponse.PasswordlessToken;

          // 2. QR 요청을 위한 JSESSIONID 발급
          const jsessionidResponse = await POST(
            "/passwordlessCallApi",
            { url: "isApUrl", params: `userId=${loginId}&QRReg=` },
            false,
            "passwordless"
          ).then((res) => {
            console.log(res.data);
            return res.data;
          });

          if (jsessionidResponse.result !== "OK")
            throw new Error("QR 정보 요청에 실패했습니다.");

          const jsessionidData = await JSON.parse(jsessionidResponse.data);

          // 3. QR 정보 요청
          const qrResponse = await POST(
            "/passwordlessCallApi",
            {
              url: "joinApUrl",
              params: `userId=${loginId}&token=${passwordlessToken}`,
            },
            false,
            "passwordless"
          ).then((res) => {
            console.log(JSON.parse(res.data.data));
            const result_data = JSON.parse(res.data.data);
            return result_data;
          });
          console.log(qrResponse);
          if (qrResponse.result !== true)
            throw new Error("QR 정보 요청에 실패했습니다.");

          const qrData = qrResponse.data;
          console.log(qrData);
          // 상태 업데이트
          setQrImageUrl(qrData.qr);
          setServerUrl(qrData.serverUrl);
          setRegCode(qrData.registerKey);
          setPushConnectorUrl(qrData.pushConnectorUrl);
          setPushConnectorToken(qrData.pushConnectorToken);
        } catch (error) {
          console.error("QR 코드 정보 가져오기 오류:", error);
          showBasicModal(error.message);
          setView("login"); // 실패 시 로그인 화면으로
        } finally {
          setIsQrLoading(false);
        }
      }
    };

    fetchQrCodeData();
  }, [view, loginId, loginPw]); // loginPw도 의존성에 추가

  useEffect(() => {
    const confirmQrRegistered = async () => {
      console.log("confirmQrRegistered");
      await POST(
        "/users/auth/passwordless/register",
        { passwordlessToken: pushConnectorToken },
        user.accessToken,
        true
      ).then(async (res) => {
        console.log(res.data);
        if (res.status === 200) {
          await POST(
            "/passwordlessCallApi",
            { url: "isApUrl", params: `userId=${loginId}&QRReg=T` },
            false,
            "passwordless"
          ).then((res) => {
            console.log(res.data);
            if (res.data.result === "OK") {
              setIsQrRegistered(true);
              setIsLoggedIn(true);
              navigate("/");
            }
          });
        }
      });
    };
    const connectWebSocket = async () => {
      const handshakeMessage = {
        type: "hand",
        pushConnectorToken: pushConnectorToken,
      };
      const ws = new WebSocket(`/passwordless-ws`);
      ws.onopen = () => {
        ws.send(JSON.stringify(handshakeMessage));
      };
      ws.onmessage = async (event) => {
        if (view === "passwordless" && pushConnectorToken) {
          console.log(
            "Server Message:",
            JSON.parse(event.data),
            JSON.parse(event.data).type
          );
          if (JSON.parse(event.data).type === "result") {
            confirmQrRegistered();
          }
        }
        if (view === "login" && loginType === "passwordless") {
          console.log(
            "Server Message:",
            JSON.parse(event.data),
            JSON.parse(event.data).type
          );
          if (JSON.parse(event.data).type === "result") {
            await POST(
              "/passwordlessCallApi",
              {
                url: "resultUrl",
                params: `userId=${loginId}&sessionId=${sessionId}`,
              },
              false,
              "passwordless"
            ).then(async (res) => {
              console.log(res.data);
              const resultData = JSON.parse(res.data.data);
              if (res.data.result === "OK") {
                console.log(resultData);
                console.log(resultData.data.auth);
                if (resultData.data.auth === "Y") {
                  await POST(
                    "/users/auth/passwordless/login",
                    { email: loginId, passwordlessToken: pushConnectorToken },
                    false
                  ).then((res) => {
                    console.log(res.data);
                    dispatch({ type: "LOGIN", user: res.data });
                    setIsLoggedIn(true);
                    navigate("/");
                  });
                } else {
                  await POST(
                    "/passwordlessCallApi",
                    {
                      url: "cancelUrl",
                      params: `userId=${loginId}&sessionId=${sessionId}`,
                    },
                    false,
                    "passwordless"
                  ).then((res) => {
                    showBasicModal("사용자에 의한 연결 취소");
                    setCurrentTerm(0);
                    setServicePassword("");
                  });
                }
              }
            });
          }
        }
      };
    };
    connectWebSocket();
  }, [pushConnectorToken]);

  //카카오 로그인
  useEffect(() => {
    const grantType = "authorization_code";
    if (kakaoCode) {
      POST(
        `/oauth/token?grant_type=${grantType}&client_id=${KAKAO_CLIENT_ID}&redirect_uri=${KAKAO_REDIRECT_URI}&code=${kakaoCode}`,
        {},
        false,
        "kakao"
      )
        .then((res) => {
          console.log(res);
          const { access_token } = res.data;
          console.log(access_token);
          POST("/users/login/kakao", {
            socialType: "kakao",
            accessToken: access_token,
          })
            .then((res) => {
              console.log("kakao login successful");
              dispatch({ type: "LOGIN", user: res.data });

              // 사용자 역할에 따라 적절한 페이지로 리다이렉트
              if (res.data.role === "SUPER_ADMIN") {
                navigate("/admin", { replace: true });
              } else {
                navigate("/", { replace: true });
              }
            })
            .catch();
        })
        .catch((error) => {
          //toast
        });
    }
  }, [kakaoCode]);

  // 로그인 처리 핸들러
  const handleLogin = async (e) => {
    e.preventDefault(); // 폼 기본 제출 동작 방지

    if (!loginId) {
      showBasicModal("아이디를 입력해주세요.");
      return;
    }

    console.log("--- 로그인 시도 ---");
    console.log("아이디:", loginId);

    if (loginType === "password") {
      if (!loginPw) {
        showBasicModal("비밀번호를 입력해주세요.");
        return;
      }
      console.log("로그인 방식: 비밀번호");

      //메인서버 로그인
      await POST(
        "/users/login",
        {
          email: loginId,
          password: loginPw,
        },
        false
      )
        .then((res) => {
          dispatch({ type: "LOGIN", user: res.data });
          setView("loggedIn");
        })
        .catch((error) => {
          console.error("로그인 오류:", error);
          if (typeof error.response?.data === "string") {
            const msg = error.response.data;
            if (msg.length > 0)
              showBasicModal(
                msg.substring(msg.indexOf(":") + 1),
                "로그인 실패"
              );
            else showBasicModal("로그인에 실패하였습니다", "로그인 실패");
          } else {
            showBasicModal("로그인에 실패하였습니다.", "네트워크 에러");
          }
        });

      //메인서버 로그인
    } else {
      console.log("로그인 방식: 패스워드리스");
      const handshakeMessage = {
        type: "hand",
        pushConnectorToken: pushConnectorToken,
      };
      const getApUrlResponse = async () => {
        await POST(
          "/passwordlessCallApi",
          { url: "isApUrl", params: `userId=${loginId}&QRReg=` },
          false,
          "passwordless"
        ).then((res) => {
          console.log(res.data);
          if (res.data.result === "OK") {
            const ApUrlResponseDetail = JSON.parse(res.data.data);
            if (ApUrlResponseDetail.data.exist === true) {
              getTokenForOneTime();
            }
          }
        });
      };
      const getTokenForOneTime = async () => {
        await POST(
          "/passwordlessCallApi",
          { url: "getTokenForOneTimeUrl", params: `userId=${loginId}` },
          false,
          "passwordless"
        ).then((res) => {
          if (res.data.result === "OK") {
            const oneTimeToken = res.data.oneTimeToken;
            console.log(oneTimeToken);
            getSpUrlResponse(oneTimeToken);
          }
        });
      };
      const getSpUrlResponse = async (oneTimeToken) => {
        await POST(
          "/passwordlessCallApi",
          {
            url: "getSpUrl",
            params: `userId=${loginId}&token=${oneTimeToken}`,
          },
          false,
          "passwordless"
        ).then((res) => {
          console.log(res.data);
          if (res.data.result === "OK") {
            setSessionId(res.data.sessionId);
            const SpUrlResponseDetail = JSON.parse(res.data.data);
            console.log(SpUrlResponseDetail);
            setPushConnectorUrl(SpUrlResponseDetail.data.pushConnectorUrl);
            setPushConnectorToken(SpUrlResponseDetail.data.pushConnectorToken);
            setServicePassword(SpUrlResponseDetail.data.servicePassword);
            setTermLength(SpUrlResponseDetail.data.term);
            setCurrentTerm(SpUrlResponseDetail.data.term);
            console.log(SpUrlResponseDetail.data.servicePassword);
            setTimer();
          }
        });
      };

      getApUrlResponse();
    }
  };
  const setTimer = () => {
    const interval = setInterval(() => {
      setCurrentTerm((prev) => {
        console.log(prev); // 현재 값 확인
        if (prev <= 1) {
          clearInterval(interval);
          return 0; // 0으로 고정
        }
        return prev - 1;
      });
    }, 1000);

    return interval;
  };

  const handlePasswordlessRegister = async () => {
    await POST(
      "/join",
      { id: loginId, pw: loginPw },
      false,
      "passwordless"
    ).then(async (res) => {
      setView("passwordless");
    });
    //setView("passwordless");
  };

  return (
    <div className="login-container">
      <div className="login-header">
        <h1 className="login-title">🎯 다듬</h1>
        <p className="login-subtitle">루틴을 관리하고 자세를 분석해보세요</p>
      </div>

      {/* 로그인 뷰 */}
      {view === "login" && !user && (
        <FormComponent
          title="로그인"
          subtitle="다듬에 오신 것을 환영합니다."
          onSubmit={handleLogin}
          variant="elevated"
          size="large"
          layout="vertical"
          className={styles["login-form"]}
        >
          <FormComponent.Field label="아이디" required>
            <InputComponent
              placeholder="아이디를 입력하세요"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              variant="outlined"
              size="medium"
            />
          </FormComponent.Field>

          {loginType === "password" && (
            <FormComponent.Field label="비밀번호" required>
              <InputComponent
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={loginPw}
                onChange={(e) => setLoginPw(e.target.value)}
                required
                variant="outlined"
                size="medium"
              />
            </FormComponent.Field>
          )}
          {loginType === "passwordless" && (
            <div className={styles["passwordless-progress"]}>
              {termLength > 0 && (
                <div
                  className={styles["passwordless-progress-service-password"]}
                >
                  {servicePassword}
                </div>
              )}
              <div
                className={styles["passwordless-progress-bar"]}
                style={{
                  width: `${(currentTerm / termLength) * 100}%`,
                }}
              ></div>
            </div>
          )}

          <FormComponent.Field className={styles["login-type-field"]}>
            <input
              type="radio"
              name="loginType"
              value="password"
              checked={loginType === "password"}
              onChange={(e) => setLoginType(e.target.value)}
            />
            비밀번호
            <input
              type="radio"
              name="loginType"
              value="passwordless"
              checked={loginType === "passwordless"}
              onChange={(e) => setLoginType(e.target.value)}
            />
            패스워드리스
          </FormComponent.Field>

          <div className={styles["button-group"]}>
            <ButtonComponent
              type="submit"
              variant="outline-primary"
              size="large"
              fullWidth
            >
              로그인
            </ButtonComponent>
            <ButtonComponent
              variant="ghost"
              size="large"
              fullWidth
              style={{ objectFit: "fill", padding: "0" }}
              onClick={() => {
                kakaoRef.current.click();
              }}
            >
              <img
                src={"/img/kakao_login.png"}
                style={{ height: "100%" }}
                alt="kakao"
              />
              <a href={KAKAO_AUTH_URL} ref={kakaoRef} hidden></a>
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => navigate("/signup")}
              fullWidth
            >
              계정이 없으신가요? 회원가입
            </ButtonComponent>
          </div>

          <div className={styles["button-find"]}>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => navigate("/findid")}
            >
              아이디 찾기
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => navigate("/findpw")}
            >
              비밀번호 찾기
            </ButtonComponent>
          </div>
        </FormComponent>
      )}

      {/* 패스워드리스 등록 뷰 */}
      {view === "passwordless" && (
        <div className={styles["passwordless-container"]}>
          <h2>패스워드리스 등록</h2>
          <p>스마트폰 앱으로 QR 코드를 스캔해주세요.</p>

          <ContainerComponent
            variant="default"
            size="medium"
            className={styles.qrSection}
          >
            <ContainerComponent
              variant="default"
              size="medium"
              className={styles.qrContainer}
            >
              {isQrLoading ? (
                <span>QR 코드 생성 중...</span>
              ) : (
                <img
                  id="qr-code-img"
                  src={qrImageUrl}
                  alt="QR Code"
                  className={styles.qrImage}
                />
              )}
            </ContainerComponent>

            {!isQrLoading && (
              <ListComponent variant="bordered" size="medium">
                <ListComponent.Item primary="서버 URL" secondary={serverUrl} />
                <ListComponent.Item primary="등록 코드" secondary={regCode} />
              </ListComponent>
            )}
          </ContainerComponent>

          <ContainerComponent
            variant="default"
            size="medium"
            className={styles.buttonSection}
          >
            <ButtonComponent
              onClick={() => setView("login")}
              variant="secondary"
              fullWidth
            >
              취소
            </ButtonComponent>
          </ContainerComponent>
        </div>
      )}

      {/* 로그인 성공 화면 */}
      {(view === "loggedIn" || user) && (
        <FormComponent
          title="로그인"
          subtitle="다듬에 오신 것을 환영합니다."
          onSubmit={handleLogin}
          variant="elevated"
          size="large"
          layout="vertical"
          className={styles["logged-in-container"]}
        >
          <h2>로그인 성공!</h2>
          <p>
            환영합니다, <span style={{ color: "#2563eb" }}>{user.email}</span>
            님!
          </p>
          <p>다듬 서비스를 이용하실 수 있습니다.</p>

          <div className={styles["button-group"]}>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={() => {
                navigate("/", { replace: true });
              }}
              fullWidth
            >
              메인 화면으로 이동
            </ButtonComponent>
            <ButtonComponent
              variant="outline-primary"
              size="large"
              onClick={handlePasswordlessRegister}
              fullWidth
            >
              패스워드리스 등록
            </ButtonComponent>
          </div>
        </FormComponent>
      )}
    </div>
  );
}

export default Login;
