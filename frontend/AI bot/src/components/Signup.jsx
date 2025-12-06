import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later";
    case "auth/network-request-failed":
      return "Network error. Please check your connection";
    case "auth/operation-not-allowed":
      return "This operation is not allowed";
    default:
      return "An error occurred. Please try again";
  }
};

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (error) {
      const friendlyMessage = getErrorMessage(error);
      alert(friendlyMessage);
    }
  };

  return (
    <div>
      <h2>Signup</h2>
      <form  onSubmit={signup}>
        <input type="email" placeholder="Email" onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />
        <button type="submit">Create Account</button>
      </form>
    </div>
  );
}
