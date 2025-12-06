import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";

// Helper function to convert Firebase errors to user-friendly messages
const getErrorMessage = (error) => {
  const errorCode = error.code;
  
  switch (errorCode) {
    case "auth/invalid-email":
      return "Invalid email address";
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
    default:
      return "An error occurred. Please try again";
  }
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      alert(friendlyMessage);
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form className="h-50" onSubmit={login}>
        <input  type="email" onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" onChange={(e)=>setPassword(e.target.value)} />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
