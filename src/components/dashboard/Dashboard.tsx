import React, { useState, useCallback, useEffect, useMemo } from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { WindowList, type WindowInfo } from "./WindowList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel/RightPanel";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";
import { NotificationModalComponent } from "@/components/ui/NotificationModal";
import { useAppDispatch } from "@/store/hooks";
import { handlePublishLayout as reduxHandlePublishLayout } from "@/store/slices/notificationSlice";

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

  const [state, setState] = useState<DashboardState>({
    windows: [],
    currentLayout: "auto",
    focusedWindowId: null,
    activeSection: "dashboard",
  });

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // Projection state
  const [isProjectionOn, setIsProjectionOn] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Update state when enumerated windows change
  // Use a ref to track the last enumerated windows to avoid unnecessary syncs
  const lastEnumeratedWindowsRef = React.useRef<WindowInfo[]>([]);
  const syncTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (enumeratedWindows.length > 0) {
      // Clear any pending sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Debounce the sync to avoid race conditions with manual selections
      syncTimeoutRef.current = setTimeout(() => {
        // Check if the enumerated windows actually changed (deep comparison of IDs)
        const currentIds = enumeratedWindows
          .map((w) => w.id)
          .sort()
          .join(",");
        const lastIds = lastEnumeratedWindowsRef.current
          .map((w) => w.id)
          .sort()
          .join(",");

        // Only sync if the windows list actually changed
        if (currentIds !== lastIds) {
          console.log("🔄 Enumeration changed, syncing...");
          lastEnumeratedWindowsRef.current = enumeratedWindows;

          // Use functional setState to ensure we always read the latest state
          setState((prev) => {
            // Create a map of existing windows for quick lookup
            const existingWindowsMap = new Map(
              prev.windows.map((w) => [w.id, w])
            );

            // Merge enumerated windows with existing state, preserving isSelected
            const mergedWindows = enumeratedWindows.map((window) => {
              const existing = existingWindowsMap.get(window.id);
              return {
                ...window,
                // Preserve the isSelected state if window already exists
                isSelected: existing?.isSelected || false,
              };
            });

            const selectedCount = mergedWindows.filter(
              (w) => w.isSelected
            ).length;
            console.log(
              "🔄 Synced enumerated windows:",
              mergedWindows.length,
              "selected:",
              selectedCount,
              "prev selected:",
              prev.windows.filter((w) => w.isSelected).length
            );

            return {
              ...prev,
              windows: mergedWindows,
            };
          });
        } else {
          console.log("⏭️ Skipping sync - same windows");
        }
      }, 100); // 100ms debounce
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [enumeratedWindows]);

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
    console.log(
      "🎯 Dashboard.handleWindowAdd called with:",
      windowInfo.name,
      "id:",
      windowInfo.id
    );

    // Use the same logic as handleWindowSelect - just set isSelected to true
    setState((prev) => {
      const windowExists = prev.windows.some((w) => w.id === windowInfo.id);
      console.log("🔍 Window exists in state?", windowExists);

      if (windowExists) {
        // Window exists - mark it as selected (same as clicking)
        const updatedWindows = prev.windows.map((w) =>
          w.id === windowInfo.id ? { ...w, isSelected: true } : w
        );

        const selectedCount = updatedWindows.filter((w) => w.isSelected).length;
        console.log(
          "✏️ Marked window as selected, total selected:",
          selectedCount
        );

        return {
          ...prev,
          windows: updatedWindows,
        };
      } else {
        // Window doesn't exist in state - this shouldn't happen if enumeration is working
        console.warn("⚠️ Window not found in state! Adding it manually.");
        const newWindow = { ...windowInfo, isSelected: true };
        const newWindows = [...prev.windows, newWindow];

        return {
          ...prev,
          windows: newWindows,
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
    setIsProjectionOn(true);
  }, [dispatch, selectedWindows, state.currentLayout, state.focusedWindowId]);

  const handleCloseProjection = useCallback(async () => {
    try {
      await (window.electronAPI as any).closePublishedWindows();
      setIsProjectionOn(false);
    } catch (error) {
      console.error("Error closing published windows:", error);
    }
  }, []);

  // Resize handlers
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      // Constrain between 250px and 600px
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  // Add/remove event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col no-scrollbar bg-theme-primary-950 border-dashed border-b-8 border-t-0 border-x-8 border-theme-primary-500">
      {/* Title Bar - Windows 11 style */}
      <div className="h-8 bg-theme-primary-700 flex items-center justify-between select-none shrink-0 border-b border-theme-primary-800">
        {/* Left side - App icon and title */}
        <div className="flex items-center gap-2 px-3">
          <img src="./wingrid.png" alt="App Icon" className="w-4 h-4" />
          <div className="text-theme-primary-100 text-base font-normal font-[impact]">
            wingrid Driver Console
          </div>
        </div>

        {/* Right side - Window Controls (Windows 11 style) */}
        <div className="flex items-center h-full bg-theme-primary-900">
          {/* Minimize Button */}
          <button
            onClick={minimize}
            className="w-[46px] bg-theme-primary-500 h-full hover:bg-theme-primary-800 transition-colors flex items-center justify-center group"
            title="Minimize"
          >
            <svg
              width="10"
              height="1"
              viewBox="0 0 10 1"
              className="text-theme-primary-100"
            >
              <rect width="10" height="1" fill="currentColor" />
            </svg>
          </button>

          {/* Maximize/Restore Button */}
          <button
            onClick={maximize}
            className="w-[46px] h-full bg-theme-primary-500 hover:bg-theme-primary-800 transition-colors flex items-center justify-center group"
            title="Maximize"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="text-theme-primary-100"
            >
              <path
                d="M0,0 L10,0 L10,10 L0,10 Z M1,1 L1,9 L9,9 L9,1 Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* Close Button */}
          <button
            onClick={close}
            className="w-[46px] h-full bg-theme-primary-950 hover:bg-[#C42B1C] transition-colors flex items-center justify-center group"
            title="Close"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              className="text-theme-primary-100 group-hover:text-white"
            >
              <path
                d="M0,0 L10,10 M10,0 L0,10"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Window List */}
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="bg-theme-primary-900 flex flex-col overflow-hidden shrink-0 relative @container/sidebar"
        >
          <WindowList
            windows={state.windows}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={focusWindowNative}
            onWindowDragStart={(window) => {
              console.log("Drag started for window:", window.name);
            }}
            onWindowDragEnd={() => {
              console.log("Drag ended");
            }}
            isLoading={isLoadingWindows}
            error={windowError}
            countdownTime={countdownTime}
            totalRefreshTime={totalRefreshTime}
            onManualRefresh={handleRefreshWindows}
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className={`w-1.5 bg-theme-primary-600/50 hover:bg-theme-primary-500 cursor-ew-resize shrink-0 relative group transition-colors ${
            isResizing ? "bg-theme-primary-400" : ""
          }`}
        >
          {/* Visual indicator dots */}
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
            <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
          </div>
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="flex-1 bg-theme-primary-950 flex flex-col overflow-hidden">
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
            showSettings={showSettings}
            onToggleSettings={() => setShowSettings(!showSettings)}
            isProjectionOn={isProjectionOn}
            onCloseProjection={handleCloseProjection}
          />
        </div>
      </div>

      {/* Bottom Status Bar - spacedesk style */}
      <div className="h-8 bg-theme-primary-950 border-t-3 border-x-0 border-b-0 border-theme-primary-400 flex items-center justify-between px-4 text-xs text-theme-primary-100 shrink-0 border-double">
        {/* Left side - Status indicators */}
        <div className="flex items-center gap-4">
          {state.windows.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-theme-primary-400 rounded-full"></div>
                <span>Server: ON (idle)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Windows: {state.windows.length} detected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-theme-primary-400 rounded-full"></div>
                <span>Selected: {selectedWindows.length}</span>
              </div>
            </>
          ) : isLoadingWindows ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Loading windows...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Server: ON (no windows)</span>
            </div>
          )}
        </div>

        {/* Right side - Version info */}
        <div className="flex items-center gap-2">
          <span>Version 1.0.0 (Beta)</span>
          <span className="text-theme-primary-400 cursor-pointer hover:underline">
            Check for Updates
          </span>
        </div>
      </div>

      {/* Custom Notification Modal */}
      <NotificationModalComponent />
    </div>
  );
};
