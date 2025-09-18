import { useEffect, useRef, useState, useCallback } from "react";

interface ActivityMonitorOptions {
  idleThreshold?: number; // Time in ms before considered idle
  fastInterval?: number; // Refresh rate when active (ms)
  slowInterval?: number; // Refresh rate when idle (ms)
  pausedInterval?: number; // Refresh rate when completely paused (ms)
}

export interface ActivityState {
  isActive: boolean;
  isIdle: boolean;
  isPaused: boolean;
  lastActivity: number;
  currentInterval: number;
}

export function useActivityMonitor(options: ActivityMonitorOptions = {}) {
  const {
    idleThreshold = 30000, // 30 seconds
    fastInterval = 2000, // 2 seconds when active
    slowInterval = 10000, // 10 seconds when idle
    pausedInterval = 60000, // 1 minute when paused
  } = options;

  const [activityState, setActivityState] = useState<ActivityState>({
    isActive: true,
    isIdle: false,
    isPaused: false,
    lastActivity: Date.now(),
    currentInterval: fastInterval,
  });

  const lastActivityRef = useRef(Date.now());
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;

    setActivityState((prev) => ({
      ...prev,
      isActive: true,
      isIdle: false,
      isPaused: false,
      lastActivity: now,
      currentInterval: fastInterval,
    }));
  }, [fastInterval]);

  // Monitor activity status
  useEffect(() => {
    const checkActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      let newState: Partial<ActivityState> = {};

      if (timeSinceLastActivity > idleThreshold * 3) {
        // Paused - very long inactivity
        newState = {
          isActive: false,
          isIdle: false,
          isPaused: true,
          currentInterval: pausedInterval,
        };
      } else if (timeSinceLastActivity > idleThreshold) {
        // Idle - moderate inactivity
        newState = {
          isActive: false,
          isIdle: true,
          isPaused: false,
          currentInterval: slowInterval,
        };
      } else {
        // Active - recent activity
        newState = {
          isActive: true,
          isIdle: false,
          isPaused: false,
          currentInterval: fastInterval,
        };
      }

      setActivityState((prev) => ({
        ...prev,
        ...newState,
        lastActivity: lastActivityRef.current,
      }));
    };

    // Check activity status every second
    const activityTimer = setInterval(checkActivity, 1000);
    activityTimerRef.current = activityTimer;

    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [idleThreshold, fastInterval, slowInterval, pausedInterval]);

  // Set up activity listeners
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const throttledUpdateActivity = throttle(updateActivity, 1000);

    events.forEach((event) => {
      document.addEventListener(event, throttledUpdateActivity, true);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledUpdateActivity, true);
      });
    };
  }, [updateActivity]);

  return {
    activityState,
    updateActivity,
    getCurrentInterval: useCallback(
      () => activityState.currentInterval,
      [activityState.currentInterval]
    ),
  };
}

// Simple throttle utility
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: any[]) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}
