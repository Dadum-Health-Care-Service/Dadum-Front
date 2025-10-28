import { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useApi } from "../utils/api/useApi";
import { useModal } from "./ModalContext";

export const LoginViewContext = createContext();

export const useLoginView = () => useContext(LoginViewContext);

export const LoginViewProvider = ({children})=>{
    const { user }=useContext(AuthContext);
    const { POST } = useApi();
    const { showBasicModal, showLoadingModal, closeModal }=useModal();

    const [view, setView] = useState('login');

    const [currentLoginInfo, setCurrentLoginInfo] = useState({id:"", pw:""});

    const globalSetLoginView = (newView) => {
        if(newView === 'passwordless'){
            if(!user || !user.email){
                console.log('user정보 없음');
                showBasicModal('사용자 정보가 없어 패스워드리스 등록을 시작할 수 없습니다','패스워드리스 등록');
                return;
            }
            const handlePasswordlessRegister = async () => {
                await POST(
                    "/join",
                    currentLoginInfo,
                    false,
                    "passwordless"
                ).then(async (res) => {
                    setView("passwordless");
                })
                //setView("passwordless");
            };

            try{
                handlePasswordlessRegister();
            }catch(e){
                console.log(e);
                showBasicModal('패스워드리스 등록에 실패하였습니다','패스워드리스 등록');
            }
 
        } else {
            setCurrentLoginInfo({id:"",pw:""});
            setView(newView);
        }

    };

    return (
        <LoginViewContext.Provider value={{view, globalSetLoginView, setCurrentLoginInfo}}>
            {children}
        </LoginViewContext.Provider>
    );
};