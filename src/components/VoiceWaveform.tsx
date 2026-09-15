import React, { useEffect, useState } from "react";

interface VoiceWaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  privacyMode: boolean;
}

export const VoiceWaveform: React.FC<VoiceWaveformProps> = ({
  isListening,
  isSpeaking,
  privacyMode,
}) => {
  const [bars, setBars] = useState<number[]>([20, 35, 50, 65, 45, 30, 75, 40, 60, 25, 40, 55, 30, 20]);

  useEffect(() => {
    if (privacyMode || (!isListening && !isSpeaking)) {
      setBars(Array(14).fill(12));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array(14)
          .fill(0)
          .map(() => {
            if (isSpeaking) {
              return Math.floor(Math.random() * 65 + 30);
            }
            if (isListening) {
              return Math.floor(Math.random() * 45 + 15);
            }
            return 12;
          })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isListening, isSpeaking, privacyMode]);

  return (
    <div
      id="voice-waveform-container"
      className="flex items-center justify-center gap-1 h-12 px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-xs"
      aria-label="Audio Visualizer"
    >
      {bars.map((height, idx) => {
        let colorClass = "bg-zinc-600";
        if (privacyMode) {
          colorClass = "bg-rose-500/50";
        } else if (isSpeaking) {
          colorClass = "bg-emerald-400 shadow-sm shadow-emerald-400/30";
        } else if (isListening) {
          colorClass = "bg-sky-400 shadow-sm shadow-sky-400/30";
        }

        return (
          <div
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-100 ${colorClass}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
};
