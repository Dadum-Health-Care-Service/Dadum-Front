import axios from "axios";

const main = "http://localhost:8080/api/v1";
const ai = "http://localhost:8000";
const passwordless = "/passwordless";
const host = {
  main: main,
  ai: ai,
  passwordless: passwordless,
};

function GET(URL, data, isAuth = true, source = "main") {
  try {
    return axios.get(host[source] + URL, data, {
      headers: {
        Authorization: isAuth
          ? `Bearer ${localStorage.getItem("accessToken")}`
          : "",
      },
    });
  } catch (error) {
    console.error("GET 오류:", error);
    throw error;
  }
}

function POST(URL, data, isAuth = true, source = "main") {
  try {
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
      headers: {
        Authorization: isAuth
          ? `Bearer ${localStorage.getItem("accessToken")}`
          : "",
      },
    });
  } catch (error) {
    console.error("POST 오류:", error);
    throw error;
  }
}

function PUT(URL, data, isAuth = true, source = "main") {
  try {
    return axios.put(host[source] + URL, data, {
      headers: {
        Authorization: isAuth
          ? `Bearer ${localStorage.getItem("accessToken")}`
          : "",
      },
    });
  } catch (error) {
    console.error("PUT 오류:", error);
    throw error;
  }
}

function DELETE(URL, data, isAuth = true, source = "main") {
  try {
    return axios.delete(host[source] + URL, data, {
      headers: {
        Authorization: isAuth
          ? `Bearer ${localStorage.getItem("accessToken")}`
          : "",
      },
    });
  } catch (error) {
    console.error("DELETE 오류:", error);
    throw error;
  }
}

export { GET, POST, PUT, DELETE };
