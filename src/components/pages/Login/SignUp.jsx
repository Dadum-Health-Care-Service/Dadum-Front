import { useNavigate } from "react-router-dom";
import { useModal } from "../../../context/ModalContext";
import { useState } from "react";
import FormComponent from "../../common/FormComponent";
import InputComponent from "../../common/InputComponent";
import ButtonComponent from "../../common/ButtonComponent";
import { useApi } from "../../../utils/api/useApi";
import styles from "./SignUp.module.css";

export default function SignUp(){
    const { GET, POST }=useApi();
    const {showBasicModal}=useModal();
    const navigate = useNavigate();
    const [formData,setFormData]=useState({
        email:"",
        password:"",
        checkPassword:"",
        name:"",
        nickName:"",
        phoneNum:"",
        gender:false,
        age:"",
        height:"",
        weight:""
    })
    const [errors, setErrors]=useState({});
    const [checkEmail,setCheckEmail]=useState(false);
    const [phoneNum, setPhoneNum]=useState({
        phoneNum1:"",
        phoneNum2:"",
        phoneNum3:""
    });

    const handleReset =()=>{
        setFormData({
            email:"",
            password:"",
            checkPassword:"",
            name:"",
            nickName:"",
            phoneNum:"",
            gender:false,
            age:"",
            height:"",
            weight:""
        });

        setPhoneNum({
            phoneNum1:"",
            phoneNum2:"",
            phoneNum3:"",
        });
        
        if(errors){
            setErrors({});
        }
    };

    const inputClasses = [
        styles["input-component"],
        styles["medium"],
        styles["outlined"],
        (errors.phoneNum1 || errors.phoneNum2 || errors.phoneNum3) ? styles["error"] : "",
    ]
        .filter(Boolean)
        .join(" ");

    const handlePhoneNumChange = (field)=>(e)=>{
        setPhoneNum((prev)=>({
            ...prev,
            [field]:e.target.value,
        }));

        if(errors[field]){
            setErrors((prev)=>({
                ...prev,
                [field]:"",
            }));
        };
    };

    const handleChange =(field)=> (e)=>{
        
        setFormData((prev)=>({
            ...prev,
            [field]:e.target.value,
        }));

        //유효성 체크 메세지 초기화
        if(errors[field]){
            setErrors((prev)=>({
                ...prev,
                [field]:"",
            }));
        }
    };

    const handleEmailCheck =async (e) =>{
        e.preventDefault();
        if(!formData.email) {
            setErrors((prev)=>({...prev,email:"이메일 입력 후 중복확인을 눌러주세요"}));
            return;
        }

        if(!errors.email){
            try{
                const res = await GET(`/users/email/${formData.email}`,{},false)
                showBasicModal('이미 존재하는 이메일 입니다','이메일 중복 확인');
                setFormData((prev)=>({...prev,email:""}));
            }catch(error){
                console.log(error);
                if(error?.response?.status===400) {
                    showBasicModal('사용 가능한 이메일 입니다','이메일 중복 확인');
                    setCheckEmail(true);
                }
                else {
                    showBasicModal('이메일 중복 조회 중 오류가 발생하였습니다','네트워크 에러');
                    setFormData((prev)=>({...prev,email:""}));
                }
            }
        }
    }
    
    const handleGenderChange = e =>{
        if(e.target.value==='true'){
            setFormData((prev)=>({
                ...prev,
                gender:true,
            }));
        } else{
            setFormData((prev)=>({
                ...prev,
                gender:false,
            }));
        }

    };

    const handleSignup =async (e) =>{
        e.preventDefault();

        const newErrors = {};
        if(!formData.email) newErrors.email = "이메일은 필수 입력값입니다";
        else if(!checkEmail) {
            newErrors.email = "이메일 중복여부를 확인해주세요";
            setFormData((prev)=>({...prev,email:""}));
        }
        if(!formData.password) newErrors.password = "비밀번호는 필수 입력값입니다";
        if(!formData.checkPassword) newErrors.checkPassword = "비밀번호 확인은 필수 입력값입니다";
        else if(formData.password != formData.checkPassword) newErrors.checkPassword = "비밀번호가 일치하지 않습니다";
        if(!formData.name) newErrors.name='이름은 필수 입력값입니다';
        if(!formData.nickName) newErrors.nickName='닉네임은 필수 입력값입니다';
        if(!phoneNum.phoneNum1) newErrors.phoneNum1='전화번호는 필수 입력값입니다';
        else if(!phoneNum.phoneNum2) newErrors.phoneNum2='전화번호를 전부 입력해주세요';
        else if(!phoneNum.phoneNum3) newErrors.phoneNum3='전화번호를 전부 입력해주세요';

        setErrors(newErrors);

        if(Object.keys(newErrors).length===0){
            try{
                const res = await POST(
                    '/users/signup',{
                        usersName: formData.name,
                        email:formData.email,
                        profileImg: '/img/userAvatar.png',
                        nickName: formData.nickName,
                        phoneNum:phoneNum.phoneNum1+phoneNum.phoneNum2+phoneNum.phoneNum3,
                        biosDto:{
                            gender:formData.gender,
                            age:formData.age,
                            height:formData.height,
                            weight:formData.weight,
                        },
                        authDto:{
                            password:formData.checkPassword
                        },
                    },false);
                showBasicModal('회원가입이 완료 되었습니다. 로그인 페이지로 이동합니다','회원가입');
                navigate('/login');
            }catch(error){
                console.log(error);
                showBasicModal('회원가입에 실패하였습니다.','회원가입');
            }finally{
                handleReset();
            }
        }else{
            window.scrollTo(0,0);
        }
    }

 
    return <>
        <div className="py-5" style={{backgroundColor:"#ffffff"}}>
            <div className="login-header">
                <h1 className="login-title">🎯 다듬</h1>
                <p className="login-subtitle">루틴을 관리하고 자세를 분석해보세요</p>
            </div>
            <div style={{padding:"0 4rem"}}>
                <FormComponent
                    title="회원가입"
                    subtitle="몇 가지 정보만 입력하면 바로 시작할 수 있어요."
                    onSubmit={handleSignup}
                    onReset={handleReset}
                    variant="elevated"
                    size="large"
                    layout="vertical"
                >
                    <FormComponent.Field label="이메일" required className="mb-3">
                        <div className="d-flex justify-content-between align-items-start">
                            <InputComponent
                                type="email"
                                placeholder="사용할 이메일을 입력하세요"
                                value={formData.email}
                                onChange={handleChange("email")}
                                required
                                variant="outlined"
                                size="medium"
                                error={errors.email}
                                className="col-9 mr-2"
                            />
                            <ButtonComponent 
                                className="col-3"
                                onClick={handleEmailCheck}
                            >
                                중복 확인
                            </ButtonComponent>
                        </div>
                    </FormComponent.Field>

                    <FormComponent.Field label="비밀번호" required className="mb-3">
                        <InputComponent
                            type="password"
                            placeholder="비밀번호를 입력하세요"
                            value={formData.password}
                            onChange={handleChange("password")}
                            required
                            variant="outlined"
                            error={errors.password}
                            size="medium"
                        />
                    </FormComponent.Field>

                    <FormComponent.Field label="비밀번호 확인" required className="mb-3">
                        <InputComponent
                            type="password"
                            placeholder="비밀번호를 다시 한번 입력하세요"
                            value={formData.checkPassword}
                            onChange={handleChange("checkPassword")}
                            required
                            variant="outlined"
                            size="medium"
                            error={errors.checkPassword}
                        />
                    </FormComponent.Field>

                    <FormComponent.Field label="이름" required className="mb-3">
                        <InputComponent
                            placeholder="이름을 입력하세요"
                            value={formData.name}
                            onChange={handleChange("name")}
                            required
                            variant="outlined"
                            size="medium"
                            error={errors.name}
                        />
                    </FormComponent.Field>

                    <FormComponent.Field label="닉네임" required className="mb-3">
                        <InputComponent
                            placeholder="닉네임을 입력하세요"
                            value={formData.nickName}
                            onChange={handleChange("nickName")}
                            required
                            variant="outlined"
                            error={errors.nickName}
                            size="medium"
                        />
                    </FormComponent.Field>

                    <FormComponent.Field label="전화번호" required className="mb-3">
                        <div className={inputClasses}>
                            <div className={styles["input-wrapper"]}>    
                                <input 
                                    type="number"
                                    className={styles["input-field"]}
                                    placeholder="010"
                                    value={phoneNum.phoneNum1}
                                    onChange={handlePhoneNumChange("phoneNum1")}
                                    required
                                />
                                <span>-</span>
                                <input 
                                    type="number"
                                    className={styles["input-field"]}
                                    placeholder="전화번호를"
                                    value={phoneNum.phoneNum2}
                                    onChange={handlePhoneNumChange("phoneNum2")}
                                    required
                                />
                                <span>-</span>
                                <input 
                                    type="number"
                                    className={styles["input-field"]}
                                    placeholder="입력하세요"
                                    value={phoneNum.phoneNum3}
                                    onChange={handlePhoneNumChange("phoneNum3")}
                                    required
                                />
                            </div>
                            <div className={styles["input-helper"]}>
                                {(errors.phoneNum1 || errors.phoneNum2 || errors.phoneNum3) ? (
                                    <span className={styles["input-error-text"]}>전화번호는 필수 입력값입니다</span>
                                ) : (
                                    <span className={styles["input-helper-text"]}>전화번호는 숫자만 입력해주세요</span>
                                )}
                            </div>
                        </div>
                    </FormComponent.Field>

                    <FormComponent.Section title="선택 정보" className="my-5">
                        <FormComponent.Field label="성별" className="mb-3">
                            <div className="d-flex justify-content-around">
                                <div className="form-check">
                                    <input
                                        className="form-check-input"
                                        type="radio"
                                        name="gender"
                                        id="male"
                                        value="false"
                                        onChange={handleGenderChange}
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
                                        onChange={handleGenderChange}
                                    />
                                    <label className="form-check-label" htmlFor="female">
                                        여자
                                    </label>
                                </div>
                            </div>
                        </FormComponent.Field>

                        <FormComponent.Field label="나이" className="mb-3">
                            <InputComponent
                                type="number"
                                placeholder="나이를 입력하세요"
                                value={formData.age}
                                onChange={(e)=>setFormData((prev)=>({...prev,age:e.target.value}))}
                                variant="outlined"
                                size="medium"
                            />
                        </FormComponent.Field>

                        <FormComponent.Field label="키" className="mb-3">
                            <div className="d-flex">
                                <InputComponent
                                    type="number"
                                    placeholder="키를 입력하세요"
                                    value={formData.height}
                                    onChange={(e)=>setFormData((prev)=>({...prev,height:e.target.value}))}
                                    variant="outlined"
                                    size="medium"
                                    className="col-10"
                                />
                                <span className="fs-6 col-2 p-2">cm</span>
                            </div>
                        </FormComponent.Field>

                        <FormComponent.Field label="몸무게" className="mb-3">
                            <div className="d-flex">
                                <InputComponent
                                    type="number"
                                    placeholder="몸무게를 입력하세요"
                                    value={formData.weight}
                                    onChange={(e)=>setFormData((prev)=>({...prev,weight:e.target.value}))}
                                    variant="outlined"
                                    size="medium"
                                    className="col-10"
                                />
                                <span className="fs-6 col-2 p-2">kg</span>
                            </div>
                        </FormComponent.Field>

                    </FormComponent.Section>

                    <div className="d-flex align-items-center justify-content-center flex-column" style={{gap:"1rem"}}>
                        <ButtonComponent
                            type="submit"
                            variant="primary"
                            size="large"
                            fullWidth
                        >
                            가입하기
                        </ButtonComponent>
                        <ButtonComponent
                            variant="outline-primary"
                            size="large"
                            onClick={()=>navigate('/login')}
                            fullWidth
                        >
                            이미 계정이 있으신가요? 로그인
                        </ButtonComponent>
                    </div>
                </FormComponent>
            </div>
        </div>
    </>
}