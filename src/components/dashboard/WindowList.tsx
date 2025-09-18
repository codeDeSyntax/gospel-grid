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
import { getAppIcon, getAppGradient } from "@/utils/appIconMapping";

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
                className={`
                  relative overflow-hidden cursor-pointer transition-all duration-500 
                  flex items-center gap-3 p-4 rounded-2xl group hover:scale-[1.02] hover:-translate-y-1
                  ${
                    window.isSelected
                      ? `
                        bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-cyan-500/30
                        border border-blue-400/50 shadow shadow-blue-500/25
                        backdrop-blur-lg before:absolute before:inset-0 
                        before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-2xl
                      `
                      : `
                        
                        border border-slate-600/30 hover:border-blue-400/40
                        backdrop-blur-md bg-gradient-to-br from-blue-900/20 via-purple-800/15 to-slate-700/25
                      
                        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent 
                        before:rounded-2xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                      `
                  }
                `}
              >
                {/* Magical shimmer effect */}
                <div
                  className="
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    bg-gradient-to-r from-transparent via-white/10 to-transparent
                    transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] 
                    transition-all duration-1000 ease-out
                  "
                />

                {/* App Icon with glow effect */}
                <div className="relative flex-shrink-0  flex items-center justify-center z-10">
                  <div
                    className={`
                    absolute inset-0 rounded-lg bg-gradient-to-br opacity-20 group-hover:opacity-40 transition-opacity duration-300
                    ${
                      window.isSelected
                        ? "from-blue-400 to-purple-500"
                        : "from-slate-500 to-slate-600"
                    }
                  `}
                  />
                  <div className="relative">{getAppIcon(window.app, 40)}</div>
                </div>

                {/* App Content */}
                <div className="flex-1 min-w-0 relative z-10">
                  {/* Window State Indicators */}
                  <div className="flex items-center gap-1 mb-1">
                    {window.isMinimized && (
                      <span className="text-yellow-300 text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-500/30 to-amber-500/20 rounded-full border border-yellow-400/30 backdrop-blur-sm">
                        MIN
                      </span>
                    )}
                    {window.isMaximized && (
                      <span className="text-green-300 text-xs px-2 py-0.5 bg-gradient-to-r from-green-500/30 to-emerald-500/20 rounded-full border border-green-400/30 backdrop-blur-sm">
                        MAX
                      </span>
                    )}
                    {window.processId && (
                      <span className="text-slate-300 text-xs opacity-70">
                        PID: {window.processId}
                      </span>
                    )}
                  </div>

                  {/* App Name with Enhanced Gradient */}
                  <div
                    className={`
                    text-sm font-medium bg-gradient-to-r ${getAppGradient(
                      window.app
                    )} 
                    bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300
                  `}
                  >
                    {window.app}
                  </div>

                  {/* Window Title/Description - Small at bottom */}
                  <div className="text-xs text-slate-300 truncate mt-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                    {window.name}
                  </div>

                  {/* Window Dimensions (if available) */}
                  {window.bounds && (
                    <div className="text-xs text-slate-400 mt-1 opacity-60">
                      {window.bounds.width}×{window.bounds.height}
                    </div>
                  )}
                </div>

                {/* Action Buttons with Magical Effects */}
                <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                  {/* Focus Window Button */}
                  {onWindowFocus && window.handle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWindowFocus(window.handle!);
                      }}
                      className="
                        relative w-8 h-8 rounded-xl flex items-center justify-center text-white 
                        transition-all duration-300 group/btn overflow-hidden
                        bg-gradient-to-br from-purple-500 to-indigo-600
                        hover:from-purple-400 hover:to-indigo-500 hover:scale-110 hover:rotate-6
                        shadow-lg shadow-purple-500/30 hover:shadow-purple-400/50
                        border border-purple-400/30 hover:border-purple-300/50
                      "
                      title="Focus Window"
                    >
                      {/* Button glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />
                      <MdRemoveRedEye size={14} className="relative z-10" />
                    </button>
                  )}

                  {/* Select Window Button */}
                  <button
                    className={`
                      relative w-8 h-8 cursor-pointer rounded-xl flex items-center justify-center text-white 
                      transition-all duration-300 group/btn overflow-hidden
                      ${
                        window.isSelected
                          ? `
                            bg-gradient-to-br from-blue-500 to-cyan-600
                            shadow-lg shadow-blue-500/40 border border-blue-400/50
                            hover:from-blue-400 hover:to-cyan-500 hover:scale-110
                          `
                          : `
                            bg-gradient-to-br from-emerald-500 to-blue-600
                            hover:from-emerald-400 hover:to-blue-500 hover:scale-110 hover:rotate-6
                            shadow-lg shadow-emerald-500/30 hover:shadow-emerald-400/50
                            border border-emerald-400/30 hover:border-emerald-300/50
                          `
                      }
                    `}
                  >
                    {/* Button glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 rounded-xl" />
                    {window.isSelected ? (
                      <MdCheck size={14} className="relative z-10" />
                    ) : (
                      <MdAdd size={14} className="relative z-10" />
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
