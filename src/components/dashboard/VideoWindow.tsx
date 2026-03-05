import React, { useRef, useEffect, memo } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoWindowProps {
  /** Live MediaStream from useMediaStreams (null while pending/failed) */
  stream: MediaStream | null;
  /** Current stream status for fallback UI */
  status?: "pending" | "active" | "reconnecting" | "failed";
  /** Window title (shown in placeholder) */
  windowName?: string;
  /** App name (shown in placeholder) */
  appName?: string;
  /** CSS class for the outer container */
  className?: string;
  /** Inline style for the outer container */
  style?: React.CSSProperties;
  /** CSS filter: contrast (default 1.0) */
  contrast?: number;
  /** CSS filter: brightness (default 1.0) */
  brightness?: number;
  /** Object-fit mode for the video (default 'contain') */
  objectFit?: "contain" | "cover" | "fill";
  /** Whether this is filling the entire view (single window mode) */
  isSingleWindow?: boolean;
  /** When true, pauses the video element to freeze the last displayed frame */
  isFrozen?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Hardware-accelerated <video> renderer for a live window capture stream.
 *
 * Unlike the previous <img src={base64}> approach, this component:
 *   - Never triggers React re-renders for new frames
 *   - Stays on the GPU compositing path end-to-end
 *   - Uses the browser's native video pipeline for decoding
 *   - Supports CSS filters (contrast/brightness) without JS overhead
 *
 * The component is memoised so it only re-renders when props actually change
 * (new stream reference, new filters, etc.), NOT on every frame.
 */
export const VideoWindow = memo<VideoWindowProps>(
  ({
    stream,
    status = "pending",
    windowName = "",
    appName = "",
    className = "",
    style = {},
    contrast = 1.0,
    brightness = 1.0,
    objectFit = "contain",
    isSingleWindow = false,
    isFrozen = false,
  }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // ── Attach / detach the stream to the <video> element ─────────────────
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      if (!stream) {
        video.srcObject = null;
        return;
      }

      // Only reassign if the stream reference actually changed
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      // Ensure playback starts (Chrome requires user-gesture or muted)
      const play = () => {
        const p = video.play();
        if (p) {
          p.catch(() => {
            // Retry once — handles brief race between attach and ready
            setTimeout(() => video.play().catch(() => {}), 50);
          });
        }
      };

      play();

      // Also handle the case where the stream becomes ready after attach
      video.onloadedmetadata = () => play();

      return () => {
        video.onloadedmetadata = null;
        // Don't null srcObject here — the stream may still be alive and
        // reused if only the effect re-runs due to deps change.
      };
    }, [stream]);

    // ── Freeze / unfreeze: pause or resume the video element ──────────────
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !stream) return;

      if (isFrozen) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    }, [isFrozen, stream]);

    // ── Placeholder while no stream available ─────────────────────────────
    if (!stream) {
      return (
        <div
          className={`flex flex-col items-center justify-center h-full ${className}`}
          style={{ ...style, backgroundColor: "#0a0a0a" }}
        >
          {status === "reconnecting" ? (
            <>
              <div className="text-3xl mb-2 animate-spin">⟳</div>
              <div className="text-xs text-gray-400">Reconnecting…</div>
            </>
          ) : status === "failed" ? (
            <>
              <div className="text-3xl mb-2">⚠️</div>
              <div className="text-xs text-red-400">Stream lost</div>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">🖥️</div>
              <div className="text-xs text-center text-gray-400">
                {appName && (
                  <span className="block font-medium">{appName}</span>
                )}
                {windowName && (
                  <span className="block opacity-75 truncate max-w-[180px]">
                    {windowName}
                  </span>
                )}
                {!appName && !windowName && <span>Starting capture…</span>}
              </div>
            </>
          )}
        </div>
      );
    }

    // ── Live video ────────────────────────────────────────────────────────
    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={className}
        style={{
          ...style,
          objectFit,
          objectPosition: "center",
          filter: `contrast(${contrast}) brightness(${brightness})`,
          width: "100%",
          height: "100%",
          display: "block",
          backgroundColor: "#000",
          // GPU compositing hints
          willChange: "transform",
          transform: "translateZ(0)",
          // Prevent outline on focus
          outline: "none",
        }}
      />
    );
  },
);

VideoWindow.displayName = "VideoWindow";
