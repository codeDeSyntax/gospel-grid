import React from "react";
import { WindowInfo } from "../../WindowList";

interface SingleWindowLayoutLiveProps {
  window: WindowInfo;
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties,
  ) => React.ReactNode;
}

export const SingleWindowLayoutLive: React.FC<SingleWindowLayoutLiveProps> = ({
  window,
  renderWindow,
}) => {
  return (
    <div className="w-full h-full">
      {renderWindow(window, {
        width: "100%",
        height: "100%",
      })}
    </div>
  );
};
