import { createContext, useContext, useState } from "react"
import ModalComponent from "../components/common/ModalComponent";
import ButtonComponent from "../components/common/ButtonComponent";

/*
 * useModal()훅 사용방법
 * <사용가능한 모달 : 기본/확인/로딩 및 모달을 닫는 closeModal()함수>
 * 
 * -<<showBasicModal>> 
 * 1. 사용하고자 하는 페이지에 const {showBasicModal}=useModal();로 context 가져오기
 * 2. showBasicModal을 함수로 사용 
 *      예) 특정 조건 (error발생상황) 에서 모달이 팝업되도록 사용
 *          또는 버튼 클릭시 모달이 팝업되도록 onClick()에 함수 호출하여 사용
 * 3. showBasicModal("전달하고자 하는 메세지","모달제목") 
 *      -> 이때 전달하고자 하는 메세지는 message에 전달된다
 *     subtitle은 빈문자열, variant는 default로 통일되어있다
 *     모달제목은 지정하지 않으면 "알림"이 기본
 *     모달을 닫는 x버튼이 존재하고, esc 및 모달 바깥을 클릭해서 모달을 끌 수는 없다
 * 
 * -<<showConfirmModal>>
 * 1. 사용하고자 하는 페이지에 const {showConfirmModal}=useModal();로 context 가져오기
 * 2. showConfirmModal을 함수로 사용 
 * 3. showConfirmModal(
 *         "전달하고자 하는 메세지",
 *          "모달제목",
 *          "모달부제목",
 *           ()=>{
 *              사용자가 '확인'을 클릭했을 때 실행될 로직 
 *              예: 로그아웃 처리, 회원 탈퇴 처리 등등}
 *    )
 *       variant는 outlined, Footer는 취소(secondary), 확인(primary)로 통일되어있다
 *       모달 제목은 지정하지 않으면 "확인", 모달부제목은 "이 작업을 계속하시겠습니까?"가 기본
 *       콜백함수는 따로 정의해서 사용해도 무방하다
 *       모달을 닫는 x버튼은 존재하지 않고, esc 및 모달 바깥을 클릭해서 모달을 끌 수는 없다
 * 
 * -<<showLoadingModal>>
 * 1. 사용하고자 하는 페이지에 const {showLoadingModal}=useModal();로 context 가져오기
 * 2. showLodaingModal을 함수로 사용 
 * 3. showLoadingModal(
 *          "전달하고자 하는 메세지",
 *          "모달 제목",
 *          "모달 부제목"
 *    )
 *       variant는 default이다
 *       ※로딩모달은 메세지 및에 로딩상태가 렌더링된다
 *       모달제목은 지정하지 않으면 "로딩", 부제목은 "로딩이 끝나면 자동으로 닫힙니다"기 기본
 *       모달을 닫는 x버튼은 존재하지 않고, esc 및 모달 바깥을 클릭해서 모달을 끌 수는 없다
 * 
 * - <<closeModal>>
 * 1. 사용하고자 하는 페이지에 const {closeModal}=useModal();로 context 가져오기
 * 2. closeModal()로 모달을 닫는 클린업 함수 사용 가능 
 *     -> 함수를 호출하면 바로 모달이 닫힌다
 */


const ModalContext = createContext();

export const ModalProvider = ({children})=>{
    const [modalState, setModalState]= useState({
        isOpen: false,
        title:"",
        subtitle:"",
        content:null,
        size:"small",
        onConfirm:()=>{},
        onCancel: ()=>{},
        hasFooter: false,
        showCloseButton: true,
        closeOnOverlayClick: false,
        variant: ModalComponent.VARIANTS.DEFAULT,
    });

    const showBasicModal = (message,title = "알림")=>{
        setModalState({
            isOpen: true,
            title,
            subtitle:"",
            size:"small",
            content: <div>{message}</div>,
            onConfirm: ()=>handleClose(),
            onCancel: ()=>handleClose(),
            hasFooter: false,
            showCloseButton: true,
            closeOnOverlayClick: false,
            variant: ModalComponent.VARIANTS.DEFAULT,
        });
    };

    const showConfirmModal = (
        message,
        title="확인",
        subtitle="이 작업을 계속하시겠습니까?",
        onConfirm
    )=>{
        setModalState({
            isOpen:true,
            title,
            subtitle,
            size:"small",
            content:<div>{message}</div>,
            onConfirm:()=>{
                onConfirm();
                handleClose();
            },
            onCancel:()=>{
                handleClose();
            },
            hasFooter:true,
            showCloseButton: false,
            closeOnOverlayClick: false,
            variant:ModalComponent.VARIANTS.OUTLINED
        });
    };

    const showLoadingModal = (
        message, 
        title="로딩",
        subtitle="로딩이 끝나면 자동으로 닫힙니다"
    )=>{
        setModalState({
            isOpen:true,
            title,
            subtitle,
            size:"small",
            content: <>
                <div>{message}</div>
                <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100px' }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </>,
            onConfirm:()=>handleClose(),
            onCancel:()=>handleClose(),
            hasFooter:false,
            showCloseButton: false,
            closeOnOverlayClick: false,
            variant:ModalComponent.VARIANTS.DEFAULT

        });
    };

    const handleClose=()=>{
        setModalState((prev)=>{
            if(!prev.isOpen) return prev;
            return {...prev, isOpen:false};
        });
    };

    const renderFooter = ()=>{
        if(!modalState.hasFooter) return null;
        return (
            <ModalComponent.Actions>
                <ButtonComponent variant="secondary" onClick={modalState.onCancel}>
                    취소
                </ButtonComponent>
                <ButtonComponent variant="primary" onClick={modalState.onConfirm}>
                    확인
                </ButtonComponent>
            </ModalComponent.Actions>
        );
    };

    const value = {showBasicModal,showConfirmModal,showLoadingModal,closeModal:handleClose};

    return (
        <ModalContext.Provider value={value}>
            {children}
            <ModalComponent
                isOpen={modalState.isOpen}
                onClose={handleClose}
                title={modalState.title}
                size={modalState.size}
                subtitle={modalState.subtitle}
                variant={modalState.variant}
                footer={renderFooter()}
                showCloseButton={modalState.showCloseButton}
            >
                {modalState.content}
            </ModalComponent>
        </ModalContext.Provider>
    );
};

export const useModal = ()=>{
    const context = useContext(ModalContext);
    if(!context){
        throw new Error("showModal은 반드시 ModalProvider안에서 사용되어야 합니다");
    }
    return context;
};