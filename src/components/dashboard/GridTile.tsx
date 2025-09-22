import React, { useEffect, useState } from "react";
import type { WindowInfo } from "./WindowList";

interface GridTileProps {
  window: WindowInfo;
  isFocused: boolean;
  onFocus: () => void;
  onRemove: () => void;
}

export const GridTile: React.FC<GridTileProps> = ({
  window,
  isFocused,
  onFocus,
  onRemove,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    // Simulate loading content
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
      setIsRecording(Math.random() > 0.5); // 50% chance of recording
    }, 1000);

    return () => clearTimeout(loadingTimer);
  }, []);

  const getAppIcon = (app: string): string => {
    if (app.includes("Bible") || app.includes("Logos")) return "📖";
    if (app.includes("PowerPoint")) return "📊";
    if (app.includes("Notepad") || app.includes("Notes")) return "📝";
    if (app.includes("YouTube") || app.includes("Chrome")) return "🎵";
    if (app.includes("OBS")) return "🎥";
    return "💻";
  };

  const getAppColor = (app: string): string => {
    if (app.includes("Bible") || app.includes("Logos"))
      return "rgb(74, 158, 255)";
    if (app.includes("PowerPoint")) return "rgb(39, 174, 96)";
    if (app.includes("Notepad") || app.includes("Notes"))
      return "rgb(241, 196, 15)";
    if (app.includes("YouTube") || app.includes("Chrome"))
      return "rgb(231, 76, 60)";
    if (app.includes("OBS")) return "rgb(155, 89, 182)";
    return "rgb(74, 158, 255)";
  };

  const appColor = getAppColor(window.app);

  return (
    <div
      className={`backdrop-blur-md bg-slate-800/40 border rounded-2xl overflow-hidden relative transition-all duration-300 flex flex-col hover:scale-105 ${
        isFocused
          ? "border-theme-primary-400/60 shadow-xl shadow-theme-primary-500/25 bg-slate-700/50"
          : "border-slate-600/40 hover:border-theme-primary-500/50 hover:shadow-xl hover:shadow-theme-primary-500/10"
      }`}
    >
      {/* Tile Header */}
      <div className="backdrop-blur-md bg-slate-900/60 px-4 py-3 border-b border-slate-600/30 flex justify-between items-center">
        <div className="text-sm font-semibold text-theme-primary-200 truncate">
          {window.name}
        </div>

        <div className="flex gap-1">
          <button
            onClick={onFocus}
            className="text-theme-primary-300/70 hover:text-theme-primary-200 hover:bg-slate-700/50 px-2 py-1 rounded-lg text-xs transition-all duration-200 backdrop-blur-sm"
            title={isFocused ? "Unfocus" : "Focus"}
          >
            🎯
          </button>
          <button
            onClick={onRemove}
            className="text-red-300/70 hover:text-red-200 hover:bg-red-900/30 px-2 py-1 rounded-lg text-xs transition-all duration-200 backdrop-blur-sm"
            title="Remove"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Tile Content */}
      <div className="flex-1 relative overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center backdrop-blur-sm bg-slate-900/20">
            <div className="text-center text-theme-primary-200/60">
              <div className="text-4xl mb-4 opacity-30">📺</div>
              <div className="text-sm mb-1">Live capture from:</div>
              <div className="font-semibold text-theme-primary-100">
                {window.app}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="h-full flex items-center justify-center flex-col relative backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${appColor}15, ${appColor}25, ${appColor}10)`,
            }}
          >
            {/* Cosmic overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-theme-primary-500/5 via-transparent to-theme-primary-600/5" />

            <div className="relative z-10 text-center">
              <div className="text-5xl mb-4 opacity-80 drop-shadow-lg">
                {getAppIcon(window.app)}
              </div>
              <div className="font-semibold text-white text-lg mb-2 drop-shadow-md">
                {window.name}
              </div>
              <div className="text-sm text-theme-primary-200/90 flex items-center justify-center gap-2">
                <span className="inline-block w-2.5 h-2.5 bg-red-400 rounded-full animate-pulse shadow-lg shadow-red-400/50"></span>
                <span className="font-medium">LIVE</span>
              </div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div
          className={`absolute top-3 right-3 w-3 h-3 rounded-full border-2 border-white/20 backdrop-blur-sm ${
            isRecording
              ? "bg-red-400 animate-pulse shadow-lg shadow-red-400/50"
              : "bg-green-400 shadow-lg shadow-green-400/50"
          }`}
        />

        {/* Glass reflection effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
