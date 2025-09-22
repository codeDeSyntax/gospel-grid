import React, { useState } from "react";
import { Volume2, Bell, Settings, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setColorTheme,
  ColorTheme,
  THEME_NAMES,
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
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleThemeChange = (newTheme: ColorTheme) => {
    dispatch(setColorTheme(newTheme));
    ThemeManager.saveTheme(newTheme);
  };

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        enabled 
          ? 'bg-theme-primary-500' 
          : 'bg-stone-600'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="h-full overflow-y-auto scrollbar-hide bg-stone-800 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-medium text-stone-300 uppercase tracking-wider">
            Display & Settings
          </h2>
        </div>

        <div className="space-y-8">
          
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-medium text-white mb-4 uppercase tracking-wide">Theme</h3>
            <div className="flex gap-4">
              {Object.entries(THEME_COLORS).map(([theme, color]) => (
                <button
                  key={theme}
                  onClick={() => handleThemeChange(theme as ColorTheme)}
                  className={`w-8 h-8 rounded-full border-2 transition-all duration-200 ${
                    colorTheme === theme 
                      ? 'border-white scale-110' 
                      : 'border-stone-600 hover:border-stone-400'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {colorTheme === theme && (
                    <div className="w-full h-full rounded-full border-2 border-white/50"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Sounds Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-stone-400" />
              <span className="text-sm font-medium text-white uppercase tracking-wide">Sounds</span>
            </div>
            <ToggleSwitch 
              enabled={soundsEnabled} 
              onChange={() => setSoundsEnabled(!soundsEnabled)} 
            />
          </div>

          {/* Alerts Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-stone-400" />
              <span className="text-sm font-medium text-white uppercase tracking-wide">Alerts</span>
            </div>
            <ToggleSwitch 
              enabled={alertsEnabled} 
              onChange={() => setAlertsEnabled(!alertsEnabled)} 
            />
          </div>

          {/* Divider */}
          <div className="border-t border-stone-700"></div>

          {/* Auto Refresh Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-stone-400" />
              <span className="text-sm font-medium text-white uppercase tracking-wide">Auto Refresh</span>
            </div>
            <ToggleSwitch 
              enabled={autoRefresh} 
              onChange={() => setAutoRefresh(!autoRefresh)} 
            />
          </div>

          {/* Performance Info */}
          <div className="pt-4">
            <div className="text-xs text-stone-500 uppercase tracking-wide mb-3">System</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Active Windows</span>
                <span className="text-white">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-stone-400">Refresh Rate</span>
                <span className="text-white">60fps</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};