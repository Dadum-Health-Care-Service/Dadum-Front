import { useState, useEffect, useContext } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import { app } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";
import ErrorBoundary from "./components/common/ErrorBoundary.jsx";

// Pages
import Home from "./components/pages/Home/Home.jsx";
import Login from "./components/pages/Login/Login.jsx";
import SignUp from "./components/pages/Login/SignUp.jsx";
import FindId from "./components/pages/Login/FindId.jsx";
import FindPw from "./components/pages/Login/FindPw.jsx";
import MainView from "./components/pages/MainView/MainView.jsx";
import GNB from "./components/pages/GNB/GNB.jsx";
import Routine from "./components/pages/Routine/Routine.jsx";
import Social from "./components/pages/Social/Social.jsx";
import CalorieCam from "./components/pages/Calorie/CalorieCam.jsx";
import DailySummary from "./components/pages/Summary/DailySummary.jsx";
import Chatbot from "./components/pages/Chatbot/Chatbot.jsx";
import MyPage from "./components/pages/MyPage/MyPage.jsx";
import Admin from "./components/pages/Admin/Admin.jsx";
import SamplePage from "./components/pages/SamplePage/SamplePage.jsx";
import Shop from "./components/pages/Payments/Shop/Shop.jsx";
import ProductDetail from "./components/pages/Payments/Shop/ProductDetail.jsx";
import OrderPage from "./components/pages/Payments/Shop/OrderPage.jsx";
import OrderHistory from "./components/pages/Payments/Shop/OrderHistory.jsx";
import PaymentComplete from "./components/pages/Payments/PaymentComplete.jsx";
import SalesAnalysis from "./components/pages/Payments/SalesAnalysis.jsx";
import FraudDetection from "./components/pages/Payments/FraudDetection.jsx";
import PoseAccuracyMVP from "./components/pages/Pose/PoseAccuracyMVP.jsx";
import SellerMain from "./components/pages/Payments/Seller/SellerMain.jsx";
import MapPage from "./components/pages/Map/MapPage.jsx";

//Contexts
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { RunProvider } from "./context/RunContext.jsx";
import { RoutineProvider } from "./context/RoutineContext.jsx";
import { SuggestProvider } from "./context/SuggestContext.jsx";
import { ModalProvider, useModal } from "./context/ModalContext.jsx";

//Utils
import { handleAllowNotification } from "./utils/webpush/notificationPermission";
import GoogleTagManager from "./utils/tagmanager/GoogleTagManager.jsx";
import usePageView from "./utils/tagmanager/PageView.jsx";
import "./utils/webpush/foregroundMessage";
import { useApi } from "./utils/api/useApi.jsx";

function AppContent() {
  const { user, dispatch } = useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(false);
  const [isNotify, setIsNotify] = useState(false);
  const location = useLocation();
  const { GET } = useApi();

  usePageView();
  useEffect(() => {
    // Firebase 연결 상태 확인
    //console.log("Firebase 앱:", app);
    //console.log("환경변수:", import.meta.env.VITE_FIREBASE_API_KEY);
    //console.log("알림 권한:", Notification.permission);

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);
  // Service Worker 메시지 수신
  useEffect(() => {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.ready.then(() => {
      //console.log("SW ready");

      const handleSWMessage = (event) => {
        console.log("SW 메시지 수신:", event.data);
        if (event.data.data.type === "REQUEST_ROLE") {
          console.log("REQUEST_ROLE");
          setIsNotify(event.data.data.type);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSWMessage);

      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSWMessage);
      };
    });
  }, []);

  useEffect(() => {
    // Service Worker 등록 및 알림 권한 요청 + 유효한 user상태인지 확인
    if (user) {
      //console.log("handleAllowNotification");
      handleAllowNotification(user.accessToken);
      const checkUser = async ()=>{
        try{
          const res = await GET(`/users/${user.usersId}`,{},false);
          console.log('사용자 이메일: ',res.data.email);
        } catch (e) {
          console.log(e);
          console.error('저장된 user의 정보와 일치하는 사용자가 없어 로그아웃 되었습니다');
          dispatch({ type: "LOGOUT" });
        }
      };
      checkUser();
    }
  }, [user]);

  const noGNBpaths = ["/login", "/signup", "/findid", "/findpw"];
  const showGNB = user && !noGNBpaths.includes(location.pathname);
  const pagePadding =
    isMobile && !noGNBpaths.includes(location.pathname) && user ? "90px" : "0px";

  return (
    <>
      <main
        style={{
          paddingBottom: pagePadding,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {showGNB && <GNB isMobile={isMobile} isNotify={isNotify} />}
        <div style={{ width: "100%", maxWidth: "1360px" }}>
          <Routes>
            <Route path="/" element={user ? <Home /> : <MainView />}></Route>
            <Route path="/login" element={<Login />}></Route>
            <Route path="/findid" element={<FindId />}></Route>
            <Route path="/findpw" element={<FindPw />}></Route>
            <Route path="/signup" element={<SignUp />}></Route>
            <Route path="/sample" element={<SamplePage />}></Route>
            {user ? (
              <>
                <Route path="/routine" element={<Routine />}></Route>
                <Route path="/pose" element={<PoseAccuracyMVP />}></Route>
                <Route path="/calorie" element={<CalorieCam />}></Route>
                <Route path="/daily" element={<DailySummary />}></Route>
                <Route path="/shop" element={<Shop />}></Route>
                <Route path="/shop/product/:productId" element={<ProductDetail />}></Route>
                <Route path="/order" element={<OrderPage />}></Route>
                <Route path="/orders" element={<OrderHistory />}></Route>
                <Route
                  path="/payment/complete"
                  element={<PaymentComplete />}
                ></Route>
                <Route
                  path="/payment/mobile-complete"
                  element={<PaymentComplete />}
                ></Route>
                <Route
                  path="/sales-analysis"
                  element={<SalesAnalysis />}
                ></Route>
                <Route
                  path="/fraud-detection"
                  element={<FraudDetection />}
                ></Route>
                <Route path="/social" element={
                  <ErrorBoundary>
                    <Social />
                  </ErrorBoundary>
                }></Route>
                <Route path="/place" element={<MapPage />}></Route>
                <Route path="/mypage/*" element={<MyPage />}></Route>
                <Route path="/seller/*" element={<SellerMain />}></Route>
                <Route
                  path="/admin"
                  element={
                    <Admin
                      isMobile={isMobile}
                      isNotify={isNotify}
                      setIsNotify={setIsNotify}
                    />
                  }
                ></Route>
              </>
            ) : (
              <Route path="/*" element={<Navigate to="/" replace />} />
            )}
          </Routes>
        </div>
      </main>
      <GoogleTagManager gtmId="GTM-ND9XH56H" />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ModalProvider>
          <RunProvider>
            <RoutineProvider>
              <SuggestProvider>
                <AppContent />
              </SuggestProvider>
            </RoutineProvider>
          </RunProvider>
        </ModalProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
