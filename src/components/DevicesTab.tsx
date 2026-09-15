import React, { useState } from "react";
import {
  Laptop,
  Monitor,
  Terminal,
  Smartphone,
  Globe,
  ShieldCheck,
  ShieldX,
  Code,
  Download,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { NATIVE_SCRIPTS } from "../data/defaults";
import { Device, Platform } from "../types";

interface DevicesTabProps {
  devices: Device[];
  onToggleDeviceAuth: (deviceId: string) => Promise<void>;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({
  devices,
  onToggleDeviceAuth,
}) => {
  const [selectedScript, setSelectedScript] = useState<"macOS" | "windows" | "linux" | "android">("macOS");
  const [copied, setCopied] = useState(false);

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "macOS":
        return <Laptop className="w-4 h-4 text-sky-400" />;
      case "Windows":
        return <Monitor className="w-4 h-4 text-blue-400" />;
      case "Linux":
        return <Terminal className="w-4 h-4 text-amber-400" />;
      case "Android":
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case "Web":
        return <Globe className="w-4 h-4 text-purple-400" />;
    }
  };

  const copyScript = () => {
    navigator.clipboard.writeText(NATIVE_SCRIPTS[selectedScript]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadScript = () => {
    const scriptContent = NATIVE_SCRIPTS[selectedScript];
    const extensions = {
      macOS: "sh",
      windows: "ps1",
      linux: "service",
      android: "kt",
    };
    const blob = new Blob([scriptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astra-bridge-${selectedScript}.${extensions[selectedScript]}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="devices-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px] overflow-y-auto">
      {/* Left Column: Device Fleet Status */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Authorized Device Fleet
            </h2>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Zero-trust authenticated endpoints connected to Astra core
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
            {devices.filter((d) => d.authorized).length} Active Nodes
          </span>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 hover:border-zinc-700 transition"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                  {getPlatformIcon(device.platform)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-zinc-100">{device.name}</h3>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        device.status === "online" ? "bg-emerald-400" : "bg-zinc-600"
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                    {device.ip} &bull; {device.version} &bull; {device.lastSeen}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id={`toggle-auth-${device.id}`}
                  onClick={() => onToggleDeviceAuth(device.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                    device.authorized
                      ? "bg-emerald-500/10 hover:bg-rose-500/20 text-emerald-400 hover:text-rose-300 border border-emerald-500/20 hover:border-rose-500/30"
                      : "bg-rose-500/10 hover:bg-emerald-500/20 text-rose-400 hover:text-emerald-300 border border-rose-500/20 hover:border-emerald-500/30"
                  }`}
                  title={device.authorized ? "Click to Revoke" : "Click to Authorize"}
                >
                  {device.authorized ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Authorized</span>
                    </>
                  ) : (
                    <>
                      <ShieldX className="w-3.5 h-3.5" />
                      <span>Revoked</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Native Bridge Exporter */}
      <div className="lg:col-span-5 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Native Bridge Daemons
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyScript}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition flex items-center gap-1"
              title="Copy code"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={downloadScript}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition flex items-center gap-1"
              title="Download bridge script"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Platform Script Tabs */}
        <div className="px-4 py-2 bg-zinc-950/30 border-b border-zinc-800 flex gap-2">
          {(["macOS", "windows", "linux", "android"] as const).map((plat) => (
            <button
              key={plat}
              onClick={() => setSelectedScript(plat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition capitalize ${
                selectedScript === plat
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {plat}
            </button>
          ))}
        </div>

        {/* Script Viewer */}
        <div className="flex-1 p-4 bg-zinc-950 overflow-y-auto font-mono text-[11px] text-zinc-300 leading-relaxed whitespace-pre-wrap">
          {NATIVE_SCRIPTS[selectedScript]}
        </div>
      </div>
    </div>
  );
};
