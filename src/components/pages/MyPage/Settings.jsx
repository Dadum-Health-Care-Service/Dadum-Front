import { useContext, useRef, useState } from "react";
import HeaderComponent from "../../common/HeaderComponent";
import ContainerComponent from "../../common/ContainerComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import axios from "axios";
import { AuthContext } from "../../../context/AuthContext";
import { useModal } from "../../../context/ModalContext";

export default function Settings(){
    //유저 정보 읽어오기
    const { user, dispatch } = useContext(AuthContext);
    //전역모달 사용
    const { showBasicModal, showConfirmModal } = useModal();
    //설정의 네비게이션헤더탭 제어용 (비밀번호 변경, 회원 탈퇴)
    const [activeHeaderMenu,setActiveHeaderMenu]=useState("updatePassword");
    const handleHeaderMenuClick = (menuId)=>{
        setActiveHeaderMenu(menuId);
        console.log("선택된 설정 헤더 메뉴:",menuId);
    }

    //유효성 체크를 위한 state
    const [errors, setErrors]=useState({});
    //인풋을 제어하고 저장하는 state
    const [passwords,setPasswords]=useState({
        existPW:'',
        currentPW:'',
        newPW:'',
        newPWcheck:''
    });

    //인풋 값 전부 초기화 하기 위한 함수
    const handleReset = ()=>{
        setPasswords({existPW:'',currentPW:'',newPW:'',newPWcheck:''});
        if(errors){
            setErrors({});
        };
    };

    //인풋 값 변경 시 passwords에 저장 및 에러 초기화
    const handleChange =(field)=>(e)=>{
        setPasswords((prev)=>({
            ...prev,
            [field]:e.target.value
        }));
    
        if(errors[field]){
            setErrors((prev)=>({
                ...prev,
                [field]:"",
            }));
        }
    }

    //회원 탈퇴 확인 버튼 제어용
    const handleWithdrawalSubmit = async (e)=>{
        e.preventDefault();
        let res1='';

        //인풋 유효성 체크
        const newErrors = {};
        if(!passwords.existPW) newErrors.existPW = "현재 비밀번호를 반드시 입력해주세요.";
        setErrors(newErrors);
        
        //유효성 체크에 통과하면 진행
        if(Object.keys(newErrors).length === 0){
            //입력한 비밀번호가 맞는지 확인
            try {
                res1 = await axios.post(
                    'http://localhost:8080/api/v1/users/auth/password/check',
                    { password: passwords.existPW },
                    { withCredentials: true, headers: { Authorization: `Bearer ${user.accessToken}` } },
                );
            } catch (err1) { 
                //오류 발생 시 모달 띄우기
                console.log('비밀번호 확인 호출 중 오류 발생: ',err1);

                //오류 종류에 따라서 2종류 모달 띄우기
                if(err1?.status===400){
                    showBasicModal("비밀번호가 일치하지 않습니다.","비밀번호 오류");
                }else{
                    showBasicModal("비밀번호 확인 중 오류가 발생하였습니다.","네트워크 에러")
                }
                return;
            } finally {
                //오류 발생 여부와 상관없이 비밀번호 확인 후 저장된 입력값 초기화
                handleReset();
            }
        
            //회원 탈퇴하는 메소드
            const confirmWithdrawal = async ()=>{
                try{
                    const res2 = await axios.delete(
                        `http://localhost:8080/api/v1/users/delete/${res1.data.usersId}`,
                        {
                            withCredentials: true,
                            headers: {
                                Authorization: `Bearer ${user.accessToken}`,
                            },
                        },
                    );
                    //탈퇴 확인 모달 띄우고 로그아웃 처리
                    showBasicModal('탈퇴되었습니다',"회원 탈퇴");
                    dispatch({type:'LOGOUT'});
                } catch(err2){
                    console.log('회원 탈퇴 중 오류 발생',err2);
                    showBasicModal('회원 탈퇴에 실패하였습니다','네트워크 에러');
                } 
            };

            //입력한 비밀번호가 맞으면 회원 탈퇴 모달 띄우기 -> 확인 눌렀을 경우 탈퇴처리
            showConfirmModal("정말 탈퇴하시겠습니까?","회원 탈퇴","탈퇴는 취소 할 수 없습니다",confirmWithdrawal)
        }
    };

    //비밀번호 변경 버튼 제어용
    const handleUpdateSubmit = async (e)=>{
        e.preventDefault();
        let res1='';
        
        //인풋 유효성 체크
        const newErrors = {};
        if(!passwords.currentPW) newErrors.currentPW = "현재 비밀번호를 반드시 입력해주세요.";
        else if(!passwords.newPW) newErrors.newPW = "새 비밀번호를 반드시 입력해주세요.";
        else if(passwords.newPW == passwords.currentPW) newErrors.newPW = "같은 비밀번호로는 변경할 수 없습니다";
        else if(!passwords.newPWcheck) newErrors.newPWcheck = "새 비밀번호 확인을 반드시 입력해주세요.";
        else if(passwords.newPW != passwords.newPWcheck) newErrors.newPWcheck = "비밀번호가 일치하지 않습니다";
        setErrors(newErrors);

        //유효성 체크 통과시 비밀번호 변경 진행
        if(Object.keys(newErrors).length === 0){
            //입력한 현재 비밀번호가 맞는지 확인
            try {
                res1 = await axios.post(
                    'http://localhost:8080/api/v1/users/auth/password/check',
                    { password: passwords.currentPW },
                    { withCredentials: true, headers: { Authorization: `Bearer ${user.accessToken}` } },
                );
                console.log(res1)
            } catch (err1) {
                console.log('비밀번호 확인 호출 중 오류 발생: ',err1);
                //비밀번호 확인 중 오류가 발생하면 저장된 입력값 초기화
                handleReset();
                //오류 종류에 따라 모달 다르게 띄우기
                if(err1?.status===400){
                    showBasicModal("비밀번호가 일치하지 않습니다.","비밀번호 오류");
                }else{
                    showBasicModal("비밀번호 확인 중 오류가 발생하였습니다.","네트워크 에러")
                }
                return;
            }
            //비밀번호가 맞다면 변경 진행
            try{
                const res2 = await axios.put(
                    'http://localhost:8080/api/v1/users/auth/password/update',
                    {
                        originPassword: passwords.currentPW,
                        newPassword: passwords.newPWcheck,
                    },
                    {
                        withCredentials: true,
                        headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                        },
                    },
                );
                //알림모달 띄우고 로그아웃 처리
                showBasicModal('비밀번호가 변경되었습니다. 다시 로그인 해 주세요.','비밀번호 변경');
                dispatch({type:'LOGOUT'});
            } catch (err2){
                console.log("비밀번호 변경 오류 발생:",err2);
                showBasicModal('비밀번호 변경에 실패하였습니다','네트워크 에러')
            } finally{
                //비밀번호 변경 성공 여부에 관련없이 저장된 입력값 초기화
                handleReset();
            }
        };
    }

    //settings 탭에 따라 비밀번호 변경/회원 탈퇴 렌더링
    const renderSettingPages = (menuId)=>{
            switch(menuId){
                //회원 탈퇴
                case "withdrawalUser": {
                    return (
                        <ContainerComponent variant="filled" size="small" className="p-5">
                            <InputComponent
                                label="현재 비밀번호"
                                placeholder="현재 비밀번호를 입력해주세요"
                                type="password"
                                onChange={handleChange("existPW")}
                                value={passwords.existPW}
                                required
                                error={errors.existPW}
                                className="mb-3"
                            />
                            <div className="d-flex justify-content-center">
                                <ButtonComponent 
                                    variant="primary" 
                                    size="small"
                                    onClick={handleWithdrawalSubmit}
                                    className="m-2 h-75"
                                >
                                    확인
                                </ButtonComponent>
                            </div>
                            
                        </ContainerComponent>
                    )
                }
                //비밀번호 변경
                default: {
                    return (
                        <ContainerComponent variant="filled" size="small" >
                            <div style={{padding:"3em 3em 0.5em 3em "}}>
                                <InputComponent
                                    label="현재 비밀번호"
                                    placeholder="현재 비밀번호를 입력해주세요"
                                    type="password"
                                    onChange={handleChange("currentPW")}
                                    value={passwords.currentPW}
                                    required
                                    error={errors.currentPW}
                                    className="mb-3"
                                />
                            </div>
                            <hr className="text-secondary m-3"/>
                            <div style={{padding:"0.5em 3em 2em 3em"}}>
                                <InputComponent
                                    label="새 비밀번호"
                                    placeholder="새 비밀번호를 입력해주세요"
                                    type="password"
                                    onChange={handleChange("newPW")}
                                    value={passwords.newPW}
                                    required
                                    error={errors.newPW}
                                    className="mb-3"
                                />
                                <InputComponent
                                    label="새 비밀번호 확인"
                                    placeholder="새 비밀번호를 입력해주세요"
                                    type="password"
                                    onChange={handleChange("newPWcheck")}
                                    value={passwords.newPWcheck}
                                    required
                                    error={errors.newPWcheck}
                                    className="mb-3 py-2"
                                />
                            </div>
                            <div className="d-flex justify-content-center">
                                <ButtonComponent 
                                    variant="primary" 
                                    size="small"
                                    onClick={handleUpdateSubmit}
                                    className="h-75 mb-5"
                                >
                                    확인
                                </ButtonComponent>
                            </div>
                        </ContainerComponent>
                    )
                }
            }
    }

    return <>
        <ContainerComponent variant="default" className="p-3 mb-5">
            <ContainerComponent size="medium" variant="default" className="mb-3">
                <HeaderComponent variant="filled" size="small" align="center">
                    <HeaderComponent.Navigation>
                        <HeaderComponent.MenuItem
                            active={activeHeaderMenu === "updatePassword"}
                            onClick={()=>handleHeaderMenuClick("updatePassword")}
                        >
                            비밀번호 변경
                        </HeaderComponent.MenuItem>
                        <HeaderComponent.MenuItem
                            active={activeHeaderMenu === "withdrawalUser"}
                            onClick={()=>handleHeaderMenuClick("withdrawalUser")}
                        >
                            회원 탈퇴
                        </HeaderComponent.MenuItem>
                    </HeaderComponent.Navigation>
                </HeaderComponent>
            </ContainerComponent>
            
            <ContainerComponent size="medium" variant="outlined">
                {renderSettingPages(activeHeaderMenu)}
            </ContainerComponent>
        </ContainerComponent>
    </>
}