import React from "react";
import {
  Cast,
  MonitorOff,
  EyeOff,
  Eye,
  Pause,
  Play,
  CheckCircle2,
  Download,
  RefreshCw,
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  Settings,
  MoreHorizontal,
  PanelLeft,
} from "lucide-react";
import { useWindowControls } from "../hooks/useWindowControls";

type TitlePanel = "layout" | "settings" | "overlay";

interface TitleBarProps {
  selectedWindowsCount: number;
  windowsCount: number;
  isLoadingWindows: boolean;
  isProjectionOn: boolean;
  isBlackout: boolean;
  isFrozen: boolean;
  activePanel: TitlePanel;
  canUndo: boolean;
  canRedo: boolean;
  onHomeClick?: () => void;
  onPublishLayout: () => void;
  onCloseProjection: () => void;
  onToggleBlackout: () => void;
  onToggleFrozen: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePanel: (panel: TitlePanel) => void;
  onClearAll: () => void;
  appVersion: string;
  updateStatus: string;
  updateProgress: number;
  isCheckingUpdate: boolean;
  isDownloadingUpdate: boolean;
  updateReady: boolean;
  updateDownloaded: boolean;
  updateVersion: string | null;
  onCheckForUpdates: () => void;
  onRestartToUpdate: () => void;
  onStartDownload: () => void;
}

interface ActionButtonItem {
  kind: "button";
  key: string;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title: string;
  label: string;
  shortcut?: string;
  activeClassName?: string;
  inactiveClassName?: string;
}

interface DividerItem {
  kind: "divider";
  key: string;
}

interface WindowControlItem {
  key: string;
  title: string;
  onClick: () => void;
  className?: string;
  icon: React.ReactNode;
}

const toolbarButtonBase =
  "inline-flex h-8 w-8 items-center justify-center border-0 bg-transparent p-0 transition-colors duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-45";

const windowButtonBase =
  "inline-flex h-8 w-11 items-center justify-center border-0 bg-transparent p-0 text-theme-primary-100 transition-colors duration-150 outline-none";

export const TitleBar: React.FC<TitleBarProps> = ({
  selectedWindowsCount,
  windowsCount,
  isLoadingWindows,
  isProjectionOn,
  isBlackout,
  isFrozen,
  activePanel,
  canUndo,
  canRedo,
  onHomeClick,
  onPublishLayout,
  onCloseProjection,
  onToggleBlackout,
  onToggleFrozen,
  onUndo,
  onRedo,
  onTogglePanel,
  onClearAll,
  appVersion,
  updateStatus,
  updateProgress,
  isCheckingUpdate,
  isDownloadingUpdate,
  updateReady,
  updateDownloaded,
  updateVersion,
  onCheckForUpdates,
  onRestartToUpdate,
  onStartDownload,
}) => {
  const { isMaximized, minimize, maximize, close } = useWindowControls();
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const actionMenuRef = React.useRef<HTMLDivElement>(null);
  const hasSelections = selectedWindowsCount > 0;
  const titlebarBackground =
    "radial-gradient(ellipse at 30% 50%, color-mix(in srgb, var(--select-border) 36%, transparent) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, color-mix(in srgb, var(--select-border) 32%, transparent) 0%, transparent 50%), repeating-linear-gradient(90deg, transparent, transparent 80px, color-mix(in srgb, var(--select-border) 18%, transparent) 80px, color-mix(in srgb, var(--select-border) 18%, transparent) 81px), repeating-linear-gradient(0deg, transparent, transparent 80px, color-mix(in srgb, var(--select-border) 16%, transparent) 80px, color-mix(in srgb, var(--select-border) 16%, transparent) 81px), linear-gradient(135deg, var(--card-bg) 0%, var(--card-bg-alt) 100%)";

  const actionItems: Array<ActionButtonItem | DividerItem> = [
    {
      kind: "button",
      key: "projection-toggle",
      icon: isProjectionOn ? (
        <MonitorOff className="w-3.5 h-3.5" strokeWidth={3} />
      ) : (
        <Cast className="w-3.5 h-3.5" strokeWidth={3} />
      ),
      onClick: () => {
        if (isProjectionOn) {
          onCloseProjection();
        } else if (hasSelections) {
          onPublishLayout();
        }
      },
      disabled: !isProjectionOn && !hasSelections,
      active: isProjectionOn,
      label: isProjectionOn ? "Close projection" : "Project layout",
      shortcut: "F5",
      title: isProjectionOn
        ? "Close all projections (F5)"
        : hasSelections
          ? "Project for all (F5)"
          : "Select windows first",
      activeClassName: "text-red-100 border-red-300/60",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    { kind: "divider", key: "divider-1" },
    {
      kind: "button",
      key: "blackout",
      icon: isBlackout ? (
        <Eye className="w-3.5 h-3.5" strokeWidth={3} />
      ) : (
        <EyeOff className="w-3.5 h-3.5" strokeWidth={3} />
      ),
      onClick: onToggleBlackout,
      disabled: !isProjectionOn,
      active: isBlackout,
      label: isBlackout ? "End blackout" : "Blackout projection",
      shortcut: "F6",
      title: isBlackout ? "End blackout (F6)" : "Blackout projection (F6)",
      activeClassName: "text-yellow-100 border-yellow-300/60",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    {
      kind: "button",
      key: "freeze",
      icon: isFrozen ? (
        <Play className="w-3.5 h-3.5" strokeWidth={3} />
      ) : (
        <Pause className="w-3.5 h-3.5" strokeWidth={3} />
      ),
      onClick: onToggleFrozen,
      disabled: !isProjectionOn,
      active: isFrozen,
      label: isFrozen ? "Unfreeze projection" : "Freeze projection",
      shortcut: "F7",
      title: isFrozen ? "Unfreeze projection (F7)" : "Freeze projection (F7)",
      activeClassName: "text-cyan-100 border-cyan-300/60",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    { kind: "divider", key: "divider-2" },
    {
      kind: "button",
      key: "undo",
      icon: <Undo2 className="w-3.5 h-3.5" strokeWidth={3} />,
      onClick: onUndo,
      disabled: !canUndo,
      label: "Undo selection",
      shortcut: "Ctrl+Z",
      title: "Undo selection (Ctrl+Z)",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    {
      kind: "button",
      key: "redo",
      icon: <Redo2 className="w-3.5 h-3.5" strokeWidth={3} />,
      onClick: onRedo,
      disabled: !canRedo,
      label: "Redo selection",
      shortcut: "Ctrl+Y",
      title: "Redo selection (Ctrl+Y)",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    { kind: "divider", key: "divider-3" },
    {
      kind: "button",
      key: "clear",
      icon: <Trash2 className="w-3.5 h-3.5" strokeWidth={3} />,
      onClick: onClearAll,
      label: "Clear selected windows",
      shortcut: "F8",
      title: "Clear all selected windows (F8)",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-red-200 hover:border-red-300/60",
    },
    {
      kind: "button",
      key: "settings",
      icon: (
        <Settings
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            activePanel === "settings" ? "rotate-90" : ""
          }`}
        />
      ),
      onClick: () => onTogglePanel("settings"),
      active: activePanel === "settings",
      label: "Settings",
      title: "Settings",
      activeClassName: "text-theme-primary-50 border-theme-primary-300/65",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
  ];

  React.useEffect(() => {
    if (!isActionMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target as Node)
      ) {
        setIsActionMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsActionMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActionMenuOpen]);

  const runMenuAction = (item: ActionButtonItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsActionMenuOpen(false);
  };

  const windowControlItems: WindowControlItem[] = [
    {
      key: "minimize",
      title: "Minimize",
      onClick: minimize,
      className: "hover:bg-theme-primary-700/45",
      icon: (
        <svg width="10" height="1" viewBox="0 0 10 1" className="text-current">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      key: "maximize",
      title: isMaximized ? "Restore" : "Maximize",
      onClick: maximize,
      className: "hover:bg-theme-primary-700/45",
      icon: (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="text-current"
        >
          <path
            d="M0,0 L10,0 L10,10 L0,10 Z M1,1 L1,9 L9,9 L9,1 Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      key: "close",
      title: "Close",
      onClick: close,
      className: "hover:bg-red-600 hover:text-white",
      icon: (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="text-current"
        >
          <path
            d="M0,0 L10,10 M10,0 L0,10"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative z-20 flex  flex-col select-none shrink-0 border-b border-theme-primary-500/10 overflow-visible bg-theme-primary-900 ">
      <span
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3 z-[1]"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgb(var(--theme-primary-800) / 0.72))",
        }}
      />
      <div className="relative z-10 flex h-8 items-center justify-between px-2">
        <div
          className="relative z-10 flex items-center gap-2 px-2"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            type="button"
            onClick={onHomeClick}
            title="Go to home"
            className="flex h-6 w-6 items-center justify-center rounded-lg border border-theme-primary-400/20 bg-gradient-to-br from-theme-primary-500/30 via-theme-primary-600/20 to-theme-primary-900/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:border-theme-primary-300/45"
          >
            <img src="./wingrid.png" alt="App Icon" className="h-4 w-4" />
          </button>
          <span className="text-[13px] text-theme-primary-100 font-[impact] tracking-wide">
            Wingrid Workspace
          </span>
        </div>

        <div
          className="relative z-10 flex items-center h-full"
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <div ref={actionMenuRef} className="relative flex items-center pr-1">
            <button
              type="button"
              onClick={() => setIsActionMenuOpen((current) => !current)}
              className={`${toolbarButtonBase} text-theme-primary-100 hover:bg-theme-primary-700/45 hover:text-theme-primary-50 ${
                isActionMenuOpen ? "bg-theme-primary-700/55" : ""
              }`}
              title="Workspace actions"
              aria-haspopup="menu"
              aria-expanded={isActionMenuOpen}
            >
              <MoreHorizontal className="h-4.5 w-4.5" strokeWidth={2.4} />
            </button>

            {isActionMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-8 z-50 w-64 overflow-hidden rounded-md border border-solid border-theme-primary-600/70 bg-theme-primary-900 py-1 text-[12px] shadow-xl shadow-black/35"
              >
                {actionItems.map((item) =>
                  item.kind === "divider" ? (
                    <div
                      key={item.key}
                      className="my-1 h-px bg-theme-primary-700/80"
                    />
                  ) : (
                    <button
                      type="button"
                      role="menuitem"
                      key={item.key}
                      onClick={() => runMenuAction(item)}
                      disabled={item.disabled}
                      className={`flex h-8 w-full items-center gap-2 border-0 bg-transparent px-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${
                        item.active
                          ? "bg-primary-500/12 text-primary-100"
                          : "text-theme-primary-100 hover:bg-theme-primary-800"
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-current">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {item.label}
                      </span>
                      {item.shortcut ? (
                        <span className="shrink-0 text-[10px] text-theme-primary-300">
                          {item.shortcut}
                        </span>
                      ) : null}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {activePanel === "settings" && (
            <button
              type="button"
              onClick={() => onTogglePanel("settings")}
              className="mr-1 inline-flex h-8 items-center gap-1.5 border-0 bg-transparent px-2 text-[11px] font-semibold text-theme-primary-100 transition-colors hover:bg-theme-primary-700/45 hover:text-theme-primary-50"
              title="Back to workspace"
            >
              <PanelLeft className="h-3.5 w-3.5" strokeWidth={2.4} />
              Workspace
            </button>
          )}

          <div className="w-px h-5 bg-white/8 mx-1" />

          <div className="flex items-center gap-0.5 pr-0.5">
            {windowControlItems.map((item) => (
              <button
                type="button"
                key={item.key}
                onClick={item.onClick}
                title={item.title}
                className={`${windowButtonBase} ${item.className ?? ""}`}
              >
                {item.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* stylish thin line with fading endings */}
      {/* <div className="w-[55%] m-auto h-px bg-gradient-to-r from-transparent via-theme-primary-700 to-transparent" /> */}

      <div className="relative flex h-8 items-center justify-between bg-theme-primary-950 px-3 text-[10px] leading-none">
        <div className="flex items-center gap-3 theme-text-soft font-bold">
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isProjectionOn ? "bg-primary-500 animate-pulse" : "bg-gray-500"
              }`}
            />
            <span>Projection : {isProjectionOn ? " LIVE" : " OFF"}</span>
          </span>
          {isProjectionOn && isBlackout && (
            <span className="inline-flex items-center gap-1.5 text-yellow-300">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
              Blackout
            </span>
          )}
          {isProjectionOn && isFrozen && (
            <span className="inline-flex items-center gap-1.5 text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Frozen
            </span>
          )}
          <span className="h-3 w-px bg-white/10" />
          {windowsCount > 0 ? (
            <>
              <span>Windows: {windowsCount}</span>
              <span>Selected: {selectedWindowsCount}</span>
            </>
          ) : isLoadingWindows ? (
            <span>Scanning...</span>
          ) : (
            <span>No windows</span>
          )}
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-theme-primary-200">
          <span className="rounded-full bg-theme-primary-900/55 px-2 py-1 text-[10px] font-semibold text-theme-primary-100">
            v{appVersion}
          </span>
          <span
            className={`inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              updateDownloaded
                ? "bg-primary-500/14 text-primary-200"
                : updateReady
                  ? "bg-blue-500/14 text-blue-200"
                  : "bg-theme-primary-900/55 text-theme-primary-200"
            }`}
          >
            {updateDownloaded ? (
              <CheckCircle2 className="h-3 w-3 shrink-0" />
            ) : isCheckingUpdate || isDownloadingUpdate ? (
              <RefreshCw className="h-3 w-3 shrink-0 animate-spin" />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme-primary-400" />
            )}
            <span className="truncate">{updateStatus}</span>
            {isDownloadingUpdate && (
              <span className="shrink-0">{updateProgress.toFixed(0)}%</span>
            )}
          </span>

          {updateDownloaded ? (
            <button
              type="button"
              onClick={onRestartToUpdate}
              className="inline-flex h-6 items-center rounded-md border-0 bg-primary-500/16 px-2.5 text-primary-100 transition-colors hover:bg-primary-500/24"
              title={
                updateVersion
                  ? `Restart to install v${updateVersion}`
                  : "Restart to install update"
              }
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <RotateCcw className="h-3 w-3" />
                Restart
              </span>
            </button>
          ) : updateReady ? (
            <button
              type="button"
              onClick={onStartDownload}
              disabled={isDownloadingUpdate}
              className="inline-flex h-6 items-center rounded-md border-0 bg-blue-500/14 px-2.5 text-blue-100 transition-colors hover:bg-blue-500/22 disabled:cursor-not-allowed disabled:opacity-60"
              title="Download the update"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <Download className="h-3 w-3" />
                {isDownloadingUpdate ? "Downloading" : "Download"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCheckForUpdates}
              disabled={isCheckingUpdate || isDownloadingUpdate}
              className="inline-flex h-6 items-center rounded-md border-0 bg-theme-primary-900/55 px-2.5 text-theme-primary-100 transition-colors hover:bg-theme-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <RefreshCw
                  className={`h-3 w-3 ${isCheckingUpdate ? "animate-spin" : ""}`}
                />
                {isCheckingUpdate ? "Checking" : "Check"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
