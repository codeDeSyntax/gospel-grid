import React from "react";
import { WindowInfo } from "../../WindowList";

interface TripleWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo, WindowInfo];
  windowDimensions: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export const TripleWindowLayoutLive: React.FC<TripleWindowLayoutLiveProps> = ({
  windows,
  windowDimensions,
  renderWindow,
}) => {
  const { width, height } = windowDimensions;

  return (
    <div
      className="w-full h-full flex flex-col justify-center items-center p-8"
      style={{ gap: "16px" }}
    >
      {/* Top row - 2 windows */}
      <div
        className="flex justify-center"
        style={{ gap: "16px", height: `${height}px` }}
      >
        {renderWindow(windows[0], {
          width: `${width}px`,
          height: `${height}px`,
        })}
        {renderWindow(windows[1], {
          width: `${width}px`,
          height: `${height}px`,
        })}
      </div>
      {/* Bottom row - 1 window on the left */}
      <div className="flex" style={{ height: `${height}px` }}>
        {renderWindow(windows[2], {
          width: `${width}px`,
          height: `${height}px`,
        })}
      </div>
    </div>
  );
};
