import { useState, useEffect, useCallback, useRef } from "react";
import { useActivityMonitor } from "./useActivityMonitor";
import { systemLogger } from "./useSystemLogger";

export interface WindowThumbnail {
  windowId: string;
  dataUrl: string;
  timestamp: number;
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  scaleFactor?: number;
  quality?: number;
  forceRefresh?: boolean;
}

interface UseThumbnailsOptions extends ThumbnailOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
  smartRefresh?: boolean;
  batchSize?: number; // Number of thumbnails to capture in parallel
}

export function useThumbnails(
  windowIds: string[],
  options: UseThumbnailsOptions = {}
) {
  const [thumbnails, setThumbnails] = useState<Record<string, WindowThumbnail>>(
    {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    width = 300, // Reduced from 800
    height = 200, // Reduced from 600
    scaleFactor = 1.0, // Reduced from 2.0
    quality = 85, // Reduced from 90
    refreshInterval = 5000, // Increased from 2000
    autoRefresh = true,
    smartRefresh = true,
    batchSize = 3,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Activity monitoring for smart refresh
  const { activityState } = useActivityMonitor({
    fastInterval: 3000, // 3 seconds when active
    slowInterval: 10000, // 10 seconds when idle
    pausedInterval: 30000, // 30 seconds when paused
  });

  const captureThumbnails = useCallback(async () => {
    if (windowIds.length === 0) {
      setThumbnails({});
      return;
    }

    const startTime = Date.now();
    systemLogger.thumbnail(
      "batch-capture-start",
      `Starting batch capture for ${windowIds.length} windows`
    );

    try {
      setLoading(true);
      setError(null);

      // Use batch capture for better performance if available
      const result = await window.electronAPI?.batchCaptureThumbnails?.(
        windowIds,
        {
          width,
          height,
          scaleFactor,
          quality,
        }
      );

      const duration = Date.now() - startTime;

      if (result?.success && result.thumbnails) {
        const newThumbnails: Record<string, WindowThumbnail> = {};
        let successCount = 0;

        result.thumbnails.forEach(
          (thumbnail: WindowThumbnail | null, index: number) => {
            if (thumbnail) {
              newThumbnails[windowIds[index]] = thumbnail;
              successCount++;
              systemLogger.thumbnail("capture-success", windowIds[index], {
                size: thumbnail.dataUrl.length,
                timestamp: thumbnail.timestamp,
              });
            } else {
              systemLogger.thumbnail("capture-failed", windowIds[index]);
            }
          }
        );

        setThumbnails(newThumbnails);

        systemLogger.performance(
          "thumbnail-batch",
          `Batch capture completed: ${successCount}/${windowIds.length} in ${duration}ms`,
          {
            total: windowIds.length,
            successful: successCount,
            failed: windowIds.length - successCount,
            duration,
            avgTime: duration / windowIds.length,
            width,
            height,
            quality,
          }
        );

        // Update system stats
        systemLogger.updateStats("windows", {
          thumbnailsLoaded: successCount,
        });
      } else {
        systemLogger.log(
          "thumbnail",
          "warn",
          "BatchCapture",
          "Batch thumbnail capture failed, falling back to legacy method"
        );

        console.warn(
          "Batch thumbnail capture failed, falling back to legacy method"
        );

        // Fallback to legacy method
        const legacyResult =
          await window.electronAPI.getMultipleWindowThumbnails(windowIds, {
            width,
            height,
            scaleFactor,
            quality,
          });

        const legacyDuration = Date.now() - startTime;

        if (legacyResult.success && legacyResult.thumbnails) {
          const thumbnailMap: Record<string, WindowThumbnail> = {};
          legacyResult.thumbnails.forEach((thumbnail: WindowThumbnail) => {
            thumbnailMap[thumbnail.windowId] = thumbnail;
          });
          setThumbnails(thumbnailMap);

          systemLogger.performance(
            "thumbnail-legacy",
            `Legacy capture completed: ${legacyResult.thumbnails.length} thumbnails in ${legacyDuration}ms`,
            {
              count: legacyResult.thumbnails.length,
              duration: legacyDuration,
              method: "legacy",
            }
          );
        } else {
          const errorMsg = legacyResult.error || "Failed to capture thumbnails";
          setError(errorMsg);
          systemLogger.log(
            "thumbnail",
            "error",
            "LegacyCapture",
            `Legacy capture failed: ${errorMsg}`,
            { duration: legacyDuration }
          );
        }
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      systemLogger.log(
        "thumbnail",
        "error",
        "ThumbnailCapture",
        `Exception during capture: ${errorMsg}`,
        { err, duration, windowCount: windowIds.length }
      );
      console.error("Failed to capture thumbnails:", err);
    } finally {
      setLoading(false);
    }
  }, [windowIds, width, height, scaleFactor, quality]);

  const captureSingleThumbnail = useCallback(
    async (windowId: string) => {
      try {
        const result = await window.electronAPI.getWindowThumbnail(windowId, {
          width,
          height,
        });

        if (result.success && result.thumbnail) {
          setThumbnails((prev) => ({
            ...prev,
            [windowId]: result.thumbnail,
          }));
          return result.thumbnail;
        } else {
          console.warn(
            `Failed to capture thumbnail for ${windowId}:`,
            result.error
          );
          return null;
        }
      } catch (err) {
        console.error(`Failed to capture thumbnail for ${windowId}:`, err);
        return null;
      }
    },
    [width, height]
  );

  // Initial capture and setup auto-refresh with smart intervals
  useEffect(() => {
    captureThumbnails();

    if (autoRefresh && refreshInterval > 0) {
      const currentInterval = smartRefresh
        ? activityState.currentInterval
        : refreshInterval;

      console.log(
        `Setting thumbnail refresh interval: ${currentInterval}ms (${
          activityState.isActive
            ? "active"
            : activityState.isIdle
            ? "idle"
            : "paused"
        })`
      );

      intervalRef.current = setInterval(captureThumbnails, currentInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    captureThumbnails,
    autoRefresh,
    refreshInterval,
    smartRefresh,
    activityState.currentInterval,
  ]);

  // Stop auto-refresh when component unmounts or windowIds become empty
  useEffect(() => {
    if (windowIds.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [windowIds.length]);

  const refreshThumbnails = useCallback(() => {
    captureThumbnails();
  }, [captureThumbnails]);

  const getThumbnail = useCallback(
    (windowId: string) => {
      return thumbnails[windowId] || null;
    },
    [thumbnails]
  );

  return {
    thumbnails,
    loading,
    error,
    refreshThumbnails,
    captureSingleThumbnail,
    getThumbnail,
  };
}

export function useSingleThumbnail(
  windowId: string | null,
  options: ThumbnailOptions & {
    refreshInterval?: number;
    autoRefresh?: boolean;
  } = {}
) {
  const [thumbnail, setThumbnail] = useState<WindowThumbnail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    width = 200,
    height = 150,
    refreshInterval = 2000,
    autoRefresh = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureThumbnail = useCallback(async () => {
    if (!windowId) {
      setThumbnail(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI.getWindowThumbnail(windowId, {
        width,
        height,
      });

      if (result.success && result.thumbnail) {
        setThumbnail(result.thumbnail);
      } else {
        setError(result.error || "Failed to capture thumbnail");
        setThumbnail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setThumbnail(null);
      console.error("Failed to capture thumbnail:", err);
    } finally {
      setLoading(false);
    }
  }, [windowId, width, height]);

  useEffect(() => {
    captureThumbnail();

    if (autoRefresh && refreshInterval > 0 && windowId) {
      intervalRef.current = setInterval(captureThumbnail, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [captureThumbnail, autoRefresh, refreshInterval, windowId]);

  const refreshThumbnail = useCallback(() => {
    captureThumbnail();
  }, [captureThumbnail]);

  return {
    thumbnail,
    loading,
    error,
    refreshThumbnail,
  };
}
