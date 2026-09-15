import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  User, 
  Send, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  CheckCircle2, 
  Cpu, 
  ShieldCheck, 
  Terminal, 
  Clock, 
  Lightbulb,
  Palette,
  Compass
} from "lucide-react";
import { ChatModelId, AssistantPersona, AdvancedChatMessage, TabStatusType } from "../types";

interface GeminiChatTabProps {
  assistantName: string;
  onStatusChange?: (status: TabStatusType, label?: string) => void;
}

export const GeminiChatTab: React.FC<GeminiChatTabProps> = ({ assistantName, onStatusChange }) => {
  const [messages, setMessages] = useState<AdvancedChatMessage[]>([
    {
      id: "msg-1",
      role: "model",
      text: `Greetings. I am ${assistantName}, your personal cross-platform AI assistant. I am ready to process tasks, discuss software architecture, assess system security, or conduct research using the latest Gemini models.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "gemini-3.5-flash",
    },
  ]);

  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState<ChatModelId>("gemini-3.5-flash");
  const [selectedPersona, setSelectedPersona] = useState<AssistantPersona>("assistant");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const prevBusyRef = useRef(false);

  useEffect(() => {
    if (loading) {
      prevBusyRef.current = true;
      onStatusChange?.("busy", "Gemini Chat: Processing multimodal stream...");
    } else if (prevBusyRef.current) {
      prevBusyRef.current = false;
      onStatusChange?.("online", "Gemini Chat: Ready");
    }
  }, [loading, onStatusChange]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input.trim();
    const userMsg: AdvancedChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/gemini-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: historyPayload,
          model: selectedModel,
          rolePersona: selectedPersona,
        }),
      });

      const data = await res.json();
      const modelMsg: AdvancedChatMessage = {
        id: `msg-resp-${Date.now()}`,
        role: "model",
        text: data.reply || "Command executed.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.modelUsed || selectedModel,
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      const errorMsg: AdvancedChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: "model",
        text: `Error connecting to ${selectedModel}: ${err.message || "Failed to complete request."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: `msg-${Date.now()}`,
        role: "model",
        text: `Conversation reset. Switched to ${selectedPersona.toUpperCase()} persona on ${selectedModel}. How can I assist you?`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Control Strip */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        {/* Model Selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-sky-400" /> Model:
          </span>
          {(
            [
              { id: "gemini-3.1-pro-preview", label: "Gemini 3.1 Pro", desc: "Complex Reasoning" },
              { id: "gemini-3.5-flash", label: "Gemini 3.5 Flash", desc: "General Workhorse" },
              { id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite", desc: "Fast Lightweight" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              id={`select-model-${m.id}`}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                selectedModel === m.id
                  ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                  : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
              }`}
            >
              <span>{m.label}</span>
              <span className="text-[10px] opacity-70 hidden sm:inline">({m.desc})</span>
            </button>
          ))}
        </div>

        {/* Persona Selection & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Role:
          </span>
          <select
            id="chat-persona-select"
            value={selectedPersona}
            onChange={(e) => setSelectedPersona(e.target.value as AssistantPersona)}
            className="bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            <option value="assistant">Personal Assistant</option>
            <option value="architect">Systems Architect</option>
            <option value="security">Security Officer</option>
            <option value="creative">Creative Director</option>
            <option value="researcher">Research Analyst</option>
          </select>

          <button
            id="clear-chat-history-btn"
            onClick={clearChat}
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            title="Reset Conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl h-[540px] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed transition ${
                  msg.role === "user"
                    ? "bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/10"
                    : "bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1.5 text-[11px] opacity-70">
                  <span className="font-semibold">
                    {msg.role === "user" ? "Owner" : assistantName}
                  </span>
                  <div className="flex items-center gap-2 font-mono">
                    {msg.modelUsed && <span>{msg.modelUsed}</span>}
                    {msg.latencyMs && <span>{msg.latencyMs}ms</span>}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                <div className="whitespace-pre-line font-sans">{msg.text}</div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-zinc-800/40">
                  <button
                    onClick={() => copyMessage(msg.id, msg.text)}
                    className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3.5 items-center">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs text-zinc-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>{assistantName} is thinking via {selectedModel}...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="pt-4 border-t border-zinc-800/80 flex gap-2"
        >
          <input
            id="chat-turn-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${assistantName} using ${selectedModel} in ${selectedPersona} mode...`}
            className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
          />
          <button
            id="send-chat-turn-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-sky-600/20"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
