import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// ─── Persistence ────────────────────────────────────────────────────────────

const STORAGE_KEY = "wingrid-settings";

interface PersistedSettings {
  colorTheme: ColorTheme;
  publishedQuality: { contrast: number; brightness: number };
  refreshInterval: number;
  lastLoadedPresetId: string | null;
  autoLoadLastPreset: boolean;
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

// ─── Types ──────────────────────────────────────────────────────────────────

export type ColorTheme =
  | "grayscale"
  | "royal-purple"
  | "sky-blue"
  | "forest-green"
  | "vibrant-green"
  | "fire-red";

export const THEME_NAMES: Record<ColorTheme, string> = {
  grayscale: "Grayscale",
  "royal-purple": "Royal Purple",
  "sky-blue": "Sky Blue",
  "forest-green": "Forest Green",
  "vibrant-green": "Vibrant Green",
  "fire-red": "Fire Red",
};

const COLOR_THEME_VALUES = new Set<ColorTheme>(
  Object.keys(THEME_NAMES) as ColorTheme[],
);

const LEGACY_THEME_ALIASES: Record<string, ColorTheme> = {
  "warm-earth": "grayscale",
  "lavender-purple": "royal-purple",
  "ocean-blue": "sky-blue",
  "matrix-green": "vibrant-green",
  "cosmic-blue": "sky-blue",
  "earth-brown": "grayscale",
  "steel-gray": "grayscale",
  "violet-purple": "royal-purple",
  "sunset-orange": "fire-red",
  "midnight-black": "grayscale",
  "pro-slate": "sky-blue",
};

export function normalizeColorTheme(value: unknown): ColorTheme {
  const normalized =
    typeof value === "string" ? (LEGACY_THEME_ALIASES[value] ?? value) : value;

  return COLOR_THEME_VALUES.has(normalized as ColorTheme)
    ? (normalized as ColorTheme)
    : "grayscale";
}

// ─── Preset types ───────────────────────────────────────────────────────────

export interface ScenePreset {
  id: string;
  name: string;
  windowCount: number;
  createdAt: string;
  windows: Array<{
    id: string;
    name: string;
    app: string;
    sourceId?: string;
    handle?: number;
  }>;
}

// ─── State ──────────────────────────────────────────────────────────────────

interface AppState {
  currentScreen: "welcome" | "dashboard" | "settings";
  theme: "light" | "dark";
  colorTheme: ColorTheme;
  isLoading: boolean;
  error: string | null;
  publishedQuality: {
    contrast: number; // 0.5 to 2.0, default 1.0
    brightness: number; // 0.5 to 2.0, default 1.0
  };
  /** Window list refresh interval in milliseconds */
  refreshInterval: number;
  /** Legacy: kept for IPC compatibility (not shown in settings UI) */
  captureQuality: number;
  /** Whether projection is currently active */
  isProjectionOn: boolean;
  /** Projection is completely blacked out (audience sees black) */
  isBlackout: boolean;
  /** Projection is frozen on the last frame */
  isFrozen: boolean;
  /** Saved scene presets loaded from disk */
  scenePresets: ScenePreset[];
  /** Text overlay shown on the projection */
  overlayText: string;
  /** Whether the overlay text is currently visible */
  overlayVisible: boolean;
  /** Selected display target for overlay message; null means all displays */
  overlayTargetDisplayId: number | null;
  /** ID of last loaded preset (for startup profile) */
  lastLoadedPresetId: string | null;
  /** Auto-load last preset when app starts */
  autoLoadLastPreset: boolean;
}

const persisted = loadPersistedSettings();

const initialState: AppState = {
  currentScreen: "welcome",
  theme: "dark",
  colorTheme: normalizeColorTheme(persisted.colorTheme),
  isLoading: false,
  error: null,
  publishedQuality: persisted.publishedQuality ?? {
    contrast: 1.0,
    brightness: 1.0,
  },
  refreshInterval: persisted.refreshInterval ?? 60000,
  captureQuality: 80,
  isProjectionOn: false,
  isBlackout: false,
  isFrozen: false,
  scenePresets: [],
  overlayText: persisted.overlayText ?? "",
  overlayVisible: persisted.overlayVisible ?? false,
  overlayTargetDisplayId: persisted.overlayTargetDisplayId ?? null,
  lastLoadedPresetId: persisted.lastLoadedPresetId ?? null,
  autoLoadLastPreset: persisted.autoLoadLastPreset ?? false,
};

// ─── Helper to auto-persist after any settings mutation ────────────────────

function autoPersist(state: AppState) {
  persistSettings({
    colorTheme: state.colorTheme,
    publishedQuality: state.publishedQuality,
    refreshInterval: state.refreshInterval,
    lastLoadedPresetId: state.lastLoadedPresetId,
    autoLoadLastPreset: state.autoLoadLastPreset,
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
    setTheme: (state, action: PayloadAction<AppState["theme"]>) => {
      state.theme = action.payload;
    },
    setColorTheme: (state, action: PayloadAction<AppState["colorTheme"]>) => {
      state.colorTheme = action.payload;
      document.documentElement.setAttribute("data-color-theme", action.payload);
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
    setScenePresets: (state, action: PayloadAction<ScenePreset[]>) => {
      state.scenePresets = action.payload;
    },
    addScenePreset: (state, action: PayloadAction<ScenePreset>) => {
      const idx = state.scenePresets.findIndex(
        (p) => p.id === action.payload.id,
      );
      if (idx >= 0) {
        state.scenePresets[idx] = action.payload;
      } else {
        state.scenePresets.push(action.payload);
      }
    },
    removeScenePreset: (state, action: PayloadAction<string>) => {
      state.scenePresets = state.scenePresets.filter(
        (p) => p.id !== action.payload,
      );
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
    setLastLoadedPresetId: (state, action: PayloadAction<string | null>) => {
      state.lastLoadedPresetId = action.payload;
      autoPersist(state);
    },
    setAutoLoadLastPreset: (state, action: PayloadAction<boolean>) => {
      state.autoLoadLastPreset = action.payload;
      autoPersist(state);
    },
  },
});

export const {
  setCurrentScreen,
  setTheme,
  setColorTheme,
  setLoading,
  setError,
  clearError,
  setPublishedContrast,
  setPublishedBrightness,
  setPublishedQuality,
  setRefreshInterval,
  setCaptureQuality,
  resetQualitySettings,
  setProjectionOn,
  setBlackout,
  toggleBlackout,
  setFrozen,
  toggleFrozen,
  setScenePresets,
  addScenePreset,
  removeScenePreset,
  setOverlayText,
  setOverlayVisible,
  toggleOverlayVisible,
  setOverlayTargetDisplayId,
  setLastLoadedPresetId,
  setAutoLoadLastPreset,
} = appSlice.actions;
export default appSlice.reducer;
