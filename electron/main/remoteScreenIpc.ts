import { app, BrowserWindow, ipcMain, type WebContents } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import os from "node:os";
import {
  RemoteScreenSignalingServer,
} from "../../server/remote-screen/signaling/RemoteScreenSignalingServer";
import type { PublicDevice } from "../../server/remote-screen/signaling/types";
import {
  RemoteScreenClient,
  type RemoteScreenClientStatus,
} from "./remoteScreenClient";
import {
  RemoteScreenDiscoveryService,
  type RemoteScreenDiscoveredDevice,
} from "./remoteScreenDiscovery";

type RemoteScreenStatus = {
  isRunning: boolean;
  host: string;
  port: number;
  devices: PublicDevice[];
  client: RemoteScreenClientStatus;
  nearbyDevices: RemoteScreenDiscoveredDevice[];
};

type RemoteScreenStartOptions = {
  host?: string;
  port?: number;
};

let registered = false;
let signalingServer: RemoteScreenSignalingServer | null = null;
let remoteClient: RemoteScreenClient | null = null;
let discoveryService: RemoteScreenDiscoveryService | null = null;
let activeTarget: WebContents | null = null;
let deviceIdPromise: Promise<string> | null = null;

function sendToRenderer(channel: string, payload: unknown) {
  if (activeTarget && !activeTarget.isDestroyed()) {
    activeTarget.send(channel, payload);
    return;
  }

  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
}

function getStatus(): RemoteScreenStatus {
  const client = remoteClient?.getStatus() ?? {
    isConnected: false,
    isConnecting: false,
    serverUrl: null,
    localDevice: null,
    devices: [],
    lastError: null,
  };

  if (!signalingServer) {
    return {
      isRunning: false,
      host: "0.0.0.0",
      port: 3011,
      devices: client.devices,
      client,
      nearbyDevices: discoveryService?.getDevices() ?? [],
    };
  }

  const serverStatus = signalingServer.getStatus();
  return {
    ...serverStatus,
    devices: client.devices,
    client,
    nearbyDevices: discoveryService?.getDevices() ?? [],
  };
}

function publishStatus() {
  sendToRenderer("remote-screen:status-changed", getStatus());
}

function getDeviceIdFilePath() {
  return path.join(app.getPath("userData"), "remote-screen-device.json");
}

async function getStableDeviceId() {
  if (deviceIdPromise) {
    return deviceIdPromise;
  }

  deviceIdPromise = (async () => {
    const filePath = getDeviceIdFilePath();

    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as { deviceId?: string };
      if (parsed.deviceId) {
        return parsed.deviceId;
      }
    } catch {
      // Create a new identity below.
    }

    const deviceId = crypto.randomUUID();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify({ deviceId }, null, 2), "utf8");
    return deviceId;
  })();

  return deviceIdPromise;
}

function getRemoteClient() {
  if (remoteClient) {
    return remoteClient;
  }

  remoteClient = new RemoteScreenClient();
  remoteClient.on("status", publishStatus);
  remoteClient.on("devices", (devices) => {
    sendToRenderer("remote-screen:devices-changed", devices);
    publishStatus();
  });
  remoteClient.on("incomingRequest", (request) => {
    sendToRenderer("remote-screen:incoming-request", request);
  });
  remoteClient.on("requestAccepted", (request) => {
    sendToRenderer("remote-screen:request-accepted", request);
  });
  remoteClient.on("requestDenied", (request) => {
    sendToRenderer("remote-screen:request-denied", request);
  });
  remoteClient.on("signal", (signal) => {
    sendToRenderer("remote-screen:signal", signal);
  });
  remoteClient.on("sessionEnded", (event) => {
    sendToRenderer("remote-screen:session-ended", event);
  });

  return remoteClient;
}

function getDiscoveryService() {
  if (discoveryService) {
    return discoveryService;
  }

  discoveryService = new RemoteScreenDiscoveryService();
  discoveryService.on("devices", (devices) => {
    sendToRenderer("remote-screen:nearby-devices-changed", devices);
    publishStatus();
  });
  discoveryService.on("error", (error) => {
    sendToRenderer("remote-screen:discovery-error", { error });
  });
  return discoveryService;
}

async function connectLocalClient(host: string, port: number) {
  const deviceId = await getStableDeviceId();
  const client = getRemoteClient();
  const serverHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  const serverUrl = `ws://${serverHost}:${port}`;

  await client.connect({
    serverUrl,
    deviceId,
    name: `${os.hostname() || "This PC"} (${app.getName()})`,
    appVersion: app.getVersion(),
  });
}

async function startDiscovery(signalingPort: number) {
  const deviceId = await getStableDeviceId();
  await getDiscoveryService().start({
    deviceId,
    name: `${os.hostname() || "This PC"} (${app.getName()})`,
    appVersion: app.getVersion(),
    signalingPort,
  });
}

async function connectClientToServer(serverUrl: string) {
  const deviceId = await getStableDeviceId();
  const client = getRemoteClient();

  await client.connect({
    serverUrl,
    deviceId,
    name: `${os.hostname() || "This PC"} (${app.getName()})`,
    appVersion: app.getVersion(),
  });
}

export function registerRemoteScreenIpc() {
  if (registered) return;
  registered = true;

  ipcMain.handle("remote-screen:get-status", async () => {
    return { success: true, status: getStatus() };
  });

  ipcMain.handle(
    "remote-screen:start-signaling",
    async (event, options?: RemoteScreenStartOptions) => {
      activeTarget = event.sender;

      try {
        if (!signalingServer) {
          signalingServer = new RemoteScreenSignalingServer({
            host: options?.host,
            port: options?.port,
          });
        }

        await signalingServer.start();
        await startDiscovery(options?.port || 3011);
        await connectLocalClient(
          options?.host || "0.0.0.0",
          options?.port || 3011,
        );
        publishStatus();
        return { success: true, status: getStatus() };
      } catch (error) {
        signalingServer = null;
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to start remote screen signaling.",
        };
      }
    },
  );

  ipcMain.handle("remote-screen:stop-signaling", async () => {
    try {
      if (signalingServer) {
        await signalingServer.stop();
        signalingServer = null;
      }
      remoteClient?.disconnect();
      discoveryService?.stop();

      publishStatus();
      return { success: true, status: getStatus() };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to stop remote screen signaling.",
      };
    }
  });

  ipcMain.handle("remote-screen:list-devices", async () => {
    return { success: true, devices: getStatus().client.devices };
  });

  ipcMain.handle("remote-screen:list-nearby-devices", async () => {
    discoveryService?.refresh();
    return {
      success: true,
      devices: discoveryService?.getDevices() ?? [],
    };
  });

  ipcMain.handle(
    "remote-screen:connect-client",
    async (event, payload?: { serverUrl?: string }) => {
      activeTarget = event.sender;

      try {
        const serverUrl = payload?.serverUrl?.trim();
        if (!serverUrl || !serverUrl.startsWith("ws://")) {
          return {
            success: false,
            error: "Enter a local WebSocket address like ws://192.168.1.20:3011.",
          };
        }

        await connectClientToServer(serverUrl);
        publishStatus();
        return { success: true, status: getStatus() };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to connect to remote signaling server.",
        };
      }
    },
  );

  ipcMain.handle("remote-screen:disconnect-client", async () => {
    remoteClient?.disconnect();
    publishStatus();
    return { success: true, status: getStatus() };
  });

  ipcMain.handle(
    "remote-screen:request-view",
    async (_event, payload?: { deviceId?: string }) => {
      try {
        if (!payload?.deviceId) {
          return { success: false, error: "Target device is required." };
        }

        getRemoteClient().requestView(payload.deviceId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to request remote screen access.",
        };
      }
    },
  );

  ipcMain.handle(
    "remote-screen:accept-view-request",
    async (_event, payload?: { requestId?: string }) => {
      try {
        if (!payload?.requestId) {
          return { success: false, error: "Request ID is required." };
        }

        getRemoteClient().acceptViewRequest(payload.requestId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to accept remote screen request.",
        };
      }
    },
  );

  ipcMain.handle(
    "remote-screen:deny-view-request",
    async (_event, payload?: { requestId?: string }) => {
      try {
        if (!payload?.requestId) {
          return { success: false, error: "Request ID is required." };
        }

        getRemoteClient().denyViewRequest(payload.requestId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to deny remote screen request.",
        };
      }
    },
  );

  ipcMain.handle(
    "remote-screen:send-signal",
    async (_event, payload?: { deviceId?: string; signal?: unknown }) => {
      try {
        if (!payload?.deviceId) {
          return { success: false, error: "Target device is required." };
        }

        getRemoteClient().sendSignal(payload.deviceId, payload.signal);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to send WebRTC signaling message.",
        };
      }
    },
  );

  ipcMain.handle(
    "remote-screen:end-session",
    async (_event, payload?: { deviceId?: string; reason?: string }) => {
      try {
        if (!payload?.deviceId) {
          return { success: false, error: "Target device is required." };
        }

        getRemoteClient().endSession(payload.deviceId, {
          reason: payload.reason || "ended",
        });
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to end remote screen session.",
        };
      }
    },
  );
}

export async function shutdownRemoteScreenIpc() {
  remoteClient?.disconnect();
  remoteClient = null;
  discoveryService?.stop();
  discoveryService = null;

  if (!signalingServer) {
    return;
  }

  await signalingServer.stop();
  signalingServer = null;
}
