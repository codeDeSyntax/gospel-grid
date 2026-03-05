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
  MdPushPin,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getAppIcon, getAppGradient } from "@/utils/appIconMapping";
import { CircularCountdown } from "@/components/ui/CircularCountdown";

export interface WindowInfo {
  id: string;
  name: string;
  app: string;
  isSelected: boolean;
  /** Pinned windows always appear at the top of the list */
  isPinned?: boolean;
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
  onWindowPin?: (windowId: string) => void;
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
  onWindowPin,
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
    const filtered = windows.filter((window) => {
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

    // Pinned windows always appear first
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [windows, searchTerm, showOnlyVisible]);

  return (
    <div className="h-full flex flex-col p-2">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 mb-2 px-1 space-y-2">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MdMonitor size={16} className="text-theme-primary-400/80" />
            <span className="font-[impact] text-sm tracking-wide text-theme-primary-200">
              Available Windows
            </span>
            {isLoading && (
              <AiOutlineLoading3Quarters
                size={12}
                className="animate-spin text-theme-primary-400/60"
              />
            )}
          </div>

          {/* Timer + Refresh — gamified */}
          <div className="flex items-center gap-2">
            {countdownTime > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-theme-primary-800/30 border border-theme-primary-600/20">
                <CircularCountdown
                  remainingTime={countdownTime}
                  totalTime={totalRefreshTime}
                  size={26}
                  isLoading={isLoading}
                />
                <span className="font-[impact] text-[13px] tabular-nums text-theme-primary-300/80 leading-none">
                  {Math.ceil(countdownTime)}s
                </span>
              </div>
            )}
            {onManualRefresh && (
              <button
                onClick={onManualRefresh}
                title="Refresh now"
                className="group relative w-8 h-8 flex items-center justify-center rounded-lg bg-theme-primary-800/30 border border-theme-primary-600/20 text-theme-primary-300/70 hover:text-white hover:bg-theme-primary-600/30 hover:border-theme-primary-400/50 hover:shadow-[0_0_10px_rgba(var(--theme-primary-rgb,99,102,241),0.25)] active:scale-95 transition-all duration-200"
              >
                <MdRefresh
                  size={17}
                  className="transition-transform duration-500 group-hover:rotate-180"
                />
              </button>
            )}
          </div>
        </div>

        {/* Search + filter row */}
        <div className="flex items-center gap-1.5">
          {/* Search input */}
          <div className="relative flex-1">
            <MdSearch
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-theme-primary-400/40 pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2.5 py-1.5 text-[11px] bg-theme-primary-500/20 border border-theme-primary-600/15 rounded-lg text-white placeholder-theme-primary-400/35 focus:border-theme-primary-400/40 focus:bg-theme-primary-800/30 focus:outline-none transition-all duration-200"
            />
          </div>

          {/* Visibility filter pill */}
          <button
            onClick={() => setShowOnlyVisible(!showOnlyVisible)}
            title={showOnlyVisible ? "Showing visible only" : "Showing all"}
            className={`flex-shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              showOnlyVisible
                ? "bg-theme-primary-500/20 border border-theme-primary-400/30 text-theme-primary-200"
                : "bg-transparent border border-theme-primary-600/15 text-theme-primary-400/40 hover:text-theme-primary-300/70 hover:border-theme-primary-500/25"
            }`}
          >
            <MdFilterList size={13} />
            <span>Visible</span>
          </button>
        </div>

        {error && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-400/25 flex items-center gap-1.5 text-red-300/80">
            <MdError size={12} />
            <span className="text-[11px]">{error}</span>
          </div>
        )}
      </div>

      {/* Scrollable Window List */}
      <div className="flex-1 overflow-y-scroll no-scrollbar px-1">
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
          <div className="space-y-1 pb-2 ">
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
                    relative overflow-hidden transition-all duration-200 border-solid
                    flex items-center gap-2.5 pl-5 pr-8 py-1.5 rounded-xl group
                    cursor-pointer
                    ${draggedWindow?.id === window.id ? "opacity-50 scale-95" : ""}
                    ${
                      window.isSelected
                        ? "bg-gradient-to-br from-theme-primary-400/20 via-theme-primary-500/10 to-theme-primary-600/18 border border-theme-primary-300/5 shadow-sm shadow-theme-primary-500/15 backdrop-blur-lg"
                        : "border border-theme-primary-600/10 hover:border-theme-primary-400/25 backdrop-blur-md bg-theme-primary-900/10 hover:bg-theme-primary-800/15 hover:shadow-sm hover:shadow-theme-primary-500/8"
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
                          card.offsetHeight / 2,
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
                        JSON.stringify(dragData),
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
                      hover:bg-theme-primary-400/20 active:bg-theme-primary-500/30
                      border-r border-white/[0.04] hover:border-theme-primary-300/30
                      rounded-l-xl
                      ${draggedWindow?.id === window.id ? "cursor-grabbing bg-theme-primary-500/30" : ""}
                    `}
                    title="Drag to add window to layout"
                  >
                    {/* Grip dots */}
                    <div className="flex flex-col gap-[3px] pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-200">
                      <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                      </div>
                      <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                      </div>
                      <div className="flex gap-[3px]">
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="w-[3px] h-[3px] bg-white rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Magical shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 transition-opacity duration-700 pointer-events-none" />

                  {/* Pin Button — absolute, doesn't affect layout */}
                  {onWindowPin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onWindowPin(window.id);
                      }}
                      className={`absolute top-1.5 right-7 z-20 p-0.5 rounded transition-all duration-200 ${
                        window.isPinned
                          ? "opacity-100 text-theme-primary-300 hover:text-theme-primary-200"
                          : "opacity-0 group-hover:opacity-40 text-white/50 hover:!opacity-100 hover:text-theme-primary-400"
                      }`}
                      title={window.isPinned ? "Unpin window" : "Pin to top"}
                    >
                      <MdPushPin
                        size={14}
                        className={window.isPinned ? "rotate-0" : "rotate-45"}
                      />
                    </button>
                  )}

                  {/* App Icon */}
                  <div className="relative flex-shrink-0 w-8 h-8 flex items-center justify-center z-10">
                    <div
                      className={`absolute inset-0 rounded-lg bg-gradient-to-br opacity-15 group-hover:opacity-30 transition-opacity duration-300 ${
                        window.isSelected
                          ? "from-theme-primary-400 to-theme-primary-600"
                          : "from-white/10 to-transparent"
                      }`}
                    />
                    <div className="relative w-8 h-8 flex items-center justify-center">
                      {window.icon ? (
                        <img
                          src={window.icon}
                          alt={`${window.app} icon`}
                          className="w-7 h-7 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const fallback = e.currentTarget
                              .nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: window.icon ? "none" : "flex" }}
                        className="w-full h-full items-center justify-center"
                      >
                        {getAppIcon(window.app, 20)}
                      </div>
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 min-w-0 z-10">
                    {/* App Name */}
                    <div
                      className={`text-xs font-semibold bg-gradient-to-r ${getAppGradient(window.app)} bg-clip-text text-transparent truncate leading-tight`}
                    >
                      {window.app}
                    </div>
                    {/* Window Title */}
                    <div className="text-[11px] text-white/40 group-hover:text-white/55 truncate leading-tight transition-colors duration-200 mt-0.5">
                      {window.name}
                    </div>
                    {/* State pills */}
                    {(window.isMinimized || window.isMaximized) && (
                      <div className="flex items-center gap-1 mt-0.5">
                        {window.isMinimized && (
                          <span className="text-[9px] px-1 py-px bg-yellow-500/20 text-yellow-300/70 rounded border border-yellow-400/20">
                            MIN
                          </span>
                        )}
                        {window.isMaximized && (
                          <span className="text-[9px] px-1 py-px bg-green-500/20 text-green-300/70 rounded border border-green-400/20">
                            MAX
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Select / Check Handle — right side */}
                  <div
                    className={`absolute right-0 top-0 w-7 h-full flex items-center justify-center border-l border-white/[0.04] transition-all duration-200 rounded-r-xl ${
                      window.isSelected
                        ? "opacity-100 bg-theme-primary-500/15 hover:bg-theme-primary-500/25"
                        : "opacity-0 group-hover:opacity-100 hover:bg-white/[0.06]"
                    }`}
                  >
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onWindowSelect(window.id);
                      }}
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center transition-all duration-200 ${
                        window.isSelected
                          ? "text-theme-primary-300"
                          : "text-white/40 hover:text-white/70"
                      }`}
                      title={
                        window.isSelected
                          ? "Remove from selection"
                          : "Add to selection"
                      }
                    >
                      {window.isSelected ? (
                        <MdCheck size={13} />
                      ) : (
                        <MdAdd size={13} />
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
