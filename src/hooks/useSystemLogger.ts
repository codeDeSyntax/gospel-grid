import { useState, useEffect, useRef, useCallback } from "react";

export interface LogEntry {
  id: string;
  timestamp: number;
  level:
    | "debug"
    | "info"
    | "warn"
    | "error"
    | "success"
    | "performance"
    | "cache"
    | "system";
  category: string;
  message: string;
  data?: any;
  source: "frontend" | "backend" | "main" | "preload" | "renderer";
  context?: Record<string, any>;
}

export interface SystemStats {
  performance: {
    fps: number;
    frameTime: number;
    renderTime: number;
    memoryUsage: number;
  };
  cache: {
    hitRate: number;
    size: number;
    maxSize: number;
    evictions: number;
  };
  windows: {
    enumerated: number;
    thumbnailsLoaded: number;
    refreshInterval: number;
    activityState: string;
  };
  system: {
    uptime: number;
    errors: number;
    warnings: number;
  };
}

class SystemLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 10000;
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private stats: SystemStats = {
    performance: { fps: 0, frameTime: 0, renderTime: 0, memoryUsage: 0 },
    cache: { hitRate: 0, size: 0, maxSize: 50, evictions: 0 },
    windows: {
      enumerated: 0,
      thumbnailsLoaded: 0,
      refreshInterval: 5000,
      activityState: "active",
    },
    system: { uptime: Date.now(), errors: 0, warnings: 0 },
  };

  constructor() {
    this.log("system", "info", "SystemLogger", "🚀 System logger initialized");

    // Intercept console methods
    this.interceptConsole();

    // Start periodic stats collection
    this.startStatsCollection();

    // Start automatic log cleanup
    this.startLogCleanup();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private interceptConsole() {
    const originalConsole = { ...console };

    console.log = (...args) => {
      originalConsole.log(...args);
      this.log("console", "info", "Console", args.join(" "));
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      this.log("console", "warn", "Console", args.join(" "));
      this.stats.system.warnings++;
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      this.log("console", "error", "Console", args.join(" "));
      this.stats.system.errors++;
    };

    console.debug = (...args) => {
      originalConsole.debug(...args);
      this.log("console", "debug", "Console", args.join(" "));
    };

    // Store original for internal use
    (this as any).originalConsole = originalConsole;
  }

  private startStatsCollection() {
    setInterval(() => {
      this.collectStats();
    }, 2000);
  }

  private startLogCleanup() {
    // Clean up logs older than 2 minutes every 30 seconds
    setInterval(() => {
      this.cleanupOldLogs();
    }, 30000);
  }

  private cleanupOldLogs() {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000; // 2 minutes in milliseconds
    const initialCount = this.logs.length;

    // Filter out logs older than 2 minutes
    this.logs = this.logs.filter((log) => log.timestamp > twoMinutesAgo);

    const removedCount = initialCount - this.logs.length;

    if (removedCount > 0) {
      // Log the cleanup action
      this.log(
        "system",
        "debug",
        "LogCleanup",
        `🧹 Cleaned up ${removedCount} logs older than 2 minutes`,
        { removedCount, remainingLogs: this.logs.length }
      );

      // Notify listeners of the updated log list
      this.listeners.forEach((listener) => listener([...this.logs]));
    }
  }

  private async collectStats() {
    try {
      // Performance stats
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        this.stats.performance.memoryUsage = Math.round(
          memory.usedJSHeapSize / 1024 / 1024
        );
      }

      // Cache stats
      try {
        const cacheResult = await window.electronAPI?.getCacheStats?.();
        if (cacheResult?.success) {
          this.stats.cache = { ...this.stats.cache, ...cacheResult.stats };
        }
      } catch (error) {
        // Silent fail for cache stats
      }

      // Update uptime
      this.stats.system.uptime = Date.now();
    } catch (error) {
      this.log(
        "stats",
        "error",
        "StatsCollection",
        `Failed to collect stats: ${error}`
      );
    }
  }

  log(
    category: string,
    level: LogEntry["level"],
    source: string,
    message: string,
    data?: any,
    context?: Record<string, any>
  ) {
    const entry: LogEntry = {
      id: this.generateId(),
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      source: this.detectSource(),
      context,
    };

    this.logs.unshift(entry);

    // Clean up old logs if we're approaching the limit (80% of maxLogs)
    if (this.logs.length > this.maxLogs * 0.8) {
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const beforeCleanup = this.logs.length;
      this.logs = this.logs.filter((log) => log.timestamp > twoMinutesAgo);

      // If cleanup didn't help much, just trim by maxLogs
      if (this.logs.length > this.maxLogs) {
        this.logs = this.logs.slice(0, this.maxLogs);
      }

      const afterCleanup = this.logs.length;
      if (beforeCleanup !== afterCleanup) {
        // Don't log cleanup during cleanup to avoid recursion
        if (category !== "system" || source !== "LogCleanup") {
          this.listeners.forEach((listener) => listener([...this.logs]));
        }
      }
    } else if (this.logs.length > this.maxLogs) {
      // Fallback trim if no old logs to clean
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener([...this.logs]));

    // Internal console for debugging the logger itself
    if ((this as any).originalConsole) {
      const prefix = `[${level.toUpperCase()}] [${category}]`;
      (this as any).originalConsole.log(prefix, message, data || "");
    }
  }

  private detectSource(): LogEntry["source"] {
    // Simple heuristic to detect source
    if (typeof window !== "undefined") {
      if (window.electronAPI) return "renderer";
      return "frontend";
    }
    return "backend";
  }

  // Specialized logging methods
  performance(category: string, message: string, metrics?: any) {
    this.log(category, "performance", "Performance", message, metrics);
  }

  cache(action: string, message: string, stats?: any) {
    this.log("cache", "info", "Cache", `${action}: ${message}`, stats);
  }

  thumbnail(action: string, windowId: string, result?: any) {
    this.log(
      "thumbnail",
      "info",
      "Thumbnail",
      `${action} for ${windowId}`,
      result
    );
  }

  window(action: string, message: string, windowData?: any) {
    this.log("window", "info", "Window", `${action}: ${message}`, windowData);
  }

  ipc(channel: string, direction: "send" | "receive", data?: any) {
    this.log(
      "ipc",
      "debug",
      "IPC",
      `${direction.toUpperCase()} ${channel}`,
      data
    );
  }

  // Getters
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  getStats(): SystemStats {
    return { ...this.stats };
  }

  updateStats<K extends keyof SystemStats>(
    category: K,
    updates: Partial<SystemStats[K]>
  ) {
    this.stats[category] = {
      ...this.stats[category],
      ...updates,
    } as SystemStats[K];
  }

  // Filters
  getLogsByLevel(level: LogEntry["level"]): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter((log) => log.category === category);
  }

  getLogsInTimeRange(startTime: number, endTime: number): LogEntry[] {
    return this.logs.filter(
      (log) => log.timestamp >= startTime && log.timestamp <= endTime
    );
  }

  // Utilities
  clearLogs() {
    this.logs = [];
    this.listeners.forEach((listener) => listener([]));
    this.log("system", "info", "Logger", "🧹 Logs cleared");
  }

  exportLogs(): string {
    return JSON.stringify(
      {
        exportTime: new Date().toISOString(),
        stats: this.stats,
        logs: this.logs,
      },
      null,
      2
    );
  }

  // Subscription
  subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
}

// Global singleton
export const systemLogger = new SystemLogger();

// React hook
export function useSystemLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<SystemStats>(systemLogger.getStats());

  useEffect(() => {
    const unsubscribe = systemLogger.subscribe(setLogs);

    // Update stats periodically
    const statsInterval = setInterval(() => {
      setStats(systemLogger.getStats());
    }, 1000);

    // Initial load
    setLogs(systemLogger.getLogs());

    return () => {
      unsubscribe();
      clearInterval(statsInterval);
    };
  }, []);

  const logMethods = {
    log: systemLogger.log.bind(systemLogger),
    performance: systemLogger.performance.bind(systemLogger),
    cache: systemLogger.cache.bind(systemLogger),
    thumbnail: systemLogger.thumbnail.bind(systemLogger),
    window: systemLogger.window.bind(systemLogger),
    ipc: systemLogger.ipc.bind(systemLogger),
    clearLogs: systemLogger.clearLogs.bind(systemLogger),
    exportLogs: systemLogger.exportLogs.bind(systemLogger),
    getLogsByLevel: systemLogger.getLogsByLevel.bind(systemLogger),
    getLogsByCategory: systemLogger.getLogsByCategory.bind(systemLogger),
    updateStats: systemLogger.updateStats.bind(systemLogger),
  };

  return {
    logs,
    stats,
    ...logMethods,
  };
}
