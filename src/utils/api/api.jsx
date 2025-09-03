import axios from "axios";

const host = "http://localhost:8080/api/v1";

function GET(URL, data) {
  return axios.get(host + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

function POST(URL, data, isAuth = true) {
  return axios.post(host + URL, data, {
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
