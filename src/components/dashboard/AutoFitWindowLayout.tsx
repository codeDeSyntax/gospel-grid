import React, { useMemo, useRef, useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  cleanWindowTitle,
  calculateGridLayout,
  calculateWindowCardSize,
} from "../../utils/windowUtils";
import { WindowInfo } from "../dashboard/WindowList";
import { useThumbnails } from "../../hooks/useThumbnails";

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
  maxDisplayWindows = 25, // Allow up to 25 windows
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: 400,
    height: 300,
  });

  // Update container size when component mounts or resizes
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Get window IDs for thumbnail capture
  const windowIds = useMemo(() => {
    const displayWindows = selectedWindows.slice(0, maxDisplayWindows);
    return displayWindows.map((window) => window.id);
  }, [selectedWindows, maxDisplayWindows]);

  // Use thumbnail hook to capture live window previews
  const { thumbnails, loading: thumbnailsLoading } = useThumbnails(windowIds, {
    width: 1200,
    height: 900,
    scaleFactor: 2.0,
    quality: 95,
    refreshInterval: 3000, // Refresh every 3 seconds
    autoRefresh: true,
  });

  // Calculate layout and sizing
  const layoutInfo = useMemo(() => {
    const displayWindows = selectedWindows.slice(0, maxDisplayWindows);
    const windowCount = displayWindows.length;

    if (windowCount === 0) {
      return null;
    }

    const gridLayout = calculateGridLayout(windowCount);
    const cardSize = calculateWindowCardSize(
      containerSize.width,
      containerSize.height,
      windowCount
    );

    return {
      windows: displayWindows,
      gridLayout,
      cardSize,
    };
  }, [selectedWindows, containerSize, maxDisplayWindows]);

  // Clean window titles
  const cleanedWindows = useMemo(() => {
    if (!layoutInfo) return [];

    // Calculate title length based on card width
    const maxTitleLength =
      layoutInfo.cardSize.width < 80
        ? 8
        : layoutInfo.cardSize.width < 120
        ? 12
        : 20;

    return layoutInfo.windows.map((window) => ({
      ...window,
      cleanName: cleanWindowTitle(window.name, window.app, maxTitleLength),
    }));
  }, [layoutInfo]);

  if (!layoutInfo || selectedWindows.length === 0) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center h-full text-slate-400 text-center"
      >
        <div>
          <div className="text-4xl mb-2">📱</div>
          <div>No windows selected</div>
          <div className="text-sm">
            Click on windows in the sidebar to add them to the layout
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <div
        className={`grid gap-2 h-full w-full ${layoutInfo.gridLayout.className}`}
        style={{
          gridTemplateRows: `repeat(${layoutInfo.gridLayout.rows}, minmax(60px, 1fr))`,
          gridTemplateColumns: `repeat(${layoutInfo.gridLayout.cols}, 1fr)`,
          maxHeight: "100%",
          maxWidth: "100%",
          alignContent: "start", // Align grid content to the top
        }}
      >
        {cleanedWindows.map((window) => (
          <div
            key={window.id}
            className={`cursor-pointer transition-all hover:scale-105 relative group overflow-hidden rounded ${
              focusedWindowId === window.id
                ? "ring-2 ring-primary-400/80 shadow-lg shadow-primary-400/30"
                : ""
            }`}
            onClick={() => onWindowFocus(window.id)}
            style={{
              minHeight: "60px",
              maxHeight: "100%",
              minWidth: "80px",
              maxWidth: "100%",
            }}
          >
            {/* Remove button - only visible on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWindowRemove(window.id);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-600/90 text-white rounded-full p-1 text-xs z-20"
              title="Remove from layout"
            >
              <X size={10} />
            </button>

            {/* Live thumbnail preview - full container */}
            {thumbnails[window.id] ? (
              <div className="w-full h-full relative">
                <img
                  src={thumbnails[window.id].dataUrl}
                  alt={`${window.name} preview`}
                  className="w-full h-full object-cover rounded"
                  style={{
                    imageRendering: "auto",
                    filter: "none",
                    transform: "translateZ(0)", // GPU acceleration
                  }}
                />

                {/* Window name overlay directly on the thumbnail */}
                <div className="absolute top-2 left-2 right-2">
                  <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-medium truncate">
                    {window.cleanName}
                  </div>
                </div>

                {/* Window state indicators in top right */}
                {(window.isMinimized ||
                  window.isMaximized ||
                  !window.isVisible) && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    {window.isMinimized && (
                      <span className="text-xs bg-yellow-500/80 text-yellow-100 px-1 rounded">
                        MIN
                      </span>
                    )}
                    {window.isMaximized && (
                      <span className="text-xs bg-green-500/80 text-green-100 px-1 rounded">
                        MAX
                      </span>
                    )}
                    {!window.isVisible && (
                      <span className="text-xs bg-gray-500/80 text-gray-100 px-1 rounded">
                        HID
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded">
                <div className="text-center">
                  <div className="text-slate-400 text-xs mb-1">
                    {thumbnailsLoading ? "Loading..." : "No preview"}
                  </div>
                  <div className="text-white text-xs font-medium px-2">
                    {window.cleanName}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show overflow indicator if there are more windows */}
      {selectedWindows.length > maxDisplayWindows && (
        <div className="absolute bottom-2 right-2 bg-primary-600/80 text-white text-xs px-2 py-1 rounded-full">
          +{selectedWindows.length - maxDisplayWindows} more
        </div>
      )}
    </div>
  );
};
