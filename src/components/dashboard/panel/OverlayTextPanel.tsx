import React, { useCallback, useRef, useState, useEffect } from "react";
import { MonitorPlay, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { DepthButton } from "@/shared/DepthButton";
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
  const isDarkMode = useAppSelector((s: RootState) => s.app.isDarkMode);
  const overlayText = useAppSelector((s: RootState) => s.app.overlayText);
  const overlayVisible = useAppSelector((s: RootState) => s.app.overlayVisible);
  const overlayTargetDisplayId = useAppSelector(
    (s: RootState) => s.app.overlayTargetDisplayId,
  );
  const isProjectionOn = useAppSelector((s: RootState) => s.app.isProjectionOn);
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
    <div className="h-full w-full flex flex-col items-center justify-center p-6 theme-text-main">
      <div className="w-full max-w-2xl flex flex-col gap-3">
        {/* Quick guide (outside card) */}
        <div
          className={`rounded-3xl border px-4 py-3 ${
            isDarkMode
              ? "bg-theme-primary-800/60 border-theme-primary-600/35"
              : "bg-theme-primary-900/90 border-theme-primary-700/70"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 shrink-0 flex items-center justify-center">
              <img
                src="./question.svg"
                alt="Quick guide"
                className="w-14 h-14 opacity-95"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-[0.16em] theme-text-muted opacity-90">
                Quick Guide
              </p>
              <p className="mt-1 text-[11px] theme-text-soft leading-relaxed opacity-95">
                1. Pick <span className="font-semibold">All</span> or a screen.
                2. Type your message. 3. Press{" "}
                <span className="font-semibold">Enter </span>
                or use <span className="font-semibold">Send</span>.
              </p>
              <p className="mt-1 text-[10px] theme-text-muted opacity-85">
                Use the eye icon to show or hide the current overlay instantly.
              </p>
            </div>
          </div>
        </div>

        {/* ── Main Card ─────────────────────────────────────── */}
        <div
          className={`rounded-3xl overflow-hidden border ${
            isDarkMode
              ? "bg-theme-primary-900 border-theme-primary-700/45"
              : "bg-theme-primary-950 border-theme-primary-700/70"
          }`}
        >
          {/* Top row — icon · title · actions */}
          <div
            className={`flex items-center gap-3 px-4 py-3.5 bg-gradient-to-b ${
              isDarkMode
                ? "from-theme-primary-900 to-theme-primary-900"
                : "from-theme-primary-900/75 to-theme-primary-900/45"
            }`}
          >
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
              <p className="text-sm font-bold theme-text-main leading-none">
                {isLive ? "Broadcasting" : "Text Overlay"}
              </p>
              <p className="text-[10px] theme-text-soft mt-0.5 opacity-85">
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
                    : "theme-text-muted border-theme-primary-700 bg-theme-primary-800/75 hover:theme-text-main hover:border-theme-primary-500"
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
                className="p-1.5 rounded-lg border border-theme-primary-700 bg-theme-primary-800/75 theme-text-muted hover:theme-text-main hover:border-theme-primary-500 transition-all duration-200"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-theme-primary-700/50 mx-5" />

          {/* Target selection */}
          <div className="px-4 pt-2 pb-1.5">
            <div className="flex items-start gap-2">
              <span className="text-[10px] uppercase tracking-[0.16em] theme-text-muted shrink-0 opacity-90">
                Send to
              </span>
              <div className="flex flex-wrap gap-1.5">
                <DepthButton
                  onClick={() => dispatch(setOverlayTargetDisplayId(null))}
                  active={overlayTargetDisplayId === null}
                  sizeClassName="h-7 px-3 rounded-full"
                  activeClassName="theme-text-main border-theme-primary-400/70"
                  activeSurfaceClassName="depth-active-surface"
                  inactiveClassName="theme-text-soft border-theme-primary-700"
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
                      activeClassName="theme-text-main border-theme-primary-400/70"
                      activeSurfaceClassName="depth-active-surface"
                      inactiveClassName="theme-text-soft border-theme-primary-700"
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
          <div className="h-px bg-theme-primary-700/50 mx-5" />
          {/* Message input row */}
          <div className="px-4 pt-2.5 pb-2">
            <input
              ref={inputRef}
              value={draftText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type and press Enter to send…"
              // rows={1}
              className={`w-full border placeholder-theme-primary-50 text-theme-primary-50 rounded-full px-3 py-3 no-scrollbar text-[13px] focus:outline-none resize-none leading-snug border-none   ${
                isDarkMode
                  ? "border-theme-primary-600/45 bg-theme-primary-700/20   focus:ring-2 focus:ring-theme-primary-500"
                  : "border-theme-primary-600/65 bg-theme-primary-900   focus:ring-2 focus:ring-theme-primary-500/65"
              }`}
              maxLength={MAX_LENGTH}
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[10px] tabular-nums transition-colors ${
                  draftText.length > MAX_LENGTH - 10
                    ? "text-amber-400/60"
                    : "theme-text-muted"
                }`}
              >
                {draftText.length}/{MAX_LENGTH}
              </span>
              <button
                onClick={handleSend}
                disabled={!draftText.trim()}
                className="text-[11px] font-semibold theme-text-soft hover:theme-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ↵ Send
              </button>
            </div>
          </div>

          {/* Recent messages */}
          {recentMessages.length > 0 && (
            <div className="p-3">
              <p className="text-[10px] font-medium theme-text-muted uppercase tracking-widest px-1">
                Recent
              </p>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {recentMessages.map((msg, i) => {
                  const isActive = msg === overlayText && overlayVisible;
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => commitMessage(msg)}
                      className={`w-full rounded-xl px-3.5 py-1 text-[12px] font-medium transition-all duration-200 cursor-pointer border ${
                        isActive
                          ? "text-green-300 border-green-500/35 bg-green-500/10"
                          : isDarkMode
                            ? "theme-text-soft border-theme-primary-600/35 bg-theme-primary-700/35 hover:theme-text-on-overlay hover:border-theme-primary-500/60"
                            : "theme-text-main border-theme-primary-600/45 bg-theme-primary-900/95 hover:theme-text-main hover:border-theme-primary-500/70"
                      }`}
                      title={msg}
                    >
                      <span className="flex items-center truncate">
                        {isActive && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2 mb-px animate-pulse" />
                        )}
                        <span className="truncate">
                          {i + 1}. {msg}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Projection off hint */}
        {!isProjectionOn && (
          <div
            className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 ${
              isDarkMode
                ? "bg-amber-500/[0.05] border-amber-400/[0.12]"
                : "bg-amber-500/[0.08] border-amber-500/[0.22]"
            }`}
          >
            <AlertTriangle
              className={`w-3.5 h-3.5 shrink-0 ${
                isDarkMode ? "text-amber-400/70" : "text-amber-600/80"
              }`}
            />
            <p
              className={`text-[11px] ${
                isDarkMode ? "text-amber-300/70" : "text-amber-700"
              }`}
            >
              Start a projection to show the overlay on screen.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
