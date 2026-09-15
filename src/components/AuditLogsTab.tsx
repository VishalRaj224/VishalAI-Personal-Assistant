import React, { useState } from "react";
import {
  ListFilter,
  Trash2,
  Download,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Search,
  RefreshCw,
  Terminal,
} from "lucide-react";
import { ActivityLog } from "../types";

interface AuditLogsTabProps {
  logs: ActivityLog[];
  onClearLogs: () => Promise<void>;
  onRefreshLogs: () => Promise<void>;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({
  logs,
  onClearLogs,
  onRefreshLogs,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    const matchesCat = filterCategory === "all" || log.category === filterCategory;
    const matchesSearch =
      log.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.device.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const exportLogsAsJSON = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `astra-audit-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: ActivityLog["status"]) => {
    switch (status) {
      case "success":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Success
          </span>
        );
      case "pending_confirmation":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Approval Required
          </span>
        );
      case "denied":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Security Blocked
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-700 text-zinc-300">
            Failed
          </span>
        );
    }
  };

  return (
    <div id="audit-logs-tab-container" className="h-[calc(100vh-140px)] min-h-[620px] flex flex-col rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl overflow-hidden">
      {/* Log Header Controls */}
      <div className="p-4 bg-zinc-950/60 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-sky-400" />
          <h2 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
            Security & Activity Audit Log
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-xs font-mono">
            {filteredLogs.length} Records
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-8 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-hidden focus:border-sky-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-medium focus:outline-hidden"
          >
            <option value="all">All Categories</option>
            <option value="system">System & Automation</option>
            <option value="voice">Voice & Biometric</option>
            <option value="file">File Management</option>
            <option value="security">Security & Auth</option>
            <option value="web">Web Control</option>
          </select>

          {/* Export & Clear */}
          <button
            onClick={exportLogsAsJSON}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 transition border border-zinc-700"
            title="Export JSON"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-xl bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-300 text-zinc-400 text-xs flex items-center gap-1 transition border border-zinc-700"
            title="Purge logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-zinc-950/40 border-b border-zinc-800 text-zinc-400 font-medium">
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Command / Event</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Tier</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Target Device</th>
              <th className="py-3 px-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-800/30 transition">
                <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                  {log.timestamp}
                </td>
                <td className="py-3 px-4 font-semibold text-zinc-200">{log.command}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] uppercase font-mono">
                    {log.category}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-amber-400 font-semibold">
                    L{log.permissionLevel}
                  </span>
                </td>
                <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                <td className="py-3 px-4 text-zinc-400">{log.device}</td>
                <td className="py-3 px-4 text-zinc-400 text-[11px] max-w-xs truncate">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
