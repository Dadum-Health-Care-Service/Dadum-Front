import { useContext } from "react"
import { AuthContext } from "../../context/AuthContext"
import { DELETE, GET, POST, PUT } from "./api";

export const useApi = () =>{
    /*
        auth~ 메소드 안에서 accessToken을 user의 accessToken으로 알아서 전달하고 있기 때문에
        useApi()훅을 사용할때 인자로 accessToken을 넘겨줄 필요 없다.
        isAuth=true이면 알아서 user의 accessToken을 전달한다
    */

    const {user}=useContext(AuthContext);
    const accessToken = user?.accessToken || null;

    const authGET = (URL,data={},isAuth=true,source='main')=>{
        return GET(URL,data,accessToken,isAuth,source);
    };
    
    const authPOST = (URL,data={},isAuth=true,source='main')=>{
        return POST(URL,data,accessToken,isAuth,source);
    };

    const authPUT = (URL,data={},isAuth=true,source='main')=>{
        return PUT(URL,data,accessToken,isAuth,source);
    };

    const authDELETE = (URL,data={},isAuth=true,source='main')=>{
        return DELETE(URL,data,accessToken,isAuth,source);
    };

    return {
        GET:authGET,
        POST:authPOST,
        PUT:authPUT,
        DELETE:authDELETE
    };
};