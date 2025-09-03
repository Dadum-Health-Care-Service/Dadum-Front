import axios from "axios";

const main = "http://localhost:8080/api/v1";
const ai = "http://localhost:8000";
const host ={
  main:main,
  ai:ai
}


function GET(URL, data,isAuth = true, source = "main") {
  return axios.get(host[source] + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

function POST(URL, data, isAuth = true, source = "main") {
  return axios.post(host[source] + URL, data, {
    headers: {
      Authorization: isAuth
        ? `Bearer ${localStorage.getItem("accessToken")}`
        : "",
    },
  });
}

function PUT(URL, data, isAuth = true, source = "main") {
  return axios.put(host[source] + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

function DELETE(URL, data, isAuth = true, source = "main") {
  return axios.delete(host[source] + URL, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
    },
  });
}

export { GET, POST, PUT, DELETE };
