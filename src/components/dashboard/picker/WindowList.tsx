import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MdMonitor,
  MdError,
  MdCheck,
  MdPushPin,
  MdDragIndicator,
} from "react-icons/md";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { getWindowFallbackIcon } from "@/utils/appIconMapping";
import { DepthButton } from "@/shared/DepthButton";
import { DepthSurface } from "@/shared/DepthSurface";
import { RefreshCcwDot, ShieldAlert, Sparkles } from "lucide-react";
import { TIMER_FEATURE_WINDOW_PREFIX } from "../RightPanel/featureTimerState";
import { useAppSelector } from "@/store/hooks";
import {
  classifyWindow,
  sortWindowsByIntelligence,
  type WindowIntelligenceResult,
} from "@/utils/windowIntelligence";

const CAPTIONS_FEATURE_WINDOW_ID = "feature:captions-window";

const getIntelligenceBadgeClasses = (
  intel: WindowIntelligenceResult,
  tag: string,
  isLightMode: boolean,
) => {
  if (intel.riskLevel === "high" || intel.recommendation === "avoid") {
    return isLightMode
      ? "border-primary-700/45 bg-primary-100/90 text-primary-950"
      : "border-primary-300/35 bg-primary-500/18 text-primary-100";
  }

  if (tag === "Recommended") {
    return isLightMode
      ? "border-primary-700/45 bg-primary-200/90 text-primary-950"
      : "border-primary-300/45 bg-primary-500/24 text-primary-50";
  }

  if (intel.riskLevel === "medium") {
    return isLightMode
      ? "border-primary-700/35 bg-primary-50 text-primary-900"
      : "border-primary-400/30 bg-primary-700/18 text-primary-100";
  }

  return isLightMode
    ? "border-primary-700/25 bg-primary-50/85 text-primary-900"
    : "border-primary-400/25 bg-primary-900/28 text-primary-100";
};

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
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const isLightMode = !isDarkMode;
  const intelligenceByWindowId = useMemo(() => {
    return new Map(
      windows.map((window) => [window.id, classifyWindow(window)]),
    );
  }, [windows]);
  const selectedRiskWindows = useMemo(
    () =>
      windows.filter((window) => {
        if (!window.isSelected) return false;
        const intel = intelligenceByWindowId.get(window.id);
        return intel?.riskLevel === "medium" || intel?.riskLevel === "high";
      }),
    [windows, intelligenceByWindowId],
  );

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

    return sortWindowsByIntelligence(
      filtered,
      (window) =>
        intelligenceByWindowId.get(window.id) ?? classifyWindow(window),
    );
  }, [windows, searchTerm, intelligenceByWindowId]);

  return (
    <div className="h-full flex flex-col p-2 py-4">
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
              <div className="flex h-8 items-center gap-1.5 rounded-full bg-theme-primary-900 px-1.5 text-theme-primary-200">
                <span className="relative flex h-6 w-6 items-center justify-center">
                  <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="rgb(var(--theme-primary-700) / 0.72)"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      fill="none"
                      stroke="rgb(var(--primary-500))"
                      strokeLinecap="round"
                      strokeWidth="2"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        9 *
                        (1 -
                          Math.max(
                            0,
                            Math.min(1, countdownTime / totalRefreshTime),
                          ))
                      }`}
                    />
                  </svg>
                  {isLoading && (
                    <AiOutlineLoading3Quarters
                      size={11}
                      className="absolute animate-spin text-primary-500"
                    />
                  )}
                </span>
                <span className="w-7 text-right text-[11px] font-semibold tabular-nums leading-none text-theme-primary-100">
                  {Math.ceil(countdownTime)}s
                </span>
                {onManualRefresh && (
                  <button
                    type="button"
                    onClick={onManualRefresh}
                    title="Refresh now"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-theme-primary-200 transition-colors hover:bg-theme-primary-800 hover:text-primary-400"
                  >
                    <RefreshCcwDot
                      size={15}
                      className="transition-transform duration-300 hover:rotate-180"
                    />
                  </button>
                )}
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

        {selectedRiskWindows.length > 0 && (
          <div
            className={`rounded-2xl border border-solid px-2 py-1.5 ${
              isLightMode
                ? "border-primary-700/25 bg-primary-50/85 text-primary-950"
                : "border-primary-400/20 bg-primary-900/20 text-primary-100"
            }`}
          >
            <div className="flex items-start gap-1.5">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="text-[11px] leading-snug">
                Privacy check: {selectedRiskWindows.length} selected window
                {selectedRiskWindows.length === 1 ? "" : "s"} may expose
                sensitive content.
              </p>
            </div>
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
                className="relative overflow-hidden rounded-xl ring-1 ring-theme-primary-600/12 bg-theme-primary-900/12 px-2 py-1.5"
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
          <div className="text-center py-6 text-theme-primary-300/80">
            <MdMonitor size={40} className="mx-auto mb-2 opacity-50" />
            {searchTerm ? (
              <>
                <p className="text-sm">No windows match your filters</p>
                <p className="text-xs text-theme-primary-300/60 mt-1">
                  Try adjusting your search query
                </p>
              </>
            ) : (
              <>
                <p className="text-sm">No windows available</p>
                <p className="text-xs text-theme-primary-300/60 mt-1">
                  Open some applications to see them here
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1.5 pb-2 ">
            <AnimatePresence mode="popLayout">
              {filteredWindows.map((window, index) => {
                const isCaptionsWindow =
                  window.id === CAPTIONS_FEATURE_WINDOW_ID;
                const isTimerWindow = window.id.startsWith(
                  TIMER_FEATURE_WINDOW_PREFIX,
                );
                const intelligence =
                  intelligenceByWindowId.get(window.id) ??
                  classifyWindow(window);
                const hasPrivacyWarning =
                  intelligence.riskLevel === "medium" ||
                  intelligence.riskLevel === "high";

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
                    relative overflow-hidden border-1  border-solid transition-all duration-200
                    flex items-center gap-2.5 pl-5 pr-8  py-0.5 rounded-full group
                    cursor-pointer
                    ${draggedWindow?.id === window.id ? "opacity-50 scale-95" : ""}
                    ${
                      isCaptionsWindow
                        ? "border-theme-primary-600/25 backdrop-blur-md hover:border-theme-primary-400/35 hover:bg-theme-primary-300/12 hover:shadow-sm hover:shadow-theme-primary-500/8 bg-gradient-to-br from-theme-primary-400/20 via-theme-primary-500/10 to-theme-primary-600/18"
                        : window.isSelected
                          ? "border-theme-primary-300/35 border-dotted bg-gradient-to-br from-theme-primary-400/20 via-theme-primary-500/10 to-theme-primary-600/18 shadow-sm shadow-theme-primary-500/15 backdrop-blur-lg"
                          : "border-theme-primary-600/25 backdrop-blur-md hover:border-theme-primary-400/35 hover:bg-theme-primary-300/12 hover:shadow-sm hover:shadow-theme-primary-500/8 bg-gradient-to-br from-theme-primary-400/20 via-theme-primary-500/10 to-theme-primary-600/18 "
                    }
                  `}
                  >
                    {(isCaptionsWindow || isTimerWindow) && (
                      <DepthSurface
                        className="pointer-events-none absolute rounded-xl"
                        surfaceClassName="depth-active-surface opacity-10 shadow-none"
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
                      border-r border-theme-primary-50/10 hover:border-theme-primary-300/30
                      rounded-l-xl
                      ${draggedWindow?.id === window.id ? "cursor-grabbing bg-theme-primary-500/30" : ""}
                    `}
                            title="Drag to add window to layout"
                          >
                            {/* Grip dots */}
                            <div className="flex flex-col gap-[3px] pointer-events-none opacity-30 group-hover:opacity-60 transition-opacity duration-200">
                              <div className="flex gap-[3px]">
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                              </div>
                              <div className="flex gap-[3px]">
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                              </div>
                              <div className="flex gap-[3px]">
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                                <div className="w-[3px] h-[3px] bg-theme-primary-200 rounded-full"></div>
                              </div>
                            </div>
                          </div>

                          {/* Magical shimmer effect */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-r from-transparent via-theme-primary-50/10 to-transparent -skew-x-12 transition-opacity duration-700 pointer-events-none ${
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
                                  : "absolute top-1.5 right-7 z-20 p-0.5 rounded opacity-0 group-hover:opacity-40 text-theme-primary-300/70 hover:!opacity-100 hover:text-theme-primary-400"
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
                            sizeClassName="relative flex-shrink-0 w-10 h-10 rounded-full z-10 pointer-events-none"
                            className="!cursor-default"
                            active={window.isSelected}
                            inactiveClassName={
                              isCaptionsWindow
                                ? "text-primary-50 border-primary-300/45"
                                : "text-primary-200/90 border-primary-500/30"
                            }
                            activeClassName={
                              isCaptionsWindow
                                ? "text-primary-50 border-primary-200/75"
                                : "text-primary-50 border-primary-300/70"
                            }
                            inactiveSurfaceClassName={
                              isCaptionsWindow
                                ? "bg-gradient-to-br from-primary-500/45 via-primary-400/28 to-primary-700/45"
                                : "bg-gradient-to-br from-primary-900/45 via-primary-700/25 to-primary-900/45"
                            }
                            activeSurfaceClassName={
                              isCaptionsWindow
                                ? "bg-gradient-to-br from-primary-300/90 via-primary-400/95 to-primary-600/92"
                                : "bg-gradient-to-br from-primary-400/90 via-primary-500/95 to-primary-600/90"
                            }
                            aria-hidden
                            tabIndex={-1}
                          >
                            <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full pointer-events-none">
                              {window.icon ? (
                                <img
                                  src={window.icon}
                                  alt={`${window.app} icon`}
                                  className="h-9 w-9 object-contain"
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
                                {getWindowFallbackIcon(window, 24)}
                              </div>
                            </div>
                          </DepthButton>

                          {/* Text Content */}
                          <div className="flex-1 min-w-0 z-10">
                            {/* App Name */}
                            <div
                              className={`truncate text-xs font-normal leading-tight ${
                                isLightMode
                                  ? "text-primary-900"
                                  : isCaptionsWindow
                                    ? "text-primary-100"
                                    : "text-primary-100"
                              }`}
                            >
                              {isCaptionsWindow ? "AI Speech" : window.app}
                            </div>
                            {/* Window Title */}
                            {isCaptionsWindow ? (
                              <div
                                className={`text-[14px] font-[impact] tracking-[0.11em] uppercase truncate leading-tight transition-colors duration-200 mt-0.5 ${
                                  isLightMode
                                    ? "text-primary-950"
                                    : "text-primary-50 drop-shadow-[0_0_8px_rgba(var(--primary-300),0.35)]"
                                }`}
                              >
                                {window.name}
                              </div>
                            ) : isTimerWindow ? (
                              <div
                                className={`text-[26px] tabular-nums truncate leading-none transition-colors duration-200 mt-0.5 ${
                                  isLightMode
                                    ? "font-thin tracking-[0.03em] text-primary-950 group-hover:text-primary-900"
                                    : "font-[impact] tracking-[0.08em] text-primary-400 group-hover:text-primary-100"
                                }`}
                                style={{ opacity: isLightMode ? 0.96 : 0.9 }}
                              >
                                {timerText}
                              </div>
                            ) : (
                              <div className="mt-0.5 flex min-w-0 items-center gap-1.5">
                                <span
                                  className={`min-w-0 truncate font-thin text-[11px] leading-tight transition-colors duration-200 ${
                                    isLightMode
                                      ? "text-primary-950 group-hover:text-primary-900"
                                      : "text-white group-hover:text-primary-100"
                                  }`}
                                  style={{
                                    opacity: isLightMode ? 0.82 : 0.72,
                                  }}
                                >
                                  {window.name}
                                </span>
                                {intelligence.tags.length > 0 && (
                                  <span className="flex min-w-0 shrink-0 items-center gap-1">
                                    {intelligence.tags
                                      .slice(0, 2)
                                      .map((tag) => (
                                        <span
                                          key={`${window.id}-${tag}`}
                                          className={`inline-flex max-w-[86px] items-center gap-1 truncate rounded-full border border-solid px-1.5 py-px text-[8px] font-semibold uppercase tracking-[0.1em] shadow-sm ${getIntelligenceBadgeClasses(
                                            intelligence,
                                            tag,
                                            isLightMode,
                                          )}`}
                                          title={
                                            hasPrivacyWarning
                                              ? intelligence.warnings.join(" ")
                                              : intelligence.reasons.join(" ")
                                          }
                                        >
                                          {tag === "Recommended" ? (
                                            <Sparkles className="h-2.5 w-2.5 shrink-0" />
                                          ) : hasPrivacyWarning ? (
                                            <ShieldAlert className="h-2.5 w-2.5 shrink-0" />
                                          ) : null}
                                          <span className="truncate">
                                            {tag}
                                          </span>
                                        </span>
                                      ))}
                                  </span>
                                )}
                              </div>
                            )}
                            {/* State pills */}
                            {(window.isMinimized || window.isMaximized) && (
                              <div className="flex items-center gap-1 mt-0.5">
                                {window.isMinimized && (
                                  <span
                                    className={`rounded border px-1 py-px text-[9px] ${
                                      isLightMode
                                        ? "border-primary-700/25 bg-primary-50/85 text-primary-900"
                                        : "border-primary-400/20 bg-primary-900/24 text-primary-100/80"
                                    }`}
                                  >
                                    MIN
                                  </span>
                                )}
                                {window.isMaximized && (
                                  <span
                                    className={`rounded border px-1 py-px text-[9px] ${
                                      isLightMode
                                        ? "border-primary-700/25 bg-primary-100/85 text-primary-950"
                                        : "border-primary-400/25 bg-primary-700/20 text-primary-100"
                                    }`}
                                  >
                                    MAX
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {false &&
                            !isCaptionsWindow &&
                            !isTimerWindow &&
                            intelligence.tags.length > 0 && (
                              <div className="pointer-events-none absolute bottom-1 right-8 z-20 flex max-w-[46%] items-center justify-end gap-1">
                                {intelligence.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={`${window.id}-${tag}`}
                                    className={`inline-flex min-w-0 max-w-[110px] items-center gap-1 truncate rounded-full border border-solid px-1.5 py-px text-[8px] font-semibold uppercase tracking-[0.1em] shadow-sm ${getIntelligenceBadgeClasses(
                                      intelligence,
                                      tag,
                                      isLightMode,
                                    )}`}
                                    title={
                                      hasPrivacyWarning
                                        ? intelligence.warnings.join(" ")
                                        : intelligence.reasons.join(" ")
                                    }
                                  >
                                    {tag === "Recommended" ? (
                                      <Sparkles className="h-2.5 w-2.5 shrink-0" />
                                    ) : hasPrivacyWarning ? (
                                      <ShieldAlert className="h-2.5 w-2.5 shrink-0" />
                                    ) : null}
                                    <span className="truncate">{tag}</span>
                                  </span>
                                ))}
                              </div>
                            )}

                          {/* Select / Check Handle — right side */}
                          <div
                            className={`absolute right-0 top-0 w-7 h-full flex items-center justify-center border-l border-theme-primary-50/10 transition-all duration-200 rounded-r-xl ${
                              window.isSelected
                                ? "opacity-100 bg-theme-primary-500/15 hover:bg-theme-primary-500/25"
                                : "opacity-0 group-hover:opacity-100 hover:bg-theme-primary-50/10"
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
                                  : "text-theme-primary-300/70 hover:text-theme-primary-200"
                              }`}
                              title={
                                window.isSelected
                                  ? "Remove from selection"
                                  : "Drag to add window to layout"
                              }
                            >
                              {window.isSelected ? (
                                <img
                                  src="./checkmark.png"
                                  className="h-6 w-6"
                                />
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
