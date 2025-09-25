import { useState } from "react";
import FormComponent from "../../common/FormComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useApi } from "../../../utils/api/useApi";

export default function FindId(){
    const navigate = useNavigate();
    const { POST }=useApi();
    const { showBasicModal } = useModal();
    const [formData, setFormData] = useState({
        usersName:"",
        phoneNum:"",
    })
    const [isUser,setIsUser]=useState(false);
    const [userData, setUserData] = useState({});
    const [errors,setErrors]=useState({});

    const handleReset = ()=>{
        setFormData({
            usersName:"",
            phoneNum:"",
        });
        if(errors){
            setErrors({});
        }
    };

    const handleChange = (field) => (e)=>{
        setFormData((prev)=>({
            ...prev,
            [field]:e.target.value,
        }));

        if(errors[field]){
            setErrors((prev)=>({
                ...prev,
                [field]:"",
            }));
        }
    };

    const handleSubmit = async (e)=>{
        e.preventDefault();

        const newErrors = {};
        if(!formData.usersName) newErrors.usersName = "반드시 이름을 입력해주세요";
        else if(!formData.phoneNum) newErrors.phoneNum = "반드시 전화번호를 입력해주세요";
        setErrors(newErrors);

        if(Object.keys(newErrors).length===0){
            try{
                const res = await POST('/users/auth/email/find',formData,false);
                setUserData({nickName:res.data.nickName, email:res.data.email});
                setIsUser(true);
            } catch (err) {
                console.log(err);
                showBasicModal("아이디찾기에 실패하였습니다","네트워크 에러");
            }finally{
                handleReset();
            }
        }
    }

    return <>
        <div className="login-container">
            <div className="login-header">
                <h1 className="login-title">🎯 다듬</h1>
                <p className="login-subtitle">루틴을 관리하고 자세를 분석해보세요</p>
            </div>
            <FormComponent
                title="아이디 찾기"
                onSubmit={handleSubmit}
                onReset={handleReset}
                variant="elevated"
                size='large'
                layout='vertical'
                className="w-75 px-3"
            >
                {!isUser ? (<>
                    <FormComponent.Field label="이름" required className="mb-3">
                        <InputComponent 
                            placeholder="가입한 이름을 입력해주세요"
                            value={formData.usersName}
                            onChange={handleChange("usersName")}
                            required
                            variant="outlined"
                            error={errors.usersName}
                            size="medium"
                        />
                    </FormComponent.Field>
                    
                    <FormComponent.Field label="전화번호" required className="mb-5">
                        <InputComponent 
                            placeholder="가입한 전화번호를 입력해주세요"
                            type="number"
                            value={formData.phoneNum}
                            onChange={handleChange("phoneNum")}
                            required
                            variant="outlined"
                            error={errors.phoneNum}
                            size="medium"
                        />
                    </FormComponent.Field>

                    <div className="my-4">
                        <ButtonComponent
                            type="submit"
                            variant="outline-primary"
                            size="large"
                            fullWidth
                            className="my-1"
                        >
                            아이디 찾기
                        </ButtonComponent>
                    </div>
                </>) : (<>
                    <div className="py-5 text-center">
                        <span className="text-bold fs-4 text-secondary">
                            {userData.nickName}
                        </span>
                        <span className="fs-5">님의 아이디는 </span>
                        <span className="text-bold fs-3" style={{color:"#2563eb"}}>
                            {userData.email}
                        </span>
                        <span className="fs-5">입니다.</span>
                    </div>
                </>)}
                <div>
                    <ButtonComponent
                        variant="outline-primary"
                        size="large"
                        onClick={()=>navigate('/findpw')}
                        fullWidth
                        className="my-1"
                    >
                        비밀번호 찾기로 이동
                    </ButtonComponent>
                    <ButtonComponent
                        variant="outline-primary"
                        size="large"
                        onClick={()=>navigate('/login')}
                        fullWidth
                        className="my-1"
                    >
                        로그인 페이지로 이동
                    </ButtonComponent>
                </div>

            </FormComponent>
        </div>
    </>
}