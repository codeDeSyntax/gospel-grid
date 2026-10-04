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
  "inline-flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent p-0 text-white/90 transition-colors duration-150 outline-none hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 active:scale-95 cursor-pointer";

const windowButtonBase =
  "inline-flex h-full w-11 items-center justify-center border-0 bg-transparent p-0 text-white/90 transition-colors duration-150 outline-none hover:bg-white/15 hover:text-white cursor-pointer";

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
        <MonitorOff className="w-3.5 h-3.5" strokeWidth={2.5} />
      ) : (
        <Cast className="w-3.5 h-3.5" strokeWidth={2.5} />
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
      activeClassName: "text-[#78c6e5] bg-white/15",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    { kind: "divider", key: "divider-1" },
    {
      kind: "button",
      key: "blackout",
      icon: isBlackout ? (
        <Eye className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      ) : (
        <EyeOff className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      ),
      onClick: onToggleBlackout,
      disabled: !isProjectionOn,
      active: isBlackout,
      label: isBlackout ? "End blackout" : "Blackout projection",
      shortcut: "F6",
      title: isBlackout ? "End blackout (F6)" : "Blackout projection (F6)",
      activeClassName: "text-white bg-white/15",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    {
      kind: "button",
      key: "freeze",
      icon: isFrozen ? (
        <Play className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      ) : (
        <Pause className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
      ),
      onClick: onToggleFrozen,
      disabled: !isProjectionOn,
      active: isFrozen,
      label: isFrozen ? "Unfreeze projection" : "Freeze projection",
      shortcut: "F7",
      title: isFrozen ? "Unfreeze projection (F7)" : "Freeze projection (F7)",
      activeClassName: "text-white bg-white/15",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    { kind: "divider", key: "divider-2" },
    {
      kind: "button",
      key: "undo",
      icon: <Undo2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />,
      onClick: onUndo,
      disabled: !canUndo,
      label: "Undo selection",
      shortcut: "Ctrl+Z",
      title: "Undo selection (Ctrl+Z)",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    {
      kind: "button",
      key: "redo",
      icon: <Redo2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />,
      onClick: onRedo,
      disabled: !canRedo,
      label: "Redo selection",
      shortcut: "Ctrl+Y",
      title: "Redo selection (Ctrl+Y)",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    { kind: "divider", key: "divider-3" },
    {
      kind: "button",
      key: "clear",
      icon: <Trash2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />,
      onClick: onClearAll,
      label: "Clear selected windows",
      shortcut: "F8",
      title: "Clear all selected windows (F8)",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    {
      kind: "button",
      key: "settings",
      icon: (
        <Settings
          className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${
            activePanel === "settings" ? "rotate-90" : ""
          }`}
        />
      ),
      onClick: () => onTogglePanel("settings"),
      active: activePanel === "settings",
      label: "Settings",
      title: "Settings",
      activeClassName: "text-white bg-white/15",
      inactiveClassName: "text-white/85 hover:text-white",
    },
    { kind: "divider", key: "divider-restart" },
    {
      kind: "button",
      key: "restart-app",
      icon: <RotateCcw className="w-3.5 h-3.5 text-white" strokeWidth={2.4} />,
      onClick: relaunch,
      label: "Restart Wingrid",
      title: "Restart Wingrid application",
      inactiveClassName: "text-white/85 hover:text-white",
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
      className: "hover:bg-white/15 text-white/90 hover:text-white group",
      icon: (
        <RotateCcw className="w-3 h-3 transition-transform duration-300 group-hover:-rotate-90" strokeWidth={2.2} />
      ),
    },
    {
      key: "minimize",
      title: "Minimize",
      onClick: minimize,
      className: "hover:bg-white/15 text-white/90 hover:text-white",
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
      className: "hover:bg-white/15 text-white/90 hover:text-white",
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
      className: "hover:bg-red-500 hover:text-white text-white/90",
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
    <div className="relative z-20 flex flex-col select-none shrink-0 border-b border-[#006b96] overflow-visible bg-[#0390c8] text-white shadow-xs">
      <div
        className="relative z-10 flex h-7 items-center justify-between pl-1.5 pr-0"
        style={dragRegionStyle}
      >
        {/* Left: App icon & Compact text menus */}
        <div className="relative z-10 flex items-center gap-1">
          <button
            type="button"
            onClick={onHomeClick}
            title="Go to home"
            className="flex h-5 w-5 items-center justify-center rounded transition-all hover:bg-white/15 active:scale-95 cursor-pointer ml-0.5"
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
                className="px-1.5 py-0.5 text-[11px] font-medium text-white/95 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer"
              >
                File
              </button>

              {isActionMenuOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-6.5 z-50 w-56 overflow-hidden rounded-md border border-[#78c6e5]/40 bg-[#00344b] py-1 text-[11.5px] shadow-2xl shadow-black/50 backdrop-blur-md text-white"
                >
                  {actionItems.map((item) =>
                    item.kind === "divider" ? (
                      <div
                        key={item.key}
                        className="my-1 h-px bg-white/10"
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
                            ? "bg-[#78c6e5]/20 text-[#78c6e5]"
                            : "text-white/90 hover:bg-white/15 hover:text-white"
                        }`}
                      >
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-current">
                          {item.icon}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                        {item.shortcut ? (
                          <span className="shrink-0 text-[9.5px] text-[#78c6e5]/80 font-mono">
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
              className="px-1.5 py-0.5 text-[11px] font-medium text-white/95 hover:text-white hover:bg-white/15 rounded transition-colors disabled:opacity-35 cursor-pointer"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => onTogglePanel("settings")}
              className="px-1.5 py-0.5 text-[11px] font-medium text-white/95 hover:text-white hover:bg-white/15 rounded transition-colors cursor-pointer"
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
              className="px-1.5 py-0.5 text-[11px] font-medium text-white/95 hover:text-white hover:bg-white/15 rounded transition-colors disabled:opacity-35 cursor-pointer"
            >
              Projection
            </button>
          </div>
        </div>

        {/* Center: Title */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-1.5 text-[11.5px] text-white truncate max-w-[40%] font-medium tracking-wide">
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
              className={`${toolbarButtonBase} ${isProjectionOn ? "text-white bg-[#004d6e] ring-1 ring-[#003f5a]" : ""}`}
              title={isProjectionOn ? "Close projection (F5)" : hasSelections ? "Project layout (F5)" : "Select windows first"}
            >
              {isProjectionOn ? <MonitorOff className="w-3.5 h-3.5" /> : <Cast className="w-3.5 h-3.5" />}
            </button>

            {/* Blackout */}
            {isProjectionOn && (
              <button
                type="button"
                onClick={onToggleBlackout}
                className={`${toolbarButtonBase} ${isBlackout ? "text-white bg-[#004d6e] ring-1 ring-[#003f5a]" : ""}`}
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
                className={`${toolbarButtonBase} ${isFrozen ? "text-white bg-[#004d6e] ring-1 ring-[#003f5a]" : ""}`}
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
              className={`${toolbarButtonBase} ${activePanel === "settings" ? "text-white bg-white/25 ring-1 ring-white/30" : ""}`}
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
                <Sun className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Moon className="h-3.5 w-3.5" strokeWidth={2} />
              )}
            </button>
          </div>

          <div className="w-px h-3.5 bg-white/20 mr-1 ml-0.5" />

          {/* Window control buttons */}
          <div className="flex items-stretch h-full">
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
        className="relative flex h-8 items-center justify-between bg-theme-primary-950 pl-3 pr-0 text-[11px] leading-none border-b border-solid border-x-0 border-t-0 border-theme-primary-700/60 select-none"
        style={dragRegionStyle}
      >
        <div className="flex items-center gap-3">
          {/* Projection Status */}
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isProjectionOn
                  ? "bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]"
                  : "bg-theme-primary-500"
              }`}
            />
            <span className="theme-text-soft">
              Projection:{" "}
              <strong
                className={
                  isProjectionOn
                    ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : "theme-text-main font-semibold"
                }
              >
                {isProjectionOn ? "LIVE" : "OFF"}
              </strong>
            </span>
          </div>

          {isProjectionOn && isBlackout && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium animate-in fade-in duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Blackout
            </span>
          )}

          {isProjectionOn && isFrozen && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 text-[10px] text-sky-600 dark:text-sky-400 font-medium animate-in fade-in duration-150">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              Frozen
            </span>
          )}

          <span className="h-3.5 w-px bg-theme-primary-700/70" />

          {/* Windows Telemetry */}
          {windowsCount > 0 ? (
            <div className="inline-flex items-center gap-2 theme-text-soft text-[11px]">
              <span>
                Windows: <strong className="font-semibold theme-text-main">{windowsCount}</strong>
              </span>
              <span className="opacity-30">•</span>
              <span>
                Selected:{" "}
                <strong
                  className={`font-semibold ${
                    selectedWindowsCount > 0
                      ? "text-primary-600 dark:text-primary-400"
                      : "theme-text-main"
                  }`}
                >
                  {selectedWindowsCount}
                </strong>
              </span>
            </div>
          ) : isLoadingWindows ? (
            <span className="theme-text-muted flex items-center gap-1.5 text-[10.5px]">
              <span className="h-1.5 w-1.5 rounded-full bg-theme-primary-500 animate-pulse" />
              Scanning windows...
            </span>
          ) : (
            <span className="theme-text-muted text-[10.5px]">No windows detected</span>
          )}
        </div>

        {/* Right Parent Background Container - Full Height */}
        <div
          className="flex h-full min-w-0 items-center gap-2 bg-theme-primary-900/70 border-l border-theme-primary-700/60 px-3"
          style={noDragRegionStyle}
        >
          {/* App Version Tag */}
          <span className="rounded-full bg-theme-primary-950/60 px-2 py-0.5 text-[10px] font-mono font-medium theme-text-soft border border-theme-primary-700/50">
            v{appVersion}
          </span>

          {/* Update Status Pill */}
          <span
            className={`inline-flex max-w-[240px] items-center gap-1.5 truncate rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              updateDownloaded
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : updateReady
                  ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30"
                  : updateStatus.toLowerCase().includes("offline") ||
                      updateStatus.toLowerCase().includes("no connection")
                    ? "bg-theme-primary-950/60 theme-text-muted border border-theme-primary-700/50"
                    : "bg-theme-primary-950/60 theme-text-soft border border-theme-primary-700/50"
            }`}
            title={updateStatus}
          >
            {updateDownloaded ? (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />
            ) : isCheckingUpdate || isDownloadingUpdate ? (
              <img
                src="./update.png"
                className="h-3 w-3 shrink-0 animate-spin opacity-80"
              />
            ) : (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-theme-primary-500" />
            )}
            <span className="truncate">{updateStatus}</span>
            {isDownloadingUpdate && (
              <span className="shrink-0 font-semibold theme-text-main font-mono">
                {updateProgress.toFixed(0)}%
              </span>
            )}
          </span>

          {/* Action Trigger Buttons */}
          {updateDownloaded ? (
            <button
              type="button"
              onClick={onRestartToUpdate}
              className="inline-flex h-5.5 items-center rounded-md border border-emerald-600/30 bg-emerald-600 px-2 text-white transition-colors hover:bg-emerald-500 cursor-pointer shadow-xs"
              title={
                updateVersion
                  ? `Restart to install v${updateVersion}`
                  : "Restart to install update"
              }
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <img src="./update.png" className="h-[15px] w-[15px] shrink-0 object-contain brightness-200" />
                Restart
              </span>
            </button>
          ) : updateReady ? (
            <button
              type="button"
              onClick={onStartDownload}
              disabled={isDownloadingUpdate}
              className="inline-flex h-5.5 items-center rounded-md border border-sky-600/30 bg-sky-600 px-2 text-white transition-colors hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer shadow-xs"
              title="Download the update"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <Download className="h-[15px] w-[15px] shrink-0 text-white" />
                {isDownloadingUpdate ? "Downloading" : "Download"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onCheckForUpdates}
              disabled={isCheckingUpdate || isDownloadingUpdate}
              className="inline-flex h-5.5 items-center rounded-md border border-theme-primary-700/70 bg-theme-primary-950/80 px-2 theme-text-main transition-colors hover:bg-theme-primary-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-xs"
              title="Check for software updates"
            >
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold">
                <img
                  src="./update.png"
                  className={`h-[15px] w-[15px] shrink-0 object-contain opacity-90 ${isCheckingUpdate ? "animate-spin" : ""}`}
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
