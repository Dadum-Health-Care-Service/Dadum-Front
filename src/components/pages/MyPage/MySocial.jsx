import React, { useContext, useEffect, useState } from "react";
import { Card, ListGroup, ListGroupItem } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import ListComponent from "../../common/ListComponent";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useModal } from "../../../context/ModalContext";

export default function MySocial(){
    const {user}=useContext(AuthContext);
    const {showBasicModal}=useModal();
    const [userData,setUserData]=useState({
        nickName:'',
        email:'',
        profileImg:'/img/userAvatar.png',
    });
    const [postData,setPostData]=useState([]);
    const [commentData,setCommentData]=useState([]);
    const [selectedType,setSelectedType]=useState(null);
    const navigate = useNavigate();

    useEffect(()=>{
        axios.get(`http://localhost:8080/api/v1/users/${user.usersId}`)
            .then(res=>{
                setUserData(prev=>({
                    ...prev,
                    nickName:res.data.nickName,
                    email:res.data.email,
                    profileImg:res.data.profileImg,
                }));
            })
            .catch(e=>{
                console.log(e);
                showBasicModal("사용자 정보를 가져오는 중 오류가 발생하였습니다.","네트워크 에러");
            });
    },[user.usersId]);

    const handleSelectedType = (type)=>{
        setSelectedType(type);
        console.log("선택된 항목:", type);
    }

    const fetchPosts = async ()=>{
        const data = await axios
            .get('http://localhost:8080/api/v1/posts',{
                headers: {
                    Authorization: `Bearer ${user.accessToken}`,
                },
            })
            .then(res=>{
                setPostData(res.data);
            })
            .catch(err=>{
                console.log(err);
                showBasicModal("내가 작성한 게시글 조회에 실패하였습니다","네트워크 에러");
            });
    };

    const fetchComments = async ()=>{
        const cData = await axios.get('http://localhost:8080/api/v1/comments/list',{
            headers: {
                Authorization: `Bearer ${user.accessToken}`,
            },
        });
        const comments = cData.data;
        const commentsWithPostTitle = await Promise.all(
            comments.map(async comment =>{
                const postRes = await axios.get(`http://localhost:8080/api/v1/posts/${comment.postId}`,{
                    headers: { Authorization: `Bearer ${user.accessToken}` },
                });
                return {...comment,postTitle:postRes.data.postTitle};
            }),
        );
        setCommentData(commentsWithPostTitle);
    }

    useEffect(()=>{
        fetchPosts();
        fetchComments();
    },[]);

    const renderPosts = (type)=>{
        switch(type){
            case "posts":{
                return (
                    <ListComponent variant="elevated">
                        <ListComponent.Header>나의 글</ListComponent.Header>
                        <ListGroup.Item
                            action
                            className="text-muted m-2"
                            style={{fontSize:'0.9rem'}} 
                        >
                            <div style={{
                                display:'grid',
                                gridTemplateColumns:"0.2fr 0.5fr 1fr 0.5fr"
                            }}>
                                <div>ID</div>
                                <div>제목</div>
                                <div>내용</div>
                                <div>등록일</div>
                            </div>
                        </ListGroup.Item>
                        {postData.length > 0 ? (
                            postData.map((post,i)=>{
                                return (
                                    <ListGroup.Item
                                        key={i}
                                        action
                                        onClick={()=>navigate('/')}
                                    >
                                        <div>
                                            <React.Fragment>
                                                <div>{post.postId}</div>
                                                <div>{post.postTitle}</div>
                                                <div>{post.postContent}</div>
                                                <div>{post.postRegDate.slice(0,10)}</div>
                                            </React.Fragment>
                                        </div>
                                    </ListGroup.Item>
                                );
                            })
                        ):(
                            <div>작성한 글이 없습니다</div>
                        )}
                    </ListComponent>
                )
            }
            case "comments":{
                return(
                    <ListComponent variant="elevated">
                        <ListComponent.Header>나의 댓글</ListComponent.Header>
                        <div className="list-group list-group-flush border-bottom scrollarea">
                            <Link
                                to={"/"}
                                className="list-group-item list-group-item-action py-3 lh-tight"
                            >
                                <div className="d-flex w-100 align-items-center justify-content-between">
                                    <strong className="mb-1">댓글</strong>
                                </div>
                                <div className="col-10 mb-1 small text-uppercase">글 제목1</div>
                            </Link>
                        </div>
                    </ListComponent>
                )
            }
            default :{
                return<>
                
                </>
            }
        }
    }

    return <>
        <div>
            <div>
                <div className="d-flex justify-content-between">
                    <Card className="col-5">
                        <div className="d-flex flex-column align-items-center">
                            <img className="rounded-circle mb-1" width="100px" src={userData.profileImg}/>
                            <div className="fs-3">{userData.nickName}</div>
                            <div className="text-muted">{userData.email}</div>
                        </div>
                        <div className="d-flex flex-row justify-content-around mt-4">
                            <div className="d-flex flex-column align-items-center">
                                <small className="text-muted">나의 글</small>
                                <h6>0</h6>
                            </div>
                            <div className="d-flex flex-column align-items-center">
                                <small className="text-muted">나의 댓글</small>
                                <h6>0</h6>
                            </div>
                        </div>
                    </Card>
                    <div className="col-6 d-flex align-items-center">
                        <ListComponent variant="elevated" className="rounded">
                            <ListComponent.Item
                                primary="나의 글"
                                secondary="내가 작성한 글 보기"
                                icon="📋"
                                selected={selectedType === "posts"}
                                onClick={()=>handleSelectedType("posts")}
                                className="pt-3"
                            />
                            <ListComponent.Item
                                primary="나의 댓글"
                                secondary="내가 작성한 댓글 보기"
                                icon="📋"
                                selected={selectedType === "comments"}
                                onClick={()=>handleSelectedType("comments")}
                                className="pt-3"
                            />
                        </ListComponent>
                    </div>
                </div>
                <div className="pt-3">
                    {renderPosts(selectedType)}
                </div>
            </div>
        </div>
    </>
}