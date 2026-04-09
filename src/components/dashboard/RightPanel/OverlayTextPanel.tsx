import React, { useCallback, useRef, useState, useEffect } from "react";
import { MonitorPlay, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { DepthButton } from "@/shared/DepthButton";
import { DepthSurface } from "@/shared/DepthSurface";
import {
  setOverlayText,
  setOverlayVisible,
  setOverlayTargetDisplayId,
  toggleOverlayVisible,
} from "@/store/slices/appSlice";

const MAX_LENGTH = 120;
const HISTORY_KEY = "overlay-recent-messages";
const MAX_HISTORY = 5;

const loadHistory = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
  } catch {
    return [];
  }
};

const saveHistory = (msgs: string[]) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs));
};

export const OverlayTextPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);
  const overlayTargetDisplayId = useAppSelector(
    (s) => s.app.overlayTargetDisplayId,
  );
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const inputRef = useRef<HTMLInputElement>(null);

  // Local draft — typing here does NOT update the projection until Enter is pressed
  const [draftText, setDraftText] = useState(overlayText);
  const [recentMessages, setRecentMessages] = useState<string[]>(loadHistory);
  const [availableDisplays, setAvailableDisplays] = useState<
    Array<{ id: number; label: string; isPrimary: boolean }>
  >([]);

  useEffect(() => {
    let isMounted = true;

    const loadDisplays = async () => {
      try {
        const result = await (
          window.electronAPI as any
        )?.getConnectedDisplays?.();
        if (!isMounted) return;
        if (result?.success && Array.isArray(result.displays)) {
          const mapped = result.displays.map((display: any) => ({
            id: display.id,
            label: display.label || `Display ${display.id}`,
            isPrimary: !!display.isPrimary,
          }));
          setAvailableDisplays(mapped);
          return;
        }
      } catch {
        // keep empty state
      }
      if (isMounted) setAvailableDisplays([]);
    };

    loadDisplays();
    return () => {
      isMounted = false;
    };
  }, []);

  // Keep draft in sync if overlayText is cleared externally
  useEffect(() => {
    setDraftText(overlayText);
  }, [overlayText]);

  const isLive = overlayVisible && !!overlayText;

  const commitMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      dispatch(setOverlayText(trimmed));
      dispatch(setOverlayVisible(true));
      setRecentMessages((prev) => {
        const deduped = [trimmed, ...prev.filter((m) => m !== trimmed)].slice(
          0,
          MAX_HISTORY,
        );
        saveHistory(deduped);
        return deduped;
      });
    },
    [dispatch],
  );

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setDraftText(e.target.value);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commitMessage(draftText);
      }
    },
    [commitMessage, draftText],
  );

  const handleToggle = useCallback(() => {
    dispatch(toggleOverlayVisible());
  }, [dispatch]);

  const handleClear = useCallback(() => {
    setDraftText("");
    dispatch(setOverlayText(""));
    dispatch(setOverlayVisible(false));
    inputRef.current?.focus();
  }, [dispatch]);

  const handleSend = useCallback(() => {
    commitMessage(draftText);
  }, [commitMessage, draftText]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-6 text-white">
      <div className="w-full max-w-2xl flex flex-col gap-3 h-">
        {/* Quick guide (outside card) */}
        <div className="rounded-3xl bg-theme-primary-800/60 px-4 py-3">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src="./question.svg"
                alt="Quick guide"
                className="w-14 h-14 opacity-95"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] text-theme-primary-300/80">
                Quick Guide
              </p>
              <p className="mt-1 text-[11px] text-theme-primary-200/85 leading-relaxed">
                1. Pick <span className="font-semibold">All</span> or a screen.
                2. Type your message. 3. Press{" "}
                <span className="font-semibold">Enter </span>
                or use <span className="font-semibold">Send</span>.
              </p>
              <p className="mt-1 text-[10px] text-theme-primary-300/70">
                Use the eye icon to show or hide the current overlay instantly.
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Card ─────────────────────────────────────── */}
        <div className="rounded-3xl bg-theme-primary-900  overflow-hidden">
          {/* Top row — icon · title · actions */}
          <div className="flex items-center gap-3 px-4 py-3.5 bg-gradient-to-b from-theme-primary-900 to-theme-primary-900">
            {/* Status icon circle */}
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
                isLive
                  ? "border-green-400 bg-green-400/12 shadow-[0_0_12px_rgba(74,222,128,0.28)]"
                  : "border-theme-primary-600 bg-theme-primary-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              }`}
            >
              {isLive ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              ) : (
                <MonitorPlay className="w-4 h-4 text-theme-primary-300" />
              )}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">
                {isLive ? "Broadcasting" : "Text Overlay"}
              </p>
              <p className="text-[10px] text-theme-primary-300/90 mt-0.5">
                {isLive
                  ? "Visible on projection screen"
                  : "Type a message to display"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleToggle}
                className={`p-1.5 rounded-lg border transition-all duration-200 ${
                  overlayVisible
                    ? "text-green-400 border-green-500/35 bg-green-500/10 hover:bg-green-500/16"
                    : "text-theme-primary-300 border-theme-primary-700 bg-theme-primary-800 hover:text-theme-primary-100 hover:border-theme-primary-500"
                }`}
                title={overlayVisible ? "Hide overlay" : "Show overlay"}
              >
                {overlayVisible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg border border-theme-primary-700 bg-theme-primary-800 text-theme-primary-400 hover:text-theme-primary-100 hover:border-theme-primary-500 transition-all duration-200"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-theme-primary-700/70 mx-5 border-dashed border-3 border-theme-primary-900 " />

          {/* Target selection */}
          <div className="px-4 pt-2 pb-1.5">
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] text-theme-primary-300/80 shrink-0">
                Send to
              </span>
              <div className="flex flex-wrap gap-1.5">
                <DepthButton
                  onClick={() => dispatch(setOverlayTargetDisplayId(null))}
                  active={overlayTargetDisplayId === null}
                  sizeClassName="h-7 px-3 rounded-full"
                  activeClassName="text-theme-primary-50 border-theme-primary-400/70"
                  activeSurfaceClassName="depth-active-surface"
                  inactiveClassName="text-theme-primary-300 border-theme-primary-700"
                  inactiveSurfaceClassName="depth-inactive-surface"
                >
                  <span className="text-[11px] font-medium">All</span>
                </DepthButton>
                {availableDisplays.map((display) => {
                  const isActive = overlayTargetDisplayId === display.id;
                  return (
                    <DepthButton
                      key={display.id}
                      onClick={() =>
                        dispatch(setOverlayTargetDisplayId(display.id))
                      }
                      active={isActive}
                      sizeClassName="h-7 px-3 rounded-full"
                      activeClassName="text-theme-primary-50 border-theme-primary-400/70"
                      activeSurfaceClassName="depth-active-surface"
                      inactiveClassName="text-theme-primary-300 border-theme-primary-700"
                      inactiveSurfaceClassName="depth-inactive-surface"
                    >
                      <span className="text-[11px] font-medium">
                        {display.isPrimary
                          ? `${display.label} (Primary)`
                          : display.label}
                      </span>
                    </DepthButton>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-theme-primary-700/70 mx-5 border-dashed border-3 border-theme-primary-900 " />
          {/* Message input row */}
          <div className="px-4 pt-2.5 pb-2">
            <input
              ref={inputRef}
              value={draftText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type and press Enter to send…"
              // rows={1}
              className="w-full border-none bg-theme-primary-700/20 rounded-full px-3 py-3 no-scrollbar text-[13px] text-theme-primary-100 placeholder-theme-primary-400/90 focus:outline-none ring-2 ring-theme-primary-500 focus:shadow-[0_0_0_1px_rgba(120,120,120,0.35)] resize-none leading-"
              maxLength={MAX_LENGTH}
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[10px] tabular-nums transition-colors ${
                  draftText.length > MAX_LENGTH - 10
                    ? "text-amber-400/60"
                    : "text-theme-primary-400"
                }`}
              >
                {draftText.length}/{MAX_LENGTH}
              </span>
              <button
                onClick={handleSend}
                disabled={!draftText.trim()}
                className="text-[11px] font-semibold text-theme-primary-300 hover:text-theme-primary-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ↵ Send
              </button>
            </div>
          </div>

          {/* Recent messages */}
          {recentMessages.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] font-medium text-theme-primary-400/90 uppercase tracking-widest px-1">
                Recent
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {recentMessages.map((msg, i) => {
                  const isActive = msg === overlayText && overlayVisible;
                  return (
                    <DepthSurface
                      key={i}
                      onClick={() => commitMessage(msg)}
                      className={`w-full rounded-xl px-3.5 py-1 text-[12px] font-medium transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "text-green-300"
                          : "text-theme-primary-300 hover:text-theme-primary-100"
                      }`}
                      surfaceClassName={
                        isActive
                          ? "depth-inactive-surface"
                          : "depth-inactive-surface"
                      }
                      title={msg}
                    >
                      <span className="flex items-center truncate">
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2 mb-px animate-pulse" />
                        )}
                        <span className="truncate">{msg}</span>
                      </span>
                    </DepthSurface>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Projection off hint */}
        {!isProjectionOn && (
          <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/[0.05] border border-amber-400/[0.10] px-4 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400/50 shrink-0" />
            <p className="text-[11px] text-amber-300/50">
              Start a projection to show the overlay on screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
