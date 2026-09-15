export interface DocItem {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  category: "Architecture" | "Core Systems" | "Platforms" | "Guides & Security";
  content: string;
  codeSnippet?: string;
  codeLanguage?: string;
}

export const DOCUMENTATION_DATA: DocItem[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Complete Project Architecture",
    subtitle: "End-to-End System Design & Cross-Platform Orchestration",
    category: "Architecture",
    content: `The Astra Personal AI Assistant is architected as an owner-exclusive, zero-trust system comprising a Unified TypeScript/Node Core, native platform bridge daemons, and a full-featured Web Operating Console.

### High-Level Architectural Flow:
1. **Perception Layer (Voice & Text)**: Captures wake-word events ("Hello Astra") through Web Audio / Porcupine edge modules, performs noise-filtering, and executes local speech-to-text.
2. **Cognitive Brain (Gemini 3.8 Flash + Local Fallback)**: Translates multi-lingual natural language (English, Hindi, Hinglish) into validated intents and structured JSON action manifests.
3. **Safety & Policy Gateway**: Intercepts every action proposal through a 5-tier Permission Grid. Level 4 (Sensitive) and Level 5 (Admin) operations mandate cryptographic or two-factor confirmation.
4. **Platform Execution Bus**: Dispatches vetted payloads to native daemons across macOS, Windows, Linux, and Android over secured mTLS WebSocket channels.
5. **Audit & Telemetry Sink**: Logs every interaction, device authorization, and outcome with tamper-evident records.`,
    codeSnippet: `[User Voice / Text Input]
            │
    ▼ (Wake Word & Biometrics)
┌──────────────────────────────────────────────┐
│        ASTRA UNIFIED CORE ENGINE             │
│  - Speech-To-Text / TTS Pipeline (EN/HI)     │
│  - Gemini 3.8 Flash Reasoning & Planning     │
│  - 5-Tier Permission & Safety Enforcement   │
│  - Routine & Workflow Sequencer              │
└──────────────────────┬───────────────────────┘
                       │ (mTLS Secure RPC)
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
   [macOS Daemon] [Windows Bridge] [Linux Host]
   (AppleScript)   (PowerShell)    (systemd/D-Bus)`,
    codeLanguage: "text",
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Technology Stack Explanation",
    subtitle: "Language, Framework, Database & Cloud Selection",
    category: "Architecture",
    content: `Astra leverages a modern, low-latency, cross-platform stack selected for memory safety, developer velocity, and native operating system hooks.

- **Unified Core & Web Console**: TypeScript 5.8, Node.js 22 LTS, Express 4.21, React 19, Tailwind CSS 4, Motion React animations.
- **AI Engine**: Google Gen AI SDK (\`@google/genai\`) targeting \`gemini-3.8-flash\` for lightning-fast 200ms conversational inference with full multimodal document comprehension.
- **Voice System**: Web Speech API + SpeechSynthesis / Gemini Live Audio PCM streamer with support for English, Hindi, and Hinglish.
- **Database & State**: SQLite (embedded on edge clients) and PostgreSQL (for cloud sync), paired with JSON-schema configuration files.
- **Native OS Bridges**:
  - macOS: Swift / Objective-C / AppleScript / launchd daemon.
  - Windows: PowerShell 7.4 / Win32 API / C# Host.
  - Linux: Bash / Python 3.12 / systemd daemon.
  - Android: Kotlin / Android Accessibility & Foreground Service.`,
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Folder Structure",
    subtitle: "Modular, Maintainable Monorepo Layout",
    category: "Architecture",
    content: `The repository is organized following clean hexagonal architecture principles, ensuring strict isolation between platform-specific code and the core intelligence engine.`,
    codeSnippet: `personal-ai/
├── core/                  # Shared AI Brain, Intent Parsing, Safety
│   ├── ai_engine.ts       # Gemini API & Fallback Providers
│   ├── permissions.ts     # Levels 1-5 Security Gate
│   └── workflows.ts       # Routine & Macro Executor
├── voice/                 # Speech Recognition & Synthesis
│   ├── wake_word.ts       # Audio Buffer & Keyword Matching
│   └── tts_engine.ts      # Multi-speaker Voice Output
├── authentication/        # Owner Identity & Passkey/MFA
├── config/                # Editable JSON configurations
│   ├── config.json
│   ├── permissions.json
│   └── commands.json
├── platforms/
│   ├── macos/             # AppleScript & launchd agent
│   ├── windows/           # PowerShell 7 Bridge
│   ├── linux/             # systemd service & D-Bus scripts
│   └── android/           # Kotlin Service & ADB client
├── web/                   # Interactive Operating Console (Vite+React)
└── tests/                 # End-to-End & Security test suites`,
    codeLanguage: "bash",
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Database Design",
    subtitle: "Relational Schemas for Devices, Users, Logs & Routines",
    category: "Core Systems",
    content: `Supports dual-mode storage: SQLite for offline local operation and PostgreSQL for multi-device cloud synchronization.`,
    codeSnippet: `-- Core Database Schema (PostgreSQL / SQLite compatible)

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(128) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    mfa_secret VARCHAR(128),
    role VARCHAR(32) DEFAULT 'owner',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) REFERENCES users(id),
    device_name VARCHAR(128) NOT NULL,
    platform VARCHAR(32) NOT NULL, -- macOS, Windows, Linux, Android, Web
    ip_address VARCHAR(45),
    is_authorized BOOLEAN DEFAULT TRUE,
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id VARCHAR(64) PRIMARY KEY,
    device_id VARCHAR(64) REFERENCES devices(id),
    command TEXT NOT NULL,
    category VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL,
    permission_level INT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,
    codeLanguage: "sql",
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Authentication System",
    subtitle: "Multi-Factor, Passkey & Emergency Recovery",
    category: "Core Systems",
    content: `Astra adheres to strict owner ownership:
- **Primary Auth**: Argon2id hashed passwords, WebAuthn / FIDO2 Passkeys, and TOTP Multi-Factor Authentication.
- **Biometric Layer**: Voice profile timbre verification acts as a secondary convenience factor.
- **Fail-Safe Recovery**: If voice recognition fails or changes due to illness/environment, the owner can seamlessly authenticate with their recovery codes or email verification. Voice failure will NEVER lock the owner out.`,
  },
  {
    id: "step-6",
    stepNumber: 6,
    title: "Voice System",
    subtitle: "Wake Word, Continuous Speech-To-Text & Hindi/Hinglish",
    category: "Core Systems",
    content: `Features customizable wake words (default: 'Hello Astra', configurable to any phrase).
- **Speech-to-Text**: Low-latency continuous listening with audio silence detection.
- **Language Models**: Native support for English (US/UK/IN), Hindi (हिन्दी), and mixed Hinglish phrases (e.g., "Astra, meri PDF read karo aur VS Code kholo").
- **Voice Profiles**: Calibration dashboard allowing registration of pitch, volume, and timbre baseline.`,
  },
  {
    id: "step-7",
    stepNumber: 7,
    title: "Permission System",
    subtitle: "5-Tier Granular Security Model",
    category: "Core Systems",
    content: `Every requested task maps to an explicit permission tier:
- **Level 1 (Read-Only)**: Reading documents, parsing files, reading weather/calendar info, viewing logs.
- **Level 2 (Basic Control)**: Opening approved applications, switching windows, adjusting volume.
- **Level 3 (Advanced Control)**: Creating files, organizing directories, running pre-approved build scripts.
- **Level 4 (Sensitive Actions)**: Deleting files, modifying network settings, financial transactions, sending messages. **Mandatory interactive confirmation dialog.**
- **Level 5 (Administrator)**: Device pairing/revocation, changing master passwords, modifying security rules, flashing firmware.`,
  },
  {
    id: "step-8",
    stepNumber: 8,
    title: "Command System",
    subtitle: "Extensible Intent Engine & Routine Chaining",
    category: "Core Systems",
    content: `Empowers the owner to trigger complex multi-step routines using natural voice triggers.
- **Study Mode**: Opens Notion, opens ArXiv/Google Scholar, sets DND mode, plays ambient focus audio.
- **Programming Mode**: Launches VS Code in project directory, opens terminal session, launches Docker, opens localhost preview.
- **Custom Macros**: Users can create, edit, reorder, and export custom routines.`,
  },
  {
    id: "step-9",
    stepNumber: 9,
    title: "macOS Implementation",
    subtitle: "AppleScript, JXA & Background launchd Daemon",
    category: "Platforms",
    content: `macOS integration executes through a lightweight launchd agent communicating with the macOS system events API.`,
    codeSnippet: `-- AppleScript Snippet for Application & Window Control
on run argv
    set appName to item 1 of argv
    tell application "System Events"
        if not (exists application process appName) then
            tell application appName to activate
        else
            tell application process appName
                set frontmost to true
            end tell
        end if
    end tell
    return "SUCCESS: Activated " & appName
end run`,
    codeLanguage: "applescript",
  },
  {
    id: "step-10",
    stepNumber: 10,
    title: "Windows Implementation",
    subtitle: "PowerShell 7 Bridge & Win32 Process Controller",
    category: "Platforms",
    content: `Windows implementation utilizes PowerShell 7.4 cmdlets, Windows Event Logging, and WMI/CIM query interfaces for process and file tracking.`,
    codeSnippet: `# PowerShell 7 Window Focus & App Launch Script
param([string]$AppName)

try {
    $proc = Get-Process -Name $AppName -ErrorAction SilentlyContinue
    if (-not $proc) {
        Start-Process $AppName
        Write-Output "SUCCESS: Launched $AppName"
    } else {
        Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class WinApp {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
        }
"@
        [WinApp]::SetForegroundWindow($proc[0].MainWindowHandle)
        Write-Output "SUCCESS: Brought $AppName to front"
    }
} catch {
    Write-Error $_.Exception.Message
}`,
    codeLanguage: "powershell",
  },
  {
    id: "step-11",
    stepNumber: 11,
    title: "Linux Implementation",
    subtitle: "systemd Unit, D-Bus & Desktop Notification Daemon",
    category: "Platforms",
    content: `Runs as an unprivileged user service on Linux (Ubuntu, Debian, Fedora, Arch) using systemd user units and D-Bus commands for desktop environment integration.`,
    codeSnippet: `#!/usr/bin/env bash
# Linux Desktop Automation Helper
COMMAND=$1
TARGET=$2

case "$COMMAND" in
    "launch")
        xdg-open "$TARGET" >/dev/null 2>&1 &
        echo "Launched $TARGET"
        ;;
    "notify")
        notify-send -a "Astra AI" "Astra Assistant" "$TARGET"
        ;;
    "focus")
        wmctrl -a "$TARGET" || echo "Window not found"
        ;;
esac`,
    codeLanguage: "bash",
  },
  {
    id: "step-12",
    stepNumber: 12,
    title: "Android Implementation",
    subtitle: "Foreground Kotlin Service & Termux/ADB Bridge",
    category: "Platforms",
    content: `Mobile support functions through an Android foreground service with a persistent notification and audio wake detection, or via Termux/ADB bridge for direct shell automation.`,
  },
  {
    id: "step-13",
    stepNumber: 13,
    title: "Web Dashboard",
    subtitle: "Live Interactive Command Console & Device Monitor",
    category: "Platforms",
    content: `The primary operating interface featuring:
- Voice & text input with live waveform and wake-word detector.
- Real-time permission gate simulator.
- Document reader and code analyzer powered by Gemini 3.8 Flash.
- Device status table, activity audit log, and configuration manager.`,
  },
  {
    id: "step-14",
    stepNumber: 14,
    title: "API Documentation",
    subtitle: "REST & Realtime WebSocket Interface Specifications",
    category: "Guides & Security",
    content: `Comprehensive API specification for building custom extensions:
- \`POST /api/chat\`: Natural language command input.
- \`POST /api/execute\`: Command validation and OS dispatch.
- \`POST /api/analyze-document\`: Multi-format document summarization.
- \`GET /api/devices\`: Device inventory and ping telemetry.
- \`POST /api/settings\`: Synchronize permissions and preferences.`,
  },
  {
    id: "step-15",
    stepNumber: 15,
    title: "Installation Guide",
    subtitle: "Step-by-Step Setup Across All Platforms",
    category: "Guides & Security",
    content: `Complete setup instructions:
1. Clone the repository and install Node.js 22 LTS.
2. Run \`npm install\` to set up dependencies.
3. Configure your \`.env\` file with \`GEMINI_API_KEY\`.
4. Run \`npm run build\` and \`npm start\` to start the unified core.
5. Deploy platform-specific bridge daemons on your target workstations.`,
  },
  {
    id: "step-16",
    stepNumber: 16,
    title: "Configuration Files",
    subtitle: "JSON Specifications for Settings, Permissions & Commands",
    category: "Guides & Security",
    content: `Editable configurations enable full customization without recompilation:
- \`config.json\`: Assistant name, wake word, active AI model, theme.
- \`permissions.json\`: Role-based access and action restriction rules.
- \`commands.json\`: Custom macros and step sequences.`,
    codeSnippet: `{
  "assistantName": "Astra",
  "wakeWord": "Hello Astra",
  "owner": "Vishal Raj Gond",
  "defaultPermissionLevel": 3,
  "privacyMode": false,
  "aiProvider": "gemini-3.8-flash",
  "supportedLanguages": ["en", "hi", "hinglish"]
}`,
    codeLanguage: "json",
  },
  {
    id: "step-17",
    stepNumber: 17,
    title: "Example Commands",
    subtitle: "Catalog of Voice & Text Commands",
    category: "Guides & Security",
    content: `Supported voice and text commands:
- "Hello Astra, open VS Code"
- "Open my files and find quarterly report"
- "Read this document and summarize key findings"
- "Astra, Study Mode activate karo" (Hinglish)
- "Switch to Programming Mode"
- "Search Google for latest Gemini models"
- "Delete old cache files" (prompts confirmation)
- "Astra, go offline" (enters privacy sleep)`,
  },
  {
    id: "step-18",
    stepNumber: 18,
    title: "Source Code Architecture",
    subtitle: "Clean Code & Separation of Concerns",
    category: "Guides & Security",
    content: `All critical code sections feature inline documentation explaining inputs, outputs, permission prerequisites, error boundaries, and security considerations.`,
  },
  {
    id: "step-19",
    stepNumber: 19,
    title: "Test Cases",
    subtitle: "Unit, Integration & Security Test Suites",
    category: "Guides & Security",
    content: `Test cases covering:
1. Wake word false-positive rejection.
2. Level 4/5 permission escalation blocks without confirmation.
3. Network disconnection recovery and offline queuing.
4. Voice timbre biometric deviation fallback.`,
    codeSnippet: `describe("Astra Security & Permission Gate", () => {
  it("should reject Level 4 destructive command without confirmation", async () => {
    const res = await request(app)
      .post("/api/execute")
      .send({ command: "delete system files", requiredLevel: 4, confirmed: false });
    expect(res.body.requiresConfirmation).toBe(true);
  });
});`,
    codeLanguage: "typescript",
  },
  {
    id: "step-20",
    stepNumber: 20,
    title: "Security & Commercialization Guide",
    subtitle: "Zero Trust, Code Signing, Licensing & IP Protection",
    category: "Guides & Security",
    content: `Guidelines for private ownership and commercial readiness:
- **Zero Trust Principles**: Never trust client claims without cryptographic verification.
- **Licensing**: Proprietary EULA vs Open-Core licensing options.
- **Legal Protections**: Trademarking assistant branding and copyright registrations.
- **Technical Safeguards**: Binary signing (Apple Developer ID, Microsoft Authenticode), server-side entitlement tokens, and secure key vaults.`,
  },
];
