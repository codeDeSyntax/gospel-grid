import React, { useEffect, useState } from "react";
import {
  SettingsPanel,
  PresetsPanel,
  FeatureRail,
  FeatureViewHost,
  type RightPanelProps,
  type FeatureView,
} from "./index";
import { useAppSelector } from "@/store/hooks";
import { DepthSurface } from "@/shared/DepthSurface";

export const RightPanel: React.FC<RightPanelProps> = ({
  windows,
  currentLayout,
  focusedWindowId,
  onLayoutChange,
  onWindowSelect,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  activePanel,
  onLoadPreset,
}) => {
  // Read projection state from Redux — no prop drilling
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const [activeFeatureView, setActiveFeatureView] =
    useState<FeatureView>("autofit");

  useEffect(() => {
    if (activePanel === "overlay") {
      setActiveFeatureView("overlay");
    }
  }, [activePanel]);

  const selectedWindows = windows.filter((w) => w.isSelected);

  return (
    <DepthSurface
      className="relative flex h-full flex-col overflow-hidden flex-1 rounded-2xl"
      surfaceClassName="depth-surface-shell"
    >
      {/* Main Content Area - Scrollable */}
      <div className="relative z-10 flex h-full min-h-0 flex-1 w-full overflow-hidden">
        {activePanel === "settings" ? (
          <SettingsPanel />
        ) : activePanel === "presets" ? (
          <PresetsPanel
            selectedWindows={selectedWindows}
            onLoadPreset={(preset) => onLoadPreset?.(preset)}
          />
        ) : (
          <div className="flex h-full w-full items-stretch px-2 py-3">
            <div className="min-w-0 flex-1 overflow-hidden rounded-2xl  bg-theme-primary-800/50">
              <FeatureViewHost
                activeView={activeFeatureView}
                windows={windows}
                currentLayout={currentLayout}
                focusedWindowId={focusedWindowId}
                onWindowFocus={onWindowFocus}
                onWindowRemove={onWindowRemove}
                onWindowAdd={onWindowAdd}
                isProjectionOn={isProjectionOn}
              />
            </div>

            <FeatureRail
              activeView={activeFeatureView}
              onSelectView={setActiveFeatureView}
            />
          </div>
        )}
      </div>
    </DepthSurface>
  );
};
