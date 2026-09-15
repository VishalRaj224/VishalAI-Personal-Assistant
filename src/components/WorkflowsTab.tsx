import React, { useState } from "react";
import {
  Play,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Shield,
  Layers,
  Sparkles,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { DEFAULT_ROUTINES } from "../data/defaults";
import { CustomRoutine, Platform } from "../types";

interface WorkflowsTabProps {
  activePlatform: Platform;
  onExecuteCommand: (command: string, requiredLevel: number, category?: string) => Promise<any>;
}

export const WorkflowsTab: React.FC<WorkflowsTabProps> = ({
  activePlatform,
  onExecuteCommand,
}) => {
  const [routines, setRoutines] = useState<CustomRoutine[]>(DEFAULT_ROUTINES);
  const [activeRoutine, setActiveRoutine] = useState<CustomRoutine>(DEFAULT_ROUTINES[0]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Routine Form State
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPerm, setNewPerm] = useState(2);
  const [newSteps, setNewSteps] = useState("Launch Target App, Open Notes, Set Notifications");

  const toggleRoutine = (id: string) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
    if (activeRoutine.id === id && routines.length > 1) {
      setActiveRoutine(routines.find((r) => r.id !== id)!);
    }
  };

  const handleExecute = async (routine: CustomRoutine) => {
    setIsExecuting(true);
    setExecutionLog([]);

    for (let i = 0; i < routine.steps.length; i++) {
      const step = routine.steps[i];
      setExecutionLog((prev) => [
        ...prev,
        `Step ${step.order}: Executing ${step.action} [${step.target}]...`,
      ]);
      await new Promise((r) => setTimeout(r, 450));
    }

    const res = await onExecuteCommand(
      `Trigger Routine: ${routine.name}`,
      routine.requiredPermission,
      "system"
    );

    setExecutionLog((prev) => [
      ...prev,
      ` ${routine.name} successfully deployed on ${activePlatform}!`,
    ]);
    setIsExecuting(false);
  };

  const handleCreateRoutine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newTrigger) return;

    const stepItems = newSteps
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const created: CustomRoutine = {
      id: `routine-${Date.now()}`,
      name: newName,
      triggerPhrase: newTrigger,
      description: newDesc || "Custom owner automated workflow.",
      enabled: true,
      requiredPermission: newPerm,
      steps: stepItems.map((step, idx) => ({
        order: idx + 1,
        action: step,
        target: activePlatform,
      })),
    };

    setRoutines((prev) => [created, ...prev]);
    setActiveRoutine(created);
    setShowNewModal(false);
    setNewName("");
    setNewTrigger("");
    setNewDesc("");
  };

  return (
    <div id="workflows-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px]">
      {/* Left Column: Routines List */}
      <div className="lg:col-span-5 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Personal Commands & Routines
            </h2>
          </div>

          <button
            id="add-routine-btn"
            onClick={() => setShowNewModal(true)}
            className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Routine</span>
          </button>
        </div>

        {/* Routines Card List */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {routines.map((routine) => {
            const isSelected = activeRoutine.id === routine.id;
            return (
              <div
                key={routine.id}
                onClick={() => setActiveRoutine(routine)}
                className={`p-4 rounded-xl border transition cursor-pointer relative group ${
                  isSelected
                    ? "bg-zinc-950/90 border-sky-500/50 shadow-md shadow-sky-500/5"
                    : "bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-zinc-100">{routine.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${
                        routine.requiredPermission === 5
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-semibold"
                          : routine.requiredPermission >= 4
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}
                    >
                      {routine.requiredPermission === 5 ? "Level 5 Root" : `Level ${routine.requiredPermission}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => toggleRoutine(routine.id)}
                      className="text-zinc-400 hover:text-zinc-200 transition p-1"
                      title={routine.enabled ? "Disable" : "Enable"}
                    >
                      {routine.enabled ? (
                        <ToggleRight className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-zinc-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteRoutine(routine.id)}
                      className="text-zinc-500 hover:text-rose-400 transition p-1"
                      title="Delete routine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                  {routine.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>Voice: &quot;{routine.triggerPhrase}&quot;</span>
                  <span>{routine.steps.length} Steps</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Routine Execution Inspector */}
      <div className="lg:col-span-7 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-5 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-semibold">
                Voice Phrase: &quot;{activeRoutine.triggerPhrase}&quot;
              </span>
              <span className="text-xs text-zinc-400 font-mono">Target: {activePlatform}</span>
            </div>
            <h3 className="text-base font-bold text-zinc-100">{activeRoutine.name}</h3>
          </div>

          <button
            id="run-routine-btn"
            onClick={() => handleExecute(activeRoutine)}
            disabled={isExecuting || !activeRoutine.enabled}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-2 transition disabled:opacity-40 shadow-lg shadow-emerald-600/20"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isExecuting ? "Executing Pipeline..." : "Trigger Routine"}</span>
          </button>
        </div>

        {/* Steps Breakdown */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
            Execution Steps Pipeline
          </h4>

          <div className="space-y-3">
            {activeRoutine.steps.map((step) => (
              <div
                key={step.order}
                className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center font-bold text-sky-400 shrink-0">
                    {step.order}
                  </div>
                  <div>
                    <div className="font-semibold text-zinc-200">{step.action}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">{step.target}</div>
                  </div>
                </div>

                <span className="text-[11px] text-zinc-400 font-mono flex items-center gap-1">
                  Auto-Dispatched <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>

          {/* Real-time Execution Terminal Stream */}
          {executionLog.length > 0 && (
            <div className="mt-6 p-4 rounded-xl bg-black/90 border border-zinc-800 font-mono text-xs text-emerald-400 space-y-1.5">
              <div className="text-[10px] text-zinc-400 uppercase tracking-wider mb-2 font-sans font-semibold">
                Execution Telemetry Feed
              </div>
              {executionLog.map((logLine, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-zinc-600">&gt;</span>
                  <span>{logLine}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Routine Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-zinc-100">
            <h3 className="text-base font-bold mb-4">Create Personal Command Routine</h3>
            <form onSubmit={handleCreateRoutine} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Routine Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Deep Work Mode"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Voice Trigger Phrase</label>
                <input
                  type="text"
                  value={newTrigger}
                  onChange={(e) => setNewTrigger(e.target.value)}
                  placeholder="e.g. Deep Work"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <input
                  type="text"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Explain what this automation does"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Required Permission Level</label>
                <select
                  value={newPerm}
                  onChange={(e) => setNewPerm(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-sky-500"
                >
                  <option value={1}>Level 1: Read-Only (System Telemetry, Non-Invasive)</option>
                  <option value={2}>Level 2: Basic Control (Launch Apps, Open Tabs)</option>
                  <option value={3}>Level 3: Advanced Automation (Terminal Scripts, Code Ops)</option>
                  <option value={4}>Level 4: Sensitive Actions (File Deletions, Modifying State)</option>
                  <option value={5}>Level 5: Administrator Root Authority (Key Rotation, Security Lockdown)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Steps (Comma separated)</label>
                <input
                  type="text"
                  value={newSteps}
                  onChange={(e) => setNewSteps(e.target.value)}
                  placeholder="Open VS Code, Open Terminal, Launch Docker"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 focus:outline-hidden focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold"
                >
                  Save Routine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
