import { useState, useEffect, useCallback } from "react";
import { type WindowInfo } from "@/components/dashboard/picker/WindowPicker";
import { useActivityMonitor } from "./useActivityMonitor";
import { systemLogger } from "./useSystemLogger";

export interface WindowEnumerationOptions {
  includeMinimized?: boolean;
  includeSystemWindows?: boolean;
  refreshInterval?: number; // Auto-refresh interval in ms (0 = disabled)
  smartRefresh?: boolean; // Use activity-based refresh intervals
}

export const useWindowEnumeration = (
  options: WindowEnumerationOptions = {},
) => {
  const [windows, setWindows] = useState<WindowInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdownTime, setCountdownTime] = useState<number>(0);

  const {
    includeMinimized = false,
    includeSystemWindows = false,
    refreshInterval = 60000, // Default to 1 minute auto-refresh
    smartRefresh = true,
  } = options;

  // Activity monitoring for smart refresh - only when enabled
  const activityMonitor = smartRefresh
    ? useActivityMonitor({
        fastInterval: 60000, // 1 minute when active
        slowInterval: 300000, // 5 minutes when idle
        pausedInterval: 600000, // 10 minutes when paused
      })
    : null;

  const activityState = activityMonitor?.activityState || {
    currentInterval: refreshInterval,
    isActive: true,
    isPaused: false,
    isIdle: false,
  };

  const enumerateWindows = useCallback(async () => {
    const startTime = Date.now();
    try {
      setIsLoading(true);
      setError(null);

      systemLogger.window("enumerate", "Starting window enumeration", {
        includeMinimized,
        includeSystemWindows,
      });

      // Call the main process to enumerate windows
      const result = await window.electronAPI?.enumerateWindows({
        includeMinimized,
        includeSystemWindows,
      });

      const duration = Date.now() - startTime;

      if (result?.success) {
        // Add isSelected property to each window (defaulting to false)
        const windowsWithSelection = (result.windows || []).map(
          (window: WindowInfo) => ({
            ...window,
            isSelected: false,
          }),
        );

        setWindows(windowsWithSelection);

        // Log each enumerated window
        systemLogger.window(
          "enumerate-windows-detail",
          `Logging all ${windowsWithSelection.length} enumerated windows`,
          { count: windowsWithSelection.length },
        );

        windowsWithSelection.forEach((window: any, index: number) => {
          systemLogger.window(
            "enumerate-window-item",
            `Window ${index + 1}: ${window.name} (${window.app})`,
            {
              id: window.id,
              name: window.name,
              app: window.app,
              processId: window.processId,
              executablePath: window.executablePath || "NOT_FOUND",
              bounds: `${window.bounds?.x || 0}, ${window.bounds?.y || 0}, ${
                window.bounds?.width || 0
              }x${window.bounds?.height || 0}`,
              isVisible: window.isVisible,
              handle: window.handle,
            },
          );
        });

        systemLogger.window(
          "enumerate-success",
          `Found ${windowsWithSelection.length} windows in ${duration}ms`,
          {
            count: windowsWithSelection.length,
            duration,
            includeMinimized,
            includeSystemWindows,
          },
        );

        // Update system stats
        systemLogger.updateStats("windows", {
          enumerated: windowsWithSelection.length,
          refreshInterval: smartRefresh
            ? activityState.isActive
              ? 3000
              : activityState.isIdle
                ? 15000
                : 60000
            : refreshInterval,
          activityState: activityState.isActive
            ? "active"
            : activityState.isIdle
              ? "idle"
              : "paused",
        });
      } else {
        const errorMsg = result?.error || "Failed to enumerate windows";
        setError(errorMsg);
        systemLogger.log(
          "window",
          "error",
          "WindowEnumeration",
          `Enumeration failed: ${errorMsg}`,
          { duration },
        );
      }
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMsg =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
      systemLogger.log(
        "window",
        "error",
        "WindowEnumeration",
        `Exception during enumeration: ${errorMsg}`,
        { err, duration },
      );
      console.error("Window enumeration error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [includeMinimized, includeSystemWindows, smartRefresh, refreshInterval]);

  const refreshWindows = useCallback(() => {
    enumerateWindows();
    // Reset countdown on manual refresh
    setCountdownTime(Math.floor(refreshInterval / 1000));
  }, [enumerateWindows, refreshInterval]);

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
    [],
  );

  const getWindowThumbnail = useCallback(
    async (handle: number): Promise<string | null> => {
      try {
        const result = await window.electronAPI?.getWindowThumbnail(
          handle.toString(),
        );
        return result?.success ? result.thumbnail || null : null;
      } catch (err) {
        console.error("Failed to get window thumbnail:", err);
        return null;
      }
    },
    [],
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
    [],
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
    [],
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
      height: number,
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
    [],
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
      // Use a fixed interval for simplicity and stability
      const fixedInterval = refreshInterval; // Always use the base 60-second interval

      systemLogger.window(
        "enumerate-interval",
        `Setting fixed window enumeration interval: ${fixedInterval}ms`,
        {
          interval: fixedInterval,
          smartRefresh: false, // Disabled for stability
        },
      );

      // Initialize countdown
      setCountdownTime(Math.floor(fixedInterval / 1000));

      const interval = setInterval(() => {
        enumerateWindows();
        // Reset countdown after enumeration
        setCountdownTime(Math.floor(fixedInterval / 1000));
      }, fixedInterval);

      return () => clearInterval(interval);
    }
  }, [
    enumerateWindows,
    refreshInterval,
    // Removed smartRefresh and activityState dependencies for stability
  ]);

  // Countdown timer - updates every second
  useEffect(() => {
    if (refreshInterval > 0 && countdownTime > 0) {
      const countdownInterval = setInterval(() => {
        setCountdownTime((prev) => Math.max(0, prev - 1));
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [refreshInterval, countdownTime]);

  return {
    windows,
    isLoading,
    error,
    refreshWindows,
    countdownTime,
    totalRefreshTime: Math.floor(refreshInterval / 1000), // in seconds
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
