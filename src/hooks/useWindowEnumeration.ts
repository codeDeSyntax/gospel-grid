import { useState, useEffect, useCallback } from "react";
import { WindowInfo } from "@/components/dashboard/WindowList";
import { useActivityMonitor } from "./useActivityMonitor";

export interface WindowEnumerationOptions {
  includeMinimized?: boolean;
  includeSystemWindows?: boolean;
  refreshInterval?: number; // Auto-refresh interval in ms (0 = disabled)
  smartRefresh?: boolean; // Use activity-based refresh intervals
}

export const useWindowEnumeration = (
  options: WindowEnumerationOptions = {}
) => {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    includeMinimized = false,
    includeSystemWindows = false,
    refreshInterval = 5000,
    smartRefresh = true,
  } = options;

  // Activity monitoring for smart refresh
  const { activityState } = useActivityMonitor({
    fastInterval: 3000, // 3 seconds when active
    slowInterval: 15000, // 15 seconds when idle
    pausedInterval: 60000, // 1 minute when paused
  });

  const enumerateWindows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the main process to enumerate windows
      const result = await window.electronAPI?.enumerateWindows({
        includeMinimized,
        includeSystemWindows,
      });

      if (result?.success) {
        // Add isSelected property to each window (defaulting to false)
        const windowsWithSelection = (result.windows || []).map(
          (window: WindowInfo) => ({
            ...window,
            isSelected: false,
          })
        );
        setWindows(windowsWithSelection);
      } else {
        setError(result?.error || "Failed to enumerate windows");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      console.error("Window enumeration error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [includeMinimized, includeSystemWindows]);

  const refreshWindows = useCallback(() => {
    enumerateWindows();
  }, [enumerateWindows]);

  const getWindowIcon = useCallback(
    async (handle: number): Promise<string | null> => {
      try {
        const result = await window.electronAPI?.getWindowIcon(handle);
        return result?.success ? result.icon || null : null;
      } catch (err) {
        console.error("Failed to get window icon:", err);
        return null;
      }
    },
    []
  );

  const getWindowThumbnail = useCallback(
    async (handle: number): Promise<string | null> => {
      try {
        const result = await window.electronAPI?.getWindowThumbnail(
          handle.toString()
        );
        return result?.success ? result.thumbnail || null : null;
      } catch (err) {
        console.error("Failed to get window thumbnail:", err);
        return null;
      }
    },
    []
  );

  const focusWindow = useCallback(async (handle: number): Promise<boolean> => {
    try {
      const result = await window.electronAPI?.focusWindow(handle);
      return result?.success || false;
    } catch (err) {
      console.error("Failed to focus window:", err);
      return false;
    }
  }, []);

  const minimizeWindow = useCallback(
    async (handle: number): Promise<boolean> => {
      try {
        const result = await window.electronAPI?.minimizeWindow(handle);
        return result?.success || false;
      } catch (err) {
        console.error("Failed to minimize window:", err);
        return false;
      }
    },
    []
  );

  const maximizeWindow = useCallback(
    async (handle: number): Promise<boolean> => {
      try {
        const result = await window.electronAPI?.maximizeWindow(handle);
        return result?.success || false;
      } catch (err) {
        console.error("Failed to maximize window:", err);
        return false;
      }
    },
    []
  );

  const closeWindow = useCallback(async (handle: number): Promise<boolean> => {
    try {
      const result = await window.electronAPI?.closeWindow(handle);
      return result?.success || false;
    } catch (err) {
      console.error("Failed to close window:", err);
      return false;
    }
  }, []);

  const moveWindow = useCallback(
    async (
      handle: number,
      x: number,
      y: number,
      width: number,
      height: number
    ): Promise<boolean> => {
      try {
        const result = await window.electronAPI?.moveWindow(handle, {
          x,
          y,
          width,
          height,
        });
        return result?.success || false;
      } catch (err) {
        console.error("Failed to move window:", err);
        return false;
      }
    },
    []
  );

  const showWindow = useCallback(async (handle: number): Promise<boolean> => {
    try {
      const result = await window.electronAPI?.showWindow(handle);
      return result?.success || false;
    } catch (err) {
      console.error("Failed to show window:", err);
      return false;
    }
  }, []);

  const hideWindow = useCallback(async (handle: number): Promise<boolean> => {
    try {
      const result = await window.electronAPI?.hideWindow(handle);
      return result?.success || false;
    } catch (err) {
      console.error("Failed to hide window:", err);
      return false;
    }
  }, []);

  // Initial enumeration
  useEffect(() => {
    enumerateWindows();
  }, [enumerateWindows]);

  // Auto-refresh setup with smart intervals
  useEffect(() => {
    if (refreshInterval > 0) {
      const currentInterval = smartRefresh
        ? activityState.currentInterval
        : refreshInterval;

      console.log(
        `Setting window enumeration interval: ${currentInterval}ms (${
          activityState.isActive
            ? "active"
            : activityState.isIdle
            ? "idle"
            : "paused"
        })`
      );

      const interval = setInterval(enumerateWindows, currentInterval);
      return () => clearInterval(interval);
    }
  }, [
    enumerateWindows,
    refreshInterval,
    smartRefresh,
    activityState.currentInterval,
  ]);

  return {
    windows,
    isLoading,
    error,
    refreshWindows,
    // Window manipulation methods
    getWindowIcon,
    getWindowThumbnail,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
    moveWindow,
    showWindow,
    hideWindow,
  };
};
