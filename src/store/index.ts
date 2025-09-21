import { configureStore } from "@reduxjs/toolkit";
import appSlice from "./slices/appSlice";
import windowSlice from "./slices/windowSlice";
import gridSlice from "./slices/gridSlice";
import notificationSlice from "./slices/notificationSlice";

export const store = configureStore({
  reducer: {
    app: appSlice,
    window: windowSlice,
    grid: gridSlice,
    notification: notificationSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        // Ignore these paths in the state
        ignoredActionsPaths: ["payload.onAction"],
        ignoredPaths: ["notification.notifications.onAction"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
