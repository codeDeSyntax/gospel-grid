import React, { useCallback, useRef, useState, useEffect } from "react";
import { MonitorPlay, X, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setOverlayText,
  setOverlayVisible,
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
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Local draft — typing here does NOT update the projection until Enter is pressed
  const [draftText, setDraftText] = useState(overlayText);
  const [recentMessages, setRecentMessages] = useState<string[]>(loadHistory);

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
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDraftText(e.target.value);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
      <div className="w-full max-w-2xl flex flex-col gap-3">
        {/* ── Main Card ─────────────────────────────────────── */}
        <div className="rounded-2xl bg-theme-primary-700/5 border-4 border-double border-white/[0.1] overflow-hidden ">
          {/* Top row — icon · title · actions */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* Status icon circle */}
            <div
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 ${
                isLive
                  ? "border-green-400 bg-green-400/15 shadow-[0_0_12px_rgba(74,222,128,0.3)]"
                  : "border-white/15 bg-white/[0.05]"
              }`}
            >
              {isLive ? (
                <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              ) : (
                <MonitorPlay className="w-4 h-4 text-white/35" />
              )}
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">
                {isLive ? "Broadcasting" : "Text Overlay"}
              </p>
              <p className="text-[10px] text-white/35 mt-0.5">
                {isLive
                  ? "Visible on projection screen"
                  : "Type a message to display"}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              <button
                onClick={handleToggle}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  overlayVisible
                    ? "text-green-400 hover:bg-green-500/15"
                    : "text-white/30 hover:text-white/60 hover:bg-white/[0.06]"
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
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all duration-200"
                title="Clear"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.07]" />

          {/* Message input row */}
          <div className="px-4 pt-2.5 pb-2">
            <textarea
              ref={inputRef}
              value={draftText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Type and press Enter to send…"
              rows={1}
              className="w-full border-none bg-theme-primary-600/10 rounded-full p-3 text-[13px] text-white/90 placeholder-white/20 focus:outline-none resize-none leading-relaxed"
              maxLength={MAX_LENGTH}
            />
            <div className="flex items-center justify-between mt-1">
              <span
                className={`text-[10px] tabular-nums transition-colors ${
                  draftText.length > MAX_LENGTH - 10
                    ? "text-amber-400/60"
                    : "text-white/15"
                }`}
              >
                {draftText.length}/{MAX_LENGTH}
              </span>
              <button
                onClick={handleSend}
                disabled={!draftText.trim()}
                className="text-[11px] font-semibold text-white/35 hover:text-white/65 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ↵ Send
              </button>
            </div>
          </div>

          {/* Recent messages */}
          {recentMessages.length > 0 && (
            <div className="flex flex-col gap-1.5 p-3">
              <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest px-1">
                Recent
              </p>
              {recentMessages.map((msg, i) => {
                const isActive = msg === overlayText && overlayVisible;
                return (
                  <span
                    key={i}
                    onClick={() => commitMessage(msg)}
                    className={`w-full text-left px-3.5 p-1 border-solid border-1 cursor-pointer rounded-xl border text-[12px] font-medium transition-all duration-200 truncate ${
                      isActive
                        ? "bg-green-500/10 border-green-400/30 text-green-300"
                        : "bg-transparent border-white/[0.06] text-white/45 hover:bg-white/[0.07] hover:border-white/[0.12] hover:text-white/70"
                    }`}
                    title={msg}
                  >
                    {isActive && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-2 mb-px animate-pulse" />
                    )}
                    {msg}
                  </span>
                );
              })}
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
