import React from "react";
import { WindowInfo } from "../../WindowList";

interface DualWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo];
  windowDimensions: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export const DualWindowLayoutLive: React.FC<DualWindowLayoutLiveProps> = ({
  windows,
  windowDimensions,
  renderWindow,
}) => {
  const { width, height } = windowDimensions;

  return (
    <div
      className="w-full h-full flex justify-center items-center p-8"
      style={{ gap: "16px" }}
    >
      {windows[0] &&
        renderWindow(windows[0], {
          width: `${width}px`,
          height: `${height}px`,
        })}
      {windows[1] &&
        renderWindow(windows[1], {
          width: `${width}px`,
          height: `${height}px`,
        })}
    </div>
  );
};
