import React, { useState, useCallback, useEffect, useMemo } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { WindowList, type WindowInfo } from "./WindowList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel/RightPanel";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";
import { SimpleThemeToggle } from "../ThemeToggle";
import { NotificationModalComponent } from "@/components/ui/NotificationModal";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  showNotification,
  removeNotification,
  handlePublishLayout as reduxHandlePublishLayout,
  type NotificationAction,
} from "@/store/slices/notificationSlice";

interface DashboardState {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  activeSection: string;
}

export const Dashboard: React.FC = () => {
  const { minimize, maximize, close } = useWindowControls();
  const {
    windows: enumeratedWindows,
    isLoading: isLoadingWindows,
    error: windowError,
    refreshWindows,
    focusWindow: focusWindowNative,
    countdownTime,
    totalRefreshTime,
  } = useWindowEnumeration({
    includeMinimized: false,
    includeSystemWindows: false,
    refreshInterval: 60000, // 1 minute auto-refresh
    smartRefresh: false, // Disable smart refresh to prevent frequent updates
  });

  // Redux hooks for notifications
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(
    (state) => state.notification.notifications
  );

  const [state, setState] = useState<DashboardState>({
    windows: [],
    currentLayout: "auto",
    focusedWindowId: null,
    activeSection: "dashboard",
  });

  // Update state when enumerated windows change
  useEffect(() => {
    if (enumeratedWindows.length > 0) {
      setState((prev) => ({
        ...prev,
        windows: enumeratedWindows.map((window) => ({
          ...window,
          isSelected:
            prev.windows.find((w) => w.id === window.id)?.isSelected || false,
        })),
      }));
    }
  }, [enumeratedWindows, isLoadingWindows, windowError]);

  // Section navigation handler
  const handleSectionChange = useCallback((section: string) => {
    setState((prev) => ({ ...prev, activeSection: section }));
  }, []);

  // Header event handlers
  const handleRefreshWindows = useCallback(() => {
    refreshWindows();
  }, [refreshWindows]);

  const handleClearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => ({ ...w, isSelected: false })),
      focusedWindowId: null,
    }));
  }, []);

  const handleLayoutChange = useCallback((layout: string) => {
    setState((prev) => ({ ...prev, currentLayout: layout }));
  }, []);

  // Window handlers
  const handleWindowSelect = useCallback((windowId: string) => {
    setState((prev) => {
      const updatedWindows = prev.windows.map((w) =>
        w.id === windowId ? { ...w, isSelected: !w.isSelected } : w
      );

      // If deselecting, also remove from focus
      const newFocusedId = updatedWindows.find((w) => w.id === windowId)
        ?.isSelected
        ? prev.focusedWindowId
        : prev.focusedWindowId === windowId
        ? null
        : prev.focusedWindowId;

      return {
        ...prev,
        windows: updatedWindows,
        focusedWindowId: newFocusedId,
      };
    });
  }, []);

  const handleWindowAdd = useCallback((windowInfo: WindowInfo) => {
    setState((prev) => {
      // Find if the window exists in our current windows list
      const windowExists = prev.windows.some((w) => w.id === windowInfo.id);

      if (windowExists) {
        // If window exists, just mark it as selected
        const updatedWindows = prev.windows.map((w) =>
          w.id === windowInfo.id ? { ...w, isSelected: true } : w
        );

        return {
          ...prev,
          windows: updatedWindows,
        };
      } else {
        // If window doesn't exist, add it to the list and mark as selected
        const newWindow = { ...windowInfo, isSelected: true };

        return {
          ...prev,
          windows: [...prev.windows, newWindow],
        };
      }
    });
  }, []);

  // Grid handlers
  const handleWindowFocus = useCallback((windowId: string) => {
    setState((prev) => ({
      ...prev,
      focusedWindowId: prev.focusedWindowId === windowId ? null : windowId,
    }));
  }, []);

  const handleWindowRemove = useCallback((windowId: string) => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === windowId ? { ...w, isSelected: false } : w
      ),
      focusedWindowId:
        prev.focusedWindowId === windowId ? null : prev.focusedWindowId,
    }));
  }, []);

  // Memoize selected windows to prevent recalculation
  const selectedWindows = useMemo(
    () => state.windows.filter((w) => w.isSelected),
    [state.windows]
  );

  const handlePublishLayout = useCallback(async () => {
    // Use Redux async thunk for publish layout
    dispatch(
      reduxHandlePublishLayout({
        selectedWindows,
        currentLayout: state.currentLayout,
        focusedWindowId: state.focusedWindowId,
      })
    );
  }, [dispatch, selectedWindows, state.currentLayout, state.focusedWindowId]);

  return (
    <div className="h-screen w-screen overflow-hidden relative p-3 flex items-center justify-center no-scrollbar">
      {/* Cosmic Background */}
      <CosmicBackground />

      {/* macOS-style Window Controls */}
      <div className="absolute top-1 left-4 z-50 flex items-center gap-2">
        {/* Close button */}
        <div
          onClick={close}
          className="w-4 h-4 cursor-pointer rounded-full bg-red-500 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Close"
        >
          <X className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </div>

        {/* Minimize button */}
        <div
          onClick={minimize}
          className="w-4 h-4 cursor-pointer rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Minimize"
        >
          <Minus
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
          {/* <SimpleThemeToggle/> */}
        </div>

        {/* Maximize button */}
        <div
          onClick={maximize}
          className="w-4 h-4 cursor-pointer rounded-full bg-green-500 hover:bg-green-600 transition-colors duration-200 flex items-center justify-center group shadow-sm"
          title="Maximize"
        >
          <Maximize2
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Main Content Container with rounded corners - 95% height */}
      <div className="relative z-10 h-[95%] w-full backdrop-blur-sm bg-theme-primary-900/20 border-1 border-theme-primary-600  border-dashed rounded-3xl flex overflow-hidden">
        <div className="w-80 bg-theme-pimary-900/60 backdrop-blur-sm border-r border-theme-primary-600/30 py-6 px-4 flex flex-col overflow-hidden">
          <WindowList
            windows={state.windows}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={focusWindowNative}
            onWindowDragStart={(window) => {
              // Optional: Add any drag start logic here
              console.log("Drag started for window:", window.name);
            }}
            onWindowDragEnd={() => {
              // Optional: Add any drag end logic here
              console.log("Drag ended");
            }}
            isLoading={isLoadingWindows}
            error={windowError}
            countdownTime={countdownTime}
            totalRefreshTime={totalRefreshTime}
            onManualRefresh={handleRefreshWindows}
          />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <RightPanel
            windows={state.windows}
            currentLayout={state.currentLayout}
            focusedWindowId={state.focusedWindowId}
            onRefreshWindows={handleRefreshWindows}
            onClearAll={handleClearAll}
            onLayoutChange={handleLayoutChange}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={handleWindowFocus}
            onWindowRemove={handleWindowRemove}
            onWindowAdd={handleWindowAdd}
            onPublishLayout={handlePublishLayout}
          />
        </div>
      </div>

      {/* Live Mode Badge */}
      {state.windows.length > 0 ? (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-theme-primary-400 text-white px-4 py-2 rounded-full text-sm font-bold border border-theme-primary-400/30 shadow-lg shadow-theme-primary-500/25 z-20 flex items-center gap-2">
          <div className="w-2 h-2 bg-theme-primary-400 rounded-full animate-pulse"></div>
          LIVE MODE - {state.windows.length} windows detected
        </div>
      ) : isLoadingWindows ? (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-yellow-600/80 text-white px-4 py-2 rounded-full text-sm font-bold border border-yellow-400/30 shadow-lg shadow-yellow-500/25 z-20 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-spin"></div>
          Loading windows...
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-theme-primary-600/80 text-white px-4 py-2 rounded-full text-sm font-bold border border-theme-primary-400/30 shadow-lg shadow-theme-primary-500/25 z-20">
          DEMO MODE - No windows detected
        </div>
      )}

      {/* Debug: Test Notification Button */}
      {/* <button
        onClick={() => {
          console.log("🧪 Testing notification system...");
          dispatch(
            showNotification({
              type: "info",
              title: "Test Notification",
              message: "If you see this, the notification system is working!",
              autoClose: 3000,
            })
          );
        }}
        className="fixed bottom-6 left-6 bg-theme-primary-600 hover:bg-theme-primary-500 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors z-20"
      >
        Test Notification
      </button> */}

      {/* Custom Notification Modal */}
      <NotificationModalComponent />
    </div>
  );
};
