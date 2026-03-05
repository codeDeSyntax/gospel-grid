import React from "react";
import { WindowInfo } from "../../WindowList";

interface DualWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo];
  windowDimensions?: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties,
  ) => React.ReactNode;
}

export const DualWindowLayoutLive: React.FC<DualWindowLayoutLiveProps> = ({
  windows,
  renderWindow,
}) => {
  return (
    <div className="w-full h-full grid grid-cols-2" style={{ gap: "2px" }}>
      {windows[0] &&
        renderWindow(windows[0], {
          width: "100%",
          height: "100%",
        })}
      {windows[1] &&
        renderWindow(windows[1], {
          width: "100%",
          height: "100%",
        })}
    </div>
  );
};
