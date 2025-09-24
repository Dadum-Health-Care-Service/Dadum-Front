import { useState, useEffect, useContext } from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./App.css";

// Pages
import Home from "./components/pages/Home/Home.jsx";
import Login from "./components/pages/Login/Login.jsx";
import SignUp from "./components/pages/Login/SignUp.jsx";
import MainView from "./components/pages/MainView/MainView.jsx";
import GNB from "./components/pages/GNB/GNB.jsx";
import Routine from "./components/pages/Routine/Routine.jsx";
import Social from "./components/pages/Social/Social.jsx";
import CalorieCam from "./components/pages/Calorie/CalorieCam.jsx";
import DailySummary from "./components/pages/Summary/DailySummary.jsx";
import Chatbot from "./components/pages/Chatbot/Chatbot.jsx";
import MyPage from "./components/pages/MyPage/MyPage.jsx";
import Admin from "./components/pages/Admin/Admin.jsx";
import PoseAccuracyMVP from "./components/pages/Pose/PoseAccuracyMVP.jsx";

//Contexts
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import { RunProvider } from "./context/RunContext.jsx";
import { RoutineProvider } from "./context/RoutineContext.jsx";
import { SuggestProvider } from "./context/SuggestContext.jsx";
import { ModalProvider } from "./context/ModalContext.jsx";

function AppContent(){
  
  const { user }=useContext(AuthContext);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);

  }, []);

  return (
    <>
      <main style={{paddingBottom:'100px'}}>
        {user && <GNB isMobile={isMobile}/> }
        <Routes>
          <Route path="/" element={user ? <Home/> : <MainView/>}></Route>
          <Route path="/login" element={<Login/>}></Route>
          <Route path="/signup" element={<SignUp/>}></Route>

          {user ? (
            <>
              <Route path="/routine" element={<Routine/>}></Route>
              <Route path="/pose" element={<PoseAccuracyMVP/>}></Route>
              <Route path="/calorie" element={<CalorieCam/>}></Route>
              <Route path="/daily" element={<DailySummary/>}></Route>
              <Route path="/statistics" element={<div><h1>통계페이지는 개발 중 입니다.</h1></div>}></Route>
              <Route path="/social" element={<Social/>}></Route>
              <Route path="/mypage/*" element={<MyPage/>}></Route>
              <Route path="/admin" element={<Admin/>}></Route>
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </main>
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
                <AppContent/>
              </SuggestProvider>
            </RoutineProvider>
          </RunProvider>
        </ModalProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
