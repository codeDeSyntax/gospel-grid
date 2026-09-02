import React from "react";
import { WindowLayoutCard } from "./WindowLayoutCard";
import { OverlayTextPanel } from "./OverlayTextPanel";
import { FeatureTimerView } from "./FeatureTimerView";
import { FeatureCaptionsView } from "./FeatureCaptionsView";
import { RemoteScreensView } from "./RemoteScreensView";
import type { RemoteWebRtcController } from "@/hooks/useRemoteWebRtc";
import type { FeatureView, WindowLayoutCardProps, ContextIntelligenceProps } from "../RightPanel/types";

interface FeatureViewHostProps extends WindowLayoutCardProps {
  activeView: FeatureView;
  remoteWebRtc: RemoteWebRtcController;
  contextIntelligence?: ContextIntelligenceProps;
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
  remoteWebRtc,
  contextIntelligence,
}) => {
  if (activeView === "overlay") {
    return <OverlayTextPanel />;
  }

  if (activeView === "timer") {
    return <FeatureTimerView />;
  }

  if (activeView === "captions") {
    return <FeatureCaptionsView contextIntelligence={contextIntelligence} />;
  }

  if (activeView === "remote") {
    return <RemoteScreensView webRtc={remoteWebRtc} />;
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
