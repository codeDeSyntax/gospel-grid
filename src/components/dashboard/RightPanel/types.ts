import { type WindowInfo } from "../picker/WindowPicker";

import type { AiProducerCard, AiProvider } from "@/services/ai/types";
import type { IntelligenceStatus } from "@/services/ai/contextIntelligenceService";

export interface ContextIntelligenceProps {
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  mode: "auto" | "manual";
  setMode: (mode: "auto" | "manual") => void;
  dismissCard: (index: number) => void;
  clearCards: () => void;
  pushCardToOverlay: (card: AiProducerCard) => void;
  hideOverlay: () => void;
  generateFromText: (text: string) => Promise<void>;
  provider: AiProvider;
  activeView?: FeatureView;
  setActiveView?: (view: FeatureView) => void;
}

export type PanelView = "layout" | "settings" | "overlay";

export interface RightPanelProps {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  onLayoutChange: (layout: string) => void;
  onWindowSelect: (windowId: string) => void;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => boolean | void;
  activePanel: PanelView;
  contextIntelligence?: ContextIntelligenceProps;
}

export interface WindowLayoutCardProps {
  windows: WindowInfo[];
  currentLayout: string;
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  onWindowAdd: (window: WindowInfo) => boolean | void;
  isProjectionOn?: boolean;
}

export interface SettingsPanelProps {
  // Settings panel doesn't need external props for now,
  // but can be extended later for persisting settings
}

export type MainViewType = "windows" | "settings";

export type FeatureView =
  | "autofit"
  | "overlay"
  | "timer"
  | "image"
  | "captions"
  | "remote";
