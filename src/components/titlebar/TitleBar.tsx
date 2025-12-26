import React from "react";
import { useWindowControls } from "../../hooks/useWindowControls";

export const TitleBar: React.FC = () => {
  const { isMaximized, minimize, maximize, close } = useWindowControls();

  return (
    <div className="flex items-center justify-between h-8 bg-surface-primary border-b border-border-primary select-none">
      {/* App title and logo */}
      <div className="flex items-center gap-2 px-4">
        <div className="w-4 h-4 rounded bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
          <span className="text-[10px] text-white">⛪</span>
        </div>
        <span className="text-sm font-medium text-text-primary">wingrid</span>
      </div>

      {/* Drag region */}
      <div
        className="flex-1 h-full"
        style={{ WebkitAppRegion: "drag" } as any}
      />

      {/* Window controls */}
      <div className="flex items-center">
        {/* Minimize button */}
        <button
          onClick={minimize}
          className="flex items-center justify-center w-12 h-8 hover:bg-surface-secondary transition-colors duration-200 group"
          title="Minimize"
        >
          <svg
            className="w-3 h-3 text-text-secondary group-hover:text-text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        {/* Maximize/Restore button */}
        <button
          onClick={maximize}
          className="flex items-center justify-center w-12 h-8 hover:bg-surface-secondary transition-colors duration-200 group"
          title={isMaximized ? "Restore" : "Maximize"}
        >
          {isMaximized ? (
            <svg
              className="w-3 h-3 text-text-secondary group-hover:text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m0 0l3 3m-3-3l-3 3m13 13v-4m0 0l-3-3m3 3l3-3M3 12h4m0 0l-3-3m3 3l-3 3m13-3h-4m0 0l3-3m-3 3l3 3"
              />
            </svg>
          ) : (
            <svg
              className="w-3 h-3 text-text-secondary group-hover:text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          )}
        </button>

        {/* Close button */}
        <button
          onClick={close}
          className="flex items-center justify-center w-12 h-8 hover:bg-red-500 hover:text-white transition-colors duration-200 group"
          title="Close"
        >
          <svg
            className="w-3 h-3 text-text-secondary group-hover:text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};
