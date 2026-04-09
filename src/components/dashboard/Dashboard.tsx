import React, { useState, useCallback, useEffect, useMemo } from "react";
import { WindowList, type WindowInfo } from "./WindowList";
import { CosmicBackground } from "./CosmicBackground";
import { RightPanel } from "./RightPanel/RightPanel";
import type { PanelView } from "./RightPanel/types";
import { TitleBar } from "@/shared/TitleBar";
import { DepthSurface } from "@/shared/DepthSurface";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
import { PublishedLayout } from "./PublishedLayout";
import { NotifierContainer } from "@/components/ui/NotifierContainer";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  handlePublishLayout as reduxHandlePublishLayout,
  showNotification,
} from "@/store/slices/notificationSlice";
import {
  toggleBlackout,
  toggleFrozen,
  setBlackout,
  setFrozen,
  setProjectionOn,
  setLastLoadedPresetId,
  setScenePresets,
  type ScenePreset,
} from "@/store/slices/appSlice";
import {
  clearDisplayAssignments,
  setDisplayAssignments,
} from "@/store/slices/gridSlice";
import {
  useSelectionHistory,
  type SelectionMap,
} from "@/hooks/useSelectionHistory";

interface DashboardState {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  activeSection: string;
}

interface SelectionHistorySnapshot {
  selection: SelectionMap;
  displayAssignments: Record<number, string[]>;
  focusedWindowId: string | null;
}

const SIDEBAR_WIDTH_STORAGE_KEY = "wingrid.sidebarWidth";
const SIDEBAR_MIN_WIDTH = 300;
const SIDEBAR_MAX_WIDTH = 600;
const SIDEBAR_DEFAULT_WIDTH = 380;

interface DashboardProps {
  onHomeClick?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onHomeClick }) => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const publishedQuality = useAppSelector(
    (state) => state.app.publishedQuality,
  );
  const captureQuality = useAppSelector((state) => state.app.captureQuality);
  const refreshIntervalSetting = useAppSelector(
    (state) => state.app.refreshInterval,
  );

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
    refreshInterval: refreshIntervalSetting,
    smartRefresh: false, // Disable smart refresh to prevent frequent updates
  });

  const [state, setState] = useState<DashboardState>({
    windows: [],
    currentLayout: "auto",
    focusedWindowId: null,
    activeSection: "dashboard",
  });

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    const parsed = Number(raw);

    if (!Number.isFinite(parsed)) {
      return SIDEBAR_DEFAULT_WIDTH;
    }

    return Math.min(Math.max(parsed, SIDEBAR_MIN_WIDTH), SIDEBAR_MAX_WIDTH);
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(sidebarWidth),
    );
  }, [sidebarWidth]);

  // Settings panel toggle
  const [activePanel, setActivePanel] = useState<PanelView>("layout");

  // Projection / Blackout / Freeze from Redux
  const isProjectionOn = useAppSelector((s) => s.app.isProjectionOn);
  const isBlackout = useAppSelector((s) => s.app.isBlackout);
  const isFrozen = useAppSelector((s) => s.app.isFrozen);
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);
  const overlayTargetDisplayId = useAppSelector(
    (s) => s.app.overlayTargetDisplayId,
  );
  const displayAssignments = useAppSelector((s) => s.grid.displayAssignments);

  // Broadcast overlay state to published window whenever it changes
  useEffect(() => {
    (window.electronAPI as any)?.updateProjectionState?.({
      isBlackout,
      isFrozen,
      overlayText,
      overlayVisible,
      targetDisplayId: overlayTargetDisplayId,
    });
  }, [
    overlayText,
    overlayVisible,
    overlayTargetDisplayId,
    isBlackout,
    isFrozen,
  ]);

  // Undo / Redo selection history
  const cloneDisplayAssignments = useCallback(
    (assignments: Record<number, string[]>) =>
      Object.fromEntries(
        Object.entries(assignments).map(([displayId, ids]) => [
          Number(displayId),
          [...ids],
        ]),
      ) as Record<number, string[]>,
    [],
  );

  /** Build a SelectionMap from the current windows array. */
  const buildSelectionMap = useCallback((wins: WindowInfo[]): SelectionMap => {
    const map: SelectionMap = {};
    wins.forEach((w) => {
      if (w.isSelected) map[w.id] = true;
    });
    return map;
  }, []);

  const buildHistorySnapshot = useCallback(
    (
      wins: WindowInfo[],
      assignments: Record<number, string[]>,
      focusedWindowId: string | null,
    ): SelectionHistorySnapshot => ({
      selection: buildSelectionMap(wins),
      displayAssignments: cloneDisplayAssignments(assignments),
      focusedWindowId,
    }),
    [buildSelectionMap, cloneDisplayAssignments],
  );

  const selectionHistory = useSelectionHistory<SelectionHistorySnapshot>(
    buildHistorySnapshot([], {}, null),
  );
  const isApplyingHistoryRef = React.useRef(false);
  const assignmentsSignatureRef = React.useRef("");

  const serializeAssignments = useCallback(
    (value: Record<number, string[]>) => {
      return JSON.stringify(
        Object.keys(value)
          .map((id) => Number(id))
          .sort((a, b) => a - b)
          .map((id) => [id, [...(value[id] ?? [])]]),
      );
    },
    [],
  );

  /** Apply a history snapshot to the current windows and display routing. */
  const applyHistorySnapshot = useCallback(
    (snapshot: SelectionHistorySnapshot) => {
      isApplyingHistoryRef.current = true;
      setState((prev) => ({
        ...prev,
        windows: prev.windows.map((w) => ({
          ...w,
          isSelected: !!snapshot.selection[w.id],
        })),
        focusedWindowId: snapshot.focusedWindowId,
      }));
      dispatch(
        setDisplayAssignments(
          cloneDisplayAssignments(snapshot.displayAssignments),
        ),
      );
      queueMicrotask(() => {
        isApplyingHistoryRef.current = false;
      });
    },
    [dispatch, cloneDisplayAssignments],
  );

  /** Push current selection to history (call after every mutation). */
  const pushHistory = useCallback(
    (
      wins: WindowInfo[],
      assignments: Record<number, string[]> = displayAssignments,
      focusedWindowId: string | null = state.focusedWindowId,
    ) => {
      selectionHistory.push(
        buildHistorySnapshot(wins, assignments, focusedWindowId),
      );
    },
    [
      selectionHistory.push,
      buildHistorySnapshot,
      displayAssignments,
      state.focusedWindowId,
    ],
  );

  const handleUndo = useCallback(() => {
    const snapshot = selectionHistory.undo();
    if (snapshot) {
      applyHistorySnapshot(snapshot);
    }
  }, [selectionHistory.undo, applyHistorySnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = selectionHistory.redo();
    if (snapshot) {
      applyHistorySnapshot(snapshot);
    }
  }, [selectionHistory.redo, applyHistorySnapshot]);

  useEffect(() => {
    const nextSignature = serializeAssignments(displayAssignments);

    if (!assignmentsSignatureRef.current) {
      assignmentsSignatureRef.current = nextSignature;
      return;
    }

    if (nextSignature === assignmentsSignatureRef.current) {
      return;
    }

    assignmentsSignatureRef.current = nextSignature;

    if (isApplyingHistoryRef.current) {
      return;
    }

    pushHistory(state.windows, displayAssignments, state.focusedWindowId);
  }, [
    displayAssignments,
    serializeAssignments,
    pushHistory,
    state.windows,
    state.focusedWindowId,
  ]);

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
          // ── Auto-detect new windows ──
          const lastIdSet = new Set(
            lastEnumeratedWindowsRef.current.map((w) => w.id),
          );
          if (lastIdSet.size > 0) {
            const newWindows = enumeratedWindows.filter(
              (w) => !lastIdSet.has(w.id),
            );
            if (newWindows.length > 0) {
              const names = newWindows
                .map((w) => w.name)
                .slice(0, 3)
                .join(", ");
              const suffix =
                newWindows.length > 3
                  ? ` and ${newWindows.length - 3} more`
                  : "";
              dispatch(
                showNotification({
                  type: "info",
                  title: "New Windows Detected",
                  message: `${names}${suffix}`,
                  autoClose: 4000,
                }),
              );
            }
          }

          lastEnumeratedWindowsRef.current = enumeratedWindows;

          // Use functional setState to ensure we always read the latest state
          setState((prev) => {
            // Create a map of existing windows for quick lookup
            const existingWindowsMap = new Map(
              prev.windows.map((w) => [w.id, w]),
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

            return {
              ...prev,
              windows: mergedWindows,
            };
          });
        }
      }, 100); // 100ms debounce
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [enumeratedWindows]);

  // ── Startup profile: auto-load last preset once windows are available ──
  const autoLoadLastPreset = useAppSelector((s) => s.app.autoLoadLastPreset);
  const lastLoadedPresetId = useAppSelector((s) => s.app.lastLoadedPresetId);
  const startupDoneRef = React.useRef(false);

  useEffect(() => {
    if (startupDoneRef.current) return;
    if (!autoLoadLastPreset || !lastLoadedPresetId) return;
    if (state.windows.length === 0) return; // wait for windows

    startupDoneRef.current = true;

    // Load presets from disk, find the last one, and apply it
    (async () => {
      try {
        const result = await (window.electronAPI as any).loadPresets();
        if (result.success && result.presets) {
          dispatch(setScenePresets(result.presets));
          const preset = (result.presets as ScenePreset[]).find(
            (p) => p.id === lastLoadedPresetId,
          );
          if (preset) {
            // Apply preset selection
            let captured: WindowInfo[] = [];
            setState((prev) => {
              captured = prev.windows.map((w) => {
                const match = preset.windows.find(
                  (pw) =>
                    pw.id === w.id || (pw.app === w.app && pw.name === w.name),
                );
                return { ...w, isSelected: !!match };
              });
              return { ...prev, windows: captured, focusedWindowId: null };
            });
            pushHistory(captured);
          }
        }
      } catch (err) {
        console.error("Failed to auto-load startup preset:", err);
      }
    })();
  }, [
    autoLoadLastPreset,
    lastLoadedPresetId,
    state.windows.length,
    dispatch,
    pushHistory,
  ]);

  // Section navigation handler
  const handleSectionChange = useCallback((section: string) => {
    setState((prev) => ({ ...prev, activeSection: section }));
  }, []);

  // Header event handlers
  const handleRefreshWindows = useCallback(() => {
    refreshWindows();
  }, [refreshWindows]);

  const handleClearAll = useCallback(() => {
    const newWindows = state.windows.map((w) => ({ ...w, isSelected: false }));
    setState((prev) => ({
      ...prev,
      windows: newWindows,
      focusedWindowId: null,
    }));
    dispatch(clearDisplayAssignments());
    pushHistory(newWindows, {}, null);
  }, [dispatch, state.windows, pushHistory]);

  const handleLayoutChange = useCallback((layout: string) => {
    setState((prev) => ({ ...prev, currentLayout: layout }));
  }, []);

  const togglePanel = useCallback((panel: PanelView) => {
    setActivePanel((prev) => (prev === panel ? "layout" : panel));
  }, []);

  // Window handlers
  const handleWindowSelect = useCallback(
    (windowId: string) => {
      const newWindows = state.windows.map((w) =>
        w.id === windowId ? { ...w, isSelected: !w.isSelected } : w,
      );
      const toggled = newWindows.find((w) => w.id === windowId);
      const newFocusedId = toggled?.isSelected
        ? state.focusedWindowId
        : state.focusedWindowId === windowId
          ? null
          : state.focusedWindowId;
      setState((prev) => ({
        ...prev,
        windows: newWindows,
        focusedWindowId: newFocusedId,
      }));
      pushHistory(newWindows);
    },
    [state.windows, state.focusedWindowId, pushHistory],
  );

  const handleWindowAdd = useCallback(
    (windowInfo: WindowInfo) => {
      const windowExists = state.windows.some((w) => w.id === windowInfo.id);
      const newWindows = windowExists
        ? state.windows.map((w) =>
            w.id === windowInfo.id ? { ...w, isSelected: true } : w,
          )
        : [...state.windows, { ...windowInfo, isSelected: true }];
      setState((prev) => ({ ...prev, windows: newWindows }));
      pushHistory(newWindows);
    },
    [state.windows, pushHistory],
  );

  const mainSectionBackground =
    "radial-gradient(ellipse at 30% 55%, color-mix(in srgb, rgb(var(--theme-primary-400)) 10%, transparent) 0%, transparent 55%), radial-gradient(ellipse at 70% 45%, color-mix(in srgb, rgb(var(--theme-primary-400)) 9%, transparent) 0%, transparent 55%)";

  // Grid handlers
  const handleWindowFocus = useCallback((windowId: string) => {
    setState((prev) => ({
      ...prev,
      focusedWindowId: prev.focusedWindowId === windowId ? null : windowId,
    }));
  }, []);

  // Pin / Unpin a window to keep it at the top of the list
  const handleWindowPin = useCallback((windowId: string) => {
    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === windowId ? { ...w, isPinned: !w.isPinned } : w,
      ),
    }));
  }, []);

  const handleWindowRemove = useCallback(
    (windowId: string) => {
      const newWindows = state.windows.map((w) =>
        w.id === windowId ? { ...w, isSelected: false } : w,
      );
      const newFocusedId =
        state.focusedWindowId === windowId ? null : state.focusedWindowId;
      setState((prev) => ({
        ...prev,
        windows: newWindows,
        focusedWindowId: newFocusedId,
      }));
      pushHistory(newWindows);
    },
    [state.windows, state.focusedWindowId, pushHistory],
  );

  // Memoize selected windows to prevent recalculation
  const selectedWindows = useMemo(
    () => state.windows.filter((w) => w.isSelected),
    [state.windows],
  );

  const handlePublishLayout = useCallback(async () => {
    // Use Redux async thunk for publish layout with quality settings
    dispatch(
      reduxHandlePublishLayout({
        selectedWindows,
        currentLayout: state.currentLayout,
        focusedWindowId: state.focusedWindowId,
        publishedQuality,
        captureQuality,
      }),
    );
    dispatch(setProjectionOn(true));
  }, [
    dispatch,
    selectedWindows,
    state.currentLayout,
    state.focusedWindowId,
    publishedQuality,
    captureQuality,
  ]);

  const handleCloseProjection = useCallback(async () => {
    try {
      await (window.electronAPI as any).closePublishedWindows();
      dispatch(setProjectionOn(false));
      // Reset blackout/freeze when projection closes
      dispatch(setBlackout(false));
      dispatch(setFrozen(false));
    } catch (error) {
      console.error("Error closing published windows:", error);
    }
  }, [dispatch]);

  // ── Blackout / Freeze toggles ──────────────────────────────────────────
  const handleToggleBlackout = useCallback(() => {
    const newVal = !isBlackout;
    dispatch(toggleBlackout());
    (window.electronAPI as any)?.updateProjectionState?.({
      isBlackout: newVal,
      isFrozen,
    });
  }, [dispatch, isBlackout, isFrozen]);

  const handleToggleFrozen = useCallback(() => {
    const newVal = !isFrozen;
    dispatch(toggleFrozen());
    (window.electronAPI as any)?.updateProjectionState?.({
      isBlackout,
      isFrozen: newVal,
    });
  }, [dispatch, isBlackout, isFrozen]);

  // ── Load preset ────────────────────────────────────────────────────────
  const handleLoadPreset = useCallback(
    (preset: ScenePreset) => {
      let captured: WindowInfo[] = [];
      dispatch(clearDisplayAssignments());
      setState((prev) => {
        // Match preset windows to current windows by app name + window name
        captured = prev.windows.map((w) => {
          const match = preset.windows.find(
            (pw) => pw.id === w.id || (pw.app === w.app && pw.name === w.name),
          );
          return { ...w, isSelected: !!match };
        });
        return { ...prev, windows: captured, focusedWindowId: null };
      });
      pushHistory(captured);
    },
    [dispatch, pushHistory],
  );

  // ── Global hotkey listener ─────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = (window.electronAPI as any)?.onGlobalHotkey?.(
      (action: string) => {
        switch (action) {
          case "toggle-projection":
            if (isProjectionOn) {
              handleCloseProjection();
            } else if (selectedWindows.length > 0) {
              handlePublishLayout();
            }
            break;
          case "toggle-blackout":
            if (isProjectionOn) handleToggleBlackout();
            break;
          case "toggle-freeze":
            if (isProjectionOn) handleToggleFrozen();
            break;
          case "clear-all":
            handleClearAll();
            break;
          case "undo":
            handleUndo();
            break;
          case "redo":
            handleRedo();
            break;
        }
      },
    );

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [
    isProjectionOn,
    selectedWindows.length,
    handleCloseProjection,
    handlePublishLayout,
    handleToggleBlackout,
    handleToggleFrozen,
    handleClearAll,
    handleUndo,
    handleRedo,
  ]);

  // ── Keyboard shortcuts (local — Ctrl+Z / Ctrl+Y) ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        handleUndo();
      } else if (e.ctrlKey && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

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
      // Constrain sidebar width
      if (newWidth >= SIDEBAR_MIN_WIDTH && newWidth <= SIDEBAR_MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing],
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
      <TitleBar
        selectedWindowsCount={selectedWindows.length}
        isProjectionOn={isProjectionOn}
        isBlackout={isBlackout}
        isFrozen={isFrozen}
        overlayVisible={overlayVisible}
        activePanel={activePanel}
        canUndo={selectionHistory.canUndo}
        canRedo={selectionHistory.canRedo}
        onHomeClick={onHomeClick}
        onPublishLayout={handlePublishLayout}
        onCloseProjection={handleCloseProjection}
        onToggleBlackout={handleToggleBlackout}
        onToggleFrozen={handleToggleFrozen}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onTogglePanel={togglePanel}
        onClearAll={handleClearAll}
      />

      {/* Main Content Area */}
      <div
        className="flex-1 flex overflow-hidden px-2 py-1 gap-3"
        style={{
          background: mainSectionBackground,
          backgroundColor: "rgb(var(--theme-primary-800))",
        }}
      >
        {/* Left Panel - Window List */}
        <DepthSurface
          style={{ width: `${sidebarWidth}px` }}
          className="relative flex flex-col overflow-hidden shrink-0 rounded-2xl h-full min-h-0 shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
          surfaceClassName="depth-surface-shell"
        >
          <WindowList
            windows={state.windows}
            onWindowSelect={handleWindowSelect}
            onWindowPin={handleWindowPin}
            onWindowFocus={focusWindowNative}
            onWindowDragStart={(window) => {}}
            onWindowDragEnd={() => {}}
            isLoading={isLoadingWindows}
            error={windowError}
            countdownTime={countdownTime}
            totalRefreshTime={totalRefreshTime}
            onManualRefresh={handleRefreshWindows}
          />

          {/* Attached resize handle (shows only on edge hover) */}
          <div
            onMouseDown={handleMouseDown}
            className="absolute right-0 top-0 h-full w-3 cursor-ew-resize z-20 group"
            title="Resize panel"
          >
            <div
              className={`absolute right-0.5 top-1/2 -translate-y-1/2 h-16 w-1 rounded-full transition-all duration-200 ${
                isResizing
                  ? "bg-theme-primary-400 opacity-100"
                  : "bg-theme-primary-500/70 opacity-0 group-hover:opacity-100"
              }`}
            />
            <div className="absolute right-[1px] top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
              <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
              <div className="w-0.5 h-0.5 rounded-full bg-theme-primary-200"></div>
            </div>
          </div>
        </DepthSurface>

        {/* Right Panel - Dynamic Content */}
        <div className="flex h-full min-h-0 flex-1 min-w-0 overflow-hidden rounded-2xl">
          <RightPanel
            windows={state.windows}
            currentLayout={state.currentLayout}
            focusedWindowId={state.focusedWindowId}
            onLayoutChange={handleLayoutChange}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={handleWindowFocus}
            onWindowRemove={handleWindowRemove}
            onWindowAdd={handleWindowAdd}
            activePanel={activePanel}
            onLoadPreset={handleLoadPreset}
          />
        </div>
      </div>

      {/* Bottom Status Bar - spacedesk style */}
      <div className="h-8 bg-theme-primary-950 border-t-3 border-x-0 border-b-0 border-theme-primary-400 flex items-center justify-between px-4 text-xs text-theme-primary-100 shrink-0 border-double">
        {/* Left side - Status indicators */}
        <div className="flex items-center gap-4">
          {/* Projection status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${isProjectionOn ? "bg-green-400 animate-pulse" : "bg-gray-500"}`}
            ></div>
            <span>
              {isProjectionOn ? "Projection: LIVE" : "Projection: OFF"}
            </span>
          </div>

          {/* Blackout indicator */}
          {isProjectionOn && isBlackout && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-yellow-400">Blackout</span>
            </div>
          )}

          {/* Freeze indicator */}
          {isProjectionOn && isFrozen && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-cyan-400">Frozen</span>
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-3 bg-white/10"></div>

          {state.windows.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Windows: {state.windows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-theme-primary-400 rounded-full"></div>
                <span>Selected: {selectedWindows.length}</span>
              </div>
            </>
          ) : isLoadingWindows ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span>Scanning...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span>No windows</span>
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

      {/* Toast Notifications */}
      <NotifierContainer />
    </div>
  );
};
