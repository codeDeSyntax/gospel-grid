import React, { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { DepthButton } from "@/shared/DepthButton";
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
  setProjectionTheme,
  startFeatureTimer,
  stopFeatureTimer,
  getTimerFeatureWindowId,
  updateTimerStateInCollection,
  normalizeFeatureTimerState,
  type FeatureTimerCollection,
  type FeatureTimerItem,
  type FeatureTimerState,
} from "./featureTimerState";
import { FaThemeco } from "react-icons/fa";
import { FaThemeisle } from "react-icons/fa6";

const QUICK_MINUTES = [1, 3, 5, 10, 15, 30, 45, 60];
type EditableUnit = "days" | "hours" | "minutes" | "seconds";
type EditableUnitOrNone = EditableUnit | null;

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

interface FlipCardProps {
  value: string;
  label: string;
  isDarkMode: boolean;
  editable?: boolean;
  editing?: boolean;
  editValue?: string;
  onBeginEdit?: () => void;
  onCommitEdit?: () => void;
  onCancelEdit?: () => void;
  onChangeEditValue?: (next: string) => void;
}

const FlipCard: React.FC<FlipCardProps> = ({
  value,
  label,
  isDarkMode,
  editable = false,
  editing = false,
  editValue = "",
  onBeginEdit,
  onCommitEdit,
  onCancelEdit,
  onChangeEditValue,
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        onClick={() => {
          if (editable && !editing) onBeginEdit?.();
        }}
        className={`relative h-28 w-28 overflow-hidden rounded-2xl border shadow-[0_14px_30px_rgba(0,0,0,0.30)] ${
          isDarkMode
            ? "border-white/10 bg-black text-white"
            : "border-black/12 bg-white text-black"
        } ${editable ? "cursor-text" : ""}`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/12 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-1/2 h-px bg-black/50" />
        <div className="absolute inset-x-0 top-[calc(50%-1px)] h-[2px] bg-white/20" />
        {editing ? (
          <div className="flex h-full items-center justify-center px-2">
            <input
              autoFocus
              value={editValue}
              onChange={(e) => onChangeEditValue?.(e.target.value)}
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
              className={`h-16 w-full bg-transparent text-center font-[impact] text-[56px] leading-none tracking-wide outline-none ${
                isDarkMode ? "text-white" : "text-black"
              }`}
              inputMode="numeric"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center font-[impact] text-[74px] leading-none tracking-wide">
            {value}
          </div>
        )}
      </div>
      <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-theme-primary-400">
        {label}
      </span>
    </div>
  );
};

export const FeatureTimerView: React.FC = () => {
  const appTheme = useAppSelector((s) => s.app.theme);
  const displayAssignments = useAppSelector((s) => s.grid.displayAssignments);
  const isDarkMode = appTheme === "dark";
  const [timerCollection, setTimerCollection] =
    useState<FeatureTimerCollection>(() => loadFeatureTimerCollection());
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isDraftMode, setIsDraftMode] = useState(false);
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

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      setTimerCollection((prev) => {
        const next = markCollectionCompletedIfElapsed(prev, Date.now());
        if (next !== prev) {
          saveFeatureTimerCollection(next);
        }
        return next;
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, []);

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
    const nextCollection = updateTimerStateInCollection(
      timerCollection,
      activeTimer.id,
      nextState,
    );
    applyCollection(nextCollection);
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
    const sourceState =
      isDraftMode || !activeTimer ? draftTimerState : activeTimerState;
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
      pausedRemainingMs:
        sourceState.mode === "countdown" ? sourceState.durationMs : null,
      updatedAtMs: Date.now(),
    };

    const nextCollection = updateTimerStateInCollection(
      createdCollection,
      createdTimer.id,
      clonedState,
    );

    applyCollection(nextCollection);
    setIsDraftMode(false);
    setEditingUnit(null);
    setDraftTimerState(createDefaultFeatureTimerState());
  };

  const deselectForDraft = () => {
    setIsDraftMode(true);
    setEditingUnit(null);
    setDraftTimerState(createDefaultFeatureTimerState());
  };

  const selectedTimerState =
    activeTimerState ?? createDefaultFeatureTimerState();
  const editorTimerState = isDraftMode ? draftTimerState : selectedTimerState;

  const remainingMs = useMemo(
    () =>
      editorTimerState ? getCountdownRemainingMs(editorTimerState, nowMs) : 0,
    [editorTimerState, nowMs],
  );

  const countdownParts = useMemo(
    () => splitDuration(remainingMs),
    [remainingMs],
  );
  const clockParts = useMemo(() => formatClock(new Date(nowMs)), [nowMs]);

  const isCountdown = editorTimerState.mode === "countdown";
  const isRunning = editorTimerState.status === "running";
  const isPaused = editorTimerState.status === "paused";
  const canStart = isCountdown
    ? remainingMs > 0 && editorTimerState.durationMs > 0
    : true;

  const assignedWindowIds = useMemo(
    () => new Set(Object.values(displayAssignments).flat()),
    [displayAssignments],
  );

  const activeTimerWindowId = getTimerFeatureWindowId(activeTimer?.id ?? "");
  const isAssignedToScreen =
    !isDraftMode && assignedWindowIds.has(activeTimerWindowId);

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

  const cancelEdit = () => {
    setEditingUnit(null);
  };

  const commitEdit = () => {
    if (!editingUnit || !editorTimerState) return;

    const days = Math.max(0, Math.min(999, Number(draftValues.days) || 0));
    const hours = Math.max(0, Math.min(23, Number(draftValues.hours) || 0));
    const minutes = Math.max(0, Math.min(59, Number(draftValues.minutes) || 0));
    const seconds = Math.max(0, Math.min(59, Number(draftValues.seconds) || 0));

    const totalMs =
      (((days * 24 + hours) * 60 + minutes) * 60 + seconds) * 1000;

    let next = setDurationMs(editorTimerState, totalMs);
    if (isRunning && totalMs > 0) {
      next = startFeatureTimer(next);
    }

    applyEditorTimerState(next);
    setEditingUnit(null);
  };

  const changeDraftValue = (unit: EditableUnit, nextRaw: string) => {
    const numeric = nextRaw.replace(/[^0-9]/g, "");
    setDraftValues((prev) => ({ ...prev, [unit]: numeric }));
  };

  if (!activeTimer || !activeTimerState) {
    return (
      <div
        className={`h-full w-full rounded-2xl px-6 py-6 overflow-auto no-scrollbar ${
          isDarkMode ? "bg-black text-white" : "bg-white text-black"
        }`}
      >
        <div className="h-full flex items-center justify-center text-theme-primary-300/80">
          No timer instance available.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full w-full rounded-2xl px-6 py-6 overflow-auto no-scrollbar ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl gap-4 h-full min-h-0">
        <aside className="w-[240px] shrink-0 rounded-2xl border border-theme-primary-500/30 bg-theme-primary-900/22 p-3 overflow-auto">
          <div className="flex items-center justify-between gap-2 mb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-primary-300">
              Timer Windows
            </p>
          </div>

          <div className="space-y-1.5">
            {timerCollection.timers.map((timer, index) => {
              const isActive = !isDraftMode && timer.id === activeTimer.id;
              const timerId = getTimerFeatureWindowId(timer.id);
              const assigned = assignedWindowIds.has(timerId);

              return (
                <div
                  key={timer.id}
                  className={`relative overflow-hidden transition-all duration-200 flex items-center gap-2 pl-2.5 pr-8 py-1 rounded-xl group ${
                    isActive
                      ? "bg-theme-primary-700/20 ring-1 ring-theme-primary-300/55"
                      : "bg-theme-primary-900 hover:bg-theme-primary-800/15"
                  }`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 transition-opacity duration-700 pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsDraftMode(false);
                      applyCollection(
                        setActiveTimerId(timerCollection, timer.id),
                      );
                    }}
                    className="w-full text-left min-w-0 z-10 flex items-center gap-2"
                    title={timer.name}
                  >
                    <span
                      className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold leading-none ${
                        isActive
                          ? "bg-emerald-400 text-black ring-2 ring-emerald-200/60"
                          : "bg-theme-primary-600/40 text-theme-primary-100"
                      }`}
                    >
                      {timerCollection.timers.length - index}
                    </span>

                    <span className="min-w-0 flex-1 flex flex-col">
                      <span className="text-[11px] font-semibold text-theme-primary-100 truncate leading-tight">
                        {timer.name}
                      </span>
                      <span className="text-[10px] text-theme-primary-300/75 leading-tight">
                        {isActive
                          ? `Selected • ${assigned ? "Assigned" : "Not Assigned"}`
                          : assigned
                            ? "Assigned"
                            : "Not Assigned"}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyCollection(
                        removeTimerFromCollection(timerCollection, timer.id),
                      )
                    }
                    className="absolute right-1.5 top-1 z-20 h-5 w-5 rounded-md text-theme-primary-200/70 text-[10px] leading-none hover:text-theme-primary-50"
                    title="Delete timer"
                  >
                    x
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-3 rounded-lg border border-theme-primary-500/25 bg-theme-primary-900/15 p-2 text-[10px] text-theme-primary-300/75">
            Drag a timer window from the left list to a display to enable
            start/stop/resume.
          </div>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col gap-6">
          <div className="text-center">
            <p className="text-[44px] font-[impact] tracking-[0.12em] uppercase text-theme-primary-300">
              {isCountdown ? "Countdown" : "Current Time"}
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-theme-primary-400/80 mt-1">
              Timer Feature Control
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5">
            {isCountdown ? (
              <>
                <FlipCard
                  value={pad2(countdownParts.days)}
                  label="Days"
                  isDarkMode={isDarkMode}
                  editable
                  editing={editingUnit === "days"}
                  editValue={draftValues.days}
                  onBeginEdit={() => beginEdit("days")}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onChangeEditValue={(next) => changeDraftValue("days", next)}
                />
                <FlipCard
                  value={pad2(countdownParts.hours)}
                  label="Hours"
                  isDarkMode={isDarkMode}
                  editable
                  editing={editingUnit === "hours"}
                  editValue={draftValues.hours}
                  onBeginEdit={() => beginEdit("hours")}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onChangeEditValue={(next) => changeDraftValue("hours", next)}
                />
                <FlipCard
                  value={pad2(countdownParts.minutes)}
                  label="Minutes"
                  isDarkMode={isDarkMode}
                  editable
                  editing={editingUnit === "minutes"}
                  editValue={draftValues.minutes}
                  onBeginEdit={() => beginEdit("minutes")}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onChangeEditValue={(next) =>
                    changeDraftValue("minutes", next)
                  }
                />
                <FlipCard
                  value={pad2(countdownParts.seconds)}
                  label="Seconds"
                  isDarkMode={isDarkMode}
                  editable
                  editing={editingUnit === "seconds"}
                  editValue={draftValues.seconds}
                  onBeginEdit={() => beginEdit("seconds")}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onChangeEditValue={(next) =>
                    changeDraftValue("seconds", next)
                  }
                />
              </>
            ) : (
              <>
                <FlipCard
                  value={clockParts.hours}
                  label="Hours"
                  isDarkMode={isDarkMode}
                />
                <FlipCard
                  value={clockParts.minutes}
                  label="Minutes"
                  isDarkMode={isDarkMode}
                />
                <FlipCard
                  value={clockParts.seconds}
                  label="Seconds"
                  isDarkMode={isDarkMode}
                />
              </>
            )}
          </div>

          <div className="mx-auto w-full max-w-4xl rounded-2xl border border-theme-primary-500/30 bg-theme-primary-900/20 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <DepthButton
                onClick={() =>
                  applyEditorTimerState(
                    setTimerMode(editorTimerState, "countdown"),
                  )
                }
                active={editorTimerState.mode === "countdown"}
                sizeClassName="h-9 px-4 rounded-xl"
                activeClassName="text-theme-primary-50 border-theme-primary-300/70"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Countdown
                </span>
              </DepthButton>
              <DepthButton
                onClick={() =>
                  applyEditorTimerState(setTimerMode(editorTimerState, "clock"))
                }
                active={editorTimerState.mode === "clock"}
                sizeClassName="h-9 px-4 rounded-xl"
                activeClassName="text-theme-primary-50 border-theme-primary-300/70"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Current Time
                </span>
              </DepthButton>
              <DepthButton
                onClick={deselectForDraft}
                active={isDraftMode}
                sizeClassName="h-9 px-4 rounded-xl"
                activeClassName="text-theme-primary-50 border-theme-primary-300/70"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Deselect
                </span>
              </DepthButton>
              <DepthButton
                onClick={addFromCurrentTimer}
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Add
                </span>
              </DepthButton>
              <DepthButton
                onClick={() =>
                  applyEditorTimerState(
                    setProjectionTheme(
                      editorTimerState,
                      editorTimerState.projectionTheme === "dark"
                        ? "light"
                        : "dark",
                    ),
                  )
                }
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <FaThemeisle size={16} className="text-theme-primary-300" />
              </DepthButton>
            </div>

            {isDraftMode && (
              <p className="mt-2 text-center text-[11px] text-theme-primary-300/80">
                Draft mode: edit a new timer value, then click Add.
              </p>
            )}

            {isCountdown && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {QUICK_MINUTES.map((mins) => (
                    <DepthButton
                      key={mins}
                      onClick={() =>
                        applyEditorTimerState(
                          setDurationMs(editorTimerState, mins * 60 * 1000),
                        )
                      }
                      sizeClassName="h-8 px-3 rounded-lg"
                      inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
                    >
                      <span className="text-[11px] font-semibold">{mins}m</span>
                    </DepthButton>
                  ))}
                </div>
              </>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <DepthButton
                onClick={() =>
                  applyEditorTimerState(startFeatureTimer(editorTimerState))
                }
                disabled={!isAssignedToScreen || !canStart}
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase">
                  {isPaused ? "Resume" : "Start"}
                </span>
              </DepthButton>

              <DepthButton
                onClick={() =>
                  applyEditorTimerState(pauseFeatureTimer(editorTimerState))
                }
                disabled={!isAssignedToScreen || !isRunning}
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase">Pause</span>
              </DepthButton>

              <DepthButton
                onClick={() =>
                  applyEditorTimerState(stopFeatureTimer(editorTimerState))
                }
                disabled={!isAssignedToScreen}
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase">Stop</span>
              </DepthButton>

              <DepthButton
                onClick={() =>
                  applyEditorTimerState(resetFeatureTimer(editorTimerState))
                }
                sizeClassName="h-9 px-4 rounded-xl"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="text-xs font-semibold uppercase">Reset</span>
              </DepthButton>
            </div>
            {!isAssignedToScreen && (
              <p className="mt-3 text-center text-[11px] text-theme-primary-300/80">
                Assign this timer window to a screen first to enable Start,
                Resume, and Stop.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
