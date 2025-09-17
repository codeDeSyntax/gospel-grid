import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface WindowInfo {
  id: string;
  title: string;
  processName: string;
  isCapturing: boolean;
  thumbnail?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
}

interface WindowState {
  availableWindows: WindowInfo[];
  capturedWindows: WindowInfo[];
  selectedWindowId: string | null;
  isScanning: boolean;
}

const initialState: WindowState = {
  availableWindows: [],
  capturedWindows: [],
  selectedWindowId: null,
  isScanning: false,
};

const windowSlice = createSlice({
  name: "window",
  initialState,
  reducers: {
    setAvailableWindows: (state, action: PayloadAction<WindowInfo[]>) => {
      state.availableWindows = action.payload;
    },
    addCapturedWindow: (state, action: PayloadAction<WindowInfo>) => {
      const window = action.payload;
      if (!state.capturedWindows.find((w) => w.id === window.id)) {
        state.capturedWindows.push({ ...window, isCapturing: true });
      }
    },
    removeCapturedWindow: (state, action: PayloadAction<string>) => {
      state.capturedWindows = state.capturedWindows.filter(
        (w) => w.id !== action.payload
      );
    },
    updateWindowPosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const window = state.capturedWindows.find(
        (w) => w.id === action.payload.id
      );
      if (window) {
        window.position = action.payload.position;
      }
    },
    updateWindowSize: (
      state,
      action: PayloadAction<{
        id: string;
        size: { width: number; height: number };
      }>
    ) => {
      const window = state.capturedWindows.find(
        (w) => w.id === action.payload.id
      );
      if (window) {
        window.size = action.payload.size;
      }
    },
    setSelectedWindow: (state, action: PayloadAction<string | null>) => {
      state.selectedWindowId = action.payload;
    },
    setScanning: (state, action: PayloadAction<boolean>) => {
      state.isScanning = action.payload;
    },
    toggleWindowCapture: (state, action: PayloadAction<string>) => {
      const window = state.capturedWindows.find((w) => w.id === action.payload);
      if (window) {
        window.isCapturing = !window.isCapturing;
      }
    },
  },
});

export const {
  setAvailableWindows,
  addCapturedWindow,
  removeCapturedWindow,
  updateWindowPosition,
  updateWindowSize,
  setSelectedWindow,
  setScanning,
  toggleWindowCapture,
} = windowSlice.actions;

export default windowSlice.reducer;
