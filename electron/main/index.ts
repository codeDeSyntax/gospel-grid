import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { update } from "./update";
import {
  enumerateWindows,
  focusWindow as focusWindowNative,
  minimizeWindow as minimizeWindowNative,
  getWindowIcon as getWindowIconNative,
  moveWindow as moveWindowNative,
} from "./windowEnumeration";
import {
  captureWindowThumbnail,
  captureMultipleWindowThumbnails,
  getAllWindowThumbnails,
  ThumbnailOptions,
} from "./thumbnailCapture";
import { getWindowsWithThumbnails } from "./windowMapper";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "StreamSpire",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    frame: false, // Remove default title bar
    titleBarStyle: "hidden", // Hide title bar while keeping window controls
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  // Remove the menu bar
  win.setMenuBarVisibility(false);

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  // Auto update
  update(win);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    frame: false, // Remove default title bar for child windows too
    titleBarStyle: "hidden",
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Remove the menu bar for child windows
  childWindow.setMenuBarVisibility(false);

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// Window control IPC handlers
ipcMain.handle("window-minimize", () => {
  if (win) {
    win.minimize();
  }
});

ipcMain.handle("window-maximize", () => {
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle("window-close", () => {
  if (win) {
    win.close();
  }
});

// Get window state
ipcMain.handle("window-is-maximized", () => {
  return win ? win.isMaximized() : false;
});

ipcMain.handle("window-is-minimized", () => {
  return win ? win.isMinimized() : false;
});

// Window enumeration IPC handlers
ipcMain.handle("enumerate-windows", async (event, options) => {
  try {
    console.log(
      "Main process: enumerate-windows called with options:",
      options
    );

    // Use the new window mapper that provides direct thumbnail access
    const windows = await getWindowsWithThumbnails();

    console.log("Main process: enumerated windows count:", windows.length);
    console.log("Main process: first few windows:", windows.slice(0, 3));
    return { success: true, windows };
  } catch (error) {
    console.error("Failed to enumerate windows:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("focus-window", async (event, handle) => {
  try {
    const success = await focusWindowNative(handle);
    return { success };
  } catch (error) {
    console.error("Failed to focus window:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("minimize-window-external", async (event, handle) => {
  try {
    const success = await minimizeWindowNative(handle);
    return { success };
  } catch (error) {
    console.error("Failed to minimize window:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("get-window-icon", async (event, handle) => {
  try {
    const icon = await getWindowIconNative(handle);
    return { success: true, icon };
  } catch (error) {
    console.error("Failed to get window icon:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("move-window-external", async (event, handle, bounds) => {
  try {
    const success = await moveWindowNative(handle, bounds);
    return { success };
  } catch (error) {
    console.error("Failed to move window:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle(
  "get-window-thumbnail",
  async (event, windowId: string, options?: ThumbnailOptions) => {
    try {
      const thumbnail = await captureWindowThumbnail(windowId, options);
      if (thumbnail) {
        return { success: true, thumbnail };
      } else {
        return { success: false, error: "Failed to capture thumbnail" };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
);

// New handler for multiple window thumbnails
ipcMain.handle(
  "get-multiple-window-thumbnails",
  async (event, windowIds: string[], options?: ThumbnailOptions) => {
    try {
      const thumbnails = await captureMultipleWindowThumbnails(
        windowIds,
        options
      );
      return { success: true, thumbnails };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        thumbnails: [],
      };
    }
  }
);

// New handler for all window thumbnails
ipcMain.handle(
  "get-all-window-thumbnails",
  async (event, options?: ThumbnailOptions) => {
    try {
      const results = await getAllWindowThumbnails(options);
      return { success: true, results };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        results: [],
      };
    }
  }
);

ipcMain.handle("maximize-window-external", async (event, handle) => {
  try {
    // Placeholder - would implement window maximization
    return { success: false, error: "Not implemented yet" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("close-window-external", async (event, handle) => {
  try {
    // Placeholder - would close external window
    return { success: false, error: "Not implemented yet" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("show-window-external", async (event, handle) => {
  try {
    // Placeholder - would show window
    return { success: false, error: "Not implemented yet" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("hide-window-external", async (event, handle) => {
  try {
    // Placeholder - would hide window
    return { success: false, error: "Not implemented yet" };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Publish layout handler - creates a new fullscreen window with the layout
ipcMain.handle("publish-layout", async (event, layoutData) => {
  try {
    console.log("Received publish-layout request:", layoutData);
    const { windows: selectedWindows, layout, focusedWindowId } = layoutData;

    console.log("Creating new publish window...");
    // Create a new fullscreen window for the published layout
    const publishWindow = new BrowserWindow({
      title: "StreamSpire - Published Layout",
      width: 1920,
      height: 1080,
      fullscreen: true,
      frame: false,
      show: true, // Show immediately instead of waiting
      backgroundColor: "#000000", // Black background for immediate display
      webPreferences: {
        preload,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Load the same app but pass layout data via query params
    const layoutQuery = encodeURIComponent(
      JSON.stringify({
        windows: selectedWindows,
        layout,
        focusedWindowId,
        isPublished: true,
      })
    );

    console.log("Loading window with layout data...", { layoutQuery });

    // Focus the window immediately
    publishWindow.focus();
    publishWindow.setAlwaysOnTop(true, "screen-saver");

    if (VITE_DEV_SERVER_URL) {
      await publishWindow.loadURL(
        `${VITE_DEV_SERVER_URL}?layout=${layoutQuery}`
      );
    } else {
      await publishWindow.loadFile(indexHtml, {
        query: { layout: layoutQuery },
      });
    } // Handle window ready and closed events
    publishWindow.once("ready-to-show", () => {
      console.log("Published window ready, ensuring focus...");
      publishWindow.setAlwaysOnTop(false); // Remove always on top after loading
      publishWindow.focus();
    });

    publishWindow.webContents.once("did-finish-load", () => {
      console.log("Published window content loaded");
    });

    // Handle window closed
    publishWindow.on("closed", () => {
      console.log("Published layout window closed");
    });

    console.log("Published window created successfully");
    return { success: true, windowId: publishWindow.id };
  } catch (error) {
    console.error("Failed to publish layout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
