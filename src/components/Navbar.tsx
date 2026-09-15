import React from "react";
import { PWAInstallButton } from "./PWAInstallButton";
import {
  Shield,
  ShieldAlert,
  MicOff,
  Laptop,
  Monitor,
  Terminal,
  Smartphone,
  Globe,
  Radio,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  CloudCheck,
  Lock,
  Key
} from "lucide-react";
import { AssistantSettings, Platform } from "../types";
import { User } from "../lib/firebase";
import { AssistantLogo } from "./AssistantLogo";

interface NavbarProps {
  settings: AssistantSettings;
  activePlatform: Platform;
  currentUser: User | null;
  onChangePlatform: (p: Platform) => void;
  onTogglePrivacy: () => void;
  onChangePermissionLevel: (level: number) => void;
  onOpenLiveVoice: () => void;
  onLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  activePlatform,
  currentUser,
  onChangePlatform,
  onTogglePrivacy,
  onChangePermissionLevel,
  onOpenLiveVoice,
  onLogin,
  onLogout,
}) => {
  const platforms: { key: Platform; label: string; icon: React.ReactNode }[] = [
    { key: "macOS", label: "macOS", icon: <Laptop className="w-3.5 h-3.5" /> },
    { key: "Windows", label: "Windows", icon: <Monitor className="w-3.5 h-3.5" /> },
    { key: "Linux", label: "Linux", icon: <Terminal className="w-3.5 h-3.5" /> },
    { key: "Android", label: "Android", icon: <Smartphone className="w-3.5 h-3.5" /> },
    { key: "Web", label: "Web", icon: <Globe className="w-3.5 h-3.5" /> },
  ];

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 bg-zinc-950/90 border-b border-zinc-800 backdrop-blur-md px-4 lg:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Assistant Identity */}
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
            <AssistantLogo className="w-10 h-10 transition-transform duration-300 group-hover:scale-105" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-950" title="System Operational & Core Online" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-zinc-100 tracking-tight">
                {settings.assistantName}
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Cross-Platform Core
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Personal AI Assistant &bull; Owner: {currentUser?.displayName || settings.ownerName}
            </p>
          </div>
        </div>

        {/* Center: Target Device Platform Picker */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <span className="text-[11px] text-zinc-400 font-medium px-2 hidden sm:inline">
            Target OS:
          </span>
          {platforms.map((p) => (
            <button
              key={p.key}
              id={`platform-btn-${p.key.toLowerCase()}`}
              onClick={() => onChangePlatform(p.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition ${
                activePlatform === p.key
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
              }`}
              title={`Switch active target to ${p.label}`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Right Controls: Live Voice, Permission Selector, Privacy Killswitch, Auth */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Voice API Trigger */}
          <button
            id="open-live-voice-modal-btn"
            onClick={onOpenLiveVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition cursor-pointer"
            title="Start real-time audio conversation via Gemini 3.1 Live API"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-sky-200" />
            <span>Live Voice</span>
          </button>

          {/* Permission Level Selector */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition border ${
              settings.currentPermissionLevel === 5
                ? "bg-rose-950/40 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-950/50 ring-1 ring-rose-500/30"
                : "bg-zinc-900 border border-zinc-800 text-zinc-200"
            }`}
          >
            {settings.currentPermissionLevel === 5 ? (
              <Lock className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Shield className="w-3.5 h-3.5 text-amber-400" />
            )}
            <select
              id="navbar-permission-selector"
              value={settings.currentPermissionLevel || 3}
              onChange={(e) => onChangePermissionLevel(Number(e.target.value))}
              aria-label="Current Permission Level"
              className="bg-transparent font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value={1} className="bg-zinc-900 text-zinc-200">
                Lvl 1 (Read-Only)
              </option>
              <option value={2} className="bg-zinc-900 text-zinc-200">
                Lvl 2 (Basic)
              </option>
              <option value={3} className="bg-zinc-900 text-zinc-200">
                Lvl 3 (Standard)
              </option>
              <option value={4} className="bg-zinc-900 text-zinc-200">
                Lvl 4 (Sensitive)
              </option>
              <option value={5} className="bg-zinc-900 text-rose-300 font-bold">
                Lvl 5 (Root Admin)
              </option>
            </select>
          </div>

          {/* Privacy Mode Killswitch */}
          <button
            id="privacy-mode-toggle-btn"
            onClick={onTogglePrivacy}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shadow-sm ${
              settings.privacyMode
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-rose-500/10 animate-pulse"
                : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
            }`}
            title="Privacy Mode: Hardware killswitch disabling microphone and sensor collection"
          >
            {settings.privacyMode ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Privacy: ON</span>
              </>
            ) : (
              <>
                <MicOff className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline">Privacy</span>
              </>
            )}
          </button>
          
          <PWAInstallButton />

          {/* Firebase Authentication Button & Profile */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-800">
              <div
                className="flex items-center gap-2 px-2 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300"
                title={`Signed in as ${currentUser.email} • Firestore Synced`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "User"}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-sky-400" />
                )}
                <span className="font-medium hidden md:inline truncate max-w-[100px]">
                  {currentUser.displayName || currentUser.email?.split("@")[0]}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Firestore Connected" />
              </div>
              <button
                id="sign-out-btn"
                onClick={onLogout}
                className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="google-sign-in-btn"
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 transition"
              title="Sign in with Google to sync assistant settings and media to Firebase Firestore"
            >
              <LogIn className="w-3.5 h-3.5 text-sky-400" />
              <span>Google Sign-In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

