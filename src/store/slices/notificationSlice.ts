import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { setProjectionOn } from "./appSlice";

export type NotificationType =
  | "success"
  | "error"
  | "warning"
  | "info"
  | "question";
export type NotificationAction = "confirm" | "cancel" | "dismiss";

export interface NotificationButton {
  text: string;
  action: NotificationAction;
  variant?: "primary" | "secondary" | "danger";
}

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: React.ReactNode;
  buttons?: NotificationButton[];
  autoClose?: number; // milliseconds, 0 = no auto close
  persistent?: boolean; // prevents closing by clicking outside or ESC
  onAction?: (action: NotificationAction) => void;
  confirmationAction?: string; // Special action identifier for handling confirmations
}

interface NotificationState {
  notifications: NotificationConfig[];
  pendingPublication: {
    selectedWindows: any[];
    currentLayout: string;
    focusedWindowId: string | null;
  } | null;
}

const initialState: NotificationState = {
  notifications: [],
  pendingPublication: null,
};

interface PublishLayoutPayload {
  selectedWindows: any[];
  currentLayout: string;
  focusedWindowId: string | null;
  publishedQuality?: { contrast: number; brightness: number };
  captureQuality?: number;
  displayId?: number;
}

// Async thunk for checking and handling published windows
export const handlePublishLayout = createAsyncThunk(
  "notification/handlePublishLayout",
  async (layoutData: PublishLayoutPayload, { dispatch }) => {
    const {
      selectedWindows,
      currentLayout,
      focusedWindowId,
      publishedQuality,
      captureQuality,
      displayId,
    } = layoutData;

    console.log(
      "🚀 handlePublishLayout called with",
      selectedWindows.length,
      "windows",
    );

    if (selectedWindows.length === 0) {
      dispatch(
        showNotification({
          type: "warning",
          title: "No Windows Selected",
          message:
            "Please select at least one window to publish to the layout.",
          autoClose: 4000,
        }),
      );
      return { success: false, reason: "no_windows" };
    }

    try {
      // Check for existing published windows
      console.log("🔍 Checking for existing published windows...");
      const { hasActivePublications, count } = await (
        window.electronAPI as any
      ).checkPublishedWindows();
      console.log("📊 Check result:", { hasActivePublications, count });

      if (hasActivePublications) {
        console.log("⚠️ Found existing publications, showing confirmation");

        // Store pending publication data
        dispatch(
          setPendingPublication({
            selectedWindows,
            currentLayout,
            focusedWindowId,
          }),
        );

        // Show confirmation modal to close existing publication
        dispatch(
          showNotification({
            type: "question",
            title: "Active Publication Detected",
            message: `There ${
              count === 1 ? "is" : "are"
            } ${count} active published layout${
              count === 1 ? "" : "s"
            }. To create a new publication, the existing one${
              count === 1 ? "" : "s"
            } must be closed first. Do you want to continue?`,
            persistent: true,
            confirmationAction: "close-and-publish", // Special flag to identify this type of notification
            buttons: [
              {
                text: "Cancel",
                action: "cancel",
                variant: "secondary",
              },
              {
                text: "Close & Publish",
                action: "confirm",
                variant: "danger",
              },
            ],
          }),
        );
        return { success: false, reason: "existing_publications" };
      }

      // No existing publications, proceed directly
      console.log("✅ No existing publications, proceeding with publish");
      return await dispatch(
        performPublish({
          selectedWindows,
          currentLayout,
          focusedWindowId,
          publishedQuality,
          captureQuality,
        }),
      ).unwrap();
    } catch (error) {
      console.error("❌ Failed to check published windows:", error);
      dispatch(
        showNotification({
          type: "error",
          title: "Publication Check Failed",
          message: "Could not verify existing publications. Please try again.",
          autoClose: 4000,
        }),
      );
      return { success: false, reason: "check_failed" };
    }
  },
);

// Async thunk for publishing a routed screen without blocking on existing publications
export const publishDisplayLayout = createAsyncThunk(
  "notification/publishDisplayLayout",
  async (layoutData: PublishLayoutPayload, { dispatch }) => {
    const {
      selectedWindows,
      currentLayout,
      focusedWindowId,
      publishedQuality,
      captureQuality,
      displayId,
    } = layoutData;

    if (selectedWindows.length === 0) {
      dispatch(
        showNotification({
          type: "warning",
          title: "No Windows Routed",
          message:
            "Assign at least one window to this display before projecting it.",
          autoClose: 4000,
        }),
      );
      return { success: false, reason: "no_windows" };
    }

    try {
      dispatch(
        showNotification({
          type: "info",
          title: "Projecting Display",
          message: `Creating a fullscreen projection for display ${displayId ?? "auto"}...`,
          autoClose: 2500,
        }),
      );

      const result = await dispatch(
        performPublish({
          selectedWindows,
          currentLayout,
          focusedWindowId,
          publishedQuality,
          captureQuality,
          displayId,
        }),
      ).unwrap();

      if (result.success) {
        dispatch(setProjectionOn(true));
      }

      return result;
    } catch (error) {
      console.error("💥 Failed to project display:", error);
      dispatch(
        showNotification({
          type: "error",
          title: "Display Projection Failed",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while projecting the display.",
          autoClose: 5000,
        }),
      );
      return { success: false };
    }
  },
);

// Async thunk for the actual publish operation
export const performPublish = createAsyncThunk(
  "notification/performPublish",
  async (layoutData: PublishLayoutPayload, { dispatch }) => {
    const {
      selectedWindows,
      currentLayout,
      focusedWindowId,
      publishedQuality,
      captureQuality,
      displayId,
    } = layoutData;

    try {
      console.log(
        "🎬 Starting publish process for",
        selectedWindows.length,
        "windows",
      );

      dispatch(
        showNotification({
          type: "info",
          title: "Publishing Layout",
          message: "Creating fullscreen published layout...",
          autoClose: 3000,
        }),
      );
      console.log("📢 Showed 'Publishing Layout' notification");

      // Call the Electron API to open a new window with the layout
      const result = await window.electronAPI.publishLayout({
        windows: selectedWindows,
        layout: currentLayout,
        focusedWindowId,
        publishedQuality,
        captureQuality,
        displayId,
      });

      console.log("📤 publishLayout result:", result);

      if (result.success) {
        console.log("✅ Publish successful, showing success notification");
        dispatch(
          showNotification({
            type: "success",
            title: "Layout Published Successfully!",
            message: `Published layout with ${selectedWindows.length} window${
              selectedWindows.length === 1 ? "" : "s"
            } in fullscreen mode.`,
            autoClose: 4000,
          }),
        );
        return { success: true };
      } else {
        console.log("❌ Publish failed:", result.error);
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("💥 Failed to publish layout:", error);
      dispatch(
        showNotification({
          type: "error",
          title: "Publication Failed",
          message:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred while publishing the layout.",
          autoClose: 5000,
        }),
      );
      return { success: false };
    }
  },
);

// Async thunk for closing existing publications and publishing new one
export const closeAndPublish = createAsyncThunk(
  "notification/closeAndPublish",
  async (
    layoutData: {
      selectedWindows: any[];
      currentLayout: string;
      focusedWindowId: string | null;
    },
    { dispatch },
  ) => {
    try {
      console.log("🔄 Closing existing published windows...");
      // Close existing published windows
      const closeResult = await (
        window.electronAPI as any
      ).closePublishedWindows();
      console.log("✅ Closed published windows:", closeResult);

      // Add a small delay to ensure windows are fully closed
      await new Promise((resolve) => setTimeout(resolve, 500));

      dispatch(
        showNotification({
          type: "info",
          title: "Publishing New Layout",
          message: "Creating new published layout...",
          autoClose: 2000,
        }),
      );

      // Proceed with publishing
      console.log("🚀 Creating new published layout...");
      const result = await dispatch(performPublish(layoutData)).unwrap();

      if (result.success) {
        console.log(
          "🎉 Successfully published new layout after closing previous ones",
        );
      }

      return result;
    } catch (error) {
      dispatch(
        showNotification({
          type: "error",
          title: "Failed to Close Publications",
          message:
            "Could not close existing published windows. Please close them manually and try again.",
          autoClose: 5000,
        }),
      );
      return { success: false };
    }
  },
);

// Thunk to handle confirmation actions
export const handleNotificationConfirmation = createAsyncThunk(
  "notification/handleConfirmation",
  async (
    payload: {
      notificationId: string;
      userAction: NotificationAction;
      confirmationAction?: string;
    },
    { dispatch, getState },
  ) => {
    const { userAction, confirmationAction } = payload;

    // Remove the notification first
    dispatch(removeNotification(payload.notificationId));

    // Handle different confirmation actions
    if (
      confirmationAction === "close-and-publish" &&
      userAction === "confirm"
    ) {
      console.log("🔄 User confirmed close and publish");
      const state = getState() as any;
      const pendingPublication = state.notification.pendingPublication;

      if (pendingPublication) {
        console.log("📤 Executing close and publish with pending data");
        // Clear pending publication
        dispatch(clearPendingPublication());
        // Execute the close and publish action
        return await dispatch(closeAndPublish(pendingPublication)).unwrap();
      } else {
        console.error("❌ No pending publication data found");
        dispatch(
          showNotification({
            type: "error",
            title: "Publication Error",
            message: "No pending publication data found. Please try again.",
            autoClose: 4000,
          }),
        );
      }
    } else if (userAction === "cancel") {
      console.log("❌ User cancelled publication");
      dispatch(clearPendingPublication());
    }

    return { success: true };
  },
);

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    showNotification: (
      state,
      action: PayloadAction<Omit<NotificationConfig, "id">>,
    ) => {
      const id = `notification-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const notification: NotificationConfig = { ...action.payload, id };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setPendingPublication: (
      state,
      action: PayloadAction<{
        selectedWindows: any[];
        currentLayout: string;
        focusedWindowId: string | null;
      }>,
    ) => {
      state.pendingPublication = action.payload;
    },
    clearPendingPublication: (state) => {
      state.pendingPublication = null;
    },
    handleConfirmationAction: (
      state,
      action: PayloadAction<{
        notificationId: string;
        userAction: NotificationAction;
      }>,
    ) => {
      // This will be handled by middleware/thunk
    },
    updateNotificationAction: (
      state,
      action: PayloadAction<{
        id: string;
        onAction: (action: NotificationAction) => void;
      }>,
    ) => {
      const notification = state.notifications.find(
        (n) => n.id === action.payload.id,
      );
      if (notification) {
        notification.onAction = action.payload.onAction;
      }
    },
  },
});

export const {
  showNotification,
  removeNotification,
  clearAllNotifications,
  setPendingPublication,
  clearPendingPublication,
  handleConfirmationAction,
  updateNotificationAction,
} = notificationSlice.actions;

export default notificationSlice.reducer;
