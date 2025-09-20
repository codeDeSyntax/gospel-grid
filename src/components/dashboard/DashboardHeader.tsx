import React from "react";
import { Users, Trash2, ExternalLink, RefreshCcw, BrushCleaning } from "lucide-react";

interface DashboardHeaderProps {
  onRefreshWindows: () => void;
  onSavePreset: () => void;
  onClearAll: () => void;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  presets: Array<{ id: string; name: string; windowCount: number }>;
  onPublishLayout: () => void;
  selectedWindowsCount: number;
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
}) => {
  return (
    <div className="col-span-12 row-span-1 backdrop-blur-sm bg-gradient-to-r from-primary-900/80 via-slate-900/70 to-primary-900/80 border border-primary-400/50 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-primary-500/10">
      <div className="flex gap-3">
       

        <button
          onClick={onSavePreset}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600/90 to-blue-500/90 hover:from-blue-500 hover:to-blue-400 text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-blue-400/40 shadow-lg shadow-blue-500/30 whitespace-nowrap"
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          Save
        </button>

        <select
          value={selectedPreset}
          onChange={(e) => onPresetChange(e.target.value)}
          className="bg-slate-700/80 border border-slate-600/50 rounded-full px-3 py-2 text-white text-sm backdrop-blur-md min-w-[120px] whitespace-nowrap"
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
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-red-600/90 to-red-500/90 hover:from-red-500 hover:to-red-400 text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-red-400/40 shadow-lg shadow-red-500/30 whitespace-nowrap"
        >
          <BrushCleaning className="w-4 h-4 flex-shrink-0" />
         
        </button>

        <button
          onClick={onPublishLayout}
          disabled={selectedWindowsCount === 0}
          className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 hover:from-emerald-500 hover:to-emerald-400 disabled:from-slate-600/90 disabled:to-slate-500/90 disabled:cursor-not-allowed text-white rounded-full text-sm font-medium transition-all backdrop-blur-md border border-emerald-400/40 disabled:border-slate-400/40 shadow-lg shadow-emerald-500/30 disabled:shadow-slate-500/30 whitespace-nowrap"
          title="Publish layout to full-screen window"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          Publish
        </button>
      </div>
    </div>
  );
};
