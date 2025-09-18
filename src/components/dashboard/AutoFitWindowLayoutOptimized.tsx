import React, { useMemo, useRef } from "react";
import {
  OptimizedThumbnailGrid,
  ThumbnailPerformanceMonitor,
} from "./OptimizedThumbnailGrid";
import { WindowInfo } from "../dashboard/WindowList";

interface AutoFitWindowLayoutProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  maxDisplayWindows?: number;
}

export const AutoFitWindowLayout: React.FC<AutoFitWindowLayoutProps> = ({
  selectedWindows,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
  maxDisplayWindows = 25,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get display windows with limit
  const displayWindows = useMemo(() => {
    return selectedWindows.slice(0, maxDisplayWindows);
  }, [selectedWindows, maxDisplayWindows]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative"
    >
      {displayWindows.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center">
          <div>
            <div className="text-4xl mb-4">📱</div>
            <div className="text-lg">No windows selected</div>
            <div className="text-sm">
              Select windows from the list to preview them here
            </div>
          </div>
        </div>
      ) : (
        <>
          <OptimizedThumbnailGrid
            windows={displayWindows}
            onWindowSelect={(windowId, selected) => {
              if (!selected) {
                onWindowRemove(windowId);
              }
            }}
            onWindowFocus={onWindowFocus}
            className="w-full h-full p-2"
            itemClassName="min-h-[120px]"
            enableLazyLoading={true}
            enableHighQuality={false}
          />

          {/* Performance monitoring in development */}
          {process.env.NODE_ENV === "development" && (
            <div className="absolute top-2 right-2 z-10">
              <ThumbnailPerformanceMonitor />
            </div>
          )}

          {/* Window count indicator */}
          {selectedWindows.length > maxDisplayWindows && (
            <div className="absolute bottom-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs">
              Showing {maxDisplayWindows} of {selectedWindows.length} windows
            </div>
          )}
        </>
      )}
    </div>
  );
};
