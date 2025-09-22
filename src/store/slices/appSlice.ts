import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ColorTheme =
  | "cosmic-blue"
  | "matrix-green"
  | "fire-red"
  | "steel-gray"
  | "earth-brown";

export const THEME_NAMES: Record<ColorTheme, string> = {
  "cosmic-blue": "Cosmic Blue",
  "matrix-green": "Matrix Green",
  "fire-red": "Fire Red",
  "steel-gray": "Steel Gray",
  "earth-brown": "Earth Brown",
};

interface AppState {
  currentScreen: "welcome" | "dashboard" | "settings";
  theme: "light" | "dark";
  colorTheme: ColorTheme;
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  currentScreen: "welcome",
  theme: "dark",
  colorTheme: "cosmic-blue", // Default to current blue theme
  isLoading: false,
  error: null,
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
  },
});

export const {
  setCurrentScreen,
  setTheme,
  setColorTheme,
  setLoading,
  setError,
  clearError,
} = appSlice.actions;
export default appSlice.reducer;
