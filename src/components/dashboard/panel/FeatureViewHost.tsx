import React from "react";
import { WindowLayoutCard } from "./WindowLayoutCard";
import { OverlayTextPanel } from "./OverlayTextPanel";
import { FeatureTimerView } from "./FeatureTimerView";
import { FeatureCaptionsView } from "./FeatureCaptionsView";
import type { FeatureView, WindowLayoutCardProps } from "../RightPanel/types";

interface FeatureViewHostProps extends WindowLayoutCardProps {
  activeView: FeatureView;
}

export const FeatureViewHost: React.FC<FeatureViewHostProps> = ({
  activeView,
  windows,
  currentLayout,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  isProjectionOn,
}) => {
  if (activeView === "overlay") {
    return <OverlayTextPanel />;
  }

  if (activeView === "timer") {
    return <FeatureTimerView />;
  }

  if (activeView === "captions") {
    return <FeatureCaptionsView />;
  }

  return (
    <WindowLayoutCard
      windows={windows}
      currentLayout={currentLayout}
      focusedWindowId={focusedWindowId}
      onWindowFocus={onWindowFocus}
      onWindowRemove={onWindowRemove}
      onWindowAdd={onWindowAdd}
      isProjectionOn={isProjectionOn}
    />
  );
};
