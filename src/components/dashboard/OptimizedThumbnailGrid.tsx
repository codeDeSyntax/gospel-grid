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

  // Calculate grid dimensions based on container and number of windows
  const gridConfig = useMemo(() => {
    const count = windows.length;
    if (count === 0) return { cols: 0, rows: 0 };

    // Calculate optimal grid layout
    const aspectRatio = 16 / 9; // Assume 16:9 aspect ratio for thumbnails
    const sqrt = Math.sqrt(count);
    const cols = Math.ceil(sqrt * Math.sqrt(aspectRatio));
    const rows = Math.ceil(count / cols);

    return { cols, rows };
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
        width: 600,
        height: 400,
        scaleFactor: 1.5,
        quality: 95,
      };
    } else {
      return {
        width: 300,
        height: 200,
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
    <div
      className={`${className} grid gap-2 p-4`}
      style={{
        gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
        gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
      }}
    >
      {windows.map((window) => (
        <div
          key={window.id}
          className={`
            ${itemClassName}
            relative group cursor-pointer
            border-2 rounded-lg overflow-hidden
            transition-all duration-200
            ${
              window.isSelected
                ? "border-blue-500 shadow-lg scale-105"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }
            ${failedThumbnails.has(window.id) ? "opacity-50" : ""}
          `}
          onClick={(e) => handleWindowClick(window, e)}
          title={`${window.name} (${window.app})`}
        >
          {/* Thumbnail */}
          <div className="aspect-video relative">
            <LazyThumbnail
              windowId={window.id}
              title={window.name}
              className="w-full h-full"
              fallbackClassName="w-full h-full"
              options={getThumbnailOptions()}
              onLoad={(thumbnail) => handleThumbnailLoad(window.id, thumbnail)}
              onError={(error) => handleThumbnailError(window.id, error)}
              enabled={enableLazyLoading}
            />

            {/* Overlay with window info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
              <div className="p-2 text-white">
                <div className="text-xs font-medium truncate">{window.app}</div>
                <div className="text-xs opacity-75 truncate">{window.name}</div>
              </div>
            </div>

            {/* Selection indicator */}
            {window.isSelected && (
              <div className="absolute top-2 right-2">
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
                <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              )}
          </div>

          {/* Window state indicators */}
          <div className="absolute top-2 left-2 flex space-x-1">
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
      ))}
    </div>
  );
}

// Performance metrics component for monitoring
export function ThumbnailPerformanceMonitor() {
  const [cacheStats, setCacheStats] = useState<any>(null);

  const refreshStats = useCallback(async () => {
    try {
      const result = await window.electronAPI?.getCacheStats?.();
      if (result?.success) {
        setCacheStats(result.stats);
      }
    } catch (error) {
      console.error("Failed to get cache stats:", error);
    }
  }, []);

  React.useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [refreshStats]);

  const clearCache = useCallback(async () => {
    try {
      await window.electronAPI?.clearThumbnailCache?.();
      refreshStats();
    } catch (error) {
      console.error("Failed to clear cache:", error);
    }
  }, [refreshStats]);

  if (!cacheStats) return null;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">Cache Performance</span>
        <button
          onClick={clearCache}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Clear Cache
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>Hit Rate: {cacheStats.hitRate}%</div>
        <div>
          Size: {cacheStats.size.current}/{cacheStats.size.max}
        </div>
        <div>Hits: {cacheStats.hits}</div>
        <div>Misses: {cacheStats.misses}</div>
      </div>
    </div>
  );
}
