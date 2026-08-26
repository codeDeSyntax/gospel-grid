import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Trash2,
  FlaskConical,
} from "lucide-react";
import type { AiProvider } from "@/services/ai/types";

// ── Official OpenAI / ChatGPT Vector Logo ───────────────────────────────────
const OpenAiLogo: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1239 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6668zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

// ── Official Groq Vector Logo ───────────────────────────────────────────────
const GroqLogo: React.FC<{ className?: string }> = ({
  className = "w-5 h-5",
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c2.41 0 4.62-.86 6.35-2.29l-2.07-2.07A6.98 6.98 0 0 1 12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7c3.42 0 6.27 2.45 6.87 5.69h-3.87v3h6.98C21.92 15.34 22 13.7 22 12c0-5.52-4.48-10-10-10z" />
    <path
      d="M17.5 14.5l3.5 3.5-1.5 1.5-3.5-3.5 1.5-1.5z"
      fill="#F55036"
    />
  </svg>
);

interface AiKeyStatus {
  openai: boolean;
  groq: boolean;
  safeStorageAvailable: boolean;
}

interface TestResult {
  success: boolean;
  cardCount?: number;
  error?: string;
}

interface AiSettingsSectionProps {
  isDarkMode: boolean;
}

export const AiSettingsSection: React.FC<AiSettingsSectionProps> = ({
  isDarkMode,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>("groq");
  const [keyInput, setKeyInput] = useState("");
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyStatus, setKeyStatus] = useState<AiKeyStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  // ── Load key status on mount ─────────────────────────────────────────────
  useEffect(() => {
    void loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const result = await window.contextIntelligenceAPI.getKeyStatus();
      if (result.success) {
        setKeyStatus({
          openai: result.openai ?? false,
          groq: result.groq ?? false,
          safeStorageAvailable: result.safeStorageAvailable ?? true,
        });
      }
    } catch {
      // silently ignore
    }
  };

  const selectAndBroadcastProvider = (p: AiProvider) => {
    setSelectedProvider(p);
    localStorage.setItem("wingrid:ai-provider", p);
    window.dispatchEvent(new CustomEvent("wingrid:ai-provider-changed", { detail: { provider: p } }));
    setKeyInput("");
    setSaveResult(null);
    setTestResult(null);
  };

  const handleSave = async () => {
    if (!keyInput.trim()) {
      setSaveResult({ success: false, msg: "Key cannot be empty." });
      return;
    }
    setIsSaving(true);
    setSaveResult(null);
    try {
      const r = await window.contextIntelligenceAPI.setKey(selectedProvider, keyInput.trim());
      if (r.success) {
        localStorage.setItem("wingrid:ai-provider", selectedProvider);
        window.dispatchEvent(new CustomEvent("wingrid:ai-provider-changed", { detail: { provider: selectedProvider } }));
        setSaveResult({ success: true, msg: "Key saved securely." });
        setKeyInput("");
        await loadStatus();
      } else {
        setSaveResult({ success: false, msg: r.error ?? "Failed to save." });
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveResult(null), 4000);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await window.contextIntelligenceAPI.clearKey(selectedProvider);
      await loadStatus();
    } finally {
      setIsClearing(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const r = await window.contextIntelligenceAPI.test(selectedProvider);
      setTestResult({
        success: r.success,
        cardCount: r.cards?.length ?? 0,
        error: r.error,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const providerHasKey = keyStatus?.[selectedProvider] ?? false;

  // ─────────────────────────────────────────────────────────────────────────
  const sectionBg = isDarkMode ? "bg-theme-primary-850/40" : "bg-gray-50";
  const borderCls = isDarkMode ? "border-white/[0.06]" : "border-gray-200";
  const textPrimary = isDarkMode ? "text-white/90" : "text-gray-800";
  const textMuted = isDarkMode ? "text-white/45" : "text-gray-500";
  const inputCls = `w-full rounded-lg border px-3 py-2 text-[12px] font-mono outline-none transition-all ${
    isDarkMode
      ? "bg-theme-primary-900/60 border-white/10 text-white/85 placeholder:text-white/20 focus:border-[#76cb01]/50 focus:ring-1 focus:ring-[#76cb01]/20"
      : "bg-white border-gray-300 text-gray-800 placeholder:text-gray-400 focus:border-[#76cb01] focus:ring-1 focus:ring-[#76cb01]/30"
  }`;
  const btnBase = `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`;

  const providerMeta = {
    groq: {
      name: "Groq Cloud",
      badge: "100% Free Tier",
      badgeCls: "bg-[#76cb01]/15 text-[#76cb01] border-[#76cb01]/30",
      model: "Llama-3.3 70B Versatile",
      speed: "Fastest (~450 tokens/sec)",
      keyUrl: "https://console.groq.com/keys",
      placeholder: "gsk_...",
    },
    openai: {
      name: "ChatGPT / OpenAI",
      badge: "Pay-as-you-go",
      badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      model: "GPT-4o mini",
      speed: "High Precision (~60 tokens/sec)",
      keyUrl: "https://platform.openai.com/api-keys",
      placeholder: "sk-...",
    },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Section Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              isDarkMode ? "bg-[#76cb01]/15 text-[#76cb01]" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className={`text-xs font-bold leading-none ${textPrimary}`}>
              Context Intelligence AI Models
            </h3>
            <p className={`mt-0.5 text-[10px] ${textMuted}`}>
              Configure high-speed AI providers for live presentation speech & slide intelligence
            </p>
          </div>
        </div>
      </div>

      {/* ── API Provider & Key Configuration ──────────────────────────────── */}
      <div className={`flex flex-col gap-3.5 rounded-xl border p-4 ${sectionBg} ${borderCls}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-[#76cb01]" />
            <span className={`text-[11px] font-bold ${textPrimary}`}>
              Select Intelligence Model & Enter Key
            </span>
          </div>

          <a
            href={providerMeta[selectedProvider].keyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-[#76cb01] hover:underline font-medium"
          >
            <span>Get {providerMeta[selectedProvider].name} Key</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>

        {/* Provider Cards with Official Logos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(
            [
              {
                id: "groq" as const,
                label: "Groq Cloud",
                desc: "Llama-3.3 70B Versatile",
                badge: "Free Tier Available",
                badgeCls: "bg-[#76cb01]/15 text-[#76cb01] border-[#76cb01]/30",
                logo: <GroqLogo className="w-6 h-6 text-[#F55036] shrink-0" />,
              },
              {
                id: "openai" as const,
                label: "ChatGPT / OpenAI",
                desc: "GPT-4o mini",
                badge: "Pay-as-you-go",
                badgeCls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
                logo: (
                  <OpenAiLogo className="w-6 h-6 text-emerald-400 shrink-0" />
                ),
              },
            ] as const
          ).map((p) => {
            const hasKey = keyStatus?.[p.id] ?? false;
            const isSelected = selectedProvider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => selectAndBroadcastProvider(p.id)}
                className={`relative flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  isSelected
                    ? isDarkMode
                      ? "border-[#76cb01]/60 bg-[#76cb01]/10 text-white shadow-[0_0_15px_rgba(118,203,1,0.1)]"
                      : "border-[#76cb01] bg-[#76cb01]/10 text-neutral-900"
                    : isDarkMode
                      ? "border-white/5 bg-white/[0.02] text-white/60 hover:bg-white/[0.05] hover:text-white/80"
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {/* Brand Logo */}
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/40 border border-white/10 shrink-0">
                  {p.logo}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12px] font-bold text-white truncate">
                      {p.label}
                    </span>
                    <span
                      className={`text-[8.5px] font-semibold px-1.5 py-0.5 rounded-full border ${p.badgeCls}`}
                    >
                      {p.badge}
                    </span>
                  </div>

                  <p className={`text-[10px] truncate mt-0.5 ${textMuted}`}>
                    {p.desc}
                  </p>

                  <div className="mt-1 flex items-center justify-between">
                    {hasKey ? (
                      <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
                        <Check className="h-2.5 w-2.5" /> Key Configured
                      </span>
                    ) : (
                      <span className="text-[9px] text-white/30">No Key Set</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* API key input */}
        <div className="flex flex-col gap-1.5 pt-1">
          <div className="flex items-center justify-between">
            <label className={`text-[10px] font-semibold ${textPrimary}`}>
              {providerMeta[selectedProvider].name} API Key
            </label>
            <span className="text-[9px] text-white/40">
              {providerMeta[selectedProvider].speed}
            </span>
          </div>

          <div className="relative">
            <input
              type={keyVisible ? "text" : "password"}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder={
                providerHasKey
                  ? "•••••••••••••••••••••••••••••••• (Key configured — enter new to replace)"
                  : providerMeta[selectedProvider].placeholder
              }
              className={inputCls}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
            />
            <button
              type="button"
              onClick={() => setKeyVisible((v) => !v)}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors`}
              tabIndex={-1}
            >
              {keyVisible ? (
                <EyeOff className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !keyInput.trim()}
            className={`${btnBase} ${
              isDarkMode
                ? "bg-[#76cb01] text-black hover:bg-[#88e003]"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {isSaving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            Save Key
          </button>

          {providerHasKey && (
            <>
              <button
                type="button"
                onClick={() => void handleTest()}
                disabled={isTesting}
                className={`${btnBase} border ${
                  isDarkMode
                    ? "border-white/10 text-white/80 hover:bg-white/5 hover:text-white"
                    : "border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {isTesting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <FlaskConical className="h-3 w-3" />
                )}
                Test Connection
              </button>

              <button
                type="button"
                onClick={() => void handleClear()}
                disabled={isClearing}
                className={`${btnBase} ml-auto ${
                  isDarkMode
                    ? "text-red-400/70 hover:text-red-400 hover:bg-red-900/20"
                    : "text-red-500 hover:bg-red-50"
                }`}
              >
                {isClearing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3" />
                )}
                Clear
              </button>
            </>
          )}
        </div>

        {/* Save feedback */}
        {saveResult && (
          <div
            className={`mt-2 flex items-center gap-1.5 text-[10px] ${
              saveResult.success ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {saveResult.success ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {saveResult.msg}
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={`mt-2 rounded-lg border p-2.5 text-[10px] ${
              testResult.success
                ? isDarkMode
                  ? "border-emerald-700/40 bg-emerald-900/20 text-emerald-300"
                  : "border-emerald-300 bg-emerald-50 text-emerald-700"
                : isDarkMode
                  ? "border-red-700/40 bg-red-900/20 text-red-300"
                  : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {testResult.success ? (
              <span>
                ✓ Connection successful — extracted{" "}
                <strong>{testResult.cardCount}</strong> sample card
                {testResult.cardCount !== 1 ? "s" : ""} from test phrase.
              </span>
            ) : (
              <span>✗ {testResult.error ?? "Test failed."}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Security & Storage Note ────────────────────────────────────────── */}
      <p className={`text-[9.5px] leading-relaxed ${textMuted}`}>
        API keys are encrypted using your system's hardware-backed key store
        (Electron safeStorage). They remain strictly on your device and are sent
        only to the chosen provider's official inference endpoints.
      </p>
    </div>
  );
};
