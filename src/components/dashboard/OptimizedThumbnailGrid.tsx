import React, { useMemo, useState, useCallback } from "react";
import { LazyThumbnail } from "@/components/common/LazyThumbnail";
import { WindowInfo } from "@/components/dashboard/WindowList";
import { WindowThumbnail } from "@/hooks/useThumbnails";

interface OptimizedThumbnailGridProps {
  windows: WindowInfo[];
  onWindowSelect?: (windowId: string, selected: boolean) => void;
  onWindowFocus?: (windowId: string) => void;
  className?: string;
  itemClassName?: string;
  enableLazyLoading?: boolean;
  enableHighQuality?: boolean; // For published layouts
}

export function OptimizedThumbnailGrid({
  windows,
  onWindowSelect,
  onWindowFocus,
  className = "",
  itemClassName = "",
  enableLazyLoading = true,
  enableHighQuality = false,
}: OptimizedThumbnailGridProps) {
  const [loadedThumbnails, setLoadedThumbnails] = useState<
    Record<string, WindowThumbnail>
  >({});
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set()
  );

  // Calculate grid layout based on window count (matching LiveWindowGrid)
  const gridConfig = useMemo(() => {
    const count = Math.min(windows.length, 4); // Limit to 4 windows
    if (count === 0) return { type: "empty", gridStyle: {} };
    if (count === 1)
      return {
        type: "single",
        gridStyle: { gridTemplateColumns: "1fr", gridTemplateRows: "1fr" },
      };
    if (count === 2)
      return {
        type: "dual",
        gridStyle: { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr" },
      };
    if (count === 3)
      return {
        type: "triple",
        gridStyle: {
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gridTemplateAreas: '"top-left top-right" "bottom-left ."',
        },
      };
    if (count === 4)
      return {
        type: "quad",
        gridStyle: {
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        },
      };

    return {
      type: "quad",
      gridStyle: {
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
      },
    };
  }, [windows.length]);

  const handleThumbnailLoad = useCallback(
    (windowId: string, thumbnail: WindowThumbnail) => {
      setLoadedThumbnails((prev) => ({
        ...prev,
        [windowId]: thumbnail,
      }));
    },
    []
  );

  const handleThumbnailError = useCallback(
    (windowId: string, error: string) => {
      console.warn(`Thumbnail load failed for ${windowId}:`, error);
      setFailedThumbnails((prev) => new Set([...prev, windowId]));
    },
    []
  );

  const handleWindowClick = useCallback(
    (window: WindowInfo, event: React.MouseEvent) => {
      if (event.ctrlKey || event.metaKey) {
        // Multi-select with Ctrl/Cmd
        onWindowSelect?.(window.id, !window.isSelected);
      } else {
        // Single select or focus
        onWindowFocus?.(window.id);
      }
    },
    [onWindowSelect, onWindowFocus]
  );

  const getThumbnailOptions = useCallback(() => {
    if (enableHighQuality) {
      return {
        width: 400, // Reduced from 600
        height: 250, // Reduced from 400
        scaleFactor: 1.2, // Reduced from 1.5
        quality: 95,
      };
    } else {
      return {
        width: 240, // Reduced from 300
        height: 160, // Reduced from 200
        scaleFactor: 1.0,
        quality: 85,
      };
    }
  }, [enableHighQuality]);

  if (windows.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center min-h-[200px]`}
      >
        <p className="text-gray-500 dark:text-gray-400">No windows available</p>
      </div>
    );
  }

  return (
    <div className={`${className} `}>
      <div
        className="grid w-full h-full"
        style={{
          ...gridConfig.gridStyle,
          gap: "1rem",
        }}
      >
        {windows.slice(0, 4).map((window, index) => {
          // Special positioning for triple layout (3rd window goes bottom-left)
          const gridArea =
            gridConfig.type === "triple" && index === 2
              ? "bottom-left"
              : "auto";

          return (
            <div
              key={window.id}
              className={`
              ${itemClassName}
              relative group cursor-pointer
              border-2 rounded-lg overflow-hidden
              transition-all duration-200
              flex-shrink-0
              ${
                window.isSelected
                  ? "border-blue-500 shadow-lg scale-105"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }
              ${failedThumbnails.has(window.id) ? "opacity-50" : ""}
            `}
              style={{ gridArea }}
              onClick={(e) => handleWindowClick(window, e)}
              title={`${window.name} (${window.app})`}
            >
              {/* Thumbnail */}
              <div className="relative h-full w-full">
                <LazyThumbnail
                  windowId={window.id}
                  title={window.name}
                  className="w-full h-full object-cover"
                  fallbackClassName="w-full h-full"
                  options={getThumbnailOptions()}
                  onLoad={(thumbnail) =>
                    handleThumbnailLoad(window.id, thumbnail)
                  }
                  onError={(error) => handleThumbnailError(window.id, error)}
                  enabled={enableLazyLoading}
                />

                {/* Overlay with window info */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
                  <div className="p-1 text-white">
                    <div className="text-xs font-medium truncate">
                      {window.app}
                    </div>
                    <div className="text-xs opacity-75 truncate">
                      {window.name}
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                {window.isSelected && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Loading indicator */}
                {!loadedThumbnails[window.id] &&
                  !failedThumbnails.has(window.id) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    </div>
                  )}
              </div>

              {/* Window state indicators */}
              <div className="absolute top-1 left-1 flex space-x-1">
                {window.isMinimized && (
                  <span className="px-1 py-0.5 bg-yellow-500 text-white text-xs rounded">
                    MIN
                  </span>
                )}
                {window.isMaximized && (
                  <span className="px-1 py-0.5 bg-green-500 text-white text-xs rounded">
                    MAX
                  </span>
                )}
                {!window.isVisible && (
                  <span className="px-1 py-0.5 bg-gray-500 text-white text-xs rounded">
                    HID
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
