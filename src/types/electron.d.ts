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
  publishLayout: (layoutData: any) => Promise<{ success: boolean; windowId?: number; error?: string }>;
  checkPublishedWindows: () => Promise<{ hasActivePublications: boolean; count: number }>;
  closePublishedWindows: () => Promise<{ success: boolean; closedCount?: number; error?: string }>;
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
