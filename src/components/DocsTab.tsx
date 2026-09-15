import React, { useState } from "react";
import {
  BookOpen,
  Search,
  Check,
  Copy,
  Download,
  Code,
  Layers,
  ChevronRight,
} from "lucide-react";
import { DOCUMENTATION_DATA, DocItem } from "../data/documentation";

export const DocsTab: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<DocItem>(DOCUMENTATION_DATA[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [copied, setCopied] = useState(false);

  const categories = ["All", "Architecture", "Core Systems", "Platforms", "Guides & Security"];

  const filteredDocs = DOCUMENTATION_DATA.filter((doc) => {
    const matchesCategory = categoryFilter === "All" || doc.category === categoryFilter;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const copyCode = () => {
    if (!selectedStep.codeSnippet) return;
    navigator.clipboard.writeText(selectedStep.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadConfigsBundle = () => {
    const bundle = {
      "config.json": {
        assistantName: "Astra",
        wakeWord: "Hello Astra",
        owner: "Vishal Raj Gond",
        language: "en",
        version: "2.4.1",
      },
      "permissions.json": {
        level1: ["read_files", "view_telemetry"],
        level2: ["launch_apps", "manage_windows"],
        level3: ["create_files", "run_builds"],
        level4: ["delete_files", "system_modifications"],
        level5: ["device_pairing", "key_rotation"],
      },
      "commands.json": [
        { name: "Study Mode", phrase: "Study Mode", level: 2 },
        { name: "Programming Mode", phrase: "Programming Mode", level: 3 },
      ],
    };

    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "astra-configurations-bundle.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="docs-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px] overflow-y-auto">
      {/* Left Column: Step Navigator & Search */}
      <div className="lg:col-span-4 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Search & Header */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                System Blueprint (20 Steps)
              </h2>
            </div>
            <button
              onClick={downloadConfigsBundle}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition"
              title="Download Config Bundle"
            >
              <Download className="w-3 h-3" />
              <span className="hidden sm:inline">Configs</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search architecture steps..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[10px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap transition ${
                  categoryFilter === cat
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Step Items List */}
        <div className="flex-1 p-2 overflow-y-auto space-y-1">
          {filteredDocs.map((doc) => {
            const isSelected = selectedStep.id === doc.id;
            return (
              <button
                key={doc.id}
                id={`doc-step-${doc.stepNumber}`}
                onClick={() => setSelectedStep(doc)}
                className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between group ${
                  isSelected
                    ? "bg-sky-500/10 border border-sky-500/40 text-sky-300"
                    : "text-zinc-300 hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                      isSelected
                        ? "bg-sky-500 text-zinc-950"
                        : "bg-zinc-800 text-zinc-400 group-hover:text-zinc-200"
                    }`}
                  >
                    {doc.stepNumber}
                  </span>
                  <div className="truncate">
                    <div className="text-xs font-medium truncate">{doc.title}</div>
                    <div className="text-[10px] text-zinc-400 truncate">{doc.subtitle}</div>
                  </div>
                </div>

                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Step Detail & Code Viewer */}
      <div className="lg:col-span-8 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        <div className="p-6 bg-zinc-950/60 border-b border-zinc-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold font-mono">
                STEP {selectedStep.stepNumber} OF 20
              </span>
              <span className="text-xs text-zinc-400 font-medium">{selectedStep.category}</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-100">{selectedStep.title}</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{selectedStep.subtitle}</p>
          </div>

          {selectedStep.codeSnippet && (
            <button
              onClick={copyCode}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Code"}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 text-sm text-zinc-300 leading-relaxed">
          <div className="whitespace-pre-wrap">{selectedStep.content}</div>

          {/* Code Snippet Box */}
          {selectedStep.codeSnippet && (
            <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <div className="px-4 py-2 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="font-mono">{selectedStep.codeLanguage || "code"}</span>
                <span>Production Reference</span>
              </div>
              <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                {selectedStep.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
