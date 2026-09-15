export type Platform = "macOS" | "Windows" | "Linux" | "Android" | "Web";

export interface Device {
  id: string;
  name: string;
  platform: Platform;
  status: "online" | "offline" | "busy";
  lastSeen: string;
  ip: string;
  authorized: boolean;
  version: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  command: string;
  category: "app" | "file" | "voice" | "system" | "security" | "web";
  status: "success" | "pending_confirmation" | "denied" | "failed";
  permissionLevel: number;
  details: string;
  device: string;
}

export interface AssistantSettings {
  assistantName: string;
  wakeWord: string;
  ownerName: string;
  ownerEmail: string;
  language: "en" | "hi" | "hinglish";
  ttsVoice: string;
  currentPermissionLevel: number; // 1 to 5
  privacyMode: boolean;
  voiceAccessEnabled: boolean;
  mfaEnabled: boolean;
  aiProvider: "gemini-flash" | "gemini-6.3-flash" | "gemini-pro" | "local-hybrid" | "custom";
  activePlatform: Platform;
  theme: "dark" | "light" | "cyber";
  customTabOrder?: string[];
  customTabLabels?: Record<string, string>;
  navTabDisplay?: "both" | "icons-only";
}

export interface LegalOwnershipCertificate {
  certificateId: string;
  ownerName: string;
  ownerEmail: string;
  applicationName: string;
  issueDate: string;
  status: "verified" | "active";
  legalDeclaration: string;
  licenseType: string;
  copyrightNotice: string;
  cryptographicSignature: string;
}

export type TabStatusType = "idle" | "online" | "busy" | "error";

export interface TabStatusState {
  status: TabStatusType;
  label?: string;
}

export interface VoiceProfile {
  wakeWord: string;
  speechRate: number;
  pitch: number;
  accent: string;
  voiceMatches: number;
  confidenceScore: number;
  isRegistered: boolean;
  registeredDate: string;
  audioSampleCount: number;
}

export interface CustomRoutine {
  id: string;
  name: string;
  triggerPhrase: string;
  description: string;
  enabled: boolean;
  requiredPermission: number;
  steps: {
    order: number;
    action: string;
    target: string;
    params?: string;
  }[];
}

export interface DocumentSample {
  id: string;
  name: string;
  type: "pdf" | "code" | "csv" | "markdown" | "txt";
  description: string;
  content: string;
}

export interface ActionProposal {
  type: string;
  command: string;
  requiredLevel: number;
  needsConfirmation: boolean;
  target: string;
}

export type ChatModelId = "gemini-3.1-pro-preview" | "gemini-3.5-flash" | "gemini-3.1-flash-lite";

export type AssistantPersona = "assistant" | "architect" | "security" | "creative" | "researcher";

export interface SearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface AdvancedChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  modelUsed?: string;
  searchSources?: SearchSource[];
  searchQueries?: string[];
  latencyMs?: number;
}

export interface MediaCreationItem {
  id: string;
  type: "image" | "video" | "music_clip" | "music_track" | "transcription";
  title: string;
  prompt: string;
  resultUrl?: string;
  audioUrl?: string;
  textResult?: string;
  model: string;
  timestamp: string;
  aspectRatio?: string;
  lyrics?: string;
}
