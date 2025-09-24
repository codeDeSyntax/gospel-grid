import React, { useState, useCallback, useEffect } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { WindowList, type WindowInfo } from "./WindowList";
import { PresetsList, type PresetInfo } from "./PresetsList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel/RightPanel";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";
import { SimpleThemeToggle } from "../ThemeToggle";
import { PresetSaveModal } from "@/components/ui/PresetSaveModal";
import type { SavedPreset } from "@/types/electron";
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
  presets: PresetInfo[];
  selectedPreset: string;
  currentLayout: string;
  focusedWindowId: string | null;
  activeSection: string;
  showPresetSaveModal: boolean;
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
    presets: [], // Start with empty presets array
    selectedPreset: "",
    currentLayout: "auto",
    focusedWindowId: null,
    activeSection: "dashboard",
    showPresetSaveModal: false,
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

  // Load saved presets on component mount
  useEffect(() => {
    const loadSavedPresets = async () => {
      try {
        const result = await (window.electronAPI as any)?.loadPresets();

        if (result?.success && result.presets) {
          const presetInfos: PresetInfo[] = result.presets.map(
            (preset: SavedPreset) => ({
              id: preset.id,
              name: preset.name,
              windowCount: preset.windowCount,
              windows: preset.windows.map((window) => ({
                id: window.id,
                name: window.name,
                app: window.app,
                icon: window.icon,
                hasNativeIcon: window.hasNativeIcon,
              })),
            })
          );

          setState((prev) => ({
            ...prev,
            presets: presetInfos, // Only use saved presets, no mock presets
          }));

          console.log(`Loaded ${presetInfos.length} saved presets on startup`);
        }
      } catch (error) {
        console.error("Failed to load saved presets on startup:", error);
        // Don't show error notification on startup - just log it
      }
    };

    loadSavedPresets();
  }, []); // Empty dependency array - run once on mount

  // Section navigation handler
  const handleSectionChange = useCallback((section: string) => {
    setState((prev) => ({ ...prev, activeSection: section }));
  }, []);

  // Header event handlers
  const handleRefreshWindows = useCallback(() => {
    refreshWindows();
  }, [refreshWindows]);

  const handleSavePreset = useCallback(() => {
    const selectedWindows = state.windows.filter((w) => w.isSelected);
    if (selectedWindows.length === 0) {
      // Show notification for no windows selected
      dispatch(
        showNotification({
          type: "error",
          title: "No Windows Selected",
          message: "Please select at least one window before saving a preset.",
          autoClose: 4000,
        })
      );
      return;
    }

    // Show the preset save modal
    setState((prev) => ({ ...prev, showPresetSaveModal: true }));
  }, [state.windows, dispatch]);

  const handlePresetSaveModalClose = useCallback(() => {
    setState((prev) => ({ ...prev, showPresetSaveModal: false }));
  }, []);

  const handlePresetSave = useCallback(
    async (presetName: string) => {
      const selectedWindows = state.windows.filter((w) => w.isSelected);

      try {
        const savedPreset: SavedPreset = {
          id: presetName.toLowerCase().replace(/\s+/g, "-"),
          name: presetName,
          windowCount: selectedWindows.length,
          createdAt: new Date().toISOString(),
          windows: selectedWindows.map((window) => ({
            id: window.id,
            name: window.name,
            app: window.app,
            icon: window.icon, // Store the Base64 icon data
            hasNativeIcon: window.hasNativeIcon, // Store icon availability flag
            sourceId: (window as any).sourceId, // From windowMapper
            handle: window.handle,
          })),
        };

        // Save to persistent storage via IPC
        const result = await (window.electronAPI as any)?.savePreset(
          savedPreset
        );

        if (result?.success) {
          // Update local state
          const newPresetInfo: PresetInfo = {
            id: savedPreset.id,
            name: savedPreset.name,
            windowCount: savedPreset.windowCount,
            windows: savedPreset.windows.map((window) => ({
              id: window.id,
              name: window.name,
              app: window.app,
              icon: window.icon,
              hasNativeIcon: window.hasNativeIcon,
            })),
          };

          setState((prev) => ({
            ...prev,
            presets: [...prev.presets, newPresetInfo],
            showPresetSaveModal: false,
          }));

          // Show success notification
          dispatch(
            showNotification({
              type: "success",
              title: "Preset Saved",
              message: `"${presetName}" saved with ${selectedWindows.length} windows!`,
              autoClose: 3000,
            })
          );
        } else {
          throw new Error(result?.error || "Failed to save preset");
        }
      } catch (error) {
        console.error("Failed to save preset:", error);

        // Show error notification
        dispatch(
          showNotification({
            type: "error",
            title: "Save Failed",
            message: `Failed to save preset: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            autoClose: 5000,
          })
        );
      }
    },
    [state.windows, dispatch]
  );

  const handleClearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => ({ ...w, isSelected: false })),
      focusedWindowId: null,
    }));
  }, []);

  const handlePresetChange = useCallback((presetId: string) => {
    setState((prev) => ({ ...prev, selectedPreset: presetId }));

    if (presetId) {
      loadPreset(presetId);
    }
  }, []);

  const handleLayoutChange = useCallback((layout: string) => {
    setState((prev) => ({ ...prev, currentLayout: layout }));
  }, []);

  // Window and preset handlers
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

  const handlePresetSelect = useCallback((presetId: string) => {
    loadPreset(presetId);
  }, []);

  const handlePresetDelete = useCallback(async (presetId: string) => {
    try {
      // Delete preset from storage
      const result = await (window.electronAPI as any)?.deletePreset?.(
        presetId
      );

      if (result?.success) {
        // Update state to remove the deleted preset
        setState((prev) => ({
          ...prev,
          presets: prev.presets.filter((p) => p.id !== presetId),
          selectedPreset:
            prev.selectedPreset === presetId ? "" : prev.selectedPreset,
        }));

        console.log("Preset deleted successfully:", presetId);
      } else {
        console.error("Failed to delete preset:", result?.error);
        // The notification for the error will be shown by the PresetsCard component
      }
    } catch (error) {
      console.error("Error deleting preset:", error);
    }
  }, []);

  const loadPreset = useCallback(
    async (presetId: string) => {
      try {
        // Load presets from storage
        const result = await (window.electronAPI as any)?.loadPresets();

        if (!result?.success) {
          console.error("Failed to load presets:", result?.error);
          return;
        }

        // Find the specific preset
        const preset = result.presets?.find(
          (p: SavedPreset) => p.id === presetId
        );
        if (!preset) {
          console.warn(`Preset not found: ${presetId}`);
          return;
        }

        console.log(
          `Loading preset "${preset.name}" with ${preset.windows.length} windows`
        );

        // Match windows by app name and partial title matching
        setState((prev) => {
          const updatedWindows = prev.windows.map((currentWindow) => {
            // Check if this current window matches any window in the preset
            const matchedPresetWindow = preset.windows.find(
              (presetWindow: SavedPreset["windows"][0]) => {
                // Primary match: app name (more reliable)
                const appMatch =
                  currentWindow.app?.toLowerCase() ===
                  presetWindow.app?.toLowerCase();

                // Secondary match: partial title match (handles dynamic content like tabs)
                const titleMatch =
                  currentWindow.name &&
                  presetWindow.name &&
                  (currentWindow.name
                    .toLowerCase()
                    .includes(presetWindow.name.toLowerCase()) ||
                    presetWindow.name
                      .toLowerCase()
                      .includes(currentWindow.name.toLowerCase()));

                return appMatch || titleMatch;
              }
            );

            return {
              ...currentWindow,
              isSelected: !!matchedPresetWindow,
            };
          });

          console.log(
            `Matched ${
              updatedWindows.filter((w) => w.isSelected).length
            } windows for preset "${preset.name}"`
          );

          return {
            ...prev,
            windows: updatedWindows,
            focusedWindowId: null,
          };
        });

        // Show success notification
        dispatch(
          showNotification({
            type: "success",
            title: "Preset Loaded",
            message: `Loaded "${preset.name}" preset`,
            autoClose: 2000,
          })
        );
      } catch (error) {
        console.error("Failed to load preset:", error);

        // Show error notification
        dispatch(
          showNotification({
            type: "error",
            title: "Load Failed",
            message: `Failed to load preset: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            autoClose: 4000,
          })
        );
      }
    },
    [dispatch]
  );

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

  const handlePublishLayout = useCallback(async () => {
    const selectedWindows = state.windows.filter((w) => w.isSelected);

    // Use Redux async thunk for publish layout
    dispatch(
      reduxHandlePublishLayout({
        selectedWindows,
        currentLayout: state.currentLayout,
        focusedWindowId: state.focusedWindowId,
      })
    );
  }, [dispatch, state.windows, state.currentLayout, state.focusedWindowId]);

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
            presets={state.presets}
            selectedPreset={state.selectedPreset}
            currentLayout={state.currentLayout}
            focusedWindowId={state.focusedWindowId}
            onRefreshWindows={handleRefreshWindows}
            onSavePreset={handleSavePreset}
            onClearAll={handleClearAll}
            onPresetChange={handlePresetChange}
            onLayoutChange={handleLayoutChange}
            onWindowSelect={handleWindowSelect}
            onPresetSelect={handlePresetSelect}
            onPresetDelete={handlePresetDelete}
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
      <button
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
      </button>

      {/* Custom Notification Modal */}
      <NotificationModalComponent />

      {/* Preset Save Modal */}
      <PresetSaveModal
        isOpen={state.showPresetSaveModal}
        onClose={handlePresetSaveModalClose}
        onSave={handlePresetSave}
        selectedWindowsCount={state.windows.filter((w) => w.isSelected).length}
      />
    </div>
  );
};
