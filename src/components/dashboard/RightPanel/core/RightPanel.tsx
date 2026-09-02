import React, { useEffect, useState } from "react";
import { type RightPanelProps, type FeatureView } from "../types";
import { SettingsPanel } from "../SettingsPanel";
import { FeatureImageMenu } from "../FeatureImageMenu";
import { FeatureRail } from "../FeatureRail";
import { FeatureViewHost } from "../FeatureViewHost";
import { useAppSelector } from "@/store/hooks";
import { useRemoteWebRtc } from "@/hooks/useRemoteWebRtc";

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
  contextIntelligence,
}) => {
  // Read projection state from Redux — no prop drilling
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const [activeFeatureView, setActiveFeatureView] =
    useState<FeatureView>("autofit");
  const [isImageMenuOpen, setIsImageMenuOpen] = useState(false);
  const remoteWebRtc = useRemoteWebRtc();

  useEffect(() => {
    if (activePanel === "overlay") {
      setActiveFeatureView("overlay");
    }
  }, [activePanel]);

  const selectedWindows = windows.filter((w) => w.isSelected);

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden flex-1 rounded-tl-[0px] bg-theme-primary-900 border border-theme-primary-500/20 "
      // surfaceClassName="depth-surface-shell"
    >
      {/* Main Content Area - Scrollable */}
      <div className="relative z-10 flex h-full min-h-0 flex-1 w-full overflow-hidden  ">
        {activePanel === "settings" ? (
          <SettingsPanel />
        ) : (
          <div className="flex h-full w-full items-stretch px-2 py-3">
            <div className="relative min-w-0 flex-1 overflow-hidden rounded-2xl ">
              <div className="absolute inset-x-2 top-2 z-30">
                <FeatureImageMenu
                  isOpen={isImageMenuOpen}
                  onClose={() => setIsImageMenuOpen(false)}
                />
              </div>

              <div className="h-full min-h-0 overflow-hidden  p-2">
                <FeatureViewHost
                  activeView={activeFeatureView}
                  windows={windows}
                  currentLayout={currentLayout}
                  focusedWindowId={focusedWindowId}
                  onWindowFocus={onWindowFocus}
                  onWindowRemove={onWindowRemove}
                  onWindowAdd={onWindowAdd}
                  isProjectionOn={isProjectionOn}
                  remoteWebRtc={remoteWebRtc}
                  contextIntelligence={contextIntelligence}
                />
              </div>
            </div>

            <FeatureRail
              activeView={activeFeatureView}
              onSelectView={setActiveFeatureView}
              isImageMenuOpen={isImageMenuOpen}
              onToggleImageMenu={() =>
                setIsImageMenuOpen((current) => !current)
              }
              aiCardsCount={contextIntelligence?.cards?.length ?? 0}
            />
          </div>
        )}
      </div>
    </div>
  );
};
