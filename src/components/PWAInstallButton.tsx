import React, { useState } from 'react';
import { Download, MonitorSmartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-400 shadow-sm hover:bg-sky-500/20 transition-all"
        title="Install Vishal AI App"
      >
        <MonitorSmartphone className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl bg-zinc-800/50 border border-zinc-700/50 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install iOS App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                  <MonitorSmartphone className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">Install Vishal AI</h3>
              </div>
              
              <div className="space-y-4 text-sm text-zinc-300">
                <p>Install Vishal AI on your iPhone or iPad for a full-screen native experience:</p>
                <ol className="list-decimal pl-4 space-y-2 text-zinc-400">
                  <li>Tap the <strong>Share</strong> button <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-xs">↑</span> in the Safari toolbar.</li>
                  <li>Scroll down and tap <strong>Add to Home Screen</strong> <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-zinc-800 text-xs">+</span>.</li>
                </ol>
              </div>
              
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-zinc-800 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
