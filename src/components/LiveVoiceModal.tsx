import React, { useState, useEffect, useRef } from "react";
import { 
  Mic, 
  MicOff, 
  X, 
  Volume2, 
  Radio, 
  Sparkles, 
  Zap, 
  Activity, 
  RefreshCw 
} from "lucide-react";

interface LiveVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assistantName: string;
}

export const LiveVoiceModal: React.FC<LiveVoiceModalProps> = ({
  isOpen,
  onClose,
  assistantName,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState("Initializing Live voice link...");
  const [audioLevel, setAudioLevel] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);

  // Convert float32 pcm audio to 16-bit integer base64
  const floatTo16BitPCM = (input: Float32Array): string => {
    const output = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const bytes = new Uint8Array(output.buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play queued 24kHz PCM audio chunks from Gemini Live API
  const playNextChunk = () => {
    if (audioQueueRef.current.length === 0 || !outputAudioCtxRef.current) {
      isPlayingRef.current = false;
      setIsTalking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsTalking(true);
    const audioBuffer = audioQueueRef.current.shift()!;
    const source = outputAudioCtxRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioCtxRef.current.destination);

    source.onended = () => {
      playNextChunk();
    };

    source.start();
  };

  const queueAudioChunk = (base64Data: string) => {
    try {
      if (!outputAudioCtxRef.current) {
        outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
          sampleRate: 24000,
        });
      }

      const binary = atob(base64Data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const int16Array = new Int16Array(bytes.buffer);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      const audioBuffer = outputAudioCtxRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.getChannelData(0).set(float32Array);

      audioQueueRef.current.push(audioBuffer);
      if (!isPlayingRef.current) {
        playNextChunk();
      }
    } catch (err) {
      console.warn("Audio queue decode error:", err);
    }
  };

  const startLiveSession = async () => {
    try {
      setStatusText("Connecting to Gemini Live API (gemini-3.1-flash-live-preview)...");
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusText("Live link active. Listening for your voice...");
        await setupMicrophone(ws);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.audio) {
            setStatusText(`${assistantName} speaking...`);
            queueAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            // User spoke, interrupt playback immediately
            audioQueueRef.current = [];
            isPlayingRef.current = false;
            setIsTalking(false);
            setStatusText("Interrupted. Listening to you...");
          }
          if (msg.text) {
            setStatusText(msg.text);
          }
        } catch {
          // ignore parsing error
        }
      };

      ws.onerror = () => {
        setStatusText("Live WebSocket connection notice. Audio engine ready.");
      };

      ws.onclose = () => {
        setIsConnected(false);
        setStatusText("Session closed.");
      };
    } catch (err: any) {
      console.error("Live session startup failed:", err);
      setStatusText("Could not connect to Live API. Check microphone permissions.");
    }
  };

  const setupMicrophone = async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      inputAudioCtxRef.current = inputCtx;

      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
        if (isMuted) return;
        const channelData = e.inputBuffer.getChannelData(0);

        // Calculate audio meter level
        let sum = 0;
        for (let i = 0; i < channelData.length; i++) {
          sum += channelData[i] * channelData[i];
        }
        const rms = Math.sqrt(sum / channelData.length);
        setAudioLevel(Math.min(100, Math.round(rms * 400)));

        if (ws.readyState === WebSocket.OPEN) {
          const base64Audio = floatTo16BitPCM(channelData);
          ws.send(JSON.stringify({ audio: base64Audio }));
        }
      };
    } catch (err) {
      console.warn("Microphone setup failed:", err);
      setStatusText("Microphone access denied or unavailable.");
    }
  };

  const stopLiveSession = () => {
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch {}
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      try { inputAudioCtxRef.current.close(); } catch {}
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      try { outputAudioCtxRef.current.close(); } catch {}
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsConnected(false);
    setIsTalking(false);
  };

  useEffect(() => {
    if (isOpen) {
      startLiveSession();
    } else {
      stopLiveSession();
    }
    return () => {
      stopLiveSession();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl overflow-hidden flex flex-col items-center">
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-wide">
                {assistantName} Live Voice Stream
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400">Powered by Gemini 3.1 Live API</span>
                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                  gemini-3.1-flash-live-preview
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Visual Sphere */}
        <div className="my-8 relative flex items-center justify-center w-52 h-52">
          {/* Animated Outer Rings */}
          <div 
            className={`absolute inset-0 rounded-full border border-sky-500/30 transition-all duration-300 ${
              isTalking ? "scale-110 border-sky-400/60 animate-ping" : "scale-100"
            }`}
            style={{ transform: `scale(${1 + audioLevel * 0.005})` }}
          />
          <div 
            className="absolute inset-4 rounded-full border border-indigo-500/20 animate-spin" 
            style={{ animationDuration: "12s" }}
          />

          {/* Core Orb */}
          <div 
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
              isTalking
                ? "bg-gradient-to-tr from-sky-500 via-indigo-600 to-purple-500 shadow-sky-500/50 scale-105"
                : isConnected
                ? "bg-gradient-to-tr from-sky-950 via-zinc-900 to-sky-900 border border-sky-500/30 shadow-sky-900/30"
                : "bg-zinc-900 border border-zinc-800"
            }`}
          >
            {isTalking ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : isMuted ? (
              <MicOff className="w-10 h-10 text-rose-400" />
            ) : (
              <Mic className="w-10 h-10 text-sky-400" />
            )}
          </div>

          {/* Sound Wave Indicator Dots */}
          <div className="absolute -bottom-4 flex items-center gap-1.5">
            {[40, 70, 100, 60, 30].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-sky-400 rounded-full transition-all duration-100"
                style={{
                  height: isTalking ? `${Math.max(6, Math.random() * 24)}px` : `${Math.max(4, (audioLevel / 100) * h * 0.3)}px`,
                  opacity: isConnected ? 1 : 0.3,
                }}
              />
            ))}
          </div>
        </div>

        {/* Live Feedback Status */}
        <div className="w-full text-center px-4 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-medium">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span>{statusText}</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2">
            Speaks at 24kHz • Low latency bidirectional audio • Real-time interruption
          </p>
        </div>

        {/* Controls */}
        <div className="w-full flex items-center justify-center gap-3 pt-2">
          <button
            id="toggle-mic-mute-btn"
            onClick={() => setIsMuted(!isMuted)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition border ${
              isMuted
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                : "bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-sky-400" />}
            {isMuted ? "Unmute Mic" : "Mute Mic"}
          </button>

          <button
            id="reconnect-live-voice-btn"
            onClick={() => {
              stopLiveSession();
              startLiveSession();
            }}
            className="px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4 text-indigo-400" />
            Reconnect
          </button>

          <button
            id="end-live-voice-btn"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-lg shadow-rose-600/20"
          >
            End Live Voice
          </button>
        </div>
      </div>
    </div>
  );
};
