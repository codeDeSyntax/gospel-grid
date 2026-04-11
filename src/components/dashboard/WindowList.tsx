import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMonitor,
  MdSearch,
  MdError,
  MdCheck,
  MdPushPin,
  MdDragIndicator,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getWindowFallbackIcon, getAppGradient } from "@/utils/appIconMapping";
import { CircularCountdown } from "@/components/ui/CircularCountdown";
import { DepthButton } from "@/shared/DepthButton";
import { DepthSurface } from "@/shared/DepthSurface";
import { RefreshCcwDot } from "lucide-react";
import { TIMER_FEATURE_WINDOW_PREFIX } from "./RightPanel/featureTimerState";

const CAPTIONS_FEATURE_WINDOW_ID = "feature:captions-window";

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
  onWindowSelect: _onWindowSelect,
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
  const [draggedWindow, setDraggedWindow] = useState<WindowInfo | null>(null);
  const showLoadingSkeleton = isLoading && windows.length === 0;

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

      return true;
    });

    // Pinned windows always appear first
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [windows, searchTerm]);

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
              <div className="relative overflow-hidden rounded-xl border border-theme-primary-400/35 bg-gradient-to-br from-theme-primary-700/45 via-theme-primary-800/40 to-theme-primary-950/60 px-2.5 py-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.45),0_8px_18px_rgba(0,0,0,0.28)]">
                <span className="pointer-events-none absolute inset-x-2 top-[2px] h-1.5 rounded-full blur-[1px] bg-white/20" />
                <span className="pointer-events-none absolute inset-[1px] rounded-[10px] border border-white/10" />
                <div className="relative z-10 flex items-center gap-2">
                  <div className="rounded-full border border-theme-primary-300/30 bg-theme-primary-100 p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]">
                    <CircularCountdown
                      remainingTime={countdownTime}
                      totalTime={totalRefreshTime}
                      size={26}
                      isLoading={isLoading}
                    />
                  </div>
                  <span className="font-[impact] text-[13px] tabular-nums text-theme-primary-100 leading-none tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]">
                    {Math.ceil(countdownTime)}s
                  </span>
                  {onManualRefresh && (
                    <DepthButton
                      onClick={onManualRefresh}
                      sizeClassName="w-8 h-8 py-1 px-1 rounded-xl"
                      title="Refresh now"
                      inactiveClassName="text-theme-primary-100 border-theme-primary-300/45"
                      inactiveSurfaceClassName="bg-gradient-to-br from-theme-primary-600/40 via-theme-primary-700/75 to-theme-primary-900/80"
                      className="active:scale-95 shadow-[inset_0_1px_0_rgba(255,255,255,0.24),inset_0_-1px_0_rgba(0,0,0,0.5),0_10px_20px_rgba(0,0,0,0.3)] p-1 rounded-full"
                    >
                      <RefreshCcwDot
                        size={20}
                        className="transition-transform duration-500 group-hover:rotate-180 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
                      />
                    </DepthButton>
                  )}
                </div>
              </div>
            )}
          </div>
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
        {showLoadingSkeleton ? (
          <div className="space-y-1 pb-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`window-skeleton-${index}`}
                className="relative overflow-hidden rounded-xl border border-theme-primary-600/12 bg-theme-primary-900/12 px-2 py-1.5"
              >
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-theme-primary-300/10 to-transparent" />
                <div className="relative z-10 flex items-center gap-2.5 pl-3 pr-5">
                  <div className="h-8 w-8 rounded-lg border border-theme-primary-500/20 bg-theme-primary-500/18 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 w-28 rounded bg-theme-primary-300/25 animate-pulse" />
                    <div className="h-2 w-40 max-w-[90%] rounded bg-theme-primary-500/20 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredWindows.length === 0 && !isLoading ? (
          <div className="text-center py-6 text-stone-400">
            <MdMonitor size={40} className="mx-auto mb-2 opacity-50" />
            {searchTerm ? (
              <>
                <p className="text-sm">No windows match your filters</p>
                <p className="text-xs text-stone-500 mt-1">
                  Try adjusting your search query
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
              {filteredWindows.map((window, index) => {
                const isCaptionsWindow =
                  window.id === CAPTIONS_FEATURE_WINDOW_ID;
                const isTimerWindow = window.id.startsWith(
                  TIMER_FEATURE_WINDOW_PREFIX,
                );

                return (
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
                    draggable="true"
                    onDragStartCapture={(
                      e: React.DragEvent<HTMLDivElement>,
                    ) => {
                      // Create drag preview from the full card
                      const card = e.currentTarget as HTMLElement;
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

                      requestAnimationFrame(() => {
                        if (document.body.contains(dragPreview)) {
                          document.body.removeChild(dragPreview);
                        }
                      });

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
                    }}
                    onDragEndCapture={() => {
                      setDraggedWindow(null);
                      onWindowDragEnd?.();
                    }}
                    onClick={(e) => {
                      // Prevent click right after drag interactions
                      if (draggedWindow) {
                        e.preventDefault();
                        return;
                      }

                      if (window.handle != null) {
                        onWindowFocus?.(window.handle);
                      }
                    }}
                    className={`
                    relative overflow-hidden transition-all duration-200 border-solid
                    flex items-center gap-2.5 pl-5 pr-8 py-1.5 rounded-xl group
                    cursor-pointer
                    ${draggedWindow?.id === window.id ? "opacity-50 scale-95" : ""}
                    ${
                      isCaptionsWindow
                        ? "border border-theme-primary-300/45 bg-[radial-gradient(ellipse_at_20%_0%,rgba(var(--theme-primary-300),0.26),transparent_55%),radial-gradient(ellipse_at_80%_100%,rgba(var(--theme-primary-500),0.22),transparent_55%),linear-gradient(130deg,rgba(8,10,18,0.95),rgba(var(--theme-primary-900),0.9))] shadow-[0_0_0_1px_rgba(var(--theme-primary-300),0.25),0_0_22px_rgba(var(--theme-primary-400),0.2),inset_0_0_40px_rgba(var(--theme-primary-500),0.18)] hover:border-theme-primary-200/70 hover:shadow-[0_0_0_1px_rgba(var(--theme-primary-300),0.38),0_0_30px_rgba(var(--theme-primary-400),0.3),inset_0_0_55px_rgba(var(--theme-primary-500),0.24)]"
                        : window.isSelected
                          ? "bg-gradient-to-br from-theme-primary-400/20 via-theme-primary-500/10 to-theme-primary-600/18 border border-theme-primary-300/5 shadow-sm shadow-theme-primary-500/15 backdrop-blur-lg"
                          : "border border-theme-primary-600/10 hover:border-theme-primary-400/25 backdrop-blur-md bg-theme-primary-900/10 hover:bg-theme-primary-800/15 hover:shadow-sm hover:shadow-theme-primary-500/8"
                    }
                  `}
                  >
                    {(isCaptionsWindow || isTimerWindow) && (
                      <DepthSurface
                        className="pointer-events-none absolute inset-0 rounded-xl"
                        surfaceClassName="depth-active-surface opacity-20 shadow-none"
                      >
                        <span className="sr-only">
                          {isCaptionsWindow
                            ? "Live captions surface"
                            : "Timer surface"}
                        </span>
                      </DepthSurface>
                    )}

                    {(() => {
                      const hhmmss = window.name.match(
                        /\b\d{1,2}:\d{2}:\d{2}\b/,
                      );
                      const mmss = window.name.match(/\b\d{1,2}:\d{2}\b/);
                      const timerText = hhmmss?.[0] ?? mmss?.[0] ?? window.name;

                      return (
                        <>
                          {/* Drag Handle - Left side with dotted grip icon */}
                          <div
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
                          <div
                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 transition-opacity duration-700 pointer-events-none ${
                              isCaptionsWindow
                                ? "opacity-70 group-hover:opacity-95"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                          />

                          {isCaptionsWindow && (
                            <DepthSurface className="absolute right-8  flex items-center justify-center h-6 py-0 z-20 rounded-full border border-theme-primary-200/45 bg-theme-primary-500 px-2  shadow-[0_0_14px_rgba(var(--theme-primary-300),0.45)]">
                              <span className=" font-semibold uppercase  text-theme-primary-50">
                                Live
                              </span>
                            </DepthSurface>
                          )}

                          {/* Pin Button — absolute, doesn't affect layout */}
                          {!isCaptionsWindow && onWindowPin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onWindowPin(window.id);
                              }}
                              className={`transition-all duration-200 ${
                                window.isPinned
                                  ? "absolute top-1.5 right-7 z-20 p-0.5 rounded opacity-100 text-theme-primary-300 hover:text-theme-primary-200"
                                  : "absolute top-1.5 right-7 z-20 p-0.5 rounded opacity-0 group-hover:opacity-40 text-white/50 hover:!opacity-100 hover:text-theme-primary-400"
                              }`}
                              title={
                                window.isPinned ? "Unpin window" : "Pin to top"
                              }
                            >
                              <MdPushPin
                                size={14}
                                className={
                                  window.isPinned ? "rotate-0" : "rotate-45"
                                }
                              />
                            </button>
                          )}

                          {/* App Icon */}
                          <DepthButton
                            sizeClassName="relative flex-shrink-0 w-8 h-8 rounded-lg z-10 pointer-events-none"
                            className="!cursor-default"
                            active={window.isSelected}
                            inactiveClassName={
                              isCaptionsWindow
                                ? "text-theme-primary-50 border-theme-primary-300/45"
                                : "text-theme-primary-200/85 border-theme-primary-500/25"
                            }
                            activeClassName={
                              isCaptionsWindow
                                ? "text-theme-primary-50 border-theme-primary-200/75"
                                : "text-theme-primary-50 border-theme-primary-300/70"
                            }
                            inactiveSurfaceClassName={
                              isCaptionsWindow
                                ? "bg-gradient-to-br from-theme-primary-500/40 via-theme-primary-400/30 to-theme-primary-700/45"
                                : "bg-gradient-to-br from-theme-primary-900/45 via-theme-primary-800/30 to-theme-primary-900/45"
                            }
                            activeSurfaceClassName={
                              isCaptionsWindow
                                ? "bg-gradient-to-br from-theme-primary-300/90 via-theme-primary-400/95 to-theme-primary-600/92"
                                : "bg-gradient-to-br from-theme-primary-400/90 via-theme-primary-500/95 to-theme-primary-600/90"
                            }
                            aria-hidden
                            tabIndex={-1}
                          >
                            <div className="relative w-8 h-8 flex items-center justify-center pointer-events-none">
                              {window.icon ? (
                                <img
                                  src={window.icon}
                                  alt={`${window.app} icon`}
                                  className="w-6 h-6 object-contain"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                    const fallback = e.currentTarget
                                      .nextElementSibling as HTMLElement;
                                    if (fallback)
                                      fallback.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                style={{
                                  display: window.icon ? "none" : "flex",
                                }}
                                className="w-full h-full items-center justify-center"
                              >
                                {getWindowFallbackIcon(window, 20)}
                              </div>
                            </div>
                          </DepthButton>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0 z-10">
                            {/* App Name */}
                            <div
                              className={`text-xs font-semibold bg-gradient-to-r ${
                                isCaptionsWindow
                                  ? "from-theme-primary-50 via-theme-primary-100 to-theme-primary-200"
                                  : getAppGradient(window.app)
                              } bg-clip-text text-transparent truncate leading-tight`}
                            >
                              {isCaptionsWindow ? "AI Speech" : window.app}
                            </div>
                            {/* Window Title */}
                            {isCaptionsWindow ? (
                              <div className="text-[14px] font-[impact] tracking-[0.11em] uppercase text-theme-primary-50 drop-shadow-[0_0_8px_rgba(var(--theme-primary-300),0.5)] truncate leading-tight transition-colors duration-200 mt-0.5">
                                {window.name}
                              </div>
                            ) : isTimerWindow ? (
                              <div className="text-[27px] font-[impact] tracking-[0.08em] text-white/85 group-hover:text-white truncate leading-none transition-colors duration-200 mt-0.5">
                                {timerText}
                              </div>
                            ) : (
                              <div className="text-[11px] text-white/40 group-hover:text-white/55 truncate leading-tight transition-colors duration-200 mt-0.5">
                                {window.name}
                              </div>
                            )}
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
                              onMouseDown={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 cursor-grab active:cursor-grabbing ${
                                window.isSelected
                                  ? "text-theme-primary-300"
                                  : "text-white/40 hover:text-white/70"
                              }`}
                              title={
                                window.isSelected
                                  ? "Remove from selection"
                                  : "Drag to add window to layout"
                              }
                            >
                              {window.isSelected ? (
                                <MdCheck size={16} />
                              ) : (
                                <MdDragIndicator size={17} />
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </motion.div>
                );
              })}
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
