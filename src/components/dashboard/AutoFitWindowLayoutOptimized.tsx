import React, { useMemo, useRef } from "react";
import { OptimizedThumbnailGrid } from "./OptimizedThumbnailGrid";
import { WindowInfo } from "../dashboard/WindowList";
import { WindowLayoutSkeleton } from "./WindowLayoutSkeleton";

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
  const [isDragOver, setIsDragOver] = React.useState(false);

  // Debug: Log selectedWindows changes
  React.useEffect(() => {
    console.log(
      "🔍 AutoFitWindowLayout - selectedWindows:",
      selectedWindows.length,
      selectedWindows
    );
  }, [selectedWindows]);

  // Get display windows with limit
  const displayWindows = useMemo(() => {
    console.log(
      "🎯 displayWindows computed:",
      selectedWindows.slice(0, maxDisplayWindows).length
    );
    return selectedWindows.slice(0, maxDisplayWindows);
  }, [selectedWindows, maxDisplayWindows]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the container itself, not child elements
    const rect = containerRef.current?.getBoundingClientRect();
    if (
      rect &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    console.log("📦 Drop received");

    try {
      const dragDataStr = e.dataTransfer.getData("text/plain");
      console.log("📦 Drag data:", dragDataStr);

      const dragData = JSON.parse(dragDataStr);

      if (dragData.windowId && dragData.windowInfo) {
        const windowInfo = JSON.parse(dragData.windowInfo);
        console.log("✅ Adding window:", windowInfo.name);
        onWindowAdd?.(windowInfo);
      }
    } catch (error) {
      console.error("❌ Error parsing drop data:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[98%] m-auto h-[95%]  rounded-lg border transition-all duration-200 overflow-y-auto overflow-x-hidden relative ${
        isDragOver
          ? "border-theme-primary-400 border-2 border-dashed bg-theme-primary-500/10"
          : "border-gray-200 dark:border-gray-700"
      }`}
    >
      {/* Drag Over Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-theme-primary-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-theme-primary-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-medium">
            Drop window here to add to layout
          </div>
        </div>
      )}

      {displayWindows.length === 0 ? (
        <WindowLayoutSkeleton columns={2} rows={2} />
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
