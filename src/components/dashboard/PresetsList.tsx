import React from "react";

export interface PresetInfo {
  id: string;
  name: string;
  windowCount: number;
  windows?: Array<{
    id: string;
    name: string;
    app: string;
    icon?: string;
    hasNativeIcon?: boolean;
  }>; // Actual saved window data with icons
  requiredWindows?: string[]; // Keep for backward compatibility/mock data
}

interface PresetsListProps {
  presets: PresetInfo[];
  onPresetSelect: (presetId: string) => void;
}

export const PresetsList: React.FC<PresetsListProps> = ({
  presets,
  onPresetSelect,
}) => {
  return (
    <div className="mt-6">
      <h3 className="text-base font-semibold text-blue-200 mb-4 flex items-center gap-2">
        <span>📋</span>
        <span>Saved Presets</span>
      </h3>

      <div className="space-y-3">
        {presets.map((preset) => (
          <div
            key={preset.id}
            onClick={() => onPresetSelect(preset.id)}
            className="backdrop-blur-md bg-slate-800/30 border border-slate-600/40 rounded-xl p-3 cursor-pointer transition-all duration-300 flex justify-between items-center hover:bg-slate-700/40 hover:border-blue-500/40 hover:scale-105 group"
          >
            <span className="text-sm text-white font-medium">
              {preset.name}
            </span>

            <span className="bg-blue-500/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg shadow-blue-500/20">
              {preset.windowCount}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Default mock presets for development (kept for backward compatibility)
export const mockPresets: PresetInfo[] = [
  {
    id: "sunday-service",
    name: "Sunday Service",
    windowCount: 4,
    requiredWindows: [
      "PowerPoint",
      "Chrome",
      "VLC Media Player",
      "File Explorer",
    ],
  },
  {
    id: "bible-study",
    name: "Bible Study",
    windowCount: 2,
    requiredWindows: ["PowerPoint", "Logos Bible Software"],
  },
  {
    id: "worship",
    name: "Worship Only",
    windowCount: 3,
    requiredWindows: ["VLC Media Player", "Chrome", "PowerPoint"],
  },
];
