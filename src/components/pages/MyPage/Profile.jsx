import { useContext, useEffect, useRef, useState } from "react";
import ButtonComponent from "../../common/ButtonComponent";
import ContainerComponent from "../../common/ContainerComponent";
import { AuthContext } from "../../../context/AuthContext";
import axios from "axios";
import InputComponent from "../../common/InputComponent";
import { useModal } from "../../../context/ModalContext";

export default function Profile(){
    
    const { user } = useContext(AuthContext);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState(null);
    const [clickEdit,setClickEdit]=useState(false);
    const [errors, setErrors]=useState({});
    const { showBasicModal, showConfirmModal } = useModal();

    // 초기 프로필 데이터 설정
    const [profile, setProfile] = useState({
        name: '',
        nickName: '',
        email: user?.email || '',
        profileImg: '/img/userAvatar.png', //초기데이터 기본 프로필이미지로 설정
        phoneNum: '',
        role: 'USER', //초기 역할상태 USER로 설정
        age: '',
        gender: '',
        height: '',
        weight: '',
        regDate: '',
    });

    //프로필 수정 시 저장 버튼을 누르기 전에 임시로 데이터 저장
    const [inputs, setInputs] = useState({});

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
            showBasicModal("사용자 정보를 찾을 수 없습니다", "네트워크 에러")
            setLoading(false);
            return;
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
                    role: getUser.role || 'USER',
                    age: getBio?.age || 0,
                    gender: getBio?.gender !== undefined ? getBio.gender : null,
                    height: getBio?.height || 0,
                    weight: getBio?.weight || 0,
                    regDate: getUser.regDate ? getUser.regDate.substring(0, 10) : '',
                }));
                setInputs(prev=>({
                    name: profile.name,
                    nickName: profile.nickName,
                    phoneNum: profile.phoneNum,
                    role: profile.role,
                    profileImg: profile.profileImg,
                    age: profile.age,
                    gender: profile.gender,
                    height: profile.height,
                    weight: profile.weight,
                }));
            } catch (e) {
                console.log(e.response?.data, e);
                setError('프로필을 읽어오는 중 오류가 발생하였습니다');
                showBasicModal("프로필을 읽어오는 중 오류가 발생하였습니다","네트워크 에러")
            } finally {
                setLoading(false);
            }
        };
        
        fetchProfile();
    }, [user?.usersId,clickEdit]);

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

    //이미지 인풋폼을 통해서 업로드 제어
    const handleImageChange = e =>{
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () =>{
                console.log('image changed');
                setInputs(prev=>{
                    return { ...prev, profileImg: reader.result};
                }); //base64문자열 저장
            };
            reader.readAsDataURL(file);
        }
    };

    
    const handleInputChange = (field) => (e) =>{
        if(field==='gender'){
            if(e.target.value==='true') {
                setInputs((prev)=>({
                    ...prev,
                    gender: true
                }));
            }
            else {
                setInputs((prev)=>({
                    ...prev,
                    gender: false
                }));
            }
        }
        else {
            setInputs((prev)=>({
                ...prev,
                [field]: e.target.value,
            }));
        }

        if(errors[field]){
            setErrors((prev)=>({
                ...prev,
                [field]:"",
            }));
        }
    };

    const handleSubmit = async () =>{
        const newErrors = {};
        if(!inputs.name) newErrors.name = "이름은 필수 입력값입니다.";
        if(!inputs.nickName) newErrors.nickName = "닉네임은 필수 입력값입니다.";
        if(!inputs.phoneNum) newErrors.phoneNum = "전화번호는 필수 입력값입니다.";

        setErrors(newErrors);
        if(Object.keys(newErrors).length === 0){
            try{
                setLoading(true);
                setError(null);
                const res = await axios.put(
                    `http://localhost:8080/api/v1/users/update/${user.usersId}`,
                    {
                        usersName: inputs.name,
                        nickName: inputs.nickName,
                        email: profile.email,
                        profileImg: inputs.profileImg,
                        phoneNum: inputs.phoneNum,
                        role: profile.role,
                        biosDto: {
                            gender: inputs.gender,
                            age: inputs.age,
                            height: inputs.height,
                            weight: inputs.weight,
                        },
                    },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                        },
                    },
                );
                console.log(res);
                setClickEdit(false);
            }catch(error){
                console.log(error);
                setError('프로필 수정 중 오류가 발생하였습니다');
                showConfirmModal('프로필 수정 중 오류가 발생하였습니다',"네트워크 에러","",()=>{setClickEdit(false)})
            }finally {
                setLoading(false);
            };
        };
    };

    return<>
        { !clickEdit ?
            (<ContainerComponent variant="filled" className="p-4">
                <ContainerComponent variant="outlined" className="profile-head mb-3">
                    <div className="d-flex flex-column align-items-center text-center px-4">
                        <img
                            className="rounded-circle mt-5 mb-3"
                            width="150px"
                            src={profile.profileImg || "/img/userAvatar.png"}
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
                    <ButtonComponent variant="primary" size="medium" className="fs-6" onClick={()=>setClickEdit(true)}>
                        수정
                    </ButtonComponent>
                </div>
            </ContainerComponent>)
        :
            (<ContainerComponent variant="filled" className="p-4">
                <ContainerComponent variant="outlined" className="profile-head mb-3">
                    <div className="d-flex flex-column align-items-center text-center px-4">
                        <img
                            className="rounded-circle mt-5 mb-3"
                            width="150px"
                            src={inputs.profileImg}
                        />
                        <div className="d-flex align-items-end">
                            <InputComponent
                                label="프로필 사진"
                                type="file"
                                accept="image/*"
                                size="small"
                                onChange={handleImageChange}
                            />
                            <ButtonComponent 
                                variant="secondary" 
                                size="small"
                                onClick={()=>{
                                    setInputs(prev=>{
                                        return { ...prev, profileImg: profile.profileImg};
                                    });
                                }}
                                className="m-2 h-75"
                            >x</ButtonComponent>
                        </div>
                    </div>
                    <div className="d-flex flex-column p-3">    
                        <InputComponent
                            label="이름"
                            placeholder="이름을 입력하세요"
                            value={profile.name}
                            onChange={handleInputChange("name")}
                            required
                            error={errors.name}
                            className="mb-3"
                        />
                        <InputComponent
                            label="닉네임"
                            placeholder="닉네임을 입력하세요"
                            value={profile.nickName}
                            onChange={handleInputChange("nickName")}
                            required
                            error={errors.nickName}
                            className="mb-3"
                        />
                        <InputComponent
                            label="아이디"
                            placeholder="아이디를 입력하세요"
                            value={profile.email}
                            required
                            disabled
                            className="mb-3"
                            helperText="아이디는 수정할 수 없습니다"
                        />
                    </div>
                </ContainerComponent>
                <ContainerComponent variant="outlined" className="profile-info mb-3">
                    <div className="d-flex flex-column p-3">    
                        <InputComponent
                            label="전화번호"
                            placeholder="전화번호를 입력하세요"
                            value={profile.phoneNum}
                            onChange={handleInputChange("phoneNum")}
                            className="mb-3"
                            required
                            error={errors.phoneNum}
                            helperText="전화번호는 숫자만 입력해주세요"
                        />
                        <InputComponent
                            label="가입일"
                            placeholder="가입일을 입력하세요"
                            value={profile.regDate}
                            disabled
                            required
                            className="mb-3"
                            helperText="가입일은 수정할 수 없습니다"
                        />
                    </div>
                </ContainerComponent>
                <ContainerComponent variant="outlined" className="body-info">
                    <div className="d-flex flex-column p-3"> 
                        <InputComponent
                            label="나이"
                            placeholder="나이를 입력하세요"
                            value={profile.age}
                            onChange={handleInputChange("age")}
                            className="mb-3"
                        />
                        <label className="labels">성별</label>
                        <div className="d-flex justify-content-around">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gender"
                                    id="male"
                                    value="false"
                                    checked={inputs.gender === false}
                                    onChange={handleInputChange("gender")}
                                />
                                <label className="form-check-label" htmlFor="male">
                                    남자
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="gender"
                                    id="female"
                                    value="true"
                                    checked={inputs.gender === true}
                                    onChange={handleInputChange("gender")}
                                />
                                <label className="form-check-label" htmlFor="female">
                                    여자
                                </label>
                            </div>
                        </div>
                        <InputComponent
                            label="키"
                            placeholder="키를 입력하세요"
                            value={profile.height}
                            onChange={handleInputChange("height")}
                            className="mb-3"
                        />
                        <InputComponent
                            label="몸무게"
                            placeholder="몸무게를 입력하세요"
                            value={profile.weight}
                            onChange={handleInputChange("weight")}
                            className="mb-3"
                        />
                    </div>
                </ContainerComponent>
                <div className="d-flex pt-3 justify-content-center">
                    <ButtonComponent variant="primary" size="medium" className="fs-6" onClick={()=>handleSubmit()}>
                        저장
                    </ButtonComponent>
                </div>
            </ContainerComponent>)
        }
    </>
}