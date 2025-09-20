import React, { useState, useCallback, useEffect } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { WindowList, type WindowInfo } from "./WindowList";
import { PresetsList, mockPresets, type PresetInfo } from "./PresetsList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";
import { SimpleThemeToggle } from "../ThemeToggle";
import { 
  NotificationModal, 
  useNotifications,
  NotificationAction 
} from "@/components/ui/NotificationModal";

interface DashboardState {
  windows: WindowInfo[];
  presets: PresetInfo[];
  selectedPreset: string;
  currentLayout: string;
  focusedWindowId: string | null;
  activeSection: string;
}

const presetWindowMappings = {
  "sunday-service": ["bible-app", "powerpoint", "notes", "obs"],
  "bible-study": ["bible-app", "notes"],
  worship: ["youtube", "powerpoint", "obs"],
};

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

  const { notifications, showNotification, closeNotification } = useNotifications();

  const [state, setState] = useState<DashboardState>({
    windows: [],
    presets: mockPresets,
    selectedPreset: "",
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

  const handleSavePreset = useCallback(() => {
    const selectedWindows = state.windows.filter((w) => w.isSelected);
    if (selectedWindows.length === 0) {
      alert("No windows selected to save as preset!");
      return;
    }

    const presetName = prompt("Enter preset name:");
    if (presetName) {
      const newPreset: PresetInfo = {
        id: presetName.toLowerCase().replace(/\s+/g, "-"),
        name: presetName,
        windowCount: selectedWindows.length,
      };

      setState((prev) => ({
        ...prev,
        presets: [...prev.presets, newPreset],
      }));

      alert(
        `Preset "${presetName}" saved with ${selectedWindows.length} windows!`
      );
    }
  }, [state.windows]);

  const handleClearAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => ({ ...w, isSelected: false })),
      focusedWindowId: null,
    }));
  }, []);

  const handlePresetChange = useCallback((presetId: string) => {
    setState((prev) => ({ ...prev, selectedPreset: presetId }));

    if (
      presetId &&
      presetWindowMappings[presetId as keyof typeof presetWindowMappings]
    ) {
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

  const loadPreset = useCallback((presetId: string) => {
    const windowIds =
      presetWindowMappings[presetId as keyof typeof presetWindowMappings];
    if (!windowIds) return;

    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) => ({
        ...w,
        isSelected: windowIds.includes(w.id),
      })),
      focusedWindowId: null,
    }));
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

  const handlePublishLayout = useCallback(async () => {
    const selectedWindows = state.windows.filter((w) => w.isSelected);

    if (selectedWindows.length === 0) {
      showNotification({
        type: "warning",
        title: "No Windows Selected",
        message: "Please select at least one window to publish to the layout.",
        autoClose: 4000,
      });
      return;
    }

    try {
      // Check for existing published windows
      const { hasActivePublications, count } = await (window.electronAPI as any).checkPublishedWindows();
      
      if (hasActivePublications) {
        // Show confirmation modal to close existing publication
        showNotification({
          type: "question",
          title: "Active Publication Detected",
          message: `There ${count === 1 ? 'is' : 'are'} ${count} active published layout${count === 1 ? '' : 's'}. To create a new publication, the existing one${count === 1 ? '' : 's'} must be closed first. Do you want to continue?`,
          persistent: true,
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
          onAction: async (action: NotificationAction) => {
            if (action === "confirm") {
              try {
                // Close existing published windows
                await (window.electronAPI as any).closePublishedWindows();
                
                showNotification({
                  type: "info",
                  title: "Publishing Layout",
                  message: "Creating new published layout...",
                  autoClose: 2000,
                });

                // Proceed with publishing
                await performPublish(selectedWindows);
              } catch (error) {
                showNotification({
                  type: "error",
                  title: "Failed to Close Publications",
                  message: "Could not close existing published windows. Please close them manually and try again.",
                  autoClose: 5000,
                });
              }
            }
          },
        });
        return;
      }

      // No existing publications, proceed directly
      await performPublish(selectedWindows);

    } catch (error) {
      console.error("Failed to check published windows:", error);
      showNotification({
        type: "error",
        title: "Publication Check Failed",
        message: "Could not verify existing publications. Please try again.",
        autoClose: 4000,
      });
    }
  }, [state.windows, state.currentLayout, state.focusedWindowId, showNotification]);

  const performPublish = async (selectedWindows: WindowInfo[]) => {
    try {
      showNotification({
        type: "info",
        title: "Publishing Layout",
        message: "Creating fullscreen published layout...",
        autoClose: 3000,
      });

      // Call the Electron API to open a new window with the layout
      const result = await window.electronAPI.publishLayout({
        windows: selectedWindows,
        layout: state.currentLayout,
        focusedWindowId: state.focusedWindowId,
      });
      
      console.log("publishLayout result:", result);

      if (result.success) {
        showNotification({
          type: "success",
          title: "Layout Published Successfully!",
          message: `Published layout with ${selectedWindows.length} window${selectedWindows.length === 1 ? '' : 's'} in fullscreen mode.`,
          autoClose: 4000,
        });
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to publish layout:", error);
      showNotification({
        type: "error",
        title: "Publication Failed",
        message: error instanceof Error ? error.message : "An unexpected error occurred while publishing the layout.",
        autoClose: 5000,
      });
    }
  };

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
      <div className="relative z-10 h-[95%] w-full backdrop-blur-sm bg-slate-900/20 border-1 border-primary-600  border-dashed rounded-3xl flex overflow-hidden">
        <div className="w-80 bg-slate-900/60 backdrop-blur-sm border-r border-slate-600/30 py-6 px-4 flex flex-col overflow-hidden">
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
            onWindowFocus={handleWindowFocus}
            onWindowRemove={handleWindowRemove}
            onWindowAdd={handleWindowAdd}
            onPublishLayout={handlePublishLayout}
          />
        </div>
      </div>

      {/* Live Mode Badge */}
      {state.windows.length > 0 ? (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-blue-400 text-white px-4 py-2 rounded-full text-sm font-bold border border-blue-400/30 shadow-lg shadow-blue-500/25 z-20 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          LIVE MODE - {state.windows.length} windows detected
        </div>
      ) : isLoadingWindows ? (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-yellow-600/80 text-white px-4 py-2 rounded-full text-sm font-bold border border-yellow-400/30 shadow-lg shadow-yellow-500/25 z-20 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-spin"></div>
          Loading windows...
        </div>
      ) : (
        <div className="fixed bottom-6 right-6 backdrop-blur-md bg-blue-600/80 text-white px-4 py-2 rounded-full text-sm font-bold border border-blue-400/30 shadow-lg shadow-blue-500/25 z-20">
          DEMO MODE - No windows detected
        </div>
      )}
    </div>
  );
};
