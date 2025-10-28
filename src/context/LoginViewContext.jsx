import { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useModal } from "./ModalContext";

export const LoginViewContext = createContext();

export const useLoginView = () => useContext(LoginViewContext);

export const LoginViewProvider = ({children})=>{
    const { user }=useContext(AuthContext);
    const { showBasicModal }=useModal();

    const [view, setView] = useState('login');

    const [currentLoginInfo, setCurrentLoginInfo] = useState({id:"", pw:""});

    const globalSetLoginView = (newView) => {
        if(newView === 'passwordless'){
            if(!user || !user.email){
                console.log('user정보 없음');
                showBasicModal('사용자 정보가 없어 패스워드리스 등록을 시작할 수 없습니다','패스워드리스 등록');
                return;
            }
            
            setView('passwordless');
        } else {
            setCurrentLoginInfo({id:"",pw:""});
            setView('login');
        }

    };

    const setLoginInfo = (loginInfo) =>{
        if(loginInfo?.id && loginInfo?.pw){
            setCurrentLoginInfo(loginInfo);
        }
    };

    return (
        <LoginViewContext.Provider value={{view, setView:globalSetLoginView, currentLoginInfo, setLoginInfo}}>
            {children}
        </LoginViewContext.Provider>
    );
};