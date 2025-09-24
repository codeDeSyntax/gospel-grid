// Window control API types
export interface WindowControls {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  isMinimized: () => Promise<boolean>;
}

// Window enumeration API types
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EnumerateWindowsOptions {
  includeMinimized?: boolean;
  includeSystemWindows?: boolean;
}

export interface WindowEnumerationResult {
  success: boolean;
  windows?: Array<{
    id: string;
    name: string;
    app: string;
    handle: number;
    processId: number;
    executablePath?: string;
    className?: string;
    isVisible: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    bounds: WindowBounds;
    icon?: string;
    parentHandle?: number;
    hasChildren?: boolean;
    zOrder?: number;
  }>;
  error?: string;
}

export interface WindowOperationResult {
  success: boolean;
  error?: string;
  icon?: string;
  thumbnail?: string;
}

export interface SavedPreset {
  id: string;
  name: string;
  windowCount: number;
  createdAt: string;
  windows: Array<{
    id: string; // Native desktopCapturer source ID (e.g., "window:853982:0")
    name: string; // Full window title
    app: string; // Extracted app name (e.g., "Code", "Chrome")
    icon?: string; // Base64 encoded icon data
    hasNativeIcon?: boolean; // Whether the window has a native app icon available
    sourceId?: string; // Original desktopCapturer source ID
    handle?: number; // Window handle
  }>;
}

export interface PresetOperationResult {
  success: boolean;
  error?: string;
  presets?: SavedPreset[];
}

export interface ElectronAPI {
  enumerateWindows: (
    options: EnumerateWindowsOptions
  ) => Promise<WindowEnumerationResult>;
  getWindowIcon: (handle: number) => Promise<WindowOperationResult>;
  getWindowThumbnail: (handle: number) => Promise<WindowOperationResult>;
  focusWindow: (handle: number) => Promise<WindowOperationResult>;
  minimizeWindow: (handle: number) => Promise<WindowOperationResult>;
  maximizeWindow: (handle: number) => Promise<WindowOperationResult>;
  closeWindow: (handle: number) => Promise<WindowOperationResult>;
  showWindow: (handle: number) => Promise<WindowOperationResult>;
  hideWindow: (handle: number) => Promise<WindowOperationResult>;
  moveWindow: (
    handle: number,
    bounds: WindowBounds
  ) => Promise<WindowOperationResult>;
  publishLayout: (
    layoutData: any
  ) => Promise<{ success: boolean; windowId?: number; error?: string }>;
  getPublishedLayout: (layoutId: string) => Promise<any | null>;
  checkPublishedWindows: () => Promise<{
    hasActivePublications: boolean;
    count: number;
  }>;
  closePublishedWindows: () => Promise<{
    success: boolean;
    closedCount?: number;
    error?: string;
  }>;
  // Preset management
  savePreset: (preset: SavedPreset) => Promise<PresetOperationResult>;
  loadPresets: () => Promise<PresetOperationResult>;
  deletePreset: (presetId: string) => Promise<PresetOperationResult>;
}

// Extend the global Window interface to include our APIs
declare global {
  interface Window {
    windowControls: WindowControls;
    electronAPI: ElectronAPI;
    ipcRenderer: {
      on: (
        channel: string,
        listener: (event: any, ...args: any[]) => void
      ) => void;
      off: (channel: string, ...args: any[]) => void;
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export {};
