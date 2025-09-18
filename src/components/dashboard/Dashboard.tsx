import React, { useState, useCallback, useEffect } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { WindowList, type WindowInfo } from "./WindowList";
import { PresetsList, mockPresets, type PresetInfo } from "./PresetsList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";

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
  } = useWindowEnumeration({
    includeMinimized: false,
    includeSystemWindows: false,
    refreshInterval: 5000, // Refresh every 5 seconds
  });

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
    console.log("Enumerated windows changed:", {
      count: enumeratedWindows.length,
      windows: enumeratedWindows,
      isLoading: isLoadingWindows,
      error: windowError,
    });

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

    console.log("Publish Layout clicked:", {
      selectedWindowsCount: selectedWindows.length,
      selectedWindows,
      currentLayout: state.currentLayout,
      focusedWindowId: state.focusedWindowId,
    });

    if (selectedWindows.length === 0) {
      console.warn("No windows selected for publishing");
      alert("Please select at least one window to publish");
      return;
    }

    try {
      console.log("Calling electronAPI.publishLayout...");

      // Show immediate feedback
      const publishingToast = document.createElement("div");
      publishingToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #059669; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; font-family: system-ui;">
          🚀 Publishing layout...
        </div>
      `;
      document.body.appendChild(publishingToast);

      // Call the Electron API to open a new window with the layout
      const result = await window.electronAPI.publishLayout({
        windows: selectedWindows,
        layout: state.currentLayout,
        focusedWindowId: state.focusedWindowId,
      });
      console.log("publishLayout result:", result);

      // Update toast with success message
      publishingToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; font-family: system-ui;">
          ✅ Layout published successfully!
        </div>
      `;

      // Remove toast after 3 seconds
      setTimeout(() => {
        if (publishingToast.parentNode) {
          publishingToast.parentNode.removeChild(publishingToast);
        }
      }, 3000);
    } catch (error) {
      console.error("Failed to publish layout:", error);

      // Show error toast
      const errorToast = document.createElement("div");
      errorToast.innerHTML = `
        <div style="position: fixed; top: 20px; right: 20px; background: #dc2626; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000; font-family: system-ui;">
          ❌ Failed to publish layout
        </div>
      `;
      document.body.appendChild(errorToast);

      setTimeout(() => {
        if (errorToast.parentNode) {
          errorToast.parentNode.removeChild(errorToast);
        }
      }, 3000);
    }
  }, [state.windows, state.currentLayout, state.focusedWindowId]);

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
        <div className="w-80 bg-slate-900/60 backdrop-blur-sm border-r border-slate-600/30 p-6 flex flex-col overflow-hidden">
          <WindowList
            windows={state.windows}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={focusWindowNative}
            isLoading={isLoadingWindows}
            error={windowError}
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
