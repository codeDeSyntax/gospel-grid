import React, { useState, useCallback, useEffect, useMemo } from "react";
import { WindowPicker, type WindowInfo } from "./picker/WindowPicker";
import { CosmicBackground } from "./background/CosmicBackground";
import { FloatingCaptionsOrb } from "./captions/FloatingCaptionsOrb";
import { InspectorPanel } from "./inspector/InspectorPanel";
import type { PanelView } from "./inspector/types";
import { TitleBar } from "@/shared/TitleBar";
import { DepthSurface } from "@/shared/DepthSurface";
import { useWindowEnumeration } from "@/hooks/useWindowEnumeration";
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
} from "@/store/slices/appSlice";
import {
  clearDisplayAssignments,
  setDisplayAssignments,
} from "@/store/slices/gridSlice";
import {
  useSelectionHistory,
  type SelectionMap,
} from "@/hooks/useSelectionHistory";
import {
  FEATURE_TIMER_EVENT,
  type FeatureTimerItem,
  getCountdownRemainingMs,
  loadFeatureTimerCollection,
  markCollectionCompletedIfElapsed,
  saveFeatureTimerCollection,
} from "./inspector/featureTimerState";
import {
  FEATURE_IMAGE_EVENT,
  type FeatureImageItem,
  getImageFeatureWindowId,
  loadFeatureImageCollection,
} from "./inspector/featureImageState";
import { CAPTIONS_FEATURE_WINDOW_ID } from "./inspector/featureCaptionsState";

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
const TIMER_FEATURE_WINDOW_PREFIX = "feature:timer-window:";
const IMAGE_FEATURE_WINDOW_PREFIX = "feature:image-window:";

const isFeatureWindowId = (id: string) => id.startsWith("feature:");
const getTimerFeatureWindowId = (timerId: string) =>
  `${TIMER_FEATURE_WINDOW_PREFIX}${timerId}`;

const formatTimerShort = (remainingMs: number): string => {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const buildTimerFeatureWindow = (timer: FeatureTimerItem): WindowInfo => {
  const nowMs = Date.now();
  const remainingMs = getCountdownRemainingMs(timer.state, nowMs);
  const modeLabel = timer.state.mode === "countdown" ? "Countdown" : "Clock";

  return {
    id: getTimerFeatureWindowId(timer.id),
    app: "Feature Window",
    name:
      timer.state.mode === "countdown"
        ? `${timer.name} • ${modeLabel} • ${formatTimerShort(remainingMs)}`
        : `${timer.name} • Current Time`,
    isSelected: false,
    isPinned: true,
    icon: "./countdown.png",
    isVisible: true,
    isMinimized: false,
  };
};

const buildImageFeatureWindow = (image: FeatureImageItem): WindowInfo => {
  return {
    id: getImageFeatureWindowId(image.id),
    app: "Image Feature",
    name: image.name,
    isSelected: false,
    isPinned: true,
    icon: "./images.png",
    thumbnail: image.url,
    isVisible: true,
    isMinimized: false,
  };
};

const buildCaptionsFeatureWindow = (): WindowInfo => ({
  id: CAPTIONS_FEATURE_WINDOW_ID,
  app: "Feature Window",
  name: "Live Captions",
  isSelected: false,
  isPinned: true,
  icon: "./caption.png",
  isVisible: true,
  isMinimized: false,
});

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
  const [timerFeatureWindows, setTimerFeatureWindows] = useState<WindowInfo[]>(
    [],
  );
  const [imageFeatureWindows, setImageFeatureWindows] = useState<WindowInfo[]>(
    [],
  );
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isDownloadingUpdate, setIsDownloadingUpdate] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStatus, setUpdateStatus] = useState("Idle");
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState<string>("1.0.0");
  const captionsFeatureWindow = useMemo(() => buildCaptionsFeatureWindow(), []);

  useEffect(() => {
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(sidebarWidth),
    );
  }, [sidebarWidth]);

  useEffect(() => {
    const syncTimerFeatureWindow = () => {
      const loaded = loadFeatureTimerCollection();
      const normalized = markCollectionCompletedIfElapsed(loaded, Date.now());
      if (normalized !== loaded) {
        saveFeatureTimerCollection(normalized);
      }

      const nextFeatureWindows = normalized.timers
        .filter((timer) => timer.state.showInWindowList)
        .map((timer) => buildTimerFeatureWindow(timer));

      setTimerFeatureWindows(nextFeatureWindows);
    };

    const handleTimerUpdate = () => {
      syncTimerFeatureWindow();
    };

    syncTimerFeatureWindow();
    const interval = window.setInterval(syncTimerFeatureWindow, 1000);
    window.addEventListener(
      FEATURE_TIMER_EVENT,
      handleTimerUpdate as EventListener,
    );

    return () => {
      window.clearInterval(interval);
      window.removeEventListener(
        FEATURE_TIMER_EVENT,
        handleTimerUpdate as EventListener,
      );
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    let hasRequestedDownload = false;

    const onUpdateCanAvailable = (
      _event: Electron.IpcRendererEvent,
      arg: VersionInfo,
    ) => {
      if (disposed) return;
      setIsCheckingUpdate(false);

      if (arg?.version) {
        setAppVersion(arg.version);
      }

      if (arg?.update) {
        if (arg?.newVersion) {
          setUpdateVersion(arg.newVersion);
        }
        setUpdateReady(true);
        setUpdateDownloaded(false);
        setUpdateStatus(
          arg?.newVersion
            ? `Update available: v${arg.newVersion}`
            : "Update available",
        );
      } else {
        setIsDownloadingUpdate(false);
        setUpdateReady(false);
        setUpdateDownloaded(false);
        setUpdateProgress(0);
        setUpdateStatus("Up to date");
      }
    };

    const onDownloadProgress = (
      _event: Electron.IpcRendererEvent,
      info: { percent?: number },
    ) => {
      if (disposed) return;
      const percent = Math.max(0, Math.min(100, Number(info?.percent ?? 0)));
      setIsDownloadingUpdate(true);
      setUpdateDownloaded(false);
      setUpdateProgress(percent);
      setUpdateStatus(`Downloading ${percent.toFixed(1)}%`);
    };

    const onUpdateDownloaded = (
      _event: Electron.IpcRendererEvent,
      info?: { version?: string },
    ) => {
      if (disposed) return;
      setIsCheckingUpdate(false);
      setIsDownloadingUpdate(false);
      setUpdateReady(true);
      setUpdateDownloaded(true);
      setUpdateProgress(100);
      if (info?.version) {
        setUpdateVersion(info.version);
      }
      setUpdateStatus("Ready to install");
    };

    const onUpdateError = (
      _event: Electron.IpcRendererEvent,
      payload: { message?: string },
    ) => {
      if (disposed) return;
      hasRequestedDownload = false;
      setIsCheckingUpdate(false);
      setIsDownloadingUpdate(false);
      setUpdateDownloaded(false);
      setUpdateStatus(
        payload?.message ? `Error: ${payload.message}` : "Update error",
      );
    };

    window.ipcRenderer.on("update-can-available", onUpdateCanAvailable);
    window.ipcRenderer.on("download-progress", onDownloadProgress);
    window.ipcRenderer.on("update-downloaded", onUpdateDownloaded);
    window.ipcRenderer.on("update-error", onUpdateError);

    setIsCheckingUpdate(true);
    setUpdateStatus("Checking...");
    void window.ipcRenderer
      .invoke("check-update")
      .then(
        (
          result:
            | {
                error?: { message?: string };
                message?: string;
                devMode?: boolean;
              }
            | undefined,
        ) => {
          if (result?.devMode) {
            setIsCheckingUpdate(false);
            setUpdateStatus("Updates available after install");
          } else if (result?.error) {
            setIsCheckingUpdate(false);
            setUpdateStatus(
              result.error.message
                ? `Check failed: ${result.error.message}`
                : "Check failed",
            );
          }
        },
      )
      .catch((error: unknown) => {
        setIsCheckingUpdate(false);
        setUpdateStatus(
          error instanceof Error
            ? `Check failed: ${error.message}`
            : "Check failed",
        );
      });

    return () => {
      disposed = true;
      window.ipcRenderer.off("update-can-available", onUpdateCanAvailable);
      window.ipcRenderer.off("download-progress", onDownloadProgress);
      window.ipcRenderer.off("update-downloaded", onUpdateDownloaded);
      window.ipcRenderer.off("update-error", onUpdateError);
    };
  }, []);

  const handleCheckForUpdates = useCallback(() => {
    setIsCheckingUpdate(true);
    setUpdateReady(false);
    setUpdateDownloaded(false);
    setUpdateProgress(0);
    setUpdateStatus("Checking...");

    void window.ipcRenderer
      .invoke("check-update")
      .then(
        (
          result:
            | {
                error?: { message?: string };
                message?: string;
                devMode?: boolean;
              }
            | undefined,
        ) => {
          setIsCheckingUpdate(false);
          if (result?.devMode) {
            setUpdateStatus("Updates available after install");
          } else if (result?.error) {
            setUpdateStatus(
              result.error.message
                ? `Check failed: ${result.error.message}`
                : "Check failed",
            );
          }
        },
      )
      .catch((error: unknown) => {
        setIsCheckingUpdate(false);
        setUpdateStatus(
          error instanceof Error
            ? `Check failed: ${error.message}`
            : "Check failed",
        );
      });
  }, []);

  const handleRestartToUpdate = useCallback(() => {
    void window.ipcRenderer.invoke("quit-and-install");
  }, []);

  const handleStartDownload = useCallback(() => {
    if (isDownloadingUpdate || updateDownloaded) {
      return;
    }

    setIsDownloadingUpdate(true);
    setUpdateDownloaded(false);
    setUpdateStatus("Downloading...");
    void window.ipcRenderer.invoke("start-download").catch((error: unknown) => {
      setIsDownloadingUpdate(false);
      setUpdateStatus(
        error instanceof Error
          ? `Download failed: ${error.message}`
          : "Download failed",
      );
    });
  }, [isDownloadingUpdate, updateDownloaded]);

  useEffect(() => {
    const syncImageFeatureWindows = () => {
      const loaded = loadFeatureImageCollection();
      const nextImageWindows = loaded.images.map((image) =>
        buildImageFeatureWindow(image),
      );

      setImageFeatureWindows(nextImageWindows);
    };

    const handleImageUpdate = () => {
      syncImageFeatureWindows();
    };

    syncImageFeatureWindows();
    window.addEventListener(
      FEATURE_IMAGE_EVENT,
      handleImageUpdate as EventListener,
    );

    return () => {
      window.removeEventListener(
        FEATURE_IMAGE_EVENT,
        handleImageUpdate as EventListener,
      );
    };
  }, []);

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
              prev.windows
                .filter((w) => !isFeatureWindowId(w.id))
                .map((w) => [w.id, w]),
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
      if (isFeatureWindowId(windowId)) return;

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
      if (isFeatureWindowId(windowInfo.id)) {
        return;
      }

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
    if (isFeatureWindowId(windowId)) return;

    setState((prev) => ({
      ...prev,
      windows: prev.windows.map((w) =>
        w.id === windowId ? { ...w, isPinned: !w.isPinned } : w,
      ),
    }));
  }, []);

  const handleWindowRemove = useCallback(
    (windowId: string) => {
      if (isFeatureWindowId(windowId)) return;

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

  const windowsForPicker = useMemo(() => {
    const baseWindows = state.windows.filter((w) => !isFeatureWindowId(w.id));
    return [captionsFeatureWindow, ...timerFeatureWindows, ...baseWindows];
  }, [state.windows, timerFeatureWindows, captionsFeatureWindow]);

  const windowsForInspector = useMemo(() => {
    const baseWindows = state.windows.filter((w) => !isFeatureWindowId(w.id));
    return [
      captionsFeatureWindow,
      ...timerFeatureWindows,
      ...imageFeatureWindows,
      ...baseWindows,
    ];
  }, [
    state.windows,
    timerFeatureWindows,
    imageFeatureWindows,
    captionsFeatureWindow,
  ]);

  useEffect(() => {
    const validFeatureIds = new Set([
      ...timerFeatureWindows.map((w) => w.id),
      ...imageFeatureWindows.map((w) => w.id),
    ]);
    let changed = false;
    const nextAssignments: Record<number, string[]> = {};

    for (const [displayIdStr, ids] of Object.entries(displayAssignments)) {
      const filtered = ids.filter((id) => {
        if (id.startsWith(TIMER_FEATURE_WINDOW_PREFIX)) {
          return validFeatureIds.has(id);
        }
        if (id.startsWith(IMAGE_FEATURE_WINDOW_PREFIX)) {
          return validFeatureIds.has(id);
        }
        if (id === "feature:timer-window") {
          return false;
        }
        return true;
      });

      if (filtered.length !== ids.length) changed = true;
      if (filtered.length > 0) {
        nextAssignments[Number(displayIdStr)] = filtered;
      }
    }

    if (changed) {
      dispatch(setDisplayAssignments(nextAssignments));
    }
  }, [timerFeatureWindows, imageFeatureWindows, displayAssignments, dispatch]);

  // Memoize selected windows to prevent recalculation
  const selectedWindows = useMemo(
    () => state.windows.filter((w) => w.isSelected && !isFeatureWindowId(w.id)),
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
    <div className="h-screen w-screen overflow-hidden flex flex-col no-scrollbar bg-theme-primary-950 border- border-none border-theme-primary-500">
      <TitleBar
        selectedWindowsCount={selectedWindows.length}
        windowsCount={state.windows.length}
        isLoadingWindows={isLoadingWindows}
        isProjectionOn={isProjectionOn}
        isBlackout={isBlackout}
        isFrozen={isFrozen}
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
        appVersion={appVersion}
        updateStatus={updateStatus}
        updateProgress={updateProgress}
        isCheckingUpdate={isCheckingUpdate}
        isDownloadingUpdate={isDownloadingUpdate}
        updateReady={updateReady}
        updateDownloaded={updateDownloaded}
        updateVersion={updateVersion}
        onCheckForUpdates={handleCheckForUpdates}
        onRestartToUpdate={handleRestartToUpdate}
        onStartDownload={handleStartDownload}
      />

      {/* Main Content Area */}
      <div
        className="relative flex-1 flex overflow-hidden bg-theme-primary-950 "
        style={
          {
            // background: mainSectionBackground,
            // backgroundColor: "rgb(var(--theme-primary-800))",
          }
        }
      >
        {/* Left Panel - Window List */}
        <div
          style={{ width: `${sidebarWidth}px` }}
          className="relative flex flex-col overflow-hidden bg-theme-primary-950 shrink-0 h-full min-h-0 "
          // surfaceClassName="depth-surface-shell"
        >
          <WindowPicker
            windows={windowsForPicker}
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
            onMouseDown={undefined}
            className="hidden absolute right-0 top-0 h-full w-3 cursor-ew-resize z-20 group"
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
        </div>

        {/* Right Panel - Dynamic Content */}
        <div className="flex h-full min-h-0 flex-1 min-w-0 overflow-hidden rounded-tl-none ">
          <InspectorPanel
            windows={windowsForInspector}
            currentLayout={state.currentLayout}
            focusedWindowId={state.focusedWindowId}
            onLayoutChange={handleLayoutChange}
            onWindowSelect={handleWindowSelect}
            onWindowFocus={handleWindowFocus}
            onWindowRemove={handleWindowRemove}
            onWindowAdd={handleWindowAdd}
            activePanel={activePanel}
          />
        </div>
      </div>

      {/* Toast Notifications */}
      <NotifierContainer />

      {/* Global floating captions control */}
      <FloatingCaptionsOrb />
    </div>
  );
};
