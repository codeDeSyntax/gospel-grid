import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "wingrid-settings";

interface PersistedSettings {
  isDarkMode: boolean;
  publishedQuality: { contrast: number; brightness: number };
  refreshInterval: number;
  remoteScreensAutoStart: boolean;
  overlayText: string;
  overlayVisible: boolean;
  overlayTargetDisplayId: number | null;
}

function loadPersistedSettings(): Partial<PersistedSettings> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupted storage — use defaults */
  }
  return {};
}

function persistSettings(settings: PersistedSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* storage full or disabled */
  }
}

// ─── State ──────────────────────────────────────────────────────────────────

interface AppState {
  currentScreen: "welcome" | "dashboard" | "settings";
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  publishedQuality: {
    contrast: number; // 0.5 to 2.0, default 1.0
    brightness: number; // 0.5 to 2.0, default 1.0
  };
  /** Window list refresh interval in milliseconds */
  refreshInterval: number;
  /** Whether Remote Screens becomes available automatically when opened */
  remoteScreensAutoStart: boolean;
  /** Legacy: kept for IPC compatibility (not shown in settings UI) */
  captureQuality: number;
  /** Whether projection is currently active */
  isProjectionOn: boolean;
  /** Projection is completely blacked out (audience sees black) */
  isBlackout: boolean;
  /** Projection is frozen on the last frame */
  isFrozen: boolean;
  /** Text overlay shown on the projection */
  overlayText: string;
  /** Whether the overlay text is currently visible */
  overlayVisible: boolean;
  /** Selected display target for overlay message; null means all displays */
  overlayTargetDisplayId: number | null;
}

const persisted = loadPersistedSettings();

const initialState: AppState = {
  currentScreen: "welcome",
  isDarkMode: persisted.isDarkMode ?? true,
  isLoading: false,
  error: null,
  publishedQuality: persisted.publishedQuality ?? {
    contrast: 1.0,
    brightness: 1.0,
  },
  refreshInterval: persisted.refreshInterval ?? 60000,
  remoteScreensAutoStart: persisted.remoteScreensAutoStart ?? true,
  captureQuality: 80,
  isProjectionOn: false,
  isBlackout: false,
  isFrozen: false,
  overlayText: persisted.overlayText ?? "",
  overlayVisible: persisted.overlayVisible ?? false,
  overlayTargetDisplayId: persisted.overlayTargetDisplayId ?? null,
};

// ─── Helper to auto-persist after any settings mutation ────────────────────

function autoPersist(state: AppState) {
  persistSettings({
    isDarkMode: state.isDarkMode,
    publishedQuality: state.publishedQuality,
    refreshInterval: state.refreshInterval,
    remoteScreensAutoStart: state.remoteScreensAutoStart,
    overlayText: state.overlayText,
    overlayVisible: state.overlayVisible,
    overlayTargetDisplayId: state.overlayTargetDisplayId,
  });
}

// ─── Slice ──────────────────────────────────────────────────────────────────

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrentScreen: (
      state,
      action: PayloadAction<AppState["currentScreen"]>,
    ) => {
      state.currentScreen = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.isDarkMode = action.payload;
      if (action.payload) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      autoPersist(state);
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      if (state.isDarkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      autoPersist(state);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setPublishedContrast: (state, action: PayloadAction<number>) => {
      state.publishedQuality.contrast = Math.min(
        Math.max(action.payload, 0.5),
        2.0,
      );
      autoPersist(state);
    },
    setPublishedBrightness: (state, action: PayloadAction<number>) => {
      state.publishedQuality.brightness = Math.min(
        Math.max(action.payload, 0.5),
        2.0,
      );
      autoPersist(state);
    },
    setPublishedQuality: (
      state,
      action: PayloadAction<{ contrast: number; brightness: number }>,
    ) => {
      state.publishedQuality.contrast = Math.min(
        Math.max(action.payload.contrast, 0.5),
        2.0,
      );
      state.publishedQuality.brightness = Math.min(
        Math.max(action.payload.brightness, 0.5),
        2.0,
      );
      autoPersist(state);
    },
    setRefreshInterval: (state, action: PayloadAction<number>) => {
      state.refreshInterval = action.payload;
      autoPersist(state);
    },
    setRemoteScreensAutoStart: (state, action: PayloadAction<boolean>) => {
      state.remoteScreensAutoStart = action.payload;
      autoPersist(state);
    },
    resetQualitySettings: (state) => {
      state.publishedQuality = {
        contrast: 1.0,
        brightness: 1.0,
      };
      state.captureQuality = 80;
      autoPersist(state);
    },
    setCaptureQuality: (state, action: PayloadAction<number>) => {
      state.captureQuality = Math.min(Math.max(action.payload, 50), 100);
    },
    setProjectionOn: (state, action: PayloadAction<boolean>) => {
      state.isProjectionOn = action.payload;
    },
    setBlackout: (state, action: PayloadAction<boolean>) => {
      state.isBlackout = action.payload;
    },
    toggleBlackout: (state) => {
      state.isBlackout = !state.isBlackout;
    },
    setFrozen: (state, action: PayloadAction<boolean>) => {
      state.isFrozen = action.payload;
    },
    toggleFrozen: (state) => {
      state.isFrozen = !state.isFrozen;
    },
    setOverlayText: (state, action: PayloadAction<string>) => {
      state.overlayText = action.payload;
      autoPersist(state);
    },
    setOverlayVisible: (state, action: PayloadAction<boolean>) => {
      state.overlayVisible = action.payload;
      autoPersist(state);
    },
    toggleOverlayVisible: (state) => {
      state.overlayVisible = !state.overlayVisible;
      autoPersist(state);
    },
    setOverlayTargetDisplayId: (
      state,
      action: PayloadAction<number | null>,
    ) => {
      state.overlayTargetDisplayId = action.payload;
      autoPersist(state);
    },
  },
});

export const {
  setCurrentScreen,
  setDarkMode,
  toggleDarkMode,
  setLoading,
  setError,
  clearError,
  setPublishedContrast,
  setPublishedBrightness,
  setPublishedQuality,
  setRefreshInterval,
  setRemoteScreensAutoStart,
  setCaptureQuality,
  resetQualitySettings,
  setProjectionOn,
  setBlackout,
  toggleBlackout,
  setFrozen,
  toggleFrozen,
  setOverlayText,
  setOverlayVisible,
  toggleOverlayVisible,
  setOverlayTargetDisplayId,
} = appSlice.actions;
export default appSlice.reducer;
