/// <reference types="vite/client" />

interface Window {
  // expose in the `electron/preload/index.ts`
  ipcRenderer: import("electron").IpcRenderer;
  electronAPI: {
    enumerateWindows: (options: any) => Promise<any>;
    getWindowIcon: (handle: number) => Promise<any>;
    getWindowThumbnail: (windowId: string, options?: any) => Promise<any>;
    getMultipleWindowThumbnails: (
      windowIds: string[],
      options?: any,
    ) => Promise<any>;
    getAllWindowThumbnails: (options?: any) => Promise<any>;
    getConnectedDisplays: () => Promise<{
      success: boolean;
      displays: Array<{
        id: number;
        label: string;
        isPrimary: boolean;
        internal: boolean;
        bounds: { x: number; y: number; width: number; height: number };
        scaleFactor: number;
        rotation: number;
      }>;
      error?: string;
    }>;
    selectDirectory: () => Promise<string | null>;
    getImages: (dirPath: string) => Promise<
      Array<{
        name: string;
        path: string;
        url: string;
      }>
    >;
    checkPublishedWindows: () => Promise<{
      hasActivePublications: boolean;
      count: number;
      publications: Array<{
        layoutId: string;
        displayId: number | null;
        windowId: number | null;
        isPublished: boolean;
      }>;
    }>;
    closePublishedWindows: (displayId?: number) => Promise<{
      success: boolean;
      closedCount?: number;
      error?: string;
    }>;
    focusWindow: (handle: number) => Promise<any>;
    minimizeWindow: (handle: number) => Promise<any>;
    maximizeWindow: (handle: number) => Promise<any>;
    closeWindow: (handle: number) => Promise<any>;
    showWindow: (handle: number) => Promise<any>;
    hideWindow: (handle: number) => Promise<any>;
    moveWindow: (handle: number, bounds: any) => Promise<any>;
    publishLayout: (layoutData: any) => Promise<any>;
    updatePublishedLayout: (layoutData: any) => Promise<any>;

    // Cache management
    clearThumbnailCache?: () => Promise<any>;
    getCacheStats?: () => Promise<any>;

    // High-quality and batch thumbnail capture
    captureHighQualityThumbnail?: (windowId: string) => Promise<any>;
    batchCaptureThumbnails?: (
      windowIds: string[],
      options?: any,
    ) => Promise<any>;
    captureWindowThumbnail?: (windowId: string, options?: any) => Promise<any>;

    // capturePage — pixel-accurate snapshot of projection window
    captureProjectionPage: () => Promise<{
      success: boolean;
      dataUrl?: string;
      width?: number;
      height?: number;
      error?: string;
    }>;

    // Tray action events
    onTrayAction: (callback: (action: string) => void) => () => void;
    onPublishedLayoutUpdated: (callback: (payload: any) => void) => () => void;
  };
}
