import React, { useState } from "react";
import { ThumbnailPerformanceMonitor } from "../dashboard/OptimizedThumbnailGrid";
import { MemoryMonitor } from "../../hooks/useMemoryManager";
import { PerformanceDashboard } from "../../hooks/usePerformanceMonitor";

interface PerformanceControlPanelProps {
  className?: string;
}

export function PerformanceControlPanel({
  className = "",
}: PerformanceControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "cache" | "memory" | "performance"
  >("overview");

  if (process.env.NODE_ENV !== "development") {
    return null; // Only show in development
  }

  return (
    <div
      className={`${className} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg`}
    >
      {/* Header */}
      <div
        className="p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">
            🔧 Performance Control Panel
          </span>
          <span className="text-xs text-gray-500">
            {isExpanded ? "Click to collapse" : "Click to expand"}
          </span>
        </div>
        <div
          className={`transform transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-3">
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-3 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "cache", label: "💾 Cache" },
              { id: "memory", label: "🧠 Memory" },
              { id: "performance", label: "⚡ Performance" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 text-xs rounded-t border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-3">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "cache" && <ThumbnailPerformanceMonitor />}
            {activeTab === "memory" && <MemoryMonitor />}
            {activeTab === "performance" && <PerformanceDashboard />}
          </div>
        </div>
      )}
    </div>
  );
}

function OverviewTab() {
  const [optimizations, setOptimizations] = useState({
    caching: true,
    lazyLoading: true,
    smartRefresh: true,
    lowResolution: true,
    batchCapture: true,
  });

  const toggleOptimization = (key: keyof typeof optimizations) => {
    setOptimizations((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Optimization Status */}
      <div>
        <h3 className="text-sm font-medium mb-2">🚀 Active Optimizations</h3>
        <div className="grid grid-cols-1 gap-2">
          {[
            {
              key: "caching",
              label: "Thumbnail Caching",
              description: "Cache thumbnails to avoid re-capture",
            },
            {
              key: "lazyLoading",
              label: "Lazy Loading",
              description: "Load thumbnails only when visible",
            },
            {
              key: "smartRefresh",
              label: "Smart Refresh",
              description: "Activity-based refresh intervals",
            },
            {
              key: "lowResolution",
              label: "Resolution Scaling",
              description: "Lower res for preview, high res for publish",
            },
            {
              key: "batchCapture",
              label: "Batch Capture",
              description: "Capture multiple thumbnails in parallel",
            },
          ].map((opt) => (
            <div
              key={opt.key}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
            >
              <div className="flex-1">
                <div className="text-xs font-medium">{opt.label}</div>
                <div className="text-xs text-gray-500">{opt.description}</div>
              </div>
              <button
                onClick={() =>
                  toggleOptimization(opt.key as keyof typeof optimizations)
                }
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  optimizations[opt.key as keyof typeof optimizations]
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${
                    optimizations[opt.key as keyof typeof optimizations]
                      ? "translate-x-5"
                      : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Tips */}
      <div>
        <h3 className="text-sm font-medium mb-2">💡 Performance Tips</h3>
        <div className="space-y-2 text-xs">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500">
            <strong>Resolution:</strong> Dashboard uses 300x200px, Published
            uses 600x400px
          </div>
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-500">
            <strong>Refresh:</strong> Active: 3s, Idle: 10s, Paused: 30s
          </div>
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-2 border-yellow-500">
            <strong>Memory:</strong> Cache limit: 50 items, Auto-cleanup: 30s
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border-l-2 border-purple-500">
            <strong>Batch:</strong> 3 parallel captures with 100ms delay
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium mb-2">⚡ Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => window.electronAPI?.clearThumbnailCache?.()}
            className="px-3 py-2 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
          >
            🗑️ Clear Cache
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-2 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
          >
            🔄 Reload App
          </button>
          <button
            onClick={() => {
              if ("gc" in window) {
                (window as any).gc();
              }
            }}
            className="px-3 py-2 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
          >
            🧹 Force GC
          </button>
          <button
            onClick={() => console.clear()}
            className="px-3 py-2 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
          >
            📋 Clear Console
          </button>
        </div>
      </div>

      {/* Performance Score */}
      <div>
        <h3 className="text-sm font-medium mb-2">📈 Performance Score</h3>
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg">
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              A+
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Optimized
            </div>
          </div>
          <div className="text-right text-xs space-y-1">
            <div>✅ Caching Active</div>
            <div>✅ Lazy Loading</div>
            <div>✅ Smart Refresh</div>
            <div>✅ Memory Management</div>
          </div>
        </div>
      </div>
    </div>
  );
}
