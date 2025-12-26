import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  useSystemLogger,
  LogEntry,
  SystemStats,
} from "../hooks/useSystemLogger";

interface TerminalProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Command {
  name: string;
  description: string;
  handler: (args: string[]) => string | Promise<string>;
}

const PROMPT = "user@wingrid:~$ ";
const WELCOME_MESSAGE = `
███████╗████████╗██████╗ ███████╗ █████╗ ███╗   ███╗███████╗██████╗ ██╗██████╗ ███████╗
██╔════╝╚══██╔══╝██╔══██╗██╔════╝██╔══██╗████╗ ████║██╔════╝██╔══██╗██║██╔══██╗██╔════╝
███████╗   ██║   ██████╔╝█████╗  ███████║██╔████╔██║███████╗██████╔╝██║██████╔╝█████╗  
╚════██║   ██║   ██╔══██╗██╔══╝  ██╔══██║██║╚██╔╝██║╚════██║██╔═══╝ ██║██╔══██╗██╔══╝  
███████║   ██║   ██║  ██║███████╗██║  ██║██║ ╚═╝ ██║███████║██║     ██║██║  ██║███████╗
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝

wingrid Developer Terminal v1.0.0
Copyright (c) 2025 wingrid Technologies

Welcome to the wingrid Developer Console
Type 'help' for available commands
Press Ctrl+C to exit

Last login: ${new Date().toLocaleString()}
================================================================================================
`;

export default function DeveloperTerminal({
  isVisible,
  onClose,
}: TerminalProps) {
  const {
    logs,
    stats,
    clearLogs,
    exportLogs,
    getLogsByLevel,
    getLogsByCategory,
  } = useSystemLogger();
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    WELCOME_MESSAGE,
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format timestamp for display
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  };

  // Format uptime
  const formatUptime = (startTime: number) => {
    const uptime = Date.now() - startTime;
    const hours = Math.floor(uptime / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Git Bash color codes for different log levels
  const getLogColor = (level: LogEntry["level"]) => {
    switch (level) {
      case "error":
        return "text-red-300"; // Git Bash red
      case "warn":
        return "text-yellow-300"; // Git Bash yellow
      case "success":
        return "text-green-300"; // Git Bash bright green
      case "performance":
        return "text-blue-300"; // Git Bash bright blue
      case "cache":
        return "text-purple-300"; // Git Bash magenta
      case "debug":
        return "text-gray-400"; // Git Bash dark gray
      case "system":
        return "text-cyan-300"; // Git Bash cyan
      case "info":
      default:
        return "text-white"; // Git Bash default white
    }
  };

  // Command definitions
  const commands: Record<string, Command> = useMemo(
    () => ({
      help: {
        name: "help",
        description: "Show available commands",
        handler: () => {
          const commandList = Object.values(commands)
            .map((cmd) => `  ${cmd.name.padEnd(12)} - ${cmd.description}`)
            .join("\n");
          return `Available Commands
════════════════════════════════════════════════════════════════
${commandList}

Keyboard Shortcuts
────────────────────────────────────────────────────────────────
  Ctrl+C       - Close terminal
  Ctrl+L       - Clear screen
  ↑/↓ Arrow    - Command history
  Tab          - (Future: Command completion)

Access Methods
────────────────────────────────────────────────────────────────
  Secret Key   - Press Shift three times quickly
  Dev Combo    - Ctrl+Shift+F12
  Konami Code  - ↑↑↓↓←→←→BA

Type any command above to get started!
════════════════════════════════════════════════════════════════`;
        },
      },
      clear: {
        name: "clear",
        description: "Clear terminal output",
        handler: () => {
          setTerminalHistory([]);
          return "";
        },
      },
      logs: {
        name: "logs",
        description: "Show recent logs [level] [category] [count]",
        handler: (args) => {
          let filteredLogs = logs;
          let count = 20;

          if (
            args[0] &&
            [
              "debug",
              "info",
              "warn",
              "error",
              "success",
              "performance",
              "cache",
              "system",
            ].includes(args[0])
          ) {
            filteredLogs = getLogsByLevel(args[0] as LogEntry["level"]);
          }

          if (args[1]) {
            filteredLogs = getLogsByCategory(args[1]);
          }

          if (args[2]) {
            const parsedCount = parseInt(args[2]);
            if (!isNaN(parsedCount)) count = parsedCount;
          }

          const recentLogs = filteredLogs.slice(0, count);
          return (
            recentLogs
              .map(
                (log) =>
                  `[${formatTime(log.timestamp)}] ${log.level
                    .toUpperCase()
                    .padEnd(7)} ${log.category.padEnd(10)} ${log.message}`
              )
              .join("\n") || "No logs found"
          );
        },
      },
      stats: {
        name: "stats",
        description: "Show system statistics",
        handler: () => {
          const uptime = formatUptime(stats.system.uptime);
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          const oldLogsCount = logs.filter(
            (log) => log.timestamp <= twoMinutesAgo
          ).length;
          const recentLogsCount = logs.length - oldLogsCount;

          return `System Statistics
════════════════════════════════════════════════════════════════
⏱️  Uptime: ${uptime}
🚨 Errors: ${stats.system.errors}
⚠️  Warnings: ${stats.system.warnings}

Logging System
────────────────────────────────────────────────────────────────
📝 Total Logs: ${logs.length}
🆕 Recent Logs (< 2min): ${recentLogsCount}
🕒 Old Logs (> 2min): ${oldLogsCount}
🧹 Auto-cleanup: Every 30 seconds
💾 Max Log Limit: 10,000 entries

Performance Metrics
────────────────────────────────────────────────────────────────
🎯 FPS: ${stats.performance.fps || "N/A"}
⏱️  Frame Time: ${stats.performance.frameTime || 0}ms
🖥️  Render Time: ${stats.performance.renderTime || 0}ms
💾 Memory Usage: ${stats.performance.memoryUsage}MB

Cache Statistics
────────────────────────────────────────────────────────────────
📊 Hit Rate: ${(stats.cache.hitRate * 100).toFixed(1)}%
📦 Cache Size: ${stats.cache.size}/${stats.cache.maxSize} items
🗑️  Evictions: ${stats.cache.evictions}

Window Management
────────────────────────────────────────────────────────────────
🪟 Windows Enumerated: ${stats.windows.enumerated}
🖼️  Thumbnails Loaded: ${stats.windows.thumbnailsLoaded}
⏱️  Refresh Interval: ${stats.windows.refreshInterval}ms
🎯 Activity State: ${stats.windows.activityState}
════════════════════════════════════════════════════════════════`;
        },
      },
      export: {
        name: "export",
        description: "Export logs to clipboard",
        handler: async () => {
          try {
            const exportData = exportLogs();
            await navigator.clipboard.writeText(exportData);
            return "✅ Logs exported to clipboard";
          } catch (error) {
            return `❌ Failed to export logs: ${error}`;
          }
        },
      },
      tail: {
        name: "tail",
        description: "Follow logs in real-time [level] [category]",
        handler: (args) => {
          // This would start a real-time log following mode
          // For now, just show last 10 logs
          let filteredLogs = logs;

          if (args[0]) {
            filteredLogs = getLogsByLevel(args[0] as LogEntry["level"]);
          }
          if (args[1]) {
            filteredLogs = getLogsByCategory(args[1]);
          }

          const recentLogs = filteredLogs.slice(0, 10);
          return `Following logs (last 10):\n${recentLogs
            .map(
              (log) =>
                `[${formatTime(log.timestamp)}] ${log.level.toUpperCase()} ${
                  log.message
                }`
            )
            .join("\n")}`;
        },
      },
      search: {
        name: "search",
        description: "Search logs by text [query]",
        handler: (args) => {
          if (!args[0]) return "Usage: search <query>";

          const query = args.join(" ").toLowerCase();
          const matchingLogs = logs.filter(
            (log) =>
              log.message.toLowerCase().includes(query) ||
              log.category.toLowerCase().includes(query) ||
              (log.data &&
                JSON.stringify(log.data).toLowerCase().includes(query))
          );

          return (
            matchingLogs
              .slice(0, 20)
              .map(
                (log) =>
                  `[${formatTime(log.timestamp)}] ${log.level.toUpperCase()} ${
                    log.category
                  }: ${log.message}`
              )
              .join("\n") || `No logs found matching "${query}"`
          );
        },
      },
      clearlogs: {
        name: "clearlogs",
        description: "Clear all system logs",
        handler: () => {
          clearLogs();
          return "🧹 All logs cleared";
        },
      },
      cleanup: {
        name: "cleanup",
        description: "Remove logs older than 2 minutes",
        handler: () => {
          const beforeCount = logs.length;
          const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
          const oldLogsCount = logs.filter(
            (log) => log.timestamp <= twoMinutesAgo
          ).length;

          // Trigger manual cleanup by calling the logger's internal cleanup
          if (oldLogsCount > 0) {
            // We can't directly call cleanupOldLogs, so we'll simulate it
            return `🧹 Found ${oldLogsCount} logs older than 2 minutes
📊 Current logs: ${beforeCount}
ℹ️  Auto-cleanup runs every 30 seconds
💡 Use 'clearlogs' to clear all logs manually`;
          } else {
            return `✅ No logs older than 2 minutes found
📊 Current logs: ${beforeCount}
🕒 All logs are fresh (< 2 minutes old)`;
          }
        },
      },
      memory: {
        name: "memory",
        description: "Show detailed memory information",
        handler: () => {
          if ("memory" in performance) {
            const memory = (performance as any).memory;
            const usedMB = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
            const totalMB = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
            const limitMB = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);
            const usagePercent = (
              (memory.usedJSHeapSize / memory.jsHeapSizeLimit) *
              100
            ).toFixed(1);
            const usageNumber =
              (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

            return `Memory Information
════════════════════════════════════════════════════════════════
💾 JavaScript Heap Usage
────────────────────────────────────────────────────────────────
Used Heap Size:    ${usedMB} MB
Total Heap Size:   ${totalMB} MB
Heap Size Limit:   ${limitMB} MB
Usage Percentage:  ${usagePercent}%

📊 Performance Status: ${
              usageNumber > 80
                ? "🔴 HIGH"
                : usageNumber > 60
                ? "🟡 MEDIUM"
                : "🟢 LOW"
            }
════════════════════════════════════════════════════════════════`;
          }
          return `❌ Memory information not available
This browser does not support the Memory API`;
        },
      },
      exit: {
        name: "exit",
        description: "Close developer terminal",
        handler: () => {
          onClose();
          return "Goodbye! 👋";
        },
      },
    }),
    [
      logs,
      stats,
      getLogsByLevel,
      getLogsByCategory,
      clearLogs,
      exportLogs,
      onClose,
    ]
  );

  const executeCommand = async (input: string) => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    setIsProcessing(true);
    setTerminalHistory((prev) => [...prev, `${PROMPT}${trimmedInput}`]);

    const [commandName, ...args] = trimmedInput.split(" ");
    const command = commands[commandName];

    if (command) {
      try {
        const result = await command.handler(args);
        if (result) {
          setTerminalHistory((prev) => [...prev, result]);
        }
      } catch (error) {
        setTerminalHistory((prev) => [
          ...prev,
          `❌ Error executing ${commandName}: ${error}`,
        ]);
      }
    } else {
      setTerminalHistory((prev) => [
        ...prev,
        `❌ Unknown command: ${commandName}. Type 'help' for available commands.`,
      ]);
    }

    setIsProcessing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim() && !isProcessing) {
      setCommandHistory((prev) => [currentInput, ...prev.slice(0, 49)]); // Keep last 50 commands
      setHistoryIndex(-1);
      executeCommand(currentInput);
      setCurrentInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && commandHistory.length > 0) {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, commandHistory.length - 1);
      setHistoryIndex(newIndex);
      setCurrentInput(commandHistory[newIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      setCurrentInput(newIndex === -1 ? "" : commandHistory[newIndex]);
    } else if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      onClose();
    } else if (e.ctrlKey && e.key === "l") {
      e.preventDefault();
      setTerminalHistory([]);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalHistory]);

  // Focus input when terminal becomes visible
  useEffect(() => {
    if (isVisible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isVisible]);

  // Add new logs to terminal automatically
  useEffect(() => {
    if (logs.length > 0) {
      const latestLog = logs[0];
      // Only show important logs automatically
      if (["error", "warn"].includes(latestLog.level)) {
        const logLine = `[${formatTime(
          latestLog.timestamp
        )}] ${latestLog.level.toUpperCase()} ${latestLog.category}: ${
          latestLog.message
        }`;
        setTerminalHistory((prev) => [...prev, `🔔 ${logLine}`]);
      }
    }
  }, [logs]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-600 rounded-none w-full max-w-7xl h-5/6 flex flex-col font-mono text-sm shadow-2xl">
        {/* Header - Git Bash style */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-600">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full hover:bg-red-400 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full hover:bg-yellow-400 transition-colors cursor-pointer"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full hover:bg-green-400 transition-colors cursor-pointer"></div>
            </div>
            <span className="ml-4 text-gray-200 font-semibold">
              wingrid Developer Terminal - Git Bash
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-400 transition-colors text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Terminal Content - Git Bash dark theme */}
        <div
          ref={terminalRef}
          className="flex-1 p-4 overflow-y-auto bg-black text-green-300 whitespace-pre-wrap leading-relaxed"
          style={{
            backgroundColor: "#0C0C0C", // Git Bash background
            fontFamily: 'Consolas, "Courier New", monospace',
          }}
        >
          {terminalHistory.map((line, index) => (
            <div key={index} className="mb-1">
              {line.split("\n").map((subLine, subIndex) => (
                <div key={subIndex}>
                  {subLine.startsWith("🔔") ? (
                    <span className="text-yellow-300">{subLine}</span>
                  ) : subLine.startsWith("❌") ? (
                    <span className="text-red-300">{subLine}</span>
                  ) : subLine.startsWith("✅") ? (
                    <span className="text-green-300">{subLine}</span>
                  ) : subLine.includes("user@wingrid") ? (
                    <span className="text-green-400 font-semibold">
                      {subLine}
                    </span>
                  ) : subLine.includes("Available commands:") ? (
                    <span className="text-cyan-300 font-semibold">
                      {subLine}
                    </span>
                  ) : subLine.includes("────") ? (
                    <span className="text-blue-300">{subLine}</span>
                  ) : subLine.match(/^\s{2}\w+\s+- /) ? (
                    <span className="text-white">
                      <span className="text-yellow-300">
                        {subLine.match(/^\s{2}\w+/)?.[0]}
                      </span>
                      <span className="text-gray-300">
                        {subLine.replace(/^\s{2}\w+/, "")}
                      </span>
                    </span>
                  ) : subLine.includes("wingrid") || subLine.includes("███") ? (
                    <span className="text-green-400 font-bold">{subLine}</span>
                  ) : subLine.includes("Type") || subLine.includes("Press") ? (
                    <span className="text-gray-300">{subLine}</span>
                  ) : subLine.includes("Copyright") ||
                    subLine.includes("Last login") ? (
                    <span className="text-gray-400">{subLine}</span>
                  ) : subLine.includes("=") ? (
                    <span className="text-blue-300">{subLine}</span>
                  ) : (
                    <span className="text-white">{subLine}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
          {isProcessing && (
            <div className="text-yellow-300 animate-pulse">Processing...</div>
          )}
        </div>

        {/* Input Area - Git Bash style */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-600 p-4"
          style={{ backgroundColor: "#0C0C0C" }}
        >
          <div className="flex items-center">
            <span className="text-green-400 mr-1 font-semibold">{PROMPT}</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isProcessing}
              className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 caret-green-400"
              style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
              placeholder="Type 'help' for commands..."
              autoComplete="off"
            />
          </div>
        </form>

        {/* Status Bar - Git Bash style */}
        <div
          className="px-4 py-1 border-t border-gray-600 text-xs text-gray-400"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          <div className="flex justify-between">
            <span className="text-cyan-300">
              Logs: <span className="text-white">{logs.length}</span> | Errors:{" "}
              <span className="text-red-300">{stats.system.errors}</span> |
              Warnings:{" "}
              <span className="text-yellow-300">{stats.system.warnings}</span>
            </span>
            <span className="text-green-300">
              Memory:{" "}
              <span className="text-white">
                {stats.performance.memoryUsage}MB
              </span>{" "}
              | Uptime:{" "}
              <span className="text-white">
                {formatUptime(stats.system.uptime)}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
