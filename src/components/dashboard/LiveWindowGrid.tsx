import React, { useEffect, useState, useRef, useCallback } from "react";
import { WindowInfo } from "./WindowList";
import { systemLogger } from "@/hooks/useSystemLogger";
import { useAppSelector } from "@/store/hooks";
import { WindowLayoutSkeleton } from "./WindowLayoutSkeleton";
import { SingleWindowLayoutLive } from "./layouts/live/SingleWindowLayoutLive";
import { DualWindowLayoutLive } from "./layouts/live/DualWindowLayoutLive";
import { TripleWindowLayoutLive } from "./layouts/live/TripleWindowLayoutLive";
import { QuadWindowLayoutLive } from "./layouts/live/QuadWindowLayoutLive";

/**
 * PERFORMANCE OPTIMIZATION:
 * This component ONLY captures thumbnails for windows in the published layout.
 * It does NOT pre-fetch or cache thumbnails for all windows.
 * Thumbnails are captured on-demand when the layout is published.
 */

interface LiveWindowGridProps {
  windows: WindowInfo[];
  className?: string;
  layoutId?: string;
}

interface LiveWindowThumbnail {
  windowId: string;
  dataUrl: string;
  timestamp: number;
}

export function LiveWindowGrid({
  windows,
  className = "",
  layoutId,
}: LiveWindowGridProps) {
  const publishedQuality = useAppSelector(
    (state) => state.app.publishedQuality
  );
  const captureQuality = useAppSelector((state) => state.app.captureQuality);

  console.log(
    "LiveWindowGrid RENDER - contrast:",
    publishedQuality.contrast,
    "brightness:",
    publishedQuality.brightness,
    "quality:",
    captureQuality
  );

  const [thumbnails, setThumbnails] = useState<
    Record<string, LiveWindowThumbnail>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastCaptureRef = useRef<number>(0);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    const containerWidth = container.clientWidth; // Full width for single window
    const containerHeight = container.clientHeight; // Full height for single window

    // Account for gaps (16px gap between items)
    const gap = 16;

    let availableWidth, availableHeight, windowWidth, windowHeight;

    switch (type) {
      case "single":
        // Full screen - no padding or margins
        windowWidth = containerWidth;
        windowHeight = containerHeight;
        break;
      case "dual":
        // Two windows side by side, centered - landscape format
        const containerWidthDual = container.clientWidth - 32; // Account for px-4 (16px * 2)
        const containerHeightDual = container.clientHeight - 10; // Account for pt-4 + pb-8 (16px + 32px)
        availableWidth = containerWidthDual - gap; // Gap between windows
        windowWidth = Math.max(Math.floor(availableWidth / 2), 300); // Ensure minimum width
        // Use 60% of container height for landscape feel, with minimum height
        windowHeight = Math.max(Math.floor(containerHeightDual * 0.6), 200);
        break;
      case "triple":
        // Two on top, one bottom-left
        const containerWidthTriple = container.clientWidth - 32; // Account for px-4 (16px * 2)
        const containerHeightTriple = container.clientHeight - 10; // Account for pt-4 + pb-8 (16px + 32px)
        availableWidth = containerWidthTriple - gap; // Gap between top windows
        availableHeight = containerHeightTriple - gap; // Gap between rows
        windowWidth = Math.floor(availableWidth / 2);
        windowHeight = Math.floor(availableHeight / 2);
        break;
      case "quad":
        // 2x2 grid
        const containerWidthQuad = container.clientWidth - 32; // Account for px-4 (16px * 2)
        const containerHeightQuad = container.clientHeight - 10; // Account for pt-4 + pb-8 (16px + 32px)
        availableWidth = containerWidthQuad - gap; // Gap between columns
        availableHeight = containerHeightQuad - gap; // Gap between rows
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

    // Calculate resolution for capture - balanced for quality and smoothness
    const baseScale = 1.8; // Higher scale for better quality
    const maxCaptureWidth = 1600; // Higher resolution for quality
    const maxCaptureHeight = 900;

    const captureWidth = Math.max(
      Math.min(width * baseScale, maxCaptureWidth),
      minWidth * 1.5 // Ensure minimum quality
    );
    const captureHeight = Math.max(
      Math.min(height * baseScale, maxCaptureHeight),
      minHeight * 1.5
    );

    // Dynamic quality based on layout type - uses user setting from Redux
    // Base quality comes from settings slider (50-100%)
    // Then apply reduction based on window count for performance
    const qualityReduction: Record<string, number> = {
      single: 0, // No reduction for single window
      dual: 5, // -5% for dual
      triple: 10, // -10% for triple
      quad: 15, // -15% for quad
    };

    const reduction = qualityReduction[type] || 15;
    const adjustedQuality = Math.max(50, captureQuality - reduction);

    const qualitySettings: Record<
      string,
      { quality: number; scaleFactor: number }
    > = {
      single: { quality: captureQuality, scaleFactor: 1.0 },
      dual: { quality: Math.max(50, captureQuality - 5), scaleFactor: 0.9 },
      triple: { quality: Math.max(50, captureQuality - 10), scaleFactor: 0.85 },
      quad: { quality: Math.max(50, captureQuality - 15), scaleFactor: 0.8 },
    };

    const currentQuality = qualitySettings[type] || qualitySettings.quad;

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
        `Capturing ${gridWindows.length} live windows (${type} layout) with enhanced quality`,
        {
          dimensions: { width: captureWidth, height: captureHeight },
          originalDimensions: { width, height },
          layoutType: type,
          quality: currentQuality.quality,
          scaleFactor: currentQuality.scaleFactor,
        }
      );

      // Use batch capture for better performance with optimized settings
      const result = await window.electronAPI?.batchCaptureThumbnails?.(
        gridWindows.map((w) => w.id),
        {
          width: captureWidth,
          height: captureHeight,
          scaleFactor: currentQuality.scaleFactor,
          quality: currentQuality.quality,
          forceRefresh: true, // Always get fresh capture for live streaming
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
  }, [gridWindows, calculateDimensions, type, captureQuality]);

  // Performance-aware update intervals based on window count and layout
  const getOptimalUpdateInterval = useCallback(() => {
    // Balanced intervals for smooth streaming with high quality (16-33ms = 30-60fps)
    const baseInterval = 33; // 33ms = ~30fps

    // Adjust based on layout complexity and window count
    switch (type) {
      case "single":
        return 16; // 16ms = 60fps for single window
      case "dual":
        return 20; // 20ms = 50fps for dual
      case "triple":
        return 25; // 25ms = 40fps for triple
      case "quad":
        return 33; // 33ms = 30fps for quad
      default:
        return baseInterval;
    }
  }, [type]);

  // RAF-based update loop for better performance than setInterval
  const tick = useCallback(
    (timestamp: number) => {
      const interval = getOptimalUpdateInterval();

      if (timestamp - lastCaptureRef.current >= interval) {
        captureThumbnails();
        lastCaptureRef.current = timestamp;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    },
    [captureThumbnails, getOptimalUpdateInterval]
  );

  // Start live updates when component mounts
  useEffect(() => {
    // If this grid is part of a published layout, the main process
    // will drive captures and broadcast via IPC. Skip local capture loop.
    if (layoutId) return;

    const updateInterval = getOptimalUpdateInterval();

    systemLogger.thumbnail(
      "performance-config",
      `Configured ${type} layout with ${updateInterval}ms update interval (RAF-based)`,
      {
        layoutType: type,
        windowCount: gridWindows.length,
        updateInterval,
        estimatedLoad:
          type === "quad" ? "high" : type === "triple" ? "medium" : "low",
      }
    );

    // Initial capture
    captureThumbnails();
    lastCaptureRef.current = performance.now();

    // Start RAF loop
    animationFrameRef.current = requestAnimationFrame(tick);

    // Safety timeout to clear loading state if it gets stuck
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 second timeout

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearTimeout(loadingTimeout);
    };
  }, [
    tick,
    captureThumbnails,
    type,
    gridWindows.length,
    getOptimalUpdateInterval,
    layoutId,
  ]);

  // Recapture when window resizes with proper debounce
  useEffect(() => {
    // If published, main process drives captures - skip local resize-triggered captures
    if (layoutId) return;

    const handleResize = () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        captureThumbnails();
      }, 250); // Increased debounce for better performance
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [captureThumbnails]);

  // Immediate capture when quality settings change
  useEffect(() => {
    // Skip if layoutId is present (main process handles captures)
    if (layoutId) return;

    // Trigger immediate capture when captureQuality changes
    // This ensures instant visual feedback when user adjusts quality slider
    captureThumbnails();

    systemLogger.thumbnail(
      "quality-change",
      `Capture quality changed to ${captureQuality}% - triggering immediate capture`,
      {
        captureQuality,
        layoutType: type,
        windowCount: gridWindows.length,
      }
    );
  }, [captureQuality, layoutId]); // Only depend on captureQuality to avoid infinite loops

  // Subscription to published thumbnails (main process broadcast)
  useEffect(() => {
    if (!layoutId) return;

    // Subscribe to both published and main window thumbnails for synchronized real-time view
    const offPublished = (window as any).electronAPI?.onPublishedThumbnails?.(
      (payload: any) => {
        try {
          if (!payload || payload.layoutId !== layoutId) return;

          const mapped: Record<string, LiveWindowThumbnail> = {};
          (payload.thumbnails || []).forEach((t: any) => {
            if (t && t.windowId && t.dataUrl) {
              mapped[t.windowId] = {
                windowId: t.windowId,
                dataUrl: t.dataUrl,
                timestamp: t.timestamp || Date.now(),
              };
            }
          });

          setThumbnails(mapped);
          setIsLoading(false);
        } catch (err) {
          console.error("Error handling published thumbnails:", err);
        }
      }
    );

    const offMainWindow = (window as any).electronAPI?.onMainWindowThumbnails?.(
      (payload: any) => {
        try {
          if (!payload || payload.layoutId !== layoutId) return;

          const mapped: Record<string, LiveWindowThumbnail> = {};
          (payload.thumbnails || []).forEach((t: any) => {
            if (t && t.windowId && t.dataUrl) {
              mapped[t.windowId] = {
                windowId: t.windowId,
                dataUrl: t.dataUrl,
                timestamp: t.timestamp || Date.now(),
              };
            }
          });

          setThumbnails(mapped);
          setIsLoading(false);
        } catch (err) {
          console.error("Error handling main window thumbnails:", err);
        }
      }
    );

    return () => {
      if (typeof offPublished === "function") offPublished();
      if (typeof offMainWindow === "function") offMainWindow();
    };
  }, [layoutId]);

  // Force re-render when quality settings change (even for published layouts with IPC)
  useEffect(() => {
    console.log(
      "Quality settings changed - forcing re-render",
      publishedQuality
    );
    // This effect exists solely to trigger re-renders when publishedQuality changes
    // The filter is applied in the render function via getSmartFilters()
  }, [publishedQuality.contrast, publishedQuality.brightness]);

  if (gridWindows.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center h-full text-white`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <div className="text-2xl font-bold text-theme-primary-200">
            No Windows Selected
          </div>
          <div className="text-lg opacity-75 text-theme-primary-300">
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
    const isSingle = type === "single";

    // Intelligent color correction based on application type
    const getSmartFilters = () => {
      // Minimal filters - just contrast and brightness, no saturation manipulation
      const filters = [
        `contrast(${publishedQuality.contrast})`,
        `brightness(${publishedQuality.brightness})`,
      ];
      console.log("getSmartFilters called:", filters);
      return filters;
    };

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
          smartFilters: getSmartFilters(),
        }
      );
    }

    return (
      <div
        key={window.id}
        className={`relative ${
          isSingle
            ? "rounded-none"
            : " border-solid border-2 border-theme-primary-600 bg-theme-primary-600/40"
        } overflow-hidden ${
          isSingle ? "" : "flex items-center justify-center flex-shrink-0"
        }`}
        style={{
          ...customStyle,
          position: "relative",
        }}
      >
        {/* Content container */}
        <div className={`w-full h-full flex justify-center items-center`}>
          {/* Live thumbnail */}
          {thumbnail ? (
            <img
              key={`${window.id}-${publishedQuality.contrast}-${publishedQuality.brightness}`}
              src={thumbnail.dataUrl}
              alt={`${window.name} - ${window.app}`}
              className="w-[98%] h-[98%] m-auto"
              style={{
                WebkitBackfaceVisibility: "hidden",
                WebkitTransform: "translateZ(0)",
                backfaceVisibility: "hidden",
                transform: "translateZ(0)",
                imageRendering: "high-quality" as any,
                filter: getSmartFilters().join(" "),
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: isSingle ? "contain" : "contain",
                objectPosition: "center",
                transition: "filter 0.1s ease-out",
                ...({
                  "-webkit-image-rendering": "high-quality",
                  "-moz-image-rendering": "-moz-crisp-edges",
                  "-ms-interpolation-mode": "bicubic",
                } as any),
              }}
            />
          ) : (
            <div
              className="flex flex-col items-center justify-center text-gray-400 h-full"
              style={{ marginTop: isSingle ? "0px" : "32px" }}
            >
              {isLoading ? (
                <WindowLayoutSkeleton columns={2} rows={2} />
              ) : (
                <>
                  <div className="text-4xl mb-2">🖥️</div>
                  <div className="text-sm text-center">
                    <div className="font-medium text-theme-primary-300">
                      {window.app}
                    </div>
                    <div className="opacity-75 text-theme-primary-400">
                      {window.name}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render layout based on type using modular components
  const renderLayout = () => {
    const { width, height } = calculateDimensions();
    const windowDimensions = { width, height };

    switch (type) {
      case "single":
        return (
          <SingleWindowLayoutLive
            window={gridWindows[0]}
            renderWindow={renderWindow}
          />
        );

      case "dual":
        return (
          <DualWindowLayoutLive
            windows={[gridWindows[0], gridWindows[1]]}
            windowDimensions={windowDimensions}
            renderWindow={renderWindow}
          />
        );

      case "triple":
        return (
          <TripleWindowLayoutLive
            windows={[gridWindows[0], gridWindows[1], gridWindows[2]]}
            windowDimensions={windowDimensions}
            renderWindow={renderWindow}
          />
        );

      case "quad":
        return (
          <QuadWindowLayoutLive
            windows={[
              gridWindows[0],
              gridWindows[1],
              gridWindows[2],
              gridWindows[3],
            ]}
            windowDimensions={windowDimensions}
            renderWindow={renderWindow}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={`${className} w-full h-full`}>
      {renderLayout()}
    </div>
  );
}
