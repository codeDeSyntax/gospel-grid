import { app, ipcMain } from "electron";
import { createRequire } from "node:module";
import type {
  ProgressInfo,
  UpdateDownloadedEvent,
  UpdateInfo,
} from "electron-updater";

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

  // start check
  autoUpdater.on("checking-for-update", function () {});
  // update available
  autoUpdater.on("update-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: true,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });
  // update not available
  autoUpdater.on("update-not-available", (arg: UpdateInfo) => {
    win.webContents.send("update-can-available", {
      update: false,
      version: app.getVersion(),
      newVersion: arg?.version,
    });
  });

  // Checking for updates
  ipcMain.handle("check-update", async () => {
    try {
      return await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      return { message: "Network error", error };
    }
  });

  // Start downloading and feedback on progress
  ipcMain.handle("start-download", (event: Electron.IpcMainInvokeEvent) => {
    startDownload(
      (error, progressInfo) => {
        if (error) {
          // feedback download error message
          event.sender.send("update-error", { message: error.message, error });
        } else {
          // feedback update progress message
          event.sender.send("download-progress", progressInfo);
        }
      },
      () => {
        // feedback update downloaded message
        event.sender.send("update-downloaded");
      },
    );
  });

  // Install now
  ipcMain.handle("quit-and-install", () => {
    autoUpdater.quitAndInstall(false, true);
  });
}

function startDownload(
  callback: (error: Error | null, info: ProgressInfo | null) => void,
  complete: (event: UpdateDownloadedEvent) => void,
) {
  const autoUpdater = getAutoUpdater();
  if (!autoUpdater) {
    callback(
      autoUpdaterLoadError ?? new Error("Auto updater unavailable"),
      null,
    );
    return;
  }

  autoUpdater.on("download-progress", (info: ProgressInfo) =>
    callback(null, info),
  );
  autoUpdater.on("error", (error: Error) => callback(error, null));
  autoUpdater.on("update-downloaded", complete);
  autoUpdater.downloadUpdate();
}
