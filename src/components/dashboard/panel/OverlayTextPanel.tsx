import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import {
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUp,
  Tv,
  Check,
  ChevronDown,
  MessageSquare,
  Trash2,
  Plus,
  SlidersHorizontal,
  Clock,
  Radio,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import {
  setOverlayText,
  setOverlayVisible,
  setOverlayTargetDisplayId,
  toggleOverlayVisible,
} from "@/store/slices/appSlice";

const MAX_LENGTH = 120;
const HISTORY_KEY = "overlay-recent-messages";
const MAX_HISTORY = 6;

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
  const recentsMenuRef = useRef<HTMLDivElement>(null);
  const targetMenuRef = useRef<HTMLDivElement>(null);

  const [isRecentsOpen, setIsRecentsOpen] = useState(false);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
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
        // Keep empty
      }
      if (isMounted) setAvailableDisplays([]);
    };

    loadDisplays();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync draft if overlayText is updated externally
  useEffect(() => {
    setDraftText(overlayText);
  }, [overlayText]);

  // Click outside listener for floating popup menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        recentsMenuRef.current &&
        !recentsMenuRef.current.contains(event.target as Node)
      ) {
        setIsRecentsOpen(false);
      }
      if (
        targetMenuRef.current &&
        !targetMenuRef.current.contains(event.target as Node)
      ) {
        setIsTargetMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const clearRecentMessages = useCallback(() => {
    setRecentMessages([]);
    saveHistory([]);
  }, []);

  const removeRecentMessage = useCallback((msgToRemove: string) => {
    setRecentMessages((prev) => {
      const updated = prev.filter((m) => m !== msgToRemove);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const currentTargetLabel = useMemo(() => {
    if (overlayTargetDisplayId === null) return "All Displays";
    const found = availableDisplays.find((d) => d.id === overlayTargetDisplayId);
    if (!found) return "Display";
    return found.isPrimary ? `${found.label} (Primary)` : found.label;
  }, [overlayTargetDisplayId, availableDisplays]);

  const panelBg = isDarkMode
    ? "bg-theme-primary-900 theme-text-on-overlay"
    : "bg-theme-primary-900 theme-text-main";

  return (
    <div
      className={`h-full w-full rounded-r-2xl rounded-l-none px-6 py-6 overflow-hidden relative flex flex-col justify-between ${panelBg}`}
    >
      {/* ── TOP HEADER / STATUS ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold uppercase tracking-[0.25em] ${
              isDarkMode ? "text-white/60" : "text-neutral-500"
            }`}
          >
            Overlay Text Broadcast
          </span>
        </div>

        {/* Live Broadcast Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm ${
              isLive
                ? isDarkMode
                  ? "bg-primary-500/15 border-primary-500/40 text-white"
                  : "bg-primary-50 border-primary-400 text-primary-700 font-bold"
                : isDarkMode
                  ? "bg-[#252525] border-white/10 text-white/70"
                  : "bg-white border-neutral-300 text-neutral-600"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isLive
                  ? "bg-primary-500 animate-pulse shadow-[0_0_6px_rgba(94,172,36,0.6)]"
                  : isDarkMode
                    ? "bg-white/40"
                    : "bg-neutral-400"
              }`}
            />
            {isLive ? "Broadcasting" : "Idle"}
          </span>
        </div>
      </div>

      {/* ── CENTER STAGE HERO (Pill Composer UI Matching Image) ──────────── */}
      <div className="flex flex-col items-center justify-center my-auto py-6 max-w-2xl w-full mx-auto">
        {/* ── Modern Pill Composer Card (Reference Style) ────────────────── */}
        <div
          className={`relative w-full rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 flex flex-col justify-between min-h-[140px] transition-all duration-300 ${
            isDarkMode
              ? "bg-[#1e1e1e] border border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
              : "bg-white border border-black/[0.08] shadow-[0_12px_36px_rgba(0,0,0,0.06)]"
          } ${
            isLive
              ? "ring-2 ring-primary-500/30 border-primary-500/40"
              : ""
          }`}
        >
          {/* Top text input */}
          <div className="w-full px-1 pt-1 pb-4">
            <input
              ref={inputRef}
              autoFocus
              value={draftText}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything or broadcast message..."
              className={`w-full bg-transparent border-none outline-none text-base sm:text-lg font-medium leading-relaxed ${
                isDarkMode
                  ? "text-white placeholder-neutral-500"
                  : "text-neutral-900 placeholder-neutral-400"
              }`}
              maxLength={MAX_LENGTH}
            />
          </div>

          {/* Bottom control pills row inside the composer card */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.05]">
            {/* Left Action Buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Plus Button: Clear / Reset */}
              <button
                type="button"
                onClick={handleClear}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                  isDarkMode
                    ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700 hover:text-neutral-900"
                }`}
                title="Clear input"
              >
                <Plus size={15} strokeWidth={2.4} />
              </button>

              {/* Recents Popover Trigger Button */}
              <div className="relative" ref={recentsMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsRecentsOpen(!isRecentsOpen);
                    setIsTargetMenuOpen(false);
                  }}
                  className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    isRecentsOpen
                      ? isDarkMode
                        ? "bg-[#333333] border-white/30 text-white"
                        : "bg-neutral-200 border-neutral-400 text-neutral-900"
                      : isDarkMode
                        ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                        : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700 hover:text-neutral-900"
                  }`}
                  title="View recent broadcast messages"
                >
                  <SlidersHorizontal size={12} strokeWidth={2.2} />
                  <span>Recents</span>
                  {recentMessages.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isDarkMode
                          ? "bg-white/10 text-white/90"
                          : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {recentMessages.length}
                    </span>
                  )}
                </button>

                {/* ── Recents Floating Popover Menu (Matching Image) ── */}
                {isRecentsOpen && (
                  <div
                    className={`absolute bottom-full left-0 mb-2.5 w-72 rounded-2xl p-2 z-50 border shadow-2xl transition-all ${
                      isDarkMode
                        ? "bg-[#1c1c1c] border-white/15 text-white"
                        : "bg-white border-neutral-200 text-neutral-900 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                    }`}
                  >
                    <div className="px-2.5 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider opacity-60">
                      <span>Recent Messages</span>
                      <span>{recentMessages.length} saved</span>
                    </div>

                    <div className="my-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

                    {recentMessages.length === 0 ? (
                      <div className="py-4 text-center text-xs opacity-50">
                        No recent messages yet
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
                        {recentMessages.map((msg, idx) => {
                          const isActive = msg === overlayText && overlayVisible;
                          return (
                            <div
                              key={idx}
                              onClick={() => {
                                commitMessage(msg);
                                setIsRecentsOpen(false);
                              }}
                              className={`group flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all cursor-pointer ${
                                isActive
                                  ? isDarkMode
                                    ? "bg-primary-500/20 text-white font-bold"
                                    : "bg-primary-50 text-primary-900 font-bold"
                                  : isDarkMode
                                    ? "hover:bg-white/[0.06] text-white/85"
                                    : "hover:bg-neutral-100 text-neutral-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <MessageSquare
                                  size={13}
                                  className={
                                    isActive
                                      ? "text-primary-500 shrink-0"
                                      : "opacity-40 shrink-0"
                                  }
                                />
                                <span className="truncate">{msg}</span>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeRecentMessage(msg);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-opacity ml-1 shrink-0 text-neutral-400 hover:text-red-400"
                                title="Remove item"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {recentMessages.length > 0 && (
                      <>
                        <div className="my-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
                        <button
                          type="button"
                          onClick={clearRecentMessages}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>Clear All Recents</span>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Target Screen Selector Pill */}
              <div className="relative" ref={targetMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setIsTargetMenuOpen(!isTargetMenuOpen);
                    setIsRecentsOpen(false);
                  }}
                  className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                    isTargetMenuOpen
                      ? isDarkMode
                        ? "bg-[#333333] border-white/30 text-white"
                        : "bg-neutral-200 border-neutral-400 text-neutral-900"
                      : isDarkMode
                        ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                        : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-700 hover:text-neutral-900"
                  }`}
                  title="Select destination display"
                >
                  <Tv size={12} className="text-primary-500" />
                  <span className="max-w-[110px] sm:max-w-[130px] truncate">
                    {currentTargetLabel}
                  </span>
                  <ChevronDown size={11} className="opacity-60" />
                </button>

                {/* Target Screen Dropdown Menu */}
                {isTargetMenuOpen && (
                  <div
                    className={`absolute bottom-full left-0 mb-2.5 w-64 rounded-2xl p-2 z-50 border shadow-2xl ${
                      isDarkMode
                        ? "bg-[#1c1c1c] border-white/15 text-white"
                        : "bg-white border-neutral-200 text-neutral-900 shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
                    }`}
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                      Destination Screen
                    </div>
                    <div className="my-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />

                    <button
                      type="button"
                      onClick={() => {
                        dispatch(setOverlayTargetDisplayId(null));
                        setIsTargetMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                        overlayTargetDisplayId === null
                          ? "bg-primary-500/15 text-primary-400 font-bold"
                          : "hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <span>All Displays</span>
                      {overlayTargetDisplayId === null && (
                        <Check size={13} className="text-primary-500" />
                      )}
                    </button>

                    {availableDisplays.map((disp) => {
                      const isActive = overlayTargetDisplayId === disp.id;
                      return (
                        <button
                          key={disp.id}
                          type="button"
                          onClick={() => {
                            dispatch(setOverlayTargetDisplayId(disp.id));
                            setIsTargetMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                            isActive
                              ? "bg-primary-500/15 text-primary-400 font-bold"
                              : "hover:bg-black/5 dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">
                            {disp.isPrimary ? `${disp.label} (Primary)` : disp.label}
                          </span>
                          {isActive && (
                            <Check size={13} className="text-primary-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Controls: Visibility Pill & Up-Arrow Send Button */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Visibility Toggle Pill */}
              <button
                type="button"
                onClick={handleToggle}
                className={`h-8 px-3 rounded-full flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer border ${
                  overlayVisible
                    ? isDarkMode
                      ? "bg-primary-500/20 border-primary-500/40 text-white"
                      : "bg-primary-50 border-primary-400 text-primary-700"
                    : isDarkMode
                      ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/70"
                      : "bg-neutral-100 hover:bg-neutral-200 border-neutral-200 text-neutral-600"
                }`}
                title={overlayVisible ? "Hide overlay" : "Show overlay"}
              >
                {overlayVisible ? <Eye size={13} className="text-primary-400" /> : <EyeOff size={13} />}
                <span>{overlayVisible ? "Visible" : "Hidden"}</span>
              </button>

              {/* Circular Send / Broadcast Button with Arrow Up */}
              <button
                type="button"
                disabled={!draftText.trim()}
                onClick={handleSend}
                className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  draftText.trim()
                    ? isDarkMode
                      ? "bg-primary-500 text-white hover:bg-primary-400 active:scale-95 shadow-[0_0_12px_rgba(94,172,36,0.5)] cursor-pointer"
                      : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95 shadow-md cursor-pointer"
                    : isDarkMode
                      ? "bg-[#2a2a2a] text-white/30 cursor-not-allowed"
                      : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}
                title="Broadcast overlay (Enter)"
              >
                <ArrowUp size={16} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        </div>

        {/* Character count & tip below card */}
        <div className="w-full flex items-center justify-between px-3 mt-2 text-[11px]">
          <span
            className={`${
              draftText.length > MAX_LENGTH - 15
                ? "text-amber-400 font-bold"
                : isDarkMode
                  ? "text-white/40"
                  : "text-neutral-400"
            }`}
          >
            {draftText.length} / {MAX_LENGTH} characters
          </span>

          <span
            className={`${
              isDarkMode ? "text-white/40" : "text-neutral-400"
            }`}
          >
            Press <kbd className="font-semibold text-white/70">Enter</kbd> to broadcast
          </span>
        </div>
      </div>

      {/* ── BOTTOM NOTICE / PROJECTION HINT ──────────────────────────────── */}
      <div className="flex items-center justify-center pb-2">
        {!isProjectionOn ? (
          <p
            className={`text-xs font-medium flex items-center gap-1.5 ${
              isDarkMode ? "text-white/60" : "text-neutral-500"
            }`}
          >
            <AlertTriangle
              size={13}
              className={isDarkMode ? "text-amber-400" : "text-amber-600"}
            />
            Start a projection (F5) to show the overlay text on the display screens.
          </p>
        ) : (
          <p
            className={`text-xs font-medium flex items-center gap-1.5 ${
              isDarkMode ? "text-white/60" : "text-neutral-500"
            }`}
          >
            <Radio size={13} className="text-primary-500 animate-pulse" />
            Live broadcast mode active on {currentTargetLabel}.
          </p>
        )}
      </div>
    </div>
  );
};
