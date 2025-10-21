import axios from "axios";

const main = "http://localhost:8080/api/v1";
//const main = "/security"; //보안서버 경유용
const ai = "/ml"; // 프록시 경로 사용
const security = "/security";
const passwordless = "/passwordless";
const kakao = "https://kauth.kakao.com";
const host = {
  main: main,
  ai: ai,
  passwordless: passwordless,
  security: security,
  kakao: kakao,
};

const createAuthHeaders = (accessToken, isAuth) => {
  const headers = {};
  if (isAuth) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
};

/*
  기존 로직인 localStorage.getItem("accessToken")으로는 
  accessToken이 user안에 저장되어 있기 때문에 읽어올 수 없다.
  따라서 useApi.jsx로 커스텀 훅을 만들어 user의 accessToken전달 
  
  + data={}로 기본값 설정
*/
function GET(URL, data = {}, accessToken, isAuth = true, source = "main") {
  try {
    const headers = createAuthHeaders(accessToken, isAuth);
    return axios.get(host[source] + URL, {
      params: data,
      headers: headers,
    });
  } catch (error) {
    console.error("GET 오류:", error);
    throw error;
  }
}

function POST(URL, data = {}, accessToken, isAuth = true, source = "main") {
  try {
    const headers = createAuthHeaders(accessToken, isAuth);
    if (source === "passwordless") {
      const payload = new URLSearchParams();
      for (const key in data) {
        payload.append(key, data[key]);
      }
      return axios.post(host[source] + URL, payload, {
        withCredentials: true,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      });
    }
    if (source === "kakao") {
      return axios.post(kakao + URL, data, {
        headers: {
          "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
        },
        withCredentials: false,
      });
    }
    
    // FormData인 경우 Content-Type 헤더를 설정하지 않음 (브라우저가 자동 설정)
    if (data instanceof FormData) {
      return axios.post(host[source] + URL, data, {
        headers: headers,
      });
    }
    
    return axios.post(host[source] + URL, data, {
      headers: headers,
    });
  } catch (error) {
    console.error("POST 오류:", error);
    throw error;
  }
}

function PUT(URL, data = {}, accessToken, isAuth = true, source = "main") {
  try {
    const headers = createAuthHeaders(accessToken, isAuth);
    return axios.put(host[source] + URL, data, {
      headers: headers,
    });
  } catch (error) {
    console.error("PUT 오류:", error);
    throw error;
  }
}

function DELETE(URL, data = {}, accessToken, isAuth = true, source = "main") {
  try {
    const headers = createAuthHeaders(accessToken, isAuth);
    return axios.delete(host[source] + URL, {
      data: data,
      headers: headers,
    });
  } catch (error) {
    console.error("DELETE 오류:", error);
    throw error;
  }
}

export { GET, POST, PUT, DELETE };
