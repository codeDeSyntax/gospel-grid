import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Monitor, Link2, Sparkles, Copy, RefreshCcw } from "lucide-react";
import { type WindowInfo } from "../../WindowList";

interface DisplayInfo {
  id: number;
  label: string;
  isPrimary: boolean;
  internal: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  rotation: number;
}

interface DisplayRoutingPanelProps {
  selectedWindows: WindowInfo[];
}

export const DisplayRoutingPanel: React.FC<DisplayRoutingPanelProps> = ({
  selectedWindows,
}) => {
  const [displays, setDisplays] = useState<DisplayInfo[]>([]);
  const [loadingDisplays, setLoadingDisplays] = useState(false);
  const [assignments, setAssignments] = useState<Record<number, string[]>>({});

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

    // SpaceDesk / virtual monitors may appear after initial mount.
    // Polling keeps the panel accurate without requiring app restart.
    const timer = setInterval(() => {
      loadDisplays(false);
    }, 2500);

    return () => {
      clearInterval(timer);
    };
  }, [loadDisplays]);

  const selectedMap = useMemo(() => {
    const map = new Map<string, WindowInfo>();
    selectedWindows.forEach((w) => map.set(w.id, w));
    return map;
  }, [selectedWindows]);

  // Keep assignments valid when selection changes
  useEffect(() => {
    setAssignments((prev) => {
      const next: Record<number, string[]> = {};
      for (const [displayIdStr, windowIds] of Object.entries(prev)) {
        const displayId = Number(displayIdStr);
        const filtered = windowIds.filter((id) => selectedMap.has(id));
        if (filtered.length > 0) next[displayId] = filtered;
      }
      return next;
    });
  }, [selectedMap]);

  const addWindowToDisplay = (displayId: number, windowId: string) => {
    setAssignments((prev) => {
      const current = prev[displayId] ?? [];
      if (current.includes(windowId)) return prev;
      return { ...prev, [displayId]: [...current, windowId] };
    });
  };

  const removeWindowFromDisplay = (displayId: number, windowId: string) => {
    setAssignments((prev) => {
      const current = prev[displayId] ?? [];
      const next = current.filter((id) => id !== windowId);
      if (next.length === 0) {
        const copy = { ...prev };
        delete copy[displayId];
        return copy;
      }
      return { ...prev, [displayId]: next };
    });
  };

  const duplicateFromFirstDisplay = (targetDisplayId: number) => {
    if (displays.length === 0) return;
    const sourceDisplayId = displays[0].id;
    const sourceIds = assignments[sourceDisplayId] ?? [];
    if (sourceIds.length === 0) return;
    setAssignments((prev) => ({ ...prev, [targetDisplayId]: [...sourceIds] }));
  };

  const assignedCount = Object.values(assignments).reduce(
    (acc, ids) => acc + ids.length,
    0,
  );

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar text-white">
      <div className="px-5 pt-5 pb-8 max-w-4xl">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Display Routing
            </h2>
            <p className="text-[12px] text-white/40 mt-1">
              Assign selected windows to each detected screen. One window can be
              routed to multiple displays.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => loadDisplays(true)}
              className="h-8 px-2.5 rounded-xl border border-theme-primary-500/20 bg-theme-primary-500/10 text-theme-primary-200/90 hover:bg-theme-primary-500/20 transition-colors"
              title="Refresh connected displays"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px]">
                <RefreshCcw className="w-3.5 h-3.5" />
                Refresh
              </span>
            </button>

            <div className="rounded-xl border border-theme-primary-500/20 bg-theme-primary-500/10 px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-[0.12em] text-theme-primary-200/80">
                Routes
              </p>
              <p className="text-sm font-semibold text-theme-primary-200">
                {assignedCount}
              </p>
            </div>
          </div>
        </div>

        {selectedWindows.length === 0 && (
          <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 text-[12px] text-amber-200/70">
            Select windows from the left list first, then map them to displays.
          </div>
        )}

        {loadingDisplays ? (
          <div className="h-[240px] rounded-2xl border border-white/[0.08] bg-white/[0.02] flex items-center justify-center text-white/35 text-sm">
            Detecting displays...
          </div>
        ) : displays.length === 0 ? (
          <div className="h-[240px] rounded-2xl border border-white/[0.08] bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-center px-6">
            <Monitor className="w-8 h-8 text-white/30" />
            <p className="text-sm text-white/45">No displays detected.</p>
            <p className="text-[12px] text-white/30">
              Reconnect your monitor(s) and reopen this panel.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {displays.map((display, index) => {
              const assignedIds = assignments[display.id] ?? [];
              return (
                <div
                  key={display.id}
                  className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-theme-primary-700/10 via-theme-primary-800/10 to-theme-primary-900/5 p-3.5 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-theme-primary-500/15 border border-theme-primary-400/30 flex items-center justify-center shrink-0">
                        <Monitor className="w-4 h-4 text-theme-primary-200" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">
                          {display.label || `Display ${index + 1}`}
                        </p>
                        <p className="text-[10px] text-white/35 truncate">
                          {display.bounds.width}x{display.bounds.height} • (
                          {display.bounds.x}, {display.bounds.y})
                          {display.isPrimary ? " • Primary" : ""}
                          {display.internal ? " • Internal" : " • External"}
                        </p>
                      </div>
                    </div>

                    {index > 0 && (
                      <button
                        onClick={() => duplicateFromFirstDisplay(display.id)}
                        className="text-[10px] px-2 py-1 rounded-lg border border-theme-primary-400/25 bg-theme-primary-500/10 text-theme-primary-200/90 hover:bg-theme-primary-500/20 transition-colors"
                        title="Copy all assignments from the first display"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          Clone #1
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[11px] text-white/35">
                      Add window
                    </label>
                    <select
                      value=""
                      disabled={selectedWindows.length === 0}
                      onChange={(e) => {
                        if (e.target.value)
                          addWindowToDisplay(display.id, e.target.value);
                      }}
                      className="w-full rounded-xl border border-theme-primary-500/20 bg-theme-primary-900/40 px-3 py-2 text-[12px] text-white outline-none focus:border-theme-primary-300/50 disabled:opacity-40"
                    >
                      <option value="">Select a source window...</option>
                      {selectedWindows.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.app} — {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3 min-h-[80px] rounded-xl border border-white/[0.06] bg-black/15 p-2">
                    {assignedIds.length === 0 ? (
                      <p className="text-[11px] text-white/30 px-1 py-1.5">
                        No windows assigned to this display yet.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedIds.map((windowId) => {
                          const w = selectedMap.get(windowId);
                          if (!w) return null;
                          return (
                            <button
                              key={windowId}
                              onClick={() =>
                                removeWindowFromDisplay(display.id, windowId)
                              }
                              className="group inline-flex items-center gap-1.5 max-w-full rounded-lg border border-theme-primary-300/35 bg-theme-primary-500/15 px-2 py-1 text-[11px] text-theme-primary-100 hover:bg-red-500/15 hover:border-red-400/35 hover:text-red-200 transition-colors"
                              title="Remove from this display"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {w.app}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/[0.06] px-3.5 py-2.5 text-[11px] text-emerald-200/75 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>
            This is phase-1 setup UI. Next step is wiring these routes into
            multi-display publish so each screen opens with its own assigned
            window set.
          </p>
        </div>
      </div>
    </div>
  );
};
