import React, { useState, useEffect, useRef } from "react";
import { useLazyLoad } from "@/hooks/useIntersectionObserver";
import { WindowThumbnail, ThumbnailOptions } from "@/hooks/useThumbnails";

interface LazyThumbnailProps {
  windowId: string;
  title: string;
  className?: string;
  fallbackClassName?: string;
  options?: ThumbnailOptions;
  onLoad?: (thumbnail: WindowThumbnail) => void;
  onError?: (error: string) => void;
  enabled?: boolean;
}

export function LazyThumbnail({
  windowId,
  title,
  className,
  fallbackClassName,
  options = {},
  onLoad,
  onError,
  enabled = true,
}: LazyThumbnailProps) {
  const [thumbnail, setThumbnail] = useState<WindowThumbnail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { shouldLoad, observe } = useLazyLoad({
    rootMargin: "200px", // Start loading 200px before visible
    threshold: 0.1,
    enabled,
    onVisible: () => {
      if (!thumbnail && !isLoading) {
        captureThumbnail();
      }
    },
  });

  const captureThumbnail = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await window.electronAPI?.getWindowThumbnail?.(windowId, {
        width: 300,
        height: 200,
        scaleFactor: 1.0,
        quality: 85,
        ...options,
      });

      if (result?.success && result.thumbnail) {
        setThumbnail(result.thumbnail);
        onLoad?.(result.thumbnail);
      } else {
        const errorMsg = result?.error || "Failed to capture thumbnail";
        setError(errorMsg);
        onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      setError(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up intersection observer
  useEffect(() => {
    if (containerRef.current) {
      observe(containerRef.current);
    }
  }, [observe]);

  // Render loading placeholder
  if (!shouldLoad || isLoading) {
    return (
      <div
        ref={containerRef}
        className={`${
          fallbackClassName || className
        } bg-gray-200 dark:bg-gray-700 flex items-center justify-center`}
      >
        <div className="animate-pulse">
          {isLoading ? (
            <div className="text-xs text-gray-500">Loading...</div>
          ) : (
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          )}
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div
        ref={containerRef}
        className={`${
          fallbackClassName || className
        } bg-red-100 dark:bg-red-900 flex items-center justify-center`}
      >
        <div className="text-xs text-red-600 dark:text-red-400 text-center p-2">
          <div>Failed to load</div>
          <div className="text-xs opacity-75">{title}</div>
        </div>
      </div>
    );
  }

  // Render thumbnail
  if (thumbnail) {
    return (
      <div ref={containerRef} className={className}>
        <img
          src={thumbnail.dataUrl}
          alt={`Thumbnail for ${title}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Render empty state (should not happen)
  return (
    <div
      ref={containerRef}
      className={`${
        fallbackClassName || className
      } bg-gray-100 dark:bg-gray-800 flex items-center justify-center`}
    >
      <div className="text-xs text-gray-500">No thumbnail</div>
    </div>
  );
}
