import React, { useContext, useEffect, useState } from "react";
import { Card, ListGroup, ListGroupItem } from "react-bootstrap";
import { AuthContext } from "../../../context/AuthContext";
import ListComponent from "../../common/ListComponent";
import { Link, useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";

export default function MySocial(){
    const { GET } = useApi();
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
    const [loading, setLoding]=useState(false);

    useEffect(()=>{
        if(!user || !user.usersId) return;
        const fetchUser = async () => {
            try{
                const res = await GET(`/users/${user.usersId}`,{},false);
                setUserData((prev)=>({
                    ...prev,
                    nickName:res.data.nickName,
                    email:res.data.email,
                    profileImg:res.data.profileImg,
                }));
            } catch (err){
                console.log(err);
                showBasicModal("사용자 정보를 가져오는 중 오류가 발생하였습니다.","네트워크 에러");
            };
        };
        fetchUser();
    },[user]);

    useEffect(()=>{
        if(!selectedType || !user || !user.accessToken) return;

        const fetchData = async ()=>{
            setLoding(true);
            if(selectedType === "posts"){
                try{
                    const res = await GET('/posts');
                    setPostData(res.data);
                } catch (err){
                    console.log(err);
                    showBasicModal("내가 작성한 게시글 조회에 실패하였습니다","네트워크 에러");
                }
            } else if (selectedType === "comments"){
                try{
                    const cData = await GET('/comments/list');
                    const comments = cData.data;
                    const commentsWithPostTitle = await Promise.all(
                        comments.map(async comment =>{
                            const postRes = await GET(`/posts/${comment.postId}`);
                            return {...comment,postTitle:postRes.data.postTitle};
                        }),
                    );
                    setCommentData(commentsWithPostTitle);
                } catch (err){
                    console.log(err);
                    showBasicModal("내가 작성한 댓글 조회에 실패하였습니다","네트워크 에러");
                }
            }
            setLoding(false);
        };
        fetchData();
    },[selectedType,user]);

    const handleSelectedType = (type)=>{
        setSelectedType(type);
        console.log("선택된 항목:", type);
    }

    const renderContent = () =>{
        if(loading){
            return <div>로딩 중 ...</div>;
        }
        switch(selectedType){
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
                        <hr className="text-secondary"/>
                        {postData.length > 0 ? (
                            postData.map((post,i)=>{
                                return (
                                    <ListGroup.Item
                                        key={i}
                                        action
                                        onClick={()=>navigate('/')}
                                    >
                                        <div style={{
                                            display:'grid',
                                            gridTemplateColumns:'0.2fr 0.5fr 1fr 0.5fr',
                                            fontSize:'0.9rem'
                                        }}>
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
                            <div className="p-3">작성한 글이 없습니다</div>
                        )}
                    </ListComponent>
                )
            }
            case "comments":{
                return(
                    <ListComponent variant="elevated">
                        <ListComponent.Header>나의 댓글</ListComponent.Header>
                        <div className="list-group list-group-flush border-bottom scrollarea">
                            {commentData.length > 0 ? (
                                commentData.map(comment=>{
                                    return (
                                        <Link
                                            to={`/post/${comment.postId}`}
                                            className="list-group-item list-group-item-action py-3 lh-tight"
                                        >
                                            <div className="d-flex w-100 align-items-center justify-content-between">
                                                <strong className="mb-1">{comment.content}</strong>
                                            </div>
                                            <div className="col-10 mb-1 small text-uppercase">{comment.postTitle}</div>
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="p-3">작성한 댓글이 없습니다</div>
                            )}
                        </div>
                    </ListComponent>
                )
            }
            default :{
                return<></>
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
                                <h6>{postData.length}</h6>
                            </div>
                            <div className="d-flex flex-column align-items-center">
                                <small className="text-muted">나의 댓글</small>
                                <h6>{commentData.length}</h6>
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
                    {renderContent()}
                </div>
            </div>
        </div>
    </>
}