import { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs
} from "firebase/firestore";

export default function Sidebar({ selectedChatId, setSelectedChatId, onClose }) {
  const [chats, setChats] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "chats"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const chatList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log("Sidebar updated with chats:", chatList.length);
        setChats(chatList);
      },
      (error) => {
        console.error("Error loading chats:", error);
        // Fallback: try without orderBy if index is missing
        if (error.code === 'failed-precondition') {
          console.warn("Firestore index missing for chats. Please create a composite index.");
          const qFallback = query(
            collection(db, "chats"),
            where("uid", "==", user.uid)
          );
          const fallbackUnsub = onSnapshot(qFallback, (snapshot) => {
            const chatList = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            console.log("Sidebar updated (fallback) with chats:", chatList.length);
            setChats(chatList);
          });
          return () => fallbackUnsub();
        }
      }
    );

    return unsub;
  }, []);

  const createChat = async () => {
    const user = auth.currentUser;
    if (!user || isCreating) return;

    setIsCreating(true);
    try {
      // The previous chat is already saved in Firestore (created when page loaded or previous new chat)
      // All messages are already saved with the chatId, so the previous chat will appear in sidebar automatically
      
      // Create new chat with current timestamp
      const newChatData = {
        uid: user.uid,
        title: "New Chat",
        createdAt: Date.now()
      };
      
      console.log("Creating new chat...");
      const docRef = await addDoc(collection(db, "chats"), newChatData);
      
      console.log("New chat created with ID:", docRef.id);
      console.log("Previous chat should already be in sidebar");
      
      // Wait a tiny bit to ensure Firestore has processed the write
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Switch to the new chat - sidebar will update automatically via onSnapshot
      setSelectedChatId(docRef.id);
      
    } catch (error) {
      console.error("Error creating new chat:", error);
      alert("Failed to create new chat. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteChat = async (chatId, e) => {
    e.stopPropagation(); // Prevent chat selection when clicking delete
    
    if (!window.confirm("Are you sure you want to delete this chat? This will delete all messages in this conversation.")) {
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      // Delete all messages in this chat
      const messagesQuery = query(
        collection(db, "messages"),
        where("chatId", "==", chatId),
        where("uid", "==", user.uid)
      );
      const messagesSnapshot = await getDocs(messagesQuery);
      const deletePromises = messagesSnapshot.docs.map(msgDoc => deleteDoc(msgDoc.ref));
      await Promise.all(deletePromises);

      // Delete the chat document
      const chatRef = doc(db, "chats", chatId);
      await deleteDoc(chatRef);

      // If this was the selected chat, switch to another one or create new
      if (selectedChatId === chatId) {
        const remainingChats = chats.filter(chat => chat.id !== chatId);
        if (remainingChats.length > 0) {
          setSelectedChatId(remainingChats[0].id);
        } else {
          // Create a new chat if no chats remain
          createChat();
        }
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      alert("Failed to delete chat. Please try again.");
    }
  };

  return (
    <div className="w-64 h-full bg-[#0d0d0d] border-r border-gray-800 text-white flex flex-col p-2!  ">
      {/* Mobile Close Button */}
      <div className="flex items-center justify-between  border-b border-gray-800 lg:border-none">
        <button
          onClick={createChat}
          disabled={isCreating}
          className="bg-[#3173AD] p-1! lg:-mt-1!   sm:p-3 mt-9!  rounded-lg hover:bg-[#2a5f8f] disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex-1"
        >
          {isCreating ? "Creating..." : "+ New Chat"}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden ml-2 p-2 -mt-10! text-gray-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 hide-scrollbar overflow-y-auto   ">
        {chats.map(chat => (
          <div
            key={chat.id}
            className={`group p-3 cursor-pointer flex items-center justify-between mt-3! ${
              selectedChatId === chat.id ? "bg-[#1a1a1a]" : "hover:bg-[#111]"
            }`}
            onClick={() => {
              setSelectedChatId(chat.id);
              if (onClose) onClose(); // Close sidebar on mobile after selection
            }}
          >
            <span className="flex-1 truncate pr-2 text-sm sm:text-base">{chat.title}</span>
            <button
              onClick={(e) => deleteChat(chat.id, e)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-600/20 rounded transition-opacity"
              title="Delete chat"
            >
              <svg
                className="w-4 h-4 text-gray-400 hover:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
