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
  icon?: string; // Base64 encoded icon or icon path (always captured)
  hasNativeIcon?: boolean; // Whether the window has a native app icon available
  thumbnail?: string; // Base64 encoded thumbnail (captured on-demand only - NOT during enumeration)
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
    <div className="h-full flex flex-col p-2">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 mb-2 px-1">
        <h3 className="text-sm font-semibold text-theme-primary-200 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdMonitor size={18} />
            <span className="font-[impact]">Available Windows</span>
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
                className="rounded-lg bg-theme-primary-800/20 hover:bg-theme-primary-700/30 hover:scale-105 cursor-pointer hover:rotate-45 duration-200 border border-theme-primary-600/20 text-theme-primary-300 hover:text-theme-primary-200 hover:border-theme-primary-400/40 transition-all p-1"
                title="Refresh now"
              >
                <MdRefresh size={20} />
              </button>
            )}
          </div>
        </h3>

        {/* Search and Filter Controls */}
        <div className="space-y-2">
          {/* Search Input */}
          <div className="relative">
            <MdSearch
              size={14}
              className="absolute left-2.5 top-1/2 transform -transtone-y-1/2 text-theme-primary-300"
            />
            <input
              type="text"
              placeholder="Search windows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-theme-primary-800/30 border border-theme-primary-600/20 rounded-lg text-theme-primary-100 placeholder-theme-primary-300 focus:border-theme-primary-400/50 focus:bg-theme-primary-800/40 focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowOnlyVisible(!showOnlyVisible)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
              showOnlyVisible
                ? "bg-theme-primary-500/30 border border-theme-primary-400/40 text-theme-primary-100 shadow-sm"
                : "bg-theme-primary-800/20 border border-theme-primary-600/20 text-theme-primary-200 hover:text-theme-primary-100 hover:border-theme-primary-500/30 hover:bg-theme-primary-800/30"
            }`}
          >
            <MdFilterList size={14} />
            <span>Show visible only</span>
          </button>
        </div>

        {error && (
          <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-400/30 flex items-center gap-1.5 text-red-200">
            <MdError size={14} />
            <span className="text-xs">{error}</span>
          </div>
        )}
      </div>

      {/* Scrollable Window List */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-1">
        {filteredWindows.length === 0 && !isLoading ? (
          <div className="text-center py-6 text-stone-400">
            <MdMonitor size={40} className="mx-auto mb-2 opacity-50" />
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
          <div className="space-y-1 pb-2">
            <AnimatePresence mode="popLayout">
              {filteredWindows.map((window, index) => (
                <motion.div
                  key={window.id}
                  initial={{
                    opacity: 0,
                    y: 10,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: -5,
                    scale: 0.98,
                  }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.03,
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
                    relative overflow-hidden transition-all duration-300
                    flex items-center gap-2 pl-6 pr-3 py-2 rounded-xl group hover:scale-[1.01]
                    cursor-pointer
                    ${
                      draggedWindow?.id === window.id
                        ? "opacity-50 scale-95"
                        : ""
                    }
                    ${
                      window.isSelected
                        ? `
                          bg-gradient-to-br from-theme-primary-400/25 via-theme-primary-500/15 to-theme-primary-600/20
                          border border-theme-primary-300/40 shadow-md shadow-theme-primary-500/20
                          backdrop-blur-lg before:absolute before:inset-0 
                          before:bg-gradient-to-br before:from-white/5 before:to-transparent before:rounded-xl
                        `
                        : `
                          
                          border border-solid border-theme-primary-600/15 hover:border-theme-primary-400/30
                          backdrop-blur-md bg-gradient-to-br from-theme-primary-900/15 via-theme-primary-800/10 to-theme-primary-900/20
                        
                          before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/3 before:to-transparent 
                          before:rounded-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                          hover:shadow-sm hover:shadow-theme-primary-500/10
                        `
                    }
                  `}
                >
                  {/* Drag Handle - Left side with dotted grip icon */}
                  <div
                    draggable="true"
                    onDragStart={(e: React.DragEvent) => {
                      e.stopPropagation();

                      // Create drag preview from parent element (the card)
                      const card = e.currentTarget.parentElement;
                      if (card) {
                        const dragPreview = card.cloneNode(true) as HTMLElement;
                        dragPreview.style.position = "absolute";
                        dragPreview.style.top = "-9999px";
                        dragPreview.style.width = card.offsetWidth + "px";
                        dragPreview.style.opacity = "0.7";
                        dragPreview.style.transform = "rotate(-3deg)";
                        dragPreview.style.pointerEvents = "none";
                        document.body.appendChild(dragPreview);

                        e.dataTransfer.setDragImage(
                          dragPreview,
                          card.offsetWidth / 2,
                          card.offsetHeight / 2
                        );

                        // Clean up after drag starts
                        requestAnimationFrame(() => {
                          if (document.body.contains(dragPreview)) {
                            document.body.removeChild(dragPreview);
                          }
                        });
                      }

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

                      console.log("🎯 Drag started:", window.name);
                    }}
                    onDragEnd={() => {
                      setDraggedWindow(null);
                      onWindowDragEnd?.();
                      console.log("🎯 Drag ended");
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className={`
                      absolute left-0 top-0 w-4 h-full z-10
                      flex items-center justify-center
                      cursor-grab active:cursor-grabbing
                      transition-all duration-200
                      hover:bg-theme-primary-400/30 active:bg-theme-primary-500/40
                      border-r border-theme-primary-500/40 hover:border-theme-primary-300/60
                      backdrop-blur-sm rounded-l-xl
                      ${
                        draggedWindow?.id === window.id
                          ? "cursor-grabbing bg-theme-primary-500/40 border-theme-primary-300"
                          : ""
                      }
                    `}
                    title="Drag to add window to layout"
                  >
                    {/* Dotted grip icon */}
                    <div className="flex flex-col gap-0.5 pointer-events-none">
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
                      </div>
                      <div className="flex gap-0.5">
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
                        <div className="w-1 h-1 bg-theme-primary-100 rounded-full"></div>
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
                  <div className="flex-1 min-w-0 relative z-10 font-">
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
                    text-sm font-bold bg-gradient-to-r ${getAppGradient(
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
