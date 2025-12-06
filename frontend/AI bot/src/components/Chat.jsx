import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from "react-markdown";
import { auth, db } from "../firebase";
import { saveMessage, getChatHistory } from "./Chatservice";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs
} from "firebase/firestore";



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Chat = ({ chatId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const inputContainerRef = useRef(null);
    
   
    useEffect(() => {
        
        setMessages([]);
        setInput('');
        setIsLoading(false);
        
        if (!chatId) {
            return;
        }

        const user = auth.currentUser;
        if (!user) return;
      
        const q = query(
          collection(db, "messages"),
          where("uid", "==", user.uid),
          where("chatId", "==", chatId),
          orderBy("timestamp", "asc")
        );
      
        const unsub = onSnapshot(
          q, 
          (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
           
            setMessages(msgs);
          },
          (error) => {
            console.error("Error loading messages:", error);
            
           
            if (error.code === 'permission-denied') {
              console.error("❌ Firestore Permission Error: Please update your Firestore security rules!");
              console.error("Go to Firebase Console > Firestore Database > Rules and add:");
              console.error(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Messages collection
    match /messages/{messageId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
    }
  }
}
              `);
              return; // Don't try fallback for permission errors
            }
            
            // If it's an index error, try without orderBy
            if (error.code === 'failed-precondition') {
              console.warn("Firestore index missing. Using fallback query without orderBy.");
              // Fallback: query without orderBy and sort in memory
              const qFallback = query(
                collection(db, "messages"),
                where("uid", "==", user.uid),
                where("chatId", "==", chatId)
              );
              const fallbackUnsub = onSnapshot(
                qFallback,
                (snapshot) => {
                  const msgs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                  })).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
                  setMessages(msgs);
                },
                (fallbackError) => {
                  if (fallbackError.code === 'permission-denied') {
                    console.error("❌ Permission denied even with fallback query. Please fix Firestore security rules!");
                  } else {
                    console.error("Fallback query also failed:", fallbackError);
                  }
                }
              );
              return () => fallbackUnsub();
            }
          }
        );
      
        return unsub;
      }, [chatId]);
      


    const robotImageSrc = new URL('../assets/robot1.png', import.meta.url).href;
    const send = new URL('../assets/send.png', import.meta.url).href;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Handle mobile keyboard visibility - scroll input into view when focused
    useEffect(() => {
        const textarea = inputRef.current;
        if (!textarea) return;

        const scrollInputIntoView = () => {
            // Use requestAnimationFrame for smoother scrolling
            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (inputContainerRef.current) {
                        inputContainerRef.current.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end' 
                        });
                    } else if (textarea) {
                        textarea.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end',
                            inline: 'nearest'
                        });
                    }
                }, 250);
            });
        };

        const handleFocus = () => {
            scrollInputIntoView();
        };

        const handleTouchStart = (e) => {
            // If touching the textarea or input container, ensure it's visible
            if (e.target === textarea || textarea.contains(e.target) || 
                (inputContainerRef.current && inputContainerRef.current.contains(e.target))) {
                scrollInputIntoView();
            }
        };

        // Handle visual viewport changes (keyboard open/close)
        const handleViewportChange = () => {
            if (document.activeElement === textarea && window.visualViewport) {
                // Adjust scroll to keep input visible
                setTimeout(() => {
                    if (inputContainerRef.current) {
                        inputContainerRef.current.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'end' 
                        });
                    }
                }, 100);
            }
        };

        textarea.addEventListener('focus', handleFocus);
        textarea.addEventListener('touchstart', handleTouchStart, { passive: true });
        
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportChange);
            window.visualViewport.addEventListener('scroll', handleViewportChange);
        }

        return () => {
            textarea.removeEventListener('focus', handleFocus);
            textarea.removeEventListener('touchstart', handleTouchStart);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleViewportChange);
                window.visualViewport.removeEventListener('scroll', handleViewportChange);
            }
        };
    }, []);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatId) return;
    
        const userMessage = input.trim();
        const user = auth.currentUser;
    
        if (!user) return alert("Login required");
    
        const tempUserMessageId = `temp-${Date.now()}-user`;
        const tempUserMessage = {
            id: tempUserMessageId,
            uid: user.uid,
            chatId: chatId,
            role: "user",
            content: userMessage,
            timestamp: Date.now()
        };
    
        // Optimistic update - show user message immediately
        setMessages(prev => [...prev, tempUserMessage]);
        setInput('');
        setIsLoading(true);
    
        try {
            // Check if this is the first message BEFORE adding
            const messagesQuery = query(
                collection(db, "messages"),
                where("chatId", "==", chatId),
                where("uid", "==", user.uid)
            );
            const existingMessages = await getDocs(messagesQuery);
            const isFirstMessage = existingMessages.docs.length === 0;

            // ✅ Save user message to Firestore with chatId
            await addDoc(collection(db, "messages"), {
                uid: user.uid,
                chatId: chatId,
                role: "user",
                content: userMessage,
                timestamp: Date.now()
            });

            // Update chat title if this is the first message
            if (isFirstMessage) {
                const chatRef = doc(db, "chats", chatId);
                const title = userMessage.length > 30 ? userMessage.substring(0, 30) + "..." : userMessage;
                await updateDoc(chatRef, { title });
            }
        
            // Get bot response
            const response = await fetch(`${API_BASE_URL}/ask`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: userMessage }),
            });
        
            const data = await response.json();
        
            if (!response.ok) {
                throw new Error(data?.error || "Request failed");
            }
        
            const botMessage = data.response;
            const tempBotMessageId = `temp-${Date.now()}-bot`;
            const tempBotMessage = {
                id: tempBotMessageId,
                uid: user.uid,
                chatId: chatId,
                role: "assistant",
                content: botMessage,
                timestamp: Date.now()
            };
        
            // Optimistic update - show bot message immediately
            setMessages(prev => [...prev, tempBotMessage]);
        
            // ✅ Save assistant message to Firestore with chatId
            await addDoc(collection(db, "messages"), {
                uid: user.uid,
                chatId: chatId,
                role: "assistant",
                content: botMessage,
                timestamp: Date.now()
            });
        
        } catch (error) {
            console.error("Error:", error);
        
            const errorMessage = "Sorry, I encountered an error. Please try again.";
            const tempErrorMessage = {
                id: `temp-${Date.now()}-error`,
                uid: user.uid,
                chatId: chatId,
                role: "assistant",
                content: errorMessage,
                timestamp: Date.now()
            };
        
            // Show error message immediately
            setMessages(prev => [...prev, tempErrorMessage]);
        
            // Save error message to Firestore
            await addDoc(collection(db, "messages"), {
                uid: user.uid,
                chatId: chatId,
                role: "assistant",
                content: errorMessage,
                timestamp: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    };
    

    return (
        <div className="w-full h-[100dvh] lg:h-screen flex justify-center items-center bg-[#090909] overflow-hidden">
            <div className="flex flex-col h-full w-full max-w-4xl bg-[#090909] text-white overflow-hidden">

                <div className="flex h-[50px] sm:h-[60px] items-center w-full max-w-[900px] mx-auto backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-lg shadow-black/20 py-2 sm:py-4 px-4 sm:px-6 lg:px-8 flex-shrink-0">
                    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-2 sm:py-4 flex items-center gap-2 sm:gap-3">
                        
                        <h1 className="text-base ml-13! sm:text-lg font-semibold flex-1 text-center">FinBot</h1>
                        <Link
                            to="/"
                            className="p-2 rounded-lg transition-colors flex-shrink-0"
                            title="Back to Home"
                        >
                            <p className='lg:hidden mr-3! '>Back</p>
                            <svg className="w-5 h-5 hidden lg:block mr-10! " fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>

                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar min-h-0">
                    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 lg:py-8">

                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-250px)] lg:min-h-[calc(100vh-250px)] text-center">
                                <div>
                                    <img style={{ height: "90px" }} src={robotImageSrc} alt="" />
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-semibold mb-3 text-white px-4">How can I help you today?</h2>
                                <p className="text-gray-400 max-w-lg text-sm sm:text-base leading-relaxed px-4">
                                    Ask me anything about financial literacy in India, government schemes, loans, RBI rules, and more.
                                </p>
                            </div>
                        )}

                        <div style={{ marginTop: "20px" }} className="mt-6">
                            {messages.map((message, index) => (
                                <div
                                    key={message.id || index}
                                    style={{ marginTop: "20px" }}
                                    className={`flex gap-4 items-start 
                                        ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                                        ${index > 0 && messages[index - 1].role !== message.role ? "mt-10" : "mt-3"}
                                    `}
                                >
                                    {message.role === 'assistant' && (
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3173AD] to-[#DBF63C] flex items-center justify-center flex-shrink-0 mt-1 shadow-md overflow-hidden">
                                            <img className="h-8" src={robotImageSrc} alt="FinBot" />
                                        </div>
                                    )}

                                    <div
                                        style={{ padding: message.role === 'user' ? "5px" : "10px" }}
                                        className={`max-w-[85%] rounded-2xl px-5 py-2 break-words whitespace-normal
                                            ${message.role === 'user'
                                                ? 'bg-[#306d3f] text-white shadow-lg'
                                                : 'bg-[#1B1B1B] text-gray-100 border border-gray-800/50 shadow-md'
                                            }`}
                                    >
                                        <div style={{ marginTop: "2px" }} className="markdown-body max-w-none text-[15px] leading-relaxed">
                                            <ReactMarkdown>{message.content}</ReactMarkdown>
                                        </div>
                                    </div>

                                    {message.role === 'user' && (
                                        <div className="w-9 h-9 rounded-full bg-[#3173AD] flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                                            <span className="text-xs font-bold text-white">U</span>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div style={{ marginTop: "30px" }} className="flex gap-4 justify-start items-start">
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#3173AD] to-[#DBF63C] flex items-center justify-center flex-shrink-0 mt-1 shadow-md overflow-hidden">
                                        <img className="h-8" src={robotImageSrc} alt="FinBot" />
                                    </div>

                                    <div style={{ padding: "10px" }} className="bg-[#1B1B1B] border border-gray-800/50 rounded-2xl px-5 py-4 shadow-md">
                                        <div className="flex gap-1.5 items-center">
                                            <span className="w-2 h-2 bg-[#3b854e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-[#3b854e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-[#3b854e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                </div>

                <div 
                    ref={inputContainerRef}
                    className="border-t border-gray-800/50 backdrop-blur-md pb-4 sm:pb-0 flex-shrink-0"
                >
                    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 lg:py-5">
                        <form
                            onSubmit={handleSend}
                            className="w-full flex flex-row gap-3 items-end"
                        >
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend(e);
                                        }
                                    }}
                                    placeholder="Enter Your Question Here..."
                                    rows={1}
                                    className="hide-scrollbar w-full bg-[#1B1B1B] border border-gray-800/50 rounded-2xl px-5 py-4 pr-4 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#3173AD] focus:ring-2 focus:ring-[#3173AD]/20 transition-all max-h-32 overflow-y-auto text-[15px] leading-relaxed"
                                    style={{
                                        minHeight: '52px',
                                        height: 'auto',
                                        padding: "12px"
                                    }}
                                    onInput={(e) => {
                                        e.target.style.height = 'auto';
                                        e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{ marginBottom: "10px" }}
                                disabled={!input.trim() || isLoading}
                                className="w-12 h-12 rounded-2xl bg-[#3173AD] hover:bg-[#2a5f8f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all flex-shrink-0 shadow-lg hover:shadow-xl disabled:hover:shadow-lg"
                            >
                                {isLoading ? (
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <img style={{ height: "20px", marginLeft: "5px" }} src={send} alt="" />
                                )}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Chat;
