import React, { useEffect, useState } from "react";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { CustomSelect } from "@/shared/Selector";
import {
  RotateCcw,
  Palette,
  AppWindow,
  Sliders,
  Cpu,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Key,
  Sun,
  Moon,
  Sparkles,
  Tv,
  CheckCircle2,
  AlertCircle,
  ZapOff,
  Play,
  Clapperboard,
  type LucideIcon,
} from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setDarkMode,
  setPublishedContrast,
  setPublishedBrightness,
  setRefreshInterval,
  setRemoteScreensAutoStart,
  resetQualitySettings,
} from "@/store/slices/appSlice";
import type { SettingsPanelProps } from "../RightPanel/types";
import { AiSettingsSection } from "../ai/AiSettingsSection";

const REFRESH_OPTIONS = [
  { value: 30000, label: "30 seconds" },
  { value: 60000, label: "1 minute" },
  { value: 120000, label: "2 minutes" },
  { value: 300000, label: "5 minutes" },
];

type SettingsTab = "appearance" | "window" | "projection" | "system";

interface SettingsMenuItem {
  id: SettingsTab;
  label: string;
  description: string;
  icon: LucideIcon;
}

const MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme & interface styling",
    icon: Palette,
  },
  {
    id: "window",
    label: "Window Management",
    description: "Scanning & auto-discovery",
    icon: AppWindow,
  },
  {
    id: "projection",
    label: "Projection Quality",
    description: "Display tuning & filters",
    icon: Sliders,
  },
  {
    id: "system",
    label: "System & Keys",
    description: "Speech AI & hardware specs",
    icon: Cpu,
  },
];

interface PublishedQuality {
  contrast: number;
  brightness: number;
}

interface ApiKeyStatus {
  hasKey: boolean;
  source: "env" | "secure-storage" | "none";
  safeStorageAvailable: boolean;
}

// ─── CUSTOM TACTILE TOGGLE SWITCH ──────────────────────────────────────────
const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  isDarkMode: boolean;
  labelLeft?: string;
  labelRight?: string;
}> = ({ checked, onChange, isDarkMode }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
      checked
        ? "bg-primary-500 shadow-[0_0_10px_rgba(94,172,36,0.4)]"
        : isDarkMode
          ? "bg-[#333333]"
          : "bg-neutral-300"
    }`}
  >
    <span
      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? "translate-x-5" : "translate-x-0"
      }`}
    />
  </button>
);

// ─── SETTINGS ROW COMPONENT ────────────────────────────────────────────────
const SettingRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  isDarkMode: boolean;
  last?: boolean;
}> = ({ title, description, children, isDarkMode, last }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 ${
      !last
        ? isDarkMode
          ? "border-b border-white/[0.06]"
          : "border-b border-neutral-200/80"
        : ""
    }`}
  >
    <div className="min-w-0 flex-1 pr-4">
      <p
        className={`text-sm font-bold leading-tight ${
          isDarkMode ? "text-white" : "text-neutral-900"
        }`}
      >
        {title}
      </p>
      <p
        className={`mt-1 text-xs leading-relaxed ${
          isDarkMode ? "text-white/60" : "text-neutral-500"
        }`}
      >
        {description}
      </p>
    </div>
    <div className="shrink-0 flex items-center justify-start sm:justify-end min-w-[200px]">
      {children}
    </div>
  </div>
);

// ─── SECTION CONTENT ────────────────────────────────────────────────────────
const SectionContent: React.FC<{
  tab: SettingsTab;
  isDarkMode: boolean;
  publishedQuality: PublishedQuality;
  refreshInterval: number;
  remoteScreensAutoStart: boolean;
  apiKeyInput: string;
  setApiKeyInput: (value: string) => void;
  apiKeyStatus: ApiKeyStatus;
  apiKeyBusy: boolean;
  apiKeyMessage: string | null;
  onSaveApiKey: () => Promise<void>;
  onClearApiKey: () => Promise<void>;
  dispatch: ReturnType<typeof useAppDispatch>;
}> = ({
  tab,
  isDarkMode,
  publishedQuality,
  refreshInterval,
  remoteScreensAutoStart,
  apiKeyInput,
  setApiKeyInput,
  apiKeyStatus,
  apiKeyBusy,
  apiKeyMessage,
  onSaveApiKey,
  onClearApiKey,
  dispatch,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [directorMode, setDirectorMode] = useState<"off" | "suggest" | "auto">(() => {
    return (
      (localStorage.getItem("wingrid:auto-director-mode") as
        | "off"
        | "suggest"
        | "auto") || "suggest"
    );
  });

  const handleDirectorModeChange = (mode: "off" | "suggest" | "auto") => {
    setDirectorMode(mode);
    localStorage.setItem("wingrid:auto-director-mode", mode);
    window.dispatchEvent(
      new CustomEvent("wingrid:auto-director-mode-changed", { detail: mode }),
    );
  };

  const cardClasses = isDarkMode
    ? "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.2)]"
    : "bg-white/70 backdrop-blur-sm border border-neutral-300/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)]";

  switch (tab) {
    case "appearance":
      return (
        <section className="space-y-6">
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.25em] ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              Appearance & Theme
            </span>
            <h3
              className={`mt-1 text-2xl font-black tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Workspace Styling
            </h3>
          </div>

          <div className={`rounded-2xl sm:rounded-3xl p-6 ${cardClasses}`}>
            <SettingRow
              title="Theme Mode"
              description="Switch between high-contrast light mode and deep focused dark mode."
              isDarkMode={isDarkMode}
              last
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                    isDarkMode
                      ? "bg-theme-primary-850/80 border-theme-primary-700/60 text-white"
                      : "bg-white border-neutral-300 text-neutral-800"
                  }`}
                >
                  {isDarkMode ? (
                    <>
                      <Moon size={14} className="text-primary-400" />
                      <span>Dark Theme</span>
                    </>
                  ) : (
                    <>
                      <Sun size={14} className="text-amber-500" />
                      <span>Light Theme</span>
                    </>
                  )}
                </div>
                <ToggleSwitch
                  checked={isDarkMode}
                  onChange={(val) => dispatch(setDarkMode(val))}
                  isDarkMode={isDarkMode}
                />
              </div>
            </SettingRow>
          </div>
        </section>
      );

    case "window": {
      const directorModes = [
        { mode: "off" as const, label: "Off", icon: ZapOff },
        { mode: "suggest" as const, label: "Suggest", icon: Eye },
        { mode: "auto" as const, label: "Auto Cut", icon: Play },
      ];

      return (
        <section className="space-y-6">
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.25em] ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              Window Scanning
            </span>
            <h3
              className={`mt-1 text-2xl font-black tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Discovery & Automation
            </h3>
          </div>

          <div className={`rounded-2xl sm:rounded-3xl p-6 ${cardClasses}`}>
            {/* Auto-Director Mode Setting */}
            <SettingRow
              title="Auto-Director Switching"
              description="Automatically detect slide advances and scene changes to route or suggest window focus."
              isDarkMode={isDarkMode}
            >
              <div className="grid grid-cols-3 gap-2 w-full sm:w-72">
                {directorModes.map((item) => {
                  const isSelected = directorMode === item.mode;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => handleDirectorModeChange(item.mode)}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
                        isSelected
                          ? isDarkMode
                            ? "border-primary-500/60 bg-primary-500/20 text-white shadow-sm"
                            : "border-primary-500 bg-primary-50 text-primary-950 shadow-sm"
                          : isDarkMode
                            ? "border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08]"
                            : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          isSelected ? "text-primary-400" : "opacity-60"
                        }`}
                      />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </SettingRow>

            <SettingRow
              title="Window Scan Interval"
              description="Frequency for detecting newly opened or closed applications on your system."
              isDarkMode={isDarkMode}
            >
              <div className="w-full sm:w-52">
                <CustomSelect
                  value={String(refreshInterval)}
                  onChange={(v) => dispatch(setRefreshInterval(Number(v)))}
                  options={REFRESH_OPTIONS.map((o) => ({
                    value: String(o.value),
                    text: o.label,
                  }))}
                />
              </div>
            </SettingRow>

            <SettingRow
              title="Remote Screens Auto-Ready"
              description="Automatically advertise this computer as available when opening the Remote Screens panel."
              isDarkMode={isDarkMode}
              last
            >
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs font-bold ${
                    remoteScreensAutoStart
                      ? "text-primary-400"
                      : isDarkMode
                        ? "text-white/50"
                        : "text-neutral-500"
                  }`}
                >
                  {remoteScreensAutoStart ? "Enabled" : "Disabled"}
                </span>
                <ToggleSwitch
                  checked={remoteScreensAutoStart}
                  onChange={(val) => dispatch(setRemoteScreensAutoStart(val))}
                  isDarkMode={isDarkMode}
                />
              </div>
            </SettingRow>
          </div>
        </section>
      );
    }

    case "projection":
      return (
        <section className="space-y-6">
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.25em] ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              Display Tuning
            </span>
            <h3
              className={`mt-1 text-2xl font-black tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Projection Filters
            </h3>
          </div>

          <div className={`rounded-2xl sm:rounded-3xl p-6 ${cardClasses}`}>
            <SettingRow
              title="Contrast Multiplier"
              description="Fine-tune contrast filter applied to all projected window slots."
              isDarkMode={isDarkMode}
            >
              <div className="w-full sm:w-56">
                <CustomSlider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={publishedQuality.contrast}
                  onChange={(v) => {
                    dispatch(setPublishedContrast(v));
                    (window.electronAPI as any)?.updateQualitySettings?.({
                      publishedQuality: {
                        contrast: v,
                        brightness: publishedQuality.brightness,
                      },
                    });
                  }}
                  marks={[0.5, 1, 1.5, 2]}
                  unit=""
                />
              </div>
            </SettingRow>

            <SettingRow
              title="Brightness Multiplier"
              description="Adjust output brightness level across published projection screens."
              isDarkMode={isDarkMode}
            >
              <div className="w-full sm:w-56">
                <CustomSlider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={publishedQuality.brightness}
                  onChange={(v) => {
                    dispatch(setPublishedBrightness(v));
                    (window.electronAPI as any)?.updateQualitySettings?.({
                      publishedQuality: {
                        contrast: publishedQuality.contrast,
                        brightness: v,
                      },
                    });
                  }}
                  marks={[0.5, 1, 1.5, 2]}
                  unit=""
                />
              </div>
            </SettingRow>

            <SettingRow
              title="Restore Factory Tuning"
              description="Reset brightness and contrast multipliers back to baseline (1.0)."
              isDarkMode={isDarkMode}
              last
            >
              <DepthButton
                onClick={() => {
                  dispatch(resetQualitySettings());
                  (window.electronAPI as any)?.updateQualitySettings?.({
                    publishedQuality: { contrast: 1.0, brightness: 1.0 },
                  });
                }}
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName={
                  isDarkMode
                    ? "bg-[#252525] hover:bg-[#303030] text-white border-white/15"
                    : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300"
                }
              >
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={13} />
                  <span className="text-xs font-bold">Reset to Defaults</span>
                </div>
              </DepthButton>
            </SettingRow>
          </div>
        </section>
      );

    case "system":
      return (
        <section className="space-y-6">
          <div>
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.25em] ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              System & Integration
            </span>
            <h3
              className={`mt-1 text-2xl font-black tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Hardware & AI Keys
            </h3>
          </div>

          <div className={`rounded-2xl sm:rounded-3xl p-6 ${cardClasses}`}>
            {/* AssemblyAI Key Setting */}
            <SettingRow
              title="AssemblyAI Key"
              description="Encrypted on device via Electron SafeStorage for real-time speech transcription."
              isDarkMode={isDarkMode}
            >
              <div className="w-full sm:w-64 space-y-2">
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Enter AssemblyAI key…"
                    className={`h-9 w-full rounded-xl border px-3 pr-8 text-xs font-mono outline-none transition-colors ${
                      isDarkMode
                        ? "bg-[#1f1f1f] border-white/15 text-white placeholder-white/25 focus:border-primary-500"
                        : "bg-white border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-primary-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 text-neutral-400 hover:text-white transition-colors"
                  >
                    {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={apiKeyBusy || !apiKeyInput.trim()}
                    onClick={() => void onSaveApiKey()}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                      apiKeyInput.trim()
                        ? "bg-primary-500 border-primary-400 text-white hover:bg-primary-400 active:scale-95 shadow-sm cursor-pointer"
                        : isDarkMode
                          ? "bg-[#252525] border-white/10 text-neutral-600 cursor-not-allowed opacity-50"
                          : "bg-neutral-200 border-neutral-300 text-neutral-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    Save Key
                  </button>
                  <button
                    type="button"
                    disabled={apiKeyBusy}
                    onClick={() => void onClearApiKey()}
                    className={`h-8 px-3 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isDarkMode
                        ? "bg-[#252525] hover:bg-[#303030] border-white/15 text-white/80"
                        : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700"
                    }`}
                  >
                    Clear
                  </button>
                </div>

                {apiKeyMessage && (
                  <p
                    className={`text-[11px] font-medium flex items-center gap-1 ${
                      apiKeyMessage.toLowerCase().includes("fail") ||
                      apiKeyMessage.toLowerCase().includes("error")
                        ? "text-red-400"
                        : "text-primary-400"
                    }`}
                  >
                    <CheckCircle2 size={12} className="shrink-0" />
                    <span>{apiKeyMessage}</span>
                  </p>
                )}
              </div>
            </SettingRow>

            {/* Storage details */}
            <SettingRow
              title="Secure Storage Status"
              description="Current encryption engine and key resolution status."
              isDarkMode={isDarkMode}
            >
              <div
                className={`flex flex-col gap-1 text-xs sm:text-right font-medium ${
                  isDarkMode ? "text-white/80" : "text-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <span className="opacity-60">Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      apiKeyStatus.hasKey
                        ? isDarkMode
                          ? "bg-primary-500/15 text-primary-400 border border-primary-500/30"
                          : "bg-primary-100 text-primary-800 border border-primary-300"
                        : isDarkMode
                          ? "bg-[#282828] text-white/60 border border-white/10"
                          : "bg-neutral-200 text-neutral-600 border border-neutral-300"
                    }`}
                  >
                    {apiKeyStatus.hasKey ? "Key Configured" : "No Key Set"}
                  </span>
                </div>
                <p className="text-[11px] opacity-70">
                  Storage Source: <span className="font-bold">{apiKeyStatus.source}</span>
                </p>
              </div>
            </SettingRow>

            {/* Render pipeline */}
            <SettingRow
              title="GPU Render Pipeline"
              description="Direct hardware acceleration with zero CPU frame readback."
              isDarkMode={isDarkMode}
            >
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isDarkMode
                    ? "bg-primary-500/15 border border-primary-500/30 text-primary-400"
                    : "bg-primary-100 border border-primary-300 text-primary-800"
                }`}
              >
                <Sparkles size={12} /> GPU Direct
              </span>
            </SettingRow>

            {/* Video Delivery */}
            <SettingRow
              title="Video Delivery Engine"
              description="Low-latency capture using Electron MediaStream pipeline."
              isDarkMode={isDarkMode}
              last
            >
              <span
                className={`text-xs font-bold ${
                  isDarkMode ? "text-white/80" : "text-neutral-800"
                }`}
              >
                MediaStream (Native)
              </span>
            </SettingRow>
          </div>

          {/* AI Producer Intelligence Section */}
          <div className="pt-2 pb-16">
            <AiSettingsSection isDarkMode={isDarkMode} />
          </div>
        </section>
      );

    default:
      return null;
  }
};

// ─── MAIN SETTINGS PANEL ───────────────────────────────────────────────────
export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [apiKeyBusy, setApiKeyBusy] = useState(false);
  const [apiKeyMessage, setApiKeyMessage] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus>({
    hasKey: false,
    source: "none",
    safeStorageAvailable: false,
  });

  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const publishedQuality = useAppSelector((s) => s.app.publishedQuality);
  const refreshInterval = useAppSelector((s) => s.app.refreshInterval);
  const remoteScreensAutoStart = useAppSelector(
    (s) => s.app.remoteScreensAutoStart,
  );

  const refreshApiKeyStatus = async () => {
    try {
      const result = await window.speechToTextAPI.getApiKeyStatus();
      if (!result?.success) {
        setApiKeyMessage(result?.error || "Unable to read API key status.");
        return;
      }

      setApiKeyStatus({
        hasKey: Boolean(result.hasKey),
        source: result.source || "none",
        safeStorageAvailable: Boolean(result.safeStorageAvailable),
      });
    } catch {
      // safe fallback
    }
  };

  useEffect(() => {
    void refreshApiKeyStatus();
  }, []);

  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setApiKeyMessage("Enter an API key before saving.");
      return;
    }

    setApiKeyBusy(true);
    try {
      const result = await window.speechToTextAPI.setApiKey(trimmed);
      if (!result?.success) {
        setApiKeyMessage(result?.error || "Failed to save API key.");
        return;
      }

      setApiKeyInput("");
      setApiKeyMessage("API key saved to secure storage.");
      await refreshApiKeyStatus();
    } finally {
      setApiKeyBusy(false);
    }
  };

  const handleClearApiKey = async () => {
    setApiKeyBusy(true);
    try {
      const result = await window.speechToTextAPI.clearApiKey();
      if (!result?.success) {
        setApiKeyMessage(result?.error || "Failed to clear API key.");
        return;
      }

      setApiKeyInput("");
      setApiKeyMessage("Stored API key cleared.");
      await refreshApiKeyStatus();
    } finally {
      setApiKeyBusy(false);
    }
  };

  const panelBg = isDarkMode
    ? "bg-theme-primary-900 theme-text-on-overlay"
    : "bg-theme-primary-900 theme-text-main";

  return (
    <div
      className={`relative flex h-full min-h-0 w-full overflow-hidden rounded-r-2xl rounded-l-none ${panelBg}`}
    >
      {/* ── BACKGROUND ART PATTERN LAYER (Subtle Light-Catching Planes) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        <div className="relative w-full max-w-2xl h-full flex items-center justify-center pointer-events-none">
          {/* Ambient directional light shaft */}
          <div
            className={`absolute top-[-10%] w-72 h-[120%] transform -skew-x-12 blur-3xl opacity-70 pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-b from-primary-500/[0.06] via-white/[0.02] to-transparent"
                : "bg-gradient-to-b from-primary-500/[0.06] via-white/40 to-transparent"
            }`}
          />

          {/* Primary Angled Light Plane */}
          <div
            className={`absolute w-[320px] h-[340px] transform -rotate-12 skew-y-3 rounded-3xl border pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-br from-white/[0.035] via-white/[0.005] to-transparent border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                : "bg-gradient-to-br from-white/70 via-white/20 to-transparent border-neutral-300/50 shadow-sm"
            }`}
          />

          {/* Overlapping Faceted Light Plane */}
          <div
            className={`absolute w-[360px] h-[290px] transform rotate-6 -skew-x-6 rounded-3xl border pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-tr from-white/[0.025] via-primary-500/[0.015] to-transparent border-white/[0.04]"
                : "bg-gradient-to-tr from-white/50 via-primary-500/[0.02] to-transparent border-neutral-200/60"
            }`}
          />
        </div>
      </div>

      {/* ── FOREGROUND CONTENT (z-10) ────────────────────────────────────── */}
      <div className="relative z-10 flex h-full min-h-0 w-full">
        {/* ── LEFT NAVIGATION SIDEBAR ─────────────────────────────────────── */}
        <aside
          className={`flex h-full min-h-0 w-64 shrink-0 flex-col border-solid border-l border-r-0 border-t-0 border-b-0 ${
            isDarkMode
              ? "border-white/20"
              : "border-neutral-300"
          }`}
        >
          {/* Header */}
          <div className="px-6 pb-4 pt-6">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-[0.25em] ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              Settings
            </span>
            <h2
              className={`mt-1 text-xl font-black tracking-tight ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Preferences
            </h2>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto no-scrollbar">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all duration-200 cursor-pointer outline-none ${
                    isActive
                      ? isDarkMode
                        ? "bg-[#2c2c2c] border border-white/20 text-white shadow-sm font-bold"
                        : "bg-neutral-200/90 border border-neutral-300 text-neutral-950 shadow-sm font-bold"
                      : isDarkMode
                        ? "text-white/70 hover:bg-white/[0.04] hover:text-white"
                        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  {/* Left active accent bar */}
                  {isActive && (
                    <div
                      className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${
                        isDarkMode ? "bg-white" : "bg-neutral-800"
                      }`}
                    />
                  )}

                  <Icon
                    size={16}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className={`transition-colors shrink-0 ${
                      isActive
                        ? "text-primary-500"
                        : isDarkMode
                          ? "text-white/50 group-hover:text-white/80"
                          : "text-neutral-500 group-hover:text-neutral-800"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs truncate">{item.label}</p>
                    <p
                      className={`text-[10px] truncate ${
                        isDarkMode ? "text-white/40" : "text-neutral-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Footer note */}
          <div
            className={`border-t px-6 py-4 ${
              isDarkMode ? "border-white/[0.06]" : "border-neutral-200"
            }`}
          >
            <p
              className={`text-[11px] font-medium ${
                isDarkMode ? "text-white/45" : "text-neutral-500"
              }`}
            >
              Changes are applied instantly.
            </p>
          </div>
        </aside>

        {/* ── RIGHT MAIN CONTENT ──────────────────────────────────────────── */}
        <main className="flex h-full min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="flex min-h-full flex-1 flex-col p-6 sm:p-8 lg:p-10 max-w-4xl">
            <SectionContent
              tab={activeTab}
              isDarkMode={isDarkMode}
              publishedQuality={publishedQuality}
              refreshInterval={refreshInterval}
              remoteScreensAutoStart={remoteScreensAutoStart}
              apiKeyInput={apiKeyInput}
              setApiKeyInput={setApiKeyInput}
              apiKeyStatus={apiKeyStatus}
              apiKeyBusy={apiKeyBusy}
              apiKeyMessage={apiKeyMessage}
              onSaveApiKey={handleSaveApiKey}
              onClearApiKey={handleClearApiKey}
              dispatch={dispatch}
            />
          </div>
        </main>
      </div>
    </div>
  );
};
