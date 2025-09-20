import React, { useEffect, useRef, useCallback } from "react";

interface MemoryManagerOptions {
  maxMemoryMB?: number; // Maximum memory usage in MB
  cleanupInterval?: number; // Cleanup interval in ms
  forceCleanupThreshold?: number; // Force cleanup when memory exceeds this threshold
  enableGarbageCollection?: boolean;
}

interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedJSHeapSizeMB: number;
  totalJSHeapSizeMB: number;
  jsHeapSizeLimitMB: number;
}

export function useMemoryManager(options: MemoryManagerOptions = {}) {
  const {
    maxMemoryMB = 200, // 200MB default limit
    cleanupInterval = 30000, // 30 seconds
    forceCleanupThreshold = 300, // 300MB force cleanup
    enableGarbageCollection = true,
  } = options;

  const cleanupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCleanupRef = useRef<number>(0);

  // Get current memory usage
  const getMemoryStats = useCallback((): MemoryStats | null => {
    if (!("memory" in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedJSHeapSizeMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      totalJSHeapSizeMB: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      jsHeapSizeLimitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
    };
  }, []);

  // Force garbage collection (only works in development with --enable-precise-memory-info)
  const forceGarbageCollection = useCallback(() => {
    if (enableGarbageCollection && "gc" in window) {
      try {
        (window as any).gc();
        console.log("🗑️ Forced garbage collection");
      } catch (error) {
        console.warn("Failed to force garbage collection:", error);
      }
    }
  }, [enableGarbageCollection]);

  // Clear thumbnail cache
  const clearThumbnailCache = useCallback(async () => {
    try {
      const result = await window.electronAPI?.clearThumbnailCache?.();
      if (result?.success) {
        // console.log('🧹 Cleared thumbnail cache');
        return true;
      }
    } catch (error) {
      console.error("Failed to clear thumbnail cache:", error);
    }
    return false;
  }, []);

  // Cleanup large data URLs from DOM
  const cleanupDataUrls = useCallback(() => {
    const images = document.querySelectorAll('img[src^="data:"]');
    let cleanedCount = 0;

    images.forEach((img) => {
      const dataUrl = img.getAttribute("src");
      if (dataUrl && dataUrl.length > 50000) {
        // Clean up large data URLs (>50KB)
        // Replace with placeholder
        img.setAttribute(
          "src",
          'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1" fill="%23f0f0f0"/></svg>'
        );
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`🖼️ Cleaned up ${cleanedCount} large data URLs from DOM`);
    }

    return cleanedCount;
  }, []);

  // Main cleanup function
  const performCleanup = useCallback(
    async (force = false) => {
      const now = Date.now();
      const timeSinceLastCleanup = now - lastCleanupRef.current;

      // Skip if recently cleaned up and not forced
      if (!force && timeSinceLastCleanup < cleanupInterval / 2) {
        return;
      }

      const stats = getMemoryStats();
      console.log("🧹 Starting memory cleanup...", stats);

      // Clear thumbnail cache
      await clearThumbnailCache();

      // Clean up DOM data URLs
      cleanupDataUrls();

      // Force garbage collection if memory is high
      if (stats && (stats.usedJSHeapSizeMB > maxMemoryMB || force)) {
        forceGarbageCollection();
      }

      lastCleanupRef.current = now;

      const newStats = getMemoryStats();
      if (stats && newStats) {
        const memoryFreed = stats.usedJSHeapSizeMB - newStats.usedJSHeapSizeMB;
        console.log(
          `💾 Memory cleanup complete. Freed: ${memoryFreed}MB`,
          newStats
        );
      }
    },
    [
      maxMemoryMB,
      cleanupInterval,
      getMemoryStats,
      clearThumbnailCache,
      cleanupDataUrls,
      forceGarbageCollection,
    ]
  );

  // Monitor memory usage and trigger cleanup
  const checkMemoryUsage = useCallback(() => {
    const stats = getMemoryStats();
    if (!stats) return;

    // Force cleanup if memory usage is too high
    if (stats.usedJSHeapSizeMB > forceCleanupThreshold) {
      console.warn(
        `⚠️ High memory usage detected: ${stats.usedJSHeapSizeMB}MB. Forcing cleanup...`
      );
      performCleanup(true);
    }
    // Regular cleanup if over normal threshold
    else if (stats.usedJSHeapSizeMB > maxMemoryMB) {
      performCleanup(false);
    }
  }, [getMemoryStats, forceCleanupThreshold, maxMemoryMB, performCleanup]);

  // Set up periodic cleanup
  useEffect(() => {
    if (cleanupInterval > 0) {
      cleanupTimerRef.current = setInterval(() => {
        checkMemoryUsage();
      }, cleanupInterval);
    }

    return () => {
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [cleanupInterval, checkMemoryUsage]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      performCleanup(true);
    };
  }, [performCleanup]);

  return {
    getMemoryStats,
    performCleanup: () => performCleanup(true),
    forceGarbageCollection,
    clearThumbnailCache,
    cleanupDataUrls,
  };
}

// Memory monitoring component
export function MemoryMonitor() {
  const { getMemoryStats, performCleanup, forceGarbageCollection } =
    useMemoryManager({
      maxMemoryMB: 150,
      cleanupInterval: 20000, // 20 seconds
      forceCleanupThreshold: 250,
    });

  const [memoryStats, setMemoryStats] = React.useState<MemoryStats | null>(
    null
  );

  React.useEffect(() => {
    const updateStats = () => {
      setMemoryStats(getMemoryStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getMemoryStats]);

  if (!memoryStats) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs">
        <div className="text-gray-500">Memory monitoring not available</div>
      </div>
    );
  }

  const usagePercentage =
    (memoryStats.usedJSHeapSize / memoryStats.jsHeapSizeLimit) * 100;
  const isHighUsage = memoryStats.usedJSHeapSizeMB > 150;

  return (
    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs space-y-2">
      <div className="flex justify-between items-center">
        <span className="font-medium">Memory Usage</span>
        <div className="flex space-x-1">
          <button
            onClick={performCleanup}
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            title="Force cleanup"
          >
            🧹 Clean
          </button>
          <button
            onClick={forceGarbageCollection}
            className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
            title="Force garbage collection"
          >
            🗑️ GC
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <div
          className={`font-medium ${
            isHighUsage ? "text-red-600" : "text-green-600"
          }`}
        >
          Used: {memoryStats.usedJSHeapSizeMB}MB ({usagePercentage.toFixed(1)}%)
        </div>
        <div>Total: {memoryStats.totalJSHeapSizeMB}MB</div>
        <div>Limit: {memoryStats.jsHeapSizeLimitMB}MB</div>
      </div>

      {/* Memory usage bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isHighUsage
              ? "bg-red-500"
              : usagePercentage > 70
              ? "bg-yellow-500"
              : "bg-green-500"
          }`}
          style={{ width: `${Math.min(usagePercentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
