import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Radio,
  BookOpen,
  Layers,
  Mic,
  Shield,
  Laptop,
  Terminal,
  Settings,
  FileCode,
  Sparkles,
  Globe,
  MessageSquareCode,
  Palette,
  GripVertical,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  Check,
  Pencil,
  AlertCircle,
  Smartphone
} from "lucide-react";
import { Navbar } from "./components/Navbar";
import { ConsoleTab } from "./components/ConsoleTab";
import { DocumentReaderTab } from "./components/DocumentReaderTab";
import { WorkflowsTab } from "./components/WorkflowsTab";
import { VoiceLabTab } from "./components/VoiceLabTab";
import { PermissionsTab } from "./components/PermissionsTab";
import { DevicesTab } from "./components/DevicesTab";
import { DocsTab } from "./components/DocsTab";
import { AuditLogsTab } from "./components/AuditLogsTab";
import { SettingsTab } from "./components/SettingsTab";
import { DeployHubTab } from "./components/DeployHubTab";
import { ConfirmationModal } from "./components/ConfirmationModal";
import { LiveVoiceModal } from "./components/LiveVoiceModal";
import { GeminiChatTab } from "./components/GeminiChatTab";
import { SearchGroundingTab } from "./components/SearchGroundingTab";
import { MediaStudioTab } from "./components/MediaStudioTab";
import { AssistantSettings, Platform, Device, ActivityLog, TabStatusType, TabStatusState } from "./types";
import { auth, db, loginWithGoogle, logoutUser, onAuthStateChanged, User, testFirestoreConnection } from "./lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

type TabId =
  | "console"
  | "chat"
  | "grounding"
  | "media"
  | "documents"
  | "workflows"
  | "voice"
  | "permissions"
  | "devices"
  | "docs"
  | "logs"
  | "deploy"
  | "settings";

interface NavTabItem {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("console");

  const [settings, setSettings] = useState<AssistantSettings>({
    assistantName: "Astra",
    wakeWord: "Hello Astra",
    ownerName: "Vishal Raj Gond",
    ownerEmail: "vishalrajgond2005@gmail.com",
    language: "en",
    ttsVoice: "Kore",
    currentPermissionLevel: 3,
    privacyMode: false,
    voiceAccessEnabled: true,
    mfaEnabled: true,
    aiProvider: "gemini-flash",
    activePlatform: "macOS",
    theme: "dark",
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = useState(false);
  const [activePlatform, setActivePlatform] = useState<Platform>("macOS");
  const [devices, setDevices] = useState<Device[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  // Drag and drop state for main navigation tabs
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);

  // Delayed tooltip state for navigation tab containers (500ms delay to eliminate visual clutter when moving mouse rapidly)
  const [activeTooltip, setActiveTooltip] = useState<{
    id: string;
    label: string;
    description?: string;
    rect: { top: number; left: number; width: number; height: number };
  } | null>(null);
  const tooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Inline tab editing state (double-click on tab buttons to rename)
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabLabel, setEditingTabLabel] = useState<string>("");
  const [shakingTabId, setShakingTabId] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<{
    tabId: string;
    message: string;
  } | null>(null);
  const [firestoreSaveToast, setFirestoreSaveToast] = useState<{
    message: string;
    tabId: string;
  } | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const saveToastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shakeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const renameErrorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Confirmation Modal state for Level 4/5 actions
  const [pendingAction, setPendingAction] = useState<{
    isOpen: boolean;
    command: string;
    requiredLevel: number;
    category?: string;
    prompt: string;
  }>({
    isOpen: false,
    command: "",
    requiredLevel: 4,
    prompt: "",
  });

  // Navigation tab background status indicator dots (green: online, yellow: busy, red: error)
  const [tabStatuses, setTabStatuses] = useState<Record<string, TabStatusState>>({
    console: { status: "online", label: "Console: Online & Ready" },
    chat: { status: "online", label: "Gemini Chat: Ready" },
    grounding: { status: "online", label: "Search Grounding: Ready" },
    media: { status: "online", label: "Media Studio: Ready" },
    documents: { status: "online", label: "Document Reader: Ready" },
    workflows: { status: "online", label: "Personal Commands: Ready" },
    voice: { status: "online", label: "Voice Lab: Active" },
    permissions: { status: "online", label: "Security: Level 5 Active" },
    devices: { status: "online", label: "Fleet: Nodes Connected" },
    docs: { status: "online", label: "System Blueprint" },
    logs: { status: "online", label: "Security Logs: Streaming" },
    deploy: { status: "online", label: "Deploy Hub: Verified" },
    settings: { status: "online", label: "Settings" },
  });

  const handleTabStatusChange = useCallback((tabId: string, status: TabStatusType, label?: string) => {
    const finalLabel = label || `${tabId}: ${status}`;
    setTabStatuses((prev) => {
      const current = prev[tabId];
      if (current && current.status === status && current.label === finalLabel) {
        return prev;
      }
      return {
        ...prev,
        [tabId]: { status, label: finalLabel },
      };
    });
  }, []);

  const onConsoleStatusChange = useCallback((status: TabStatusType, label?: string) => {
    handleTabStatusChange("console", status, label);
  }, [handleTabStatusChange]);

  const onChatStatusChange = useCallback((status: TabStatusType, label?: string) => {
    handleTabStatusChange("chat", status, label);
  }, [handleTabStatusChange]);

  const onGroundingStatusChange = useCallback((status: TabStatusType, label?: string) => {
    handleTabStatusChange("grounding", status, label);
  }, [handleTabStatusChange]);

  const onMediaStatusChange = useCallback((status: TabStatusType, label?: string) => {
    handleTabStatusChange("media", status, label);
  }, [handleTabStatusChange]);

  const onDocumentsStatusChange = useCallback((status: TabStatusType, label?: string) => {
    handleTabStatusChange("documents", status, label);
  }, [handleTabStatusChange]);

  // Track Firebase Auth state & sync with Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        testFirestoreConnection();
        // Sync user profile & load persisted settings
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              id: user.uid,
              name: user.displayName || "Vishal Raj Gond",
              email: user.email || "vishalrajgond2005@gmail.com",
              role: "owner",
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            });
          }

          // Check for user-specific settings in Firestore
          const settingsDocRef = doc(db, "users", user.uid, "settings", "current");
          const settingsSnap = await getDoc(settingsDocRef);
          if (settingsSnap.exists()) {
            const data = settingsSnap.data() as AssistantSettings;
            setSettings((prev) => ({ ...prev, ...data }));
            if (data.activePlatform) setActivePlatform(data.activePlatform);
          }
        } catch (err) {
          console.warn("Firestore user sync notice:", err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial system state
  useEffect(() => {
    fetchSettings();
    fetchDevices();
    fetchLogs();
  }, []);

  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
        setSettings((prev) => ({
          ...prev,
          ownerName: user.displayName || prev.ownerName,
          ownerEmail: user.email || prev.ownerEmail,
        }));
      }
    } catch (e) {
      console.error("Login failed:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const fetchSettings = async () => {
    // Check cached settings from localStorage for instant initial load
    try {
      const cached = localStorage.getItem("astra_settings");
      if (cached) {
        const parsed = JSON.parse(cached);
        setSettings((prev) => ({ ...prev, ...parsed }));
        if (parsed.activePlatform) setActivePlatform(parsed.activePlatform);
      }
    } catch {}

    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        setActivePlatform(data.activePlatform || "macOS");
        try {
          localStorage.setItem("astra_settings", JSON.stringify(data));
        } catch {}
      }
    } catch (e) {
      console.warn("Notice: Initializing settings from local store:", e);
    }

    // Direct Firestore fetch for persisted custom tab labels
    try {
      const tabLabelsDocRef = doc(db, "tabLabels", "custom");
      const tabSnap = await getDoc(tabLabelsDocRef);
      if (tabSnap.exists()) {
        const data = tabSnap.data();
        if (data?.labels) {
          setSettings((prev) => ({
            ...prev,
            customTabLabels: { ...(prev.customTabLabels || {}), ...data.labels },
          }));
        }
      }
    } catch (e) {
      console.warn("Notice: Firestore tab labels load:", e);
    }
  };

  const fetchDevices = async () => {
    try {
      const res = await fetch("/api/devices");
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (e) {
      console.warn("Notice: Initializing devices from local defaults");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.warn("Notice: Initializing logs from local stream");
    }
  };

  const handleUpdateSettings = async (partial: Partial<AssistantSettings>) => {
    // 1. Immediate optimistic UI update
    setSettings((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem("astra_settings", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (partial.activePlatform) {
      setActivePlatform(partial.activePlatform);
    }

    // 2. Persist to Firestore if user is authenticated
    if (currentUser) {
      try {
        const settingsDocRef = doc(db, "users", currentUser.uid, "settings", "current");
        await setDoc(settingsDocRef, { ...partial, updatedAt: new Date().toISOString() }, { merge: true });
      } catch (err) {
        console.warn("Firestore settings backup notice:", err);
      }
    }

    // 3. Sync to Express API server with graceful fallback
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
      fetchLogs();
    } catch (e: any) {
      console.warn("Backend settings sync notice (using local & cloud state):", e?.message || e);
    }
  };

  const handleChangePlatform = async (p: Platform) => {
    setActivePlatform(p);
    await handleUpdateSettings({ activePlatform: p });
  };

  const handleTogglePrivacy = async () => {
    const nextPrivacy = !settings.privacyMode;
    await handleUpdateSettings({ privacyMode: nextPrivacy });
  };

  const handleChangePermissionLevel = async (level: number) => {
    await handleUpdateSettings({ currentPermissionLevel: level });
  };

  const handleToggleDeviceAuth = async (deviceId: string) => {
    // Optimistic toggle
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, authorized: !d.authorized } : d))
    );

    try {
      const res = await fetch("/api/devices/toggle-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.devices) setDevices(data.devices);
      }
      fetchLogs();
    } catch (e: any) {
      console.warn("Notice: Device state updated locally:", e?.message || e);
    }
  };

  const handleClearLogs = async () => {
    setLogs([]);
    try {
      await fetch("/api/logs", { method: "DELETE" });
    } catch (e: any) {
      console.warn("Notice: Security logs cleared locally:", e?.message || e);
    }
  };

  // Central Command Dispatcher with Level 4/5 Safety Interception
  const handleExecuteCommand = async (
    command: string,
    requiredLevel: number,
    category?: string,
    confirmed = false
  ) => {
    handleTabStatusChange("console", "busy", `Console: Running "${command.slice(0, 24)}..."`);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command,
          requiredLevel,
          category,
          confirmed,
          targetPlatform: activePlatform,
        }),
      });

      const data = await res.json();

      if (data.requiresConfirmation && !confirmed) {
        // Open confirmation modal for Level 4/5 sensitive action
        setPendingAction({
          isOpen: true,
          command,
          requiredLevel,
          category,
          prompt: data.confirmationPrompt || `Confirm execution of: "${command}" on ${activePlatform}?`,
        });
        handleTabStatusChange("console", "busy", "Console: Awaiting Level 4/5 Owner Confirmation");
        return data;
      }

      if (data.denied && data.canElevate && !confirmed) {
        // If operation requires Level 5, prompt user to elevate & authorize
        setPendingAction({
          isOpen: true,
          command,
          requiredLevel: 5,
          category: category || "security",
          prompt: `${data.reason} Authorize Level 5 elevation and execute now?`,
        });
        handleTabStatusChange("console", "error", "Console: Elevated permission required (Level 5)");
        return data;
      }

      if (data.denied && !data.canElevate) {
        handleTabStatusChange("console", "error", `Console: Execution denied (${data.reason || "Policy violation"})`);
        setTimeout(() => handleTabStatusChange("console", "online", "Console: Online & Ready"), 4000);
      } else {
        handleTabStatusChange("console", "online", "Console: Command executed successfully");
      }

      fetchLogs();
      return data;
    } catch (e) {
      console.error("Execution error:", e);
      handleTabStatusChange("console", "error", "Console: Command execution network error");
      setTimeout(() => handleTabStatusChange("console", "online", "Console: Online & Ready"), 4000);
    }
  };

  const handleConfirmAction = async () => {
    const { command, requiredLevel, category } = pendingAction;
    setPendingAction((prev) => ({ ...prev, isOpen: false }));
    if (settings.currentPermissionLevel < requiredLevel) {
      await handleChangePermissionLevel(requiredLevel);
    }
    await handleExecuteCommand(command, requiredLevel, category, true);
  };

  const defaultNavTabs: NavTabItem[] = [
    { id: "console", label: "Assistant Console", icon: <Radio className="w-4 h-4" />, description: "Live console & operational controls" },
    { id: "chat", label: "Gemini Chat", icon: <MessageSquareCode className="w-4 h-4" />, description: "Multimodal Gemini dialogue & code" },
    { id: "grounding", label: "Search Grounding", icon: <Globe className="w-4 h-4" />, description: "Google Search verified knowledge" },
    { id: "media", label: "Media Studio (Veo/Lyria)", icon: <Palette className="w-4 h-4" />, description: "Veo 2 video & Lyria audio engine" },
    { id: "documents", label: "Document Reader", icon: <BookOpen className="w-4 h-4" />, description: "PDF, text & audio file analyzer" },
    { id: "workflows", label: "Personal Commands", icon: <Layers className="w-4 h-4" />, description: "Custom command macros & pipelines" },
    { id: "voice", label: "Voice Lab", icon: <Mic className="w-4 h-4" />, description: "Voice synthesis & custom profiles" },
    { id: "permissions", label: "Permission Matrix", icon: <Shield className="w-4 h-4" />, description: "5-Tier execution security matrix" },
    { id: "devices", label: "Device Fleet", icon: <Laptop className="w-4 h-4" />, description: "Fleet node monitor & commands" },
    { id: "docs", label: "System Blueprint", icon: <FileCode className="w-4 h-4" />, description: "System architecture & schemas" },
    { id: "logs", label: "Security Logs", icon: <Terminal className="w-4 h-4" />, description: "Audit trail & security telemetry" },
    { id: "deploy", label: "Deploy & APK Hub", icon: <Smartphone className="w-4 h-4" />, description: "Android APK, Play Store, Windows & Web Direct Open" },
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, description: "Preferences, display mode & identity" },
  ];

  // Derive ordered tabs based on user's saved preferences
  const currentTabOrder: string[] = settings.customTabOrder && settings.customTabOrder.length > 0
    ? settings.customTabOrder
    : defaultNavTabs.map((t) => t.id);

  // Keep all tabs, ensuring newly added tabs still appear at the end if omitted in saved order
  const orderedNavTabs: NavTabItem[] = [
    ...currentTabOrder
      .map((id) => {
        const found = defaultNavTabs.find((t) => t.id === id);
        if (!found) return null;
        const custom = settings.customTabLabels?.[found.id];
        return custom ? { ...found, label: custom } : found;
      })
      .filter((t): t is NavTabItem => Boolean(t)),
    ...defaultNavTabs
      .filter((t) => !currentTabOrder.includes(t.id))
      .map((t) => {
        const custom = settings.customTabLabels?.[t.id];
        return custom ? { ...t, label: custom } : t;
      }),
  ];

  // Tab renaming handlers (Double-click tab button to edit label)
  const triggerTabShake = (tabId: string, message: string) => {
    if (shakeTimeoutRef.current) {
      clearTimeout(shakeTimeoutRef.current);
    }
    if (renameErrorTimeoutRef.current) {
      clearTimeout(renameErrorTimeoutRef.current);
    }

    setShakingTabId(tabId);
    setRenameError({ tabId, message });

    // Refocus the input and select existing text for immediate correction
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 40);

    // Reset shake state after 450ms animation duration so subsequent attempts re-trigger
    shakeTimeoutRef.current = setTimeout(() => {
      setShakingTabId(null);
    }, 450);

    // Auto-dismiss the error popup after 3.5 seconds
    renameErrorTimeoutRef.current = setTimeout(() => {
      setRenameError(null);
    }, 3500);
  };

  const startTabRename = (tabId: string, currentLabel: string) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setActiveTooltip(null);
    setRenameError(null);
    setShakingTabId(null);
    setEditingTabId(tabId);
    setEditingTabLabel(currentLabel);
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 40);
  };

  const cancelTabRename = () => {
    setEditingTabId(null);
    setEditingTabLabel("");
    setRenameError(null);
    setShakingTabId(null);
  };

  const saveTabRename = async (tabId: string, newLabel: string) => {
    if (editingTabId !== tabId) return;

    const trimmed = newLabel.trim();

    // 1. Validation check: Empty or whitespace-only name
    if (!trimmed) {
      triggerTabShake(tabId, "Tab label cannot be empty");
      return;
    }

    // 2. Validation check: Duplicate name with any other tab (case-insensitive)
    const duplicateWith = defaultNavTabs.find((t) => {
      if (t.id === tabId) return false;
      const otherLabel = (settings.customTabLabels?.[t.id] || t.label).trim().toLowerCase();
      return otherLabel === trimmed.toLowerCase();
    });

    if (duplicateWith) {
      const existingName = settings.customTabLabels?.[duplicateWith.id] || duplicateWith.label;
      triggerTabShake(tabId, `Name "${existingName}" is already used by another tab`);
      return;
    }

    // Clear editing, error, and shake states on valid input
    setEditingTabId(null);
    setRenameError(null);
    setShakingTabId(null);

    const defaultItem = defaultNavTabs.find((t) => t.id === tabId);
    const defaultLabel = defaultItem?.label || tabId;

    const currentLabels = { ...(settings.customTabLabels || {}) };
    let updatedLabels: Record<string, string>;

    if (trimmed === defaultLabel) {
      const { [tabId]: _, ...rest } = currentLabels;
      updatedLabels = rest;
    } else {
      updatedLabels = {
        ...currentLabels,
        [tabId]: trimmed,
      };
    }

    // 1. Immediate optimistic UI & Express backend sync
    await handleUpdateSettings({ customTabLabels: updatedLabels });

    const finalLabel = trimmed || defaultLabel;

    // 2. Persist custom tab labels to Firestore /tabLabels/custom
    try {
      const tabLabelsDocRef = doc(db, "tabLabels", "custom");
      await setDoc(
        tabLabelsDocRef,
        {
          labels: updatedLabels,
          updatedAt: new Date().toISOString(),
          lastRenamedTab: tabId,
          renamedTo: finalLabel,
        },
        { merge: true }
      );

      if (saveToastTimeoutRef.current) {
        clearTimeout(saveToastTimeoutRef.current);
      }
      setFirestoreSaveToast({
        message: `Tab "${finalLabel}" saved to Firestore`,
        tabId,
      });
      saveToastTimeoutRef.current = setTimeout(() => {
        setFirestoreSaveToast(null);
      }, 3000);
    } catch (err) {
      console.warn("Firestore tabLabels save notice:", err);
    }

    // 3. Persist to user settings document in Firestore if logged in
    if (currentUser) {
      try {
        const userSettingsDocRef = doc(db, "users", currentUser.uid, "settings", "current");
        await setDoc(
          userSettingsDocRef,
          {
            customTabLabels: updatedLabels,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (err) {
        console.warn("Firestore user settings tab sync notice:", err);
      }
    }
  };

  // Tab delayed tooltip handlers (500ms delay to eliminate flicker when scanning across tabs)
  const handleTabMouseEnter = (
    tab: NavTabItem,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    // Suppress tooltips while dragging
    if (draggedTabId) return;

    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }

    const currentTarget = e.currentTarget;
    tooltipTimeoutRef.current = setTimeout(() => {
      if (!currentTarget) return;
      const rect = currentTarget.getBoundingClientRect();
      setActiveTooltip({
        id: tab.id,
        label: tab.label,
        description: tab.description,
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      });
    }, 500);
  };

  const handleTabMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setActiveTooltip(null);
  };

  // Automatically dismiss tooltips on scroll or window resize
  useEffect(() => {
    const handleDismiss = () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
      setActiveTooltip(null);
    };

    window.addEventListener("scroll", handleDismiss, true);
    window.addEventListener("resize", handleDismiss);
    return () => {
      window.removeEventListener("scroll", handleDismiss, true);
      window.removeEventListener("resize", handleDismiss);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  // Drag-and-drop reordering handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    handleTabMouseLeave();
    e.dataTransfer.setData("text/plain", tabId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTabId(tabId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverTabId !== tabId) {
      setDragOverTabId(tabId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    if (dragOverTabId === tabId) {
      setDragOverTabId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, targetTabId: string) => {
    e.preventDefault();
    const sourceTabId = e.dataTransfer.getData("text/plain") || draggedTabId;
    setDraggedTabId(null);
    setDragOverTabId(null);

    if (!sourceTabId || sourceTabId === targetTabId) return;

    const existingOrder: string[] = orderedNavTabs.map((t) => t.id);
    const sourceIndex = existingOrder.indexOf(sourceTabId);
    const targetIndex = existingOrder.indexOf(targetTabId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newOrder = [...existingOrder];
    const [moved] = newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    await handleUpdateSettings({ customTabOrder: newOrder });
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
    setDragOverTabId(null);
  };

  const handleResetTabOrder = async () => {
    const defaultOrder = defaultNavTabs.map((t) => t.id);
    await handleUpdateSettings({ customTabOrder: defaultOrder });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Main Navbar */}
      <Navbar
        settings={settings}
        activePlatform={activePlatform}
        currentUser={currentUser}
        onChangePlatform={handleChangePlatform}
        onTogglePrivacy={handleTogglePrivacy}
        onChangePermissionLevel={handleChangePermissionLevel}
        onOpenLiveVoice={() => setIsLiveVoiceOpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 flex flex-col gap-5">
        {/* Navigation Tabs Bar with Drag-and-Drop Reordering & Compact Mode Toggle */}
        <div className="flex items-center gap-2">
          {(() => {
            const isCompactNav = settings.navTabDisplay === "icons-only";
            return (
              <>
                <nav
                  id="main-tab-navigation"
                  aria-label="Main Navigation"
                  className="flex-1 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 overflow-x-auto scrollbar-none shadow-md backdrop-blur-md"
                >
                  {orderedNavTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isBeingDragged = draggedTabId === tab.id;
                    const isDropTarget = dragOverTabId === tab.id && draggedTabId !== tab.id;

                    const isShaking = shakingTabId === tab.id;
                    const hasRenameError = renameError?.tabId === tab.id;

                    return (
                      <div
                        key={tab.id}
                        id={`tab-container-${tab.id}`}
                        draggable={editingTabId !== tab.id}
                        onDragStart={(e) => {
                          if (editingTabId) {
                            e.preventDefault();
                            return;
                          }
                          handleDragStart(e, tab.id);
                        }}
                        onDragOver={(e) => handleDragOver(e, tab.id)}
                        onDragLeave={(e) => handleDragLeave(e, tab.id)}
                        onDrop={(e) => handleDrop(e, tab.id)}
                        onDragEnd={handleDragEnd}
                        onMouseEnter={(e) => {
                          if (editingTabId) return;
                          handleTabMouseEnter(tab, e);
                        }}
                        onMouseLeave={handleTabMouseLeave}
                        className={`group relative flex items-center transition-all duration-150 ${
                          editingTabId === tab.id
                            ? "cursor-default"
                            : "cursor-grab active:cursor-grabbing"
                        } select-none rounded-xl ${
                          isBeingDragged ? "opacity-40 scale-95" : "opacity-100"
                        } ${
                          isDropTarget
                            ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-zinc-950 bg-sky-500/10"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          id={`tab-btn-${tab.id}`}
                          onClick={() => {
                            if (editingTabId === tab.id) return;
                            handleTabMouseLeave();
                            setActiveTab(tab.id as any);
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleTabMouseLeave();
                            startTabRename(tab.id, tab.label);
                          }}
                          aria-label={`${tab.label}. Double-click to rename.`}
                          title={
                            editingTabId === tab.id
                              ? undefined
                              : "Double-click to rename tab label (saved to Firestore), drag to reorder"
                          }
                          className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                            isCompactNav && editingTabId !== tab.id ? "px-3 py-2" : "px-3 py-2"
                          } ${
                            isShaking
                              ? "animate-subtle-shake ring-2 ring-rose-500/90 bg-rose-950/40 text-rose-300 border border-rose-500/60"
                              : hasRenameError
                              ? "ring-2 ring-rose-500/60 bg-rose-950/20 text-rose-300 border border-rose-500/40"
                              : isActive
                              ? "bg-sky-500 text-zinc-950 shadow-md shadow-sky-500/20 font-bold"
                              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                          }`}
                        >
                          {!isCompactNav && editingTabId !== tab.id && (
                            <GripVertical
                              className={`w-3.5 h-3.5 opacity-30 group-hover:opacity-80 transition-opacity -ml-0.5 ${
                                isActive ? "text-zinc-950" : "text-zinc-400"
                              }`}
                              aria-hidden="true"
                            />
                          )}
                          <span className="relative shrink-0 flex items-center justify-center">
                            {tab.icon}
                            {/* Status indicator dot at bottom-right corner (green for online, yellow for busy, red for error) */}
                            {(() => {
                              const tabStatus = tabStatuses[tab.id];
                              if (!tabStatus || tabStatus.status === "idle") return null;

                              const isOnline = tabStatus.status === "online";
                              const isBusy = tabStatus.status === "busy";
                              const isError = tabStatus.status === "error";

                              return (
                                <span
                                  id={`tab-status-dot-${tab.id}`}
                                  className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 pointer-events-none flex items-center justify-center ${
                                    isActive ? "border-sky-500" : "border-zinc-950"
                                  } ${
                                    isOnline
                                      ? "bg-emerald-400 shadow-xs shadow-emerald-400"
                                      : isBusy
                                      ? "bg-amber-400 shadow-xs shadow-amber-400 animate-pulse"
                                      : "bg-rose-500 shadow-xs shadow-rose-500"
                                  }`}
                                  title={tabStatus.label}
                                  aria-label={`${tab.label} status: ${tabStatus.status}`}
                                >
                                  {isBusy && (
                                    <span className="w-full h-full rounded-full bg-amber-400 animate-ping opacity-75" />
                                  )}
                                </span>
                              );
                            })()}
                          </span>

                          {/* Editable inline input when tab is double-clicked */}
                          {editingTabId === tab.id ? (
                            <span
                              className="flex items-center gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                              onDoubleClick={(e) => e.stopPropagation()}
                            >
                              <input
                                id={`tab-rename-input-${tab.id}`}
                                ref={renameInputRef}
                                type="text"
                                value={editingTabLabel}
                                onChange={(e) => {
                                  setEditingTabLabel(e.target.value);
                                  if (renameError && renameError.tabId === tab.id) {
                                    setRenameError(null);
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    saveTabRename(tab.id, editingTabLabel);
                                  } else if (e.key === "Escape") {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    cancelTabRename();
                                  }
                                }}
                                onBlur={() => saveTabRename(tab.id, editingTabLabel)}
                                maxLength={32}
                                className={`px-2 py-0.5 rounded-lg border font-semibold text-xs tracking-tight outline-none shadow-sm min-w-[95px] max-w-[170px] ${
                                  hasRenameError || isShaking
                                    ? "bg-rose-950/70 text-rose-100 border-rose-500 ring-2 ring-rose-500/40"
                                    : isActive
                                    ? "bg-zinc-950 text-sky-200 border-zinc-950 focus:ring-1 focus:ring-zinc-950"
                                    : "bg-zinc-950 text-white border-sky-400 focus:ring-1 focus:ring-sky-400"
                                }`}
                                placeholder="Tab label..."
                                autoFocus
                              />
                              <button
                                type="button"
                                id={`save-tab-btn-${tab.id}`}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  saveTabRename(tab.id, editingTabLabel);
                                }}
                                title="Save rename to Firestore (Enter)"
                                className={`p-1 rounded-md transition shrink-0 ${
                                  hasRenameError || isShaking
                                    ? "bg-rose-600 text-white hover:bg-rose-500"
                                    : isActive
                                    ? "bg-zinc-900 text-sky-300 hover:bg-zinc-800"
                                    : "bg-sky-500 text-zinc-950 hover:bg-sky-400"
                                }`}
                              >
                                <Check className="w-3 h-3 stroke-[2.5]" />
                              </button>
                            </span>
                          ) : (
                            <>
                              {!isCompactNav && (
                                <span className="truncate max-w-[160px] inline-flex items-center gap-1">
                                  {tab.label}
                                  {settings.customTabLabels?.[tab.id] && (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isActive ? "bg-zinc-950/70" : "bg-sky-400"
                                      }`}
                                      title={`Custom renamed: ${tab.label}`}
                                    />
                                  )}
                                </span>
                              )}
                            </>
                          )}
                        </button>

                        {/* Error feedback badge positioned directly below the invalid tab */}
                        {hasRenameError && (
                          <div
                            role="alert"
                            id={`tab-rename-error-${tab.id}`}
                            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-zinc-950/95 border border-rose-500/80 text-[11px] text-rose-300 shadow-2xl backdrop-blur-md whitespace-nowrap z-50 flex items-center gap-1.5 font-medium pointer-events-none"
                          >
                            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>{renameError.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>

                {/* Compact Mode Toggle Button */}
                <button
                  type="button"
                  id="toggle-nav-compact-btn"
                  onClick={() =>
                    handleUpdateSettings({
                      navTabDisplay: isCompactNav ? "both" : "icons-only",
                    })
                  }
                  title={
                    isCompactNav
                      ? "Switch to standard layout (Show icons and labels)"
                      : "Switch to compact UI mode (Show icons only)"
                  }
                  className={`p-2.5 rounded-2xl border transition shadow-md flex items-center justify-center shrink-0 ${
                    isCompactNav
                      ? "bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300"
                      : "bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                  }`}
                  aria-label={
                    isCompactNav
                      ? "Current: Compact mode (icons only). Click to show labels."
                      : "Current: Standard mode. Click for compact mode (icons only)."
                  }
                >
                  {isCompactNav ? (
                    <LayoutList className="w-4 h-4" />
                  ) : (
                    <LayoutGrid className="w-4 h-4" />
                  )}
                </button>
              </>
            );
          })()}

          {/* Reset Tab Order Button (visible when customized) */}
          {settings.customTabOrder && settings.customTabOrder.length > 0 && (
            <button
              type="button"
              id="reset-tab-order-btn"
              onClick={handleResetTabOrder}
              title="Reset tabs to default order"
              className="p-2.5 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition shadow-md flex items-center justify-center shrink-0"
              aria-label="Reset tab order"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tab Content Display */}
        <main className="flex-1">
          {activeTab === "console" && (
            <ConsoleTab
              settings={settings}
              activePlatform={activePlatform}
              onExecuteCommand={handleExecuteCommand}
              onStatusChange={onConsoleStatusChange}
            />
          )}

          {activeTab === "chat" && (
            <GeminiChatTab
              assistantName={settings.assistantName}
              onStatusChange={onChatStatusChange}
            />
          )}

          {activeTab === "grounding" && (
            <SearchGroundingTab
              assistantName={settings.assistantName}
              onExecuteCommand={(cmd) => handleExecuteCommand(cmd, 1)}
              onStatusChange={onGroundingStatusChange}
            />
          )}

          {activeTab === "media" && (
            <MediaStudioTab
              assistantName={settings.assistantName}
              onStatusChange={onMediaStatusChange}
            />
          )}

          {activeTab === "documents" && (
            <DocumentReaderTab
              onStatusChange={onDocumentsStatusChange}
            />
          )}

          {activeTab === "workflows" && (
            <WorkflowsTab
              activePlatform={activePlatform}
              onExecuteCommand={handleExecuteCommand}
            />
          )}

          {activeTab === "voice" && (
            <VoiceLabTab settings={settings} onUpdateSettings={handleUpdateSettings} />
          )}

          {activeTab === "permissions" && (
            <PermissionsTab
              settings={settings}
              onChangePermissionLevel={handleChangePermissionLevel}
              onExecuteCommand={handleExecuteCommand}
              activePlatform={activePlatform}
            />
          )}

          {activeTab === "devices" && (
            <DevicesTab devices={devices} onToggleDeviceAuth={handleToggleDeviceAuth} />
          )}

          {activeTab === "docs" && <DocsTab />}

          {activeTab === "logs" && (
            <AuditLogsTab
              logs={logs}
              onClearLogs={handleClearLogs}
              onRefreshLogs={fetchLogs}
            />
          )}

          {activeTab === "deploy" && (
            <DeployHubTab
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
              onExecuteCommand={handleExecuteCommand}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab settings={settings} onUpdateSettings={handleUpdateSettings} />
          )}
        </main>
      </div>

      {/* Level 4/5 Sensitive Action Confirmation Dialog */}
      <ConfirmationModal
        isOpen={pendingAction.isOpen}
        title="Owner Authorization Required"
        message={pendingAction.prompt}
        permissionLevel={pendingAction.requiredLevel}
        onConfirm={handleConfirmAction}
        onCancel={() => setPendingAction((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Gemini 3.1 Live Voice API Real-Time Conversation Modal */}
      <LiveVoiceModal
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
        assistantName={settings.assistantName}
      />

      {/* Delayed Navigation Tab Tooltip (500ms delay to eliminate fast hover visual clutter) */}
      {activeTooltip &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            id="nav-tab-delayed-tooltip"
            className="fixed z-[9999] pointer-events-none transition-all duration-150 ease-out select-none"
            style={{
              top: `${activeTooltip.rect.top + activeTooltip.rect.height + 8}px`,
              left: `${Math.max(120, Math.min(window.innerWidth - 120, activeTooltip.rect.left + activeTooltip.rect.width / 2))}px`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Upward pointer arrow */}
              <div className="w-2.5 h-2.5 bg-zinc-900 border-t border-l border-zinc-700/80 transform rotate-45 -mb-1.5 z-10 shadow-xs" />

              {/* Tooltip Content Body */}
              <div className="px-3.5 py-2 rounded-xl bg-zinc-900/95 border border-zinc-700/80 shadow-2xl backdrop-blur-md flex flex-col items-center gap-1 text-center min-w-[130px] max-w-[240px]">
                <div className="text-xs font-bold text-zinc-100 tracking-tight">
                  {activeTooltip.label}
                </div>
                {activeTooltip.description && (
                  <div className="text-[10px] text-zinc-400 leading-tight">
                    {activeTooltip.description}
                  </div>
                )}
                {/* Live Background Task & Status Indicator in Tooltip */}
                {tabStatuses[activeTooltip.id] && tabStatuses[activeTooltip.id].status !== "idle" && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/80 border border-zinc-700/50 my-0.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        tabStatuses[activeTooltip.id].status === "online"
                          ? "bg-emerald-400"
                          : tabStatuses[activeTooltip.id].status === "busy"
                          ? "bg-amber-400 animate-pulse"
                          : "bg-rose-500"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-mono leading-tight ${
                        tabStatuses[activeTooltip.id].status === "busy"
                          ? "text-amber-300 font-medium"
                          : tabStatuses[activeTooltip.id].status === "error"
                          ? "text-rose-300 font-medium"
                          : "text-zinc-400"
                      }`}
                    >
                      {tabStatuses[activeTooltip.id].label}
                    </span>
                  </div>
                )}
                {settings.customTabLabels?.[activeTooltip.id] && (
                  <div className="text-[9px] text-zinc-400 italic">
                    Original: {defaultNavTabs.find((t) => t.id === activeTooltip.id)?.label}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-[9px] font-mono mt-0.5 pt-1 border-t border-zinc-800/90 w-full justify-center">
                  <span className="text-sky-400 flex items-center gap-1">
                    <GripVertical className="w-2.5 h-2.5 opacity-60 shrink-0" />
                    <span>Drag</span>
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Pencil className="w-2.5 h-2.5 opacity-70 shrink-0" />
                    <span>Double-click to rename</span>
                  </span>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Firestore Save Status Toast */}
      {firestoreSaveToast && (
        <div
          id="firestore-tab-saved-toast"
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-zinc-900/95 border border-emerald-500/50 text-emerald-300 text-xs shadow-2xl backdrop-blur-md transition-all duration-200"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-100">{firestoreSaveToast.message}</span>
            <span className="text-[10px] text-emerald-400 font-mono">Firestore Cloud Synchronized</span>
          </div>
        </div>
      )}
    </div>
  );
}

