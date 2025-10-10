import { useState, useEffect } from "react";
import ListComponent from "../../../../common/ListComponent";
import ContainerComponent from "../../../../common/ContainerComponent";
import ButtonComponent from "../../../../common/ButtonComponent";
import ModalComponent from "../../../../common/ModalComponent";
import Pagination from "../../../../common/Pagination";
import styles from "./Users.module.css";
import { useApi } from "../../../../../utils/api/useApi";
import { useModal } from "../../../../../context/ModalContext";

export default function Users({ type = "user", isNotify = null }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const { GET, PUT, DELETE } = useApi();

  const roleMapper = {
    USER: "사용자",
    SELLER: "판매자",
    SUPER_ADMIN: "관리자",
  };
  const confirmPermission = (user) => {
    setIsConfirmModalOpen(true);
  };
  const rejectPermission = () => {
    setIsRejectModalOpen(true);
  };
  const permitRole = () => {
    PUT(`/users/role/update/${detailUser.usersId}`, {
      assignmentId: detailUser.roleAssignments[0].assignmentId,
    }).then((res) => {
      setIsConfirmModalOpen(false);
      setIsDetailModalOpen(false);
      GET("/users/role/request/list").then((res) => {
        setUsers(res.data);
        setIsCompleteModalOpen(true);
      });
    });
  };
  const rejectRole = () => {
    DELETE(`/users/role/delete/${detailUser.usersId}`, {
      assignmentId: detailUser.roleAssignments[0].assignmentId,
    }).then((res) => {
      setIsRejectModalOpen(false);
      setIsDetailModalOpen(false);
      GET("/users/role/request/list").then((res) => {
        setUsers(res.data);
        setIsCompleteModalOpen(true);
      });
    });
  };
  const closeRejectModal = () => {
    setIsRejectModalOpen(false);
  };
  const closeCompleteModal = () => {
    setIsCompleteModalOpen(false);
  };
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
  };
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };
  const fetchRoleRequest = () => {
    GET("/users/role/request/list").then((res) => {
      setUsers(res.data);
    });
  };

  const fetchRoleList = async () => {
    await GET("/users/role/list").then((res) => {
      setUsers(
        res.data.filter((user) => {
          console.log(
            user.roleAssignments.map(
              (assignment) => assignment.rolesDto.roleName
            )
          );
          console.log(
            user.roleAssignments.some((assignment) =>
              assignment.rolesDto.roleName.includes("SUPER_ADMIN")
            )
          );
          return !user.roleAssignments.some((assignment) =>
            assignment.rolesDto.roleName.includes("SUPER_ADMIN")
          );
        })
      );
    });
  };

  useEffect(() => {
    if (type === "user") {
      fetchRoleList();
    } else {
      fetchRoleRequest();
    }
  }, [type]);
  useEffect(() => {
    fetchRoleRequest();
  }, [isNotify]);

  useEffect(() => {
    if (type === "roleRequest") {
      fetchRoleRequest();
    }
  }, [isNotify]);

  const detailModalFooter = () => {
    return (
      <ModalComponent.Actions>
        <ButtonComponent variant="primary" onClick={confirmPermission}>
          허용
        </ButtonComponent>
        <ButtonComponent variant="outline" onClick={rejectPermission}>
          거부
        </ButtonComponent>
        <ButtonComponent variant="secondary" onClick={closeDetailModal}>
          닫기
        </ButtonComponent>
      </ModalComponent.Actions>
    );
  };
  const confirmModalFooter = () => {
    return (
      <ModalComponent.Actions>
        <ButtonComponent variant="primary" onClick={permitRole}>
          확인
        </ButtonComponent>
        <ButtonComponent variant="secondary" onClick={closeConfirmModal}>
          취소
        </ButtonComponent>
      </ModalComponent.Actions>
    );
  };
  const rejectModalFooter = () => {
    return (
      <ModalComponent.Actions>
        <ButtonComponent variant="primary" onClick={rejectRole}>
          확인
        </ButtonComponent>
        <ButtonComponent variant="secondary" onClick={closeRejectModal}>
          취소
        </ButtonComponent>
      </ModalComponent.Actions>
    );
  };
  const completeModalFooter = () => {
    return (
      <ModalComponent.Actions>
        <ButtonComponent variant="primary" onClick={closeCompleteModal}>
          확인
        </ButtonComponent>
      </ModalComponent.Actions>
    );
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        flexGrow: 1,
      }}
    >
      <ModalComponent
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        title="상세보기"
        size="small"
        footer={detailModalFooter()}
      >
        {detailUser && (
          <div className={styles.detail}>
            <ul>
              <li>이름</li>
              <li> {detailUser.usersName}</li>
              <li>이메일</li>
              <li> {detailUser.email}</li>
              <li>닉네임</li>
              <li> {detailUser.nickName}</li>
              <li>전화번호</li>
              <li> {detailUser.phoneNum}</li>
              <li>요청 권한</li>
              <li>
                {detailUser.roleAssignments
                  .map(
                    (roleAssignment) =>
                      roleMapper[roleAssignment.rolesDto.roleName]
                  )
                  .join(", ")}
              </li>
            </ul>
          </div>
        )}
      </ModalComponent>
      <ModalComponent
        isOpen={isConfirmModalOpen}
        onClose={closeConfirmModal}
        title="권한 허용"
        size="small"
        footer={confirmModalFooter()}
      >
        <div>권한 허용을 하시겠습니까?</div>
      </ModalComponent>
      <ModalComponent
        isOpen={isRejectModalOpen}
        onClose={closeRejectModal}
        title="권한 거부"
        size="small"
        footer={rejectModalFooter()}
      >
        <div>권한 거부를 하시겠습니까?</div>
      </ModalComponent>
      <ModalComponent
        isOpen={isCompleteModalOpen}
        onClose={closeCompleteModal}
        title="권한 변경 완료"
        size="small"
        footer={completeModalFooter()}
      >
        <div>권한 변경이 완료되었습니다.</div>
      </ModalComponent>
      <div style={{ width: "100%", height: "100%" }}>
        <ListComponent>
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
                  alignItems: "center",
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
                    onClick={() => {}}
                    style={{
                      padding: "0",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "0.4fr 1fr 1fr 1fr 1fr",
                        justifyItems: "center",
                        alignItems: "center",
                      }}
                    >
                      <span className={styles.span}>
                        {i + 1 + (currentPage - 1) * 10}
                      </span>
                      <span className={styles.span}>{user.usersName}</span>
                      <span className={styles.span}>{user.email}</span>
                      <span className={styles.span}>
                        {user.roleAssignments
                          .map(
                            (roleAssignment) =>
                              roleMapper[roleAssignment.rolesDto.roleName]
                          )
                          .join(", ")}
                      </span>
                      <span className={styles.span}>
                        {type === "user" ? (
                          user.roleAssignments.some(
                            (assignment) => assignment.isActive === 0
                          ) ? (
                            "대기중"
                          ) : (
                            "허용됨"
                          )
                        ) : (
                          <ButtonComponent
                            variant="outline"
                            onClick={() => {
                              setDetailUser(user);
                              setIsDetailModalOpen(true);
                            }}
                          >
                            상세보기
                          </ButtonComponent>
                        )}
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
