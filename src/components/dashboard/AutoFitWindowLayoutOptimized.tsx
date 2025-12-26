import React, { useMemo, useRef } from "react";
import { OptimizedThumbnailGrid } from "./OptimizedThumbnailGrid";
import { WindowInfo } from "../dashboard/WindowList";

/**
 * PERFORMANCE OPTIMIZATION:
 * This preview component shows thumbnails for SELECTED windows only (max 4).
 * Thumbnails use lazy loading via LazyThumbnail component (loads when visible).
 * This is intentional - users need to see what they selected before publishing.
 */

interface AutoFitWindowLayoutProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd?: (window: WindowInfo) => void;
  maxDisplayWindows?: number;
}

export const AutoFitWindowLayout: React.FC<AutoFitWindowLayoutProps> = ({
  selectedWindows,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  maxDisplayWindows = 4, // Changed from 25 to 4
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Get display windows with limit
  const displayWindows = useMemo(() => {
    return selectedWindows.slice(0, maxDisplayWindows);
  }, [selectedWindows, maxDisplayWindows]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700 overflow-y-auto overflow-x-hidden relative"
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
            onWindowDrop={onWindowAdd}
            className="w-full h-full "
            itemClassName=""
            enableLazyLoading={true}
            enableHighQuality={true}
          />

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
