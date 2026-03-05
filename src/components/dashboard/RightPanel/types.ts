import { type WindowInfo } from "../WindowList";
import { type ScenePreset } from "@/store/slices/appSlice";

export interface RightPanelProps {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  onRefreshWindows: () => void;
  onClearAll: () => void;
  onLayoutChange: (layout: string) => void;
  onWindowSelect: (windowId: string) => void;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => void;
  onPublishLayout: () => void;
  showSettings?: boolean;
  onToggleSettings?: () => void;
  onCloseProjection?: () => void;
  /** Blackout / Freeze toggles (actions that also update IPC) */
  onToggleBlackout?: () => void;
  onToggleFrozen?: () => void;
  /** Undo / Redo */
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  /** Scene Presets */
  onLoadPreset?: (preset: ScenePreset) => void;
}

export interface WindowLayoutCardProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => void;
  isProjectionOn?: boolean;
}

export interface SettingsPanelProps {
  // Settings panel doesn't need external props for now,
  // but can be extended later for persisting settings
}

export type MainViewType = "windows" | "settings";
