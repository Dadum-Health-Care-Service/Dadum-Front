import { useContext, useEffect, useState } from "react";
import ButtonComponent from "../../common/ButtonComponent";
import ContainerComponent from "../../common/ContainerComponent";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import ModalComponent from "../../common/ModalComponent";

export default function Profile(){
    
    const { user } = useContext(AuthContext);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);

    // 초기 프로필 데이터 설정
    const [profile, setProfile] = useState({
        name: '',
        nickName: '',
        email: user?.email || '',
        profileImg: '/img/userAvatar.png', //초기데이터 기본 프로필이미지로 설정
        phoneNum: '',
        age: '',
        gender: '',
        height: '',
        weight: '',
        regDate: '',
    });

    // 업적 데이터 (임시)
    const [unlockedAchievements] = useState([
        { id: 1, name: '첫 운동', icon: '🥇' },
        { id: 2, name: '연속 7일', icon: '🔥' },
        { id: 3, name: '근력 향상', icon: '💪' },
        { id: 4, name: '목표 달성', icon: '🎯' },
    ]);

    //최초렌더링 및 userId가 변하는 경우에 따라 user정보 네트워크로부터 읽어오기
    useEffect(() => {
        
        if (!user || !user.usersId) {
            setError('사용자 정보를 찾을 수 없습니다.');
            setLoading(false);
            return;
        }else{ //user.usersId가 2로 저장되어서 있어서 액시오스 에러발생하는것을 막기위한 임시 조치 
            //로그인 로직이 정상화되면 else절을 삭제할것!! 
            user.usersId = 2
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const res = await axios.get(`http://localhost:8080/api/v1/users/${user.usersId}`);
                const getUser = res.data;
                const getBio = res.data.biosDto;
                
                //읽어온 정보로 프로필 state설정
                setProfile(prev => ({
                    ...prev,
                    name: getUser.usersName || '',
                    nickName: getUser.nickName || '',
                    profileImg: getUser.profileImg || '/img/userAvatar.png',
                    phoneNum: getUser.phoneNum || '',
                    age: getBio?.age || 0,
                    gender: getBio?.gender !== undefined ? getBio.gender : null,
                    height: getBio?.height || 0,
                    weight: getBio?.weight || 0,
                    regDate: getUser.regDate ? getUser.regDate.substring(0, 10) : '',
                }));
            } catch (e) {
                console.log(e.response?.data, e);
                setError('프로필을 읽어오는 중 오류가 발생하였습니다');
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, [user?.usersId]);

    // 로딩 중일 때
    if (loading) {
        return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
            </div>
        </div>
        );
    }

    // 에러가 있을 때
    if (error) {
        return (
        <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="alert alert-danger" role="alert">
            {error}
            </div>
        </div>
        );
    }

    return<>
        <ContainerComponent variant="filled" className="p-4">
            <ContainerComponent variant="outlined" className="profile-head mb-3">
                <div className="d-flex flex-column align-items-center text-center px-4">
                    <img
                        className="rounded-circle mt-5 mb-3"
                        width="150px"
                        src="/img/userAvatar.png"
                    />
                </div>
                <div className="d-flex flex-column p-3">    
                    <div>이름</div>
                    <div className="font-weight-bold fs-1 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px"
                    }}>{profile.name || '이름 없음'}</div>
                    <div>닉네임</div>
                    <div className="font-weight-bold fs-3 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px"
                    }}>{profile.nickName || '닉네임 없음'}</div>
                    <div>아이디</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>{profile.email || '이메일 없음'}</div>
                </div>
            </ContainerComponent>
            <ContainerComponent variant="outlined" className="profile-info mb-3">
                <div className="d-flex flex-column p-3">    
                    <div>전화번호</div>
                    {
                        profile.phoneNum && profile.phoneNum.trim().length === 11 ? (
                            <div className="text-muted fs-5 mb-3 text-center" style={{
                                background: "#f8fafc",
                                borderRadius: "15px",
                                height: "30px"
                            }}>{profile.phoneNum.substring(0, 3)}-{profile.phoneNum.substring(3, 7)}-
                                {profile.phoneNum.substring(7, profile.phoneNum.length)}
                            </div>
                        ) : (
                            <div className="text-muted fs-5 mb-3 text-center" style={{
                                background: "#f8fafc",
                                borderRadius: "15px",
                                height: "30px"
                            }}>{profile.phoneNum || '전화번호 정보가 없습니다'}
                            </div>
                        )
                    }
                    <div>가입일</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>{profile.regDate || '가입일 정보가 없습니다'}</div>
                </div>
            </ContainerComponent>
            <ContainerComponent variant="outlined" className="body-info">
                <div className="d-flex flex-column p-3">    
                    <div>나이</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>
                        {
                            //선택정보가 없는 경우 정보가 없다고 표시
                            profile.age && profile.age !== 0 ? (
                                <span>{profile.age}세</span>
                            ) : (
                                <span>나이 정보가 없습니다.</span>
                            )
                        }
                    </div>
                    <div>성별</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>{profile.gender === false ? '남자' : profile.gender === true ? '여자' : '성별 정보가 없습니다'}
                    </div>
                    <div>키</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>
                        {profile.height && profile.height !== 0 ? (
                            <span>{profile.height}cm</span>
                            ) : (
                            <span>키 정보가 없습니다.</span>
                        )}
                    </div>
                    <div>몸무게</div>
                    <div className="text-muted fs-5 mb-3 text-center" style={{
                        background: "#f8fafc",
                        borderRadius: "15px",
                        height: "30px"
                    }}>
                        {profile.weight && profile.weight !== 0 ? (
                            <span>{profile.weight}kg</span>
                            ) : (
                            <span>몸무게 정보가 없습니다.</span>
                        )}
                    </div>
                </div>
            </ContainerComponent>
            <div className="d-flex pt-3 justify-content-center">
                <ButtonComponent variant="primary" size="medium" className="fs-5">
                    수정
                </ButtonComponent>
            </div>
        </ContainerComponent>
    </>
}