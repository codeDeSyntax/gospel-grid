import React from "react";
import type { PresetsCardProps } from "./types";

export const PresetsCard: React.FC<PresetsCardProps> = ({
  presets,
  selectedPreset,
  onPresetSelect,
}) => {
  return (
    <div className="col-span-5 row-span-4 backdrop-blur-2xl bg-gradient-to-b from-transparent via-transparent to-theme-primary-800/20 border border-solid border-theme-primary-400/50 rounded-2xl p-4 shadowlg shadow-theme-primary-500/30 flex flex-col">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary-400">📋</span>
          <h3 className="text-lg font-semibold text-white">Saved Presets</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-3 pr-2">
          {presets.length === 0 ? (
            <div className="text-stone-400 text-sm text-center py-8">
              No saved presets yet. Select windows and save your first preset!
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onPresetSelect(preset.id)}
                className={`backdrop-blur-md border rounded-xl p-3 cursor-pointer transition-all duration-300 flex justify-between items-center group ${
                  selectedPreset === preset.id
                    ? "bg-theme-primary-600/40 border-theme-primary-400/60 shadow-lg shadow-theme-primary-500/20"
                    : "bg-stone-800/30 border-stone-600/40 hover:bg-stone-700/40 hover:border-theme-primary-500/40"
                }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm text-white font-medium">
                    {preset.name}
                  </span>
                  <span className="text-xs text-stone-400">
                    {preset.windowCount} windows
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-theme-primary-500/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg shadow-theme-primary-500/20">
                    {preset.windowCount}
                  </span>
                  {selectedPreset === preset.id && (
                    <div className="w-2 h-2 bg-theme-primary-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
