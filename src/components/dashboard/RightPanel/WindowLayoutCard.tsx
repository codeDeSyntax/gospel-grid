import React from "react";
import { AutoFitWindowLayout } from "../AutoFitWindowLayoutOptimized";
import type { WindowLayoutCardProps } from "./types";

export const WindowLayoutCard: React.FC<WindowLayoutCardProps> = React.memo(
  ({
    selectedWindows,
    focusedWindowId,
    onWindowFocus,
    onWindowRemove,
    onWindowAdd,
    isProjectionOn = false,
  }) => {
    // Always render AutoFitWindowLayout so drop zone is always available
    return (
      <AutoFitWindowLayout
        selectedWindows={selectedWindows}
        focusedWindowId={focusedWindowId}
        onWindowFocus={onWindowFocus}
        onWindowRemove={onWindowRemove}
        onWindowAdd={onWindowAdd}
        maxDisplayWindows={4}
        isProjectionOn={isProjectionOn}
      />
    );
  },
);
