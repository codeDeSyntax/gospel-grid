import React, { useEffect, useMemo, useState, memo, useCallback, useRef } from "react";
import { useAppSelector } from "@/store/hooks";
import { DepthButton } from "@/shared/DepthButton";
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  Hourglass,
  Monitor,
  Layers,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  addTimerToCollection,
  createDefaultFeatureTimerState,
  getActiveTimerItem,
  getCountdownRemainingMs,
  loadFeatureTimerCollection,
  markCollectionCompletedIfElapsed,
  pauseFeatureTimer,
  removeTimerFromCollection,
  resetFeatureTimer,
  saveFeatureTimerCollection,
  setActiveTimerId,
  setDurationMs,
  setTimerMode,
  startFeatureTimer,
  stopFeatureTimer,
  getTimerFeatureWindowId,
  updateTimerStateInCollection,
  normalizeFeatureTimerState,
  type FeatureTimerCollection,
  type FeatureTimerItem,
  type FeatureTimerState,
} from "../RightPanel/featureTimerState";

type EditableUnit = "days" | "hours" | "minutes" | "seconds";
type EditableUnitOrNone = EditableUnit | null;

// ─── UTILITIES ───────────────────────────────────────────────────────────────
const pad2 = (value: number) => String(Math.max(0, value)).padStart(2, "0");

const splitDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const formatClock = (date: Date) => ({
  hours: pad2(date.getHours()),
  minutes: pad2(date.getMinutes()),
  seconds: pad2(date.getSeconds()),
});

// ─── FLIP / SPLIT-CARD DIGIT COMPONENT ───────────────────────────────────────
interface FlipDigitCardProps {
  value: string;
  label: string;
  isDarkMode: boolean;
  isRunning?: boolean;
  isPaused?: boolean;
  editable?: boolean;
  editing?: boolean;
  editValue?: string;
  onBeginEdit?: () => void;
  onCommitEdit?: () => void;
  onCancelEdit?: () => void;
  onChangeEditValue?: (v: string) => void;
}

const FlipDigitCard: React.FC<FlipDigitCardProps> = ({
  value,
  label,
  isDarkMode,
  isRunning = false,
  isPaused = false,
  editable = false,
  editing = false,
  editValue = "",
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onChangeEditValue,
}) => {
  const digitColor = isRunning
    ? isDarkMode
      ? "text-primary-400"
      : "text-primary-600"
    : isPaused
      ? isDarkMode
        ? "text-amber-400"
        : "text-amber-600"
      : isDarkMode
        ? "text-white"
        : "text-neutral-900";

  return (
    <div className="flex flex-col items-center flex-1 max-w-[160px] min-w-[85px] sm:min-w-[115px]">
      {/* ── Outer Card Enclosure (Subtle & Integrated) ─────────────────── */}
      <div
        onClick={() => editable && !editing && onBeginEdit?.()}
        title={editable && !editing ? "Click to edit time" : undefined}
        className={`relative w-full aspect-[3.2/4] sm:aspect-[3.4/4] rounded-2xl sm:rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-300 select-none ${
          editable && !editing ? "cursor-pointer group hover:scale-[1.01]" : ""
        } ${
          isDarkMode
            ? "bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.2)]"
            : "bg-white/60 backdrop-blur-sm border border-neutral-300/70 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
        } ${
          isRunning
            ? "border-primary-500/50 shadow-[0_0_20px_rgba(94,172,36,0.15)] ring-1 ring-primary-500/30"
            : isPaused
              ? "border-amber-500/40 ring-1 ring-amber-500/20"
              : ""
        }`}
      >
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none" />

        {/* ── Central Flip Crease / Slit (Subtle) ────────── */}
        <div
          className={`absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] z-20 pointer-events-none ${
            isDarkMode ? "bg-white/[0.08]" : "bg-black/[0.08]"
          }`}
        />

        {/* Left Pivot Notch */}
        <div
          className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-20 ${
            isDarkMode
              ? "bg-[#252525] border border-white/10"
              : "bg-neutral-200 border border-neutral-300"
          }`}
        />

        {/* Right Pivot Notch */}
        <div
          className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full z-20 ${
            isDarkMode
              ? "bg-[#252525] border border-white/10"
              : "bg-neutral-200 border border-neutral-300"
          }`}
        />

        {/* ── The Bold Heavy Digits ─────────────── */}
        <div className="relative z-10 w-full flex items-center justify-center px-1">
          {editing ? (
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onChangeEditValue?.(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={() => onCommitEdit?.()}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onCommitEdit?.();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  onCancelEdit?.();
                }
              }}
              className={`w-full bg-transparent border-none outline-none text-center tabular-nums font-black leading-none tracking-tight select-all text-5xl sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-sm ${
                isDarkMode ? "text-primary-400" : "text-primary-600"
              }`}
              style={{
                fontFamily:
                  "'Impact', 'Arial Black', 'Outfit', 'Montserrat', 'Inter', sans-serif",
                fontWeight: 900,
              }}
              inputMode="numeric"
              maxLength={label === "Days" ? 3 : 2}
            />
          ) : (
            <span
              className={`tabular-nums font-black leading-none tracking-tighter transition-colors duration-200 text-5xl sm:text-6xl md:text-7xl lg:text-8xl ${digitColor} ${
                editable
                  ? isDarkMode
                    ? "group-hover:text-primary-400"
                    : "group-hover:text-primary-600"
                  : ""
              }`}
              style={{
                fontFamily:
                  "'Impact', 'Arial Black', 'Outfit', 'Montserrat', 'Inter', sans-serif",
                fontWeight: 900,
                letterSpacing: "-0.04em",
              }}
            >
              {value}
            </span>
          )}
        </div>
      </div>

      {/* ── Label Below Card ── */}
      <span
        className={`mt-2.5 text-[11px] sm:text-[12px] font-extrabold uppercase tracking-[0.25em] ${
          isDarkMode ? "text-neutral-400" : "text-neutral-600"
        }`}
      >
        {label}
      </span>
    </div>
  );
};

const MemoizedFlipDigitCard = memo(FlipDigitCard);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export const FeatureTimerView: React.FC = () => {
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const displayAssignments = useAppSelector((s) => s.grid.displayAssignments);

  const [timerCollection, setTimerCollection] =
    useState<FeatureTimerCollection>(() => loadFeatureTimerCollection());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isDraftMode, setIsDraftMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [draftTimerState, setDraftTimerState] = useState<FeatureTimerState>(
    () => createDefaultFeatureTimerState(),
  );
  const [editingUnit, setEditingUnit] = useState<EditableUnitOrNone>(null);
  const [draftValues, setDraftValues] = useState<Record<EditableUnit, string>>({
    days: "00",
    hours: "00",
    minutes: "00",
    seconds: "00",
  });

  const rafIdRef = React.useRef<number | null>(null);
  const lastUpdateRef = React.useRef<number>(0);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const throttledTimeUpdate = useCallback(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) {
      rafIdRef.current = requestAnimationFrame(throttledTimeUpdate);
      return;
    }
    lastUpdateRef.current = now;
    setNowMs(now);
    setTimerCollection((prev) => {
      const next = markCollectionCompletedIfElapsed(prev, now);
      if (next !== prev) saveFeatureTimerCollection(next);
      return next;
    });
    rafIdRef.current = requestAnimationFrame(throttledTimeUpdate);
  }, []);

  useEffect(() => {
    rafIdRef.current = requestAnimationFrame(throttledTimeUpdate);
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, [throttledTimeUpdate]);

  const activeTimer = useMemo<FeatureTimerItem | null>(
    () => getActiveTimerItem(timerCollection),
    [timerCollection],
  );
  const activeTimerState = activeTimer?.state ?? null;

  const applyCollection = (next: FeatureTimerCollection) => {
    setTimerCollection(next);
    saveFeatureTimerCollection(next);
  };

  const applyActiveTimerState = (nextState: typeof activeTimerState) => {
    if (!activeTimer || !nextState) return;
    applyCollection(updateTimerStateInCollection(timerCollection, activeTimer.id, nextState));
  };

  const applyEditorTimerState = (nextState: FeatureTimerState | null) => {
    if (!nextState) return;
    if (isDraftMode || !activeTimer) {
      setDraftTimerState(normalizeFeatureTimerState(nextState));
      return;
    }
    applyActiveTimerState(nextState);
  };

  const addFromCurrentTimer = () => {
    const sourceState = isDraftMode || !activeTimer ? draftTimerState : activeTimerState;
    if (!sourceState) return;
    const createdCollection = addTimerToCollection(timerCollection);
    const createdTimer = getActiveTimerItem(createdCollection);
    if (!createdTimer) {
      applyCollection(createdCollection);
      return;
    }
    const clonedState = {
      ...sourceState,
      status: "idle" as const,
      endAtMs: null,
      pausedRemainingMs: sourceState.mode === "countdown" ? sourceState.durationMs : null,
      updatedAtMs: Date.now(),
    };
    applyCollection(updateTimerStateInCollection(createdCollection, createdTimer.id, clonedState));
    setIsDraftMode(false);
    setEditingUnit(null);
    setDraftTimerState(createDefaultFeatureTimerState());
    setIsDropdownOpen(false);
  };

  const deselectForDraft = () => {
    setIsDraftMode(true);
    setEditingUnit(null);
    setDraftTimerState(createDefaultFeatureTimerState());
  };

  const selectedTimerState = activeTimerState ?? createDefaultFeatureTimerState();
  const editorTimerState = isDraftMode ? draftTimerState : selectedTimerState;

  const remainingMs = useMemo(
    () => (editorTimerState ? getCountdownRemainingMs(editorTimerState, nowMs) : 0),
    [editorTimerState, nowMs],
  );
  const countdownParts = useMemo(() => splitDuration(remainingMs), [remainingMs]);
  const clockParts = useMemo(() => formatClock(new Date(nowMs)), [nowMs]);

  const isCountdown = editorTimerState.mode === "countdown";
  const isRunning = editorTimerState.status === "running";
  const isPaused = editorTimerState.status === "paused";
  const canStart = isCountdown ? remainingMs > 0 && editorTimerState.durationMs > 0 : true;

  const assignedWindowIds = useMemo(
    () => new Set(Object.values(displayAssignments).flat()),
    [displayAssignments],
  );
  const activeTimerWindowId = getTimerFeatureWindowId(activeTimer?.id ?? "");
  const isAssignedToScreen = !isDraftMode && assignedWindowIds.has(activeTimerWindowId);

  const beginEdit = (unit: EditableUnit) => {
    if (!isCountdown || !editorTimerState) return;
    setDraftValues({
      days: pad2(countdownParts.days),
      hours: pad2(countdownParts.hours),
      minutes: pad2(countdownParts.minutes),
      seconds: pad2(countdownParts.seconds),
    });
    setEditingUnit(unit);
  };
  const cancelEdit = () => setEditingUnit(null);
  const commitEdit = () => {
    if (!editingUnit || !editorTimerState) return;
    const days = Math.max(0, Math.min(999, Number(draftValues.days) || 0));
    const hours = Math.max(0, Math.min(23, Number(draftValues.hours) || 0));
    const minutes = Math.max(0, Math.min(59, Number(draftValues.minutes) || 0));
    const seconds = Math.max(0, Math.min(59, Number(draftValues.seconds) || 0));
    const totalMs = (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;
    let next = setDurationMs(editorTimerState, totalMs);
    if (isRunning && totalMs > 0) next = startFeatureTimer(next);
    applyEditorTimerState(next);
    setEditingUnit(null);
  };
  const changeDraftValue = (unit: EditableUnit, v: string) =>
    setDraftValues((prev) => ({ ...prev, [unit]: v.replace(/[^0-9]/g, "") }));

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!activeTimer || !activeTimerState) {
    return (
      <div
        className={`h-full w-full rounded-r-2xl rounded-l-none px-6 py-6 overflow-auto no-scrollbar flex items-center justify-center ${
          isDarkMode
            ? "bg-theme-primary-900 theme-text-on-overlay"
            : "bg-theme-primary-900 theme-text-main"
        }`}
      >
        <div className="theme-text-muted text-sm font-medium">
          No timer instance available.
        </div>
      </div>
    );
  }

  // ── Panel background ─────────────────────────────────────────────────────────
  const panelBg = isDarkMode
    ? "bg-theme-primary-900 theme-text-on-overlay"
    : "bg-theme-primary-900 theme-text-main";

  // Reusable button styles with distinct contrast
  const secondaryBtnClasses = isDarkMode
    ? "bg-[#2c2c2c] hover:bg-[#383838] active:bg-[#444444] text-white border-theme-primary-700 shadow-sm"
    : "bg-white hover:bg-neutral-100 active:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-sm";

  return (
    <div
      className={`h-full w-full rounded-r-2xl rounded-l-none px-6 py-6 overflow-hidden relative flex flex-col justify-between ${panelBg}`}
    >
      {/* ── BACKGROUND ART PATTERN LAYER (Subtle light-catching planes) ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex items-center justify-center">
        {/* Short-width central stage for the light-plane composition */}
        <div className="relative w-full max-w-2xl h-full flex items-center justify-center pointer-events-none">
          {/* Directional ambient light ray */}
          <div
            className={`absolute top-[-10%] w-72 h-[120%] transform -skew-x-12 blur-3xl opacity-70 pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-b from-primary-500/[0.06] via-white/[0.02] to-transparent"
                : "bg-gradient-to-b from-primary-500/[0.06] via-white/40 to-transparent"
            }`}
          />

          {/* Angled Light Plane 1 (Main Facet) */}
          <div
            className={`absolute w-[320px] h-[340px] transform -rotate-12 skew-y-3 rounded-3xl border pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-br from-white/[0.035] via-white/[0.005] to-transparent border-white/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.25)]"
                : "bg-gradient-to-br from-white/70 via-white/20 to-transparent border-neutral-300/50 shadow-sm"
            }`}
          />

          {/* Overlapping Faceted Light Plane 2 */}
          <div
            className={`absolute w-[360px] h-[290px] transform rotate-6 -skew-x-6 rounded-3xl border pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-tr from-white/[0.025] via-primary-500/[0.015] to-transparent border-white/[0.04]"
                : "bg-gradient-to-tr from-white/50 via-primary-500/[0.02] to-transparent border-neutral-200/60"
            }`}
          />

          {/* Third subtle horizontal backplane */}
          <div
            className={`absolute w-[420px] h-[230px] transform -rotate-2 rounded-2xl border pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-b from-white/[0.018] to-transparent border-white/[0.03]"
                : "bg-gradient-to-b from-white/40 to-transparent border-neutral-200/40"
            }`}
          />

          {/* Delicate light streak accents indicating time rays */}
          <div
            className={`absolute top-1/4 -left-6 w-px h-52 transform rotate-45 pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-b from-transparent via-white/15 to-transparent"
                : "bg-gradient-to-b from-transparent via-neutral-400/25 to-transparent"
            }`}
          />
          <div
            className={`absolute top-1/3 -right-6 w-px h-44 transform -rotate-30 pointer-events-none ${
              isDarkMode
                ? "bg-gradient-to-b from-transparent via-primary-400/20 to-transparent"
                : "bg-gradient-to-b from-transparent via-primary-500/20 to-transparent"
            }`}
          />
        </div>
      </div>

      {/* ── FOREGROUND CONTENT (z-10) ────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-between h-full w-full min-h-0">
        {/* ── TOP HEADER / NAVBAR (Landing Page Style) ────────────────────────── */}
        <div className="flex items-center justify-between gap-3 w-full max-w-5xl mx-auto">
          {/* Left: Timer Instance Selector Dropdown (Styled like TitleBar dropdown) */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex h-8 items-center gap-2 rounded-md border border-theme-primary-600/70 px-2.5 text-xs font-medium text-theme-primary-100 transition-colors outline-none cursor-pointer shadow-sm ${
                isDropdownOpen
                  ? "bg-theme-primary-700/55 border-theme-primary-500/50 text-theme-primary-50"
                  : "bg-theme-primary-850/60 hover:bg-theme-primary-750 hover:border-theme-primary-500/40 hover:text-theme-primary-50"
              }`}
              aria-haspopup="menu"
              aria-expanded={isDropdownOpen}
            >
              <Layers className="h-3.5 w-3.5 text-primary-500" strokeWidth={2.2} />
              <span className="max-w-[130px] truncate font-medium">
                {isDraftMode ? "Drafting Mode" : activeTimer.name}
              </span>
              <span className="rounded bg-theme-primary-700/50 px-1.5 py-0.2 text-[10px] text-theme-primary-300">
                {timerCollection.timers.length}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-theme-primary-300 transition-transform duration-150 ${
                  isDropdownOpen ? "rotate-180 text-theme-primary-100" : ""
                }`}
                strokeWidth={2}
              />
            </button>

            {/* Dropdown Menu Window (TitleBar Menu Style) */}
            {isDropdownOpen && (
              <div
                role="menu"
                className="absolute left-0 top-9 z-50 w-64 overflow-hidden rounded-md border border-solid border-theme-primary-600/70 bg-theme-primary-900 py-1 text-[12px] shadow-xl shadow-black/35"
              >
                <div className="px-3 py-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-theme-primary-400">
                  <span>Timer Instances</span>
                  <span className="text-[9px] text-theme-primary-500">
                    {timerCollection.timers.length} total
                  </span>
                </div>

                <div className="my-1 h-px bg-theme-primary-700/80" />

                <div className="max-h-56 overflow-y-auto space-y-0.5">
                  {timerCollection.timers.map((timer, index) => {
                    const isActive = !isDraftMode && timer.id === activeTimer.id;
                    const timerId = getTimerFeatureWindowId(timer.id);
                    const assigned = assignedWindowIds.has(timerId);
                    const timerRunning = timer.state.status === "running";

                    return (
                      <button
                        type="button"
                        role="menuitem"
                        key={timer.id}
                        onClick={() => {
                          setIsDraftMode(false);
                          applyCollection(setActiveTimerId(timerCollection, timer.id));
                          setIsDropdownOpen(false);
                        }}
                        className={`group flex h-8 w-full items-center justify-between border-0 bg-transparent px-3 text-left transition-colors cursor-pointer ${
                          isActive
                            ? "bg-primary-500/12 text-primary-500 font-medium"
                            : "text-black dark:text-white/80 hover:bg-theme-primary-800"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-4.5 w-4.5 shrink-0 rounded flex items-center justify-center text-[9px] font-bold ${
                              isActive
                                ? "bg-primary-500 text-white"
                                : "bg-theme-primary-700/60 text-theme-primary-300"
                            }`}
                          >
                            {timerCollection.timers.length - index}
                          </span>
                          <div className="min-w-0 flex items-center gap-1.5 truncate">
                            <span className="truncate">{timer.name}</span>
                            {timerRunning && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary-500 animate-pulse inline-block shrink-0" />
                            )}
                            <span className="text-[10px] text-theme-primary-400">
                              ({assigned ? "Live" : "Idle"})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {isActive && (
                            <Check className="h-3.5 w-3.5 text-primary-500 shrink-0" />
                          )}
                          {timerCollection.timers.length > 1 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                applyCollection(
                                  removeTimerFromCollection(timerCollection, timer.id),
                                );
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-theme-primary-400 hover:text-red-400 transition-opacity"
                              title="Remove instance"
                            >
                              <Trash2 size={12} />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="my-1 h-px bg-theme-primary-700/80" />

                {/* Add New Instance Button inside Dropdown */}
                <button
                  type="button"
                  role="menuitem"
                  onClick={addFromCurrentTimer}
                  className="flex h-8 w-full items-center gap-2 border-0 bg-transparent px-3 text-left transition-colors text-primary-500 hover:bg-primary-500/10 cursor-pointer font-medium"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                  <span className="truncate text-xs">Add New Instance</span>
                </button>
              </div>
            )}
          </div>

        {/* Center / Right: Mode Switcher & Status Badge */}
        <div className="flex items-center gap-2.5">
          {/* Pill mode switcher */}
          <div
            className={`inline-flex rounded-xl p-1 border shadow-inner ${
              isDarkMode ? "bg-[#181818] border-white/10" : "bg-neutral-200/80 border-neutral-300"
            }`}
          >
            {[
              { mode: "countdown" as const, icon: <Hourglass size={13} />, label: "Countdown" },
              { mode: "clock" as const, icon: <Clock size={13} />, label: "Clock" },
            ].map(({ mode, icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => applyEditorTimerState(setTimerMode(editorTimerState, mode))}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  editorTimerState.mode === mode
                    ? "bg-primary-500 text-white shadow-md"
                    : isDarkMode
                      ? "text-neutral-400 hover:text-white hover:bg-[#282828]"
                      : "text-neutral-700 hover:text-neutral-900 hover:bg-white"
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border shadow-sm ${
              isRunning
                ? "bg-primary-500/20 border-primary-500 text-primary-400"
                : isPaused
                  ? "bg-amber-400/20 border-amber-400 text-amber-400"
                  : isDarkMode
                    ? "bg-[#252525] border-theme-primary-700 text-theme-primary-300"
                    : "bg-white border-neutral-300 text-neutral-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRunning
                  ? "bg-primary-500 animate-pulse"
                  : isPaused
                    ? "bg-amber-400"
                    : isDarkMode
                      ? "bg-neutral-400"
                      : "bg-neutral-500"
              }`}
            />
            {isRunning ? "Running" : isPaused ? "Paused" : "Ready"}
          </span>

          {isAssignedToScreen && (
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-full border ${
                isDarkMode
                  ? "text-primary-400 bg-primary-500/15 border-primary-500/40"
                  : "text-primary-700 bg-primary-50 border-primary-400"
              }`}
            >
              <Monitor size={11} /> Projected
            </span>
          )}

          <DepthButton
            onClick={deselectForDraft}
            active={isDraftMode}
            sizeClassName="h-8 px-3 rounded-xl"
            activeClassName="bg-primary-500 text-white border-primary-600 shadow-sm"
            inactiveClassName={secondaryBtnClasses}
            title="Deselect to draft new settings"
          >
            <span className="text-[11px] font-bold">
              {isDraftMode ? "Drafting…" : "Draft"}
            </span>
          </DepthButton>
        </div>
      </div>

      {/* ── CENTER STAGE HERO (Landing Page Style) ─────────────────────────── */}
      <div className="flex flex-col items-center justify-center my-auto py-6">
        {/* Hero Tagline / Subtitle */}
        <p
          className={`text-xs sm:text-sm font-extrabold uppercase tracking-[0.3em] mb-6 text-center ${
            isDarkMode ? "text-neutral-400" : "text-neutral-600"
          }`}
        >
          {isCountdown ? (activeTimer.name || "Countdown Timer") : "Current Time"}
        </p>

        {/* ── LARGE FLIP DIGIT DISPLAY (Directly from reference) ──────────── */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-6 w-full max-w-4xl px-2">
          {isCountdown ? (
            <>
              <MemoizedFlipDigitCard
                value={pad2(countdownParts.days)}
                label="Days"
                isDarkMode={isDarkMode}
                isRunning={isRunning}
                isPaused={isPaused}
                editable
                editing={editingUnit === "days"}
                editValue={draftValues.days}
                onBeginEdit={() => beginEdit("days")}
                onCommitEdit={commitEdit}
                onCancelEdit={cancelEdit}
                onChangeEditValue={(v) => changeDraftValue("days", v)}
              />
              <MemoizedFlipDigitCard
                value={pad2(countdownParts.hours)}
                label="Hours"
                isDarkMode={isDarkMode}
                isRunning={isRunning}
                isPaused={isPaused}
                editable
                editing={editingUnit === "hours"}
                editValue={draftValues.hours}
                onBeginEdit={() => beginEdit("hours")}
                onCommitEdit={commitEdit}
                onCancelEdit={cancelEdit}
                onChangeEditValue={(v) => changeDraftValue("hours", v)}
              />
              <MemoizedFlipDigitCard
                value={pad2(countdownParts.minutes)}
                label="Minutes"
                isDarkMode={isDarkMode}
                isRunning={isRunning}
                isPaused={isPaused}
                editable
                editing={editingUnit === "minutes"}
                editValue={draftValues.minutes}
                onBeginEdit={() => beginEdit("minutes")}
                onCommitEdit={commitEdit}
                onCancelEdit={cancelEdit}
                onChangeEditValue={(v) => changeDraftValue("minutes", v)}
              />
              <MemoizedFlipDigitCard
                value={pad2(countdownParts.seconds)}
                label="Seconds"
                isDarkMode={isDarkMode}
                isRunning={isRunning}
                isPaused={isPaused}
                editable
                editing={editingUnit === "seconds"}
                editValue={draftValues.seconds}
                onBeginEdit={() => beginEdit("seconds")}
                onCommitEdit={commitEdit}
                onCancelEdit={cancelEdit}
                onChangeEditValue={(v) => changeDraftValue("seconds", v)}
              />
            </>
          ) : (
            <>
              <MemoizedFlipDigitCard
                value={clockParts.hours}
                label="Hours"
                isDarkMode={isDarkMode}
              />
              <MemoizedFlipDigitCard
                value={clockParts.minutes}
                label="Minutes"
                isDarkMode={isDarkMode}
              />
              <MemoizedFlipDigitCard
                value={clockParts.seconds}
                label="Seconds"
                isDarkMode={isDarkMode}
              />
            </>
          )}
        </div>

        {isCountdown && (
          <p
            className={`text-center text-xs font-medium mt-4 tracking-wide ${
              isDarkMode ? "text-neutral-500" : "text-neutral-500"
            }`}
          >
            Click any card to edit time · press Enter or Escape to save
          </p>
        )}
      </div>

      {/* ── BOTTOM PLAYBACK CONTROLS (Hero CTA Style) ──────────────────────── */}
      <div className="flex flex-col items-center justify-center gap-2 pb-2">
        <div className="flex flex-wrap items-center justify-center gap-3">
          {/* Start / Resume — Hero Primary Button */}
          <button
            type="button"
            disabled={!isAssignedToScreen || !canStart || isRunning}
            onClick={() => applyEditorTimerState(startFeatureTimer(editorTimerState))}
            className={`inline-flex items-center gap-2 h-11 px-7 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
              isAssignedToScreen && canStart && !isRunning
                ? "bg-primary-500 border-primary-400 text-white hover:bg-primary-400 active:scale-95 shadow-[0_0_20px_rgba(94,172,36,0.45)] cursor-pointer scale-105"
                : isDarkMode
                  ? "bg-[#222222] border-theme-primary-800 text-neutral-600 cursor-not-allowed opacity-50"
                  : "bg-neutral-200 border-neutral-300 text-neutral-400 cursor-not-allowed opacity-50"
            }`}
          >
            <Play size={15} className="fill-current" />
            {isPaused ? "Resume" : "Start"}
          </button>

          {/* Pause */}
          <DepthButton
            onClick={() => applyEditorTimerState(pauseFeatureTimer(editorTimerState))}
            disabled={!isAssignedToScreen || !isRunning}
            sizeClassName="h-11 px-5 rounded-2xl"
            inactiveClassName={
              isRunning
                ? isDarkMode
                  ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/60 shadow-sm"
                  : "bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-400 shadow-sm"
                : isDarkMode
                  ? "bg-[#252525] text-neutral-500 border-theme-primary-800 opacity-50 cursor-not-allowed"
                  : "bg-neutral-100 text-neutral-400 border-neutral-300 opacity-50 cursor-not-allowed"
            }
          >
            <div className="flex items-center gap-1.5">
              <Pause size={14} />
              <span className="text-xs font-bold uppercase">Pause</span>
            </div>
          </DepthButton>

          {/* Stop */}
          <DepthButton
            onClick={() => applyEditorTimerState(stopFeatureTimer(editorTimerState))}
            disabled={!isAssignedToScreen}
            sizeClassName="h-11 px-5 rounded-2xl"
            inactiveClassName={
              isAssignedToScreen
                ? isDarkMode
                  ? "bg-[#2c2c2c] hover:bg-rose-950/40 text-theme-primary-100 hover:text-rose-400 border-theme-primary-700 hover:border-rose-500/50 shadow-sm"
                  : "bg-white hover:bg-rose-50 text-neutral-800 hover:text-rose-600 border-neutral-300 hover:border-rose-400 shadow-sm"
                : isDarkMode
                  ? "bg-[#252525] text-neutral-500 border-theme-primary-800 opacity-50 cursor-not-allowed"
                  : "bg-neutral-100 text-neutral-400 border-neutral-300 opacity-50 cursor-not-allowed"
            }
          >
            <div className="flex items-center gap-1.5">
              <Square size={13} />
              <span className="text-xs font-bold uppercase">Stop</span>
            </div>
          </DepthButton>

          {/* Reset */}
          <DepthButton
            onClick={() => applyEditorTimerState(resetFeatureTimer(editorTimerState))}
            sizeClassName="h-11 px-5 rounded-2xl"
            inactiveClassName={secondaryBtnClasses}
          >
            <div className="flex items-center gap-1.5">
              <RotateCcw size={13} />
              <span className="text-xs font-bold uppercase">Reset</span>
            </div>
          </DepthButton>
        </div>

        {/* Assign hint */}
        {!isAssignedToScreen ? (
          <p
            className={`text-xs font-medium flex items-center gap-1.5 pt-1 ${
              isDarkMode ? "text-neutral-400" : "text-neutral-600"
            }`}
          >
            <Monitor size={13} className="text-primary-500 shrink-0" />
            Assign this timer window to a display slot to enable Start, Resume, and Stop controls.
          </p>
        ) : (
          isDraftMode && (
            <p className="text-xs font-medium text-primary-400 pt-1">
              Draft mode — click dropdown &quot;Add New Instance&quot; to save.
            </p>
          )
        )}
      </div>
    </div>
    </div>
  );
};
