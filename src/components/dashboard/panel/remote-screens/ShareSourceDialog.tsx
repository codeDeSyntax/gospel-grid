import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Monitor, RefreshCw, ScreenShare, Square, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type {
  DesktopCaptureSource,
  RemoteScreenViewRequest,
} from "@/types/electron";

type SourceTab = "screen" | "window";

const isScreenSource = (source: DesktopCaptureSource) =>
  source.id.startsWith("screen:");

const sourceTypeLabel = (source: DesktopCaptureSource) =>
  isScreenSource(source) ? "Screen" : "Window";

export const ShareSourceDialog: React.FC<{
  request: RemoteScreenViewRequest | null;
  onCancel: (requestId: string) => void;
  onShare: (
    request: RemoteScreenViewRequest,
    source: DesktopCaptureSource,
  ) => void;
}> = ({ request, onCancel, onShare }) => {
  const [sources, setSources] = useState<DesktopCaptureSource[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SourceTab>("screen");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSources = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextSources = await window.electronAPI.getDesktopSources({
        types: ["screen", "window"],
        thumbnailSize: { width: 360, height: 220 },
        fetchWindowIcons: true,
      });
      setSources(nextSources);

      const preferred =
        nextSources.find((source) => source.id === selectedSourceId) ??
        nextSources.find((source) => isScreenSource(source)) ??
        nextSources[0] ??
        null;
      setSelectedSourceId(preferred?.id ?? null);
      setActiveTab(preferred && !isScreenSource(preferred) ? "window" : "screen");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load the screens and windows you can share.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!request) {
      setSources([]);
      setSelectedSourceId(null);
      setError(null);
      return;
    }

    void loadSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.request.id]);

  const visibleSources = useMemo(
    () =>
      sources.filter((source) =>
        activeTab === "screen" ? isScreenSource(source) : !isScreenSource(source),
      ),
    [activeTab, sources],
  );
  const selectedSource =
    sources.find((source) => source.id === selectedSourceId) ?? null;

  return (
    <AnimatePresence>
      {request ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            className="absolute inset-0 bg-theme-primary-950/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onCancel(request.request.id)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-source-dialog-title"
            className="relative flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-solid border-theme-primary-700 bg-theme-primary-900 shadow-2xl shadow-black/35"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-solid border-theme-primary-700 bg-theme-primary-800 px-5 py-4">
              <div className="min-w-0">
                <p
                  id="share-source-dialog-title"
                  className="text-base font-semibold text-theme-primary-50"
                >
                  Choose what to share
                </p>
                <p className="mt-1 text-xs leading-relaxed text-theme-primary-300">
                  {request.fromDevice?.name || "A remote Wingrid device"} will
                  only see what you choose here.
                </p>
              </div>
              <DepthButton
                onClick={() => onCancel(request.request.id)}
                title="Cancel sharing"
                sizeClassName="h-8 w-8 rounded-lg"
                inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
              >
                <X className="h-3.5 w-3.5" />
              </DepthButton>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-solid border-theme-primary-700 bg-theme-primary-900 px-5 py-3">
              <div className="grid w-full max-w-xs grid-cols-2 gap-1 rounded-lg bg-theme-primary-950 p-1">
                {(["screen", "window"] as SourceTab[]).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex h-9 items-center justify-center gap-2 rounded-md px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                      activeTab === tab
                        ? "bg-theme-primary-700 text-theme-primary-50"
                        : "text-theme-primary-300 hover:bg-theme-primary-800 hover:text-theme-primary-100"
                    }`}
                  >
                    {tab === "screen" ? (
                      <Monitor className="h-3.5 w-3.5" />
                    ) : (
                      <Square className="h-3.5 w-3.5" />
                    )}
                    {tab === "screen" ? "Screens" : "Windows"}
                  </button>
                ))}
              </div>
              <DepthButton
                onClick={() => void loadSources()}
                disabled={isLoading}
                title="Refresh screens and windows"
                sizeClassName="h-9 px-3 rounded-lg"
                inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
              >
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </span>
              </DepthButton>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-5">
              {error ? (
                <div className="rounded-lg border border-solid border-red-300/25 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                  {error}
                </div>
              ) : null}

              {isLoading ? (
                <div className="flex min-h-[240px] items-center justify-center text-sm text-theme-primary-200">
                  Loading screens and windows...
                </div>
              ) : visibleSources.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleSources.map((source) => {
                    const selected = selectedSourceId === source.id;
                    return (
                      <button
                        key={source.id}
                        type="button"
                        onClick={() => setSelectedSourceId(source.id)}
                        className={`group overflow-hidden rounded-lg border border-solid text-left transition-colors ${
                          selected
                            ? "border-emerald-300/70 bg-theme-primary-800"
                            : "border-theme-primary-700 bg-theme-primary-950 hover:border-theme-primary-500 hover:bg-theme-primary-800"
                        }`}
                      >
                        <div className="aspect-video bg-black">
                          {source.thumbnail ? (
                            <img
                              src={source.thumbnail}
                              alt={source.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-theme-primary-300">
                              {isScreenSource(source) ? (
                                <Monitor className="h-8 w-8" />
                              ) : (
                                <Square className="h-8 w-8" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex min-h-[68px] items-center justify-between gap-3 px-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-theme-primary-50">
                              {source.name}
                            </p>
                            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-theme-primary-300">
                              {sourceTypeLabel(source)}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border border-solid px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                              selected
                                ? "border-emerald-300/60 bg-emerald-500 text-emerald-50"
                                : "border-theme-primary-600 bg-theme-primary-800 text-theme-primary-200"
                            }`}
                          >
                            {selected ? "Selected" : "Pick"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-solid border-theme-primary-600 bg-theme-primary-800 text-theme-primary-100">
                    <ScreenShare className="h-5 w-5" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-theme-primary-50">
                    No {activeTab === "screen" ? "screens" : "windows"} found
                  </p>
                  <p className="mt-2 max-w-sm text-xs leading-relaxed text-theme-primary-300">
                    Refresh the list or make sure the window you want to share is
                    open and visible.
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-solid border-theme-primary-700 bg-theme-primary-800 px-5 py-4">
              <p className="min-w-0 truncate text-xs text-theme-primary-300">
                {selectedSource
                  ? `Selected: ${selectedSource.name}`
                  : "Choose a screen or window to begin sharing."}
              </p>
              <div className="flex items-center gap-2">
                <DepthButton
                  onClick={() => onCancel(request.request.id)}
                  sizeClassName="h-9 px-4 rounded-lg"
                  inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide">
                    Cancel
                  </span>
                </DepthButton>
                <DepthButton
                  onClick={() =>
                    selectedSource ? onShare(request, selectedSource) : undefined
                  }
                  disabled={!selectedSource}
                  sizeClassName="h-9 px-4 rounded-lg"
                  active
                  activeClassName="text-emerald-50 border-solid border-emerald-300/60"
                >
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
                    <ScreenShare className="h-3.5 w-3.5" />
                    Share
                  </span>
                </DepthButton>
              </div>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
