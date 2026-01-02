import { createSlice } from "@reduxjs/toolkit";

interface UIState {
  showSettings: boolean;
}

const initialState: UIState = {
  showSettings: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSettings: (state) => {
      state.showSettings = !state.showSettings;
    },
  },
});

export const { toggleSettings } = uiSlice.actions;

export default uiSlice.reducer;
