import React, { useState, useEffect, useRef } from "react";
import {
  FileText,
  Upload,
  Code,
  FileSpreadsheet,
  Check,
  Search,
  Sparkles,
  BookOpen,
  Layers,
  Copy,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { SAMPLE_DOCUMENTS } from "../data/defaults";
import { DocumentSample, TabStatusType } from "../types";

interface DocumentReaderTabProps {
  onStatusChange?: (status: TabStatusType, label?: string) => void;
}

export const DocumentReaderTab: React.FC<DocumentReaderTabProps> = ({ onStatusChange }) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentSample>(SAMPLE_DOCUMENTS[0]);
  const [customText, setCustomText] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("Summarize key findings and extract actionable next steps.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const prevBusyRef = useRef(false);

  useEffect(() => {
    if (isAnalyzing) {
      prevBusyRef.current = true;
      onStatusChange?.("busy", "Document Reader: Analyzing document contents...");
    } else if (prevBusyRef.current) {
      prevBusyRef.current = false;
      onStatusChange?.("online", "Document Reader: Ready");
    }
  }, [isAnalyzing, onStatusChange]);

  const activeContent = customText || selectedDoc.content;
  const activeName = customTitle || selectedDoc.name;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCustomTitle(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCustomText(text);
      setAnalysisResult(null);
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async (promptOverride?: string) => {
    const p = promptOverride || analysisPrompt;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: activeName,
          content: activeContent,
          prompt: p,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to analyze document (Status ${res.status})`);
      }

      const data = await res.json();
      setAnalysisResult(data.analysis || "Analysis complete.");
    } catch (err: any) {
      setAnalysisResult(`⚠️ **Analysis Unavailable**: ${err?.message || "Failed to analyze document. Please check connection to AI engine."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const presets = [
    { label: "Executive Summary", prompt: "Summarize this document in 3 concise bullet points for the system owner." },
    { label: "Code Explanation", prompt: "Explain the architecture of this code, highlighting dependencies and safety considerations." },
    { label: "Security & Permissions Audit", prompt: "Perform a security audit on this content: identify required permission levels and potential vulnerabilities." },
    { label: "Translate to Hindi", prompt: "Translate the primary conclusions of this document into clear Hindi (हिन्दी) and Hinglish." },
  ];

  return (
    <div id="doc-reader-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[620px]">
      {/* Left Column: Document Select, Upload & Raw Viewer */}
      <div className="lg:col-span-6 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Document Selector Header */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Document & Code Ingestion
            </h2>
          </div>

          {/* Upload Button */}
          <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".txt,.pdf,.csv,.py,.js,.ts,.json,.md,.rs,.go,.cpp,.c,.java"
            />
          </label>
        </div>

        {/* Sample Docs Pill Selector */}
        <div className="px-4 py-2 bg-zinc-950/30 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Presets:</span>
          {SAMPLE_DOCUMENTS.map((doc) => (
            <button
              key={doc.id}
              onClick={() => {
                setSelectedDoc(doc);
                setCustomText("");
                setCustomTitle("");
                setAnalysisResult(null);
              }}
              className={`px-3 py-1 rounded-lg whitespace-nowrap font-medium transition flex items-center gap-1.5 ${
                selectedDoc.id === doc.id && !customTitle
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {doc.type === "code" && <Code className="w-3 h-3 text-emerald-400" />}
              {doc.type === "markdown" && <FileText className="w-3 h-3 text-sky-400" />}
              {doc.type === "csv" && <FileSpreadsheet className="w-3 h-3 text-amber-400" />}
              <span>{doc.name}</span>
            </button>
          ))}
        </div>

        {/* Document Editor / Raw Content View */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-zinc-300 bg-zinc-950/80">
          <textarea
            value={activeContent}
            onChange={(e) => {
              setCustomText(e.target.value);
              setAnalysisResult(null);
            }}
            placeholder="Paste code, document markdown, CSV or technical notes here..."
            className="w-full h-full bg-transparent border-0 resize-none focus:outline-hidden text-zinc-200 leading-relaxed"
          />
        </div>

        {/* Document Metadata Footer */}
        <div className="p-3 bg-zinc-950/60 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate max-w-[280px]">File: {activeName}</span>
          <span>{activeContent.length} chars &bull; {(activeContent.length / 1024).toFixed(1)} KB</span>
        </div>
      </div>

      {/* Right Column: AI Analysis & Extraction Console */}
      <div className="lg:col-span-6 flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
        {/* Analysis Header */}
        <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
              Gemini 3.8 Flash Document Analyzer
            </h2>
          </div>

          {analysisResult && (
            <button
              onClick={copyToClipboard}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          )}
        </div>

        {/* Preset Prompt Buttons */}
        <div className="p-4 bg-zinc-950/30 border-b border-zinc-800/80 flex flex-wrap gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-prompt-${idx}`}
              onClick={() => {
                setAnalysisPrompt(preset.prompt);
                handleAnalyze(preset.prompt);
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700/60 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Prompt Input & Execute */}
        <div className="p-4 border-b border-zinc-800 flex gap-2">
          <div className="relative flex-1">
            <input
              id="analysis-prompt-input"
              type="text"
              value={analysisPrompt}
              onChange={(e) => setAnalysisPrompt(e.target.value)}
              placeholder="Enter analysis or question about this document..."
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 placeholder-zinc-500 text-xs focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <button
            id="run-analysis-btn"
            onClick={() => handleAnalyze()}
            disabled={isAnalyzing}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? "Analyzing..." : "Analyze Document"}</span>
          </button>
        </div>

        {/* Analysis Output Body */}
        <div className="flex-1 p-5 overflow-y-auto text-sm leading-relaxed text-zinc-200">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-400">
              <span className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Extracting structured intelligence with Gemini...</p>
            </div>
          ) : analysisResult ? (
            <div className="markdown-body prose prose-invert prose-sm max-w-none">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2 text-zinc-500 text-center p-6">
              <FileText className="w-10 h-10 text-zinc-700" />
              <p className="text-xs">
                Select a document preset or paste source content, then click <strong>Analyze Document</strong>.
              </p>
              <p className="text-[11px] text-zinc-600 max-w-md">
                Astra reads PDF specifications, Python/Rust code, CSV spreadsheets, and technical docs with zero hallucination.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
