import React, { useState } from "react";
import { CustomSlider } from "@/components/ui/CustomSlider";
import { Clock } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setColorTheme,
  ColorTheme,
  THEME_NAMES,
  setPublishedContrast,
  setPublishedBrightness,
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
};

export const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  const dispatch = useAppDispatch();
  const colorTheme = useAppSelector((state) => state.app.colorTheme);
  const publishedQuality = useAppSelector(
    (state) => state.app.publishedQuality
  );
  const [refreshInterval, setRefreshInterval] = useState("60");

  const handleThemeChange = (newTheme: ColorTheme) => {
    dispatch(setColorTheme(newTheme));
    ThemeManager.saveTheme(newTheme);
  };

  const handleContrastChange = (value: number) => {
    dispatch(setPublishedContrast(value));
  };

  const handleBrightnessChange = (value: number) => {
    dispatch(setPublishedBrightness(value));
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar backdrop-blur-xl  border border-theme-primary-400/30 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-base font-semibold text-white uppercase tracking-wider">
            Display & Settings
          </h2>
        </div>

        <div className="space-y-8">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4 uppercase tracking-wide">
              Theme
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border border-stone-600"
                  style={{ backgroundColor: THEME_COLORS[colorTheme] }}
                />
                <span className="text-sm font-medium text-white uppercase tracking-wide">
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
            <h3 className="text-sm font-medium text-white mb-4 uppercase tracking-wide">
              Refresh Settings
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-theme-primary-400" />
                <span className="text-sm font-medium text-white uppercase tracking-wide">
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
            <h3 className="text-sm font-medium text-white mb-4 uppercase tracking-wide">
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

              <div className="text-xs text-stone-400 italic">
                These settings affect the visual quality of published layout
                windows
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
