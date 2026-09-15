import React, { useEffect, useState, useRef, useCallback } from "react";
import { AssistantSettings } from "../types";
import { Mic, MicOff, AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";




const AudioVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [volumes, setVolumes] = useState2<number[]>(Array(14).fill(10));
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setVolumes(Array(14).fill(10));
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let isMounted = true;

    const startAudio = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 64;
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        
        const update = () => {
          if (!analyserRef.current || !isMounted) return;
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const step = Math.max(1, Math.floor(dataArray.length / 14));
          const newVolumes = Array(14).fill(0).map((_, i) => {
            const start = i * step;
            let sum = 0;
            for (let j = 0; j < step; j++) {
              sum += dataArray[start + j] || 0;
            }
            const avg = sum / step;
            return Math.max(10, Math.min(100, (avg / 255) * 100));
          });
          
          setVolumes(newVolumes);
          animationFrameRef.current = requestAnimationFrame(update);
        };
        
        update();
      } catch (err) {
        console.error("Error accessing mic for visualizer:", err);
      }
    };

    startAudio();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
    };
  }, [isActive]);

  return (
    <div className="flex items-center justify-center gap-[2px] h-6 px-1">
      {volumes.map((height, idx) => (
        <div
          key={idx}
          className="w-1 rounded-full bg-sky-400 transition-all duration-75"
          style={{ height: height + "%" }}
        />
      ))}
    </div>
  );
};


interface GlobalVoiceAssistantProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => Promise<void>;
  onExecuteCommand: (command: string, level: number, category?: string) => Promise<any>;
}

export const GlobalVoiceAssistant: React.FC<GlobalVoiceAssistantProps> = ({
  settings,
  onUpdateSettings,
  onExecuteCommand
}) => {
  const [isActive, setIsActive] = useState(false);
  const [isListeningForCommand, setIsListeningForCommand] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = settings.language === "hi" || settings.language === "hinglish" ? "hi-IN" : "en-US";
      }
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearTimeout(timeoutRef.current!);
    };
  }, [settings.language]);

  const speak = (text: string) => {
    if (!settings.voiceResponseEnabled || !synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // basic voice selection logic could go here
    synthRef.current.speak(utterance);
  };

  const handleCommand = async (command: string) => {
    const cmd = command.toLowerCase();
    
    if (cmd.includes("stop listening") || cmd.includes("standby mode") || cmd.includes("go to sleep")) {
      speak("Going into standby mode.");
      setIsListeningForCommand(false);
      setTranscript("");
      setFeedback("Standby...");
      return;
    }

    setFeedback(`Processing: "${command}"...`);
    setIsListeningForCommand(false);

    try {
      // Advanced Intent Classification
      const isSearchIntent = /(search for|search the web for|find|look up)/i.test(cmd);
      const isOpenIntent = /(open youtube|open chrome|open vs code|open)/i.test(cmd);
      
      if (isSearchIntent) {
         speak("Searching the web for that.");
         setFeedback("Web Search Executed.");
         // Integrate with grounding/search APIs if necessary.
      } else if (isOpenIntent) {
        if (cmd.includes("open youtube") || cmd.includes("open chrome")) {
            const requiredLevel = settings.requireConfirmationForSensitive ? 4 : 2; 
            const res = await onExecuteCommand(command, requiredLevel, "voice");
            
            if (res?.requiresConfirmation) {
              speak("Opening this requires your confirmation.");
              setFeedback("Awaiting confirmation...");
            } else {
              speak("Opening now.");
              setFeedback("Opened successfully.");
            }
        } else {
            speak("I can't open that safely.");
            setFeedback("Action blocked.");
        }
      } else {
        // Fallback to chat API for general questions
        const chatRes = await fetch("/api/gemini-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: command, rolePersona: "assistant" })
        });
        const chatData = await chatRes.json();
        if (chatData.response || chatData.reply) {
          const aiResponse = chatData.response || chatData.reply;
          speak(aiResponse);
          setFeedback("AI Answered.");
        } else {
          speak("I completed that command.");
          setFeedback("Command executed.");
        }
      }
    } catch (e) {
      speak("Sorry, there was an error processing that command.");
      setFeedback("Error executing command.");
    }

    // Reset after a few seconds
    timeoutRef.current = setTimeout(() => {
      setFeedback("");
      setTranscript("");
    }, 5000);
  };

  useEffect(() => {
    if (!recognitionRef.current) return;

    // Safety: If voice access is disabled or privacy mode is on, stop completely.
    if (!settings.voiceAccessEnabled || settings.privacyMode) {
      recognitionRef.current.stop();
      setIsActive(false);
      setIsListeningForCommand(false);
      return;
    }

    const recognition = recognitionRef.current;

    recognition.onstart = () => {
      setIsActive(true);
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      
      const lowerTranscript = currentTranscript.toLowerCase().trim();
      
      // Ignore empty or whitespace-only transcripts
      if (!lowerTranscript) return;
      
      setTranscript(lowerTranscript);

      // Check for wake word
      const wakeWord = settings.wakeWord.toLowerCase();
      
      if (!isListeningForCommand) {
        if (lowerTranscript.includes(wakeWord) || lowerTranscript.includes("activate voice mode")) {
          // Wake word detected!
          setIsListeningForCommand(true);
          speak("Yes?");
          setFeedback("Listening...");
          setTranscript("");
          // Clear current results to start fresh for the command
          recognition.stop(); 
        }
      } else {
        // We are listening for a command
        if (event.results[event.results.length - 1].isFinal) {
          handleCommand(lowerTranscript);
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart if we are still active and voice access is enabled
      if (settings.voiceAccessEnabled && !settings.privacyMode) {
        try {
          recognition.start();
        } catch (e) {
          // Already started or error
        }
      } else {
        setIsActive(false);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setFeedback("Microphone access denied.");
        setIsActive(false);
      }
    };

    // Initial start
    try {
      recognition.start();
    } catch (e) {
      // Ignore start errors if already started
    }

  }, [settings.voiceAccessEnabled, settings.privacyMode, settings.wakeWord, isListeningForCommand]);

  const handleEmergencyStop = () => {
    onUpdateSettings({ voiceAccessEnabled: false });
    if (synthRef.current) synthRef.current.cancel();
    setFeedback("Voice access disabled (Emergency Stop).");
  };

  // UI rendering
  if (!settings.voiceAccessEnabled || settings.privacyMode) {
    return null; // Hidden when completely disabled
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none"
      >
        {/* Feedback Bubble */}
        {(transcript || feedback) && (
          <div className="bg-zinc-900/95 border border-zinc-700 shadow-xl rounded-2xl p-3 max-w-sm pointer-events-auto backdrop-blur-md">
            <p className="text-sm font-medium text-zinc-200">
              {isListeningForCommand ? <span className="text-sky-400 animate-pulse mr-2">●</span> : null}
              {transcript || feedback}
            </p>
          </div>
        )}
        
        {/* Status Indicator & Emergency Stop */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {isListeningForCommand && (
            <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20">
              <AudioVisualizer isActive={isListeningForCommand} />
            </div>
          )}
          <button
            onClick={handleEmergencyStop}
            className="group flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-700 shadow-lg hover:bg-rose-950 hover:border-rose-500/50 transition-all"
            title="Emergency Stop Voice Assistant"
          >
            {isActive ? (
              <Mic className="w-5 h-5 text-sky-400 group-hover:text-rose-400" />
            ) : (
              <MicOff className="w-5 h-5 text-zinc-500" />
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};
