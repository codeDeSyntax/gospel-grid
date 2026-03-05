import React, { useMemo, useRef } from "react";
import { WindowInfo } from "../dashboard/WindowList";
import { WindowLayoutSkeleton } from "./WindowLayoutSkeleton";
import { SingleWindowLayout } from "./layouts/SingleWindowLayout";
import { DualWindowLayout } from "./layouts/DualWindowLayout";
import { TripleWindowLayout } from "./layouts/TripleWindowLayout";
import { QuadWindowLayout } from "./layouts/QuadWindowLayout";
import { motion } from "framer-motion";

/**
 * PREVIEW PANEL — one-time snapshot approach (debounced).
 *
 * Shows a static thumbnail of selected windows (max 4) so the user can verify
 * their selection before publishing.  Deliberately does NOT use the live
 * MediaStream/getUserMedia path — that is reserved for the projection window
 * (LiveWindowGrid).  Running two concurrent WGC capture sessions for the same
 * window handle causes ProcessFrame errors on Windows.
 *
 * Optimisations:
 * - Single desktopCapturer.getSources() call per batch (not per-window)
 * - 400 ms React-side debounce so rapid select/deselect doesn't spam IPC
 * - Captures are SKIPPED entirely when the projection is live (no WGC contention)
 * - Stable dependency on window-ID string instead of object reference
 */

interface AutoFitWindowLayoutProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd?: (window: WindowInfo) => void;
  maxDisplayWindows?: number;
  /** When true, skip batch captures to avoid WGC contention with live streams */
  isProjectionOn?: boolean;
}

export const AutoFitWindowLayout: React.FC<AutoFitWindowLayoutProps> = ({
  selectedWindows,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  maxDisplayWindows = 4,
  isProjectionOn = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [loadedThumbnails, setLoadedThumbnails] = React.useState<
    Record<string, { dataUrl?: string }>
  >({});
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get display windows with limit
  const displayWindows = useMemo(() => {
    return selectedWindows.slice(0, maxDisplayWindows);
  }, [selectedWindows, maxDisplayWindows]);

  // Stable string key — only changes when the actual window IDs change
  const displayWindowIdKey = useMemo(
    () => displayWindows.map((w) => w.id).join(","),
    [displayWindows],
  );

  // Debounced snapshot capture — skipped entirely when projection is live
  React.useEffect(() => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    // Skip capture entirely when projection is on (live streams are active)
    if (isProjectionOn) return;
    if (displayWindows.length === 0) return;
    if (!window.electronAPI?.batchCaptureThumbnails) return;

    // 400 ms debounce — lets rapid select/deselect settle before firing IPC
    debounceTimerRef.current = setTimeout(async () => {
      const windowIds = displayWindows.map((w) => w.id);
      const options = {
        width: 1920,
        height: 1080,
        scaleFactor: 2.0,
        quality: 100,
        forceRefresh: false, // Use cache when available
      };

      try {
        const result = await window.electronAPI?.batchCaptureThumbnails?.(
          windowIds,
          options,
        );

        if (result?.success && Array.isArray(result.thumbnails)) {
          const newThumbnails: Record<string, { dataUrl?: string }> = {};
          result.thumbnails.forEach((thumbnail: any) => {
            if (thumbnail?.windowId) {
              newThumbnails[thumbnail.windowId] = thumbnail;
            }
          });
          setLoadedThumbnails(newThumbnails);
        }
      } catch (error) {
        console.error("[AutoFitWindowLayout] Batch capture failed:", error);
      }
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    // Depend on the stable ID string, not the object reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayWindowIdKey, isProjectionOn]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (
      rect &&
      (e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom)
    ) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    try {
      const dragDataStr = e.dataTransfer.getData("text/plain");
      const dragData = JSON.parse(dragDataStr);

      if (dragData.windowId && dragData.windowInfo) {
        const windowInfo = JSON.parse(dragData.windowInfo);
        onWindowAdd?.(windowInfo);
      }
    } catch (error) {
      console.error("Error parsing drop data:", error);
    }
  };

  const handleWindowClick = (window: WindowInfo) => {
    onWindowFocus(window.id);
  };

  // Render individual window with static snapshot thumbnail
  const renderWindow = (window: WindowInfo, style: React.CSSProperties) => {
    const thumbnail = loadedThumbnails[window.id];

    return (
      <motion.div
        key={window.id}
        className="relative group cursor-pointer border-solid border-[6px] border-theme-primary-600 hover:border-theme-primary-400/60 overflow-hidden transition-all duration-200 bg-theme-primary-600/40 backdrop-blur-sm w-[50%]"
        style={style}
        onClick={() => handleWindowClick(window)}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
      >
        {/* Static snapshot thumbnail */}
        {thumbnail?.dataUrl ? (
          <img
            src={thumbnail.dataUrl}
            alt={window.name}
            className="w-full h-full object-contain"
            style={{ imageRendering: "-webkit-optimize-contrast" }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-theme-primary-800/50">
            <div className="text-theme-primary-200 text-center p-4">
              <div className="text-2xl mb-2">🖥️</div>
              <div className="text-sm font-medium text-theme-primary-100">
                {window.app}
              </div>
              <div className="text-xs opacity-75 text-theme-primary-300">
                {window.name}
              </div>
            </div>
          </div>
        )}

        {/* Window info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-theme-primary-950/90 to-transparent p-2">
          <div className="text-theme-primary-100 text-xs font-medium truncate">
            {window.app}
          </div>
          <div className="text-theme-primary-200 text-xs truncate">
            {window.name}
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onWindowRemove(window.id);
          }}
          className="absolute top-2 right-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm border border-red-400/30 hover:border-red-300/50"
        >
          ×
        </button>
      </motion.div>
    );
  };

  // Render appropriate layout based on window count
  const renderLayout = () => {
    switch (displayWindows.length) {
      case 1:
        return (
          <SingleWindowLayout
            window={displayWindows[0]}
            renderWindow={renderWindow}
          />
        );
      case 2:
        return (
          <DualWindowLayout
            windows={[displayWindows[0], displayWindows[1]]}
            renderWindow={renderWindow}
          />
        );
      case 3:
        return (
          <TripleWindowLayout
            windows={[displayWindows[0], displayWindows[1], displayWindows[2]]}
            renderWindow={renderWindow}
          />
        );
      case 4:
        return (
          <QuadWindowLayout
            windows={[
              displayWindows[0],
              displayWindows[1],
              displayWindows[2],
              displayWindows[3],
            ]}
            renderWindow={renderWindow}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-[98%] m-auto h-[95%] rounded-lg border transition-all duration-200 overflow-hidden relative ${
        isDragOver
          ? "border-theme-primary-400 border-2 border-dashed bg-theme-primary-500/10"
          : "border-theme-primary-600/30 bg-theme-primary-950/20"
      }`}
    >
      {/* Drag Over Indicator */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-theme-primary-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none">
          <div className="bg-theme-primary-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-medium">
            Drop window here to add to layout
          </div>
        </div>
      )}

      {displayWindows.length === 0 ? (
        <WindowLayoutSkeleton columns={2} rows={2} />
      ) : (
        <>
          {renderLayout()}

          {/* Window count indicator */}
          {selectedWindows.length > maxDisplayWindows && (
            <div className="absolute bottom-2 right-2 bg-theme-primary-600/90 backdrop-blur-sm text-theme-primary-100 px-3 py-1.5 rounded-lg text-xs font-medium border border-theme-primary-400/30">
              Showing {maxDisplayWindows} of {selectedWindows.length} windows
            </div>
          )}
        </>
      )}
    </div>
  );
};
