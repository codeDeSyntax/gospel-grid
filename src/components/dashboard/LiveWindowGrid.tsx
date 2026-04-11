import React, { useRef, useMemo, useEffect, useState } from "react";
import { WindowInfo } from "./WindowList";
import { useAppSelector } from "@/store/hooks";
import { useMediaStreams } from "@/hooks/useMediaStreams";
import { VideoWindow } from "./VideoWindow";
import { SingleWindowLayoutLive } from "./layouts/live/SingleWindowLayoutLive";
import { DualWindowLayoutLive } from "./layouts/live/DualWindowLayoutLive";
import { TripleWindowLayoutLive } from "./layouts/live/TripleWindowLayoutLive";
import { QuadWindowLayoutLive } from "./layouts/live/QuadWindowLayoutLive";
import { TimerProjectionScreen } from "./TimerProjectionScreen";
import {
  TIMER_FEATURE_WINDOW_PREFIX,
  getCountdownRemainingMs,
  loadFeatureTimerCollection,
  markCollectionCompletedIfElapsed,
  saveFeatureTimerCollection,
  type FeatureTimerProjectionTheme,
} from "./RightPanel/featureTimerState";
import { IMAGE_FEATURE_WINDOW_PREFIX } from "./RightPanel/featureImageState";
import {
  CAPTIONS_FEATURE_WINDOW_ID,
  FEATURE_CAPTIONS_EVENT,
  loadFeatureCaptionsState,
  type FeatureCaptionsState,
} from "./RightPanel/featureCaptionsState";

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
  const [timerDisplayMap, setTimerDisplayMap] = useState<
    Record<
      string,
      {
        days: string;
        hours: string;
        minutes: string;
        seconds: string;
        theme: FeatureTimerProjectionTheme;
      }
    >
  >({});
  const [captionsState, setCaptionsState] = useState<FeatureCaptionsState>(() =>
    loadFeatureCaptionsState(),
  );

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

  const splitDuration = (totalMs: number) => {
    const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      days: String(days).padStart(2, "0"),
      hours: String(hours).padStart(2, "0"),
      minutes: String(minutes).padStart(2, "0"),
      seconds: String(seconds).padStart(2, "0"),
    };
  };

  const splitClock = (now: Date) => {
    return {
      days: "00",
      hours: String(now.getHours()).padStart(2, "0"),
      minutes: String(now.getMinutes()).padStart(2, "0"),
      seconds: String(now.getSeconds()).padStart(2, "0"),
    };
  };

  useEffect(() => {
    const syncTimerLabels = () => {
      const loaded = loadFeatureTimerCollection();
      const normalized = markCollectionCompletedIfElapsed(loaded, Date.now());
      if (normalized !== loaded) {
        saveFeatureTimerCollection(normalized);
      }

      const nextDisplayMap: Record<
        string,
        {
          days: string;
          hours: string;
          minutes: string;
          seconds: string;
          theme: FeatureTimerProjectionTheme;
        }
      > = {};
      normalized.timers.forEach((timer) => {
        const timerWindowId = `${TIMER_FEATURE_WINDOW_PREFIX}${timer.id}`;
        const theme = timer.state.projectionTheme ?? "dark";
        if (timer.state.mode === "countdown") {
          const remaining = getCountdownRemainingMs(timer.state, Date.now());
          nextDisplayMap[timerWindowId] = {
            ...splitDuration(remaining),
            theme,
          };
        } else {
          const now = new Date();
          nextDisplayMap[timerWindowId] = {
            ...splitClock(now),
            theme,
          };
        }
      });

      setTimerDisplayMap(nextDisplayMap);
    };

    syncTimerLabels();
    const interval = window.setInterval(syncTimerLabels, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const syncCaptions = () => {
      setCaptionsState(loadFeatureCaptionsState());
    };

    syncCaptions();
    const timer = window.setInterval(syncCaptions, 500);
    window.addEventListener(FEATURE_CAPTIONS_EVENT, syncCaptions);
    window.addEventListener("storage", syncCaptions);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, syncCaptions);
      window.removeEventListener("storage", syncCaptions);
    };
  }, []);

  // ── MediaStream hook — one live GPU stream per window ──────────────────
  const sourceIds = useMemo(
    () =>
      gridWindows
        .filter(
          (w) =>
            !w.id.startsWith(TIMER_FEATURE_WINDOW_PREFIX) &&
            !w.id.startsWith(IMAGE_FEATURE_WINDOW_PREFIX) &&
            w.id !== CAPTIONS_FEATURE_WINDOW_ID,
        )
        .map((w) => w.id),
    [gridWindows],
  );

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
    const isTimerFeature = win.id.startsWith(TIMER_FEATURE_WINDOW_PREFIX);
    const isImageFeature = win.id.startsWith(IMAGE_FEATURE_WINDOW_PREFIX);
    const isCaptionsFeature = win.id === CAPTIONS_FEATURE_WINDOW_ID;

    if (isCaptionsFeature) {
      return (
        <div
          key={win.id}
          className="relative overflow-hidden bg-black"
          style={{
            ...customStyle,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_45%)]">
            <div className="max-w-[90%]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-theme-primary-300/85 mb-3">
                Live Captions
              </p>
              <p className="text-3xl leading-tight text-theme-primary-50 break-words">
                {captionsState.text || "Waiting for speech..."}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isTimerFeature) {
      const timerView = timerDisplayMap[win.id] ?? {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
        theme: "dark" as FeatureTimerProjectionTheme,
      };
      return (
        <div
          key={win.id}
          className="relative overflow-hidden bg-black"
          style={{
            ...customStyle,
          }}
        >
          <TimerProjectionScreen
            days={timerView.days}
            hours={timerView.hours}
            minutes={timerView.minutes}
            seconds={timerView.seconds}
            theme={timerView.theme}
            layoutMode={type}
          />
        </div>
      );
    }

    if (isImageFeature) {
      const src = win.thumbnail || win.icon || "";
      return (
        <div
          key={win.id}
          className="relative overflow-hidden bg-black"
          style={{
            ...customStyle,
          }}
        >
          {src ? (
            <img
              src={src}
              alt={win.name}
              className="absolute inset-0 h-full w-full object-contain bg-black"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-theme-primary-200/75 text-sm">
              Image unavailable
            </div>
          )}
        </div>
      );
    }

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
