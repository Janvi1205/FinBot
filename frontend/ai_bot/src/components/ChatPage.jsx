import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Chat from "./Chat";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatKey, setChatKey] = useState(0); 
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const createInitialChat = async () => {
      const user = auth.currentUser;
      if (!user || selectedChatId || isCreatingChat) return;

      setIsCreatingChat(true);
      try {
        const docRef = await addDoc(collection(db, "chats"), {
          uid: user.uid,
          title: "New Chat",
          createdAt: Date.now()
        });
        setSelectedChatId(docRef.id);
        setChatKey(prev => prev + 1); // Force remount
      } catch (error) {
        console.error("Error creating initial chat:", error);
      } finally {
        setIsCreatingChat(false);
      }
    };

    createInitialChat();
  }, []);

  return (
    <div className="flex h-[100dvh] lg:h-screen bg-[#090909] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        transition-transform duration-300 ease-in-out 
      `}>
        <Sidebar 
          selectedChatId={selectedChatId} 
          setSelectedChatId={setSelectedChatId}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 w-full lg:w-auto">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-[#1a1a1a] text-white rounded-lg"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {selectedChatId ? (
          <Chat key={`${selectedChatId}-${chatKey}`} chatId={selectedChatId} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 bg-[#090909]">
            {isCreatingChat ? "Creating chat..." : "Select or create a chat"}
          </div>
        )}
      </div>
    </div>
  );
}
