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
      options?: any
    ) => Promise<any>;
    getAllWindowThumbnails: (options?: any) => Promise<any>;
    focusWindow: (handle: number) => Promise<any>;
    minimizeWindow: (handle: number) => Promise<any>;
    maximizeWindow: (handle: number) => Promise<any>;
    closeWindow: (handle: number) => Promise<any>;
    showWindow: (handle: number) => Promise<any>;
    hideWindow: (handle: number) => Promise<any>;
    moveWindow: (handle: number, bounds: any) => Promise<any>;
    publishLayout: (layoutData: any) => Promise<any>;

    // Cache management
    clearThumbnailCache?: () => Promise<any>;
    getCacheStats?: () => Promise<any>;

    // High-quality and batch thumbnail capture
    captureHighQualityThumbnail?: (windowId: string) => Promise<any>;
    batchCaptureThumbnails?: (
      windowIds: string[],
      options?: any
    ) => Promise<any>;
    captureWindowThumbnail?: (windowId: string, options?: any) => Promise<any>;
  };
}
