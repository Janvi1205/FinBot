import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Helper function to convert Firebase errors to user-friendly messages
const getErrorMessage = (error) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email is already in use";
    case "auth/invalid-email":
      return "Invalid email address";
    case "auth/weak-password":
      return "Password should be at least 6 characters";
    case "auth/user-not-found":
      return "No account found with this email";
    case "auth/wrong-password":
      return "Incorrect password";
    case "auth/invalid-credential":
      return "Invalid email or password";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    case "auth/user-disabled":
      return "This account has been disabled";
    case "auth/operation-not-allowed":
      return "This operation is not allowed";
    default:
      return "An error occurred. Please try again";
  }
};

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate("/chat");
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      alert(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#090909] relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-200px] left-[-200px] w-[700px] h-[700px] rounded-full 
                        bg-[#DBF63C] opacity-[0.35] blur-[180px]"></div>
        <div className="absolute top-[-150px] right-[-150px] w-[650px] h-[650px] rounded-full 
                        bg-[#DBF63C] opacity-[0.30] blur-[180px]"></div>
        <div className="absolute bottom-[-250px] left-[10%] w-[900px] h-[900px] rounded-full
                        bg-[#3173AD] opacity-[0.25] blur-[250px]"></div>
      </div>

      <div className="relative z-10 w-full  max-w-md mx-auto px-4 py-8 sm:py-12">
        <div className="bg-[#1B1B1B] lg:h-100! border border-gray-800/50 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md ">
          {/* Tab Switcher */}
          <div style={{padding:"10px"}} className="flex gap-2 mb-8 bg-[#090909] p-1 rounded-lg">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? "bg-[#3173AD] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? "bg-[#3173AD] text-white shadow-lg"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form  onSubmit={handleSubmit} className="space-y-6 p-7! ">
            <div>
              <label className="block text-white mb-2 font-medium ">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                style={{marginTop:"10px",padding:"10px"}}
                className="w-full  bg-[#090909] border border-gray-800/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#3173AD] focus:ring-2 focus:ring-[#3173AD]/20 transition-all"
                required
              />
            </div>

            <div>
              <label style={{marginTop:"10px"}} className="block text-white mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                style={{marginTop:"10px",padding:"10px"}}
                className="w-full bg-[#090909] border border-gray-800/50 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#3173AD] focus:ring-2 focus:ring-[#3173AD]/20 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              style={{marginTop:"15px",padding:"5px"}}
              disabled={loading}
              className="w-full bg-[#3173AD] hover:bg-[#2a5f8f] text-white font-semibold py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? "Processing..." : isLogin ? "Login" : "Create Account"}
            </button>
          </form>

          {/* Switch message */}
          <p className="mt-6 text-center text-gray-400 text-sm">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-[#3173AD] hover:text-[#2a5f8f] font-semibold"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-[#3173AD] hover:text-[#2a5f8f] font-semibold"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

