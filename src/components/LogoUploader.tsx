import React, { useRef, useState } from "react";
import { Upload, CheckCircle2, Image as ImageIcon } from "lucide-react";

export const LogoUploader: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      // Create base64 representation to send to server
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result;
        
        const res = await fetch("/api/upload-logo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 })
        });
        
        if (res.ok) {
          setUploadSuccess(true);
          setTimeout(() => {
            window.location.reload(); // Reload to show new icons everywhere
          }, 1500);
        } else {
          console.error("Upload failed");
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20">
          <ImageIcon className="w-5 h-5 text-sky-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Official Assistant Logo</h3>
          <p className="text-xs text-zinc-400">Upload your personal AI brand icon.</p>
        </div>
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className="w-full h-32 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-sky-500 hover:bg-sky-500/5 transition group"
      >
        {isUploading ? (
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        ) : uploadSuccess ? (
          <div className="flex flex-col items-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8 mb-2" />
            <span className="text-xs font-semibold">Logo Updated & Resized</span>
          </div>
        ) : (
          <div className="flex flex-col items-center text-zinc-500 group-hover:text-sky-400 transition">
            <Upload className="w-8 h-8 mb-2" />
            <span className="text-xs font-semibold">Click to upload PNG/JPG</span>
          </div>
        )}
      </div>
      <input 
        type="file" 
        accept="image/png, image/jpeg, image/svg+xml" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange}
      />
      <p className="text-[10px] text-zinc-500 mt-3 text-center">
        The system will automatically resize this image for favicons, app icons, and avatars.
      </p>
    </div>
  );
};
