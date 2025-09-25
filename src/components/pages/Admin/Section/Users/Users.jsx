import { useState, useEffect } from "react";
import { GET } from "../../../../../utils/api/api";
import ListComponent from "../../../../common/ListComponent";
import ContainerComponent from "../../../../common/ContainerComponent";

export default function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    GET("/users/list").then((res) => {
      setUsers(res.data.filter((user) => user.role === "USER"));
    });
  }, []);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        flexGrow: 1,
      }}
    >
      <div style={{ width: "100%", height: "100%" }}>
        <ListComponent>
          <ListComponent.Header>사용자 목록</ListComponent.Header>
          <>
            <ListComponent.Item
              variant="bordered"
              style={{
                backgroundColor: "#fefefe",
                boxShadow: "0px 2px 2px 0px #e5e7eb",
                height: "100%",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.4fr 1fr 1fr 1fr 1fr",
                }}
              >
                <span>번호</span>
                <span>고유 ID</span>
                <span>이름</span>
                <span>이메일</span>
                <span>권한</span>
              </div>
            </ListComponent.Item>
            {users.map((user, i) => (
              <>
                <ListComponent.Item
                  key={i}
                  variant="bordered"
                  onClick={() => {
                    navigate(`/admin/user/${user.id}`);
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "0.4fr 1fr 1fr 1fr 1fr",
                    }}
                  >
                    <span>{i + 1}</span>
                    <span>{user.usersId}</span>
                    <span>{user.usersName}</span>
                    <span>{user.email}</span>
                    <span>
                      {user.role === "USER" ? "일반 사용자" : "관리자"}
                    </span>
                  </div>
                </ListComponent.Item>
              </>
            ))}
          </>
        </ListComponent>
      </div>
      <div style={{ borderLeft: "1px solid #e5e7eb" }}>
      <ListComponent.Header>권한 변경 요청</ListComponent.Header>
        <ListComponent>
          {users.map((user) => (
            <ListComponent.Item
              variant="bordered"
              primary={user.usersName}
              secondary={user.email}
            />
          ))}
        </ListComponent>
      </div>
    </div>
  );
}
