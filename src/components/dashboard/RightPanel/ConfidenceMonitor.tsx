import React, { useCallback, useEffect, useRef, useState } from "react";
import { Monitor, Minimize2, Maximize2, Camera } from "lucide-react";
import { LiveWindowGrid } from "../LiveWindowGrid";
import { type WindowInfo } from "../WindowList";
import { useAppSelector } from "@/store/hooks";

interface ConfidenceMonitorProps {
  selectedWindows: WindowInfo[];
}

/**
 * Confidence Monitor — a small inline preview showing exactly what is
 * being projected to the audience.  Uses the same LiveWindowGrid
 * component at a reduced resolution so the operator can see the output
 * without switching to the projection window.
 *
 * Includes a "Snapshot" toggle that uses webContents.capturePage() to
 * show a pixel-accurate screenshot of the actual projection window,
 * refreshed every 2 seconds.
 *
 * Reads projection state (isProjectionOn, isBlackout, isFrozen,
 * overlayText, overlayVisible) directly from the Redux store.
 */
export const ConfidenceMonitor: React.FC<ConfidenceMonitorProps> = ({
  selectedWindows,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [snapshotMode, setSnapshotMode] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Read all projection state from Redux — no prop drilling
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const isBlackout = useAppSelector((s) => s.app.isBlackout);
  const isFrozen = useAppSelector((s) => s.app.isFrozen);
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);

  const captureSnapshot = useCallback(async () => {
    try {
      const result = await window.electronAPI.captureProjectionPage();
      if (result.success && result.dataUrl) {
        setSnapshotUrl(result.dataUrl);
      }
    } catch {
      // silently ignore — projection may not be active
    }
  }, []);

  // Periodic capture when snapshot mode is active
  useEffect(() => {
    if (!snapshotMode || !isProjectionOn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    // Capture immediately, then every 2s
    captureSnapshot();
    intervalRef.current = setInterval(captureSnapshot, 2000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [snapshotMode, isProjectionOn, captureSnapshot]);

  if (!isProjectionOn || selectedWindows.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-white/20 gap-3 px-5">
        <Monitor className="w-12 h-12 opacity-30" />
        <p className="text-[12px] text-center">
          Start a projection to see the confidence monitor preview.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar text-white">
      <div className="px-5 pt-5 pb-10 max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white tracking-tight">
            Confidence Monitor
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSnapshotMode((p) => !p)}
              className={`p-1.5 rounded-lg transition-all ${
                snapshotMode
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-white/30 hover:text-white/60 hover:bg-white/[0.04]"
              }`}
              title={
                snapshotMode
                  ? "Switch to live grid"
                  : "Switch to pixel-accurate snapshot"
              }
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              title={expanded ? "Shrink preview" : "Expand preview"}
            >
              {expanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Live preview */}
        <div
          className={`relative rounded-xl overflow-hidden border border-white/[0.06] bg-black transition-all duration-300 ${
            expanded ? "aspect-video" : "aspect-video max-h-[240px]"
          }`}
        >
          {/* Blackout overlay */}
          {isBlackout && (
            <div className="absolute inset-0 z-20 bg-black flex items-center justify-center">
              <span className="text-white/30 text-xs uppercase tracking-wider">
                Blackout
              </span>
            </div>
          )}

          {/* Text overlay */}
          {overlayVisible && overlayText && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/70 text-white text-center py-1.5 px-3 text-[11px] font-medium">
              {overlayText}
            </div>
          )}

          {snapshotMode && snapshotUrl ? (
            <img
              src={snapshotUrl}
              alt="Projection snapshot"
              className="w-full h-full object-contain"
              draggable={false}
            />
          ) : (
            <LiveWindowGrid
              windows={selectedWindows}
              className="w-full h-full"
              isFrozen={isFrozen}
            />
          )}

          {/* Status badges */}
          <div className="absolute top-2 left-2 z-10 flex gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest text-white ${
                snapshotMode ? "bg-emerald-500/80" : "bg-red-500/80"
              }`}
            >
              {snapshotMode ? "Snapshot" : "Live"}
            </span>
            {isFrozen && (
              <span className="px-1.5 py-0.5 rounded bg-cyan-500/80 text-[9px] font-bold uppercase tracking-widest text-white">
                Frozen
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 text-[11px] text-white/25">
          {selectedWindows.length} window
          {selectedWindows.length !== 1 ? "s" : ""} &middot;{" "}
          {snapshotMode
            ? "pixel-accurate snapshot (refreshes every 2s)"
            : "preview of audience view"}
        </div>
      </div>
    </div>
  );
};
