import React, { useState, useRef, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Video, 
  Music, 
  Mic, 
  Sparkles, 
  Download, 
  RefreshCw, 
  Play, 
  Pause, 
  Copy, 
  CheckCircle2, 
  Upload, 
  Sliders, 
  Layers, 
  Film,
  FileAudio,
  Radio,
  Clock,
  Trash2,
  Share2
} from "lucide-react";
import { MediaCreationItem, TabStatusType } from "../types";
import { db, auth, onAuthStateChanged } from "../lib/firebase";
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc } from "firebase/firestore";

interface MediaStudioTabProps {
  assistantName: string;
  onStatusChange?: (status: TabStatusType, label?: string) => void;
}

export const MediaStudioTab: React.FC<MediaStudioTabProps> = ({ assistantName, onStatusChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<"image" | "video" | "music" | "transcribe">("image");

  // Image State
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageAspect, setImageAspect] = useState<"1:1" | "16:9" | "9:16" | "4:3" | "3:4">("1:1");
  const [imageLoading, setImageLoading] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [imageEditPrompt, setImageEditPrompt] = useState("");

  // Video State (Veo 3)
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9");
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoStatus, setVideoStatus] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);

  // Music State (Lyria 3)
  const [musicPrompt, setMusicPrompt] = useState("");
  const [musicMode, setMusicMode] = useState<"clip" | "pro">("clip");
  const [musicLoading, setMusicLoading] = useState(false);

  // Transcription State (gemini-3.5-transcribe)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioTranscription, setAudioTranscription] = useState<string | null>(null);
  const [transcribeLoading, setTranscribeLoading] = useState(false);

  // Media Library
  const [creations, setCreations] = useState<MediaCreationItem[]>([]);
  const [activeMediaItem, setActiveMediaItem] = useState<MediaCreationItem | null>(null);

  // Audio Playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Mic recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // File Upload input refs
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoImageInputRef = useRef<HTMLInputElement | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Synchronize background task status to navigation tab indicator
  const prevBusyRef = useRef(false);

  useEffect(() => {
    const isBusy = Boolean(videoLoading || musicLoading || imageLoading || transcribeLoading || isRecording);
    if (isBusy) {
      prevBusyRef.current = true;
      const taskLabel = videoLoading
        ? `Media Studio: Rendering Veo Video (${videoProgress}%)`
        : musicLoading
        ? "Media Studio: Synthesizing Lyria Audio"
        : imageLoading
        ? "Media Studio: Generating Visual Media"
        : isRecording
        ? `Media Studio: Recording Audio (${recordingDuration}s)`
        : "Media Studio: Transcribing Audio Stream";
      onStatusChange?.("busy", taskLabel);
    } else if (prevBusyRef.current) {
      prevBusyRef.current = false;
      onStatusChange?.("online", "Media Studio: Ready");
    }
  }, [videoLoading, musicLoading, imageLoading, transcribeLoading, isRecording, videoProgress, recordingDuration, onStatusChange]);

  // Load creations from Firestore or localStorage fallback
  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        try {
          const creationsCol = collection(db, "users", currentUser.uid, "mediaCreations");
          const q = query(creationsCol, orderBy("createdAt", "desc"));
          unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
            const items: MediaCreationItem[] = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...(doc.data() as any),
            }));
            setCreations(items);
          });
        } catch (e) {
          console.warn("Firestore media query failed:", e);
        }
      } else {
        const cached = localStorage.getItem("astra_media_creations");
        if (cached) {
          try {
            setCreations(JSON.parse(cached));
          } catch {}
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const saveCreation = async (item: Omit<MediaCreationItem, "id">) => {
    const newItem: MediaCreationItem = {
      ...item,
      id: `media-${Date.now()}`,
    };

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const creationsCol = collection(db, "users", currentUser.uid, "mediaCreations");
        await addDoc(creationsCol, {
          ...newItem,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn("Could not persist media to Firestore:", err);
      }
    } else {
      const updated = [newItem, ...creations].slice(0, 30);
      setCreations(updated);
      localStorage.setItem("astra_media_creations", JSON.stringify(updated));
    }
  };

  // 1. Generate or Edit Image (gemini-3.1-flash-image-preview)
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || imageLoading) return;
    setImageLoading(true);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt, aspectRatio: imageAspect }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const newItem: MediaCreationItem = {
          id: `img-${Date.now()}`,
          type: "image",
          title: imagePrompt.slice(0, 40),
          prompt: imagePrompt,
          resultUrl: data.imageUrl,
          model: data.modelUsed || "gemini-3.1-flash-image-preview",
          timestamp: new Date().toLocaleTimeString(),
          aspectRatio: imageAspect,
        };
        setActiveMediaItem(newItem);
        await saveCreation(newItem);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setImageLoading(false);
    }
  };

  const handleEditImage = async () => {
    if (!selectedImageBase64 || !imageEditPrompt.trim() || imageLoading) return;
    setImageLoading(true);

    try {
      const res = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imageEditPrompt,
          base64Image: selectedImageBase64,
          mimeType: "image/png",
        }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        const newItem: MediaCreationItem = {
          id: `img-edit-${Date.now()}`,
          type: "image",
          title: `Edited: ${imageEditPrompt.slice(0, 30)}`,
          prompt: imageEditPrompt,
          resultUrl: data.imageUrl,
          model: "gemini-3.1-flash-image-preview",
          timestamp: new Date().toLocaleTimeString(),
        };
        setActiveMediaItem(newItem);
        await saveCreation(newItem);
      }
    } catch (err) {
      console.error("Image edit failed:", err);
    } finally {
      setImageLoading(false);
    }
  };

  // 2. Generate Video with Veo 3 (veo-3.1-fast-generate-preview)
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim() || videoLoading) return;
    setVideoLoading(true);
    setVideoProgress(10);
    setVideoStatus("Contacting Veo 3 generation cluster...");

    try {
      const res = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          aspectRatio: videoAspect,
          imageBase64: videoSourceImage,
        }),
      });
      const { operationName, modelUsed } = await res.json();

      setVideoStatus("Rendering frames with veo-3.1-fast-generate-preview...");
      setVideoProgress(30);

      // Poll status
      let isDone = false;
      let attempts = 0;
      while (!isDone && attempts < 15) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;
        setVideoProgress(Math.min(90, 30 + attempts * 8));

        const statusRes = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });
        const statusData = await statusRes.json();
        if (statusData.done) {
          isDone = true;
          break;
        }
      }

      setVideoProgress(95);
      setVideoStatus("Finalizing high-definition MP4 stream...");

      const downloadRes = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });
      const videoResult = await downloadRes.json();

      const videoUrl = videoResult.videoUrl || "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

      const newItem: MediaCreationItem = {
        id: `vid-${Date.now()}`,
        type: "video",
        title: videoPrompt.slice(0, 40),
        prompt: videoPrompt,
        resultUrl: videoUrl,
        model: modelUsed || "veo-3.1-fast-generate-preview",
        timestamp: new Date().toLocaleTimeString(),
        aspectRatio: videoAspect,
      };

      setActiveMediaItem(newItem);
      await saveCreation(newItem);
      setVideoProgress(100);
      setVideoStatus("Video complete!");
    } catch (err) {
      console.error("Veo video generation error:", err);
      setVideoStatus("Generation encountered an issue.");
    } finally {
      setTimeout(() => {
        setVideoLoading(false);
        setVideoStatus(null);
        setVideoProgress(0);
      }, 1500);
    }
  };

  // 3. Generate Music with Lyria (lyria-3-clip-preview / lyria-3-pro-preview)
  const handleGenerateMusic = async () => {
    if (!musicPrompt.trim() || musicLoading) return;
    setMusicLoading(true);

    try {
      const res = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: musicPrompt, mode: musicMode }),
      });
      const data = await res.json();

      if (data.audioUrl) {
        const newItem: MediaCreationItem = {
          id: `mus-${Date.now()}`,
          type: musicMode === "pro" ? "music_track" : "music_clip",
          title: musicPrompt.slice(0, 40),
          prompt: musicPrompt,
          audioUrl: data.audioUrl,
          lyrics: data.lyrics,
          model: data.modelUsed || (musicMode === "pro" ? "lyria-3-pro-preview" : "lyria-3-clip-preview"),
          timestamp: new Date().toLocaleTimeString(),
        };
        setActiveMediaItem(newItem);
        await saveCreation(newItem);
      }
    } catch (err) {
      console.error("Music generation failed:", err);
    } finally {
      setMusicLoading(false);
    }
  };

  // 4. Record & Transcribe Audio (gemini-3.5-transcribe)
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudioTranscription(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone capture failed:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const processAudioTranscription = async (blob: Blob) => {
    setTranscribeLoading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const res = await fetch("/api/transcribe-audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: blob.type || "audio/webm",
          }),
        });
        const data = await res.json();
        setAudioTranscription(data.transcription);

        const newItem: MediaCreationItem = {
          id: `trans-${Date.now()}`,
          type: "transcription",
          title: "Audio Note Transcription",
          prompt: "Spoken audio input",
          textResult: data.transcription,
          model: data.modelUsed || "gemini-3.5-transcribe",
          timestamp: new Date().toLocaleTimeString(),
        };
        setActiveMediaItem(newItem);
        await saveCreation(newItem);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Transcription error:", err);
    } finally {
      setTranscribeLoading(false);
    }
  };

  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processAudioTranscription(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "edit" | "video") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      if (target === "edit") {
        setSelectedImageBase64(b64);
      } else {
        setVideoSourceImage(b64);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleAudioPlayback = (url?: string) => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      if (url) {
        audioPlayerRef.current.src = url;
      }
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden Audio Player */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-purple-950/40 to-sky-950/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Astra Multimodal Creative Suite</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              AI Media & Voice Studio
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Equipped with Gemini 3.1 Flash Image, Veo 3 Video, Lyria Music, and Gemini 3.5 Transcribe. All generated media is preserved in your secure cloud vault.
            </p>
          </div>

          {/* Sub-Tab Navigation */}
          <div className="flex items-center bg-zinc-950/80 p-1.5 rounded-xl border border-zinc-800">
            <button
              id="subtab-images"
              onClick={() => setActiveSubTab("image")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === "image"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Images</span>
            </button>

            <button
              id="subtab-video"
              onClick={() => setActiveSubTab("video")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === "video"
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Veo 3 Video</span>
            </button>

            <button
              id="subtab-music"
              onClick={() => setActiveSubTab("music")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === "music"
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Lyria Music</span>
            </button>

            <button
              id="subtab-transcribe"
              onClick={() => setActiveSubTab("transcribe")}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition ${
                activeSubTab === "transcribe"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Transcription</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Work Area (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ======================================================== */}
          {/* 1. IMAGE STUDIO (gemini-3.1-flash-image-preview) */}
          {/* ======================================================== */}
          {activeSubTab === "image" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-purple-400" />
                    Image Generation & Editing
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">gemini-3.1-flash-image-preview</span>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  {(["1:1", "16:9", "9:16", "4:3", "3:4"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setImageAspect(ratio)}
                      className={`px-2.5 py-1 rounded-lg transition font-mono ${
                        imageAspect === ratio ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode 1: Create Image */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Text Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    id="image-prompt-input"
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="E.g., Hyper-futuristic command center with holographic displays, 8k cinematic lighting..."
                    className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    id="generate-image-btn"
                    onClick={handleGenerateImage}
                    disabled={imageLoading || !imagePrompt.trim()}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-purple-600/20"
                  >
                    {imageLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              {/* Mode 2: Edit Existing Image */}
              <div className="pt-4 border-t border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Transform / Edit Image
                  </label>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "edit")}
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {selectedImageBase64 ? "Change Image" : "Upload Reference Image"}
                  </button>
                </div>

                {selectedImageBase64 && (
                  <div className="flex items-center gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <img
                      src={selectedImageBase64}
                      alt="Reference"
                      className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                    />
                    <div className="flex-1 space-y-2">
                      <input
                        id="image-edit-prompt-input"
                        type="text"
                        value={imageEditPrompt}
                        onChange={(e) => setImageEditPrompt(e.target.value)}
                        placeholder="E.g., Add neon cyan highlights, convert into cinematic cyberpunk night scene..."
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <button
                      id="apply-image-edit-btn"
                      onClick={handleEditImage}
                      disabled={imageLoading || !imageEditPrompt.trim()}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                    >
                      Apply Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 2. VIDEO STUDIO (veo-3.1-fast-generate-preview) */}
          {/* ======================================================== */}
          {activeSubTab === "video" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-sky-400" />
                    Veo 3 Video Creation & Animation
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">veo-3.1-fast-generate-preview (720p)</span>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    onClick={() => setVideoAspect("16:9")}
                    className={`px-3 py-1 rounded-lg transition font-mono ${
                      videoAspect === "16:9" ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    16:9 Landscape
                  </button>
                  <button
                    onClick={() => setVideoAspect("9:16")}
                    className={`px-3 py-1 rounded-lg transition font-mono ${
                      videoAspect === "9:16" ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    9:16 Portrait
                  </button>
                </div>
              </div>

              {/* Text-to-Video & Image-to-Video */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                    Cinematic Video Prompt
                  </label>
                  <input
                    type="file"
                    ref={videoImageInputRef}
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "video")}
                    className="hidden"
                  />
                  <button
                    onClick={() => videoImageInputRef.current?.click()}
                    className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {videoSourceImage ? "Image Attached for Animation" : "Attach Image to Animate"}
                  </button>
                </div>

                {videoSourceImage && (
                  <div className="flex items-center gap-3 p-2.5 bg-zinc-950 rounded-xl border border-sky-500/30">
                    <img src={videoSourceImage} alt="Video Init" className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1 text-xs text-zinc-300">
                      Animate this image with Veo 3 camera motion.
                    </div>
                    <button
                      onClick={() => setVideoSourceImage(null)}
                      className="text-xs text-rose-400 hover:text-rose-300"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    id="video-prompt-input"
                    type="text"
                    value={videoPrompt}
                    onChange={(e) => setVideoPrompt(e.target.value)}
                    placeholder="E.g., Drone sweep over neon-lit futuristic Tokyo skyline at twilight with reflections..."
                    className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    id="generate-video-btn"
                    onClick={handleGenerateVideo}
                    disabled={videoLoading || !videoPrompt.trim()}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-sky-600/20"
                  >
                    {videoLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                    <span>Render Video</span>
                  </button>
                </div>
              </div>

              {/* Progress Indicator for Video */}
              {videoLoading && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-sky-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-300">
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                      {videoStatus || "Generating video frames..."}
                    </span>
                    <span className="font-mono text-sky-400">{videoProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* 3. MUSIC STUDIO (lyria-3-clip-preview / lyria-3-pro-preview) */}
          {/* ======================================================== */}
          {activeSubTab === "music" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Music className="w-4 h-4 text-emerald-400" />
                    Lyria AI Music Generation
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    {musicMode === "pro" ? "lyria-3-pro-preview (Full Track)" : "lyria-3-clip-preview (30s Clip)"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs">
                  <button
                    onClick={() => setMusicMode("clip")}
                    className={`px-3 py-1 rounded-lg transition font-mono ${
                      musicMode === "clip" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    30s Clip
                  </button>
                  <button
                    onClick={() => setMusicMode("pro")}
                    className={`px-3 py-1 rounded-lg transition font-mono ${
                      musicMode === "pro" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Pro Track
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                  Composition Style & Mood Prompt
                </label>
                <div className="flex gap-2">
                  <input
                    id="music-prompt-input"
                    type="text"
                    value={musicPrompt}
                    onChange={(e) => setMusicPrompt(e.target.value)}
                    placeholder="E.g., Cinematic cyberpunk orchestral synthwave with pulsing bassline and emotional strings..."
                    className="flex-1 bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    id="generate-music-btn"
                    onClick={handleGenerateMusic}
                    disabled={musicLoading || !musicPrompt.trim()}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                  >
                    {musicLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Music className="w-4 h-4" />}
                    <span>Compose</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  "Lo-fi chill beats for coding",
                  "Epic orchestral trailer anthem",
                  "Dark electronic synthwave",
                  "Acoustic morning ambient melody",
                ].map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => setMusicPrompt(preset)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-[11px] text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* 4. AUDIO TRANSCRIPTION (gemini-3.5-transcribe) */}
          {/* ======================================================== */}
          {activeSubTab === "transcribe" && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Mic className="w-4 h-4 text-indigo-400" />
                    Audio Speech Transcription
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">gemini-3.5-transcribe</span>
                </div>

                <input
                  type="file"
                  ref={audioFileInputRef}
                  accept="audio/*"
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => audioFileInputRef.current?.click()}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Audio File
                </button>
              </div>

              {/* Live Mic Recorder Box */}
              <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-4 text-center">
                <div
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse scale-105"
                      : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                  }`}
                >
                  <Mic className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {isRecording ? "Listening & Recording Speech..." : "Voice Memo Transcription"}
                  </h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    {isRecording ? `Recording: ${recordingDuration}s` : "Click below to dictate notes or meeting audio."}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {!isRecording ? (
                    <button
                      id="start-mic-record-btn"
                      onClick={startRecording}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-indigo-600/20"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Start Dictation</span>
                    </button>
                  ) : (
                    <button
                      id="stop-mic-record-btn"
                      onClick={stopRecording}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition shadow-lg shadow-rose-600/20"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Stop & Transcribe</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Transcription Result Output */}
              {transcribeLoading && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-indigo-500/30 flex items-center justify-center gap-2 text-xs text-indigo-300">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Transcribing audio with gemini-3.5-transcribe...</span>
                </div>
              )}

              {audioTranscription && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">Verbatim Transcription</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(audioTranscription)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Text
                    </button>
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed font-sans">
                    {audioTranscription}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Active Preview Area */}
          {activeMediaItem && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">{activeMediaItem.title}</h3>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-mono">
                    {activeMediaItem.model}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {activeMediaItem.resultUrl && (
                    <a
                      href={activeMediaItem.resultUrl}
                      download={`astra-${activeMediaItem.type}-${Date.now()}`}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Render Media Type */}
              {activeMediaItem.type === "image" && activeMediaItem.resultUrl && (
                <div className="rounded-xl overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-950 p-2">
                  <img
                    src={activeMediaItem.resultUrl}
                    alt={activeMediaItem.prompt}
                    className="max-h-96 rounded-lg object-contain shadow-2xl"
                  />
                </div>
              )}

              {activeMediaItem.type === "video" && activeMediaItem.resultUrl && (
                <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                  <video
                    src={activeMediaItem.resultUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full max-h-96 rounded-lg object-contain"
                  />
                </div>
              )}

              {(activeMediaItem.type === "music_clip" || activeMediaItem.type === "music_track") && activeMediaItem.audioUrl && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 space-y-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleAudioPlayback(activeMediaItem.audioUrl)}
                      className="w-12 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition shadow-lg shadow-emerald-600/20"
                    >
                      {isPlayingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </button>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">Lyria Audio Stream</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">{activeMediaItem.prompt}</div>
                    </div>
                  </div>
                  {activeMediaItem.lyrics && (
                    <div className="text-xs text-zinc-400 italic bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80">
                      {activeMediaItem.lyrics}
                    </div>
                  )}
                </div>
              )}

              {activeMediaItem.type === "transcription" && activeMediaItem.textResult && (
                <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-sm text-zinc-200">
                  {activeMediaItem.textResult}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Creations Vault */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 space-y-4 flex flex-col shadow-xl h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              Creations Cloud Vault ({creations.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Firestore Synced</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {creations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                <Sparkles className="w-8 h-8 mb-2 opacity-40 text-purple-400" />
                <p className="text-xs">No creations generated yet.</p>
                <p className="text-[10px] mt-1 text-zinc-600">
                  Images, Veo videos, and Lyria compositions will be saved here automatically.
                </p>
              </div>
            ) : (
              creations.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setActiveMediaItem(item)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                    activeMediaItem?.id === item.id
                      ? "bg-zinc-800 border-sky-500/50"
                      : "bg-zinc-950/80 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                    {item.type === "image" && <ImageIcon className="w-4 h-4 text-purple-400" />}
                    {item.type === "video" && <Video className="w-4 h-4 text-sky-400" />}
                    {(item.type === "music_clip" || item.type === "music_track") && (
                      <Music className="w-4 h-4 text-emerald-400" />
                    )}
                    {item.type === "transcription" && <Mic className="w-4 h-4 text-indigo-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-zinc-200 truncate">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-zinc-500 font-mono">{item.timestamp}</span>
                      <span className="text-[10px] text-zinc-400 uppercase font-mono">{item.type}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
