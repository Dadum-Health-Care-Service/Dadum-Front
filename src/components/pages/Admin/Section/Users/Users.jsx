import { useState, useEffect } from "react";
import ListComponent from "../../../../common/ListComponent";
import ContainerComponent from "../../../../common/ContainerComponent";
import Pagination from "../../../../common/Pagination";
import styles from "./Users.module.css";
import { useApi } from "../../../../../utils/api/useApi";

export default function Users() {
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const { GET } = useApi();
  useEffect(() => {
    GET("/users/list").then((res) => {
      console.log(
        res.data.filter((user) => {
          return user.roleAssignmentDto.rolesDto.roleName === "USER";
        })
      );
      setUsers(
        res.data.filter(
          (user) => user.roleAssignmentDto.rolesDto.roleName === "USER"
        )
      );
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
                padding: "0",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "0.4fr 1fr 1fr 1fr 1fr",
                  justifyItems: "center",
                }}
              >
                <span className={styles.span}>번호</span>
                <span className={styles.span}>이름</span>
                <span className={styles.span}>이메일</span>
                <span className={styles.span}>권한</span>
                <span className={styles.span}>상태</span>
              </div>
            </ListComponent.Item>
            {users
              .slice((currentPage - 1) * 10, currentPage * 10)
              .map((user, i) => (
                <>
                  <ListComponent.Item
                    key={i}
                    variant="bordered"
                    onClick={() => {
                      navigate(`/admin/user/${user.id}`);
                    }}
                    style={{
                      padding: "0",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "0.4fr 1fr 1fr 1fr 1fr",
                        justifyItems: "center",
                      }}
                    >
                      <span className={styles.span}>
                        {i + 1 + (currentPage - 1) * 10}
                      </span>
                      <span className={styles.span}>{user.usersName}</span>
                      <span className={styles.span}>{user.email}</span>
                      <span className={styles.span}>
                        {user.roleAssignmentDto.rolesDto.roleName === "USER"
                          ? "일반 사용자"
                          : "관리자"}
                      </span>
                      <span className={styles.span}>
                        {user.roleAssignmentDto.isActive ? "허용됨" : "대기중"}
                      </span>
                    </div>
                  </ListComponent.Item>
                </>
              ))}
          </>
        </ListComponent>
        <Pagination
          currentPage={currentPage}
          totalPage={Math.ceil(users.length / 10)}
          nextPage={() => {
            setCurrentPage(currentPage + 1);
          }}
          previousPage={() => {
            setCurrentPage(currentPage - 1);
          }}
        />
      </div>
    </div>
  );
}
