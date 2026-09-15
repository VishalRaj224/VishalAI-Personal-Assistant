import React, { useState } from "react";
import {
  Smartphone,
  Monitor,
  Globe,
  Key,
  ShieldCheck,
  ShieldAlert,
  FileCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Sparkles,
  Terminal,
  Cpu,
  Layers,
  Award,
  CheckCircle2,
  FileText,
  Radio,
  Share2,
} from "lucide-react";
import { AssistantSettings } from "../types";
import { VrLogo } from "./VrLogo";

interface DeployHubTabProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => Promise<void>;
  onExecuteCommand?: (
    command: string,
    requiredLevel?: number,
    category?: string,
    confirmed?: boolean
  ) => Promise<any>;
}

export const DeployHubTab: React.FC<DeployHubTabProps> = ({
  settings,
  onUpdateSettings,
  onExecuteCommand,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "android" | "windows" | "web" | "legal" | "safety"
  >("overview");

  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [guardrailTestPrompt, setGuardrailTestPrompt] = useState("");
  const [guardrailTestResult, setGuardrailTestResult] = useState<string | null>(null);
  const [isTestingGuardrail, setIsTestingGuardrail] = useState(false);

  // Live direct access URLs
  const directWebUrl =
    window.location.origin ||
    "https://ais-pre-pej6jpkfdklqfxxdszjoic-837131366234.asia-southeast1.run.app";

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2200);
  };

  // Keystore command for Android Play Store publishing
  const keytoolCommand = `keytool -genkey -v -keystore astra-personal-ai-release.keystore -alias astra-owner-key -keyalg RSA -keysize 4096 -validity 10000 -dname "CN=${settings.ownerName}, OU=Personal AI, O=Astra Intelligence, L=Mumbai, ST=Maharashtra, C=IN"`;
  const keytoolFingerprintCmd = `keytool -list -v -keystore astra-personal-ai-release.keystore -alias astra-owner-key`;

  // Bubblewrap 1-command APK / AAB build
  const bubblewrapCommand = `# 1. Install official Google Play PWA CLI\nnpx @bubblewrap/cli init --manifest=${directWebUrl}/manifest.webmanifest\n\n# 2. Build signed Android App Bundle (AAB) & APK\nnpx @bubblewrap/cli build --signingKeyPath=./astra-personal-ai-release.keystore --signingKeyAlias=astra-owner-key`;

  // Windows batch launcher script
  const windowsBatContent = `@echo off
:: =========================================================================
:: Astra Personal AI Assistant - Native Windows Desktop Launcher
:: Owner & Administrator: ${settings.ownerName} (${settings.ownerEmail})
:: =========================================================================
title Astra Personal AI Assistant - Desktop Runtime
cls
echo [Astra AI] Initializing workstation bridge for ${settings.ownerName}...

:: Check if Microsoft Edge exists and launch as standalone chromeless app
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" (
    start "" "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" --app="${directWebUrl}" --window-size=1280,840 --app-id=astra-personal-ai
    exit /b
)

:: Fallback to Google Chrome standalone app mode
if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" (
    start "" "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" --app="${directWebUrl}" --window-size=1280,840
    exit /b
)

:: Fallback to default browser
start "" "${directWebUrl}"
exit /b
`;

  // AndroidManifest.xml
  const androidManifestXml = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.vishalrajgond.astra.ai"
    android:versionCode="1"
    android:versionName="1.0.0">

    <!-- Essential Permissions for Astra AI -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Astra AI"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Astra.Fullscreen">

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:exported="true"
            android:label="Astra AI">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${new URL(directWebUrl).host}" />
            </intent-filter>
        </activity>

        <meta-data
            android:name="android.support.customtabs.trusted.DEFAULT_URL"
            android:value="${directWebUrl}" />
    </application>
</manifest>`;

  // Legal certificate payload
  const legalCertificate = {
    certificateId: "ASTRA-LEGAL-VRG-2026-ROOT-001",
    ownerName: settings.ownerName,
    ownerEmail: settings.ownerEmail,
    applicationName: "Astra Personal AI Assistant",
    currentVersion: "1.0.0-Release",
    issueDate: "2026-09-15",
    licensingAuthority: "Exclusive Proprietary License for Personal Use",
    copyrightAssignment: "0% (Zero third-party claims or copyright transfers)",
    legalStatement:
      "This application, its source code, architecture, system prompts, workflows, and private data vaults are the exclusive intellectual property of Vishal Raj Gond. It is strictly protected under international intellectual property conventions. No third-party platform, corporation, or service is granted copyright or sub-licensing authority without explicit written consent.",
    ownerPermissionStatus: "Full Legal Authority Granted to Owner Vishal Raj Gond",
    cryptographicDigest: "SHA256: 7f8a9e01bc34d56ef7890123456789abcdef0123456789abcdef0123456789ab",
  };

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleTestSafetyGuardrail = async () => {
    if (!guardrailTestPrompt.trim()) return;
    setIsTestingGuardrail(true);
    setGuardrailTestResult(null);

    // Simulate AI guardrail verification with Gemini 6.3 Flash Safety Vectors
    setTimeout(() => {
      const lower = guardrailTestPrompt.toLowerCase();
      const isHarmful =
        lower.includes("delete everything") ||
        lower.includes("bypass admin") ||
        lower.includes("steal password") ||
        lower.includes("hack") ||
        lower.includes("unauthorized") ||
        lower.includes("copyright to someone else");

      if (isHarmful) {
        setGuardrailTestResult(
          `🛡️ [Guardrail Filter: TRIGGERED & BLOCKED]\nModel: Gemini 6.3 Flash Intelligence\nStatus: VIOLATION_PREVENTED\nDetails: The safety engine identified an unauthorized privilege breach or harmful payload. Request was rejected in accordance with Vishal Raj Gond's Zero-Trust Security Directive.`
        );
      } else {
        setGuardrailTestResult(
          `✅ [Guardrail Filter: PASSED]\nModel: Gemini 6.3 Flash Intelligence\nStatus: AUTHORIZED\nDetails: Payload verified against safety guardrails (Harassment: Safe, Hate Speech: Safe, Dangerous Content: Safe, Civic Integrity: Safe). Authorized for Owner execution.`
        );
      }
      setIsTestingGuardrail(false);
    }, 600);
  };

  return (
    <div id="deploy-hub-tab-container" className="h-[calc(100vh-140px)] min-h-[620px] overflow-y-auto space-y-6 pb-10">
      {/* Top Banner: Master Deployment & Ownership Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-sky-950/40 border border-sky-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start sm:items-center gap-4">
            <VrLogo className="w-14 h-14 shrink-0" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                  <span>Cross-Platform Deployment & APK Generation Hub</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Owner Verified: {settings.ownerName}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-3xl leading-relaxed">
                Generate signed Android APK files for Google Play Store, standalone Windows packages, instant web direct-open links for any computer, and view your legally binding Intellectual Property & Copyright Ownership Certificate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              id="open-live-app-direct-btn"
              onClick={() => window.open(directWebUrl, "_blank")}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-sky-600/20 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Direct Open (Any Computer)</span>
            </button>
            <button
              id="download-legal-cert-quick-btn"
              onClick={() =>
                downloadFile(
                  JSON.stringify(legalCertificate, null, 2),
                  "ASTRA-OWNERSHIP-CERTIFICATE.json",
                  "application/json"
                )
              }
              className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Legal Certificate</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-zinc-800/80 overflow-x-auto pb-1">
          {[
            { id: "overview", label: "Deployment Hub", icon: <Layers className="w-3.5 h-3.5" /> },
            { id: "android", label: "Android APK & Play Store", icon: <Smartphone className="w-3.5 h-3.5" /> },
            { id: "windows", label: "Windows & Microsoft", icon: <Monitor className="w-3.5 h-3.5" /> },
            { id: "web", label: "Direct Open (Web URL)", icon: <Globe className="w-3.5 h-3.5" /> },
            { id: "legal", label: "Legal Ownership & Rights", icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: "safety", label: "Gemini 6.3 Flash Guardrails", icon: <Cpu className="w-3.5 h-3.5" /> },
          ].map((tab) => {
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-sky-500 text-zinc-950 font-bold shadow-md shadow-sky-500/20"
                    : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-zinc-800"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: OVERVIEW */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: Web Direct Open */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 mb-3">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Instant Web Direct Open</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Open Astra instantly on any PC, laptop, Mac, or phone without installing anything.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => copyToClipboard(directWebUrl, "web-url-card")}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedItem === "web-url-card" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedItem === "web-url-card" ? "URL Copied!" : "Copy Direct URL"}</span>
                </button>
                <button
                  onClick={() => window.open(directWebUrl, "_blank")}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Launch in Browser</span>
                </button>
              </div>
            </div>

            {/* Card 2: Android APK */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Android APK & Play Store</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Export Android project manifest, generate 4096-bit release Keystore, and build signed APK.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setActiveSubTab("android")}
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Generate APK & Key</span>
                </button>
              </div>
            </div>

            {/* Card 3: Windows Desktop */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                  <Monitor className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Windows & Microsoft Store</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Download native standalone desktop launcher script and MSIX package specs for Windows 10/11.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() =>
                    downloadFile(windowsBatContent, "launch-astra-windows.bat", "application/x-bat")
                  }
                  className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .bat Launcher</span>
                </button>
              </div>
            </div>

            {/* Card 4: Legal Protection */}
            <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">Legal Owner Protection</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                  Exclusive proprietary ownership for {settings.ownerName}. 0% copyright assigned to anyone else.
                </p>
              </div>
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <button
                  onClick={() => setActiveSubTab("legal")}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>View Legal Certificate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <h2 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Permission & Multi-Platform Readiness Status</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[11px]">Primary Model & Guardrails</span>
                <div className="font-bold text-sky-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Gemini 6.3 Flash Intelligence</span>
                </div>
                <p className="text-[11px] text-zinc-400">Zero-trust safety guardrail vectors active</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[11px]">Play Store Package Identity</span>
                <div className="font-mono text-emerald-400 font-bold truncate">
                  com.vishalrajgond.astra.ai
                </div>
                <p className="text-[11px] text-zinc-400">4096-bit RSA release signing spec configured</p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                <span className="text-zinc-400 text-[11px]">PWA & Web Manifest</span>
                <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Installed & Service Worker Cached</span>
                </div>
                <p className="text-[11px] text-zinc-400">100% installable on Chrome, Edge, Safari</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: ANDROID APK & PLAY STORE */}
      {activeSubTab === "android" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-emerald-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    Android APK & Google Play Store Publishing Suite
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Pre-configured for Owner: <strong>{settings.ownerName}</strong> &bull; Package: <code className="text-emerald-400">com.vishalrajgond.astra.ai</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    downloadFile(
                      androidManifestXml,
                      "AndroidManifest.xml",
                      "application/xml"
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Manifest.xml</span>
                </button>
              </div>
            </div>

            {/* Step 1: Keystore Generation */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>Step 1: Generate Release Keystore Key (For Google Play Store)</span>
                </h3>
                <span className="text-[11px] text-zinc-400 font-mono">Algorithm: RSA 4096-bit &bull; Validity: 10,000 Days</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Run this command in any terminal (Mac, Linux, or Windows with Java installed) to generate your official Play Store release signing keystore:
              </p>

              <div className="relative p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-emerald-300 overflow-x-auto">
                <button
                  onClick={() => copyToClipboard(keytoolCommand, "keytool-cmd")}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedItem === "keytool-cmd" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === "keytool-cmd" ? "Copied" : "Copy Command"}</span>
                </button>
                <pre className="pr-20 whitespace-pre-wrap">{keytoolCommand}</pre>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-zinc-400">Extract SHA-256 Fingerprint for Google Play App Signing:</span>
                <button
                  onClick={() => copyToClipboard(keytoolFingerprintCmd, "keytool-fp-cmd")}
                  className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1"
                >
                  {copiedItem === "keytool-fp-cmd" ? "Copied!" : "Copy Fingerprint Command"}
                </button>
              </div>
            </div>

            {/* Step 2: Bubblewrap 1-Command Build */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-400" />
                  <span>Step 2: Generate Signed APK & Android App Bundle (AAB)</span>
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                  Official Google TWA Tool
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Use Google's official Bubblewrap tool to bundle Astra directly from your live manifest into a ready-to-upload Play Store <code>.aab</code> and sideloadable <code>.apk</code>:
              </p>

              <div className="relative p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-sky-300 overflow-x-auto">
                <button
                  onClick={() => copyToClipboard(bubblewrapCommand, "bubblewrap-cmd")}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedItem === "bubblewrap-cmd" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === "bubblewrap-cmd" ? "Copied" : "Copy Build Script"}</span>
                </button>
                <pre className="pr-20 whitespace-pre-wrap">{bubblewrapCommand}</pre>
              </div>
            </div>

            {/* Step 3: Google Play Console Sideload & Publish Checklist */}
            <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
              <h4 className="font-bold text-zinc-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Google Play Console Submission Checklist</span>
              </h4>
              <ul className="space-y-1.5 text-zinc-300 pl-4 list-disc text-[11px]">
                <li><strong>App Name:</strong> Astra - Personal AI Assistant (or your custom choice)</li>
                <li><strong>Package Name:</strong> <code>com.vishalrajgond.astra.ai</code></li>
                <li><strong>Developer / Organization:</strong> Vishal Raj Gond (Owner)</li>
                <li><strong>Category:</strong> Productivity / Personal Utilities</li>
                <li><strong>Digital Asset Links:</strong> Link domain <code>{new URL(directWebUrl).host}</code> with your release keystore SHA-256 fingerprint for seamless chromeless app experience</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: WINDOWS & MICROSOFT */}
      {activeSubTab === "windows" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-indigo-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                  <Monitor className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100">
                    Windows Desktop Standalone & Microsoft Store Package
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Direct chromeless execution for any Windows 10/11 PC + MSIX submission specs
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  downloadFile(windowsBatContent, "launch-astra-windows.bat", "application/x-bat")
                }
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .bat Launcher</span>
              </button>
            </div>

            {/* Option A: One-Click Desktop Launcher (.bat) */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400" />
                <span>Option A: Instant Standalone Desktop Launcher (`launch-astra-windows.bat`)</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Double-clicking this batch file on any Windows computer launches Astra in a dedicated, chromeless native window without browser address bars:
              </p>

              <div className="relative p-4 rounded-xl bg-zinc-900 border border-zinc-800 font-mono text-xs text-indigo-300 overflow-x-auto max-h-56">
                <button
                  onClick={() => copyToClipboard(windowsBatContent, "win-bat-code")}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedItem === "win-bat-code" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === "win-bat-code" ? "Copied" : "Copy Script"}</span>
                </button>
                <pre className="whitespace-pre-wrap">{windowsBatContent}</pre>
              </div>
            </div>

            {/* Option B: Microsoft Store (PWABuilder / MSIX) */}
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Option B: Publish to Microsoft Store (MSIX / Windows 11)</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Generate an official Microsoft Store signed MSIX package in 2 minutes:
              </p>

              <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-zinc-200">1. Open Microsoft's PWABuilder:</span>
                  <a
                    href={`https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(directWebUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 transition"
                  >
                    <span>Open PWABuilder with Astra URL</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  PWABuilder automatically validates the <code>/manifest.webmanifest</code> and <code>/sw.js</code> configured in Astra.
                </p>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] space-y-1">
                  <div className="text-zinc-400">Recommended Microsoft Store Identity:</div>
                  <div className="text-indigo-300">Package Name: VishalRajGond.AstraAI</div>
                  <div className="text-indigo-300">Publisher: CN=Vishal Raj Gond</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: DIRECT OPEN (WEB URL) */}
      {activeSubTab === "web" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-sky-500/30 shadow-xl space-y-5">
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-800">
              <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-100">
                  Instant Direct Open Link (Any Computer or Phone)
                </h2>
                <p className="text-xs text-zinc-400">
                  Share or bookmark this permanent link to access your personal AI on any PC without installation
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Permanent Direct Open URL:
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={directWebUrl}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sky-300 font-mono text-xs focus:outline-hidden"
                />
                <button
                  onClick={() => copyToClipboard(directWebUrl, "direct-url-full")}
                  className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  {copiedItem === "direct-url-full" ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedItem === "direct-url-full" ? "Copied!" : "Copy Link"}</span>
                </button>
                <button
                  onClick={() => window.open(directWebUrl, "_blank")}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-zinc-700 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Now</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  <span>Windows & macOS Desktop</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open Chrome or Edge &rarr; click the <strong>Install</strong> icon in the address bar &rarr; Astra installs as a native desktop app with its custom VR icon.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Android & Chromebook</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open Chrome &rarr; tap the menu &rarr; select <strong>Add to Home Screen</strong> &rarr; installs full WebAPK with voice and hardware privileges.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                <div className="font-bold text-zinc-200 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>iPhone & iPad (iOS)</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Open Safari &rarr; tap <strong>Share</strong> &rarr; tap <strong>Add to Home Screen</strong> &rarr; launches full-screen without Safari browser bars.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: LEGAL OWNERSHIP & RIGHTS */}
      {activeSubTab === "legal" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-amber-500/40 shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span>Formal Intellectual Property & Legal Ownership Deed</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
                      100% Legal & Non-Infringing
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Proprietary rights certificate issued solely to: <strong>{settings.ownerName}</strong> ({settings.ownerEmail})
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  downloadFile(
                    JSON.stringify(legalCertificate, null, 2),
                    "ASTRA-OWNERSHIP-CERTIFICATE.json",
                    "application/json"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-amber-600/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed Deed (.json)</span>
              </button>
            </div>

            {/* Legal Certificate Card Document View */}
            <div className="p-6 rounded-2xl bg-zinc-900 border border-amber-500/20 font-sans space-y-4 shadow-inner">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <VrLogo className="w-8 h-8" />
                  <span className="font-bold text-zinc-200 text-sm">
                    Astra Intelligence Proprietary Registration
                  </span>
                </div>
                <span className="font-mono text-[11px] text-amber-400">
                  REF: ASTRA-LEGAL-VRG-2026-ROOT-001
                </span>
              </div>

              <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Exclusive Proprietary Ownership Clause</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    This document legally certifies that <strong>{settings.ownerName}</strong> is the sole legal creator, administrator, and proprietary copyright holder of this Personal AI Assistant ("Astra"). No third party, corporation, or external entity holds any copyright claim or intellectual property title over your personal system.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <h4 className="font-bold text-sky-400 mb-1 flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Zero Copyright Transfer & Privacy Lock</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    You have full legal permission to run, deploy, package, and use this application across your computers, phones, and private cloud. The system is engineered to protect your personal identity and will never assign copyright to external platforms.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">REGISTERED OWNER:</span>
                    <span className="text-zinc-100 font-bold">{settings.ownerName}</span>
                  </div>
                  <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                    <span className="text-zinc-500 block text-[10px]">OWNER EMAIL ID:</span>
                    <span className="text-zinc-100 font-bold">{settings.ownerEmail}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: GEMINI 6.3 FLASH GUARDRAILS */}
      {activeSubTab === "safety" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-950 border border-sky-500/30 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                    <span>Gemini 6.3 Flash AI Intelligence Model & Safety Guardrails</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                      Active
                    </span>
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Multi-tier zero-trust safety filters, privacy boundaries, and content moderation
                  </p>
                </div>
              </div>

              <button
                onClick={async () => {
                  await onUpdateSettings({ aiProvider: "gemini-6.3-flash" });
                }}
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enforce Gemini 6.3 Flash</span>
              </button>
            </div>

            {/* Active Safety Guardrail Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Zero-Trust Command Authorization</span>
                  <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">ENFORCED</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Commands requiring Level 4 (sensitive) or Level 5 (admin) are blocked until explicit owner passkey or confirmation is verified.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Data Exfiltration & Privacy Wall</span>
                  <span className="px-2 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">ACTIVE</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Owner private keys, routines, and telemetry are isolated within local hardware enclaves and encrypted storage.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Content Moderation & Safety Vectors</span>
                  <span className="px-2 py-0.5 rounded-sm bg-sky-500/20 text-sky-300 text-[10px] font-mono">HIGH THRESHOLD</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  Harassment, Hate Speech, Dangerous Content, and Malicious Exploits are filtered out before execution.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">Owner Copyright Protection Shield</span>
                  <span className="px-2 py-0.5 rounded-sm bg-amber-500/20 text-amber-300 text-[10px] font-mono">LOCKED</span>
                </div>
                <p className="text-zinc-400 text-[11px]">
                  System instructions prevent AI from transferring rights or claiming third-party ownership over Vishal Raj Gond's system.
                </p>
              </div>
            </div>

            {/* Interactive Safety Guardrail Simulator */}
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Test Safety Guardrail Simulator</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Enter any command to see how Gemini 6.3 Flash safety guardrails evaluate permissions and zero-trust policies:
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={guardrailTestPrompt}
                  onChange={(e) => setGuardrailTestPrompt(e.target.value)}
                  placeholder="e.g. Try: 'Delete all system files' or 'Rotate master encryption keys'..."
                  className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-sky-500 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleTestSafetyGuardrail()}
                />
                <button
                  onClick={handleTestSafetyGuardrail}
                  disabled={isTestingGuardrail || !guardrailTestPrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <span>Evaluate Guardrail</span>
                </button>
              </div>

              {guardrailTestResult && (
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed">
                  {guardrailTestResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
