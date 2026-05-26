import { createServer, type Server as HttpServer } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
import { DeviceRegistry } from './DeviceRegistry.js';
import { ViewRequestStore } from './ViewRequestStore.js';
import {
  REMOTE_SCREEN_DEFAULTS,
  REMOTE_SCREEN_MESSAGE_TYPES,
} from './constants.js';
import {
  createRemoteScreenMessage,
  parseRemoteScreenMessage,
} from './messageValidation.js';
import type {
  PublicDevice,
  RemoteScreenMessage,
  RemoteScreenMessageType,
  RemoteScreenPayload,
} from './types.js';

interface RemoteScreenSignalingServerOptions {
  host?: string;
  port?: number;
  maxMessageBytes?: number;
  pendingRequestTtlMs?: number;
}

export class RemoteScreenSignalingServer {
  private readonly host: string;
  private readonly port: number;
  private readonly maxMessageBytes: number;
  private readonly devices = new DeviceRegistry();
  private readonly requests: ViewRequestStore;
  private readonly server: HttpServer;
  private readonly wss: WebSocketServer;
  private isListening = false;

  constructor(options: RemoteScreenSignalingServerOptions = {}) {
    this.host = options.host || REMOTE_SCREEN_DEFAULTS.host;
    this.port = options.port || REMOTE_SCREEN_DEFAULTS.port;
    this.maxMessageBytes = options.maxMessageBytes || REMOTE_SCREEN_DEFAULTS.maxMessageBytes;
    this.requests = new ViewRequestStore({
      pendingRequestTtlMs: options.pendingRequestTtlMs || REMOTE_SCREEN_DEFAULTS.pendingRequestTtlMs,
    });

    this.server = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({
          service: 'remote-screen-signaling',
          status: 'healthy',
          devices: this.devices.listPublicDevices().length,
          timestamp: new Date().toISOString(),
        }));
        return;
      }

      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    });

    this.wss = new WebSocketServer({ server: this.server });
    this.setupWebSocket();
  }

  private setupWebSocket(): void {
    this.wss.on('connection', (ws, request) => {
      let deviceId: string | null = null;

      ws.on('message', (data) => {
        try {
          const message = parseRemoteScreenMessage(data, this.maxMessageBytes);

          if (message.type === REMOTE_SCREEN_MESSAGE_TYPES.HELLO) {
            const publicDevice = this.devices.register(ws, {
              deviceId: message.deviceId,
              name: message.name,
              appVersion: message.appVersion,
            });
            deviceId = publicDevice.id;

            this.send(ws, REMOTE_SCREEN_MESSAGE_TYPES.HELLO, {
              device: publicDevice,
              serverTime: new Date().toISOString(),
            });
            this.broadcastDeviceList();
            return;
          }

          if (!deviceId) {
            throw new Error('Device must send hello before other messages');
          }

          this.devices.touch(deviceId);
          this.routeAuthenticatedMessage(deviceId, message);
        } catch (error) {
          this.send(ws, REMOTE_SCREEN_MESSAGE_TYPES.ERROR, {
            error: error instanceof Error ? error.message : 'Failed to process message',
          });
        }
      });

      ws.on('close', () => {
        if (deviceId) {
          this.devices.unregister(deviceId);
          this.requests.removeByDevice(deviceId);
          this.broadcastDeviceList();
        }
      });

      ws.on('error', (error) => {
        console.error('Remote screen WebSocket error:', {
          remoteAddress: request.socket.remoteAddress,
          error: error.message,
        });
      });
    });
  }

  private routeAuthenticatedMessage(fromDeviceId: string, message: RemoteScreenMessage): void {
    switch (message.type) {
      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST:
        this.handleViewRequest(fromDeviceId, message);
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_ACCEPTED:
      case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_DENIED:
        this.handleViewRequestResolution(fromDeviceId, message);
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.SIGNAL:
        this.forwardToDevice(fromDeviceId, message.toDeviceId, message);
        break;

      case REMOTE_SCREEN_MESSAGE_TYPES.SESSION_ENDED:
        this.handleSessionEnded(fromDeviceId, message);
        break;

      default:
        throw new Error('Remote screen message is not allowed in this state');
    }
  }

  private handleViewRequest(fromDeviceId: string, message: Extract<RemoteScreenMessage, { type: 'view_request' }>): void {
    if (!message.toDeviceId) {
      throw new Error('Target device is required');
    }

    const target = this.devices.get(message.toDeviceId);
    if (!target) {
      throw new Error('Target device is not available');
    }

    const request = this.requests.create({
      fromDeviceId,
      toDeviceId: message.toDeviceId,
    });

    this.send(target.connection, REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST, {
      request,
      fromDevice: this.publicDevice(fromDeviceId),
    });
  }

  private handleViewRequestResolution(
    fromDeviceId: string,
    message: Extract<RemoteScreenMessage, { type: 'view_request_accepted' | 'view_request_denied' }>,
  ): void {
    if (!message.requestId) {
      throw new Error('Request ID is required');
    }

    const status = message.type === REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_ACCEPTED
      ? 'accepted'
      : 'denied';
    const request = this.requests.resolve(message.requestId, status);

    if (!request || request.toDeviceId !== fromDeviceId) {
      throw new Error('View request is no longer valid');
    }

    const requester = this.devices.get(request.fromDeviceId);
    if (!requester) {
      throw new Error('Requesting device is no longer available');
    }

    this.send(requester.connection, message.type, {
      request,
      fromDevice: this.publicDevice(fromDeviceId),
    });
  }

  private forwardToDevice(fromDeviceId: string, toDeviceId: string, message: RemoteScreenMessage): void {
    const target = this.devices.get(toDeviceId);
    if (!target) {
      throw new Error('Target device is not available');
    }

    this.send(target.connection, message.type, {
      ...message,
      fromDeviceId,
    });
  }

  private handleSessionEnded(fromDeviceId: string, message: Extract<RemoteScreenMessage, { toDeviceId: string }>): void {
    if (!message.toDeviceId) {
      throw new Error('Target device is required');
    }

    this.requests.removeBetween(fromDeviceId, message.toDeviceId);
    this.forwardToDevice(fromDeviceId, message.toDeviceId, message);
  }

  private broadcastDeviceList(): void {
    const payload = {
      devices: this.devices.listPublicDevices(),
    };

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        this.send(client, REMOTE_SCREEN_MESSAGE_TYPES.DEVICE_LIST, payload);
      }
    }
  }

  private publicDevice(deviceId: string): PublicDevice | null {
    const device = this.devices.get(deviceId);
    if (!device) {
      return null;
    }

    return {
      id: device.id,
      name: device.name,
      appVersion: device.appVersion,
      connectedAt: device.connectedAt,
      lastSeenAt: device.lastSeenAt,
    };
  }

  private send(ws: WebSocket, type: RemoteScreenMessageType, payload: RemoteScreenPayload): void {
    if (ws.readyState !== WebSocket.OPEN) {
      return;
    }

    ws.send(createRemoteScreenMessage(type, payload));
  }

  start(): Promise<void> {
    if (this.isListening) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const onError = (error: Error) => {
        this.server.off('error', onError);
        reject(error);
      };

      this.server.once('error', onError);
      this.server.listen(this.port, this.host, () => {
        this.server.off('error', onError);
        this.isListening = true;
        console.log('Remote screen signaling server started.');
        console.log(`HTTP health: http://${this.host}:${this.port}/health`);
        console.log(`WebSocket signaling: ws://${this.host}:${this.port}`);
        console.log('Remote viewing still requires explicit approval from the sharing device.');
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isListening) {
        resolve();
        return;
      }

      for (const client of this.wss.clients) {
        client.close();
      }

      this.wss.close((webSocketError) => {
        if (webSocketError) {
          reject(webSocketError);
          return;
        }

        this.server.close((serverError) => {
          if (serverError) {
            reject(serverError);
            return;
          }

          this.isListening = false;
          resolve();
        });
      });
    });
  }

  getStatus(): {
    isRunning: boolean;
    host: string;
    port: number;
    devices: PublicDevice[];
  } {
    return {
      isRunning: this.isListening,
      host: this.host,
      port: this.port,
      devices: this.devices.listPublicDevices(),
    };
  }
}
