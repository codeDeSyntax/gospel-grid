import React, { useState, useCallback } from "react";
import { Clapperboard, ChevronDown, Zap, Eye, Play, ZapOff } from "lucide-react";
import type { FrameActivityState } from "@/hooks/useFrameActivityDetector";

export type AutoDirectorMode = "off" | "suggest" | "auto";

interface SceneChangeChip {
  windowId: string;
  windowName: string;
  state: FrameActivityState;
}

interface AutoDirectorBarProps {
  mode: AutoDirectorMode;
  onModeChange: (mode: AutoDirectorMode) => void;
  sceneChanges?: SceneChangeChip[];
  onAcceptChange?: (windowId: string) => void;
  onDismissChange?: (windowId: string) => void;
  isDarkMode: boolean;
}

const MODE_CONFIG: Record<
  AutoDirectorMode,
  { label: string; icon: React.FC<{ className?: string }>; cls: string; dotCls: string }
> = {
  off: {
    label: "Off",
    icon: ZapOff,
    cls: "",
    dotCls: "bg-gray-400",
  },
  suggest: {
    label: "Suggest",
    icon: Eye,
    cls: "text-amber-400",
    dotCls: "bg-amber-400 animate-pulse",
  },
  auto: {
    label: "Auto",
    icon: Play,
    cls: "text-primary-400",
    dotCls: "bg-primary-400 animate-pulse",
  },
};

const MODES: AutoDirectorMode[] = ["off", "suggest", "auto"];

export const AutoDirectorBar: React.FC<AutoDirectorBarProps> = ({
  mode,
  onModeChange,
  sceneChanges,
  onAcceptChange,
  onDismissChange,
  isDarkMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cfg = MODE_CONFIG[mode];
  const ModeIcon = cfg.icon;

  const cycleMode = useCallback(() => {
    const idx = MODES.indexOf(mode);
    onModeChange(MODES[(idx + 1) % MODES.length]);
  }, [mode, onModeChange]);

  const pendingChanges = sceneChanges?.length ?? 0;

  return (
    <div className="flex items-center gap-1.5">
      {/* ── Mode selector pill ──────────────────────────────────────────────── */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen((p) => !p)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold transition-all ${
            mode === "off"
              ? isDarkMode
                ? "border-white/10 bg-white/5 text-white/40 hover:text-white/60"
                : "border-gray-200 bg-gray-50 text-gray-400 hover:text-gray-600"
              : isDarkMode
                ? "border-primary-500/30 bg-primary-500/10 text-primary-300 hover:bg-primary-500/20"
                : "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
          }`}
          title="Auto-Director mode"
        >
          {/* Status dot */}
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dotCls}`} />

          <Clapperboard className="h-3 w-3" />
          <span>Director: {cfg.label}</span>

          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>

        {/* ── Dropdown menu ────────────────────────────────────────────────── */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            <div
              className={`absolute right-0 top-8 z-50 overflow-hidden rounded-lg border shadow-xl ${
                isDarkMode
                  ? "bg-theme-primary-900 border-white/10 shadow-black/50"
                  : "bg-white border-gray-200 shadow-gray-200/80"
              }`}
              style={{ width: 200 }}
            >
              {/* Header */}
              <div
                className={`flex items-center gap-2 px-3 py-2.5 border-b ${
                  isDarkMode ? "border-white/[0.06]" : "border-gray-100"
                }`}
              >
                <Clapperboard
                  className={`h-3.5 w-3.5 ${isDarkMode ? "text-primary-400" : "text-primary-600"}`}
                />
                <span
                  className={`text-[11px] font-semibold ${isDarkMode ? "text-white/80" : "text-gray-700"}`}
                >
                  Auto-Director
                </span>
              </div>

              {/* Mode options */}
              {MODES.map((m) => {
                const mc = MODE_CONFIG[m];
                const Icon = mc.icon;
                const isSelected = m === mode;
                const modeDescriptions: Record<AutoDirectorMode, string> = {
                  off: "No frame monitoring",
                  suggest: "Show chips on change",
                  auto: "Auto-focus on change",
                };
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onModeChange(m);
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? isDarkMode
                          ? "bg-primary-500/12 text-primary-300"
                          : "bg-primary-50 text-primary-700"
                        : isDarkMode
                          ? "text-white/70 hover:bg-white/[0.04]"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold capitalize">{m}</div>
                      <div
                        className={`text-[9px] ${
                          isDarkMode ? "text-white/35" : "text-gray-400"
                        }`}
                      >
                        {modeDescriptions[m]}
                      </div>
                    </div>
                    {isSelected && (
                      <Zap
                        className={`ml-auto h-3 w-3 ${
                          isDarkMode ? "text-primary-400" : "text-primary-600"
                        }`}
                      />
                    )}
                  </button>
                );
              })}

              {/* Info footer */}
              <div
                className={`border-t px-3 py-2 text-[9px] leading-relaxed ${
                  isDarkMode ? "border-white/[0.06] text-white/25" : "border-gray-100 text-gray-400"
                }`}
              >
                Detects slide changes via local GPU frame analysis.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
