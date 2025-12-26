import { type WindowInfo } from "../WindowList";

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
}

export interface WindowLayoutCardProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => void;
}

export interface SettingsPanelProps {
  // Settings panel doesn't need external props for now,
  // but can be extended later for persisting settings
}

export type MainViewType = "windows" | "settings";
