import {
  app,
  BrowserWindow,
  shell,
  dialog,
  ipcMain,
  screen,
  desktopCapturer,
  globalShortcut,
  powerSaveBlocker,
  Tray,
  Menu,
  nativeImage,
  net,
  protocol,
} from "electron";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import { config } from "dotenv";
import { update } from "./update";

import {
  focusWindow as focusWindowNative,
  minimizeWindow as minimizeWindowNative,
  getWindowIcon as getWindowIconNative,
  moveWindow as moveWindowNative,
} from "./windowEnumeration";
import {
  captureWindowThumbnail,
  captureMultipleWindowThumbnails,
  getAllWindowThumbnails,
  captureHighQualityThumbnail,
  batchCaptureThumbnails,
  clearThumbnailCache,
  getThumbnailCacheStats,
  ThumbnailOptions,
} from "./thumbnailCapture";
import { getWindowsWithThumbnails } from "./windowMapper";
import { detectInternalDisplay, detectExternalDisplay } from "./displayManager";
import { registerAssemblyAiIpc, shutdownAssemblyAiIpc } from "./assemblyAiIpc";
import { registerRemoteScreenIpc, shutdownRemoteScreenIpc } from "./remoteScreenIpc";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.join(__dirname, "../..");

// Load environment variables
const envCandidates = [
  path.join(process.cwd(), ".env"),
  path.join(appRoot, ".env"),
];

let loadedEnvPath: string | null = null;
for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false });
    loadedEnvPath = envPath;
    break;
  }
}

console.log(
  "🔧 Loading environment variables from:",
  loadedEnvPath ?? "No .env file found",
);
console.log(
  "🔑 AssemblyAI API Key loaded:",
  process.env.ASSEMBLYAI_API_KEY ? "✅ Present" : "❌ Missing",
);

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
process.env.APP_ROOT = appRoot;

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
let splashWindow: BrowserWindow | null = null;

let publishedWindows: BrowserWindow[] = []; // Track published layout windows
const publishedLayoutData = new Map<string, any>(); // Store layout data temporarily
// Map of active capture loops per published layout
const publishCaptureLoops = new Map<string, NodeJS.Timeout>();

function findPublishedLayoutEntry(displayId?: number, layoutId?: string) {
  if (layoutId) {
    const data = publishedLayoutData.get(layoutId);
    if (data) {
      return { layoutId, data };
    }
  }

  if (typeof displayId === "number") {
    for (const [entryLayoutId, data] of publishedLayoutData.entries()) {
      if (data.displayId === displayId) {
        return { layoutId: entryLayoutId, data };
      }
    }
  }

  return null;
}

// ── powerSaveBlocker — prevent display sleep while projecting ─────────────
let powerSaveBlockerId: number | null = null;

function startPowerSaveBlocker() {
  if (powerSaveBlockerId !== null) return; // already active
  powerSaveBlockerId = powerSaveBlocker.start("prevent-display-sleep");
  console.log("⚡ powerSaveBlocker started (id:", powerSaveBlockerId, ")");
}

function stopPowerSaveBlocker() {
  if (powerSaveBlockerId === null) return;
  powerSaveBlocker.stop(powerSaveBlockerId);
  console.log("⚡ powerSaveBlocker stopped (id:", powerSaveBlockerId, ")");
  powerSaveBlockerId = null;
}

// ── System Tray ───────────────────────────────────────────────────────────
let tray: Tray | null = null;

// ── Projection state (blackout / freeze / overlay) ──────────────────────────────────────
let projectionState = {
  isBlackout: false,
  isFrozen: false,
  overlayText: "",
  overlayVisible: false,
};

function buildTrayMenu() {
  const hasProjection = publishedWindows.some((w) => !w.isDestroyed());
  return Menu.buildFromTemplate([
    {
      label: "Show Windrid",
      click: () => {
        if (win && !win.isDestroyed()) {
          win.show();
          win.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: hasProjection ? "⏹ Stop Projection" : "▶ No Active Projection",
      enabled: hasProjection,
      click: () => {
        const windowsToClose = [...publishedWindows];
        publishedWindows = [];
        windowsToClose.forEach((w) => {
          if (!w.isDestroyed()) w.close();
        });
        stopPowerSaveBlocker();
        updateTrayMenu();
        // Notify renderer
        if (win && !win.isDestroyed()) {
          win.webContents.send("tray-action", "stop-projection");
        }
      },
    },
    {
      label: projectionState.isBlackout ? "✦ Blackout ON" : "Blackout",
      enabled: hasProjection,
      click: () => {
        projectionState.isBlackout = !projectionState.isBlackout;
        broadcastProjectionState();
        updateTrayMenu();
      },
    },
    {
      label: projectionState.isFrozen ? "❄ Freeze ON" : "Freeze",
      enabled: hasProjection,
      click: () => {
        projectionState.isFrozen = !projectionState.isFrozen;
        broadcastProjectionState();
        updateTrayMenu();
      },
    },
    { type: "separator" },
    {
      label: "Quit Wingrid",
      click: () => {
        stopPowerSaveBlocker();
        app.quit();
      },
    },
  ]);
}

function updateTrayMenu() {
  if (tray && !tray.isDestroyed()) {
    tray.setContextMenu(buildTrayMenu());
  }
}

function createTray() {
  try {
    const iconPath = path.join(
      process.env.VITE_PUBLIC || "public",
      "wingrid.ico",
    );
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      console.warn("⚠️ Tray icon is empty, skipping tray creation");
      return;
    }
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip("Wingrid");
    tray.setContextMenu(buildTrayMenu());
    tray.on("click", () => {
      if (win && !win.isDestroyed()) {
        win.show();
        win.focus();
      }
    });
    console.log("🔲 System tray created");
  } catch (err) {
    console.error("Failed to create system tray:", err);
  }
}

/** Helper: broadcast current projectionState to all published windows or one display */
function broadcastProjectionState(targetDisplayId?: number | null) {
  const targetWindows =
    typeof targetDisplayId === "number"
      ? publishedWindows.filter((window) => {
          const publication = [...publishedLayoutData.values()].find(
            (data) => data.windowId === window.id,
          );
          return publication?.displayId === targetDisplayId;
        })
      : publishedWindows;

  targetWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send("projection-state-changed", projectionState);
    }
  });
  if (win && !win.isDestroyed()) {
    win.webContents.send("projection-state-changed", projectionState);
  }
}

function broadcastPublishedLayoutUpdate(layoutId: string) {
  const data = publishedLayoutData.get(layoutId);
  if (!data) return;

  const targetWindows = publishedWindows.filter((window) => {
    if (window.isDestroyed()) return false;
    return data.windowId === window.id;
  });

  const payload = { layoutId, ...data };
  targetWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send("published-layout-updated", payload);
    }
  });

  if (win && !win.isDestroyed()) {
    win.webContents.send("published-layout-updated", payload);
  }
}

/**
 * NOTE: The old startContinuousCapture() IPC-based thumbnail loop has been
 * removed. Both the main window and published window now use a GPU-accelerated
 * MediaStream pipeline (getUserMedia + <video srcObject>) in the renderer
 * process. Frames are delivered directly by Chromium's compositor — no IPC
 * transfer, no base64 encoding, no React re-renders per frame.
 *
 * See: src/hooks/useMediaStreams.ts  and  src/components/dashboard/VideoWindow.tsx
 */

// IPC request debouncing for batch captures
const captureDebounceMap = new Map<
  string,
  {
    timeout: NodeJS.Timeout;
    resolvers: Array<(value: any) => void>;
    rejecters: Array<(reason: any) => void>;
  }
>();

const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  const controllerDisplay = detectInternalDisplay();

  console.log("🖥️ Main Window Display Selection:", {
    displayId: controllerDisplay.id,
    isInternal: controllerDisplay.internal,
    bounds: controllerDisplay.bounds,
  });

  const db = controllerDisplay.bounds;

  // ── 1. Splash window — centered, transparent, pure HTML, appears instantly ─
  const SPLASH_W = 460; // 420px card + shadow space
  const SPLASH_H = 310; // 270px card + shadow space
  const splashX = Math.round(db.x + (db.width  - SPLASH_W) / 2);
  const splashY = Math.round(db.y + (db.height - SPLASH_H) / 2);

  splashWindow = new BrowserWindow({
    title: "Wingrid",
    icon: path.join(process.env.VITE_PUBLIC || "public", "wingrid.ico"),
    x: splashX,
    y: splashY,
    width: SPLASH_W,
    height: SPLASH_H,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    movable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    hasShadow: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  splashWindow.setMenuBarVisibility(false);

  const splashHtml = VITE_DEV_SERVER_URL
    ? path.join(process.env.APP_ROOT || "", "public", "splash.html")
    : path.join(RENDERER_DIST, "splash.html");

  splashWindow.loadFile(splashHtml);
  splashWindow.webContents.on("did-finish-load", () => {
    splashWindow?.show();
    console.log("🪟 Splash shown");
  });

  // ── 2. Main window — hidden, loads React in background ────────────────────
  win = new BrowserWindow({
    title: "Wingrid",
    icon: path.join(process.env.VITE_PUBLIC || "public", "wingrid.ico"),
    frame: false,
    titleBarStyle: "hidden",
    x: db.x,
    y: db.y,
    width: db.width,
    height: db.height,
    show: false,
    backgroundColor: '#1d1d1d',
    webPreferences: { preload },
  });

  win.setMenuBarVisibility(false);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(indexHtml);
  }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });

  update(win);
}

// ── IPC: React app ready → crossfade splash → main window ───────────────────
ipcMain.handle("splash-ready", () => {
  if (!win || win.isDestroyed()) return;

  // Open DevTools before showing so they don't cause a flash
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Step 1: maximise & show the window fully INVISIBLE first
  win.maximize();
  win.setOpacity(0);
  win.showInactive(); // show without stealing focus or triggering a visual pop

  // Step 2: Crossfade — 30 steps × 16ms ≈ 480ms smooth fade
  const STEPS = 30;
  const INTERVAL_MS = 16;
  let step = 0;

  const fadeTimer = setInterval(() => {
    step++;
    const t = step / STEPS;
    // Cubic ease-in-out for a polished feel
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    if (!win!.isDestroyed()) win!.setOpacity(eased);
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.setOpacity(1 - eased);
    }

    if (step >= STEPS) {
      clearInterval(fadeTimer);
      if (!win!.isDestroyed()) {
        win!.setOpacity(1);
        win!.focus();
      }
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
    }
  }, INTERVAL_MS);
});

app.whenReady().then(createWindow);
registerAssemblyAiIpc();
registerRemoteScreenIpc();

app.whenReady().then(() => {
  protocol.handle("local-image", (request) => {
    try {
      const encodedPath = request.url.replace("local-image://", "");
      const decodedPath = decodeURIComponent(encodedPath);
      return net.fetch(pathToFileURL(decodedPath).toString());
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });
});

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
    icon: path.join(process.env.VITE_PUBLIC || "public", "wingrid.ico"),
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Remove the menu bar for child windows
  childWindow.setMenuBarVisibility(false);
  childWindow.maximize();

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// Window control IPC handlers
ipcMain.handle("window-minimize", (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  if (currentWindow) {
    currentWindow.minimize();

    // If this is a published window being minimized, bring main window into focus
    if (currentWindow !== win && win && !win.isDestroyed()) {
      setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.focus();
          win.show(); // Ensure main window is visible
        }
      }, 100); // Small delay to ensure minimize completes first
    }
  }
});

ipcMain.handle("window-maximize", (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  if (currentWindow) {
    if (currentWindow.isMaximized()) {
      currentWindow.unmaximize();
    } else {
      currentWindow.maximize();
    }
  }
});

ipcMain.handle("window-close", (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  if (currentWindow) {
    // If this is a published window being closed, bring main window into focus
    if (currentWindow !== win && win && !win.isDestroyed()) {
      setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.focus();
          win.show(); // Ensure main window is visible
        }
      }, 100); // Small delay to ensure close begins first
    }

    currentWindow.close();
  }
});

// Get window state
ipcMain.handle("window-is-maximized", (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  return currentWindow ? currentWindow.isMaximized() : false;
});

ipcMain.handle("window-is-minimized", (event) => {
  const currentWindow = BrowserWindow.fromWebContents(event.sender);
  return currentWindow ? currentWindow.isMinimized() : false;
});

// App relaunch handler
ipcMain.handle("app-relaunch", () => {
  app.relaunch();
  app.exit(0);
});

// Desktop capturer sources for video streaming
ipcMain.handle("get-desktop-sources", async (event, options) => {
  try {
    const sources = await desktopCapturer.getSources(options);
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      display_id: source.display_id,
      thumbnail: source.thumbnail?.isEmpty()
        ? null
        : source.thumbnail?.toDataURL(),
      appIcon: source.appIcon?.isEmpty() ? null : source.appIcon?.toDataURL(),
    }));
  } catch (error) {
    console.error("Failed to get desktop sources:", error);
    return [];
  }
});

ipcMain.handle("select-directory", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled || !result.filePaths.length) {
      return null;
    }

    return result.filePaths[0];
  } catch {
    return null;
  }
});

ipcMain.handle("get-images", async (_event, dirPath: string) => {
  try {
    if (!dirPath) return [];

    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const allowedExtensions = new Set([
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".gif",
      ".bmp",
      ".svg",
    ]);

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => allowedExtensions.has(path.extname(name).toLowerCase()))
      .slice(0, 300);

    return files.map((name) => {
      const fullPath = path.join(dirPath, name);
      const url = `local-image://${encodeURIComponent(fullPath)}`;
      return {
        name,
        path: fullPath,
        url,
      };
    });
  } catch {
    return [];
  }
});

// Connected display inventory for multi-monitor routing UI
ipcMain.handle("get-connected-displays", async () => {
  try {
    const displays = screen.getAllDisplays().map((display, index) => ({
      id: display.id,
      label: display.label || `Display ${index + 1}`,
      isPrimary: display.id === screen.getPrimaryDisplay().id,
      internal: display.internal,
      bounds: display.bounds,
      scaleFactor: display.scaleFactor,
      rotation: display.rotation,
    }));

    return { success: true, displays };
  } catch (error) {
    return {
      success: false,
      displays: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Window enumeration IPC handlers
ipcMain.handle("enumerate-windows", async (event, options) => {
  try {
    const captureThumbnails = options?.captureThumbnails !== false;
    // Capture thumbnails during enumeration so views can render immediately
    // without relying on a separate post-drop thumbnail fetch.
    const windows = await getWindowsWithThumbnails(captureThumbnails);

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
  },
);

// New handler for multiple window thumbnails
ipcMain.handle(
  "get-multiple-window-thumbnails",
  async (event, windowIds: string[], options?: ThumbnailOptions) => {
    try {
      const thumbnails = await captureMultipleWindowThumbnails(
        windowIds,
        options,
      );
      return { success: true, thumbnails };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        thumbnails: [],
      };
    }
  },
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
  },
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

// Get published layout data by ID
ipcMain.handle("get-published-layout", async (event, layoutId: string) => {
  const layoutData = publishedLayoutData.get(layoutId);
  if (!layoutData) {
    console.error("Layout data not found for ID:", layoutId);
    return null;
  }
  return layoutData;
});

ipcMain.handle("update-published-layout", async (_event, layoutData: any) => {
  try {
    const { displayId, layoutId } = layoutData ?? {};
    const entry = findPublishedLayoutEntry(displayId, layoutId);

    if (!entry) {
      return { success: false, error: "Published layout not found" };
    }

    const nextData = {
      ...entry.data,
      windows: Array.isArray(layoutData.windows) ? layoutData.windows : [],
      layout: layoutData.layout ?? entry.data.layout,
      focusedWindowId:
        layoutData.focusedWindowId ?? entry.data.focusedWindowId ?? null,
      publishedQuality:
        layoutData.publishedQuality ?? entry.data.publishedQuality,
      captureQuality: layoutData.captureQuality ?? entry.data.captureQuality,
    };

    publishedLayoutData.set(entry.layoutId, nextData);
    broadcastPublishedLayoutUpdate(entry.layoutId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Check for existing published windows
ipcMain.handle("check-published-windows", async () => {
  // Clean up destroyed windows
  publishedWindows = publishedWindows.filter((w) => !w.isDestroyed());

  const publications = [...publishedLayoutData.entries()].map(
    ([layoutId, data]) => ({
      layoutId,
      displayId: data.displayId ?? null,
      windowId: data.windowId ?? null,
      isPublished: true,
    }),
  );

  return {
    hasActivePublications: publishedWindows.length > 0,
    count: publishedWindows.length,
    publications,
  };
});

// Close all published windows or a single display-specific publication
ipcMain.handle(
  "close-published-windows",
  async (_event, displayId?: number) => {
    try {
      const windowsToClose =
        typeof displayId === "number"
          ? publishedWindows.filter((window) => {
              const match = [...publishedLayoutData.entries()].find(
                ([, data]) =>
                  data.displayId === displayId && data.windowId === window.id,
              );
              return Boolean(match);
            })
          : [...publishedWindows];

      const layoutIdsToDelete =
        typeof displayId === "number"
          ? [...publishedLayoutData.entries()]
              .filter(([, data]) => data.displayId === displayId)
              .map(([layoutId]) => layoutId)
          : [...publishedLayoutData.keys()];

      publishedWindows =
        typeof displayId === "number"
          ? publishedWindows.filter(
              (window) => !windowsToClose.includes(window),
            )
          : [];

      layoutIdsToDelete.forEach((layoutId) => {
        publishedLayoutData.delete(layoutId);
      });

      windowsToClose.forEach((window) => {
        if (!window.isDestroyed()) {
          window.close();
        }
      });

      stopPowerSaveBlocker();
      updateTrayMenu();

      return { success: true, closedCount: windowsToClose.length };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// Update quality settings and broadcast to all published windows
ipcMain.handle("update-quality-settings", async (event, settings) => {
  // Broadcast to all published windows
  publishedWindows.forEach((window) => {
    if (!window.isDestroyed()) {
      window.webContents.send("quality-settings-changed", settings);
    }
  });

  return { success: true };
});

ipcMain.handle("update-projection-state", async (event, state) => {
  if (state.isBlackout !== undefined)
    projectionState.isBlackout = state.isBlackout;
  if (state.isFrozen !== undefined) projectionState.isFrozen = state.isFrozen;
  if (state.overlayText !== undefined)
    projectionState.overlayText = state.overlayText;
  if (state.overlayVisible !== undefined)
    projectionState.overlayVisible = state.overlayVisible;

  const targetDisplayId =
    typeof state.targetDisplayId === "number" ? state.targetDisplayId : null;

  broadcastProjectionState(targetDisplayId);
  updateTrayMenu();

  return { success: true, state: projectionState };
});

// ── capturePage — snapshot the first published window for confidence monitor ──
ipcMain.handle("capture-projection-page", async () => {
  try {
    // Clean up destroyed windows first
    publishedWindows = publishedWindows.filter((w) => !w.isDestroyed());
    if (publishedWindows.length === 0) {
      return { success: false, error: "No active projection windows" };
    }
    const target = publishedWindows[0];
    const image = await target.webContents.capturePage();
    if (image.isEmpty()) {
      return { success: false, error: "Captured image is empty" };
    }
    // Resize to a sensible preview (max 640px wide) to keep IPC payload lean
    const size = image.getSize();
    const scale = Math.min(1, 640 / size.width);
    const resized =
      scale < 1
        ? image.resize({
            width: Math.round(size.width * scale),
            height: Math.round(size.height * scale),
          })
        : image;
    const dataUrl = `data:image/png;base64,${resized.toPNG().toString("base64")}`;
    return {
      success: true,
      dataUrl,
      width: resized.getSize().width,
      height: resized.getSize().height,
    };
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
    const {
      windows: selectedWindows,
      layout,
      focusedWindowId,
      publishedQuality,
      captureQuality,
      displayId,
    } = layoutData;

    // Detect target display for projection window.
    const explicitDisplay =
      typeof displayId === "number"
        ? screen.getAllDisplays().find((display) => display.id === displayId)
        : null;
    const externalDisplay = detectExternalDisplay();

    if (!explicitDisplay && !externalDisplay) {
      console.warn(
        "⚠️ No external display detected - publishing to primary display",
      );
    }

    const publishDisplay =
      explicitDisplay || externalDisplay || screen.getPrimaryDisplay();

    // If a display-specific projection already exists, replace it in place.
    if (typeof displayId === "number") {
      const existingForDisplay = publishedWindows.filter((publishedWindow) => {
        if (publishedWindow.isDestroyed()) return false;
        const bounds = publishedWindow.getBounds();
        return (
          bounds.x === publishDisplay.bounds.x &&
          bounds.y === publishDisplay.bounds.y &&
          bounds.width === publishDisplay.bounds.width &&
          bounds.height === publishDisplay.bounds.height
        );
      });

      if (existingForDisplay.length > 0) {
        existingForDisplay.forEach((publishedWindow) => {
          if (!publishedWindow.isDestroyed()) {
            publishedWindow.close();
          }
        });
        publishedWindows = publishedWindows.filter(
          (publishedWindow) => !existingForDisplay.includes(publishedWindow),
        );
      }
    }

    // Create a new fullscreen window for the published layout
    const publishWindow = new BrowserWindow({
      title: "Wingrid - Published Layout",
      icon: path.join(process.env.VITE_PUBLIC || "public", "wingrid.ico"),
      x: publishDisplay.bounds.x,
      y: publishDisplay.bounds.y,
      width: publishDisplay.bounds.width,
      height: publishDisplay.bounds.height,
      fullscreen: true,
      frame: false,
      show: true, // Show immediately instead of waiting
      backgroundColor: "#000000", // Black background for immediate display
      skipTaskbar: false, // Ensure window appears in taskbar and Alt+Tab
      focusable: true, // Make sure window can be focused and unfocused
      minimizable: true, // Allow minimizing for better window management
      webPreferences: {
        preload,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // Store layout data with a unique ID instead of passing via URL
    const layoutId = `layout-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    publishedLayoutData.set(layoutId, {
      windows: selectedWindows,
      layout,
      focusedWindowId,
      displayId: displayId ?? null,
      windowId: publishWindow.id,
      isPublished: true,
      publishedQuality: publishedQuality || { contrast: 1.0, brightness: 1.0 },
      captureQuality: captureQuality || 80,
    });

    console.log("Loading window with layout ID...", { layoutId });

    // Focus the window
    publishWindow.focus();

    if (VITE_DEV_SERVER_URL) {
      await publishWindow.loadURL(
        `${VITE_DEV_SERVER_URL}?layoutId=${layoutId}`,
      );
      publishWindow.webContents.openDevTools();
    } else {
      await publishWindow.loadFile(indexHtml, {
        query: { layoutId: layoutId },
      });
    }

    // Handle window ready and closed events
    publishWindow.once("ready-to-show", () => {
      console.log("Published window ready, ensuring focus...");
      // Force focus and bring to front
      publishWindow.show();
      publishWindow.focus();
      publishWindow.moveTop();
    });

    publishWindow.webContents.once("did-finish-load", () => {
      console.log(
        "Published window content loaded - using GPU-accelerated MediaStream pipeline (renderer-side getUserMedia)",
      );

      // No main-process capture loop needed — the published window's renderer
      // creates its own MediaStreams via useMediaStreams hook, just like the
      // main window. Frames travel GPU → Chromium compositor → <video> element
      // without ever crossing IPC.

      // Additional focus insurance after content loads
      setTimeout(() => {
        if (!publishWindow.isDestroyed()) {
          publishWindow.focus();
          publishWindow.moveTop();
        }
      }, 500);

      // Add keyboard shortcuts for better window management
      publishWindow.webContents.on("before-input-event", (event, input) => {
        if (input.key === "Escape" && input.type === "keyDown") {
          publishWindow.setFullScreen(false);
        }
        if (input.key === "F4" && input.alt && input.type === "keyDown") {
          publishWindow.close();
        }
      });
    });

    // Handle window closed — clean up resources
    publishWindow.on("closed", () => {
      publishedLayoutData.delete(layoutId);
      publishedWindows = publishedWindows.filter((w) => w !== publishWindow);
      const loop = publishCaptureLoops.get(layoutId);
      if (loop) {
        clearInterval(loop);
        publishCaptureLoops.delete(layoutId);
      }
      // If no projection windows remain, release power blocker
      const aliveCount = publishedWindows.filter(
        (w) => !w.isDestroyed(),
      ).length;
      if (aliveCount === 0) stopPowerSaveBlocker();
      updateTrayMenu();
    });

    // Add to tracking array
    publishedWindows.push(publishWindow);

    // Start powerSaveBlocker on first projection open
    startPowerSaveBlocker();
    updateTrayMenu();

    return { success: true, windowId: publishWindow.id };
  } catch (error) {
    console.error("Failed to publish layout:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Cache management handlers
ipcMain.handle("clear-thumbnail-cache", async () => {
  try {
    clearThumbnailCache();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("get-cache-stats", async () => {
  try {
    const stats = getThumbnailCacheStats();
    return { success: true, stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// High-quality thumbnail capture for published layouts
ipcMain.handle(
  "capture-high-quality-thumbnail",
  async (event, windowId: string) => {
    try {
      const thumbnail = await captureHighQualityThumbnail(windowId);
      return {
        success: true,
        thumbnail,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// Batch thumbnail capture with throttling and debouncing
ipcMain.handle(
  "batch-capture-thumbnails",
  async (event, windowIds: string[], options: ThumbnailOptions = {}) => {
    // Create a unique key for this request based on window IDs
    const key = windowIds.sort().join(",");

    // Return a promise that will be resolved when the debounced capture completes
    return new Promise((resolve, reject) => {
      // If there's an existing debounce entry, add to its resolvers
      const existing = captureDebounceMap.get(key);

      if (existing) {
        // Clear the existing timeout and add this resolver to the list
        clearTimeout(existing.timeout);
        existing.resolvers.push(resolve);
        existing.rejecters.push(reject);
      } else {
        // Create new debounce entry
        captureDebounceMap.set(key, {
          timeout: null as any,
          resolvers: [resolve],
          rejecters: [reject],
        });
      }

      // Get the current entry
      const entry = captureDebounceMap.get(key)!;

      // Set up debounced execution
      entry.timeout = setTimeout(async () => {
        try {
          const thumbnails = await batchCaptureThumbnails(windowIds, options);
          const result = { success: true, thumbnails };

          // Resolve all pending promises
          entry.resolvers.forEach((r) => r(result));
        } catch (error) {
          const errorResult = {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };

          // Reject all pending promises
          entry.rejecters.forEach((r) => r(errorResult));
        } finally {
          // Clean up
          captureDebounceMap.delete(key);
        }
      }, 300); // 300ms debounce window — lets rapid IPC calls coalesce
    });
  },
);

// Preset storage functionality
interface SavedPreset {
  id: string;
  name: string;
  windowCount: number;
  createdAt: string;
  windows: Array<{
    id: string; // Native desktopCapturer source ID (e.g., "window:853982:0")
    name: string; // Full window title
    app: string; // Extracted app name (e.g., "Code", "Chrome")
    sourceId?: string; // Original desktopCapturer source ID
    handle?: number; // Window handle
  }>;
}

const getPresetsFilePath = () => {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "presets.json");
};

// Save preset to file
ipcMain.handle("save-preset", async (event, preset: SavedPreset) => {
  try {
    const presetsFile = getPresetsFilePath();
    let presets: SavedPreset[] = [];

    // Load existing presets
    try {
      const data = await fs.readFile(presetsFile, "utf-8");
      presets = JSON.parse(data);
    } catch (error) {
      // File doesn't exist or is invalid, start with empty array
      console.log("Starting with new presets file");
    }

    // Check if preset with same ID already exists
    const existingIndex = presets.findIndex((p) => p.id === preset.id);
    if (existingIndex >= 0) {
      // Replace existing preset
      presets[existingIndex] = preset;
    } else {
      // Add new preset
      presets.push(preset);
    }

    // Save back to file
    await fs.writeFile(presetsFile, JSON.stringify(presets, null, 2), "utf-8");

    console.log(`Preset "${preset.name}" saved successfully`);
    return { success: true };
  } catch (error) {
    console.error("Failed to save preset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Load presets from file
ipcMain.handle("load-presets", async () => {
  try {
    const presetsFile = getPresetsFilePath();
    const data = await fs.readFile(presetsFile, "utf-8");
    const presets: SavedPreset[] = JSON.parse(data);

    console.log(`Loaded ${presets.length} presets from storage`);
    return { success: true, presets };
  } catch (error) {
    // File doesn't exist or is invalid
    console.log("No presets file found, returning empty array");
    return { success: true, presets: [] };
  }
});

// Delete preset from file
ipcMain.handle("delete-preset", async (event, presetId: string) => {
  try {
    const presetsFile = getPresetsFilePath();
    let presets: SavedPreset[] = [];

    // Load existing presets
    try {
      const data = await fs.readFile(presetsFile, "utf-8");
      presets = JSON.parse(data);
    } catch (error) {
      return { success: false, error: "No presets file found" };
    }

    // Filter out the preset to delete
    const initialLength = presets.length;
    presets = presets.filter((p) => p.id !== presetId);

    if (presets.length === initialLength) {
      return { success: false, error: "Preset not found" };
    }

    // Save back to file
    await fs.writeFile(presetsFile, JSON.stringify(presets, null, 2), "utf-8");

    console.log(`Preset "${presetId}" deleted successfully`);
    return { success: true };
  } catch (error) {
    console.error("Failed to delete preset:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// ── Global Hotkeys ──────────────────────────────────────────────────────────
// Register global shortcuts that work even when the app is not focused.
// Actions are forwarded to the main window renderer via IPC.

function broadcastHotkey(action: string) {
  // Send to main window
  if (win && !win.isDestroyed()) {
    win.webContents.send("global-hotkey", action);
  }
}

function registerGlobalHotkeys() {
  const shortcuts: Record<string, string> = {
    F5: "toggle-projection",
    F6: "toggle-blackout",
    F7: "toggle-freeze",
    F8: "clear-all",
  };

  for (const [accelerator, action] of Object.entries(shortcuts)) {
    const success = globalShortcut.register(accelerator, () => {
      broadcastHotkey(action);
    });
    if (!success) {
      console.warn(`⚠️ Failed to register global shortcut: ${accelerator}`);
    }
  }

  console.log(
    "⌨️ Global hotkeys registered:",
    Object.keys(shortcuts).join(", "),
  );
}

app.whenReady().then(() => {
  registerGlobalHotkeys();
  createTray();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopPowerSaveBlocker();
  void shutdownAssemblyAiIpc();
  void shutdownRemoteScreenIpc();
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }
});
