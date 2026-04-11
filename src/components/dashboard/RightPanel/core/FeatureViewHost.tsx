import React from "react";
import { WindowLayoutCard } from "./WindowLayoutCard";
import { OverlayTextPanel } from "../panels/OverlayTextPanel";
import { FeatureTimerView } from "../features/timer/FeatureTimerView";
import type { FeatureView, WindowLayoutCardProps } from "../types";

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
