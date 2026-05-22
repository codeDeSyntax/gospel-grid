import React from "react";
import { PreviewLayout } from "../preview/PreviewLayout";
import type { WindowLayoutCardProps } from "../RightPanel/types";

export const WindowLayoutCard: React.FC<WindowLayoutCardProps> = React.memo(
  ({
    windows,
    currentLayout,
    focusedWindowId,
    onWindowFocus,
    onWindowRemove,
    onWindowAdd,
    isProjectionOn = false,
  }) => {
    // Always render the preview layout so the drop zone is always available
    return (
      <PreviewLayout
        windows={windows}
        currentLayout={currentLayout}
        focusedWindowId={focusedWindowId}
        onWindowFocus={onWindowFocus}
        onWindowRemove={onWindowRemove}
        onWindowAdd={onWindowAdd}
        isProjectionOn={isProjectionOn}
      />
    );
  },
);
