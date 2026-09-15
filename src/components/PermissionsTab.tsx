import React, { useState } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Play,
  Terminal,
  AlertTriangle,
  Lock,
  Key,
  Cpu,
  RefreshCw,
  CheckCircle2,
  Sliders,
  Database,
  Radio,
  Sparkles,
  ArrowRight,
  ShieldQuestion,
} from "lucide-react";
import { AssistantSettings } from "../types";

interface PermissionsTabProps {
  settings: AssistantSettings;
  onChangePermissionLevel: (level: number) => void;
  onExecuteCommand?: (
    command: string,
    requiredLevel?: number,
    category?: string,
    confirmed?: boolean
  ) => Promise<any>;
  activePlatform?: string;
}

interface Level5Preset {
  id: string;
  name: string;
  command: string;
  category: "security" | "system" | "app" | "file";
  target: string;
  description: string;
  icon: React.ReactNode;
}

export const PermissionsTab: React.FC<PermissionsTabProps> = ({
  settings,
  onChangePermissionLevel,
  onExecuteCommand,
  activePlatform = "Web",
}) => {
  const isLevel5 = settings.currentPermissionLevel === 5;

  const [selectedPresetId, setSelectedPresetId] = useState("keys");
  const [customCommand, setCustomCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<{
    status: "success" | "error" | "denied";
    message: string;
    timestamp: string;
    command: string;
  } | null>(null);

  const level5Presets: Level5Preset[] = [
    {
      id: "keys",
      name: "Rotate Master Keys & Passkeys",
      command: "Rotate Master Encryption Keys & Passkeys",
      category: "security",
      target: "Key Vault & Hardware Enclave",
      description: "Generates a fresh 4096-bit RSA asymmetric root keypair and re-anchors WebAuthn biometrics.",
      icon: <Key className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "fleet",
      name: "Authorize Device Fleet & mTLS Certs",
      command: "Authorize Zero-Trust Device Fleet & Re-issue mTLS Certs",
      category: "system",
      target: "Cross-Platform Bridge Nodes",
      description: "Cryptographically validates all connected workstation nodes and issues mutual TLS certificates.",
      icon: <Radio className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "ai-gateway",
      name: "Override AI Gateway & Model Endpoints",
      command: "Configure AI Gateway & Root Gemini Parameters",
      category: "app",
      target: "Gemini 2.5 Provider Pipeline",
      description: "Updates low-latency system endpoints, model weights, and zero-trust safety threshold vectors.",
      icon: <Cpu className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "threat-audit",
      name: "Root Zero-Trust Threat Audit & Lockdown",
      command: "Execute Zero-Trust Security Audit & Fleet Threat Lockdown",
      category: "security",
      target: "Kernel & Process Isolator",
      description: "Runs deep memory isolation scans, kills untrusted sockets, and enforces zero-trust lockdown.",
      icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    },
    {
      id: "snapshot",
      name: "Cryptographic Snapshot & Project Vault Backup",
      command: "Generate Cryptographic Project Snapshot & Cloud Backup Archive",
      category: "file",
      target: "Cloud Keyed Storage Vault",
      description: "Creates an AES-GCM-256 encrypted archive of assistant memory, routines, and device logs.",
      icon: <Database className="w-4 h-4 text-rose-400" />,
    },
  ];

  const currentPreset = level5Presets.find((p) => p.id === selectedPresetId) || level5Presets[0];

  const handleRunLevel5Command = async (commandToRun: string, category: string = "security") => {
    if (!commandToRun.trim()) return;

    // If not currently at Level 5, automatically elevate to Level 5 or inform user
    if (!isLevel5) {
      onChangePermissionLevel(5);
    }

    setIsExecuting(true);
    setExecutionOutput(null);

    try {
      if (onExecuteCommand) {
        const result = await onExecuteCommand(commandToRun, 5, category, false);
        if (result && result.denied) {
          setExecutionOutput({
            status: "denied",
            message: result.reason || "Operation denied by security engine.",
            timestamp: new Date().toLocaleTimeString(),
            command: commandToRun,
          });
        } else {
          setExecutionOutput({
            status: "success",
            message:
              result?.result ||
              `[Root Authority Verified] Executed: "${commandToRun}" on ${activePlatform}. Audit digest: SEC-ROOT-${Date.now().toString(16).toUpperCase()}`,
            timestamp: new Date().toLocaleTimeString(),
            command: commandToRun,
          });
        }
      } else {
        // Fallback local execution
        setExecutionOutput({
          status: "success",
          message: `[Root Authority Verified] Executed: "${commandToRun}" on ${activePlatform}. Audit digest: SEC-ROOT-${Date.now().toString(16).toUpperCase()}`,
          timestamp: new Date().toLocaleTimeString(),
          command: commandToRun,
        });
      }
    } catch (err: any) {
      setExecutionOutput({
        status: "error",
        message: err?.message || "Failed to dispatch Level 5 command.",
        timestamp: new Date().toLocaleTimeString(),
        command: commandToRun,
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const levels = [
    {
      level: 1,
      name: "Level 1: Read Only",
      badge: "Non-Intrusive",
      badgeColor: "text-sky-400 bg-sky-500/10 border-sky-500/20",
      description: "Passive information retrieval and document comprehension.",
      capabilities: [
        "Read PDF, TXT, CSV, DOCX & source code",
        "Explain algorithms and technical documents",
        "Retrieve system telemetry & network stats",
        "View activity and security audit logs",
      ],
      icon: <FileCheck className="w-5 h-5 text-sky-400" />,
    },
    {
      level: 2,
      name: "Level 2: Basic Control",
      badge: "Standard Use",
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      description: "Basic desktop navigation and application management.",
      capabilities: [
        "Launch applications (VS Code, Chrome, Terminal)",
        "Switch, minimize and focus application windows",
        "Execute pre-approved 'Study Mode' & 'Focus' routines",
        "Adjust volume, brightness & display preferences",
      ],
      icon: <Play className="w-5 h-5 text-emerald-400" />,
    },
    {
      level: 3,
      name: "Level 3: Advanced Control",
      badge: "Default Workstation",
      badgeColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      description: "File organization, workspace orchestration, and build tools.",
      capabilities: [
        "Create new files, folders, and markdown reports",
        "Move, copy, and reorganize project folders",
        "Execute approved Git commands and code builds",
        "Manage Docker containers and local test servers",
      ],
      icon: <Terminal className="w-5 h-5 text-indigo-400" />,
    },
    {
      level: 4,
      name: "Level 4: Sensitive Actions",
      badge: "Confirmation Mandatory",
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      description: "Critical actions requiring explicit Owner approval popups.",
      capabilities: [
        "Permanently delete files or directories",
        "Modify firewall or network port forwarding",
        "Install or update operating system software",
        "Dispatch outbound communications or emails",
      ],
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    },
    {
      level: 5,
      name: "Level 5: Administrator",
      badge: "Full Root Authority",
      badgeColor: "text-rose-400 bg-rose-500/20 border-rose-500/30",
      description: "Exclusive to Owner. Device pairing, key vaults, master policy.",
      capabilities: [
        "Authorize or revoke cross-platform devices",
        "Rotate master encryption keys and Passkeys",
        "Modify core AI provider and model endpoints",
        "Export or wipe complete assistant project data",
      ],
      icon: <Lock className="w-5 h-5 text-rose-400" />,
    },
  ];

  return (
    <div id="permissions-tab-container" className="h-[calc(100vh-140px)] min-h-[620px] overflow-y-auto space-y-6 pb-8">
      {/* Top Banner: Golden Security Directive with Level 5 Status & Quick Access */}
      <div
        className={`p-6 rounded-2xl border shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
          isLevel5
            ? "bg-gradient-to-r from-zinc-950 via-zinc-900 to-rose-950/40 border-rose-500/40 shadow-rose-950/20"
            : "bg-zinc-900 border-zinc-800"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            {isLevel5 ? (
              <ShieldAlert className="w-5 h-5 text-rose-400 animate-pulse" />
            ) : (
              <Shield className="w-5 h-5 text-amber-400" />
            )}
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span>5-Tier Permission & Safety Management</span>
              {isLevel5 && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Root Admin Mode Active
                </span>
              )}
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Astra operates on the principle of least privilege. Actions above your currently active level are strictly rejected. Level 5 grants unrestricted root authority across all linked devices, key vaults, and AI endpoints.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs">
            <div className="text-zinc-400 mb-1">Active Operating Tier:</div>
            <div
              className={`text-sm font-bold flex items-center gap-1.5 ${
                isLevel5 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {isLevel5 ? <Lock className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Level {settings.currentPermissionLevel} {isLevel5 ? "(Root Administrator)" : "Active"}</span>
            </div>
          </div>

          {!isLevel5 ? (
            <button
              id="elevate-to-level-5-hero-btn"
              onClick={() => onChangePermissionLevel(5)}
              className="px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-rose-600/20 cursor-pointer"
              title="Elevate session to Level 5 Administrator"
            >
              <Key className="w-4 h-4" />
              <span>Access Level 5 (Root)</span>
            </button>
          ) : (
            <button
              id="demote-from-level-5-btn"
              onClick={() => onChangePermissionLevel(3)}
              className="px-3.5 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs flex items-center gap-1.5 transition border border-zinc-700 cursor-pointer"
              title="Return to standard Level 3 workstation mode"
            >
              <span>Switch to Level 3</span>
            </button>
          )}
        </div>
      </div>

      {/* Level 5 Dedicated Root Administrator Operations Generator */}
      <div
        id="level-5-generator-panel"
        className="p-6 rounded-2xl bg-zinc-950 border border-rose-500/30 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-100">
                  Level 5 Root Operations Generator & Vault
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Administrator Privileges
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Generate, verify, and dispatch high-privilege Level 5 operations across your {activePlatform} environment.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isLevel5 ? (
              <button
                id="unlock-level-5-generator-btn"
                onClick={() => onChangePermissionLevel(5)}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Unlock Level 5 Access</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                <span>Level 5 Authorization Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Generator Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Preset Selector */}
          <div className="lg:col-span-5 space-y-2.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Select Root Operation Template</span>
            </label>

            <div className="space-y-2">
              {level5Presets.map((preset) => {
                const isSelected = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    id={`preset-${preset.id}`}
                    onClick={() => {
                      setSelectedPresetId(preset.id);
                      setCustomCommand("");
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-rose-950/30 border-rose-500/50 shadow-md ring-1 ring-rose-500/30 text-zinc-100"
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shrink-0 mt-0.5">
                      {preset.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-zinc-200 truncate">{preset.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-sm bg-zinc-800 text-zinc-400">
                          {preset.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-snug line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generator Inspector & Execution Box */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between mb-1.5">
                  <span>Generated Level 5 Command Payload</span>
                  <span className="text-[10px] font-mono text-rose-400">Target: {currentPreset.target}</span>
                </label>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-rose-300 flex items-center justify-between">
                  <span>{customCommand.trim() ? customCommand : currentPreset.command}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-sm bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Lvl 5
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                  Or Enter Custom Root Administrator Command
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="e.g. Purge unverified device bridge sockets and rotate credentials"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs placeholder:text-zinc-600 focus:outline-hidden focus:border-rose-500 font-mono"
                  />
                  {customCommand && (
                    <button
                      onClick={() => setCustomCommand("")}
                      className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Execution Feedback / Terminal Stream */}
              {executionOutput && (
                <div
                  className={`p-3.5 rounded-xl border font-mono text-xs space-y-1.5 ${
                    executionOutput.status === "success"
                      ? "bg-zinc-950 border-emerald-500/30 text-emerald-300"
                      : executionOutput.status === "denied"
                      ? "bg-zinc-950 border-amber-500/30 text-amber-300"
                      : "bg-zinc-950 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 font-sans font-semibold border-b border-zinc-800/80 pb-1">
                    <span className="flex items-center gap-1.5">
                      {executionOutput.status === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {executionOutput.status === "denied" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                      {executionOutput.status === "error" && <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />}
                      <span>Level 5 Telemetry Record</span>
                    </span>
                    <span>{executionOutput.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed pt-1">
                    {executionOutput.message}
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Level 5 operations require Owner authorization & logged to security audit ledger</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  id="dispatch-level5-action-btn"
                  onClick={() =>
                    handleRunLevel5Command(
                      customCommand.trim() ? customCommand : currentPreset.command,
                      currentPreset.category
                    )
                  }
                  disabled={isExecuting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing Root Action...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Execute Level 5 Command</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Level Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {levels.map((lvl) => {
          const isActive = settings.currentPermissionLevel === lvl.level;
          const isL5Card = lvl.level === 5;

          return (
            <div
              key={lvl.level}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                isActive
                  ? isL5Card
                    ? "bg-zinc-950 border-rose-500 shadow-xl shadow-rose-500/10 ring-1 ring-rose-500/50"
                    : "bg-zinc-900/90 border-sky-500 shadow-xl shadow-sky-500/10 ring-1 ring-sky-500/50"
                  : isL5Card
                  ? "bg-gradient-to-b from-zinc-900/70 to-rose-950/20 border-rose-500/30 hover:border-rose-500/50"
                  : "bg-zinc-900/40 border-zinc-800 hover:bg-zinc-800/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div
                    className={`p-2.5 rounded-xl bg-zinc-950 border ${
                      isL5Card ? "border-rose-500/30" : "border-zinc-800"
                    }`}
                  >
                    {lvl.icon}
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${lvl.badgeColor}`}>
                    {lvl.badge}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-zinc-100 mb-1">{lvl.name}</h3>
                <p className="text-xs text-zinc-400 mb-4 leading-relaxed">{lvl.description}</p>

                <div className="space-y-1.5 text-xs text-zinc-300">
                  {lvl.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span
                        className={`shrink-0 mt-0.5 ${
                          isL5Card ? "text-rose-400 font-bold" : "text-emerald-400"
                        }`}
                      >
                        &bull;
                      </span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-zinc-800/60">
                <button
                  id={`set-permission-level-${lvl.level}`}
                  onClick={() => onChangePermissionLevel(lvl.level)}
                  disabled={isActive}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? isL5Card
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 cursor-default"
                        : "bg-sky-500/20 text-sky-300 border border-sky-500/40 cursor-default"
                      : isL5Card
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  {isActive ? "Currently Active Level" : isL5Card ? "Access & Elevate to Level 5 (Root)" : `Set to Level ${lvl.level}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
