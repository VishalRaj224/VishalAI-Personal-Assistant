import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  Send, Sparkles, LogIn, AlertCircle, Menu, Plus, MessageSquare, 
  Settings, User, Mic, MicOff, Copy, RotateCcw, StopCircle, LogOut, Check, Sun, Moon
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AssistantLogo } from "./AssistantLogo";
import { signInAnonymously } from "firebase/auth";
import { auth, googleProvider, loginWithGoogle, onAuthStateChanged, logoutUser, db } from "../lib/firebase";
import { collection, doc, setDoc, getDocs, query, orderBy, onSnapshot, serverTimestamp, getDoc } from "firebase/firestore";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp?: number;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: number;
}

export const PublicPortal: React.FC<{ onAdminLogin: () => void }> = ({ onAdminLogin }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth > 768 : true);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        loadConversations(user.uid);
      }
    });
    return () => unsub();
  }, []);

  const loadConversations = (uid: string) => {
    const q = query(collection(db, `users/${uid}/conversations`), orderBy("updatedAt", "desc"));
    return onSnapshot(q, (snap) => {
      const convs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Conversation));
      setConversations(convs);
      if (convs.length > 0 && !activeConvId) {
        loadMessages(uid, convs[0].id);
      } else if (convs.length === 0) {
        createNewChat();
      }
    });
  };

  const loadMessages = async (uid: string, convId: string) => {
    setActiveConvId(convId);
    setLoading(true);
    try {
      const q = query(collection(db, `users/${uid}/conversations/${convId}/messages`), orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setActiveConvId(null);
    setMessages([]);
    setError(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming, loading]);

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (err) {
      console.error("Guest login failed", err);
    }
  };

  // Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setInput((prev) => prev + (prev ? " " : "") + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const saveMessageToFirestore = async (convId: string, msg: ChatMessage, title?: string) => {
    if (!currentUser) return;
    try {
      if (title) {
        await setDoc(doc(db, `users/${currentUser.uid}/conversations`, convId), {
          title,
          updatedAt: Date.now()
        }, { merge: true });
      } else {
        await setDoc(doc(db, `users/${currentUser.uid}/conversations`, convId), {
          updatedAt: Date.now()
        }, { merge: true });
      }
      await setDoc(doc(db, `users/${currentUser.uid}/conversations/${convId}/messages`, msg.id), {
        ...msg,
        timestamp: Date.now()
      });
    } catch (err) {
      console.error("Failed to save message", err);
    }
  };

  const handleSend = async (retryText?: string) => {
    const userText = retryText || input.trim();
    if (!userText || isStreaming) return;
    
    let currentConvId = activeConvId;
    if (!currentConvId) {
      currentConvId = `conv-${Date.now()}`;
      setActiveConvId(currentConvId);
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!retryText) setInput("");
    setIsStreaming(true);
    setError(null);
    
    // Save user message (create conv if needed with title based on first msg)
    await saveMessageToFirestore(currentConvId, userMsg, messages.length === 0 ? userText.slice(0, 30) + "..." : undefined);

    abortControllerRef.current = new AbortController();
    const assistantMsgId = `msg-${Date.now() + 1}`;
    
    setMessages((prev) => [...prev, { id: assistantMsgId, role: "model", text: "" }]);

    try {
      const res = await fetch("/api/gemini-chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: messages.map(m => ({ role: m.role, text: m.text })),
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) throw new Error("API responded with error");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6);
              if (dataStr === "[DONE]") break;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.text) {
                  fullText += parsed.text;
                  setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: fullText } : m));
                } else if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                // Ignore parse errors on partial chunks
              }
            }
          }
        }
      }

      await saveMessageToFirestore(currentConvId, { id: assistantMsgId, role: "model", text: fullText });
      if (isListening) speakText(fullText);

    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Failed to get response");
        setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: m.text + "\n\n**[Error: Connection interrupted]**" } : m));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };


  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Find a good voice
    const voices = window.speechSynthesis.getVoices();
    const goodVoice = voices.find(v => v.name.includes("Google") || v.name.includes("Samantha")) || voices[0];
    if (goodVoice) utterance.voice = goodVoice;
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading) {
    return <div className="min-h-screen bg-zinc-50 dark:bg-[#212121] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#212121] text-white dark:text-zinc-900 dark:text-zinc-200 flex flex-col font-sans">
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AssistantLogo className="w-8 h-8" />
            <span className="font-semibold text-lg">Vishal AI</span>
          </div>
          <button onClick={onAdminLogin} className="text-sm font-medium hover:text-white transition">Admin Login</button>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <AssistantLogo className="w-20 h-20 mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to Vishal AI</h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 mb-8 max-w-lg">
            Your powerful personal assistant. Login to save your conversations or try it out as a guest.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={loginWithGoogle}
              className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition"
            >
              Continue with Google
            </button>
            <button 
              onClick={handleGuestLogin}
              className="px-6 py-3 rounded-full bg-zinc-200 dark:bg-zinc-800 text-white font-semibold hover:bg-zinc-300 dark:hover:bg-zinc-700 transition"
            >
              Use as Guest
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#212121] text-white dark:text-zinc-900 dark:text-zinc-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} flex-shrink-0 bg-zinc-900 dark:bg-zinc-100 dark:bg-[#171717] transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-3">
          <button 
            onClick={createNewChat}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition text-sm font-medium group"
          >
            <div className="flex items-center gap-2">
              <AssistantLogo className="w-6 h-6" />
              <span>New chat</span>
            </div>
            <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-500 px-3 py-2">Today</div>
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => loadMessages(currentUser.uid, conv.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition ${activeConvId === conv.id ? 'bg-zinc-200 dark:bg-zinc-800 text-white dark:text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800/50'}`}
            >
              {conv.title || "New Conversation"}
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-zinc-300 dark:border-zinc-800/50 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition text-sm text-zinc-700 dark:text-zinc-300">
            <User className="w-4 h-4" />
            <span className="truncate">{currentUser.isAnonymous ? "Guest User" : currentUser.displayName}</span>
          </button>
          <button onClick={logoutUser} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition text-sm text-zinc-500 dark:text-zinc-500 dark:text-zinc-400">
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
          <button onClick={onAdminLogin} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition text-sm text-sky-400">
            <Settings className="w-4 h-4" />
            <span>Admin Settings</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#212121] relative">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-4 border-b border-transparent">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-lg hover:bg-zinc-200 dark:bg-zinc-800 transition text-zinc-500 dark:text-zinc-500 dark:text-zinc-400"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-lg text-white dark:text-zinc-900 dark:text-zinc-200">Vishal AI</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-4">
              <AssistantLogo className="w-16 h-16 mb-4" />
              <h2 className="text-2xl font-semibold mb-8">How can I help you today?</h2>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto pb-32">
              {messages.map((msg, idx) => (
                <div key={msg.id} className="w-full py-6 px-4 md:px-0">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700">
                      {msg.role === "user" ? <User className="w-5 h-5" /> : <AssistantLogo className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="font-semibold text-sm mb-1 text-white dark:text-zinc-900 dark:text-zinc-100">
                        {msg.role === "user" ? "You" : "Vishal AI"}
                      </div>
                      <div className="text-white dark:text-zinc-900 dark:text-zinc-200 prose prose-invert prose-p:leading-relaxed max-w-none">
                        {msg.role === "model" ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({node, inline, className, children, ...props}: any) {
                                const match = /language-(\w+)/.exec(className || "");
                                return !inline && match ? (
                                  <div className="rounded-lg overflow-hidden my-4 border border-zinc-300 dark:border-zinc-800 bg-[#1e1e1e]">
                                    <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-300 dark:border-zinc-800">
                                      <span className="text-xs font-mono text-zinc-500 dark:text-zinc-500 dark:text-zinc-400">{match[1]}</span>
                                    </div>
                                    <SyntaxHighlighter
                                      {...props}
                                      style={vscDarkPlus}
                                      language={match[1]}
                                      PreTag="div"
                                      customStyle={{ margin: 0, padding: '1rem', background: 'transparent' }}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  </div>
                                ) : (
                                  <code {...props} className="bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-[13px]">
                                    {children}
                                  </code>
                                );
                              }
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        )}
                      </div>
                      
                      {/* Actions */}
                      {msg.role === "model" && !isStreaming && (
                        <div className="flex items-center gap-2 mt-3 -ml-2">
                          <button 
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            className="p-1.5 rounded-md hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 transition"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                          {idx === messages.length - 1 && (
                            <button 
                              onClick={() => {
                                const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
                                if (lastUserMsg) {
                                  setMessages(prev => prev.slice(0, prev.length - 1));
                                  handleSend(lastUserMsg.text);
                                }
                              }}
                              className="p-1.5 rounded-md hover:bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 transition"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {error && (
                <div className="w-full py-4 px-4 md:px-0 flex justify-center">
                  <div className="bg-rose-950/50 border border-rose-500/50 text-rose-300 px-4 py-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">{error}</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-50 dark:from-[#212121] via-zinc-50 dark:via-[#212121] to-transparent pt-10 pb-6 px-4">
          <div className="w-full max-w-3xl mx-auto relative">
            {isStreaming && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <button 
                  onClick={stopGeneration}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-300 dark:hover:bg-zinc-700 transition shadow-lg"
                >
                  <StopCircle className="w-4 h-4" />
                  Stop generating
                </button>
              </div>
            )}
            <div className="relative flex items-end w-full bg-white dark:bg-[#2f2f2f] rounded-2xl border border-zinc-300 dark:border-zinc-700/50 focus-within:border-zinc-500 transition-colors shadow-sm">
              <button
                onClick={toggleListening}
                className={`p-3 m-1.5 rounded-xl transition-colors ${isListening ? 'bg-rose-500/20 text-rose-400' : 'hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-500 dark:text-zinc-400'}`}
                title="Voice Input"
              >
                {isListening ? <Mic className="w-5 h-5 animate-pulse" /> : <MicOff className="w-5 h-5" />}
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Vishal AI..."
                className="flex-1 max-h-52 min-h-[56px] py-4 bg-transparent resize-none outline-none text-white dark:text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:text-zinc-500 dark:text-zinc-400"
                rows={1}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="p-2 m-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:bg-zinc-300 transition-colors disabled:opacity-50 disabled:bg-zinc-200 dark:bg-zinc-800 disabled:text-zinc-600 shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center mt-3">
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500">Vishal AI can make mistakes. Consider verifying important information.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
