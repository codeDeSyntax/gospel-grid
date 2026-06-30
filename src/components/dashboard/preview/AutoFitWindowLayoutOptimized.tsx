import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Cast, Monitor, RefreshCcw, X, MonitorOff } from "lucide-react";
import { type WindowInfo } from "../picker/WindowPicker";
import { getWindowFallbackIcon } from "@/utils/appIconMapping";
import { DepthButton } from "@/shared/DepthButton";
import { DepthSurface } from "@/shared/DepthSurface";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  assignWindowToDisplay,
  hideWindowOnDisplay,
  removeWindowFromDisplay,
  setDisplayAssignments,
  setDisplayHiddenAssignments,
  setWindowThumbnails,
  showWindowOnDisplay,
} from "@/store/slices/gridSlice";
import { publishDisplayLayout } from "@/store/slices/notificationSlice";
import { setProjectionOn } from "@/store/slices/appSlice";
import { TimerProjectionScreen } from "../projection/TimerProjectionScreen";
import {
  getCountdownRemainingMs,
  getTimerFeatureWindowId,
  loadFeatureTimerCollection,
} from "../RightPanel/featureTimerState";
import {
  CAPTIONS_FEATURE_WINDOW_ID,
  FEATURE_CAPTIONS_EVENT,
  loadFeatureCaptionsState,
} from "../RightPanel/featureCaptionsState";
import { FcDeleteRow } from "react-icons/fc";

/**
 * PREVIEW PANEL — one-time snapshot approach (debounced).
 *
 * Shows a static thumbnail of selected windows (max 4) so the user can verify
 * their selection before publishing.  Deliberately does NOT use the live
 * MediaStream/getUserMedia path — that is reserved for the projection window
 * (LiveWindowGrid).  Running two concurrent WGC capture sessions for the same
 * window handle causes ProcessFrame errors on Windows.
 *
 * Optimisations:
 * - Single desktopCapturer.getSources() call per batch (not per-window)
 * - 400 ms React-side debounce so rapid select/deselect doesn't spam IPC
 * - Captures are SKIPPED entirely when the projection is live (no WGC contention)
 * - Stable dependency on window-ID string instead of object reference
 */

interface DisplayInfo {
  id: number;
  label: string;
  isPrimary: boolean;
  internal: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
}

interface AutoFitWindowLayoutProps {
  windows: WindowInfo[];
  focusedWindowId: string | null;
  currentLayout: string;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd?: (window: WindowInfo) => void;
  isProjectionOn?: boolean;
}

const TIMER_FEATURE_WINDOW_PREFIX = "feature:timer-window:";
const IMAGE_FEATURE_WINDOW_PREFIX = "feature:image-window:";

type TimerProjectionPreview = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  theme: "dark" | "light";
};

export const AutoFitWindowLayout: React.FC<AutoFitWindowLayoutProps> = ({
  windows,
  focusedWindowId,
  currentLayout,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  isProjectionOn = false,
}) => {
  const dispatch = useAppDispatch();
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [loadingDisplays, setLoadingDisplays] = useState(false);
  const [publishedDisplayIds, setPublishedDisplayIds] = useState<number[]>([]);
  const [openManageDisplayId, setOpenManageDisplayId] = useState<number | null>(
    null,
  );
  const [captionsText, setCaptionsText] = useState(
    () => loadFeatureCaptionsState().text,
  );
  const thumbnailRequestsInFlightRef = useRef<Set<string>>(new Set());
  const displayAssignments = useAppSelector(
    (state) => state.grid.displayAssignments,
  );
  const displayHiddenAssignments =
    useAppSelector((state) => state.grid.displayHiddenAssignments) ?? {};
  const windowThumbnails =
    useAppSelector((state) => state.grid.windowThumbnails) ?? {};

  const timerPreviewMap = useMemo(() => {
    const collection = loadFeatureTimerCollection();
    const nowMs = Date.now();
    const map: Record<string, TimerProjectionPreview> = {};

    collection.timers.forEach((timer) => {
      const windowId = getTimerFeatureWindowId(timer.id);
      const theme = timer.state.projectionTheme ?? "dark";

      if (timer.state.mode === "countdown") {
        const totalSeconds = Math.max(
          0,
          Math.floor(getCountdownRemainingMs(timer.state, nowMs) / 1000),
        );
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        map[windowId] = {
          days: String(days).padStart(2, "0"),
          hours: String(hours).padStart(2, "0"),
          minutes: String(minutes).padStart(2, "0"),
          seconds: String(seconds).padStart(2, "0"),
          theme,
        };
        return;
      }

      const now = new Date(nowMs);
      map[windowId] = {
        days: "00",
        hours: String(now.getHours()).padStart(2, "0"),
        minutes: String(now.getMinutes()).padStart(2, "0"),
        seconds: String(now.getSeconds()).padStart(2, "0"),
        theme,
      };
    });

    return map;
  }, [windows, displayAssignments]);

  useEffect(() => {
    const syncCaptions = () => {
      setCaptionsText(loadFeatureCaptionsState().text);
    };

    syncCaptions();
    const timer = window.setInterval(syncCaptions, 500);
    window.addEventListener(FEATURE_CAPTIONS_EVENT, syncCaptions);
    window.addEventListener("storage", syncCaptions);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, syncCaptions);
      window.removeEventListener("storage", syncCaptions);
    };
  }, []);

  const loadDisplays = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoadingDisplays(true);
    try {
      const result = await window.electronAPI.getConnectedDisplays();
      if (result.success && result.displays.length > 0) {
        const ordered = [...result.displays].sort((a, b) => {
          if (a.isPrimary && !b.isPrimary) return -1;
          if (!a.isPrimary && b.isPrimary) return 1;
          return a.id - b.id;
        });
        setDisplays(ordered);
      } else {
        setDisplays([]);
      }
    } catch {
      setDisplays([]);
    } finally {
      if (showSpinner) setLoadingDisplays(false);
    }
  }, []);

  useEffect(() => {
    loadDisplays(true);
    const timer = setInterval(() => {
      loadDisplays(false);
    }, 2500);
    return () => clearInterval(timer);
  }, [loadDisplays]);

  const refreshPublicationState = useCallback(async () => {
    try {
      const result = await window.electronAPI.checkPublishedWindows();
      const activeDisplayIds = Array.from(
        new Set(
          (result.publications ?? [])
            .map((publication) => publication.displayId)
            .filter(
              (displayId): displayId is number => typeof displayId === "number",
            ),
        ),
      );
      setPublishedDisplayIds(activeDisplayIds);
      dispatch(setProjectionOn(result.count > 0));
      return activeDisplayIds;
    } catch (error) {
      console.error("Error checking display publication state:", error);
      setPublishedDisplayIds([]);
      dispatch(setProjectionOn(false));
      return [] as number[];
    }
  }, [dispatch]);

  useEffect(() => {
    refreshPublicationState();
    const timer = setInterval(() => {
      refreshPublicationState();
    }, 1500);
    return () => clearInterval(timer);
  }, [refreshPublicationState]);

  const windowMap = useMemo(() => {
    const map = new Map<string, WindowInfo>();
    windows.forEach((w) => map.set(w.id, w));
    return map;
  }, [windows]);

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (openManageDisplayId === null) return;

      const menuRoot = document.querySelector(
        `[data-manage-menu-root="${openManageDisplayId}"]`,
      );

      if (menuRoot && menuRoot.contains(event.target as Node)) {
        return;
      }

      if (!menuRoot) {
        setOpenManageDisplayId(null);
        return;
      }

      setOpenManageDisplayId(null);
    };

    document.addEventListener("mousedown", handleDocumentClick);
    return () => document.removeEventListener("mousedown", handleDocumentClick);
  }, [openManageDisplayId]);

  function makePlaceholderDataUrl(
    win: WindowInfo | undefined,
    width = 320,
    height = 180,
  ): string {
    const title = win?.name ?? "Window";
    const app = win?.app ?? "App";
    const bg = "#111827";
    const fg = "#e5e7eb";
    const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'>
      <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}' />
      <text x='12' y='26' font-family='Segoe UI, Roboto, system-ui, sans-serif' font-size='14' fill='${fg}' font-weight='700'>${escapeXml(
        app,
      )}</text>
      <text x='12' y='48' font-family='Segoe UI, Roboto, system-ui, sans-serif' font-size='12' fill='${fg}' opacity='0.85'>${escapeXml(
        truncate(title, 40),
      )}</text>
    </svg>`;

    try {
      // base64 encode for data URL
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const base64 = btoa(unescape(encodeURIComponent(svg)) as any);
      return `data:image/svg+xml;base64,${base64}`;
    } catch (err) {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }
  }

  function truncate(str: string, len: number) {
    if (!str) return "";
    return str.length > len ? str.slice(0, len - 1) + "…" : str;
  }

  function escapeXml(unsafe: string) {
    return (unsafe || "").replace(/[&<>\"']/g, function (c) {
      switch (c) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&apos;";
        default:
          return c;
      }
    });
  }

  useEffect(() => {
    let cancelled = false;

    const requestMissingThumbnails = async () => {
      const assignedWindowIds = Array.from(
        new Set(Object.values(displayAssignments).flat()),
      );

      const missingIds = assignedWindowIds.filter((windowId) => {
        if (windowId.startsWith(TIMER_FEATURE_WINDOW_PREFIX)) return false;
        if (windowId.startsWith(IMAGE_FEATURE_WINDOW_PREFIX)) return false;
        if (windowId === CAPTIONS_FEATURE_WINDOW_ID) return false;
        if (!windowMap.has(windowId)) return false;
        if (windowThumbnails[windowId]) return false;
        if (thumbnailRequestsInFlightRef.current.has(windowId)) return false;
        return true;
      });

      if (missingIds.length === 0) return;

      // Prefer the batch API for every missing thumbnail. The single-window
      // capture path is kept only as a fallback because it is unreliable in
      // bundled builds.
      missingIds.forEach((id) => thumbnailRequestsInFlightRef.current.add(id));

      try {
        if (
          window.electronAPI &&
          typeof window.electronAPI.batchCaptureThumbnails === "function"
        ) {
          const result = await window.electronAPI.batchCaptureThumbnails(
            missingIds,
            {
              width: 1280,
              height: 720,
              scaleFactor: 1.5,
              quality: 95,
              forceRefresh: true,
            },
          );

          if (result?.success && Array.isArray(result.thumbnails)) {
            const payload: Record<string, string> = {};
            result.thumbnails.forEach((t: any) => {
              if (t && t.windowId && t.dataUrl) {
                payload[t.windowId] = t.dataUrl;
              }
            });

            if (!cancelled && Object.keys(payload).length > 0) {
              dispatch(setWindowThumbnails(payload));
            }
            return;
          }
        }

        await Promise.all(
          missingIds.map(async (windowId) => {
            try {
              const result = await window.electronAPI.getWindowThumbnail(
                windowId,
                {
                  width: 1280,
                  height: 720,
                  scaleFactor: 1.5,
                  quality: 95,
                  forceRefresh: true,
                },
              );
              const dataUrl = result?.thumbnail?.dataUrl ?? result?.thumbnail;
              if (!cancelled && result?.success && dataUrl) {
                dispatch(
                  setWindowThumbnails({
                    [windowId]: dataUrl,
                  }),
                );
              }
            } catch (error) {
              console.error("Failed to load display thumbnail:", error);
            } finally {
              thumbnailRequestsInFlightRef.current.delete(windowId);
            }
          }),
        );
      } catch (error) {
        console.error("Batch thumbnail capture failed:", error);
      } finally {
        missingIds.forEach((id) =>
          thumbnailRequestsInFlightRef.current.delete(id),
        );
      }
    };

    requestMissingThumbnails();
    const retryTimer = window.setInterval(requestMissingThumbnails, 800);

    return () => {
      cancelled = true;
      window.clearInterval(retryTimer);
    };
  }, [displayAssignments, windowMap, windowThumbnails, dispatch]);

  useEffect(() => {
    const next: Record<number, string[]> = {};

    for (const [displayIdStr, hiddenIds] of Object.entries(
      displayHiddenAssignments,
    )) {
      const displayId = Number(displayIdStr);
      const assignedIds = displayAssignments[displayId] ?? [];
      const filtered = hiddenIds.filter(
        (windowId) => assignedIds.includes(windowId) && windowMap.has(windowId),
      );
      if (filtered.length > 0) {
        next[displayId] = filtered;
      }
    }

    const currentKeys = Object.keys(displayHiddenAssignments);
    const nextKeys = Object.keys(next);
    const changed =
      currentKeys.length !== nextKeys.length ||
      currentKeys.some((displayId) => {
        const key = Number(displayId);
        const current = displayHiddenAssignments[key] ?? [];
        const filtered = next[key] ?? [];
        return (
          current.length !== filtered.length ||
          current.some((windowId, index) => windowId !== filtered[index])
        );
      });

    if (changed) {
      dispatch(setDisplayHiddenAssignments(next));
    }
  }, [dispatch, displayAssignments, displayHiddenAssignments, windowMap]);

  useEffect(() => {
    const next: Record<number, string[]> = {};

    for (const [displayIdStr, windowIds] of Object.entries(
      displayAssignments,
    )) {
      const displayId = Number(displayIdStr);
      const filtered = windowIds.filter((id) => windowMap.has(id));
      if (filtered.length > 0) {
        next[displayId] = filtered;
      }
    }

    const currentKeys = Object.keys(displayAssignments);
    const nextKeys = Object.keys(next);
    const changed =
      currentKeys.length !== nextKeys.length ||
      currentKeys.some((displayId) => {
        const key = Number(displayId);
        const current = displayAssignments[key] ?? [];
        const filtered = next[key] ?? [];
        return (
          current.length !== filtered.length ||
          current.some((windowId, index) => windowId !== filtered[index])
        );
      });

    if (changed) {
      dispatch(setDisplayAssignments(next));
    }
  }, [dispatch, displayAssignments, windowMap]);

  const handleDragOverDisplay = (displayId: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeaveDisplay = (_displayId: number) => {};

  const handleDropOnDisplay = (displayId: number, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const dragDataStr = e.dataTransfer.getData("text/plain");
      const dragData = JSON.parse(dragDataStr);

      if (dragData.windowId && dragData.windowInfo) {
        const windowInfo: WindowInfo = JSON.parse(dragData.windowInfo);
        onWindowAdd?.(windowInfo);
        dispatch(assignWindowToDisplay({ displayId, windowId: windowInfo.id }));
      }
    } catch (error) {
      console.error("Error parsing display drop data:", error);
    }
  };

  const handleRemoveFromDisplay = (displayId: number, windowId: string) => {
    const nextAssignments: Record<number, string[]> = {};

    for (const [assignmentDisplayIdStr, windowIds] of Object.entries(
      displayAssignments,
    )) {
      const assignmentDisplayId = Number(assignmentDisplayIdStr);
      const filtered =
        assignmentDisplayId === displayId
          ? windowIds.filter((id) => id !== windowId)
          : windowIds;

      if (filtered.length > 0) {
        nextAssignments[assignmentDisplayId] = filtered;
      }
    }

    dispatch(removeWindowFromDisplay({ displayId, windowId }));

    const stillUsed = Object.values(nextAssignments).some((ids) =>
      ids.includes(windowId),
    );

    if (!stillUsed) {
      onWindowRemove(windowId);
    }
  };

  const handleToggleHiddenOnDisplay = (displayId: number, windowId: string) => {
    const hiddenIds = displayHiddenAssignments[displayId] ?? [];
    if (hiddenIds.includes(windowId)) {
      dispatch(showWindowOnDisplay({ displayId, windowId }));
    } else {
      dispatch(hideWindowOnDisplay({ displayId, windowId }));
    }
  };

  const syncPublishedLayout = useCallback(
    async (
      displayId: number,
      nextAssignments = displayAssignments,
      nextHidden = displayHiddenAssignments,
    ) => {
      if (!publishedDisplayIds.includes(displayId)) return;

      const assignedIds = nextAssignments[displayId] ?? [];
      const hiddenIds = new Set(nextHidden[displayId] ?? []);
      const visibleWindows = assignedIds
        .filter((windowId) => !hiddenIds.has(windowId))
        .map((windowId) => windowMap.get(windowId))
        .filter((window): window is WindowInfo => !!window);

      try {
        await window.electronAPI.updatePublishedLayout({
          displayId,
          windows: visibleWindows,
          layout: currentLayout,
          focusedWindowId,
        });
      } catch (error) {
        console.error("Failed to sync published layout:", error);
      }
    },
    [
      currentLayout,
      displayAssignments,
      displayHiddenAssignments,
      focusedWindowId,
      publishedDisplayIds,
      windowMap,
    ],
  );

  useEffect(() => {
    publishedDisplayIds.forEach((displayId) => {
      void syncPublishedLayout(displayId);
    });
  }, [
    displayAssignments,
    displayHiddenAssignments,
    publishedDisplayIds,
    syncPublishedLayout,
  ]);

  const handleToggleDisplayProjection = async (displayId: number) => {
    const isActive = publishedDisplayIds.includes(displayId);

    if (isActive) {
      try {
        await window.electronAPI.closePublishedWindows(displayId);
        await refreshPublicationState();
      } catch (error) {
        console.error("Error closing display projection:", error);
      }
      return;
    }

    const assignedIds = displayAssignments[displayId] ?? [];
    const assignedWindows = assignedIds
      .map((windowId) => windowMap.get(windowId))
      .filter((window): window is WindowInfo => !!window);

    await dispatch(
      publishDisplayLayout({
        selectedWindows: assignedWindows,
        currentLayout,
        focusedWindowId,
        displayId,
      }),
    );

    await refreshPublicationState();
  };

  const getVisibleAssignedIds = (displayId: number) => {
    const assignedIds = displayAssignments[displayId] ?? [];
    const hiddenIds = new Set(displayHiddenAssignments[displayId] ?? []);
    return assignedIds.filter((windowId) => !hiddenIds.has(windowId));
  };

  const getGridClasses = (count: number) => {
    if (count <= 1) return "grid-cols-1";
    if (count === 2) return "grid-cols-2";
    if (count <= 4) return "grid-cols-2 grid-rows-2";
    if (count <= 6) return "grid-cols-3 grid-rows-2";
    return "grid-cols-3 grid-rows-3";
  };

  const getCellClasses = (count: number, index: number) => {
    return "";
  };

  const getWindowTileClasses = (assignedCount: number, isFocused: boolean) => {
    const base =
      "group relative min-w-0 max-h-full overflow-hidden rounded-xl transition-all duration-200 flex items-center justify-center bg-black border-0 aspect-[16/9] w-full h-auto";

    if (assignedCount === 1) {
      return `${base} ${isFocused ? "ring-2 ring-theme-primary-300/70" : "hover:ring-1 hover:ring-theme-primary-400/40"}`;
    }

    if (assignedCount === 2) {
      return `${base} ${isFocused ? "ring-2 ring-theme-primary-300/70" : "hover:ring-1 hover:ring-theme-primary-400/40"}`;
    }

    return `${base} ${isFocused ? "ring-2 ring-theme-primary-300/70" : "hover:ring-1 hover:ring-theme-primary-400/40"}`;
  };

  return (
    <div className="w-full h-full min-h-0 rounded-lg overflow-hidden flex flex-col ">
      <div className="shrink-0 px-3 py-2 flex items-center justify-between">
        <div>
          <p className="text-[13px] font-semibold text-theme-primary-100">
            Unified Display Workspace
          </p>
          <p className="text-[10px] text-theme-primary-300/65">
            Drag windows from the left list into detected screens.
          </p>
        </div>

        <button
          onClick={() => loadDisplays(true)}
          className="h-8 px-2.5 rounded-xl border border-theme-primary-500/25 bg-theme-primary-500/10 text-theme-primary-200/90 hover:bg-theme-primary-500/20 transition-colors"
          title="Refresh connected displays"
        >
          <span className="inline-flex items-center gap-1.5 text-[11px]">
            <RefreshCcw className="w-3.5 h-3.5" />
            Refresh
          </span>
        </button>
      </div>

      {loadingDisplays ? (
        <div className="flex-1 flex items-center justify-center text-theme-primary-200/50 text-sm">
          Detecting connected displays...
        </div>
      ) : displays.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-theme-primary-200/45 gap-2">
          <Monitor className="w-9 h-9 opacity-60" />
          <p className="text-sm">No displays detected</p>
          <p className="text-xs opacity-70">
            Connect a monitor (or SpaceDesk), then click Refresh.
          </p>
        </div>
      ) : (
        <div
          className={`flex-1 min-h-0 p-3 grid gap-3 ${getGridClasses(displays.length)} auto-rows-fr content-stretch items-stretch overflow-hidden`}
        >
          {displays.map((display, index) => {
            const assignedIds = displayAssignments[display.id] ?? [];
            const isPublished = publishedDisplayIds.includes(display.id);
            return (
              <div
                key={display.id}
                onDragOver={(e) => handleDragOverDisplay(display.id, e)}
                onDragLeave={() => handleDragLeaveDisplay(display.id)}
                onDrop={(e) => handleDropOnDisplay(display.id, e)}
                className={`relative w-full max-w-full h-auto max-h-full aspect-[16/9] place-self-start rounded-xl ring-dashed ring-4 ring-theme-primary-700 overflow-hidden transition-all duration-200 ${getCellClasses(displays.length, index)} bg-black`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_45%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.34))] pointer-events-none" />

                <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-1 pointer-events-none">
                  <DepthButton
                    sizeClassName="h-4 px-2 p-1 rounded-xl shrink-0 pointer-events-auto"
                    inactiveClassName="text-theme-primary-50 border-theme-primary-400/50"
                    inactiveSurfaceClassName="bg-gradient-to-br from-theme-primary-800/60 via-theme-primary-700 to-theme-primary-800/60"
                  >
                    <span className="text-[10px] font-semibold text-theme-primary-50 truncate leading-tight traking-wide uppercase">
                      {display.isPrimary
                        ? "My PC"
                        : display.label || `Display ${index + 1}`}
                    </span>
                  </DepthButton>
                  <DepthButton
                    onClick={() => handleToggleDisplayProjection(display.id)}
                    disabled={
                      !isPublished &&
                      getVisibleAssignedIds(display.id).length === 0
                    }
                    sizeClassName="h-6 px-2 py-1 rounded-xl shrink-0 pointer-events-auto"
                    title={
                      isPublished
                        ? "Close this display projection"
                        : "Project this display"
                    }
                    active={isPublished}
                    activeClassName="text-red-50 border-red-300/80"
                    activeSurfaceClassName="bg-gradient-to-br from-red-600/90 via-red-700/95 to-red-800/90"
                    inactiveClassName="text-theme-primary-50 border-theme-primary-400/50"
                    inactiveSurfaceClassName="bg-gradient-to-br from-theme-primary-800/60 via-theme-primary-700 to-theme-primary-800/60"
                  >
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
                      {isPublished ? (
                        <MonitorOff className="w-3.5 h-3.5" />
                      ) : (
                        <Cast className="w-3.5 h-3.5" />
                      )}
                      {isPublished ? "Close" : "Project"}
                    </span>
                  </DepthButton>
                  <div
                    className="relative pointer-events-auto"
                    data-manage-menu-root={
                      openManageDisplayId === display.id
                        ? display.id
                        : undefined
                    }
                  >
                    <DepthButton
                      onClick={() =>
                        setOpenManageDisplayId((current) =>
                          current === display.id ? null : display.id,
                        )
                      }
                      sizeClassName="h-6 px-2 py-1 rounded-xl shrink-0"
                      inactiveClassName="text-theme-primary-50 border-theme-primary-400/50"
                      inactiveSurfaceClassName="bg-gradient-to-br from-theme-primary-800/60 via-theme-primary-700 to-theme-primary-800/60"
                    >
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase">
                        Manage
                      </span>
                    </DepthButton>

                    {openManageDisplayId === display.id && (
                      <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-2xl border border-theme-primary-400/20 bg-theme-primary-950/95 shadow-[0_16px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                        <div className="border-b border-theme-primary-500/15 px-3 py-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-theme-primary-100">
                            Manage Screen
                          </p>
                          <p className="text-[10px] text-theme-primary-300/70">
                            Hide windows from the published layout or remove
                            them from this screen.
                          </p>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {assignedIds.length === 0 ? (
                            <div className="px-3 py-4 text-xs text-theme-primary-300/70">
                              No windows assigned to this display yet.
                            </div>
                          ) : (
                            assignedIds.map((windowId) => {
                              const win = windowMap.get(windowId);
                              if (!win) return null;
                              const isHidden = (
                                displayHiddenAssignments[display.id] ?? []
                              ).includes(windowId);
                              return (
                                <div
                                  key={`manage-${display.id}-${windowId}`}
                                  className="flex items-center gap-2 border-b border-theme-primary-500/10 px-3 py-2 last:border-b-0"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-[11px] font-semibold text-theme-primary-50">
                                      {win.name}
                                    </p>
                                    <p className="truncate text-[10px] text-theme-primary-300/65">
                                      {win.app}
                                      {isHidden ? " • Hidden" : ""}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => {
                                      handleToggleHiddenOnDisplay(
                                        display.id,
                                        windowId,
                                      );
                                    }}
                                    className="rounded-lg border border-theme-primary-400/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-theme-primary-50 hover:bg-theme-primary-500/15"
                                  >
                                    {isHidden ? "Show" : "Hide"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleRemoveFromDisplay(
                                        display.id,
                                        windowId,
                                      );
                                    }}
                                    className="rounded-lg border border-red-400/25 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-200 hover:bg-red-500/15"
                                  >
                                    Remove
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {assignedIds.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
                    <div className="w-full max-w-[300px] rounded-2xl border border-theme-primary-500/25 bg-theme-primary-900/45 p-4 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <div className="flex items-center gap-3 text-left">
                        <img
                          src="./smart-tv.png"
                          alt="Drag from left panel"
                          className="h-14 w-14 shrink-0 object-contain opacity-95"
                          draggable={false}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold tracking-wide uppercase text-theme-primary-100/90">
                            Waiting For Window Drop
                          </p>
                          <p className="mt-1 text-[10px] text-theme-primary-300/70 leading-relaxed">
                            Drag a window card from the left panel and drop it
                            here.
                          </p>
                          <div className="mt-2 h-px w-full bg-gradient-to-r from-transparent via-theme-primary-500/35 to-transparent" />
                          <p className="mt-2 text-[9px] text-theme-primary-300/55">
                            You can drop multiple windows per display.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`absolute inset-0 p-3 grid gap-2 ${getGridClasses(assignedIds.length)} auto-rows-fr content-stretch items-stretch overflow-hidden`}
                  >
                    {assignedIds.map((windowId) => {
                      const win = windowMap.get(windowId);
                      if (!win) return null;
                      const isTimerFeature = windowId.startsWith(
                        TIMER_FEATURE_WINDOW_PREFIX,
                      );
                      const isCaptionsFeature =
                        windowId === CAPTIONS_FEATURE_WINDOW_ID;
                      const thumbnail =
                        windowThumbnails[windowId] || win.thumbnail || null;
                      const isHidden = (
                        displayHiddenAssignments[display.id] ?? []
                      ).includes(windowId);

                      const timerPreview = timerPreviewMap[windowId] ?? {
                        days: "00",
                        hours: "00",
                        minutes: "00",
                        seconds: "00",
                        theme: "dark" as const,
                      };

                      return (
                        <button
                          key={`${display.id}-${windowId}`}
                          onClick={() => onWindowFocus(windowId)}
                          className={getWindowTileClasses(
                            assignedIds.length,
                            focusedWindowId === windowId,
                          )}
                          title={`${win.app} • ${win.name}`}
                        >
                          {isHidden && (
                            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/55 backdrop-blur-md">
                              <div className="rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-primary-100">
                                Hidden
                              </div>
                            </div>
                          )}
                          {isCaptionsFeature ? (
                            <div className="absolute inset-0 z-0 flex items-center justify-center px-4 text-center bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_45%)]">
                              <div className="max-w-[90%]">
                                <p className="text-[9px] uppercase tracking-[0.16em] text-theme-primary-300/80 mb-2">
                                  Live Captions
                                </p>
                                <p className="text-sm leading-snug text-theme-primary-50 break-words">
                                  {captionsText || "Waiting for speech..."}
                                </p>
                              </div>
                            </div>
                          ) : isTimerFeature ? (
                            <div className="absolute inset-0 z-0">
                              <TimerProjectionScreen
                                days={timerPreview.days}
                                hours={timerPreview.hours}
                                minutes={timerPreview.minutes}
                                seconds={timerPreview.seconds}
                                theme={timerPreview.theme}
                                compact
                              />
                            </div>
                          ) : thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={`${win.app} thumbnail`}
                              className="absolute inset-0 h-full w-full object-contain bg-black z-0"
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black/95 via-black/85 to-black/70 z-0">
                              <div className="flex flex-col items-center gap-2 text-center px-2">
                                <div className="rounded-full bg-black/55 p-2 border border-white/10 theme-text-on-overlay">
                                  {getWindowFallbackIcon(win, 18)}
                                </div>
                                <span className="text-[10px] theme-text-on-overlay truncate max-w-[92%] opacity-80">
                                  {win.name}
                                </span>
                              </div>
                            </div>
                          )}

                          {!isTimerFeature && !isCaptionsFeature && (
                            <div
                              className={`absolute inset-0 pointer-events-none z-[1] ${isHidden ? "bg-black/65" : "bg-gradient-to-t from-black/55 via-black/12 to-transparent"}`}
                            />
                          )}

                          {!isTimerFeature && !isCaptionsFeature && (
                            <div className="absolute top-1.5 left-1.5 z-20 max-w-[82%] rounded bg-black/70 px-1.5 py-0.5 backdrop-blur-sm">
                              <span className="block text-[8px] leading-none theme-text-on-overlay truncate max-w-full">
                                {win.name}
                              </span>
                            </div>
                          )}

                          {!isTimerFeature && !isCaptionsFeature && (
                            <div className="absolute bottom-1.5 right-1.5 z-20 rounded-full border border-white/12 bg-black/70 p-1.5 backdrop-blur-md shadow-[0_6px_14px_rgba(0,0,0,0.28)]">
                              {win.icon ? (
                                <>
                                  <img
                                    src={win.icon}
                                    alt={`${win.app} icon`}
                                    className="w-10 h-10 object-contain opacity-95"
                                    draggable={false}
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const fallback = e.currentTarget
                                        .nextElementSibling as HTMLElement;
                                      if (fallback)
                                        fallback.style.display = "flex";
                                    }}
                                  />
                                  <span
                                    className="theme-text-on-overlay"
                                    style={{ display: "none" }}
                                  >
                                    {getWindowFallbackIcon(win, 14)}
                                  </span>
                                </>
                              ) : (
                                <span className="theme-text-on-overlay">
                                  {getWindowFallbackIcon(win, 14)}
                                </span>
                              )}
                            </div>
                          )}

                          <DepthButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromDisplay(display.id, windowId);
                            }}
                            className="absolute bottom-1.5 left-10 w-8 h-8 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20"
                            title="Remove window"
                          >
                            <FcDeleteRow className="w-6 h-6" />
                          </DepthButton>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isProjectionOn && (
        <div className="px-3 py-1.5 border-t border-theme-primary-600/20 bg-theme-primary-900/25 text-[10px] text-theme-primary-200/70">
          Projection is live. Routing edits are reflected in this workspace
          setup.
        </div>
      )}
    </div>
  );
};
