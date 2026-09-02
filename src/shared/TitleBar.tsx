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
  RotateCcw,
  Undo2,
  Redo2,
  Trash2,
  Settings,
  MoreHorizontal,
  PanelLeft,
  Sun,
  Moon,
} from "lucide-react";
import { useWindowControls } from "../hooks/useWindowControls";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleDarkMode } from "@/store/slices/appSlice";

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
  "inline-flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent p-0 text-theme-primary-200/80 transition-colors duration-150 outline-none hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 cursor-pointer";

const windowButtonBase =
  "inline-flex h-7 w-8 items-center justify-center border-0 bg-transparent p-0 text-theme-primary-200/80 transition-colors duration-150 outline-none hover:bg-white/10 hover:text-white cursor-pointer";

const dragRegionStyle = {
  WebkitAppRegion: "drag",
} as React.CSSProperties;

const noDragRegionStyle = {
  WebkitAppRegion: "no-drag",
} as React.CSSProperties;

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
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const { isMaximized, minimize, maximize, close, relaunch } = useWindowControls();
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState(false);
  const actionMenuRef = React.useRef<HTMLDivElement>(null);
  const hasSelections = selectedWindowsCount > 0;

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
      activeClassName: "text-primary-300 border-primary-500/40",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    { kind: "divider", key: "divider-1" },
    {
      kind: "button",
      key: "blackout",
      icon: isBlackout ? (
        <Eye className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />
      ),
      onClick: onToggleBlackout,
      disabled: !isProjectionOn,
      active: isBlackout,
      label: isBlackout ? "End blackout" : "Blackout projection",
      shortcut: "F6",
      title: isBlackout ? "End blackout (F6)" : "Blackout projection (F6)",
      activeClassName: "text-theme-primary-50 border-theme-primary-400/60",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    {
      kind: "button",
      key: "freeze",
      icon: isFrozen ? (
        <Play className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />
      ) : (
        <Pause className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />
      ),
      onClick: onToggleFrozen,
      disabled: !isProjectionOn,
      active: isFrozen,
      label: isFrozen ? "Unfreeze projection" : "Freeze projection",
      shortcut: "F7",
      title: isFrozen ? "Unfreeze projection (F7)" : "Freeze projection (F7)",
      activeClassName: "text-theme-primary-50 border-theme-primary-400/60",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100",
    },
    { kind: "divider", key: "divider-2" },
    {
      kind: "button",
      key: "undo",
      icon: <Undo2 className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />,
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
      icon: <Redo2 className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />,
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
      icon: <Trash2 className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={3} />,
      onClick: onClearAll,
      label: "Clear selected windows",
      shortcut: "F8",
      title: "Clear all selected windows (F8)",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-50 hover:border-theme-primary-400",
    },
    {
      kind: "button",
      key: "settings",
      icon: (
        <Settings
          className={`w-3.5 h-3.5 text-theme-primary-100 transition-transform duration-200 ${
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
    { kind: "divider", key: "divider-restart" },
    {
      kind: "button",
      key: "restart-app",
      icon: <RotateCcw className="w-3.5 h-3.5 text-theme-primary-100" strokeWidth={2.4} />,
      onClick: relaunch,
      label: "Restart Wingrid",
      title: "Restart Wingrid application",
      inactiveClassName:
        "text-theme-primary-200/85 border-theme-primary-500/35 hover:text-primary-300",
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
      key: "restart",
      title: "Restart Wingrid",
      onClick: relaunch,
      className: "hover:bg-white/10 text-theme-primary-200/80 hover:text-white group",
      icon: (
        <RotateCcw className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-90" strokeWidth={2.2} />
      ),
    },
    {
      key: "minimize",
      title: "Minimize",
      onClick: minimize,
      className: "hover:bg-white/10 text-theme-primary-200/80 hover:text-white",
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
      className: "hover:bg-white/10 text-theme-primary-200/80 hover:text-white",
      icon: (
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          className="text-current"
        >
          <path
            d="M0,0 L9,0 L9,9 L0,9 Z M1,1 L1,8 L8,8 L8,1 Z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      key: "close",
      title: "Close",
      onClick: close,
      className: "hover:bg-red-600 hover:text-white text-theme-primary-200/80",
      icon: (
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          className="text-current"
        >
          <path
            d="M0,0 L9,9 M9,0 L0,9"
            stroke="currentColor"
            strokeWidth="1.1"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="relative z-20 flex flex-col select-none shrink-0 border-b border-theme-primary-500/10 overflow-visible bg-theme-primary-900">
      <div
        className="relative z-10 flex h-7.5 items-center justify-between px-1.5"
        style={dragRegionStyle}
      >
        {/* Left: App icon & Compact text menus */}
        <div className="relative z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={onHomeClick}
            title="Go to home"
            className="flex h-5 w-5 items-center justify-center rounded transition-all hover:bg-white/10 active:scale-95 cursor-pointer ml-0.5"
            style={noDragRegionStyle}
          >
            <img
              src="./wingrid.png"
              alt="App Icon"
              className="h-3.5 w-3.5 object-contain"
            />
          </button>

          {/* Sleek IDE Menu items */}
          <div className="flex items-center gap-0.5" style={noDragRegionStyle}>
            <div ref={actionMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsActionMenuOpen((c) => !c)}
                className="px-1.5 py-0.5 text-[11px] font-normal text-theme-primary-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
              >
                File
              </button>

              {isActionMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-6.5 z-50 w-56 overflow-hidden rounded-md border border-theme-primary-600/70 bg-theme-primary-900 py-1 text-[11.5px] shadow-xl shadow-black/40 backdrop-blur-md"
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
                        className={`flex h-7 w-full items-center gap-2 border-0 bg-transparent px-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          item.active
                            ? "bg-primary-500/15 text-primary-400"
                            : "text-theme-primary-100 hover:bg-theme-primary-800 hover:text-white"
                        }`}
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-current">
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.shortcut ? (
                          <span className="shrink-0 text-[9.5px] text-theme-primary-400 font-mono">
                            {item.shortcut}
                          </span>
                        ) : null}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="px-1.5 py-0.5 text-[11px] font-normal text-theme-primary-200 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-35 cursor-pointer"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onTogglePanel("settings")}
              className="px-1.5 py-0.5 text-[11px] font-normal text-theme-primary-200 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              View
            </button>

            <button
              type="button"
              onClick={() => {
                if (isProjectionOn) onCloseProjection();
                else if (hasSelections) onPublishLayout();
              }}
              disabled={!isProjectionOn && !hasSelections}
              className="px-1.5 py-0.5 text-[11px] font-normal text-theme-primary-200 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-35 cursor-pointer"
            >
              Projection
            </button>
          </div>
        </div>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 text-[11.5px] text-theme-primary-200/75 truncate max-w-[40%] font-normal">
          <span>Wingrid Workspace</span>
        </div>

        {/* Right: Close compact icon buttons & window controls */}
        <div
          className="relative z-10 flex items-center h-full gap-0.5"
          style={noDragRegionStyle}
        >
          {/* Quick Action Icons Group */}
          <div className="flex items-center gap-0.5 pr-0.5">
            {/* Projection toggle */}
            <button
              type="button"
              onClick={() => {
                if (isProjectionOn) onCloseProjection();
                else if (hasSelections) onPublishLayout();
              }}
              disabled={!isProjectionOn && !hasSelections}
              className={`${toolbarButtonBase} ${isProjectionOn ? "text-primary-400 bg-primary-500/15" : ""}`}
              title={isProjectionOn ? "Close projection (F5)" : hasSelections ? "Project layout (F5)" : "Select windows first"}
            >
              {isProjectionOn ? <MonitorOff className="w-3.5 h-3.5" /> : <Cast className="w-3.5 h-3.5" />}
            </button>

            {/* Blackout */}
            {isProjectionOn && (
              <button
                type="button"
                onClick={onToggleBlackout}
                className={`${toolbarButtonBase} ${isBlackout ? "text-primary-400 bg-primary-500/15" : ""}`}
                title={isBlackout ? "End blackout (F6)" : "Blackout projection (F6)"}
              >
                {isBlackout ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Freeze */}
            {isProjectionOn && (
              <button
                type="button"
                onClick={onToggleFrozen}
                className={`${toolbarButtonBase} ${isFrozen ? "text-primary-400 bg-primary-500/15" : ""}`}
                title={isFrozen ? "Unfreeze projection (F7)" : "Freeze projection (F7)"}
              >
                {isFrozen ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Undo */}
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={toolbarButtonBase}
              title="Undo selection (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className={toolbarButtonBase}
              title="Redo selection (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            {/* Clear */}
            <button
              type="button"
              onClick={onClearAll}
              disabled={!hasSelections}
              className={toolbarButtonBase}
              title="Clear all selections (F8)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Settings */}
            <button
              type="button"
              onClick={() => onTogglePanel("settings")}
              className={`${toolbarButtonBase} ${activePanel === "settings" ? "text-theme-primary-50 bg-theme-primary-700/50" : ""}`}
              title="Settings"
            >
              <Settings className={`w-3.5 h-3.5 transition-transform duration-200 ${activePanel === "settings" ? "rotate-90" : ""}`} />
            </button>

            {/* Theme Toggler Button */}
            <button
              type="button"
              onClick={() => dispatch(toggleDarkMode())}
              className={toolbarButtonBase}
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? (
                <Sun className="h-3.5 w-3.5 text-theme-primary-100" strokeWidth={2} />
              ) : (
                <Moon className="h-3.5 w-3.5 text-theme-primary-100" strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="w-px h-3.5 bg-white/10 mx-0.5" />

          {/* Window control buttons */}
          <div className="flex items-center">
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

      <div
        className="relative flex h-8 items-center justify-between bg-theme-primary-950 px-3 text-[10px] leading-none border-b border-solid border-x-0 border-t-0 border-theme-primary-600"
        style={dragRegionStyle}
      >
        <div className="flex items-center gap-3 theme-text-soft font-bold">
          <span className="inline-flex items-center gap-1.5 font-thin">
            <span
              className={`h-1.5 w-1.5 rounded-full font-thin ${
                isProjectionOn ? "bg-primary-500 animate-pulse" : "bg-theme-primary-400"
              }`}
            />
            <span className="text-theme-primary-200">Projection : {isProjectionOn ? " LIVE" : " OFF"}</span>
          </span>
          {isProjectionOn && isBlackout && (
            <span className="inline-flex items-center gap-1.5 text-theme-primary-200">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-primary-400" />
              Blackout
            </span>
          )}
          {isProjectionOn && isFrozen && (
            <span className="inline-flex items-center gap-1.5 text-theme-primary-200">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-primary-400" />
              Frozen
            </span>
          )}
          <span className="h-3 font-thin w-px bg-white/10" />
          {windowsCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-thin text-theme-primary-200">
              <span>Windows: {windowsCount}</span>
              <span>Selected: {selectedWindowsCount}</span>
            </span>
          ) : isLoadingWindows ? (
            <span className="text-theme-primary-300">Scanning...</span>
          ) : (
            <span className="text-theme-primary-400">No windows</span>
          )}
        </div>

        <div
          className="flex min-w-0 items-center gap-1.5 text-theme-primary-200"
          style={noDragRegionStyle}
        >
          <span className="rounded-full bg-theme-primary-900/55 px-2 py-1 text-[10px] font-thin text-theme-primary-100">
            v{appVersion}
          </span>
          <span
            className={`inline-flex max-w-[220px] items-center gap-1.5 truncate rounded-full px-2.5 py-1 text-[10px] font-thin ${
              updateDownloaded
                ? "bg-primary-500/14 text-primary-200"
                : updateReady
                  ? "bg-primary-500/12 text-primary-200"
                  : updateStatus.toLowerCase().includes("offline") ||
                      updateStatus.toLowerCase().includes("no connection")
                    ? "bg-theme-primary-800 text-theme-primary-300 border border-theme-primary-700"
                    : "bg-theme-primary-900/55 text-theme-primary-200"
            }`}
            title={updateStatus}
          >
            {updateDownloaded ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-primary-400" />
            ) : isCheckingUpdate || isDownloadingUpdate ? (
              <img
                src="./update.png"
                className="h-3 w-3 shrink-0 animate-spin opacity-80"
              />
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
              className="inline-flex h-6 items-center rounded-md border-0 bg-primary-500/16 px-2.5 text-primary-400 transition-colors hover:bg-primary-500/24 cursor-pointer"
              title={
                updateVersion
                  ? `Restart to install v${updateVersion}`
                  : "Restart to install update"
              }
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <img src="./update.png" className="h-3 w-3 opacity-80" />
                Restart
              </span>
            </button>
          ) : updateReady ? (
            <button
              type="button"
              onClick={onStartDownload}
              disabled={isDownloadingUpdate}
              className="inline-flex h-6 items-center rounded-md border-0 bg-primary-500/14 px-2.5 text-primary-300 transition-colors hover:bg-primary-500/22 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              title="Download the update"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <Download className="h-3 w-3 text-theme-primary-100" />
                {isDownloadingUpdate ? "Downloading" : "Download"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCheckForUpdates}
              disabled={isCheckingUpdate || isDownloadingUpdate}
              className="inline-flex h-6 items-center rounded-md border-0 bg-theme-primary-900/55 px-2.5 text-theme-primary-100 transition-colors hover:bg-theme-primary-800 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <img
                  src="./update.png"
                  className={`h-3 w-3 opacity-80 ${isCheckingUpdate ? "animate-spin" : ""}`}
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
