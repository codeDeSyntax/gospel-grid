import { useState, useEffect, useCallback, useRef } from "react";

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
}

interface UseThumbnailsOptions extends ThumbnailOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
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
    width = 800,
    height = 600,
    scaleFactor = 2.0,
    quality = 90,
    refreshInterval = 2000,
    autoRefresh = true,
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const captureThumbnails = useCallback(async () => {
    if (windowIds.length === 0) {
      setThumbnails({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await window.electronAPI.getMultipleWindowThumbnails(
        windowIds,
        { width, height, scaleFactor, quality }
      );

      if (result.success && result.thumbnails) {
        const thumbnailMap: Record<string, WindowThumbnail> = {};
        result.thumbnails.forEach((thumbnail: WindowThumbnail) => {
          thumbnailMap[thumbnail.windowId] = thumbnail;
        });
        setThumbnails(thumbnailMap);
      } else {
        setError(result.error || "Failed to capture thumbnails");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Failed to capture thumbnails:", err);
    } finally {
      setLoading(false);
    }
  }, [windowIds, width, height]);

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

  // Initial capture and setup auto-refresh
  useEffect(() => {
    captureThumbnails();

    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(captureThumbnails, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [captureThumbnails, autoRefresh, refreshInterval]);

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
