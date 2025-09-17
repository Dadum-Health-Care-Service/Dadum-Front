import CardComponent from "../../common/CardComponent";
import ContainerComponent from "../../common/ContainerComponent";

export default function Profile(){


    return<>
        <ContainerComponent variant="filled" className="p-4">
            <ContainerComponent variant="outlined" className="profile-head">
                <div className="d-flex flex-column align-items-center text-center pb-4">    
                    <img
                        className="rounded-circle mt-5"
                        width="150px"
                        src="/img/userAvatar.png"
                    />
                    <span className="font-weight-bold fs-2">프로필 이름</span>
                    <span className="font-weight-bold fs-4">프로필 닉네임</span>
                    <span className="text-black-50">이메일</span>
                </div>
            </ContainerComponent>
            
            
            
        </ContainerComponent>
    </>
}