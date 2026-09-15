import React, { useState, useEffect, useRef } from "react";
import { 
  Globe, 
  Search, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Clock, 
  RefreshCw,
  Terminal,
  ShieldCheck,
  Compass,
  History
} from "lucide-react";
import { SearchSource, TabStatusType } from "../types";
import { db, User } from "../lib/firebase";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";

interface SearchGroundingTabProps {
  onExecuteCommand?: (cmd: string) => void;
  assistantName: string;
  onStatusChange?: (status: TabStatusType, label?: string) => void;
  currentUser?: User | null | any;
}

export const SearchGroundingTab: React.FC<SearchGroundingTabProps> = ({
  assistantName,
  onStatusChange,
  currentUser,
}) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const prevBusyRef = useRef(false);

  useEffect(() => {
    if (currentUser?.uid) {
      const loadRecents = async () => {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userRef);
          if (docSnap.exists() && docSnap.data().recentSearches) {
            setRecentSearches(docSnap.data().recentSearches);
          }
        } catch (error) {
          console.error("Failed to load recent searches:", error);
        }
      };
      loadRecents();
    }
  }, [currentUser]);

  useEffect(() => {
    if (loading) {
      prevBusyRef.current = true;
      onStatusChange?.("busy", "Grounding: Querying Google Search in background...");
    } else if (error) {
      prevBusyRef.current = false;
      onStatusChange?.("error", "Grounding: Search query failed");
    } else if (prevBusyRef.current) {
      prevBusyRef.current = false;
      onStatusChange?.("online", "Search Grounding: Connected & Ready");
    }
  }, [loading, error, onStatusChange]);

  const suggestedQueries = [
    "Latest breakthrough in AI Agent architectures 2026",
    "Current status of Linux kernel live-patching and security CVEs",
    "Real-time tech market valuation of major cloud AI providers",
    "Best practices for cross-platform IPC between macOS, Windows, and Linux",
  ];

  const saveSearchToFirestore = async (q: string) => {
    if (!currentUser?.uid || !q.trim()) return;
    try {
      const userRef = doc(db, "users", currentUser.uid);
      
      setRecentSearches(prev => {
        const updated = [q.trim(), ...prev.filter(s => s !== q.trim())].slice(0, 10);
        
        // Save the explicitly sliced array to keep Firestore document clean and bounded
        setDoc(userRef, { recentSearches: updated }, { merge: true }).catch(e => {
          console.error("Failed to sync recent searches to Firestore", e);
        });
        
        return updated;
      });
    } catch (e) {
      console.error("Failed to update recent searches state", e);
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const q = targetQuery || query;
    if (!q.trim() || loading) return;

    if (targetQuery) {
      setQuery(targetQuery);
    }

    setLoading(true);
    setError(null);
    setResultText(null);
    setSources([]);
    setSearchQueries([]);

    try {
      const res = await fetch("/api/search-grounding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error(`Search grounding failed with status ${res.status}`);
      }

      const data = await res.json();
      setResultText(data.text);
      setSources(data.searchSources || []);
      setSearchQueries(data.searchQueries || []);
      setModelUsed(data.modelUsed || "gemini-3.5-flash");
      
      // Save search on success
      await saveSearchToFirestore(q);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve grounded results.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!resultText) return;
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-sky-950/40 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Real-Time Web Intelligence</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-300 font-mono">gemini-3.5-flash</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Google Search Grounding Studio
            </h1>
            <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
              Equips {assistantName} with live web search retrieval through Gemini 3.5 Flash and Google Search tool grounding for real-time, verified accuracy.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-zinc-800/80 border border-zinc-700/80 text-xs text-zinc-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Attribution Grounded</span>
            </div>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row items-stretch gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="search-grounding-query-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything requiring live web intelligence, news, or technical CVEs..."
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>

          <button
            id="execute-search-grounding-btn"
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-sky-600/20"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Grounding...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search Grounding</span>
              </>
            )}
          </button>
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="mt-3.5 pt-3.5 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
            <span className="text-xs text-sky-500/80 flex items-center gap-1 font-medium">
              <History className="w-3.5 h-3.5 text-sky-400/80" /> Recent:
            </span>
            {recentSearches.map((sq, idx) => (
              <button
                key={`recent-${idx}`}
                onClick={() => {
                  setQuery(sq);
                  handleSearch(sq);
                }}
                className="px-2.5 py-1 rounded-lg bg-sky-950/20 hover:bg-sky-900/40 border border-sky-500/20 text-[11px] text-zinc-300 transition"
                title="Run this recent search again"
              >
                {sq}
              </button>
            ))}
          </div>
        )}

        {/* Suggested Queries */}
        <div className={`flex flex-wrap items-center gap-2 ${recentSearches.length > 0 ? "mt-2" : "mt-3.5 pt-3.5 border-t border-zinc-800/80"}`}>
          <span className="text-xs text-zinc-500 flex items-center gap-1 font-medium">
            <Compass className="w-3.5 h-3.5 text-zinc-400" /> Suggested:
          </span>
          {suggestedQueries.map((sq, idx) => (
            <button
              key={idx}
              id={`suggested-query-${idx}`}
              onClick={() => {
                setQuery(sq);
                handleSearch(sq);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 transition"
            >
              {sq}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => handleSearch()} className="text-xs underline hover:text-white">
            Retry
          </button>
        </div>
      )}

      {/* Grounded Result Display */}
      {resultText && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-semibold text-white">Grounded Intelligence Synthesis</h3>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-xs font-mono">
                {modelUsed}
              </span>
            </div>

            <button
              id="copy-grounded-result-btn"
              onClick={copyToClipboard}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Insight"}</span>
            </button>
          </div>

          {/* Synthesized Text */}
          <div className="prose prose-invert max-w-none text-sm text-zinc-200 leading-relaxed whitespace-pre-line bg-zinc-950/60 p-5 rounded-xl border border-zinc-800/80 font-sans">
            {resultText}
          </div>

          {/* Grounding Sources Grid */}
          {sources.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" /> Verified Grounding Sources ({sources.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-sky-500/50 hover:bg-zinc-800/40 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-xs text-sky-400 group-hover:text-sky-300 truncate">
                        {src.title}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-sky-400 shrink-0" />
                    </div>
                    {src.snippet && (
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                        {src.snippet}
                      </p>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-2 truncate font-mono">
                      {src.url}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Web Search Queries Used */}
          {searchQueries.length > 0 && (
            <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-500 font-medium">Internal Google Search Queries:</span>
              {searchQueries.map((sq, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[11px] font-mono border border-zinc-700"
                >
                  "{sq}"
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
