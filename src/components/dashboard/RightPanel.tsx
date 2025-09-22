import React, { useState } from "react";
import {
  Plus,
  Sparkles,
  Users,
  Trash2,
  ExternalLink,
  Settings,
  Palette,
  Clock,
  Shield,
  RefreshCcw,
} from "lucide-react";
import { type WindowInfo } from "./WindowList";
import { type PresetInfo } from "./PresetsList";
import { DashboardHeader } from "./DashboardHeader";
import { AutoFitWindowLayout } from "./AutoFitWindowLayoutOptimized";

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
  onWindowAdd: (window: WindowInfo) => void;
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
  onWindowAdd,
  onPublishLayout,
}) => {
  const selectedWindows = windows.filter((w) => w.isSelected);
  const [mainView, setMainView] = useState<"windows" | "settings">("windows");

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
          onToggleSettings={() =>
            setMainView(mainView === "windows" ? "settings" : "windows")
          }
          isSettingsView={mainView === "settings"}
        />

        {/* Main Window Grid Card - Large center area */}
        <div className="col-span-7 row-span-7 backdrop-blur-md bg-gradient-to-br from-transparent via-transparent to-theme-primary-800/20 border border-theme-primary-400/50 rounded-2xl py-4 px-2 shadow shadow-theme-primary-500/30 flex flex-col">
          {/* <div className="flex items-center justify-between mb-4 flex-shrink-0">
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
          </div> */}

          {/* Fixed height container that never overflows */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mainView === "windows" ? (
              // Window Layout View
              selectedWindows.length > 0 ? (
                <AutoFitWindowLayout
                  selectedWindows={selectedWindows}
                  focusedWindowId={focusedWindowId}
                  onWindowFocus={onWindowFocus}
                  onWindowRemove={onWindowRemove}
                  onWindowAdd={onWindowAdd}
                  maxDisplayWindows={4}
                />
              ) : (
                <div className="relative flex items-center justify-center h-full w-full overflow-hidden">
                  {/* Animated Moving Mesh Background */}
                  <div className="absolute inset-0">
                    <svg
                      className="w-full h-full"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <pattern
                          id="movingMesh"
                          x="0"
                          y="0"
                          width="60"
                          height="60"
                          patternUnits="userSpaceOnUse"
                        >
                          {/* Animated nodes */}
                          <circle
                            cx="30"
                            cy="30"
                            r="1"
                            fill="rgb(var(--theme-primary-400) / 0.6)"
                          >
                            <animate
                              attributeName="r"
                              values="1;2;1"
                              dur="3s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.6;1;0.6"
                              dur="2s"
                              repeatCount="indefinite"
                            />
                          </circle>

                          {/* Animated vertical lines moving up and down */}
                          <line
                            x1="30"
                            y1="0"
                            x2="30"
                            y2="60"
                            stroke="rgb(var(--theme-primary-500) / 0.3)"
                            strokeWidth="0.5"
                          >
                            <animateTransform
                              attributeName="transform"
                              attributeType="XML"
                              type="translate"
                              values="0,-10;0,10;0,-10"
                              dur="4s"
                              repeatCount="indefinite"
                            />
                            <animate
                              attributeName="opacity"
                              values="0.1;0.5;0.1"
                              dur="3s"
                              repeatCount="indefinite"
                            />
                          </line>

                          {/* Animated horizontal lines */}
                          <line
                            x1="0"
                            y1="30"
                            x2="60"
                            y2="30"
                            stroke="rgb(var(--theme-primary-600) / 0.3)"
                            strokeWidth="0.5"
                          >
                            <animate
                              attributeName="opacity"
                              values="0.1;0.4;0.1"
                              dur="2.5s"
                              repeatCount="indefinite"
                            />
                          </line>
                        </pattern>
                      </defs>
                      <rect
                        width="100%"
                        height="100%"
                        fill="url(#movingMesh)"
                        opacity="0.4"
                      />
                    </svg>

                    {/* Floating particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 bg-theme-primary-400/40 rounded-full"
                          style={{
                            left: `${15 + i * 12}%`,
                            top: `${20 + i * 8}%`,
                            animation: `float-${i % 3} ${
                              4 + (i % 3)
                            }s ease-in-out infinite`,
                            animationDelay: `${i * 0.5}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Central content with gradient text - perfectly centered */}
                  <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-lg mx-auto">
                    <div className="relative mb-8">
                      {/* Stylish gradient text */}
                      <h2 className="text-2xl font-impact font-extrabold mb-4 bg-gradient-to-r from-theme-primary-400 via-theme-primary-500 to-theme-primary-300 bg-clip-text text-transparent animate-gradient-x">
                        No Windows Selected
                      </h2>

                      {/* Multiple glowing underlines for depth */}
                      <div className="relative mx-auto w-40 h-1">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-primary-400 to-transparent rounded-full opacity-60"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-primary-500 to-transparent rounded-full animate-pulse"></div>
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-theme-primary-400 via-theme-primary-300 to-theme-primary-500 rounded-full opacity-40 animate-pulse"
                          style={{ animationDelay: "1s" }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-xl font-[garamond] text-slate-300/90 leading-relaxed mb-6 font-medium">
                      Click on windows in the sidebar to add them to your layout
                    </p>

                    {/* Decorative elements */}
                    <div className="flex items-center justify-center gap-2 opacity-60">
                      <div className="w-2 h-2 rounded-full bg-theme-primary-400 animate-bounce"></div>
                      <div
                        className="w-2 h-2 rounded-full bg-theme-primary-500 animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-theme-primary-300 animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>

                  {/* CSS Animations */}
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                    @keyframes animate-gradient-x {
                      0%, 100% {
                        background-size: 200% 200%;
                        background-position: left center;
                      }
                      50% {
                        background-size: 200% 200%;
                        background-position: right center;
                      }
                    }
                    
                    .animate-gradient-x {
                      background-size: 200% 200%;
                      animation: animate-gradient-x 3s ease infinite;
                    }
                    
                    @keyframes float-0 {
                      0%, 100% { transform: translateY(0px) translateX(0px); }
                      33% { transform: translateY(-20px) translateX(10px); }
                      66% { transform: translateY(-10px) translateX(-5px); }
                    }
                    
                    @keyframes float-1 {
                      0%, 100% { transform: translateY(0px) translateX(0px); }
                      50% { transform: translateY(-15px) translateX(-8px); }
                    }
                    
                    @keyframes float-2 {
                      0%, 100% { transform: translateY(0px) translateX(0px); }
                      25% { transform: translateY(-25px) translateX(5px); }
                      75% { transform: translateY(-5px) translateX(-10px); }
                    }
                  `,
                    }}
                  />
                </div>
              )
            ) : (
              // Settings View
              <div className="h-full overflow-y-auto p-6 space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-theme-primary-400 to-theme-primary-300 bg-clip-text text-transparent mb-2">
                    Settings & Preferences
                  </h2>
                  <p className="text-slate-400">
                    Customize your StreamSpire experience
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Auto-refresh Settings */}
                  <div className="bg-slate-800/30 border border-slate-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Clock className="w-6 h-6 text-theme-primary-400" />
                      <h3 className="text-xl font-semibold text-white">
                        Auto Refresh
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Refresh Interval</span>
                        <select className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white">
                          <option value="30">30 seconds</option>
                          <option value="60" selected>
                            1 minute
                          </option>
                          <option value="120">2 minutes</option>
                          <option value="300">5 minutes</option>
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Smart Refresh</span>
                        <button className="w-12 h-6 bg-theme-primary-500 rounded-full relative transition-colors">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-transform"></div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Display Settings */}
                  <div className="bg-slate-800/30 border border-slate-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Palette className="w-6 h-6 text-theme-primary-400" />
                      <h3 className="text-xl font-semibold text-white">
                        Display
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Show Minimized Windows
                        </span>
                        <button className="w-12 h-6 bg-slate-600 rounded-full relative transition-colors">
                          <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Animation Speed</span>
                        <select className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white">
                          <option value="fast">Fast</option>
                          <option value="normal" selected>
                            Normal
                          </option>
                          <option value="slow">Slow</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Security Settings */}
                  <div className="bg-slate-800/30 border border-slate-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-theme-primary-400" />
                      <h3 className="text-xl font-semibold text-white">
                        Security
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Show System Windows
                        </span>
                        <button className="w-12 h-6 bg-slate-600 rounded-full relative transition-colors">
                          <div className="w-5 h-5 bg-white rounded-full absolute left-0.5 top-0.5 transition-transform"></div>
                        </button>
                      </div>
                      <button className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 rounded-lg transition-colors">
                        Clear All Presets
                      </button>
                    </div>
                  </div>

                  {/* Performance Settings */}
                  <div className="bg-slate-800/30 border border-slate-600/40 rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <RefreshCcw className="w-6 h-6 text-theme-primary-400" />
                      <h3 className="text-xl font-semibold text-white">
                        Performance
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Hardware Acceleration
                        </span>
                        <button className="w-12 h-6 bg-theme-primary-500 rounded-full relative transition-colors">
                          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 transition-transform"></div>
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">
                          Memory Optimization
                        </span>
                        <select className="bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-white">
                          <option value="auto" selected>
                            Auto
                          </option>
                          <option value="conservative">Conservative</option>
                          <option value="aggressive">Aggressive</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Speech-to-Text Card */}
        <div className="col-span-5 row-span-3 backdrop-blur-2xl bg-gradient-to-br from-theme-primary-900/80 via-slate-900/70 to-theme-primary-800/80 border border-theme-primary-400/50 rounded-2xl p-3 shadowlg shadow-theme-primary-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="text-base font-semibold text-white">
                AI Live Transcription
              </h3>
            </div>
            <button
              onClick={() => onWindowSelect("ai-transcription")}
              className="group relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-theme-primary-500/20 via-theme-primary-600/20 to-theme-primary-700/20 border border-theme-primary-400/30 backdrop-blur-sm transition-all duration-300 hover:from-theme-primary-500/30 hover:via-theme-primary-600/30 hover:to-theme-primary-700/30 hover:border-theme-primary-300/50 hover:shadow-lg hover:shadow-theme-primary-500/25 hover:scale-105 flex-shrink-0"
              title="Add to window grid"
            >
              <Sparkles className="w-4 h-4 text-theme-primary-300 group-hover:text-white transition-colors duration-300" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-theme-primary-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-theme-primary-500 rounded-full"></div>
              <span className="text-theme-primary-300 text-xs font-medium">
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
        <div className="col-span-5 row-span-4 backdrop-blur-2xl bg-gradient-to-b from-transparent via-transparent to-theme-primary-800/20 border border-solid border-theme-primary-400/50 rounded-2xl p-4 shadowlg shadow-theme-primary-500/30 flex flex-col">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-theme-primary-400">📋</span>
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
                        ? "bg-theme-primary-600/40 border-theme-primary-400/60 shadow-lg shadow-theme-primary-500/20"
                        : "bg-slate-800/30 border-slate-600/40 hover:bg-slate-700/40 hover:border-theme-primary-500/40"
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
      </div>
    </div>
  );
};
