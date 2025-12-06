import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";



const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCHOdYfsT9Uqze-LjKuuDvycCisv5bMPbQ",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "finbot-a7d8e.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "finbot-a7d8e",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "finbot-a7d8e.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "733603120974",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:733603120974:web:4867ad9fad44b38453c01f",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BSQCJ9KBVG"
  };

// Validate API key format
if (!firebaseConfig.apiKey || !firebaseConfig.apiKey.startsWith("AIza")) {
  console.error("⚠️ Firebase API key appears to be invalid. Please verify your API key in Firebase Console.");
}

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("❌ Firebase initialization error:", error);
  throw new Error("Failed to initialize Firebase. Please check your configuration.");
}

export const auth = getAuth(app);
export const db = getFirestore(app);
