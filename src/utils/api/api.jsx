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
  return axios.get(host[source] + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

function POST(URL, data, isAuth = true, source = "main") {
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
}

function PUT(URL, data) {
  return axios.put(host + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

function DELETE(URL, data) {
  return axios.delete(host + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

export { GET, POST, PUT, DELETE };
