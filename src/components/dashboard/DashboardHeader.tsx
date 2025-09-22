import React from "react";
import {
  Users,
  Trash2,
  ExternalLink,
  RefreshCcw,
  BrushCleaning,
  Settings,
} from "lucide-react";

interface DashboardHeaderProps {
  onRefreshWindows: () => void;
  onSavePreset: () => void;
  onClearAll: () => void;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  presets: Array<{ id: string; name: string; windowCount: number }>;
  onPublishLayout: () => void;
  selectedWindowsCount: number;
  onToggleSettings: () => void;
  isSettingsView: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefreshWindows,
  onSavePreset,
  onClearAll,
  selectedPreset,
  onPresetChange,
  presets,
  onPublishLayout,
  selectedWindowsCount,
  onToggleSettings,
  isSettingsView,
}) => {
  return (
    <div className="col-span-12 row-span-1 backdrop-blur-2xl bg-gradient-to-r from-theme-primary-900/80 via-stone-900/70 to-theme-primary-900/80 border border-theme-primary-400/50 rounded-2xl p-4 flex items-center justify-between shadow-md shadow-theme-primary-500/30">
      <div className="flex gap-3">
        <button
          onClick={onSavePreset}
          className="flex items-center cursor-pointer  gap-1.5 px-3 py-2 bg-gradient-to-r from-theme-primary-600/90 to-theme-primary-500/90 hover:from-theme-primary-500 hover:to-theme-primary-400 text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-theme-primary-400/40 shadow-lg shadow-theme-primary-500/30 whitespace-nowrap"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          Save
        </button>

        <select
          value={selectedPreset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="bg-stone-700/80 border border-stone-600/50 rounded-full px-3 py-2 text-white text-sm backdrop-blur-md min-w-[120px] whitespace-nowrap"
        >
          <option value="">Select...</option>
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>

        <button
          onClick={onClearAll}
          className="flex items-center cursor-pointer  gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600/90 to-red-500/90 hover:from-red-500 hover:to-red-400 text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-red-400/40 shadow-lg shadow-red-500/30 whitespace-nowrap"
        >
          <BrushCleaning className="w-4 h-4 flex-shrink-0" />
        </button>

        <button
          onClick={onPublishLayout}
          disabled={selectedWindowsCount === 0}
          className="flex items-center gap-1.5 cursor-pointer  px-3 py-2 bg-gradient-to-r from-theme-primary-600/90 to-theme-primary-500/90  disabled:from-stone-600/90 disabled:to-stone-500/90 disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-emerald-400/40 disabled:border-stone-400/40 shadow-lg shadow-emerald-500/30 disabled:shadow-stone-500/30 whitespace-nowrap"
          title="Publish layout to full-screen window"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          Publish
        </button>
      </div>

      {/* Right side - Settings toggle */}
      <div className="flex items-center">
        <button
          onClick={onToggleSettings}
          className={`flex items-center cursor-pointer gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all backdrop-blur-md border shadow-lg whitespace-nowrap ${
            isSettingsView
              ? "bg-gradient-to-r from-theme-primary-600/90 to-theme-primary-500/90 hover:from-theme-primary-500 hover:to-theme-primary-400 text-white border-theme-primary-400/40 shadow-theme-primary-500/30"
              : "bg-white text-black border-stone-400/40 shadow-stone-500/30"
          }`}
          title={isSettingsView ? "Back to Window Layout" : "Open Settings"}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {isSettingsView ? "Back" : "Settings"}
        </button>
      </div>
    </div>
  );
};
