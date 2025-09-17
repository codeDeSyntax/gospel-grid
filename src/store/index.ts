import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./slices/appSlice";
import windowSlice from "./slices/windowSlice";
import gridSlice from "./slices/gridSlice";

export const store = configureStore({
  reducer: {
    app: appSlice,
    window: windowSlice,
    grid: gridSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
