import React, { useState } from "react";
import {
  WindowLayoutCard,
  SettingsPanel,
  PresetsPanel,
  ConfidenceMonitor,
  OverlayTextPanel,
  type RightPanelProps,
  type MainViewType,
} from "./index";
import { useAppSelector } from "@/store/hooks";
import {
  Trash2,
  Settings,
  Cast,
  MonitorOff,
  EyeOff,
  Eye,
  Pause,
  Play,
  Undo2,
  Redo2,
  Bookmark,
  Monitor,
  Type,
} from "lucide-react";

type PanelView = "layout" | "settings" | "presets" | "monitor" | "overlay";

export const RightPanel: React.FC<RightPanelProps> = ({
  windows,
  currentLayout,
  focusedWindowId,
  onRefreshWindows,
  onClearAll,
  onLayoutChange,
  onWindowSelect,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  onPublishLayout,
  showSettings = false,
  onToggleSettings,
  onCloseProjection,
  onToggleBlackout,
  onToggleFrozen,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onLoadPreset,
}) => {
  // Read projection state from Redux — no prop drilling
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const isBlackout = useAppSelector((s) => s.app.isBlackout);
  const isFrozen = useAppSelector((s) => s.app.isFrozen);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);

  const selectedWindows = windows.filter((w) => w.isSelected);
  const [activePanel, setActivePanel] = useState<PanelView>("layout");

  const handleToggleSettings = () => {
    if (activePanel === "settings") {
      setActivePanel("layout");
    } else {
      setActivePanel("settings");
    }
    onToggleSettings?.();
  };

  const handleTogglePresets = () => {
    setActivePanel((prev) => (prev === "presets" ? "layout" : "presets"));
  };

  const handleToggleMonitor = () => {
    setActivePanel((prev) => (prev === "monitor" ? "layout" : "monitor"));
  };

  const handleToggleOverlay = () => {
    setActivePanel((prev) => (prev === "overlay" ? "layout" : "overlay"));
  };

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Fixed Top Bar */}
      <div className="shrink-0 h-10 bg-white/[0.02] backdrop-blur-sm border-b border-white/[0.06] px-3 flex items-center justify-between">
        {/* Left side - Projection Toggle + Live Controls */}
        <div className="flex items-center gap-1">
          {/* ON Button */}
          <button
            onClick={() => {
              if (!isProjectionOn && selectedWindows.length > 0) {
                onPublishLayout();
              }
            }}
            disabled={!isProjectionOn && selectedWindows.length === 0}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isProjectionOn
                ? "bg-green-500/15 text-green-400"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            } disabled:opacity-25 disabled:cursor-not-allowed`}
            title={
              selectedWindows.length === 0
                ? "Select windows first"
                : "Start projection (F5)"
            }
          >
            <Cast className="w-4 h-4" />
          </button>

          {/* OFF Button */}
          <button
            onClick={() => {
              if (isProjectionOn) {
                onCloseProjection?.();
              }
            }}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isProjectionOn
                ? "text-white/30 hover:text-red-400 hover:bg-red-500/10"
                : "bg-red-500/15 text-red-400"
            }`}
            title="Stop projection"
          >
            <MonitorOff className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

          {/* Blackout */}
          <button
            onClick={onToggleBlackout}
            disabled={!isProjectionOn}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isBlackout
                ? "bg-yellow-500/15 text-yellow-400"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            } disabled:opacity-20 disabled:cursor-not-allowed`}
            title={
              isBlackout ? "End blackout (F6)" : "Blackout projection (F6)"
            }
          >
            {isBlackout ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          {/* Freeze */}
          <button
            onClick={onToggleFrozen}
            disabled={!isProjectionOn}
            className={`p-2 rounded-lg transition-all duration-200 ${
              isFrozen
                ? "bg-cyan-500/15 text-cyan-400"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            } disabled:opacity-20 disabled:cursor-not-allowed`}
            title={
              isFrozen ? "Unfreeze projection (F7)" : "Freeze projection (F7)"
            }
          >
            {isFrozen ? (
              <Play className="w-4 h-4" />
            ) : (
              <Pause className="w-4 h-4" />
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/[0.06] mx-0.5" />

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            title="Undo selection (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          {/* Redo */}
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            title="Redo selection (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right side - Utility Icons */}
        <div className="flex items-center gap-1">
          {/* Confidence Monitor */}
          <button
            onClick={handleToggleMonitor}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activePanel === "monitor"
                ? "bg-theme-primary-500/15 text-theme-primary-300"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            }`}
            title="Confidence Monitor"
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* Overlay Text */}
          <button
            onClick={handleToggleOverlay}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activePanel === "overlay"
                ? "bg-theme-primary-500/15 text-theme-primary-300"
                : overlayVisible
                  ? "bg-green-500/15 text-green-400"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            }`}
            title="Text Overlay"
          >
            <Type className="w-4 h-4" />
          </button>

          {/* Presets */}
          <button
            onClick={handleTogglePresets}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activePanel === "presets"
                ? "bg-theme-primary-500/15 text-theme-primary-300"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            }`}
            title="Scene Presets"
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Clear All */}
          <button
            onClick={onClearAll}
            className="p-2 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
            title="Clear all selected windows (F8)"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={handleToggleSettings}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activePanel === "settings"
                ? "bg-theme-primary-500/15 text-theme-primary-300"
                : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
            }`}
            title="Settings"
          >
            <Settings
              className={`w-4 h-4 transition-transform duration-200 ${
                activePanel === "settings" ? "rotate-90" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden w-full">
        {activePanel === "settings" ? (
          <SettingsPanel />
        ) : activePanel === "presets" ? (
          <PresetsPanel
            selectedWindows={selectedWindows}
            onLoadPreset={(preset) => onLoadPreset?.(preset)}
          />
        ) : activePanel === "monitor" ? (
          <ConfidenceMonitor selectedWindows={selectedWindows} />
        ) : activePanel === "overlay" ? (
          <OverlayTextPanel />
        ) : (
          <WindowLayoutCard
            selectedWindows={selectedWindows}
            focusedWindowId={focusedWindowId}
            onWindowFocus={onWindowFocus}
            onWindowRemove={onWindowRemove}
            onWindowAdd={onWindowAdd}
            isProjectionOn={isProjectionOn}
          />
        )}
      </div>
    </div>
  );
};
