import { type WindowInfo } from "../WindowList";
import { type ScenePreset } from "@/store/slices/appSlice";

export type PanelView = "layout" | "settings" | "presets" | "overlay";

export interface RightPanelProps {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  onLayoutChange: (layout: string) => void;
  onWindowSelect: (windowId: string) => void;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => void;
  activePanel: PanelView;
  /** Scene Presets */
  onLoadPreset?: (preset: ScenePreset) => void;
}

export interface WindowLayoutCardProps {
  windows: WindowInfo[];
  currentLayout: string;
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

export type FeatureView = "autofit" | "overlay" | "timer" | "illustration";
