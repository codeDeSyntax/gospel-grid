import React, { useRef, useMemo } from "react";
import { WindowInfo } from "./WindowList";
import { useAppSelector } from "@/store/hooks";
import { useMediaStreams } from "@/hooks/useMediaStreams";
import { VideoWindow } from "./VideoWindow";
import { SingleWindowLayoutLive } from "./layouts/live/SingleWindowLayoutLive";
import { DualWindowLayoutLive } from "./layouts/live/DualWindowLayoutLive";
import { TripleWindowLayoutLive } from "./layouts/live/TripleWindowLayoutLive";
import { QuadWindowLayoutLive } from "./layouts/live/QuadWindowLayoutLive";

/**
 * PERFORMANCE ARCHITECTURE — GPU-ACCELERATED VIDEO PIPELINE
 *
 * OLD path (removed):
 *   desktopCapturer.getSources() → NativeImage → .toDataURL() → IPC →
 *   React setState → <img src={base64}> — ~300-500 ms latency, ~10 FPS
 *
 * NEW path:
 *   navigator.mediaDevices.getUserMedia({ chromeMediaSourceId }) →
 *   MediaStream → <video srcObject> — ~50-100 ms latency, 30-60 FPS
 *
 * Why this is faster:
 *   1. Frames never leave the GPU — no CPU readback, no base64 encoding
 *   2. No IPC transfer — stream lives inside the renderer process
 *   3. No React re-renders per frame — <video> paints via browser compositor
 *   4. Event-driven frame delivery — not timer-based polling
 */

interface LiveWindowGridProps {
  windows: WindowInfo[];
  className?: string;
  layoutId?: string;
  isFrozen?: boolean;
}

export function LiveWindowGrid({
  windows,
  className = "",
  layoutId,
  isFrozen = false,
}: LiveWindowGridProps) {
  const publishedQuality = useAppSelector(
    (state) => state.app.publishedQuality,
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // ── Window selection (max 4) ───────────────────────────────────────────
  const displayWindows = useMemo(() => windows.slice(0, 4), [windows]);

  const gridConfig = useMemo(() => {
    const count = displayWindows.length;
    if (count === 0)
      return { type: "empty" as const, windows: [] as WindowInfo[] };
    if (count === 1)
      return { type: "single" as const, windows: displayWindows };
    if (count === 2) return { type: "dual" as const, windows: displayWindows };
    if (count === 3)
      return { type: "triple" as const, windows: displayWindows };
    return { type: "quad" as const, windows: displayWindows.slice(0, 4) };
  }, [displayWindows]);

  const { type, windows: gridWindows } = gridConfig;

  // ── MediaStream hook — one live GPU stream per window ──────────────────
  const sourceIds = useMemo(() => gridWindows.map((w) => w.id), [gridWindows]);

  // Adjust resolution per layout density
  const streamOptions = useMemo(() => {
    switch (type) {
      case "single":
        return { maxWidth: 1920, maxHeight: 1080, maxFrameRate: 60 };
      case "dual":
        return { maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 };
      case "triple":
        return { maxWidth: 1280, maxHeight: 720, maxFrameRate: 30 };
      case "quad":
        return { maxWidth: 1280, maxHeight: 720, maxFrameRate: 30 };
      default:
        return { maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 };
    }
  }, [type]);

  const { streams, statuses } = useMediaStreams(sourceIds, streamOptions);

  // ── Empty state ────────────────────────────────────────────────────────
  if (gridWindows.length === 0) {
    return (
      <div
        className={`${className} flex items-center justify-center h-full text-white bg-black`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">📺</div>
          <div className="text-2xl font-bold text-theme-primary-200">
            No Windows Selected
          </div>
          <div className="text-lg opacity-75 text-theme-primary-300">
            Select windows to display in published layout
          </div>
        </div>
      </div>
    );
  }

  // ── Render a single window cell (VideoWindow instead of <img>) ─────────
  const renderWindow = (win: WindowInfo, customStyle?: React.CSSProperties) => {
    const stream = streams[win.id] || null;
    const status = statuses[win.id] || "pending";
    const isSingle = type === "single";

    return (
      <div
        key={win.id}
        className="relative overflow-hidden bg-black"
        style={{
          ...customStyle,
        }}
      >
        <VideoWindow
          stream={stream}
          status={status}
          windowName={win.name}
          appName={win.app}
          contrast={publishedQuality.contrast}
          brightness={publishedQuality.brightness}
          objectFit="contain"
          isSingleWindow={isSingle}
          isFrozen={isFrozen}
          className="w-full h-full"
        />
      </div>
    );
  };

  // ── Layout dispatch ────────────────────────────────────────────────────
  const renderLayout = () => {
    switch (type) {
      case "single":
        return (
          <SingleWindowLayoutLive
            window={gridWindows[0]}
            renderWindow={renderWindow}
          />
        );
      case "dual":
        return (
          <DualWindowLayoutLive
            windows={[gridWindows[0], gridWindows[1]]}
            renderWindow={renderWindow}
          />
        );
      case "triple":
        return (
          <TripleWindowLayoutLive
            windows={[gridWindows[0], gridWindows[1], gridWindows[2]]}
            renderWindow={renderWindow}
          />
        );
      case "quad":
        return (
          <QuadWindowLayoutLive
            windows={[
              gridWindows[0],
              gridWindows[1],
              gridWindows[2],
              gridWindows[3],
            ]}
            renderWindow={renderWindow}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={`${className} w-full h-full bg-black`}>
      {renderLayout()}
    </div>
  );
}
