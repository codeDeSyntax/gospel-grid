import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMonitor,
  MdSearch,
  MdFilterList,
  MdError,
  MdVisibility,
  MdAdd,
  MdCheck,
  MdRefresh,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getAppIcon, getAppGradient } from "@/utils/appIconMapping";
import { CircularCountdown } from "@/components/ui/CircularCountdown";

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
  hasNativeIcon?: boolean; // Whether the window has a native app icon available
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
  onWindowDragStart?: (window: WindowInfo) => void;
  onWindowDragEnd?: () => void;
  isLoading?: boolean;
  error?: string | null;
  countdownTime?: number;
  totalRefreshTime?: number;
  onManualRefresh?: () => void;
}

export const WindowList: React.FC<WindowListProps> = ({
  windows,
  onWindowSelect,
  onWindowFocus,
  onWindowDragStart,
  onWindowDragEnd,
  isLoading = false,
  error = null,
  countdownTime = 0,
  totalRefreshTime = 60,
  onManualRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showOnlyVisible, setShowOnlyVisible] = useState(true);
  const [draggedWindow, setDraggedWindow] = useState<WindowInfo | null>(null);

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
        <h3 className="text-base font-semibold text-theme-primary-200 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdMonitor size={18} />
            <span>Available Windows</span>
            {isLoading && (
              <AiOutlineLoading3Quarters
                size={14}
                className="animate-spin text-theme-primary-400"
              />
            )}
          </div>

          {/* Countdown Timer and Manual Refresh */}
          <div className="flex items-center gap-3">
            {countdownTime > 0 && (
              <div className="flex items-center gap-2">
                <CircularCountdown
                  remainingTime={countdownTime}
                  totalTime={totalRefreshTime}
                  size={24}
                  isLoading={isLoading}
                />
                {/* <span className="text-xs text-stone-400">
                  {countdownTime}s
                </span> */}
              </div>
            )}
            {onManualRefresh && (
              <button
                onClick={onManualRefresh}
                className=" rounded-lg bg-transparent hover:scale-105 cursor-pointer hover:rotate-45 duration-100  border border-stone-600/40 text-stone-400 hover:text-theme-primary-400 hover:border-theme-primary-500/50 transition-all"
                title="Refresh now"
              >
                <MdRefresh size={24} />
              </button>
            )}
          </div>
        </h3>

        {/* Search and Filter Controls */}
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <MdSearch
              size={16}
              className="absolute left-3 top-1/2 transform -transtone-y-1/2 text-stone-400"
            />
            <input
              type="text"
              placeholder="Search windows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-800/50 border border-stone-600/40 rounded-lg text-white placeholder-stone-400 focus:border-theme-primary-500/50 focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowOnlyVisible(!showOnlyVisible)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
              showOnlyVisible
                ? "bg-theme-primary-500/20 border border-theme-primary-500/30 text-theme-primary-200"
                : "bg-stone-800/30 border border-stone-600/30 text-stone-400 hover:text-white"
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
          <div className="text-center py-8 text-stone-400">
            <MdMonitor size={48} className="mx-auto mb-3 opacity-50" />
            {searchTerm || !showOnlyVisible ? (
              <>
                <p className="text-sm">No windows match your filters</p>
                <p className="text-xs text-stone-500 mt-1">
                  Try adjusting your search or filter settings
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">No windows available</p>
                <p className="text-xs text-stone-500 mt-1">
                  Open some applications to see them here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            <AnimatePresence mode="popLayout">
              {filteredWindows.map((window, index) => (
                <motion.div
                  key={window.id}
                  initial={{
                    opacity: 0,
                    y: 20,
                    scale: 0.95,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.3,
                    delay: index * 0.05, // Stagger animation
                    ease: "easeOut",
                  }}
                  onClick={(e) => {
                    // Prevent click when dragging or clicking on drag handle
                    if (
                      draggedWindow ||
                      (e.target as HTMLElement).closest('[draggable="true"]')
                    ) {
                      e.preventDefault();
                      return;
                    }
                    onWindowSelect(window.id);
                  }}
                  className={`
                    relative overflow-hidden transition-all duration-500 
                    flex items-center gap-3 pl-8 pr-8 py-2 rounded-2xl group hover:scale-[1.02] hover:-transtone-y-1
                    cursor-pointer
                    ${
                      draggedWindow?.id === window.id
                        ? "opacity-50 scale-95"
                        : ""
                    }
                    ${
                      window.isSelected
                        ? `
                          bg-gradient-to-br from-theme-primary-500/30 via-theme-primary-500/20 to-theme-primary-500/30
                          border border-theme-primary-400/50 shadow shadow-theme-primary-500/25
                          backdrop-blur-lg before:absolute before:inset-0 
                          before:bg-gradient-to-br before:from-white/10 before:to-transparent before:rounded-2xl
                        `
                        : `
                          
                          border border-solid  border-theme-primary-200/10 hover:border-theme-primary-400/40
                          backdrop-blur-md bg-gradient-to-br from-theme-primary-900/20 via-theme-primary-800/15 to-stone-700/25
                        
                          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent 
                          before:rounded-2xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                        `
                    }
                  `}
                >
                  {/* Drag Handle - Left side with dotted grip icon */}
                  <div
                    draggable="true"
                    onDragStart={(e: React.DragEvent) => {
                      const dragData = {
                        windowId: window.id,
                        windowInfo: JSON.stringify(window),
                      };
                      e.dataTransfer.setData(
                        "text/plain",
                        JSON.stringify(dragData)
                      );
                      e.dataTransfer.effectAllowed = "copy";
                      setDraggedWindow(window);
                      onWindowDragStart?.(window);
                    }}
                    onDragEnd={() => {
                      setDraggedWindow(null);
                      onWindowDragEnd?.();
                    }}
                    className={`
                      absolute left-0 top-0 w-6 h-full 
                      flex items-center justify-center
                      cursor-grab active:cursor-grabbing
                      transition-all duration-200
                      hover:bg-white/10 active:bg-white/20
                      border-r border-stone-600/30 hover:border-theme-primary-400/50
                      backdrop-blur-sm
                      ${
                        draggedWindow?.id === window.id
                          ? "cursor-grabbing bg-white/20"
                          : ""
                      }
                    `}
                    title="Drag to reorder or move window"
                  >
                    {/* Dotted grip icon */}
                    <div className="flex flex-col gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Magical shimmer effect */}
                  <div
                    className="
                    absolute inset-0 opacity-0 group-hover:opacity-100
                    bg-gradient-to-r from-transparent via-white/10 to-transparent
                    transform -skew-x-12 transtone-x-[-100%] group-hover:transtone-x-[200%] 
                    transition-all duration-1000 ease-out
                  "
                  />

                  {/* App Icon with glow effect */}
                  <div className="relative flex-shrink-0 w-10 h-10 flex items-center justify-center z-10">
                    <div
                      className={`
                    absolute inset-0 rounded-lg bg-gradient-to-br opacity-20 group-hover:opacity-40 transition-opacity duration-300
                    ${
                      window.isSelected
                        ? "from-theme-primary-400 to-theme-primary-500"
                        : "from-stone-500 to-stone-600"
                    }
                  `}
                    />
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      {window.icon ? (
                        // Use actual app icon from desktopCapturer
                        <img
                          src={window.icon}
                          alt={`${window.app} icon`}
                          className="w-10 h-10 object-contain "
                          style={{
                            filter: "contrast(1.2) brightness(1.1) ",
                          }}
                          onError={(e) => {
                            console.warn(
                              `Failed to load native icon for ${window.app}, falling back to React icon`
                            );
                            // Fallback to React icon if image fails to load
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      {/* Fallback React icon - shown if no native icon or if image fails */}
                      <div
                        style={{ display: window.icon ? "none" : "flex" }}
                        className="w-full h-full items-center justify-center"
                        title={
                          window.hasNativeIcon === false
                            ? "No native icon available"
                            : "Using fallback icon"
                        }
                      >
                        {getAppIcon(window.app, 24)}
                      </div>
                    </div>
                  </div>

                  {/* App Content */}
                  <div className="flex-1 min-w-0 relative z-10 font-mono">
                    {/* Window State Indicators */}
                    <div className="flex items-center gap-1 mb-1">
                      {window.isMinimized && (
                        <span className="text-yellow-300 text-xs px-2 py-0.5 bg-gradient-to-r from-yellow-500/30 to-amber-500/20 rounded-full border border-yellow-400/30 backdrop-blur-sm">
                          MIN
                        </span>
                      )}
                      {window.isMaximized && (
                        <span className="text-green-300 text-xs px-2 py-0.5 bg-gradient-to-r from-green-500/30 to-blue-500/20 rounded-full border border-green-400/30 backdrop-blur-sm">
                          MAX
                        </span>
                      )}
                      {window.processId && (
                        <span className="text-stone-300 text-xs opacity-70">
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
                    <div className="text-xs font-sans text-stone-300 truncate mt-1 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                      {window.name}
                    </div>

                    {/* Window Dimensions (if available) */}
                    {window.bounds && (
                      <div className="text-xs text-stone-400 mt-1 opacity-60">
                        {window.bounds.width}×{window.bounds.height}
                      </div>
                    )}
                  </div>

                  {/* Select/Check Handle - Right side */}
                  <div
                    className={`
                      absolute right-0 top-0 w-6 h-full 
                      flex items-center justify-center
                      transition-all duration-200
                      border-l border-stone-600/30 hover:border-theme-primary-400/50
                      backdrop-blur-sm
                      ${
                        window.isSelected
                          ? "opacity-100 bg-theme-primary-500/20 hover:bg-theme-primary-500/30"
                          : "opacity-0 group-hover:opacity-100 hover:bg-white/10"
                      }
                    `}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card selection
                        onWindowSelect(window.id);
                      }}
                      className={`
                        w-4 h-4 rounded-md flex items-center justify-center
                        transition-all duration-200
                        ${
                          window.isSelected
                            ? " hover:bg-theme-primary-400 text-white scale-100"
                            : " hover:bg-theme-primary-500 text-white hover:scale-110"
                        }
                      `}
                      title={
                        window.isSelected
                          ? "Remove from selection"
                          : "Add to selection"
                      }
                    >
                      {window.isSelected ? (
                        <MdCheck size={14} />
                      ) : (
                        <MdAdd size={14} />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
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
