import React from "react";
import { WindowInfo } from "../../WindowList";

interface QuadWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo, WindowInfo, WindowInfo];
  windowDimensions: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export const QuadWindowLayoutLive: React.FC<QuadWindowLayoutLiveProps> = ({
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
      {/* Top row */}
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
      {/* Bottom row */}
      <div
        className="flex justify-center"
        style={{ gap: "16px", height: `${height}px` }}
      >
        {renderWindow(windows[2], {
          width: `${width}px`,
          height: `${height}px`,
        })}
        {renderWindow(windows[3], {
          width: `${width}px`,
          height: `${height}px`,
        })}
      </div>
    </div>
  );
};
