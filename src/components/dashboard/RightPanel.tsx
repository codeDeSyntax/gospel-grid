import React from "react";
import { Plus, Sparkles, Users, Trash2, ExternalLink } from "lucide-react";
import { type WindowInfo } from "./WindowList";
import { type PresetInfo } from "./PresetsList";
import { DashboardHeader } from "./DashboardHeader";
import { AutoFitWindowLayout } from "./AutoFitWindowLayout";

interface RightPanelProps {
  windows: WindowInfo[];
  presets: PresetInfo[];
  selectedPreset: string;
  currentLayout: string;
  focusedWindowId: string | null;
  onRefreshWindows: () => void;
  onSavePreset: () => void;
  onClearAll: () => void;
  onPresetChange: (preset: string) => void;
  onLayoutChange: (layout: string) => void;
  onWindowSelect: (windowId: string) => void;
  onPresetSelect: (presetId: string) => void;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onPublishLayout: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  windows,
  presets,
  selectedPreset,
  currentLayout,
  focusedWindowId,
  onRefreshWindows,
  onSavePreset,
  onClearAll,
  onPresetChange,
  onLayoutChange,
  onWindowSelect,
  onPresetSelect,
  onWindowFocus,
  onWindowRemove,
  onPublishLayout,
}) => {
  const selectedWindows = windows.filter((w) => w.isSelected);

  return (
    <div className="flex-1 h-full p-6 overflow-hidden no-scrollbar">
      {/* Bento Grid Layout */}
      <div className="h-full grid grid-cols-12 grid-rows-8 gap-4">
        {/* Header Card - Using imported component */}
        <DashboardHeader
          onRefreshWindows={onRefreshWindows}
          onSavePreset={onSavePreset}
          onClearAll={onClearAll}
          selectedPreset={selectedPreset}
          onPresetChange={onPresetChange}
          presets={presets}
          onPublishLayout={onPublishLayout}
          selectedWindowsCount={selectedWindows.length}
        />

        {/* Main Window Grid Card - Large center area */}
        <div className="col-span-7 row-span-7 backdrop-blur-md bg-gradient-to-br from-transparent via-transparent to-primary-800/20 border border-primary-400/50 rounded-2xl p-4 shadowlg shadow-primary-500/30 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-white">Window Layout</h3>
            <select
              value={currentLayout}
              onChange={(e) => onLayoutChange(e.target.value)}
              className="bg-slate-700/50 border border-slate-600/30 rounded-lg px-3 py-1 text-white text-sm"
            >
              <option value="auto">Auto</option>
              <option value="2x2">2x2 Grid</option>
              <option value="3x2">3x2 Grid</option>
              <option value="focus">Focus Mode</option>
            </select>
          </div>

          {/* Fixed height container that never overflows */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {selectedWindows.length > 0 ? (
              <AutoFitWindowLayout
                selectedWindows={selectedWindows}
                focusedWindowId={focusedWindowId}
                onWindowFocus={onWindowFocus}
                onWindowRemove={onWindowRemove}
                maxDisplayWindows={25}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-center">
                <div>
                  <div className="text-4xl mb-2">📱</div>
                  <div>No windows selected</div>
                  <div className="text-sm">
                    Click on windows in the sidebar to add them to the layout
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Speech-to-Text Card */}
        <div className="col-span-5 row-span-3 backdrop-blur-2xl bg-gradient-to-br from-primary-900/80 via-slate-900/70 to-primary-800/80 border border-primary-400/50 rounded-2xl p-3 shadowlg shadow-primary-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-base font-semibold text-white">
                AI Live Transcription
              </h3>
            </div>
            <button
              onClick={() => onWindowSelect("ai-transcription")}
              className="group relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-blue-600/20 border border-blue-400/30 backdrop-blur-sm transition-all duration-300 hover:from-blue-500/30 hover:via-purple-500/30 hover:to-blue-600/30 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105 flex-shrink-0"
              title="Add to window grid"
            >
              <Sparkles className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors duration-300" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-blue-300 text-xs font-medium">
                LISTENING
              </span>
            </div>
            <div className="text-slate-400 text-xs">• Live audio</div>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-600/30 h-24 overflow-hidden">
            <div className="text-white text-sm leading-relaxed line-clamp-3">
              "Welcome everyone to today's service. Let us begin with a moment
              of prayer and reflection..."
            </div>
            <div className="text-slate-400 text-xs mt-2 flex items-center gap-1">
              <span>🎤 Preaching</span>
              <span>•</span>
              <span>94%</span>
            </div>
          </div>
        </div>

        {/* Saved Presets Card */}
        <div className="col-span-5 row-span-4 backdrop-blur-2xl bg-gradient-to-b from-transparent via-transparent to-primary-800/20 border border-solid border-primary-400/50 rounded-2xl p-4 shadowlg shadow-primary-500/30 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-blue-400">📋</span>
              <h3 className="text-lg font-semibold text-white">
                Saved Presets
              </h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="space-y-3 pr-2">
              {presets.length === 0 ? (
                <div className="text-slate-400 text-sm text-center py-8">
                  No saved presets yet. Select windows and save your first
                  preset!
                </div>
              ) : (
                presets.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => onPresetSelect(preset.id)}
                    className={`backdrop-blur-md border rounded-xl p-3 cursor-pointer transition-all duration-300 flex justify-between items-center group ${
                      selectedPreset === preset.id
                        ? "bg-primary-600/40 border-primary-400/60 shadow-lg shadow-primary-500/20"
                        : "bg-slate-800/30 border-slate-600/40 hover:bg-slate-700/40 hover:border-blue-500/40"
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-white font-medium">
                        {preset.name}
                      </span>
                      <span className="text-xs text-slate-400">
                        {preset.windowCount} windows
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium shadow-lg shadow-blue-500/20">
                        {preset.windowCount}
                      </span>
                      {selectedPreset === preset.id && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
