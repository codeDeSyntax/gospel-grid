import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AppState {
  currentScreen: "welcome" | "dashboard" | "settings";
  theme: "light" | "dark";
  isLoading: boolean;
  error: string | null;
}

const initialState: AppState = {
  currentScreen: "welcome",
  theme: "dark",
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

export const { setCurrentScreen, setTheme, setLoading, setError, clearError } =
  appSlice.actions;
export default appSlice.reducer;
