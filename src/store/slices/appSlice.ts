import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ColorTheme =
  | "cosmic-blue"
  | "matrix-green"
  | "fire-red"
  | "steel-gray"
  | "earth-brown"
  | "violet-purple"
  | "sunset-orange"
  | "midnight-black";

export const THEME_NAMES: Record<ColorTheme, string> = {
  "cosmic-blue": "Cosmic Blue",
  "matrix-green": "Matrix Green",
  "fire-red": "Fire Red",
  "steel-gray": "Steel Gray",
  "earth-brown": "Earth Brown",
  "violet-purple": "Violet Purple",
  "sunset-orange": "Sunset Orange",
  "midnight-black": "Midnight Black",
};

interface AppState {
  currentScreen: "welcome" | "dashboard" | "settings";
  theme: "light" | "dark";
  colorTheme: ColorTheme;
  isLoading: boolean;
  error: string | null;
  publishedQuality: {
    contrast: number; // 0.5 to 2.0, default 1.3
    brightness: number; // 0.5 to 2.0, default 1.5
  };
  captureQuality: number; // 50 to 100, default 80 (JPEG quality %)
}

const initialState: AppState = {
  currentScreen: "welcome",
  theme: "dark",
  colorTheme: "cosmic-blue", // Default to current blue theme
  isLoading: false,
  error: null,
  publishedQuality: {
    contrast: 1.3, // Default values matching current hardcoded values
    brightness: 1.5,
  },
  captureQuality: 80, // Default 80% JPEG quality
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setCurrentScreen: (
      state,
      action: PayloadAction<AppState["currentScreen"]>
    ) => {
      state.currentScreen = action.payload;
    },
    setTheme: (state, action: PayloadAction<AppState["theme"]>) => {
      state.theme = action.payload;
    },
    setColorTheme: (state, action: PayloadAction<AppState["colorTheme"]>) => {
      state.colorTheme = action.payload;
      // Apply theme to document root immediately
      document.documentElement.setAttribute("data-color-theme", action.payload);
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
        2.0
      ); // Clamp between 0.5 and 2.0
    },
    setPublishedBrightness: (state, action: PayloadAction<number>) => {
      state.publishedQuality.brightness = Math.min(
        Math.max(action.payload, 0.5),
        2.0
      ); // Clamp between 0.5 and 2.0
    },
    setPublishedQuality: (
      state,
      action: PayloadAction<{ contrast: number; brightness: number }>
    ) => {
      state.publishedQuality.contrast = Math.min(
        Math.max(action.payload.contrast, 0.5),
        2.0
      );
      state.publishedQuality.brightness = Math.min(
        Math.max(action.payload.brightness, 0.5),
        2.0
      );
    },
    setCaptureQuality: (state, action: PayloadAction<number>) => {
      state.captureQuality = Math.min(Math.max(action.payload, 50), 100); // Clamp between 50 and 100
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
  setCaptureQuality,
} = appSlice.actions;
export default appSlice.reducer;
