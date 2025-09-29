import { type WindowInfo } from "../WindowList";
import { type PresetInfo } from "../PresetsList";

export interface RightPanelProps {
  windows: WindowInfo[];
  presets: PresetInfo[];
  selectedPreset: string;
  currentLayout: string;
  focusedWindowId: string | null;
  onRefreshWindows: () => void;
  onSavePreset: () => void;
  onClearAll: () => void;
  onPresetChange: (preset: string) => void;
  onLayoutChange: (layout: string) => void;
  onWindowSelect: (windowId: string) => void;
  onPresetSelect: (presetId: string) => void;
  onPresetDelete?: (presetId: string) => void;
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

export interface AITranscriptionCardProps {
  onWindowSelect: (windowId: string) => void;
}

export interface SpeechToTextCardProps {
  onWindowSelect: (windowId: string) => void;
}

export interface PresetsCardProps {
  presets: PresetInfo[];
  selectedPreset: string;
  availableWindows?: WindowInfo[]; // Available windows for checking requirements
  onPresetSelect: (presetId: string) => void;
  onPresetDelete?: (presetId: string) => void;
}

export type MainViewType = "windows" | "settings";
