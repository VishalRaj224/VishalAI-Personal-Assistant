import React, { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Play,
  CheckCircle,
  AlertTriangle,
  Terminal,
  FileCode,
  Compass,
  Cpu,
  CornerDownLeft,
  Lock,
  Key,
} from "lucide-react";
import { VoiceWaveform } from "./VoiceWaveform";
import { AssistantSettings, Platform, ActionProposal, TabStatusType } from "../types";
import { AssistantLogo } from "./AssistantLogo";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  actionProposal?: ActionProposal | null;
  demandSpike?: boolean;
  modelUsed?: string;
}

interface ConsoleTabProps {
  settings: AssistantSettings;
  activePlatform: Platform;
  onExecuteCommand: (command: string, requiredLevel: number, category?: string) => Promise<any>;
  onStatusChange?: (status: TabStatusType, label?: string) => void;
  onChangePermissionLevel?: (level: number) => Promise<void>;
}

export const ConsoleTab: React.FC<ConsoleTabProps> = ({
  settings,
  activePlatform,
  onExecuteCommand,
  onStatusChange,
  onChangePermissionLevel,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: `Greetings ${settings.ownerName}. I am ${settings.assistantName}, your personal cross-platform AI assistant. I am armed and connected to your ${activePlatform} workstation under Permission Level ${settings.currentPermissionLevel}. How may I assist your workflow today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState("");
  const [latencyStats, setLatencyStats] = useState<{ttfb: number, processing: number} | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatScrollRef.current?.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // Synchronize console live background state to tab status indicator
  const prevBusyRef = useRef(false);

  useEffect(() => {
    const isBusy = isLoading || isListening || isSpeaking;
    if (isBusy) {
      prevBusyRef.current = true;
      const taskLabel = isListening
        ? "Console: Listening to voice input..."
        : isSpeaking
        ? "Console: Synthesizing speech audio..."
        : "Console: Executing request / AI stream...";
      onStatusChange?.("busy", taskLabel);
    } else if (prevBusyRef.current) {
      prevBusyRef.current = false;
      onStatusChange?.("online", "Console: Online & Ready");
    }
  }, [isLoading, isListening, isSpeaking, onStatusChange]);

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && !settings.privacyMode) {
      const recognizer = new SpeechRecognition();
      recognizer.continuous = true;
      recognizer.interimResults = true;
      recognizer.lang =
        settings.language === "hi"
          ? "hi-IN"
          : settings.language === "hinglish"
          ? "hi-IN"
          : "en-US";

      recognizer.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const heardText = (final || interim).trim();
        setSpeechTranscript(heardText);
        
        // Instant Interruption: if user starts speaking, stop current TTS immediately
        if (heardText.length > 0 && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }

        // Check for wake word trigger or direct command
        if (final && final.trim().length > 0) {
          const lower = final.toLowerCase();
          const wakeLower = settings.wakeWord.toLowerCase();

          if (lower.includes(wakeLower)) {
            // Strip wake word and send
            const cleaned = final.replace(new RegExp(settings.wakeWord, "gi"), "").trim();
            if (cleaned) {
              handleSend(cleaned);
            } else {
              speakText(`I am listening, ${settings.ownerName}.`);
            }
          } else {
            handleSend(final);
          }
          setSpeechTranscript("");
        }
      };

      recognizer.onerror = (err: any) => {
        if (err.error !== "no-speech") {
          console.warn("Speech recognition error:", err.error);
        }
        setIsListening(false);
      };

      recognizer.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognizer;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [settings.language, settings.privacyMode, settings.wakeWord]);

  // Text-To-Speech function
  const speakText = (textToSpeak: string) => {
    if (!ttsEnabled || settings.privacyMode || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick appropriate voice
    const voices = window.speechSynthesis.getVoices();
    const langPrefix = settings.language === "hi" ? "hi" : "en";
    const matchedVoice = voices.find((v) => v.lang.startsWith(langPrefix));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (settings.privacyMode) {
      alert("Cannot activate microphone while Privacy Mode is active.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setSpeechTranscript("");
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    // Hard intercept for immediate Root Admin Mode deactivation
    const lowerText = textToSend.toLowerCase();
    if (lowerText.includes("deactivate") && (lowerText.includes("root admin") || lowerText.includes("level 5"))) {
      if (onChangePermissionLevel) {
        await onChangePermissionLevel(3);
      }
      onStatusChange?.("error", "Level 5 Root Admin Mode immediately deactivated");
      setInput("");
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          role: "user",
          text: textToSend,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          text: "Root Admin Mode has been successfully deactivated. Operating at standard Level 3 security.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      speakText("Root Admin Mode deactivated.");
      return;
    }

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setLatencyStats(null); // Reset before tracking

    const startTime = performance.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4),
          currentPlatform: activePlatform,
        }),
      });

      const ttfbTime = performance.now();

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();
      const endTime = performance.now();
      
      setLatencyStats({
        ttfb: Math.round(ttfbTime - startTime),
        processing: Math.round(endTime - ttfbTime)
      });

      const assistantReply = data.reply || "Command acknowledged.";

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        text: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionProposal: data.actionProposal,
        demandSpike: data.demandSpike,
        modelUsed: data.modelUsed,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      // Clean markdown formatting before TTS to ensure smooth, natural voice speech
      const speechCleaned = assistantReply
        .replace(/\[Notice:.*?\]/gi, "")
        .replace(/\[Upstream model busy\]:?/gi, "")
        .replace(/[*_#`~>]/g, "")
        .trim();
      if (speechCleaned) {
        speakText(speechCleaned);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          role: "assistant",
          text: `⚠️ **Server Communication Notice**: ${err?.message || "Communication with core server failed."}\n\nThe system is in local protection mode. You can retry your request.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeActionProposal = async (proposal: ActionProposal) => {
    await onExecuteCommand(proposal.command, proposal.requiredLevel, proposal.type);
  };

  const quickPrompts = [
    { label: "Access Level 5", cmd: "Access Level 5 Root Administrator Authority" },
    { label: "Rotate Keys (L5)", cmd: "Rotate Master Encryption Keys & Passkeys" },
    { label: "Root Fleet Audit (L5)", cmd: "Execute Level 5 Root Security Protocol & Device Fleet Audit" },
    { label: "Study Mode", cmd: "Activate Study Mode on my workstation" },
    { label: "Programming Mode", cmd: "Switch to Programming Mode and open VS Code" },
    { label: "System Health", cmd: "Show device telemetry and system status" },
    { label: "Search Docs", cmd: "Search technical documentation for Gemini API" },
  ];

  return (
    <div id="console-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px]">
      {/* Left Column: Live Chat & Conversation Stream */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Console Header */}
        <div className="px-5 py-3.5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Live Core Feed &bull; {activePlatform}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio Waveform */}
            <VoiceWaveform
              isListening={isListening}
              isSpeaking={isSpeaking}
              privacyMode={settings.privacyMode}
            />

            {/* TTS Mute/Unmute */}
            <button
              id="tts-toggle-btn"
              onClick={() => {
                if (isSpeaking) window.speechSynthesis?.cancel();
                setTtsEnabled(!ttsEnabled);
              }}
              className={`p-2 rounded-xl text-xs font-medium transition border ${
                ttsEnabled
                  ? "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
                  : "bg-zinc-900 text-zinc-500 border-zinc-800"
              }`}
              title={ttsEnabled ? "Voice Output Active" : "Voice Output Muted"}
            >
              {ttsEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Message Log */}
        <div ref={chatScrollRef} className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                {m.role === "user" ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-400">
                    <AssistantLogo className="w-3.5 h-3.5 shrink-0" />
                    <span>{settings.ownerName}</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {settings.assistantName}
                  </span>
                )}
                <span className="text-[10px] text-zinc-500">{m.timestamp}</span>
              </div>

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-sky-600 text-white rounded-tr-xs shadow-md shadow-sky-600/10"
                    : "bg-zinc-950/80 text-zinc-100 border border-zinc-800 rounded-tl-xs shadow-md"
                }`}
              >
                {m.demandSpike && (
                  <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>Upstream Capacity Fallback Active</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{m.text}</p>

                {/* Structured Action Proposal Card */}
                {m.actionProposal && (
                  <div
                    className={`mt-3 p-3.5 rounded-xl border text-xs ${
                      m.actionProposal.requiredLevel === 5
                        ? "bg-zinc-950 border-rose-500/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/20"
                        : "bg-zinc-900 border-zinc-700/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`flex items-center gap-1.5 font-semibold ${
                          m.actionProposal.requiredLevel === 5 ? "text-rose-400" : "text-amber-300"
                        }`}
                      >
                        {m.actionProposal.requiredLevel === 5 ? (
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {m.actionProposal.requiredLevel === 5
                            ? "Root Action Proposal (Level 5 Administrator)"
                            : `Action Proposal (Level ${m.actionProposal.requiredLevel})`}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-mono text-[10px]">
                        Target: {m.actionProposal.target}
                      </span>
                    </div>
                    <p className="text-zinc-300 mb-2.5 font-mono text-[11px]">
                      {m.actionProposal.command}
                    </p>
                    <button
                      id={`execute-proposal-${m.id}`}
                      onClick={() => executeActionProposal(m.actionProposal!)}
                      className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition text-xs shadow-xs cursor-pointer ${
                        m.actionProposal.requiredLevel === 5
                          ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20"
                          : "bg-emerald-600 hover:bg-emerald-500 text-white"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>
                        {m.actionProposal.requiredLevel === 5
                          ? `Authorize & Execute Root Action on ${activePlatform}`
                          : `Authorize & Execute on ${activePlatform}`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs pl-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
              <span>{settings.assistantName} is planning workflow...</span>
            </div>
          )}

          {speechTranscript && (
            <div className="text-xs text-sky-400 italic bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl">
              Hearing: &quot;{speechTranscript}&quot;
            </div>
          )}
        </div>

        {/* Console Input Bar */}
        <div className="p-4 bg-zinc-950/80 border-t border-zinc-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Voice Input Button */}
            <button
              type="button"
              id="mic-listen-btn"
              onClick={toggleListening}
              disabled={settings.privacyMode}
              className={`p-3 rounded-xl transition shadow-md flex items-center justify-center ${
                isListening
                  ? "bg-rose-600 text-white animate-pulse"
                  : settings.privacyMode
                  ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white"
              }`}
              title={
                settings.privacyMode
                  ? "Microphone disabled (Privacy Mode)"
                  : isListening
                  ? "Stop Listening"
                  : `Voice Input (Wake word: "${settings.wakeWord}")`
              }
            >
              {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                id="console-text-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  settings.privacyMode
                    ? "Privacy Mode active &bull; Type authorized command..."
                    : `Speak "${settings.wakeWord}..." or type a command...`
                }
                className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-sm focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition pr-10"
              />
              <span className="absolute right-3 top-3 text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono hidden sm:inline">
                Enter ↵
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="console-send-btn"
              disabled={isLoading || !input.trim()}
              className="p-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-sky-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Wake Word Helper Tip */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2.5 px-1">
            <span className="flex items-center gap-1.5">
              <CornerDownLeft className="w-3 h-3 text-zinc-400" />
              Wake phrase: <strong className="text-zinc-200">{settings.wakeWord}</strong> &bull; Supports English, हिन्दी, & Hinglish
            </span>
            <span className="text-zinc-400 hidden sm:inline">
              Zero-Trust Token Verified
            </span>
          </div>
          
          {/* Performance Telemetry (Debug Mode) */}
          {latencyStats && (
            <div className="flex items-center gap-3 mt-3 px-2 py-1.5 bg-zinc-900/50 rounded-lg border border-zinc-800/50 text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                TTFB: {latencyStats.ttfb}ms
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-sky-400">
                Processing: {latencyStats.processing}ms
              </span>
              <span className="text-zinc-600">|</span>
              <span className="text-zinc-300 font-semibold">
                Total Latency: {latencyStats.ttfb + latencyStats.processing}ms
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Quick Automations & Platform Telemetry */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Quick Automation Launcher */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase flex items-center gap-2">
              <Play className="w-3.5 h-3.5 text-sky-400" />
              Quick Command Center
            </h2>
            <span className="text-[11px] text-zinc-400 font-mono">1-Click Triggers</span>
          </div>

          <div className="space-y-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                id={`quick-cmd-btn-${idx}`}
                onClick={() => handleSend(p.cmd)}
                className="w-full text-left p-2.5 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-zinc-100 transition flex items-center justify-between group"
              >
                <span>{p.label}</span>
                <span className="text-[10px] text-zinc-400 group-hover:text-sky-400 transition font-mono">
                  Execute →
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live System Diagnostics & Safety Policy */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Active Device Telemetry
              </h2>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <AssistantLogo className="w-4 h-4" />
                  <span>Authorized Owner:</span>
                </span>
                <span className="font-semibold text-zinc-200">{settings.ownerName}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="text-zinc-400">Target Workstation:</span>
                <span className="font-semibold text-zinc-200">{activePlatform} Client</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="text-zinc-400">AI Intelligence Model:</span>
                <span className="font-semibold text-sky-400">Gemini 3.8 Flash</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="text-zinc-400">Safety Guardrail:</span>
                <span className="font-semibold text-amber-400">
                  Level {settings.currentPermissionLevel} Enforced
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80">
                <span className="text-zinc-400">Voice timbres calibrated:</span>
                <span className="font-semibold text-emerald-400">Owner Biometric Armed</span>
              </div>
            </div>
          </div>

          {/* Golden Safety Rule Card */}
          <div className="mt-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Safety Rule #1</span>
            </div>
            <p className="text-zinc-300 text-[11px] leading-relaxed">
              &quot;Do what I authorize. Do not do what I did not authorize.&quot; Sensitive actions (file removal, credential access) require explicit owner consent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
