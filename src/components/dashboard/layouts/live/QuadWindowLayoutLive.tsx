import React from "react";
import { type WindowInfo } from "../../picker/WindowPicker";

interface QuadWindowLayoutLiveProps {
  windows: [WindowInfo, WindowInfo, WindowInfo, WindowInfo];
  windowDimensions?: { width: number; height: number };
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties,
  ) => React.ReactNode;
}

export const QuadWindowLayoutLive: React.FC<QuadWindowLayoutLiveProps> = ({
  windows,
  renderWindow,
}) => {
  return (
    <div
      className="w-full h-full grid grid-cols-2 grid-rows-2"
      style={{ gap: "2px" }}
    >
      {renderWindow(windows[0], { width: "100%", height: "100%" })}
      {renderWindow(windows[1], { width: "100%", height: "100%" })}
      {renderWindow(windows[2], { width: "100%", height: "100%" })}
      {renderWindow(windows[3], { width: "100%", height: "100%" })}
    </div>
  );
};
