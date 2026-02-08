import { db } from "../firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  getDocs 
} from "firebase/firestore";

export async function saveMessage(uid, text, sender) {
  await addDoc(collection(db, "users", uid, "chats"), {
    text: text,
    sender: sender,    
    timestamp: serverTimestamp()
  });
}

export async function getChatHistory(uid) {
  const q = query(
    collection(db, "users", uid, "chats"),
    orderBy("timestamp")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data());
}
