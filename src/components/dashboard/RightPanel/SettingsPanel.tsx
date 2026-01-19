import React, { useState } from "react";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { Clock, RotateCcw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setColorTheme,
  ColorTheme,
  THEME_NAMES,
  setPublishedContrast,
  setPublishedBrightness,
  setCaptureQuality,
  resetQualitySettings,
} from "@/store/slices/appSlice";
import { ThemeManager } from "@/utils/themeManager";
import type { SettingsPanelProps } from "./types";

// Define theme colors for the circular selectors
const THEME_COLORS: Record<ColorTheme, string> = {
  "cosmic-blue": "#3B82F6",
  "matrix-green": "#10B981",
  "fire-red": "#EF4444",
  "steel-gray": "#6B7280",
  "earth-brown": "#D97706",
  "violet-purple": "#A855F7",
  "sunset-orange": "#F97316",
  "midnight-black": "#1F2937",
};

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const dispatch = useAppDispatch();
  const colorTheme = useAppSelector((state) => state.app.colorTheme);
  const publishedQuality = useAppSelector(
    (state) => state.app.publishedQuality
  );
  const captureQuality = useAppSelector((state) => state.app.captureQuality);
  const [refreshInterval, setRefreshInterval] = useState("60");

  const handleThemeChange = (newTheme: ColorTheme) => {
    dispatch(setColorTheme(newTheme));
    ThemeManager.saveTheme(newTheme);
  };

  const handleContrastChange = (value: number) => {
    dispatch(setPublishedContrast(value));
    // Notify published windows via IPC
    (window.electronAPI as any)?.updateQualitySettings?.({
      publishedQuality: {
        contrast: value,
        brightness: publishedQuality.brightness,
      },
      captureQuality,
    });
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setPublishedBrightness(value));
    // Notify published windows via IPC
    (window.electronAPI as any)?.updateQualitySettings?.({
      publishedQuality: {
        contrast: publishedQuality.contrast,
        brightness: value,
      },
      captureQuality,
    });
  };

  const handleCaptureQualityChange = (value: number) => {
    dispatch(setCaptureQuality(value));
    // Notify published windows via IPC
    (window.electronAPI as any)?.updateQualitySettings?.({
      publishedQuality,
      captureQuality: value,
    });
  };

  const handleResetQuality = () => {
    console.log("Reset button clicked - dispatching resetQualitySettings");
    console.log(
      "BEFORE reset - publishedQuality:",
      publishedQuality,
      "captureQuality:",
      captureQuality
    );
    dispatch(resetQualitySettings());

    // Notify published windows via IPC
    (window.electronAPI as any)?.updateQualitySettings?.({
      publishedQuality: { contrast: 1.0, brightness: 1.0 },
      captureQuality: 80,
    });

    // Check values immediately after dispatch (may not update yet due to async)
    setTimeout(() => {
      console.log(
        "AFTER reset (100ms delay) - should see updated values in component re-render"
      );
    }, 100);
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar backdrop-blur-xl  border border-theme-primary-400/30 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Display & Settings
          </h2>
        </div>

        <div className="space-y-8">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
              Theme
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border border-stone-600"
                  style={{ backgroundColor: THEME_COLORS[colorTheme] }}
                />
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Color Theme
                </span>
              </div>
              <select
                value={colorTheme}
                onChange={(e) =>
                  handleThemeChange(e.target.value as ColorTheme)
                }
                className="backdrop-blur-md bg-gradient-to-r from-stone-800/80 to-stone-700/80 border border-stone-600/50 rounded-lg px-3 py-2 text-white text-sm min-w-[140px] focus:border-theme-primary-400/50 focus:outline-none transition-colors hover:border-theme-primary-400/30"
              >
                {Object.entries(THEME_NAMES).map(([value, name]) => (
                  <option key={value} value={value}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-theme-primary-400/10 border-solid my-2"></div>

          {/* Refresh Interval Section */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
              Refresh Settings
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-theme-primary-400" />
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Refresh Interval
                </span>
              </div>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
                className="backdrop-blur-md bg-gradient-to-r from-stone-800/80 to-stone-700/80 border border-stone-600/50 rounded-lg px-3 py-2 text-white text-sm min-w-[120px] focus:border-theme-primary-400/50 focus:outline-none transition-colors hover:border-theme-primary-400/30"
              >
                <option value="30">30 seconds</option>
                <option value="60">1 minute</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-theme-primary-400/10 border-solid my-2"></div>

          {/* Published Quality Section */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">
              Published Quality
            </h3>
            <div className="space-y-4">
              {/* Contrast Control */}
              <div>
                <CustomSlider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={publishedQuality.contrast}
                  onChange={handleContrastChange}
                  label={"Contrast"}
                  marks={[0.5, 1, 1.5, 2]}
                  unit={""}
                />
              </div>

              {/* Brightness Control */}
              <div>
                <CustomSlider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={publishedQuality.brightness}
                  onChange={handleBrightnessChange}
                  label={"Brightness"}
                  marks={[0.5, 1, 1.5, 2]}
                  unit={""}
                />
              </div>

              {/* Capture Quality Control */}
              <div>
                <CustomSlider
                  min={50}
                  max={100}
                  step={5}
                  value={captureQuality}
                  onChange={handleCaptureQualityChange}
                  label={"Capture Quality"}
                  marks={[50, 65, 80, 100]}
                  unit="%"
                />
              </div>

              {/* Reset to Defaults Button */}
              <button
                onClick={handleResetQuality}
                className="w-full mt-2 flex items-center justify-center gap-2 backdrop-blur-md bg-gradient-to-r from-stone-800/80 to-stone-700/80 hover:from-stone-700/80 hover:to-stone-600/80 border border-stone-600/50 hover:border-theme-primary-400/50 rounded-lg px-4 py-2.5 text-white text-sm font-medium transition-all duration-200"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Defaults
              </button>

              <div className="text-xs text-stone-400 italic">
                These settings affect the visual quality of published layout
                windows. Higher quality = sharper but slower.
              </div>
            </div>
          </div>

          {/* Performance Info */}
          <div className="pt-4">
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-3">
              System
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Active Windows</span>
                <span className="text-theme-primary-300">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Refresh Rate</span>
                <span className="text-theme-primary-300">60fps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Current Theme</span>
                <span className="text-theme-primary-300">
                  {THEME_NAMES[colorTheme]}

                  {/* Divider */}
                  <div className="border-t border-theme-primary-400/10 border-solid my-2"></div>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
