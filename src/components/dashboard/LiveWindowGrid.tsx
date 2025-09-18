import React, { useEffect, useState, useRef, useCallback } from "react";
import { WindowInfo } from "./WindowList";
import { systemLogger } from "@/hooks/useSystemLogger";

interface LiveWindowGridProps {
  windows: WindowInfo[];
  className?: string;
}

interface LiveWindowThumbnail {
  windowId: string;
  dataUrl: string;
  timestamp: number;
}

export function LiveWindowGrid({
  windows,
  className = "",
}: LiveWindowGridProps) {
  const [thumbnails, setThumbnails] = useState<
    Record<string, LiveWindowThumbnail>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Limit to 4 windows and calculate perfect grid layout
  const displayWindows = windows.slice(0, 4);

  const gridConfig = useCallback(() => {
    const count = displayWindows.length;
    if (count === 0) return { type: "empty", windows: [] };
    if (count === 1) return { type: "single", windows: displayWindows };
    if (count === 2) return { type: "dual", windows: displayWindows };
    if (count === 3) return { type: "triple", windows: displayWindows };
    if (count === 4) return { type: "quad", windows: displayWindows };
    return { type: "quad", windows: displayWindows.slice(0, 4) };
  }, [displayWindows]);

  const { type, windows: gridWindows } = gridConfig();

  // Calculate perfect fit dimensions based on layout type
  const calculateDimensions = useCallback(() => {
    if (!containerRef.current) return { width: 800, height: 600 };

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 32; // Account for px-4 (16px * 2)
    const containerHeight = container.clientHeight - 48; // Account for pt-4 + pb-8 (16px + 32px)

    // Account for gaps (16px gap between items)
    const gap = 16;

    let availableWidth, availableHeight, windowWidth, windowHeight;

    switch (type) {
      case "single":
        // Full container minus padding
        windowWidth = containerWidth;
        windowHeight = containerHeight;
        break;
      case "dual":
        // Two windows side by side, centered - landscape format
        availableWidth = containerWidth - gap; // Gap between windows
        windowWidth = Math.max(Math.floor(availableWidth / 2), 300); // Ensure minimum width
        // Use 60% of container height for landscape feel, with minimum height
        windowHeight = Math.max(Math.floor(containerHeight * 0.6), 200);
        break;
      case "triple":
        // Two on top, one bottom-left
        availableWidth = containerWidth - gap; // Gap between top windows
        availableHeight = containerHeight - gap; // Gap between rows
        windowWidth = Math.floor(availableWidth / 2);
        windowHeight = Math.floor(availableHeight / 2);
        break;
      case "quad":
        // 2x2 grid
        availableWidth = containerWidth - gap; // Gap between columns
        availableHeight = containerHeight - gap; // Gap between rows
        windowWidth = Math.floor(availableWidth / 2);
        windowHeight = Math.floor(availableHeight / 2);
        break;
      default:
        windowWidth = containerWidth;
        windowHeight = containerHeight;
    }

    return { width: windowWidth, height: windowHeight };
  }, [type]);

  // Capture high-quality thumbnails
  const captureThumbnails = useCallback(async () => {
    if (gridWindows.length === 0) return;

    setIsLoading(true);
    const { width, height } = calculateDimensions();

    // Ensure minimum dimensions for dual layout
    const minWidth = 300;
    const minHeight = 200;

    // Calculate higher resolution for capture while maintaining aspect ratio
    const captureWidth = Math.max(Math.min(width * 1.5, 1200), minWidth);
    const captureHeight = Math.max(Math.min(height * 1.5, 800), minHeight);

    // Add specific debugging for dual layout
    if (type === "dual") {
      systemLogger.thumbnail(
        "dual-layout-debug",
        `DUAL LAYOUT DEBUG: gridWindows.length=${gridWindows.length}`,
        {
          gridWindowsLength: gridWindows.length,
          gridWindowsIds: gridWindows.map((w) => w.id),
          gridWindows0: gridWindows[0]
            ? { id: gridWindows[0].id, name: gridWindows[0].name }
            : null,
          gridWindows1: gridWindows[1]
            ? { id: gridWindows[1].id, name: gridWindows[1].name }
            : null,
          layoutType: type,
          dimensions: { width: captureWidth, height: captureHeight },
        }
      );
    }

    try {
      systemLogger.thumbnail(
        "batch-capture",
        `Capturing ${gridWindows.length} live windows (${type} layout)`,
        {
          dimensions: { width: captureWidth, height: captureHeight },
          originalDimensions: { width, height },
          layoutType: type,
          quality: 98,
        }
      );

      // Use batch capture for better performance with optimized settings
      const result = await window.electronAPI?.batchCaptureThumbnails?.(
        gridWindows.map((w) => w.id),
        {
          width: captureWidth,
          height: captureHeight,
          scaleFactor: 1.25, // Moderate scale for quality without excessive cropping
          quality: 98, // Very high quality for published view
          forceRefresh: true, // Always get fresh capture
        }
      );

      if (result?.success && result.thumbnails) {
        const newThumbnails: Record<string, LiveWindowThumbnail> = {};

        result.thumbnails.forEach((thumbnail: any, index: number) => {
          if (thumbnail && gridWindows[index]) {
            newThumbnails[gridWindows[index].id] = {
              windowId: gridWindows[index].id,
              dataUrl: thumbnail.dataUrl,
              timestamp: thumbnail.timestamp || Date.now(),
            };
          }
        });

        setThumbnails(newThumbnails);

        // Special debug logging for dual layout
        if (type === "dual") {
          systemLogger.thumbnail(
            "dual-success-debug",
            `DUAL SUCCESS: Set ${Object.keys(newThumbnails).length} thumbnails`,
            {
              newThumbnailsKeys: Object.keys(newThumbnails),
              newThumbnailsDetails: Object.values(newThumbnails).map((t) => ({
                windowId: t.windowId,
                hasDataUrl: !!t.dataUrl,
              })),
              gridWindowsIds: gridWindows.map((w) => w.id),
            }
          );
        }

        systemLogger.thumbnail(
          "batch-success",
          `Captured ${
            Object.keys(newThumbnails).length
          } thumbnails for ${type} layout`,
          {
            count: Object.keys(newThumbnails).length,
            dimensions: { width: captureWidth, height: captureHeight },
            layoutType: type,
            windowIds: gridWindows.map((w) => w.id),
          }
        );
      } else {
        systemLogger.thumbnail(
          "batch-failed",
          `Batch capture failed for ${type} layout`,
          {
            error: result?.error,
            layoutType: type,
            windowCount: gridWindows.length,
            windowIds: gridWindows.map((w) => w.id),
          }
        );

        // Clear any existing thumbnails on failure to avoid stale loading states
        setThumbnails({});
      }
    } catch (error) {
      systemLogger.thumbnail(
        "batch-error",
        `Capture error for ${type} layout: ${error}`,
        {
          error,
          layoutType: type,
          windowCount: gridWindows.length,
          windowIds: gridWindows.map((w) => w.id),
          dimensions: { width: captureWidth, height: captureHeight },
        }
      );

      // Clear thumbnails on error to prevent stuck loading states
      setThumbnails({});
    } finally {
      setIsLoading(false);
    }
  }, [gridWindows, calculateDimensions]);

  // Start live updates when component mounts
  useEffect(() => {
    // Initial capture
    captureThumbnails();

    // Set up live updates every 2 seconds for smooth "live" experience
    updateIntervalRef.current = setInterval(() => {
      captureThumbnails();
    }, 2000);

    // Safety timeout to clear loading state if it gets stuck
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 second timeout

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      clearTimeout(loadingTimeout);
    };
  }, [captureThumbnails]);

  // Recapture when window resizes
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => captureThumbnails(), 100); // Debounce
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [captureThumbnails]);

  if (gridWindows.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center h-full bg-black text-white`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <div className="text-2xl font-bold">No Windows Selected</div>
          <div className="text-lg opacity-75">
            Select windows to display in published layout
          </div>
        </div>
      </div>
    );
  }

  // Render window component
  const renderWindow = (
    window: WindowInfo,
    customStyle?: React.CSSProperties
  ) => {
    const thumbnail = thumbnails[window.id];

    // Debug logging for dual layout
    if (type === "dual") {
      systemLogger.thumbnail(
        "dual-render-debug",
        `DUAL RENDER: Window ${window.id}`,
        {
          windowId: window.id,
          windowName: window.name,
          hasThumbnail: !!thumbnail,
          thumbnailDataUrl: thumbnail?.dataUrl
            ? thumbnail.dataUrl.substring(0, 50) + "..."
            : null,
          isLoading,
          layoutType: type,
        }
      );
    }

    return (
      <div
        key={window.id}
        className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-400 shadow-lg flex items-center justify-center flex-shrink-0"
        style={{
          ...customStyle,
          boxSizing: "border-box",
          borderWidth: "3px",
          borderStyle: "solid",
          borderColor: "#60a5fa", // Blue-400
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(96, 165, 250, 0.3)",
        }}
      >
        {/* Window title overlay */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-1 text-xs font-medium z-10 flex items-center justify-between">
          <span className="truncate">{window.app}</span>
          <span className="text-blue-100 ml-2 flex-shrink-0">📺</span>
        </div>

        {/* Live thumbnail */}
        {thumbnail ? (
          <img
            src={thumbnail.dataUrl}
            alt={`${window.name} - ${window.app}`}
            className="w-full h-full object-contain bg-black"
            style={{
              imageRendering: "auto",
              filter: "contrast(1.3) brightness(1.5)",
              display: "block",
              marginTop: "28px", // Account for title bar
            }}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center text-gray-400 h-full"
            style={{ marginTop: "28px" }}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <div className="text-sm">Loading window...</div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">🖥️</div>
                <div className="text-sm text-center">
                  <div className="font-medium">{window.app}</div>
                  <div className="opacity-75">{window.name}</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render layout based on type
  const renderLayout = () => {
    const { width, height } = calculateDimensions();

    switch (type) {
      case "single":
        return (
          <div className="w-full h-full flex items-center justify-center">
            {renderWindow(gridWindows[0], {
              width: `${width}px`,
              height: `${height}px`,
            })}
          </div>
        );

      case "dual":
        return (
          <div
            className="w-full h-full flex justify-center items-center"
            style={{ gap: "16px" }}
          >
            {gridWindows[0] &&
              renderWindow(gridWindows[0], {
                width: `${width}px`,
                height: `${height}px`,
              })}
            {gridWindows[1] &&
              renderWindow(gridWindows[1], {
                width: `${width}px`,
                height: `${height}px`,
              })}
          </div>
        );

      case "triple":
        return (
          <div className="w-full h-full flex flex-col" style={{ gap: "16px" }}>
            {/* Top row - 2 windows */}
            <div
              className="flex"
              style={{ gap: "16px", height: `${height}px` }}
            >
              {renderWindow(gridWindows[0], {
                width: `${width}px`,
                height: `${height}px`,
              })}
              {renderWindow(gridWindows[1], {
                width: `${width}px`,
                height: `${height}px`,
              })}
            </div>
            {/* Bottom row - 1 window on the left */}
            <div className="flex" style={{ height: `${height}px` }}>
              {renderWindow(gridWindows[2], {
                width: `${width}px`,
                height: `${height}px`,
              })}
            </div>
          </div>
        );

      case "quad":
        return (
          <div className="w-full h-full flex flex-col" style={{ gap: "16px" }}>
            {/* Top row */}
            <div
              className="flex"
              style={{ gap: "16px", height: `${height}px` }}
            >
              {renderWindow(gridWindows[0], {
                width: `${width}px`,
                height: `${height}px`,
              })}
              {renderWindow(gridWindows[1], {
                width: `${width}px`,
                height: `${height}px`,
              })}
            </div>
            {/* Bottom row */}
            <div
              className="flex"
              style={{ gap: "16px", height: `${height}px` }}
            >
              {renderWindow(gridWindows[2], {
                width: `${width}px`,
                height: `${height}px`,
              })}
              {renderWindow(gridWindows[3], {
                width: `${width}px`,
                height: `${height}px`,
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      className={`${className} w-full h-full bg-black pt-4 px-4 pb-8`}
    >
      {renderLayout()}

      {/* Status indicator */}
      {isLoading && (
        <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          Updating...
        </div>
      )}
    </div>
  );
}
