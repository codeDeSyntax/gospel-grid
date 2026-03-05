import React from "react";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { CustomSelect } from "@/shared/Selector";
import { RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setColorTheme,
  ColorTheme,
  THEME_NAMES,
  setPublishedContrast,
  setPublishedBrightness,
  setRefreshInterval,
  resetQualitySettings,
  setAutoLoadLastPreset,
} from "@/store/slices/appSlice";
import { ThemeManager } from "@/utils/themeManager";
import type { SettingsPanelProps } from "./types";

const THEME_COLORS: Record<ColorTheme, string> = {
  "cosmic-blue": "#3B82F6",
  "matrix-green": "#10B981",
  "fire-red": "#EF4444",
  "steel-gray": "#6B7280",
  "earth-brown": "#D97706",
  "violet-purple": "#A855F7",
  "sunset-orange": "#F97316",
  "midnight-black": "#1F2937",
  "pro-slate": "#14b8a6",
};

const REFRESH_OPTIONS = [
  { value: 30000, label: "30 seconds" },
  { value: 60000, label: "1 minute" },
  { value: 120000, label: "2 minutes" },
  { value: 300000, label: "5 minutes" },
];

/* ── Shared row layout ────────────────────────────────────────────────── */
const SettingRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ title, description, children, last }) => (
  <div
    className={`flex items-center justify-between gap-8 py-5 ${
      !last ? "border-b border-white/[0.04]" : ""
    }`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-[13px] font-semibold text-white leading-snug tracking-[-0.01em]">
        {title}
      </p>
      <p className="mt-1 text-[11.5px] text-white/30 leading-relaxed">
        {description}
      </p>
    </div>
    <div className="shrink-0 w-56">{children}</div>
  </div>
);

/* ── Section heading ──────────────────────────────────────────────────── */
const SectionHeading: React.FC<{ label: string }> = ({ label }) => (
  <h3 className="text-[10px] font-semibold text-theme-primary-400/50 uppercase tracking-[0.16em] mb-1 mt-2">
    {label}
  </h3>
);

/* ── Main panel ───────────────────────────────────────────────────────── */
export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const dispatch = useAppDispatch();
  const colorTheme = useAppSelector((s) => s.app.colorTheme);
  const publishedQuality = useAppSelector((s) => s.app.publishedQuality);
  const refreshInterval = useAppSelector((s) => s.app.refreshInterval);
  const autoLoadLastPreset = useAppSelector((s) => s.app.autoLoadLastPreset);

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar text-white">
      <div className="px-5 pt-5 pb-10 max-w-2xl">
        {/* ── Page title ─────────────────────────────────────── */}
        <h2 className="text-lg font-bold text-white tracking-tight mb-6">
          Settings
        </h2>

        {/* ── Appearance ─────────────────────────────────────── */}
        <SectionHeading label="Appearance" />
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5">
          <SettingRow
            title="Color Theme"
            description="Choose the accent color used throughout the interface."
            last
          >
            <CustomSelect
              value={colorTheme}
              onChange={(v) => {
                dispatch(setColorTheme(v as ColorTheme));
                ThemeManager.saveTheme(v as ColorTheme);
              }}
              options={Object.entries(THEME_NAMES).map(([val, name]) => ({
                value: val,
                text: name,
                swatch: THEME_COLORS[val as ColorTheme],
              }))}
            />
          </SettingRow>
        </div>

        {/* ── Window management ──────────────────────────────── */}
        <SectionHeading label="Window Management" />
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5">
          <SettingRow
            title="Refresh Interval"
            description="How often the window list scans for opened or closed windows."
          >
            <CustomSelect
              value={String(refreshInterval)}
              onChange={(v) => dispatch(setRefreshInterval(Number(v)))}
              options={REFRESH_OPTIONS.map((o) => ({
                value: String(o.value),
                text: o.label,
              }))}
            />
          </SettingRow>

          <SettingRow
            title="Startup Profile"
            description="Automatically restore the last loaded preset when the app starts."
            last
          >
            <button
              onClick={() =>
                dispatch(setAutoLoadLastPreset(!autoLoadLastPreset))
              }
              className={`w-full flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[12px] font-medium transition-all duration-150 border ${
                autoLoadLastPreset
                  ? "bg-theme-primary-500/15 border-theme-primary-400/30 text-theme-primary-300"
                  : "bg-white/[0.04] border-white/[0.06] text-white/50 hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white/90"
              }`}
            >
              {autoLoadLastPreset ? "Enabled" : "Disabled"}
            </button>
          </SettingRow>
        </div>

        {/* ── Projection ─────────────────────────────────────── */}
        <SectionHeading label="Projection Quality" />
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5">
          <SettingRow
            title="Contrast"
            description="Adjusts the CSS contrast filter on the published projection window."
          >
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
          </SettingRow>

          <SettingRow
            title="Brightness"
            description="Adjusts the CSS brightness filter on the published projection window."
          >
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
          </SettingRow>

          <SettingRow
            title="Reset Quality"
            description="Restore contrast and brightness to their default values (1.0)."
            last
          >
            <button
              onClick={() => {
                dispatch(resetQualitySettings());
                (window.electronAPI as any)?.updateQualitySettings?.({
                  publishedQuality: { contrast: 1.0, brightness: 1.0 },
                });
              }}
              className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.06] hover:border-white/[0.12] rounded-lg px-3.5 py-2.5 text-white/50 hover:text-white/90 text-[12px] font-medium transition-all duration-150"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Defaults
            </button>
          </SettingRow>
        </div>

        {/* ── System info ────────────────────────────────────── */}
        <SectionHeading label="System" />
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5">
          {[
            [
              "Render Pipeline",
              "GPU Direct — frames stay on GPU, zero CPU readback",
            ],
            ["Video Delivery", "MediaStream via getUserMedia"],
            ["Active Theme", THEME_NAMES[colorTheme]],
          ].map(([title, desc], i, arr) => (
            <SettingRow
              key={title}
              title={title}
              description={desc}
              last={i === arr.length - 1}
            >
              <span className="text-[12px] text-theme-primary-300/60 font-medium text-right block">
                {i === 0
                  ? "GPU Direct"
                  : i === 1
                    ? "MediaStream"
                    : THEME_NAMES[colorTheme]}
              </span>
            </SettingRow>
          ))}
        </div>
      </div>
    </div>
  );
};
