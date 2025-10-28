import { createContext, useContext, useState } from "react";
import { AuthContext } from "./AuthContext";
import { useApi } from "../utils/api/useApi";
import { useModal } from "./ModalContext";

export const LoginViewContext = createContext();

export const useLoginView = () => useContext(LoginViewContext);

export const LoginViewProvider = ({children})=>{
    const { user }=useContext(AuthContext);
    const { GET, POST } = useApi();
    const { showBasicModal, showLoadingModal, closeModal }=useModal();

    const [view, setView] = useState('login');

    const [currentLoginInfo, setCurrentLoginInfo] = useState({id:"", pw:""});

    const globalSetLoginView = async (newView) => {
        if(newView === 'passwordless'){
            if(!user || !user.email){
                console.log('user정보 없음');
                showBasicModal('사용자 정보가 없어 패스워드리스 등록을 시작할 수 없습니다','패스워드리스 등록');
                return;
            }
            
            try{
                const res = await GET(`/users/email/${user.email}`, {}, false);
                const id = res.data.email;
                const usersName = res.data.usersName;

                showLoadingModal('패스워드리스 등록 화면으로 이동중...','패스워드리스 등록','로딩이 완료되면 자동으로 닫힙니다. 잠시만 기다려 주세요.',);
                
                const res2 = await POST('/users/send/password',{'email':id, 'usersName':usersName});
                const pw = res2.data;
                
                closeModal();

                setCurrentLoginInfo({id:id,pw:pw});
                setView('passwordless');

            } catch(e){
                console.log('ID/PW 정보를 가져오는 중 오류 발생:',e);
                showBasicModal('사용자 정보를 가져오는 중 오류가 발생하였습니다','패스워드리스 등록');
                setView('login');
            } 
        } else {
            setCurrentLoginInfo({id:"",pw:""});
            setView(newView);
        }

    };

    return (
        <LoginViewContext.Provider value={{view, setView: globalSetLoginView, currentLoginInfo}}>
            {children}
        </LoginViewContext.Provider>
    );
};