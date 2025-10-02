import axios from "axios";

const main = "http://localhost:8080/api/v1";
const ai = "http://localhost:8000";
const passwordless = "/passwordless";
const host = {
  main: main,
  ai: ai,
  passwordless: passwordless,
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
