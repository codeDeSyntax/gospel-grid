import React, { useEffect, useState } from "react";
import {
  Mic,
  Key,
  ExternalLink,
  Save,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import type { AiProvider } from "@/services/ai/types";

// ── Google Gemini Multi-colored Vector Logo ──────────────────────────────────
const GoogleGeminiLogo: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

// ── Groq Vector Logo ─────────────────────────────────────────────────────────
const GroqLogo: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    <circle cx="12" cy="12" r="11" fill="#F55036" />
    <text
      x="12"
      y="16.2"
      fontSize="13"
      fontWeight="900"
      textAnchor="middle"
      fill="white"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      G
    </text>
  </svg>
);

interface KeyStatusState {
  assembly: boolean;
  groq: boolean;
  gemini: boolean;
  safeStorageAvailable: boolean;
}

interface AiSettingsSectionProps {
  isDarkMode: boolean;
}

export const AiSettingsSection: React.FC<AiSettingsSectionProps> = ({
  isDarkMode,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(() => {
    return (localStorage.getItem("wingrid:ai-provider") as AiProvider) || "groq";
  });

  const [keyStatus, setKeyStatus] = useState<KeyStatusState>({
    assembly: false,
    groq: false,
    gemini: false,
    safeStorageAvailable: true,
  });

  // Inputs for each service
  const [inputs, setInputs] = useState<{ assembly: string; groq: string; gemini: string }>({
    assembly: "",
    groq: "",
    gemini: "",
  });

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [clearingKey, setClearingKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Record<string, { success: boolean; msg: string }>>({});

  useEffect(() => {
    void loadAllKeyStatuses();
  }, []);

  const loadAllKeyStatuses = async () => {
    try {
      // 1. Context Intelligence keys (Groq & Gemini)
      const ciResult = await window.contextIntelligenceAPI?.getKeyStatus?.();
      // 2. AssemblyAI key
      const assemblyResult = await window.speechToTextAPI?.getApiKeyStatus?.();

      setKeyStatus({
        assembly: Boolean(assemblyResult?.hasKey),
        groq: Boolean(ciResult?.groq),
        gemini: Boolean(ciResult?.gemini),
        safeStorageAvailable: Boolean(ciResult?.safeStorageAvailable ?? true),
      });
    } catch {
      // ignore
    }
  };

  const handleSelectProvider = (provider: AiProvider) => {
    setSelectedProvider(provider);
    localStorage.setItem("wingrid:ai-provider", provider);
    window.dispatchEvent(
      new CustomEvent("wingrid:ai-provider-changed", { detail: { provider } }),
    );
  };

  const handleSaveKey = async (target: "assembly" | "groq" | "gemini") => {
    const value = inputs[target]?.trim();
    if (!value) return;

    setSavingKey(target);
    try {
      if (target === "assembly") {
        const res = await window.speechToTextAPI?.setApiKey?.(value);
        if (res?.success) {
          setNotifications((prev) => ({
            ...prev,
            [target]: { success: true, msg: "AssemblyAI key saved!" },
          }));
          setInputs((prev) => ({ ...prev, [target]: "" }));
        } else {
          setNotifications((prev) => ({
            ...prev,
            [target]: { success: false, msg: res?.error || "Failed to save key" },
          }));
        }
      } else {
        const res = await window.contextIntelligenceAPI?.setKey?.(target, value);
        if (res?.success) {
          setNotifications((prev) => ({
            ...prev,
            [target]: { success: true, msg: `${target.toUpperCase()} key saved!` },
          }));
          setInputs((prev) => ({ ...prev, [target]: "" }));
        } else {
          setNotifications((prev) => ({
            ...prev,
            [target]: { success: false, msg: res?.error || "Failed to save key" },
          }));
        }
      }
      await loadAllKeyStatuses();
    } finally {
      setSavingKey(null);
      setTimeout(() => {
        setNotifications((prev) => {
          const next = { ...prev };
          delete next[target];
          return next;
        });
      }, 3500);
    }
  };

  const handleClearKey = async (target: "assembly" | "groq" | "gemini") => {
    setClearingKey(target);
    try {
      if (target === "assembly") {
        await window.speechToTextAPI?.clearApiKey?.();
      } else {
        await window.contextIntelligenceAPI?.clearKey?.(target);
      }
      setNotifications((prev) => ({
        ...prev,
        [target]: { success: true, msg: "Key removed" },
      }));
      await loadAllKeyStatuses();
    } finally {
      setClearingKey(null);
      setTimeout(() => {
        setNotifications((prev) => {
          const next = { ...prev };
          delete next[target];
          return next;
        });
      }, 3500);
    }
  };

  const handleCopyStatus = (target: string, hasKey: boolean) => {
    setCopiedKey(target);
    const textToCopy = hasKey ? "Key is securely stored and active" : "No key configured";
    void navigator.clipboard.writeText(textToCopy);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-3xl pb-20">
      {/* ── SECTION 1: Choose Your AI Presentation Engine ───────────────────── */}
      <div className="flex flex-col gap-2">
        <div>
          <h3
            className={`text-base font-bold tracking-tight ${
              isDarkMode ? "text-white" : "text-neutral-900"
            }`}
          >
            Choose Your AI Presentation Engine
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            Select how the assistant extracts visual cards, lower thirds, and insights from live spoken speech.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2">
          {/* Card 1: Groq (Ultra-Fast) */}
          <div
            onClick={() => handleSelectProvider("groq")}
            className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all cursor-pointer ${
              selectedProvider === "groq"
                ? isDarkMode
                  ? "border-2 border-neutral-300 bg-neutral-900/90 shadow-sm"
                  : "border-2 border-neutral-700 bg-white shadow-sm"
                : isDarkMode
                  ? "border border-white/5 bg-neutral-900/40 hover:border-white/15"
                  : "border border-neutral-200 bg-neutral-100/70 hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <GroqLogo className="w-5 h-5 shrink-0" />
                <span
                  className={`text-sm font-bold ${
                    isDarkMode ? "text-white" : "text-neutral-900"
                  }`}
                >
                  Groq (Ultra-Fast)
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDarkMode
                    ? "bg-neutral-800 text-white"
                    : "bg-neutral-800 text-white"
                }`}
              >
                Instant
              </span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDarkMode ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              Generates broadcast cards and lower thirds in sub-second speed. Optimal for live events and fast presentations.
            </p>
          </div>

          {/* Card 2: Google Gemini */}
          <div
            onClick={() => handleSelectProvider("gemini")}
            className={`group relative flex flex-col justify-between p-4 rounded-2xl transition-all cursor-pointer ${
              selectedProvider === "gemini"
                ? isDarkMode
                  ? "border-2 border-neutral-300 bg-neutral-900/90 shadow-sm"
                  : "border-2 border-neutral-700 bg-white shadow-sm"
                : isDarkMode
                  ? "border border-white/5 bg-neutral-900/40 hover:border-white/15"
                  : "border border-neutral-200 bg-neutral-100/70 hover:border-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <GoogleGeminiLogo className="w-5 h-5 shrink-0" />
                <span
                  className={`text-sm font-bold ${
                    isDarkMode ? "text-white" : "text-neutral-900"
                  }`}
                >
                  Google Gemini
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isDarkMode
                    ? "bg-neutral-800 text-neutral-300 border border-neutral-700"
                    : "bg-white text-neutral-700 border border-neutral-200"
                }`}
              >
                Smart
              </span>
            </div>
            <p
              className={`text-xs leading-relaxed ${
                isDarkMode ? "text-neutral-400" : "text-neutral-600"
              }`}
            >
              High reasoning capacity for complex keynotes, panel discussions, and nuanced presentation topic extraction.
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 2: AI Service Connections & API Keys ────────────────────── */}
      <div className="flex flex-col gap-2">
        <div>
          <h3
            className={`text-base font-bold tracking-tight ${
              isDarkMode ? "text-white" : "text-neutral-900"
            }`}
          >
            AI Service Connections & API Keys
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            Manage your credentials for speech recognition and live presentation intelligence.
          </p>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          {/* Row 1: Microphone Voice Listener (AssemblyAI) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isDarkMode ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isDarkMode ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    Microphone Voice Listener (AssemblyAI)
                  </h4>
                  <p
                    className={`text-[11px] ${
                      isDarkMode ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    Real-time streaming speech-to-text transcription
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.assemblyai.com/dashboard/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline font-medium"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("assembly", keyStatus.assembly)}
                  className={`p-1.5 rounded-lg transition-all ${
                    keyStatus.assembly
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                  title={keyStatus.assembly ? "AssemblyAI Key Active" : "No Key Set"}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("assembly", keyStatus.assembly)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                  title="Copy status"
                >
                  {copiedKey === "assembly" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inputs.assembly}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, assembly: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveKey("assembly");
                }}
                placeholder="Paste new key to replace existing..."
                className={`flex-1 h-9 px-3 rounded-lg text-xs outline-none border-0 transition-all ${
                  isDarkMode
                    ? "bg-neutral-800 text-white placeholder:text-neutral-500"
                    : "bg-neutral-100 text-neutral-900 placeholder:text-neutral-400"
                }`}
              />

              <button
                type="button"
                onClick={() => handleSaveKey("assembly")}
                disabled={!inputs.assembly.trim() || savingKey === "assembly"}
                className={`h-9 px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10"
                    : "bg-neutral-800 hover:bg-neutral-900 text-white shadow-sm"
                }`}
              >
                {savingKey === "assembly" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={() => handleClearKey("assembly")}
                disabled={!keyStatus.assembly || clearingKey === "assembly"}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-red-600/80 text-neutral-300 hover:text-white border border-white/10"
                    : "bg-white hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-300 shadow-sm"
                }`}
                title="Delete key"
              >
                {clearingKey === "assembly" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {notifications.assembly && (
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  notifications.assembly.success ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {notifications.assembly.msg}
              </p>
            )}
          </div>

          {/* Row 2: Groq Key (Ultra-Fast Engine) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isDarkMode ? "bg-rose-500/15" : "bg-rose-50"
                  }`}
                >
                  <GroqLogo className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isDarkMode ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    Groq Key (Ultra-Fast Engine)
                  </h4>
                  <p
                    className={`text-[11px] ${
                      isDarkMode ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    Sub-second live broadcast & presentation card extraction
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline font-medium"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("groq", keyStatus.groq)}
                  className={`p-1.5 rounded-lg transition-all ${
                    keyStatus.groq
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                  title={keyStatus.groq ? "Groq Key Active" : "No Key Set"}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("groq", keyStatus.groq)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                  title="Copy status"
                >
                  {copiedKey === "groq" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inputs.groq}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, groq: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveKey("groq");
                }}
                placeholder="Paste new key to replace existing..."
                className={`flex-1 h-9 px-3 rounded-lg text-xs outline-none border-0 transition-all ${
                  isDarkMode
                    ? "bg-neutral-800 text-white placeholder:text-neutral-500"
                    : "bg-neutral-100 text-neutral-900 placeholder:text-neutral-400"
                }`}
              />

              <button
                type="button"
                onClick={() => handleSaveKey("groq")}
                disabled={!inputs.groq.trim() || savingKey === "groq"}
                className={`h-9 px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10"
                    : "bg-neutral-800 hover:bg-neutral-900 text-white shadow-sm"
                }`}
              >
                {savingKey === "groq" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={() => handleClearKey("groq")}
                disabled={!keyStatus.groq || clearingKey === "groq"}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-red-600/80 text-neutral-300 hover:text-white border border-white/10"
                    : "bg-white hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-300 shadow-sm"
                }`}
                title="Delete key"
              >
                {clearingKey === "groq" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {notifications.groq && (
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  notifications.groq.success ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {notifications.groq.msg}
              </p>
            )}
          </div>

          {/* Row 3: Google Gemini Key (Smart Finder) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isDarkMode ? "bg-blue-500/15" : "bg-neutral-100"
                  }`}
                >
                  <GoogleGeminiLogo className="w-4 h-4 shrink-0" />
                </div>
                <div>
                  <h4
                    className={`text-xs font-bold leading-tight ${
                      isDarkMode ? "text-white" : "text-neutral-900"
                    }`}
                  >
                    Google Gemini Key (High-Reasoning Engine)
                  </h4>
                  <p
                    className={`text-[11px] ${
                      isDarkMode ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    Free API key from Google AI Studio for deep context & smart cards
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white underline font-medium"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("gemini", keyStatus.gemini)}
                  className={`p-1.5 rounded-lg transition-all ${
                    keyStatus.gemini
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : "text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5"
                  }`}
                  title={keyStatus.gemini ? "Google Gemini Key Active" : "No Key Set"}
                >
                  <Key className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleCopyStatus("gemini", keyStatus.gemini)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-all"
                  title="Copy status"
                >
                  {copiedKey === "gemini" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Input Row */}
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={inputs.gemini}
                onChange={(e) =>
                  setInputs((prev) => ({ ...prev, gemini: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSaveKey("gemini");
                }}
                placeholder="Paste new key to replace existing..."
                className={`flex-1 h-9 px-3 rounded-lg text-xs outline-none border-0 transition-all ${
                  isDarkMode
                    ? "bg-neutral-800 text-white placeholder:text-neutral-500"
                    : "bg-neutral-100 text-neutral-900 placeholder:text-neutral-400"
                }`}
              />

              <button
                type="button"
                onClick={() => handleSaveKey("gemini")}
                disabled={!inputs.gemini.trim() || savingKey === "gemini"}
                className={`h-9 px-3.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-white/10"
                    : "bg-neutral-800 hover:bg-neutral-900 text-white shadow-sm"
                }`}
              >
                {savingKey === "gemini" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save</span>
              </button>

              <button
                type="button"
                onClick={() => handleClearKey("gemini")}
                disabled={!keyStatus.gemini || clearingKey === "gemini"}
                className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-red-600/80 text-neutral-300 hover:text-white border border-white/10"
                    : "bg-white hover:bg-red-50 text-neutral-600 hover:text-red-600 border border-neutral-300 shadow-sm"
                }`}
                title="Delete key"
              >
                {clearingKey === "gemini" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {notifications.gemini && (
              <p
                className={`text-[11px] font-semibold mt-0.5 ${
                  notifications.gemini.success ? "text-emerald-500" : "text-red-400"
                }`}
              >
                {notifications.gemini.msg}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
