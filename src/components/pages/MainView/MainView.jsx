import { useNavigate } from "react-router-dom";
import ButtonComponent from "../../common/ButtonComponent";

export default function MainView(){
    const navigate = useNavigate();

    return <>
        <div className="login-container">
            <div className="login-header">
                <h1 className="login-title">🎯 다듬</h1>
                <p className="login-subtitle">
                    루틴을 관리하고 자세를 분석해보세요
                </p>
            </div>
            <div className="login-form">
                <ButtonComponent
                    variant="primary"
                    size="lg"
                    className="login-button"
                    onClick={()=>navigate('/login')}
                >
                    로그인
                </ButtonComponent>
                <ButtonComponent
                    variant="outline-primary"
                    size="lg"
                    className="signup-button"
                    onClick={()=>navigate('/signup')}
                >
                    회원가입
                </ButtonComponent>
            </div>
        </div>
    </>
}