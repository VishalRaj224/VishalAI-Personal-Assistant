import React, { useState, useEffect } from "react";
import { AlertTriangle, CheckCircle, X, ShieldAlert, Lock, Key } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  permissionLevel: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  permissionLevel,
  onConfirm,
  onCancel,
}) => {
  const [passkeyVerified, setPasskeyVerified] = useState(true);

  // Reset verification state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setPasskeyVerified(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isLevel5 = permissionLevel === 5;

  return (
    <div
      id="confirmation-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-200"
    >
      <div
        id="confirmation-modal-container"
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl text-zinc-100 relative ${
          isLevel5
            ? "bg-zinc-950 border border-rose-500/50 shadow-rose-950/40 ring-1 ring-rose-500/30"
            : "bg-zinc-900 border border-amber-500/30 shadow-amber-950/30"
        }`}
      >
        <button
          id="confirmation-modal-close-btn"
          onClick={onCancel}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isLevel5
                ? "bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-sm shadow-rose-500/20"
                : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
            }`}
          >
            {isLevel5 ? <Lock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-md border ${
                  isLevel5
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                }`}
              >
                {isLevel5 ? "Level 5: Root Administrator Authority" : `Level ${permissionLevel} Required`}
              </span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-4 leading-relaxed bg-zinc-900/90 p-3.5 rounded-xl border border-zinc-800 font-mono text-xs">
          {message}
        </p>

        {isLevel5 ? (
          <div className="mb-6 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-xs text-rose-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Root Administrator Privilege Authorization</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Level 5 operations bypass sandbox constraints and modify master security vaults. Verification confirms owner authorization.
            </p>
            <label className="flex items-center gap-2 pt-1 cursor-pointer select-none text-zinc-300 text-[11px]">
              <input
                type="checkbox"
                checked={passkeyVerified}
                onChange={(e) => setPasskeyVerified(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 text-rose-500 focus:ring-rose-500"
              />
              <span className="flex items-center gap-1">
                <Key className="w-3 h-3 text-rose-400" />
                <span>Authorize with Owner Root Passkey</span>
              </span>
            </label>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 mb-6 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Mandatory Owner Authorization Rule enforced</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            id="confirmation-cancel-btn"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition"
          >
            Cancel Action
          </button>
          <button
            id="confirmation-approve-btn"
            onClick={onConfirm}
            disabled={isLevel5 && !passkeyVerified}
            className={`px-5 py-2 text-sm font-semibold rounded-xl flex items-center gap-2 transition shadow-md ${
              isLevel5
                ? "bg-rose-600 hover:bg-rose-500 text-white disabled:opacity-40 disabled:hover:bg-rose-600 cursor-pointer"
                : "bg-amber-600 hover:bg-amber-500 text-zinc-950 cursor-pointer"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isLevel5 ? "Authorize Level 5 Root Action" : "Authorize & Execute"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
