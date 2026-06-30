import { app, ipcMain } from "electron";
import { createRequire } from "node:module";
import type { ProgressInfo, UpdateInfo } from "electron-updater";

type AutoUpdaterModule = typeof import("electron-updater");

let autoUpdaterModule: AutoUpdaterModule | null = null;
let autoUpdaterLoadError: Error | null = null;

function getAutoUpdater() {
  if (autoUpdaterModule) return autoUpdaterModule.autoUpdater;
  if (autoUpdaterLoadError) return null;

  try {
    const loadedModule = createRequire(import.meta.url)(
      "electron-updater",
    ) as AutoUpdaterModule;
    autoUpdaterModule = loadedModule;
    return loadedModule.autoUpdater;
  } catch (error) {
    autoUpdaterLoadError =
      error instanceof Error ? error : new Error(String(error));
    console.error("Auto updater is unavailable:", autoUpdaterLoadError);
    return null;
  }
}

export function update(win: Electron.BrowserWindow) {
  if (!app.isPackaged) {
    ipcMain.handle("check-update", async () => ({
      message: "Updates are only checked in the installed app",
      devMode: true,
    }));
    ipcMain.handle("start-download", () => ({
      success: false,
      devMode: true,
      error: "Updates are only downloaded in the installed app",
    }));
    ipcMain.handle("quit-and-install", () => ({
      success: false,
      devMode: true,
      error: "Updates are only installed in the installed app",
    }));
    return;
  }

  const autoUpdater = getAutoUpdater();

  if (!autoUpdater) {
    ipcMain.handle("check-update", async () => ({
      message: "Auto updater unavailable",
      error: {
        message:
          autoUpdaterLoadError?.message ||
          "electron-updater could not be loaded",
      },
    }));
    ipcMain.handle("start-download", () => ({
      success: false,
      error: autoUpdaterLoadError?.message || "Auto updater unavailable",
    }));
    ipcMain.handle("quit-and-install", () => ({
      success: false,
      error: autoUpdaterLoadError?.message || "Auto updater unavailable",
    }));
    return;
  }

  // When set to false, the update download will be triggered through the API
  autoUpdater.autoDownload = false;
  autoUpdater.disableWebInstaller = false;
  autoUpdater.allowDowngrade = false;

  let downloadInProgress = false;
  let updateDownloaded = false;

  // start check
  autoUpdater.on("checking-for-update", function () {});
  // update available
  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    downloadInProgress = false;
    updateDownloaded = false;
    win.webContents.send("update-can-available", {
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });
  // update not available
  autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
    downloadInProgress = false;
    updateDownloaded = false;
    win.webContents.send("update-can-available", {
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });
  autoUpdater.on("download-progress", (progressInfo: ProgressInfo) => {
    downloadInProgress = true;
    if (!win.isDestroyed()) {
      win.webContents.send("download-progress", progressInfo);
    }
  });
  autoUpdater.on("update-downloaded", (event) => {
    downloadInProgress = false;
    updateDownloaded = true;
    if (!win.isDestroyed()) {
      win.webContents.send("update-downloaded", { version: event.version });
    }
  });
  autoUpdater.on("error", (error: Error) => {
    downloadInProgress = false;
    if (!win.isDestroyed()) {
      win.webContents.send("update-error", { message: error.message, error });
    }
  });

  // Checking for updates
  ipcMain.handle("check-update", async () => {
    try {
      return await autoUpdater.checkForUpdates();
    } catch (error) {
      return { message: "Network error", error };
    }
  });

  // Start downloading and feedback on progress
  ipcMain.handle("start-download", async () => {
    if (updateDownloaded) {
      return { success: true, alreadyDownloaded: true };
    }

    if (downloadInProgress) {
      return { success: true, alreadyDownloading: true };
    }

    try {
      downloadInProgress = true;
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      downloadInProgress = false;
      const message =
        error instanceof Error ? error.message : "Download failed";
      if (!win.isDestroyed()) {
        win.webContents.send("update-error", { message, error });
      }
      return { success: false, error: message };
    }
  });

  // Install now
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
}
