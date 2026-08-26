import React from "react";
import { type WindowInfo } from "../../picker/WindowPicker";

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
      className="w-full h-full grid grid-cols-2 grid-rows-2 bg-black"
      style={{ gap: "4px" }}
    >
      {/* Slot 1: Top-Left (Top) */}
      {windows[0] &&
        renderWindow(windows[0], {
          width: "100%",
          height: "100%",
        })}

      {/* Slot 2: Top-Right */}
      {windows[1] &&
        renderWindow(windows[1], {
          width: "100%",
          height: "100%",
        })}

      {/* Slot 3: Bottom-Left (Down) */}
      {windows[2] &&
        renderWindow(windows[2], {
          width: "100%",
          height: "100%",
        })}

      {/* Slot 4: Bottom-Right (Empty black placeholder with matching border) */}
      <div className="w-full h-full bg-black border border-solid border-neutral-800/80" />
    </div>
  );
};
