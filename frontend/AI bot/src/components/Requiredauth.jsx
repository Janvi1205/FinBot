import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function RequireAuth({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Unsubscribe function
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090909]">
        <div className="text-white text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#3173AD] mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  // Use replace to prevent back button from going to protected route
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render protected content
  return children;
}
