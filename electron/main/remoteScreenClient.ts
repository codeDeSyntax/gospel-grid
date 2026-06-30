import { EventEmitter } from "node:events";
import os from "node:os";
import WebSocket from "ws";
import {
  REMOTE_SCREEN_DEFAULTS,
  REMOTE_SCREEN_MESSAGE_TYPES,
  REMOTE_SCREEN_PROTOCOL_VERSION,
} from "../../server/remote-screen/signaling/constants";
import {
  parseRemoteScreenMessage,
} from "../../server/remote-screen/signaling/messageValidation";
import type {
  PublicDevice,
  RemoteScreenMessage,
  ViewRequest,
} from "../../server/remote-screen/signaling/types";

export type RemoteScreenClientStatus = {
  isConnected: boolean;
  isConnecting: boolean;
  serverUrl: string | null;
  localDevice: PublicDevice | null;
  devices: PublicDevice[];
  lastError: string | null;
};

export type RemoteScreenIncomingRequest = {
  request: ViewRequest;
  fromDevice: PublicDevice | null;
};

type RemoteScreenClientEvents = {
  status: [RemoteScreenClientStatus];
  devices: [PublicDevice[]];
  incomingRequest: [RemoteScreenIncomingRequest];
  requestAccepted: [RemoteScreenIncomingRequest];
  requestDenied: [RemoteScreenIncomingRequest];
  /** Fired on PC B when PC A has successfully confirmed; sharing can now begin. */
  requestReady: [RemoteScreenIncomingRequest];
  signal: [RemoteScreenMessage];
  sessionEnded: [RemoteScreenMessage];
};

type ConnectOptions = {
  serverUrl: string;
  deviceId: string;
  name?: string;
  appVersion: string;
  timeoutMs?: number;
};

const DEFAULT_CONNECT_TIMEOUT_MS = 8000;

export class RemoteScreenClient extends EventEmitter {
  private socket: WebSocket | null = null;
  private localDevice: PublicDevice | null = null;
  private deviceId: string | null = null;
  private deviceName = os.hostname() || "Wingrid Device";
  private appVersion = "unknown";
  private serverUrl: string | null = null;
  private devices: PublicDevice[] = [];
  private isConnecting = false;
  private lastError: string | null = null;

  override on<K extends keyof RemoteScreenClientEvents>(
    event: K,
    listener: (...args: RemoteScreenClientEvents[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof RemoteScreenClientEvents>(
    event: K,
    ...args: RemoteScreenClientEvents[K]
  ): boolean {
    return super.emit(event, ...args);
  }

  connect(options: ConnectOptions): Promise<RemoteScreenClientStatus> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      if (this.serverUrl === options.serverUrl) {
        return Promise.resolve(this.getStatus());
      }

      this.disconnect();
    }

    if (this.socket) {
      this.disconnect();
    }

    this.serverUrl = options.serverUrl;
    this.deviceId = options.deviceId;
    this.deviceName = options.name?.trim() || this.deviceName;
    this.appVersion = options.appVersion;
    this.isConnecting = true;
    this.lastError = null;
    this.publishStatus();

    return new Promise((resolve, reject) => {
      const socket = new WebSocket(options.serverUrl);
      this.socket = socket;
      let settled = false;
      let timeout: NodeJS.Timeout;

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        this.lastError = error.message;
        this.isConnecting = false;
        this.publishStatus();
        socket.close();
        reject(error);
      };

      const succeed = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(this.getStatus());
      };

      timeout = setTimeout(() => {
        fail(
          new Error(
            `Could not connect to ${options.serverUrl}. Check that both PCs are on the same network and Windows Firewall allows Wingrid on private networks.`,
          ),
        );
      }, options.timeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS);

      socket.on("open", () => {
        this.send(REMOTE_SCREEN_MESSAGE_TYPES.HELLO, {
          deviceId: this.deviceId,
          name: this.deviceName,
          appVersion: this.appVersion,
        });
      });

      socket.on("message", (data) => {
        try {
          const message = parseRemoteScreenMessage(
            data,
            REMOTE_SCREEN_DEFAULTS.maxMessageBytes,
          );
          this.handleMessage(message);

          if (message.type === REMOTE_SCREEN_MESSAGE_TYPES.HELLO) {
            succeed();
          }
        } catch (error) {
          this.lastError =
            error instanceof Error ? error.message : "Invalid remote screen message.";
          this.publishStatus();
        }
      });

      socket.on("close", () => {
        if (this.socket !== socket) {
          return;
        }

        if (!settled && this.isConnecting) {
          fail(new Error(`Connection to ${options.serverUrl} closed before setup completed.`));
          return;
        }

        this.socket = null;
        this.localDevice = null;
        this.devices = [];
        this.isConnecting = false;
        this.serverUrl = null;
        this.publishStatus();
      });

      socket.on("error", (error) => {
        if (this.socket !== socket) {
          return;
        }

        fail(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.localDevice = null;
    this.devices = [];
    this.isConnecting = false;
    this.serverUrl = null;
    this.publishStatus();
  }

  requestView(toDeviceId: string): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST, { toDeviceId });
  }

  acceptViewRequest(requestId: string): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_ACCEPTED, { requestId });
  }

  denyViewRequest(requestId: string): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_DENIED, { requestId });
  }

  /**
   * PC A calls this after the user confirms they still want to proceed.
   * The token was received in the view_request_accepted message and must be
   * echoed back verbatim so the server can verify it.
   */
  confirmView(requestId: string, confirmationToken: string): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_CONFIRM, { requestId, confirmationToken });
  }

  sendSignal(toDeviceId: string, payload: unknown): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.SIGNAL, { toDeviceId, payload });
  }

  endSession(toDeviceId: string, payload?: unknown): void {
    this.ensureConnected();
    this.send(REMOTE_SCREEN_MESSAGE_TYPES.SESSION_ENDED, { toDeviceId, payload });
  }

  getStatus(): RemoteScreenClientStatus {
    return {
      isConnected: this.socket?.readyState === WebSocket.OPEN && Boolean(this.localDevice),
      isConnecting: this.isConnecting,
      serverUrl: this.serverUrl,
      localDevice: this.localDevice,
      devices: this.devices,
      lastError: this.lastError,
    };
  }

  private handleMessage(message: RemoteScreenMessage): void {
    switch (message.type) {
      case REMOTE_SCREEN_MESSAGE_TYPES.HELLO:
        this.localDevice = message.device || null;
        this.isConnecting = false;
        this.lastError = null;
        this.publishStatus();
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.DEVICE_LIST:
        this.devices = message.devices.filter(
          (device) => device.id !== this.localDevice?.id,
        );
        this.emit("devices", this.devices);
        this.publishStatus();
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST:
        if (message.request) {
          this.emit("incomingRequest", {
            request: message.request,
            fromDevice: message.fromDevice || null,
          });
        }
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_ACCEPTED:
        if (message.request) {
          // Attach the one-time token so the IPC layer can pass it to the renderer
          // and the user-confirm step can echo it back.
          const acceptedRequest = message.confirmationToken
            ? { ...message.request, confirmationToken: message.confirmationToken }
            : message.request;
          this.emit("requestAccepted", {
            request: acceptedRequest,
            fromDevice: message.fromDevice || null,
          });
        }
        this.publishStatus();
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_DENIED:
        if (message.request) {
          this.emit("requestDenied", {
            request: message.request,
            fromDevice: message.fromDevice || null,
          });
        }
        this.publishStatus();
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_READY:
        if (message.request) {
          this.emit("requestReady", {
            request: message.request,
            fromDevice: message.fromDevice || null,
          });
        }
        this.publishStatus();
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.SIGNAL:
        this.emit("signal", message);
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.SESSION_ENDED:
        this.emit("sessionEnded", message);
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.ERROR:
        this.lastError = message.error;
        this.publishStatus();
        break;
    }
  }

  private send(type: RemoteScreenMessage["type"], payload: Record<string, unknown>) {
    const socket = this.getOpenSocket();
    socket.send(
      JSON.stringify({
        version: REMOTE_SCREEN_PROTOCOL_VERSION,
        type,
        ...payload,
      }),
    );
  }

  private ensureConnected(): void {
    this.getOpenSocket();
    if (!this.localDevice) {
      throw new Error("Remote screen client is not connected.");
    }
  }

  private getOpenSocket(): WebSocket {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("Remote screen client socket is not open.");
    }

    return this.socket;
  }

  private publishStatus(): void {
    this.emit("status", this.getStatus());
  }
}
