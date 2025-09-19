import { createContext, useReducer } from "react";

//초기값 user는 로컬스토리지에 'user'라는 키로 저장된 데이터가 있으면 읽어오고 없으면 null저장
const initialState = {user: JSON.parse(localStorage.getItem('user'))||null};

function authReducer(state, action){
    switch(action.type){
        case 'LOGIN':
            //로그인인 경우 로컬스토리지에 user정보 저장
            localStorage.setItem('user', JSON.stringify(action.user));
            return {...state, user:action.user};
        case 'LOGOUT':
            //로그아웃인 경우 로컬스토리지에서 user정보 지우기
            localStorage.removeItem('user');
            return {...state, user:null};
        default:
            return state;
    };
};

export const AuthContext = createContext();

export function AuthProvider({children}){
    const [state, dispatch]=useReducer(authReducer, initialState);

    return <>
        <AuthContext.Provider value={{user: state.user, dispatch}}>
            {children}
        </AuthContext.Provider>
    </>
};
