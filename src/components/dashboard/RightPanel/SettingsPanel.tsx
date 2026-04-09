import React, { useState } from "react";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { CustomSelect } from "@/shared/Selector";
import { RotateCcw } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
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
  grayscale: "#6A6865",
  "royal-purple": "#5A4466",
  "sky-blue": "#72A8D4",
  "forest-green": "#4A6B44",
  "vibrant-green": "#12C92B",
  "fire-red": "#EF4444",
};

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
}

const MENU_ITEMS: SettingsMenuItem[] = [
  { id: "appearance", label: "Appearance" },
  { id: "window", label: "Window Management" },
  { id: "projection", label: "Projection Quality" },
  { id: "system", label: "System Info" },
];

interface PublishedQuality {
  contrast: number;
  brightness: number;
}

const SidebarMenuItem: React.FC<{
  item: SettingsMenuItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
      isActive
        ? "bg-theme-primary-500/15 text-theme-primary-50 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
        : "text-theme-primary-200/70 hover:bg-theme-primary-500/5 hover:text-theme-primary-50"
    }`}
  >
    {item.label}
  </button>
);

const SettingRow: React.FC<{
  title: string;
  description: string;
  children: React.ReactNode;
  last?: boolean;
}> = ({ title, description, children, last }) => (
  <div
    className={`flex items-start justify-between gap-6 py-6 ${
      !last ? "border-b border-theme-primary-500/10" : ""
    }`}
  >
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-theme-primary-50 leading-tight">
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-theme-primary-200/60">
        {description}
      </p>
    </div>
    <div className="shrink-0 w-56">{children}</div>
  </div>
);

const SectionContent: React.FC<{
  tab: SettingsTab;
  colorTheme: ColorTheme;
  publishedQuality: PublishedQuality;
  refreshInterval: number;
  autoLoadLastPreset: boolean;
  dispatch: ReturnType<typeof useAppDispatch>;
}> = ({
  tab,
  colorTheme,
  publishedQuality,
  refreshInterval,
  autoLoadLastPreset,
  dispatch,
}) => {
  switch (tab) {
    case "appearance":
      return (
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-200/50">
              Appearance
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
              Theme styling
            </h3>
          </div>
          <div className="rounded-[24px] border border-theme-primary-500/10 bg-theme-primary-950/20 px-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm">
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
        </section>
      );

    case "window":
      return (
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-200/50">
              Window Management
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
              Refresh and startup
            </h3>
          </div>
          <div className="rounded-[24px] border border-theme-primary-500/10 bg-theme-primary-950/20 px-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm">
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
              <DepthButton
                onClick={() =>
                  dispatch(setAutoLoadLastPreset(!autoLoadLastPreset))
                }
                active={autoLoadLastPreset}
                sizeClassName="w-full h-9 rounded-lg"
                activeClassName="text-theme-primary-50 border-theme-primary-300/70"
                activeSurfaceClassName="depth-active-surface"
                inactiveClassName="text-theme-primary-200/70 border-theme-primary-500/30 hover:text-theme-primary-100"
                inactiveSurfaceClassName="depth-inactive-surface"
              >
                <span className="inline-flex items-center gap-2 text-[12px] font-medium">
                  {autoLoadLastPreset ? "Enabled" : "Disabled"}
                </span>
              </DepthButton>
            </SettingRow>
          </div>
        </section>
      );

    case "projection":
      return (
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-200/50">
              Projection Quality
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
              Output tuning
            </h3>
          </div>
          <div className="rounded-[24px] border border-theme-primary-500/10 bg-theme-primary-950/20 px-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm">
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
              <DepthButton
                onClick={() => {
                  dispatch(resetQualitySettings());
                  (window.electronAPI as any)?.updateQualitySettings?.({
                    publishedQuality: { contrast: 1.0, brightness: 1.0 },
                  });
                }}
                sizeClassName="w-full h-9 rounded-lg"
                inactiveClassName="text-theme-primary-200/80 border-theme-primary-500/35 hover:text-theme-primary-100"
                inactiveSurfaceClassName="depth-inactive-surface"
              >
                <span className="inline-flex items-center gap-2 text-[12px] font-medium">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Defaults
                </span>
              </DepthButton>
            </SettingRow>
          </div>
        </section>
      );

    case "system":
      return (
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-200/50">
              System
            </p>
            <h3 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
              Environment details
            </h3>
          </div>
          <div className="rounded-[24px] border border-theme-primary-500/10 bg-theme-primary-950/20 px-6 shadow-[0_20px_60px_rgba(0,0,0,0.12)] backdrop-blur-sm">
            {[
              [
                "Render Pipeline",
                "GPU Direct — frames stay on GPU, zero CPU readback",
                "GPU Direct",
              ],
              ["Video Delivery", "MediaStream via getUserMedia", "MediaStream"],
              [
                "Active Theme",
                "Current theme selected",
                THEME_NAMES[colorTheme],
              ],
            ].map(([title, desc, value], i, arr) => (
              <SettingRow
                key={String(title)}
                title={String(title)}
                description={String(desc)}
                last={i === arr.length - 1}
              >
                <span className="block text-right text-sm font-medium text-theme-primary-200/70">
                  {String(value)}
                </span>
              </SettingRow>
            ))}
          </div>
        </section>
      );

    default:
      return null;
  }
};

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");
  const dispatch = useAppDispatch();
  const colorTheme = useAppSelector((s) => s.app.colorTheme);
  const publishedQuality = useAppSelector(
    (s) => s.app.publishedQuality,
  ) as PublishedQuality;
  const refreshInterval = useAppSelector((s) => s.app.refreshInterval);
  const autoLoadLastPreset = useAppSelector((s) => s.app.autoLoadLastPreset);

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden text-white">
      <aside className="flex h-full min-h-0 w-60 shrink-0 flex-col border-r border-theme-primary-500/10 bg-theme-primary-950/25">
        <div className="px-6 pb-5 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-theme-primary-200/40">
            Settings
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
            Control center
          </h2>
        </div>

        <div className="px-4 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-primary-300/55 px-2">
            Panel Options
          </p>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          {MENU_ITEMS.map((item) => (
            <SidebarMenuItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-2xl border border-theme-primary-500/15 bg-theme-primary-900/30 p-3">
            <img
              src="/adjustsettings.svg"
              alt="Adjust settings"
              className="h-24 w-full object-contain"
            />
          </div>
        </div>

        <div className="border-t border-theme-primary-500/10 px-6 py-4">
          <p className="text-xs text-theme-primary-200/40">
            Changes are saved instantly
          </p>
        </div>
      </aside>

      <main className="flex h-full min-h-0 flex-1 overflow-y-auto no-scrollbar bg-theme-primary-100/5">
        <div className="flex min-h-full flex-1 flex-col p-8 lg:p-10">
          <SectionContent
            tab={activeTab}
            colorTheme={colorTheme}
            publishedQuality={publishedQuality}
            refreshInterval={refreshInterval}
            autoLoadLastPreset={autoLoadLastPreset}
            dispatch={dispatch}
          />
        </div>
      </main>
    </div>
  );
};
