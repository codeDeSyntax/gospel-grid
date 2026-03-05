import React from "react";
import { WindowInfo } from "../../WindowList";

interface TripleWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo, WindowInfo];
  windowDimensions?: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties,
  ) => React.ReactNode;
}

export const TripleWindowLayoutLive: React.FC<TripleWindowLayoutLiveProps> = ({
  windows,
  renderWindow,
}) => {
  return (
    <div
      className="w-full h-full grid grid-cols-2 grid-rows-2"
      style={{ gap: "2px" }}
    >
      {/* Top-left */}
      {renderWindow(windows[0], { width: "100%", height: "100%" })}
      {/* Top-right */}
      {renderWindow(windows[1], { width: "100%", height: "100%" })}
      {/* Bottom — spans full width, centered content */}
      <div className="col-span-2 flex justify-center">
        <div className="w-1/2 h-full">
          {renderWindow(windows[2], { width: "100%", height: "100%" })}
        </div>
      </div>
    </div>
  );
};
