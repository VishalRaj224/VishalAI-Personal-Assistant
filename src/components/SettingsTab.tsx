import React, { useState } from "react";
import {
  Settings,
  Key,
  Shield,
  User,
  Lock,
  RefreshCw,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Award,
  LayoutGrid,
  LayoutList,
  GripVertical,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Pencil
} from "lucide-react";
import { AssistantSettings } from "../types";
import { VrLogo } from "./VrLogo";

interface SettingsTabProps {
  settings: AssistantSettings;
  onUpdateSettings: (newSettings: Partial<AssistantSettings>) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState({
    assistantName: settings.assistantName,
    wakeWord: settings.wakeWord,
    ownerName: settings.ownerName,
    ownerEmail: settings.ownerEmail,
    aiProvider: settings.aiProvider,
    mfaEnabled: settings.mfaEnabled,
    voiceAccessEnabled: settings.voiceAccessEnabled,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const recoveryCodes = [
    "ASTRA-9842-XC71-REV",
    "ASTRA-4120-MQ99-SEC",
    "ASTRA-7714-KL02-OWN",
    "ASTRA-8931-ZZ55-ADM",
  ];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await onUpdateSettings(formData);
    setIsSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div id="settings-tab-container" className="h-[calc(100vh-140px)] min-h-[620px] overflow-y-auto space-y-6">
      {/* Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Branding, Names, AI Engine */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                Assistant Customization & Branding
              </h2>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Assistant Name
              </label>
              <input
                type="text"
                value={formData.assistantName}
                onChange={(e) => setFormData({ ...formData, assistantName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Wake Word
              </label>
              <input
                type="text"
                value={formData.wakeWord}
                onChange={(e) => setFormData({ ...formData, wakeWord: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                AI Intelligence Provider
              </label>
              <select
                value={formData.aiProvider}
                onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
              >
                <option value="gemini-6.3-flash">Gemini 6.3 Flash AI Intelligence (Safety Guardrails Active)</option>
                <option value="gemini-flash">Gemini 3.8 Flash (Low Latency / Cloud)</option>
                <option value="gemini-pro">Gemini 3.1 Pro (Deep STEM / Coding)</option>
                <option value="local-hybrid">Local ONNX / Quantized Edge Model</option>
                <option value="custom">Custom Provider Endpoint</option>
              </select>
            </div>
          </div>

          {/* Owner Account Information */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400" />
                <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                  Owner Identity & Credentials
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                Verified Owner
              </span>
            </div>

            {/* Custom VR Monogram Badge Display */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
              <VrLogo className="w-12 h-12" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-100 truncate">
                    {formData.ownerName}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono">
                    VR CORE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 truncate">{formData.ownerEmail}</p>
                <p className="text-[10px] text-sky-400/80 mt-0.5">Custom VR Crown Emblematics Active</p>
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Owner Full Name
              </label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1 font-medium">
                Primary Email & Recovery
              </label>
              <input
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs font-semibold focus:outline-hidden focus:border-sky-500"
              />
            </div>
          </div>

          {/* Navigation Tabs Customization & Display Mode */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                  Navigation Tabs Configuration
                </h2>
              </div>
              {settings.customTabOrder && settings.customTabOrder.length > 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateSettings({ customTabOrder: [] });
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition"
                  title="Reset tab order to default"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Order</span>
                </button>
              )}
            </div>

            {/* Display Mode Setting (Icons Only vs Icons & Labels) */}
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-200">
                    Tab Display Density
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Choose between standard full tabs or a compact icon-only navigation bar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  id="tab-mode-both-btn"
                  onClick={async () => {
                    await onUpdateSettings({ navTabDisplay: "both" });
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                    settings.navTabDisplay !== "icons-only"
                      ? "bg-sky-500 text-zinc-950 border-sky-400 shadow-md shadow-sky-500/20 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                  }`}
                >
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>Icons & Labels (Standard)</span>
                </button>

                <button
                  type="button"
                  id="tab-mode-icons-only-btn"
                  onClick={async () => {
                    await onUpdateSettings({ navTabDisplay: "icons-only" });
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition border ${
                    settings.navTabDisplay === "icons-only"
                      ? "bg-sky-500 text-zinc-950 border-sky-400 shadow-md shadow-sky-500/20 font-bold"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Icons Only (Compact UI)</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Drag tabs directly in the top navigation bar to reorder. <strong>Double-click any tab button</strong> in the top navigation bar to rename its label; custom labels are automatically synced with Firestore. Tooltips feature a 500ms hover delay to prevent visual clutter.
            </p>

            {settings.customTabLabels && Object.keys(settings.customTabLabels).length > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs">
                <span className="text-sky-300">
                  {Object.keys(settings.customTabLabels).length} custom tab label(s) active
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await onUpdateSettings({ customTabLabels: {} });
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 transition font-medium text-[11px]"
                  title="Reset all tab names back to defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Names</span>
                </button>
              </div>
            )}

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {(() => {
                const defaultTabs = [
                  { id: "console", label: "Assistant Console" },
                  { id: "chat", label: "Gemini Chat" },
                  { id: "grounding", label: "Search Grounding" },
                  { id: "media", label: "Media Studio (Veo/Lyria)" },
                  { id: "documents", label: "Document Reader" },
                  { id: "workflows", label: "Personal Commands" },
                  { id: "voice", label: "Voice Lab" },
                  { id: "permissions", label: "Permission Matrix" },
                  { id: "devices", label: "Device Fleet" },
                  { id: "docs", label: "System Blueprint" },
                  { id: "logs", label: "Security Logs" },
                  { id: "deploy", label: "Deploy & APK Hub" },
                  { id: "settings", label: "Settings" },
                ];
                const currentOrder = settings.customTabOrder && settings.customTabOrder.length > 0
                  ? settings.customTabOrder
                  : defaultTabs.map((t) => t.id);

                const items = [
                  ...currentOrder
                    .map((id) => defaultTabs.find((t) => t.id === id))
                    .filter((t): t is (typeof defaultTabs)[0] => Boolean(t)),
                  ...defaultTabs.filter((t) => !currentOrder.includes(t.id)),
                ];

                const moveItem = async (index: number, direction: -1 | 1) => {
                  const targetIndex = index + direction;
                  if (targetIndex < 0 || targetIndex >= items.length) return;
                  const newOrder = items.map((i) => i.id);
                  const [moved] = newOrder.splice(index, 1);
                  newOrder.splice(targetIndex, 0, moved);
                  await onUpdateSettings({ customTabOrder: newOrder });
                };

                const handleResetSingleTabLabel = async (tabId: string) => {
                  const current = { ...(settings.customTabLabels || {}) };
                  delete current[tabId];
                  await onUpdateSettings({ customTabLabels: current });
                };

                return items.map((tab, idx) => {
                  const customLabel = settings.customTabLabels?.[tab.id];
                  const displayLabel = customLabel || tab.label;

                  return (
                    <div
                      key={tab.id}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2 text-zinc-300 font-medium truncate mr-2">
                        <span className="text-[10px] text-zinc-600 font-mono w-4 shrink-0">{idx + 1}.</span>
                        <span className="truncate">{displayLabel}</span>
                        {customLabel && (
                          <span className="text-[10px] text-zinc-500 font-normal shrink-0 italic">
                            (orig: {tab.label})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {customLabel && (
                          <button
                            type="button"
                            onClick={() => handleResetSingleTabLabel(tab.id)}
                            className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition"
                            title="Reset this tab's name to default"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveItem(idx, -1)}
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 transition"
                          title="Move tab left/up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === items.length - 1}
                          onClick={() => moveItem(idx, 1)}
                          className="p-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:hover:bg-zinc-800 text-zinc-300 transition"
                          title="Move tab right/down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Right Column: Security, MFA, Emergency Recovery */}
        <div className="lg:col-span-6 space-y-6">
          {/* Security Toggles */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                Owner Authentication & Passkeys
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">
                    Multi-Factor Authentication (TOTP/Passkey)
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Mandatory two-factor approval for Level 4/5 actions
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.mfaEnabled}
                  onChange={(e) => setFormData({ ...formData, mfaEnabled: e.target.checked })}
                  className="w-4 h-4 accent-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div>
                  <div className="text-xs font-semibold text-zinc-200">Voice Control Access</div>
                  <div className="text-[11px] text-zinc-400">
                    Allow voice commands & wake-word listening
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={formData.voiceAccessEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, voiceAccessEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-sky-500"
                />
              </label>
            </div>
          </div>

          {/* Account Recovery Codes */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-rose-400" />
                <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                  Emergency Recovery Vault
                </h2>
              </div>
              <button
                type="button"
                onClick={copyRecoveryCodes}
                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? "Copied" : "Copy Codes"}</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              If voice recognition or biometrics become unavailable, use one of these one-time recovery codes to regain root administrator access.
            </p>

            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {recoveryCodes.map((code) => (
                <div
                  key={code}
                  className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-center font-bold"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings synchronized!
              </span>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition shadow-md shadow-sky-600/20 flex items-center gap-2"
            >
              {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>Save & Apply Settings</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
