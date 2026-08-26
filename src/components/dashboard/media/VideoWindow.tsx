import React, { useRef, useEffect, useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, Sparkles } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VideoWindowProps {
  /** Live MediaStream from useMediaStreams (null while pending/failed) */
  stream: MediaStream | null;
  /** Current stream status for fallback UI */
  status?: "pending" | "active" | "reconnecting" | "failed";
  /** Window title (shown in placeholder and toaster notifications) */
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
    const prevNameRef = useRef(windowName);
    const [toastText, setToastText] = useState<string | null>(null);
    const [toastKey, setToastKey] = useState<number>(0);
    const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

      const play = () => {
        const p = video.play();
        if (p) {
          p.catch(() => {
            setTimeout(() => video.play().catch(() => {}), 50);
          });
        }
      };

      play();

      video.onloadedmetadata = () => play();

      return () => {
        video.onloadedmetadata = null;
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

    // ── Helper to format clean slide or title message ────────────────────
    const extractSlideOrTitle = (rawTitle: string): string => {
      if (!rawTitle) return "";

      const slideMatch = rawTitle.match(/slide\s*(\d+(?:\/\d+)?|\b\w+\b)/i);
      if (slideMatch) {
        return `Slide ${slideMatch[1]}`;
      }

      const pageMatch = rawTitle.match(/page\s*(\d+(?:\/\d+)?|\b\w+\b)/i);
      if (pageMatch) {
        return `Page ${pageMatch[1]}`;
      }

      const cleaned = rawTitle
        .replace(/^PowerPoint (Slide Show - )?/i, "")
        .replace(/^Keynote - /i, "")
        .replace(
          / - (Google Chrome|Microsoft Edge|Brave|Firefox|Acrobat Reader|Adobe Acrobat)$/i,
          "",
        )
        .trim();

      return cleaned.length > 48 ? `${cleaned.slice(0, 46)}…` : cleaned;
    };

    // ── Android-style Toaster Trigger on Slide / Window Content Change ────
    useEffect(() => {
      if (
        prevNameRef.current &&
        windowName &&
        prevNameRef.current !== windowName
      ) {
        const cleanMessage = extractSlideOrTitle(windowName) || "Content Updated";

        setToastText(cleanMessage);
        setToastKey((k) => k + 1);

        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setToastText(null);
        }, 3200);
      }
      prevNameRef.current = windowName;
    }, [windowName]);

    // ── Cleanup toast timer on unmount ────────────────────────────────────
    useEffect(() => {
      return () => {
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      };
    }, []);

    // ── Full-Page Shimmer Card with Padding & Centered Content ────────────
    if (!stream) {
      return (
        <div
          className={`relative w-full h-full min-h-0 bg-black flex items-center justify-center p-3 sm:p-5 md:p-8 select-none ${className}`}
          style={{ ...style }}
        >
          {/* Shimmering Glass Card filling available space */}
          <div className="relative w-full h-full rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-[#18181b] via-[#0f0f11] to-[#09090b] overflow-hidden flex flex-col items-center justify-center text-center p-6 shadow-2xl">
            {/* Vivid Diagonal Sweep Shimmer Beam */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(105deg, transparent 20%, rgba(255, 255, 255, 0.08) 40%, rgba(255, 255, 255, 0.22) 50%, rgba(255, 255, 255, 0.08) 60%, transparent 80%)",
                animation: "fullPageShimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite",
              }}
            />

            {/* Ambient Center Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-primary-500,59,130,246),0.12),transparent_70%)] pointer-events-none" />

            {/* Centered Content */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-2 max-w-md px-4">
              {status === "reconnecting" ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-300 backdrop-blur-md shadow-lg">
                  <RefreshCw className="h-4 w-4 animate-spin shrink-0" />
                  <span className="text-sm font-semibold">Reconnecting Source...</span>
                </div>
              ) : status === "failed" ? (
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/15 text-red-300 backdrop-blur-md shadow-lg">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Capture Stream Lost</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 w-full">
                  <p className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight drop-shadow-sm truncate max-w-full">
                    {appName || "Connecting Display Stream"}
                  </p>
                  {windowName && (
                    <p className="text-xs sm:text-sm text-white/50 truncate max-w-xs sm:max-w-sm">
                      {windowName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Keyframe Injection for Reliable Cross-Platform Shimmer */}
          <style>{`
            @keyframes fullPageShimmer {
              0% {
                transform: translateX(-120%) skewX(-15deg);
              }
              100% {
                transform: translateX(120%) skewX(-15deg);
              }
            }
          `}</style>
        </div>
      );
    }

    // ── Live video with Android-style quick toaster notification ──────────
    return (
      <div className={`relative w-full h-full overflow-hidden bg-black ${className}`} style={{ ...style }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            objectFit,
            objectPosition: "center",
            filter: `contrast(${contrast}) brightness(${brightness})`,
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "#000",
            willChange: "transform",
            transform: "translateZ(0)",
            outline: "none",
          }}
        />

        {/* Android-style Pill Toaster Notification */}
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center pointer-events-none z-30 px-4">
          <AnimatePresence>
            {toastText && (
              <motion.div
                key={toastKey}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.92 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/90 border border-white/25 text-white shadow-[0_12px_32px_rgba(0,0,0,0.8)] backdrop-blur-2xl max-w-[90%]"
              >
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-500/30 text-primary-300 border border-primary-500/50 shrink-0">
                  <Sparkles className="w-3 h-3" />
                </div>
                <span className="text-xs sm:text-sm font-semibold tracking-wide truncate text-white">
                  {toastText}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  },
);

VideoWindow.displayName = "VideoWindow";
