
import Home from './components/Home'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Chat from "./components/Chat";
import Signup from "./components/Signup";
import Login from './components/Login';
import Auth from './components/Auth';
import RequireAuth from './components/Requiredauth';
import ChatPage from './components/ChatPage';




function App() {
  return (
    <div className="relative w-full bg-[#090909]">
     
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full 
                        bg-[#DBF63C] opacity-[0.35] blur-[180px]"></div>

        <div className="absolute top-[-150px] right-[-150px] w-[650px] h-[650px] rounded-full 
                        bg-[#DBF63C] opacity-[0.30] blur-[180px]"></div>

        <div className="absolute bottom-[-250px] left-[10%] w-[900px] h-[900px] rounded-full
                        bg-[#3173AD] opacity-[0.25] blur-[250px]"></div>
      </div>

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
      
      

      
    </div>
  )
}

export default App

