const fs = require('fs');

const visualizerCode = `
import { useEffect, useRef, useState as useState2 } from "react";

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
`;

let code = fs.readFileSync('src/components/GlobalVoiceAssistant.tsx', 'utf8');

if (!code.includes('AudioVisualizer')) {
    // Insert after imports
    const importMatch = code.match(/import.*?;\n(?!import)/s);
    if (importMatch) {
        const insertIndex = importMatch.index + importMatch[0].length;
        code = code.slice(0, insertIndex) + '\n' + visualizerCode + '\n' + code.slice(insertIndex);
    }

    // Insert visualizer in UI
    const searchUI = '{isListeningForCommand && (' +
            '\n            <div className="px-3 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2">' +
            '\n              <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />' +
            '\n              Active' +
            '\n            </div>' +
            '\n          )}';
          
    const replacementUI = '{isListeningForCommand && (' +
            '\n            <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-sky-500/50 text-sky-300 text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20">' +
            '\n              <AudioVisualizer isActive={isListeningForCommand} />' +
            '\n            </div>' +
            '\n          )}';

    code = code.replace(searchUI, replacementUI);
    fs.writeFileSync('src/components/GlobalVoiceAssistant.tsx', code);
    console.log("Visualizer added!");
} else {
    console.log("Visualizer already exists");
}
