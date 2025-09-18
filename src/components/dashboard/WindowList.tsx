import React, { useState, useMemo } from "react";
import {
  MdMonitor,
  MdSearch,
  MdFilterList,
  MdError,
  MdVisibility,
  MdAdd,
  MdCheck,
  MdRemoveRedEye,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export interface WindowInfo {
  id: string;
  name: string;
  app: string;
  isSelected: boolean;
  // Native window properties for aggregation
  handle?: number; // Window handle (HWND on Windows)
  processId?: number;
  executablePath?: string;
  className?: string;
  // Window state
  isVisible?: boolean;
  isMinimized?: boolean;
  isMaximized?: boolean;
  // Window geometry
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // Visual properties
  icon?: string; // Base64 encoded icon or icon path
  thumbnail?: string; // Base64 encoded thumbnail
  // Additional metadata
  parentHandle?: number;
  hasChildren?: boolean;
  zOrder?: number; // Window z-order for layering
}

interface WindowListProps {
  windows: WindowInfo[];
  onWindowSelect: (windowId: string) => void;
  onWindowFocus?: (windowHandle: number) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const WindowList: React.FC<WindowListProps> = ({
  windows,
  onWindowSelect,
  onWindowFocus,
  isLoading = false,
  error = null,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyVisible, setShowOnlyVisible] = useState(true);

  const filteredWindows = useMemo(() => {
    return windows.filter((window) => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (
          !window.name.toLowerCase().includes(searchLower) &&
          !window.app.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Visibility filter
      if (showOnlyVisible && window.isMinimized) {
        return false;
      }

      return true;
    });
  }, [windows, searchTerm, showOnlyVisible]);

  return (
    <div className="h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 mb-4">
        <h3 className="text-base font-semibold text-blue-200 mb-4 flex items-center gap-2">
          <MdMonitor size={18} />
          <span>Available Windows</span>
          {isLoading && (
            <AiOutlineLoading3Quarters
              size={14}
              className="animate-spin text-blue-400"
            />
          )}
        </h3>

        {/* Search and Filter Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <MdSearch
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search windows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-600/40 rounded-lg text-white placeholder-slate-400 focus:border-blue-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowOnlyVisible(!showOnlyVisible)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showOnlyVisible
                ? "bg-blue-500/20 border border-blue-500/30 text-blue-200"
                : "bg-slate-800/30 border border-slate-600/30 text-slate-400 hover:text-white"
            }`}
          >
            <MdFilterList size={14} />
            <span>Show visible only</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center gap-2 text-red-200">
            <MdError size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}
      </div>

      {/* Scrollable Window List */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredWindows.length === 0 && !isLoading ? (
          <div className="text-center py-8 text-slate-400">
            <MdMonitor size={48} className="mx-auto mb-3 opacity-50" />
            {searchTerm || !showOnlyVisible ? (
              <>
                <p className="text-sm">No windows match your filters</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search or filter settings
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">No windows available</p>
                <p className="text-xs text-slate-500 mt-1">
                  Open some applications to see them here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredWindows.map((window) => (
              <div
                key={window.id}
                onClick={() => onWindowSelect(window.id)}
                className={`backdrop-blur-md border rounded-xl p-4 cursor-pointer transition-all duration-300 flex justify-between items-center group hover:scale-105 ${
                  window.isSelected
                    ? "border-blue-400/60 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                    : "border-slate-600/40 bg-slate-800/30 hover:border-blue-500/40 hover:bg-slate-700/40"
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-white mb-1">
                    {window.name}
                  </div>
                  <div className="text-xs text-blue-200/70 flex items-center gap-2">
                    <span>{window.app}</span>
                    {window.processId && (
                      <span className="text-slate-400">
                        PID: {window.processId}
                      </span>
                    )}
                    {window.isMinimized && (
                      <span className="text-yellow-400 text-xs px-1 py-0.5 bg-yellow-400/20 rounded">
                        MIN
                      </span>
                    )}
                    {window.isMaximized && (
                      <span className="text-green-400 text-xs px-1 py-0.5 bg-green-400/20 rounded">
                        MAX
                      </span>
                    )}
                  </div>
                  {window.bounds && (
                    <div className="text-xs text-slate-500 mt-1">
                      {window.bounds.width}×{window.bounds.height} at (
                      {window.bounds.x}, {window.bounds.y})
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Focus Window Button */}
                  {onWindowFocus && window.handle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWindowFocus(window.handle!);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition-all duration-200 bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/30"
                      title="Focus Window"
                    >
                      <MdRemoveRedEye size={14} />
                    </button>
                  )}

                  {/* Select Window Button */}
                  <button
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold transition-all duration-200 ${
                      window.isSelected
                        ? "bg-blue-500 shadow-lg shadow-blue-500/30"
                        : "bg-blue-400 group-hover:bg-blue-400 shadow-lg shadow-green-500/30"
                    }`}
                  >
                    {window.isSelected ? (
                      <MdCheck size={16} />
                    ) : (
                      <MdAdd size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Default mock windows for development
export const mockWindows: WindowInfo[] = [
  {
    id: "bible-app",
    name: "Bible Study Tool",
    app: "Logos Bible Software",
    isSelected: false,
  },
  {
    id: "powerpoint",
    name: "Sunday Service.pptx",
    app: "Microsoft PowerPoint",
    isSelected: false,
  },
  {
    id: "notes",
    name: "Sermon Notes",
    app: "Notepad++",
    isSelected: false,
  },
  {
    id: "youtube",
    name: "Worship Songs Playlist",
    app: "YouTube - Chrome",
    isSelected: false,
  },
  {
    id: "obs",
    name: "OBS Studio",
    app: "OBS Studio",
    isSelected: false,
  },
];
