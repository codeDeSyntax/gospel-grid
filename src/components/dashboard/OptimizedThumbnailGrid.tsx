import React, { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowInfo } from "@/components/dashboard/WindowList";
import { WindowThumbnail } from "@/hooks/useThumbnails";
import { CosmicGridBackground } from "@/components/dashboard/CosmicGridBackground";

interface OptimizedThumbnailGridProps {
  windows: WindowInfo[];
  onWindowSelect?: (windowId: string, selected: boolean) => void;
  onWindowFocus?: (windowId: string) => void;
  onWindowDrop?: (windowInfo: WindowInfo) => void;
  className?: string;
  itemClassName?: string;
  enableLazyLoading?: boolean;
  enableHighQuality?: boolean; // For published layouts
}

export function OptimizedThumbnailGrid({
  windows,
  onWindowSelect,
  onWindowFocus,
  onWindowDrop,
  className = "",
  itemClassName = "",
  enableLazyLoading = true,
  enableHighQuality = false,
}: OptimizedThumbnailGridProps) {
  const [loadedThumbnails, setLoadedThumbnails] = useState<
    Record<string, WindowThumbnail>
  >({});
  // Clear failed thumbnails when windows change to prevent stale state
  const [failedThumbnails, setFailedThumbnails] = useState<Set<string>>(
    new Set()
  );
  const [isDragOver, setIsDragOver] = useState(false);

  // Clear stale thumbnail states when window list changes
  React.useEffect(() => {
    const currentWindowIds = new Set(windows.map((w) => w.id));

    // Clear loaded thumbnails for windows that no longer exist
    setLoadedThumbnails((prev) => {
      const filtered = Object.keys(prev).reduce((acc, windowId) => {
        if (currentWindowIds.has(windowId)) {
          acc[windowId] = prev[windowId];
        }
        return acc;
      }, {} as Record<string, WindowThumbnail>);
      return filtered;
    });

    // Clear failed thumbnails for windows that no longer exist
    setFailedThumbnails((prev) => {
      const filtered = new Set(
        [...prev].filter((windowId) => currentWindowIds.has(windowId))
      );
      return filtered;
    });
  }, [windows]);

  // Batch capture thumbnails when windows change
  React.useEffect(() => {
    const captureBatch = async () => {
      if (windows.length === 0) return;

      if (!window.electronAPI?.batchCaptureThumbnails) {
        return;
      }

      const windowIds = windows.map((w) => w.id);

      const options = enableHighQuality
        ? {
            width: 640,
            height: 360,
            scaleFactor: 1.5,
            quality: 95,
            forceRefresh: true,
          }
        : {
            width: 480,
            height: 270,
            scaleFactor: 1.2,
            quality: 85,
            forceRefresh: false,
          };

      try {
        const result = await window.electronAPI.batchCaptureThumbnails(
          windowIds,
          options
        );

        if (result && result.success && Array.isArray(result.thumbnails)) {
          const newThumbnails: Record<string, WindowThumbnail> = {};
          result.thumbnails.forEach((thumbnail: any) => {
            if (thumbnail && thumbnail.windowId) {
              newThumbnails[thumbnail.windowId] = thumbnail;
            }
          });
          setLoadedThumbnails(newThumbnails);
        }
      } catch (error) {
        console.error("[OptimizedThumbnailGrid] Batch capture failed:", error);
      }
    };

    captureBatch();
  }, [windows, enableHighQuality]);

  // Calculate grid layout using the same approach as LiveWindowGrid
  const gridConfig = useMemo(() => {
    const count = Math.min(windows.length, 4); // Limit to 4 windows
    if (count === 0) return { type: "empty", layout: "empty" };
    if (count === 1) return { type: "single", layout: "single" };
    if (count === 2) return { type: "dual", layout: "dual" };
    if (count === 3) return { type: "triple", layout: "triple" };
    if (count === 4) return { type: "quad", layout: "quad" };
    return { type: "quad", layout: "quad" };
  }, [windows.length]);

  // Calculate dimensions like LiveWindowGrid does
  const calculateDimensions = useCallback(() => {
    const containerWidth = 700; // Increased from 450 for bigger thumbnails
    const containerHeight = 500; // Increased from 300 for bigger thumbnails
    const gap = 12; // Increased gap for better spacing

    let windowWidth, windowHeight;

    switch (gridConfig.type) {
      case "single":
        windowWidth = containerWidth;
        windowHeight = Math.floor(containerWidth / 1.78); // 16:9 aspect ratio
        break;
      case "dual":
        windowWidth = containerWidth;
        windowHeight = Math.floor(containerWidth / 1.78); // Each window maintains 16:9
        break;
      case "triple":
      case "quad":
        const availableWidth = containerWidth - gap;
        windowWidth = Math.floor(availableWidth / 2);
        windowHeight = Math.floor(windowWidth / 1.78); // 16:9 aspect ratio
        break;
      default:
        windowWidth = containerWidth;
        windowHeight = Math.floor(containerWidth / 1.78);
    }

    return { width: windowWidth, height: windowHeight };
  }, [gridConfig.type]);

  const { width: windowWidth, height: windowHeight } = calculateDimensions();

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
        width: 640, // Higher resolution for better capture
        height: 360,
        scaleFactor: 1.5, // Better scaling for full content capture
        quality: 95,
        forceRefresh: true, // Ensure fresh captures
      };
    } else {
      return {
        width: 480, // Higher resolution for normal quality too
        height: 270,
        scaleFactor: 1.2, // Better scaling
        quality: 90, // Higher quality
        forceRefresh: false,
      };
    }
  }, [enableHighQuality]);

  // Render single window with framer motion animations
  const renderWindow = useCallback(
    (window: WindowInfo, customStyle: React.CSSProperties = {}) => {
      return (
        <motion.div
          key={`window-${window.id}`} // Ensure unique keys
          className={`
          ${itemClassName}
          relative group cursor-pointer border-1 border-dashed border-primary-600
          border-2 rounded-lg overflow-hidden
          transition-all duration-200
          ${
            window.isSelected
              ? "border-theme-primary-500 scale-105"
              : "border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500"
          }
          ${failedThumbnails.has(window.id) ? "opacity-50" : ""}
        `}
          style={customStyle}
          onClick={(e) => handleWindowClick(window, e)}
          title={`${window.name} (${window.app})`}
          initial={{
            opacity: 0,
            scale: 0.8,
            y: 20,
            filter: "blur(4px)",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            filter: "blur(0px)",
          }}
          exit={{
            opacity: 0,
            scale: 0.9,
            y: -10,
            filter: "blur(2px)",
          }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            opacity: { duration: 0.3 },
            filter: { duration: 0.2 },
          }}
          whileHover={{
            scale: 1.02,
            transition: { duration: 0.2 },
          }}
        >
          {/* Thumbnail - Direct rendering from batch capture */}
          {loadedThumbnails[window.id] ? (
            <img
              src={loadedThumbnails[window.id].dataUrl}
              alt={window.name}
              className="w-full h-full object-cover"
              style={{ filter: "none" }}
            />
          ) : failedThumbnails.has(window.id) ? (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <div className="text-xs text-gray-500">Failed to load</div>
            </div>
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <div className="animate-pulse text-xs text-gray-500">
                Loading...
              </div>
            </div>
          )}

          {/* Overlay with window info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent">
            <div className="p-1 text-white">
              <div className="text-xs font-medium truncate">{window.app}</div>
              <div className="text-xs opacity-75 truncate">{window.name}</div>
            </div>
          </div>

          {/* Selection indicator */}
          {window.isSelected && (
            <div className="absolute top-1 right-1">
              <div className="w-4 h-4 bg-theme-primary-500 rounded-full flex items-center justify-center">
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
          {!loadedThumbnails[window.id] && !failedThumbnails.has(window.id) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-theme-primary-500"></div>
            </div>
          )}

          {/* Window state indicators */}
          <div className="absolute top-1 left-1 flex space-x-1">
            {window.isMinimized && (
              <span className="px-1 py-0.5 bg-yellow-500 text-white text-xs rounded">
                MIN
              </span>
            )}
            {window.isMaximized && (
              <span className="px-1 py-0.5 bg-emerald-500 text-white text-xs rounded">
                MAX
              </span>
            )}
            {!window.isVisible && (
              <span className="px-1 py-0.5 bg-stone-500 text-white text-xs rounded">
                HID
              </span>
            )}
          </div>
        </motion.div>
      );
    },
    [itemClassName, loadedThumbnails, failedThumbnails, handleWindowClick]
  );

  // Render layout based on type (like LiveWindowGrid)
  const renderLayout = () => {
    // Ensure we only work with first 4 windows to prevent duplication
    const displayWindows = windows.slice(0, 4);

    const windowStyle = {
      width: `${windowWidth}px`,
      height: `${windowHeight}px`,
    };

    switch (gridConfig.type) {
      case "single":
        return (
          <div className="w-[80%] h-full flex items-center justify-center">
            <AnimatePresence mode="wait">
              {displayWindows[0] &&
                renderWindow(displayWindows[0], windowStyle)}
            </AnimatePresence>
          </div>
        );

      case "dual":
        return (
          <div
            className="w-[80%] h-full flex flex-col items-center justify-center"
            style={{ gap: "12px" }}
          >
            <AnimatePresence mode="wait">
              {displayWindows[0] &&
                renderWindow(displayWindows[0], windowStyle)}
              {displayWindows[1] &&
                renderWindow(displayWindows[1], windowStyle)}
            </AnimatePresence>
          </div>
        );

      case "triple":
        return (
          <div
            className="w-full h-full flex flex-col justify-center items-center"
            style={{ gap: "12px" }}
          >
            <AnimatePresence>
              <div key="triple-layout" className="contents">
                {/* Top row - 2 windows */}
                <div
                  key="triple-top-row"
                  className="flex"
                  style={{ gap: "12px" }}
                >
                  {displayWindows[0] &&
                    renderWindow(displayWindows[0], windowStyle)}
                  {displayWindows[1] &&
                    renderWindow(displayWindows[1], windowStyle)}
                </div>
                {/* Bottom row - 1 window positioned left */}
                <div
                  key="triple-bottom-row"
                  className="flex"
                  style={{ width: `${windowWidth * 2 + 12}px` }}
                >
                  {displayWindows[2] &&
                    renderWindow(displayWindows[2], windowStyle)}
                </div>
              </div>
            </AnimatePresence>
          </div>
        );

      case "quad":
        return (
          <div
            className="w-full h-full flex flex-col justify-center"
            style={{ gap: "12px" }}
          >
            <AnimatePresence>
              <div key="quad-layout" className="contents">
                {/* Top row */}
                <div
                  key="quad-top-row"
                  className="flex justify-center"
                  style={{ gap: "12px" }}
                >
                  {displayWindows[0] &&
                    renderWindow(displayWindows[0], windowStyle)}
                  {displayWindows[1] &&
                    renderWindow(displayWindows[1], windowStyle)}
                </div>
                {/* Bottom row */}
                <div
                  key="quad-bottom-row"
                  className="flex justify-center"
                  style={{ gap: "12px" }}
                >
                  {displayWindows[2] &&
                    renderWindow(displayWindows[2], windowStyle)}
                  {displayWindows[3] &&
                    renderWindow(displayWindows[3], windowStyle)}
                </div>
              </div>
            </AnimatePresence>
          </div>
        );

      default:
        return (
          <div className="text-center text-stone-500">
            No windows to display
          </div>
        );
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only hide drag over when leaving the main container, not child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const dragDataStr = e.dataTransfer.getData("text/plain");
        const dragData = JSON.parse(dragDataStr);

        if (dragData.windowId && dragData.windowInfo) {
          const windowInfo = JSON.parse(dragData.windowInfo);
          onWindowDrop?.(windowInfo);
        }
      } catch (error) {
        console.error("Error parsing drop data:", error);
      }
    },
    [onWindowDrop]
  );

  if (windows.length === 0) {
    return (
      <CosmicGridBackground
        className={`${className} flex items-center justify-center min-h-[200px] border-2 border-dashed transition-colors duration-200 ${
          isDragOver
            ? "border-theme-primary-400 bg-theme-primary-500/10"
            : "border-stone-600/30"
        }`}
      >
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="w-full h-full flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-stone-500 dark:text-stone-400 mb-2">
              {isDragOver
                ? "Drop window here to add to layout"
                : "No windows in layout"}
            </p>
            <p className="text-sm text-stone-600 dark:text-stone-500">
              Drag windows from the left panel to add them
            </p>
          </div>
        </div>
      </CosmicGridBackground>
    );
  }

  return (
    <CosmicGridBackground
      className={`${className} overflow-hidden transition-all duration-200 ${
        isDragOver ? "ring-2 ring-theme-primary-400 ring-opacity-50" : ""
      }`}
    >
      <div
        className="w-full h-full"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 bg-theme-primary-500/10 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="text-theme-primary-400 text-lg font-medium">
              Drop window to add to layout
            </div>
          </div>
        )}
        <div className="w-full h-full overflow-hidden scrollbar-hide p-2 relative z-[1]">
          {renderLayout()}
        </div>
      </div>
    </CosmicGridBackground>
  );
}
