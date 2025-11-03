import React, { useContext, useEffect, useState } from "react";
import { Card, ListGroup, ListGroupItem } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import ListComponent from "../../common/ListComponent";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";

export default function MySocial() {
  const { GET } = useApi();
  const { user } = useContext(AuthContext);
  const { showBasicModal } = useModal();
  const [userData, setUserData] = useState({
    nickName: "",
    email: "",
    profileImg: "/img/userAvatar.png",
  });
  const [postData, setPostData] = useState([]);
  const [commentData, setCommentData] = useState([]);
  const [selectedType, setSelectedType] = useState("posts");
  const navigate = useNavigate();
  const [loading, setLoding] = useState(false);

  useEffect(() => {
    if (!user || !user.usersId) {
      showConfirmModal(
        "사용자 정보를 찾을 수 없습니다",
        "네트워크 에러",
        "확인을 누르시면 로그아웃 됩니다",
        () => {
          dispatch({ type: "LOGOUT" });
        }
      );
      return;
    }
    const fetchInitialData = async () => {
      const res = await GET("/posts");
      setPostData(res.data);
      const cData = await GET("/comments/list");
      const comments = cData.data;
      const commentsWithPostTitle = await Promise.all(
        comments.map(async (comment) => {
          const postRes = await GET(`/posts/${comment.postId}`);
          return {
            ...comment,
            postTitle:
              postRes.data.postContent.length > 10
                ? `${postRes.data.postContent.substring(0, 10)}...`
                : postRes.data.postContent,
          };
        })
      );
      setCommentData(commentsWithPostTitle);
    };
    const fetchUser = async () => {
      try {
        const res = await GET(`/users/${user.usersId}`, {}, false);
        setUserData((prev) => ({
          ...prev,
          nickName: res.data.nickName,
          email: res.data.email,
          profileImg: res.data.profileImg,
        }));
      } catch (err) {
        console.log(err);
        showBasicModal(
          "사용자 정보를 가져오는 중 오류가 발생하였습니다.",
          "네트워크 에러"
        );
      }
    };
    fetchUser();
    fetchInitialData();
  }, [user]);

  useEffect(() => {
    if (!selectedType || !user || !user.accessToken) return;

    const fetchData = async () => {
      setLoding(true);
      if (selectedType === "posts") {
        try {
          const res = await GET("/posts");
          setPostData(res.data);
        } catch (err) {
          console.log(err);
          showBasicModal(
            "내가 작성한 게시글 조회에 실패하였습니다",
            "네트워크 에러"
          );
        }
      } else if (selectedType === "comments") {
        try {
          const cData = await GET("/comments/list");
          const comments = cData.data;
          const commentsWithPostTitle = await Promise.all(
            comments.map(async (comment) => {
              const postRes = await GET(`/posts/${comment.postId}`);
              return {
                ...comment,
                postTitle:
                  postRes.data.postContent.length > 10
                    ? `${postRes.data.postContent.substring(0, 10)}...`
                    : postRes.data.postContent,
              };
            })
          );
          setCommentData(commentsWithPostTitle);
        } catch (err) {
          console.log(err);
          showBasicModal(
            "내가 작성한 댓글 조회에 실패하였습니다",
            "네트워크 에러"
          );
        }
      }
      setLoding(false);
    };
    fetchData();
  }, [selectedType, user]);

  const handleSelectedType = (type) => {
    setSelectedType(type);
    console.log("선택된 항목:", type);
  };

  const renderContent = () => {
    if (loading) {
      return <div>로딩 중 ...</div>;
    }
    switch (selectedType) {
      case "posts": {
        return (
          <ListComponent variant="elevated" className="mb-3">
            <ListComponent.Header>나의 글</ListComponent.Header>
            <ListGroup.Item
              action
              className="text-muted p-2"
              style={{ fontSize: "0.9rem" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "max-content 1fr max-content",
                  columnGap: "1rem",
                  width: "100%",
                }}
              >
                <div className="pr-2">ID</div>
                <div>내용</div>
                <div className="pr-5">등록일</div>
              </div>
            </ListGroup.Item>
            <hr className="text-secondary" />
            {postData.length > 0 ? (
              postData.map((post, i) => {
                return (
                  <ListGroup.Item
                    key={i}
                    action
                    onClick={() => navigate(`/social`)}
                    className="px-2 py-1"
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "max-content 1fr max-content",
                        fontSize: "0.9rem",
                        columnGap: "1rem",
                        width: "100%",
                      }}
                    >
                      <React.Fragment>
                        <div className="pr-2">{post.postId}</div>
                        <div
                          style={{
                            overflow: "hidden",
                            wordBreak: "break-word",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {post.postContent}
                        </div>
                        <div>{post.postRegDate.slice(0, 10)}</div>
                      </React.Fragment>
                    </div>
                  </ListGroup.Item>
                );
              })
            ) : (
              <div className="p-3">작성한 글이 없습니다</div>
            )}
          </ListComponent>
        );
      }
      case "comments": {
        return (
          <ListComponent variant="elevated">
            <ListComponent.Header>나의 댓글</ListComponent.Header>
            <div className="list-group list-group-flush border-bottom scrollarea">
              {commentData.length > 0 ? (
                commentData.map((comment) => {
                  return (
                    <Link
                      key={comment.commentId}
                      to={`/social`}
                      className="list-group-item list-group-item-action py-3 lh-tight"
                    >
                      <div className="d-flex w-100 align-items-center justify-content-between">
                        <strong className="mb-1">{comment.content}</strong>
                      </div>
                      <div className="col-10 mb-1 small text-uppercase">
                        {comment.postTitle}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-3">작성한 댓글이 없습니다</div>
              )}
            </div>
          </ListComponent>
        );
      }
      default: {
        return <></>;
      }
    }
  };

  return (
    <>
      <div className="pb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-start gap-3">
          <div
            className="flex-shrink-0 w-100"
            style={{ maxWidth: "300px", minWidth: "200px", margin: "0 auto" }}
          >
            <Card>
              <div className="d-flex flex-row justify-content-around">
                <ListComponent>
                  <ListComponent.Item
                    primary="나의 글"
                    selected={selectedType === "posts"}
                    onClick={() => handleSelectedType("posts")}
                    children={`${postData.length}개`}
                  />
                </ListComponent>
                <ListComponent>
                  <ListComponent.Item
                    primary="나의 댓글"
                    selected={selectedType === "comments"}
                    onClick={() => handleSelectedType("comments")}
                    children={`${commentData.length}개`}
                  />
                </ListComponent>
              </div>
            </Card>
          </div>
          <div
            className="flex-grow-1 w-100"
            style={{ maxWidth: "1000px", minWidth: "300px" }}
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  );
}
