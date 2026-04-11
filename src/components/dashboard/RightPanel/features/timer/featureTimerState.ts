export type FeatureTimerMode = "countdown" | "clock";
export type FeatureTimerStatus = "idle" | "running" | "paused" | "completed";
export type FeatureTimerProjectionTheme = "dark" | "light";

export interface FeatureTimerState {
  mode: FeatureTimerMode;
  status: FeatureTimerStatus;
  projectionTheme: FeatureTimerProjectionTheme;
  durationMs: number;
  endAtMs: number | null;
  pausedRemainingMs: number | null;
  showInWindowList: boolean;
  updatedAtMs: number;
}

export interface FeatureTimerItem {
  id: string;
  name: string;
  createdAtMs: number;
  state: FeatureTimerState;
}

export interface FeatureTimerCollection {
  timers: FeatureTimerItem[];
  activeTimerId: string | null;
  updatedAtMs: number;
}

export const TIMER_FEATURE_WINDOW_PREFIX = "feature:timer-window:";

export const getTimerFeatureWindowId = (timerId: string): string =>
  `${TIMER_FEATURE_WINDOW_PREFIX}${timerId}`;

export const FEATURE_TIMER_STORAGE_KEY = "wingrid.featureTimerState";
export const FEATURE_TIMER_EVENT = "wingrid:feature-timer-updated";

const DEFAULT_DURATION_MS = 10 * 60 * 1000;

const buildTimerId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createDefaultFeatureTimerState = (): FeatureTimerState => ({
  mode: "countdown",
  status: "idle",
  projectionTheme: "dark",
  durationMs: DEFAULT_DURATION_MS,
  endAtMs: null,
  pausedRemainingMs: DEFAULT_DURATION_MS,
  showInWindowList: false,
  updatedAtMs: Date.now(),
});

export const createFeatureTimerItem = (name?: string): FeatureTimerItem => {
  const nowMs = Date.now();
  const id = buildTimerId();
  return {
    id,
    name: name?.trim() || `Timer ${new Date(nowMs).toLocaleTimeString()}`,
    createdAtMs: nowMs,
    state: {
      ...createDefaultFeatureTimerState(),
      showInWindowList: true,
    },
  };
};

export const createDefaultFeatureTimerCollection =
  (): FeatureTimerCollection => {
    const first = createFeatureTimerItem("Timer 1");
    // Seed timer is for in-panel editing; keep it hidden from window list
    // until the user explicitly adds/creates a timer window.
    first.state.showInWindowList = false;
    return {
      timers: [first],
      activeTimerId: first.id,
      updatedAtMs: Date.now(),
    };
  };

function sanitizePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const normalized = Math.max(0, Math.floor(value));
  return normalized;
}

export function normalizeFeatureTimerState(
  value: Partial<FeatureTimerState> | null | undefined,
): FeatureTimerState {
  const base = createDefaultFeatureTimerState();
  const mode = value?.mode === "clock" ? "clock" : "countdown";
  const status: FeatureTimerStatus =
    value?.status === "running" ||
    value?.status === "paused" ||
    value?.status === "completed"
      ? value.status
      : "idle";

  const projectionTheme: FeatureTimerProjectionTheme =
    value?.projectionTheme === "light" ? "light" : "dark";

  const durationMs = sanitizePositiveInt(value?.durationMs, base.durationMs);
  const endAtMs =
    typeof value?.endAtMs === "number" && Number.isFinite(value.endAtMs)
      ? value.endAtMs
      : null;

  const pausedRemainingMs =
    typeof value?.pausedRemainingMs === "number" &&
    Number.isFinite(value.pausedRemainingMs)
      ? Math.max(0, Math.floor(value.pausedRemainingMs))
      : null;

  return {
    mode,
    status,
    projectionTheme,
    durationMs,
    endAtMs,
    pausedRemainingMs,
    showInWindowList: Boolean(value?.showInWindowList),
    updatedAtMs: sanitizePositiveInt(value?.updatedAtMs, Date.now()),
  };
}

function normalizeFeatureTimerItem(
  value: Partial<FeatureTimerItem> | null | undefined,
  index: number,
): FeatureTimerItem {
  const fallback = createFeatureTimerItem(`Timer ${index + 1}`);
  return {
    id: typeof value?.id === "string" && value.id ? value.id : fallback.id,
    name:
      typeof value?.name === "string" && value.name.trim()
        ? value.name
        : `Timer ${index + 1}`,
    createdAtMs: sanitizePositiveInt(value?.createdAtMs, fallback.createdAtMs),
    state: normalizeFeatureTimerState(
      value?.state as Partial<FeatureTimerState>,
    ),
  };
}

function isLegacySingleTimerState(
  value: unknown,
): value is Partial<FeatureTimerState> {
  if (!value || typeof value !== "object") return false;
  const maybe = value as Record<string, unknown>;
  return "mode" in maybe && "durationMs" in maybe;
}

export function normalizeFeatureTimerCollection(
  value:
    | Partial<FeatureTimerCollection>
    | Partial<FeatureTimerState>
    | null
    | undefined,
): FeatureTimerCollection {
  if (isLegacySingleTimerState(value)) {
    const migratedItem = createFeatureTimerItem("Timer 1");
    migratedItem.state = normalizeFeatureTimerState(value);
    return {
      timers: [migratedItem],
      activeTimerId: migratedItem.id,
      updatedAtMs: Date.now(),
    };
  }

  const candidateTimers = Array.isArray(
    (value as Partial<FeatureTimerCollection>)?.timers,
  )
    ? ((value as Partial<FeatureTimerCollection>).timers as Array<
        Partial<FeatureTimerItem>
      >)
    : [];

  const timers = candidateTimers.length
    ? candidateTimers.map((item, index) =>
        normalizeFeatureTimerItem(item, index),
      )
    : createDefaultFeatureTimerCollection().timers;

  const activeTimerIdRaw = (value as Partial<FeatureTimerCollection>)
    ?.activeTimerId;
  const activeTimerId =
    typeof activeTimerIdRaw === "string" &&
    timers.some((t) => t.id === activeTimerIdRaw)
      ? activeTimerIdRaw
      : (timers[0]?.id ?? null);

  const normalized: FeatureTimerCollection = {
    timers,
    activeTimerId,
    updatedAtMs: sanitizePositiveInt(
      (value as Partial<FeatureTimerCollection>)?.updatedAtMs,
      Date.now(),
    ),
  };

  // Migration: older versions could persist a single default seed timer as
  // visible, causing a phantom timer row in WindowList on startup.
  if (normalized.timers.length === 1) {
    const only = normalized.timers[0];
    const looksLikeSeedTimer =
      /^Timer\s+1$/i.test(only.name) &&
      only.state.mode === "countdown" &&
      only.state.status === "idle" &&
      only.state.durationMs === DEFAULT_DURATION_MS;

    if (looksLikeSeedTimer && only.state.showInWindowList) {
      normalized.timers = [
        {
          ...only,
          state: {
            ...only.state,
            showInWindowList: false,
            updatedAtMs: Date.now(),
          },
        },
      ];
      normalized.updatedAtMs = Date.now();
    }
  }

  return normalized;
}

export function loadFeatureTimerState(): FeatureTimerState {
  try {
    const raw = localStorage.getItem(FEATURE_TIMER_STORAGE_KEY);
    if (!raw) return createDefaultFeatureTimerState();
    const parsed = JSON.parse(raw) as Partial<FeatureTimerState>;
    return normalizeFeatureTimerState(parsed);
  } catch {
    return createDefaultFeatureTimerState();
  }
}

export function loadFeatureTimerCollection(): FeatureTimerCollection {
  try {
    const raw = localStorage.getItem(FEATURE_TIMER_STORAGE_KEY);
    if (!raw) return createDefaultFeatureTimerCollection();
    const parsed = JSON.parse(raw) as
      | Partial<FeatureTimerCollection>
      | Partial<FeatureTimerState>;
    return normalizeFeatureTimerCollection(parsed);
  } catch {
    return createDefaultFeatureTimerCollection();
  }
}

export function saveFeatureTimerState(next: FeatureTimerState): void {
  const normalized = normalizeFeatureTimerState(next);
  localStorage.setItem(FEATURE_TIMER_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent(FEATURE_TIMER_EVENT, {
      detail: normalized,
    }),
  );
}

export function saveFeatureTimerCollection(next: FeatureTimerCollection): void {
  const normalized = normalizeFeatureTimerCollection(next);
  localStorage.setItem(FEATURE_TIMER_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent(FEATURE_TIMER_EVENT, {
      detail: normalized,
    }),
  );
}

export function getActiveTimerItem(
  collection: FeatureTimerCollection,
): FeatureTimerItem | null {
  if (!collection.timers.length) return null;
  const match = collection.timers.find(
    (t) => t.id === collection.activeTimerId,
  );
  return match ?? collection.timers[0];
}

export function setActiveTimerId(
  collection: FeatureTimerCollection,
  timerId: string,
): FeatureTimerCollection {
  if (!collection.timers.some((t) => t.id === timerId)) return collection;
  return {
    ...collection,
    activeTimerId: timerId,
    updatedAtMs: Date.now(),
  };
}

export function addTimerToCollection(
  collection: FeatureTimerCollection,
  name?: string,
): FeatureTimerCollection {
  const nextItem = createFeatureTimerItem(
    name || `Timer ${collection.timers.length + 1}`,
  );
  return {
    timers: [nextItem, ...collection.timers],
    activeTimerId: nextItem.id,
    updatedAtMs: Date.now(),
  };
}

export function removeTimerFromCollection(
  collection: FeatureTimerCollection,
  timerId: string,
): FeatureTimerCollection {
  const filtered = collection.timers.filter((t) => t.id !== timerId);
  if (!filtered.length) {
    const fallback = createDefaultFeatureTimerCollection();
    return fallback;
  }

  const nextActiveId =
    collection.activeTimerId === timerId
      ? filtered[0].id
      : collection.activeTimerId &&
          filtered.some((t) => t.id === collection.activeTimerId)
        ? collection.activeTimerId
        : filtered[0].id;

  return {
    timers: filtered,
    activeTimerId: nextActiveId,
    updatedAtMs: Date.now(),
  };
}

export function updateTimerStateInCollection(
  collection: FeatureTimerCollection,
  timerId: string,
  nextState: FeatureTimerState,
): FeatureTimerCollection {
  const nextTimers = collection.timers.map((timer) =>
    timer.id === timerId
      ? { ...timer, state: normalizeFeatureTimerState(nextState) }
      : timer,
  );

  return {
    ...collection,
    timers: nextTimers,
    updatedAtMs: Date.now(),
  };
}

export function markCollectionCompletedIfElapsed(
  collection: FeatureTimerCollection,
  nowMs = Date.now(),
): FeatureTimerCollection {
  let changed = false;

  const nextTimers = collection.timers.map((timer) => {
    const nextState = markCompletedIfElapsed(timer.state, nowMs);
    if (nextState !== timer.state) changed = true;
    return nextState === timer.state ? timer : { ...timer, state: nextState };
  });

  if (!changed) return collection;

  return {
    ...collection,
    timers: nextTimers,
    updatedAtMs: nowMs,
  };
}

export function getCountdownRemainingMs(
  state: FeatureTimerState,
  nowMs = Date.now(),
): number {
  if (state.mode !== "countdown") return 0;

  if (state.status === "running" && state.endAtMs) {
    return Math.max(0, state.endAtMs - nowMs);
  }

  if (state.status === "paused" || state.status === "completed") {
    if (typeof state.pausedRemainingMs === "number") {
      return Math.max(0, state.pausedRemainingMs);
    }
  }

  return Math.max(0, state.durationMs);
}

export function setDurationMs(
  state: FeatureTimerState,
  durationMs: number,
): FeatureTimerState {
  const nextDuration = Math.max(0, Math.floor(durationMs));
  return {
    ...state,
    mode: "countdown",
    durationMs: nextDuration,
    pausedRemainingMs: nextDuration,
    endAtMs: null,
    status: "idle",
    showInWindowList: nextDuration > 0,
    updatedAtMs: Date.now(),
  };
}

export function startFeatureTimer(state: FeatureTimerState): FeatureTimerState {
  if (state.mode === "clock") {
    return {
      ...state,
      status: "running",
      showInWindowList: true,
      updatedAtMs: Date.now(),
    };
  }

  const nowMs = Date.now();
  const remaining = getCountdownRemainingMs(state, nowMs);
  const safeRemaining =
    remaining > 0 ? remaining : Math.max(0, state.durationMs);

  return {
    ...state,
    status: "running",
    endAtMs: nowMs + safeRemaining,
    pausedRemainingMs: null,
    showInWindowList: safeRemaining > 0,
    updatedAtMs: nowMs,
  };
}

export function pauseFeatureTimer(state: FeatureTimerState): FeatureTimerState {
  const nowMs = Date.now();

  if (state.mode === "clock") {
    return {
      ...state,
      status: "paused",
      updatedAtMs: nowMs,
    };
  }

  return {
    ...state,
    status: "paused",
    pausedRemainingMs: getCountdownRemainingMs(state, nowMs),
    endAtMs: null,
    updatedAtMs: nowMs,
  };
}

export function stopFeatureTimer(state: FeatureTimerState): FeatureTimerState {
  const nowMs = Date.now();

  if (state.mode === "clock") {
    return {
      ...state,
      status: "idle",
      showInWindowList: false,
      updatedAtMs: nowMs,
    };
  }

  return {
    ...state,
    status: "idle",
    endAtMs: null,
    pausedRemainingMs: state.durationMs,
    updatedAtMs: nowMs,
  };
}

export function resetFeatureTimer(state: FeatureTimerState): FeatureTimerState {
  const nowMs = Date.now();

  if (state.mode === "clock") {
    return {
      ...state,
      status: "idle",
      showInWindowList: false,
      updatedAtMs: nowMs,
    };
  }

  return {
    ...state,
    status: "idle",
    endAtMs: null,
    pausedRemainingMs: state.durationMs,
    showInWindowList: state.durationMs > 0,
    updatedAtMs: nowMs,
  };
}

export function setTimerMode(
  state: FeatureTimerState,
  mode: FeatureTimerMode,
): FeatureTimerState {
  const nowMs = Date.now();

  if (mode === "clock") {
    return {
      ...state,
      mode,
      status: "idle",
      endAtMs: null,
      pausedRemainingMs: null,
      showInWindowList: false,
      updatedAtMs: nowMs,
    };
  }

  return {
    ...state,
    mode,
    status: "idle",
    endAtMs: null,
    pausedRemainingMs: state.durationMs,
    showInWindowList: state.durationMs > 0,
    updatedAtMs: nowMs,
  };
}

export function setProjectionTheme(
  state: FeatureTimerState,
  projectionTheme: FeatureTimerProjectionTheme,
): FeatureTimerState {
  return {
    ...state,
    projectionTheme,
    updatedAtMs: Date.now(),
  };
}

export function markCompletedIfElapsed(
  state: FeatureTimerState,
  nowMs = Date.now(),
): FeatureTimerState {
  if (state.mode !== "countdown") return state;
  if (state.status !== "running" || !state.endAtMs) return state;
  if (state.endAtMs > nowMs) return state;

  return {
    ...state,
    status: "completed",
    endAtMs: null,
    pausedRemainingMs: 0,
    updatedAtMs: nowMs,
  };
}
