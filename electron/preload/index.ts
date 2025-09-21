import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

// --------- Window Control APIs ---------
contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  isMinimized: () => ipcRenderer.invoke("window-is-minimized"),
});

// --------- Window Enumeration APIs ---------
contextBridge.exposeInMainWorld("electronAPI", {
  enumerateWindows: (options: any) =>
    ipcRenderer.invoke("enumerate-windows", options),
  getWindowIcon: (handle: number) =>
    ipcRenderer.invoke("get-window-icon", handle),
  getWindowThumbnail: (windowId: string, options?: any) =>
    ipcRenderer.invoke("get-window-thumbnail", windowId, options),
  getMultipleWindowThumbnails: (windowIds: string[], options?: any) =>
    ipcRenderer.invoke("get-multiple-window-thumbnails", windowIds, options),
  getAllWindowThumbnails: (options?: any) =>
    ipcRenderer.invoke("get-all-window-thumbnails", options),
  focusWindow: (handle: number) => ipcRenderer.invoke("focus-window", handle),
  minimizeWindow: (handle: number) =>
    ipcRenderer.invoke("minimize-window-external", handle),
  maximizeWindow: (handle: number) =>
    ipcRenderer.invoke("maximize-window-external", handle),
  closeWindow: (handle: number) =>
    ipcRenderer.invoke("close-window-external", handle),
  showWindow: (handle: number) =>
    ipcRenderer.invoke("show-window-external", handle),
  hideWindow: (handle: number) =>
    ipcRenderer.invoke("hide-window-external", handle),
  moveWindow: (handle: number, bounds: any) =>
    ipcRenderer.invoke("move-window-external", handle, bounds),
  publishLayout: (layoutData: any) =>
    ipcRenderer.invoke("publish-layout", layoutData),
  getPublishedLayout: (layoutId: string) =>
    ipcRenderer.invoke("get-published-layout", layoutId),
  checkPublishedWindows: () => ipcRenderer.invoke("check-published-windows"),
  closePublishedWindows: () => ipcRenderer.invoke("close-published-windows"),

  // Preset management
  savePreset: (preset: any) => ipcRenderer.invoke("save-preset", preset),
  loadPresets: () => ipcRenderer.invoke("load-presets"),
  deletePreset: (presetId: string) =>
    ipcRenderer.invoke("delete-preset", presetId),

  // Cache management
  clearThumbnailCache: () => ipcRenderer.invoke("clear-thumbnail-cache"),
  getCacheStats: () => ipcRenderer.invoke("get-cache-stats"),

  // High-quality and batch thumbnail capture
  captureHighQualityThumbnail: (windowId: string) =>
    ipcRenderer.invoke("capture-high-quality-thumbnail", windowId),
  batchCaptureThumbnails: (windowIds: string[], options?: any) =>
    ipcRenderer.invoke("batch-capture-thumbnails", windowIds, options),

  // Wrapper for compatibility
  captureWindowThumbnail: (windowId: string, options?: any) =>
    ipcRenderer.invoke("get-window-thumbnail", windowId, options),
});

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"]
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * https://tobiasahlin.com/spinkit
 * https://connoratherton.com/loaders
 * https://projects.lukehaas.me/css-loaders
 * https://matejkustec.github.io/SpinThatShit
 */
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 4999);
