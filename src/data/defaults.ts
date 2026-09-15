import { CustomRoutine, DocumentSample } from "../types";

export const DEFAULT_ROUTINES: CustomRoutine[] = [
  {
    id: "routine-study",
    name: "Study Mode",
    triggerPhrase: "Study Mode",
    description: "Prepares a distraction-free learning environment with notes, research tabs, and ambient audio.",
    enabled: true,
    requiredPermission: 2,
    steps: [
      { order: 1, action: "Launch Notion / Notes", target: "Notion.app" },
      { order: 2, action: "Open Academic Browser Tabs", target: "https://arxiv.org, https://scholar.google.com" },
      { order: 3, action: "Mute Distracting Notifications", target: "Do Not Disturb: ON" },
      { order: 4, action: "Start Lo-Fi Ambient Study Soundscape", target: "Spotify / Audio Engine" },
    ],
  },
  {
    id: "routine-programming",
    name: "Programming Mode",
    triggerPhrase: "Programming Mode",
    description: "Spins up the full development workspace: IDE, Docker daemon, Terminal, and Git sync.",
    enabled: true,
    requiredPermission: 3,
    steps: [
      { order: 1, action: "Launch Visual Studio Code", target: "code ~/workspace/personal-ai" },
      { order: 2, action: "Open Elevated Terminal Shell", target: "Terminal (tmux session)" },
      { order: 3, action: "Verify Docker & Containers", target: "docker compose up -d" },
      { order: 4, action: "Launch Chromium DevTools", target: "http://localhost:3000" },
    ],
  },
  {
    id: "routine-focus",
    name: "Focus Lock",
    triggerPhrase: "Focus Lock",
    description: "Enforces a 45-minute deep work block, minimizing window clutter and blocking social tabs.",
    enabled: true,
    requiredPermission: 2,
    steps: [
      { order: 1, action: "Minimize Non-Work Applications", target: "Window Manager" },
      { order: 2, action: "Set System Status to Busy", target: "Slack & Calendar" },
      { order: 3, action: "Arm Pomodoro Timer", target: "45 Minutes Countdown" },
    ],
  },
  {
    id: "routine-night",
    name: "Night Routine / Sleep",
    triggerPhrase: "Assistant, go offline",
    description: "Safely concludes daily sessions, syncs git changes, and places assistant into low-power sleep mode.",
    enabled: true,
    requiredPermission: 2,
    steps: [
      { order: 1, action: "Commit & Sync Working Trees", target: "git auto-stash/commit" },
      { order: 2, action: "Dim Display Brightness", target: "Display Backlight: 20%" },
      { order: 3, action: "Enter Sleep & Privacy Mode", target: "Assistant Engine Sleep" },
    ],
  },
  {
    id: "routine-level5-root",
    name: "Level 5: Root Security & Key Rotation",
    triggerPhrase: "Execute Level 5 security protocol",
    description: "Administrator root protocol: Rotates cryptographic master keys, audits connected devices, and validates zero-trust certificates.",
    enabled: true,
    requiredPermission: 5,
    steps: [
      { order: 1, action: "Verify Owner Biometrics / Passkey", target: "Local Enclave" },
      { order: 2, action: "Rotate 4096-bit Master Keypair", target: "Key Vault" },
      { order: 3, action: "Audit Zero-Trust Device Fleet", target: "Device Manager" },
      { order: 4, action: "Generate Level 5 Security Audit Hash", target: "Audit Ledger" },
    ],
  },
];

export const SAMPLE_DOCUMENTS: DocumentSample[] = [
  {
    id: "doc-py",
    name: "ai_vision_agent.py",
    type: "code",
    description: "Cross-platform edge computer vision agent with object detection.",
    content: `"""
AI Vision Agent - Edge Sensor Loop
Platform: Cross-Platform (macOS Metal / Linux CUDA / Windows DirectML)
"""
import sys
import time
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("AstraVision")

class VisionAgent:
    def __init__(self, model_path: str = "models/gemini_nano.onnx"):
        self.model_path = model_path
        self.active = False
        logger.info(f"Initialized VisionAgent with model: {model_path}")

    def start_pipeline(self) -> Dict[str, Any]:
        self.active = True
        logger.info("Pipeline started. Monitoring authorized video feeds...")
        return {
            "fps": 60.0,
            "latency_ms": 4.2,
            "status": "nominal",
            "detected_objects": ["Owner Workspace", "Dual Monitors", "Keyboard"]
        }

    def stop_pipeline(self):
        self.active = False
        logger.info("Pipeline safely deactivated.")

if __name__ == "__main__":
    agent = VisionAgent()
    stats = agent.start_pipeline()
    print("Agent Diagnostics:", stats)
`,
  },
  {
    id: "doc-arch",
    name: "Astra_Architecture_Blueprint.md",
    type: "markdown",
    description: "Core architecture blueprint for multi-device zero-trust communication.",
    content: `# Astra Personal AI Assistant - Architecture Blueprint

## Core Directives
1. **Zero-Trust Communication**: Every platform daemon authenticates with an mTLS token and ECDSA signature.
2. **Owner-Centric Access**: Level 1 (Read-Only) to Level 5 (Root/Admin).
3. **Safety Guarantee**: Irreversible actions (file deletion, network sockets, system privilege modification) require mandatory owner consent.

## Modular Layers
- **Core AI Engine**: Gemini 3.8 Flash + local quantized fallback.
- **Voice Pipeline**: WebSpeech API + Wake Word Detector ("Hello Astra") + Gemini Live audio bridge.
- **Bridge Daemons**:
  - macOS: AppleScript / CoreGraphics bridge.
  - Windows: PowerShell 7.4 / Win32 API bridge.
  - Linux: systemd unit + DBus desktop integration.
  - Android: Foreground Kotlin service + Accessibility API.
`,
  },
  {
    id: "doc-csv",
    name: "device_telemetry_report.csv",
    type: "csv",
    description: "System diagnostics and command response metrics across all 5 devices.",
    content: `device_id,device_name,platform,cpu_usage_pct,ram_usage_gb,network_ping_ms,security_status
dev-mac-01,MacBook Pro M3 Max,macOS,14.2,28.4,2,SECURE_LEVEL_5
dev-win-02,Windows 11 Rig,Windows,22.1,18.9,8,SECURE_LEVEL_4
dev-lin-03,Ubuntu Server 24.04,Linux,6.5,4.2,4,SECURE_LEVEL_5
dev-and-04,Pixel 9 Pro,Android,9.1,6.8,16,SECURE_LEVEL_3
dev-web-05,Web Cloud Console,Web,3.0,1.2,1,SECURE_LEVEL_5`,
  },
];

export const NATIVE_SCRIPTS = {
  macOS: `#!/bin/bash
# ==============================================================================
# Astra Personal AI Assistant - macOS Bridge Daemon
# Location: ~/Library/Application Support/Astra/daemon.sh
# ==============================================================================
set -e

ASTRA_SERVER="http://localhost:3000"
DEVICE_ID="dev-mac-01"
TOKEN="ASTRA_AUTH_BEARER_TOKEN_LOCAL"

echo "[Astra macOS] Starting native daemon..."
echo "[Astra macOS] Connecting to core server at $ASTRA_SERVER..."

# Health check
curl -s "$ASTRA_SERVER/api/health" | grep -q "ok" && echo " Core server is ONLINE"

# Listener loop for local dispatch
while true; do
  # Poll for pending local commands
  RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "$ASTRA_SERVER/api/devices")
  # Handle native AppleScript app execution
  sleep 3
done
`,
  windows: `# ==============================================================================
# Astra Personal AI Assistant - Windows 11 PowerShell 7 Bridge
# Location: C:\\ProgramData\\Astra\\bridge.ps1
# ==============================================================================
$ErrorActionPreference = "Stop"
$ServerUrl = "http://localhost:3000"
$DeviceId = "dev-win-02"

Write-Host " [Astra Windows] Initializing PowerShell Bridge Agent..." -ForegroundColor Cyan
Write-Host " [Astra Windows] Server target: $ServerUrl" -ForegroundColor Gray

# Register Windows Event Log Source
if (-not [System.Diagnostics.EventLog]::SourceExists("AstraAssistant")) {
    New-EventLog -LogName Application -Source "AstraAssistant"
}

Write-Host " [Astra Windows] Daemon ready. Listening for authorized application events." -ForegroundColor Green
`,
  linux: `#!/usr/bin/env bash
# ==============================================================================
# Astra Personal AI Assistant - Linux systemd Service
# Location: /etc/systemd/system/astra-agent.service
# ==============================================================================
[Unit]
Description=Astra Personal AI Assistant Linux Bridge Daemon
After=network.target dbus.service

[Service]
Type=simple
User=vishal
WorkingDirectory=/opt/astra
ExecStart=/usr/bin/node /opt/astra/dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
`,
  android: `// ==============================================================================
// Astra Personal AI Assistant - Android Foreground Kotlin Service
// Location: app/src/main/java/com/astra/assistant/AstraService.kt
// ==============================================================================
package com.astra.assistant

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.IBinder

class AstraService : Service() {
    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(1001, buildPersistentNotification())
        initVoiceWakeEngine()
    }

    private fun initVoiceWakeEngine() {
        // Porcupine / WebRTC voice wake detector ("Hello Astra")
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel("astra_bg", "Astra Engine", NotificationManager.IMPORTANCE_LOW)
        getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
    }

    private fun buildPersistentNotification(): Notification {
        return Notification.Builder(this, "astra_bg")
            .setContentTitle("Astra AI Assistant")
            .setContentText("Active & listening for authorized voice commands")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .build()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
`,
};
