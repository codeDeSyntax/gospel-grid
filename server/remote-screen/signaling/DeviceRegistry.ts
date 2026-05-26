import crypto from 'node:crypto';
import type WebSocket from 'ws';
import type { DeviceProfile, PublicDevice, RegisteredDevice } from './types.js';

export class DeviceRegistry {
  private readonly devices = new Map<string, RegisteredDevice>();

  register(connection: WebSocket, profile: DeviceProfile): PublicDevice {
    const deviceId = profile.deviceId || crypto.randomUUID();
    const now = new Date().toISOString();
    const device: RegisteredDevice = {
      id: deviceId,
      name: sanitizeDeviceName(profile.name),
      appVersion: profile.appVersion || 'unknown',
      connectedAt: now,
      lastSeenAt: now,
      connection,
    };

    this.devices.set(deviceId, device);
    return toPublicDevice(device);
  }

  touch(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.lastSeenAt = new Date().toISOString();
    }
  }

  unregister(deviceId: string): void {
    this.devices.delete(deviceId);
  }

  get(deviceId: string): RegisteredDevice | null {
    return this.devices.get(deviceId) || null;
  }

  listPublicDevices(): PublicDevice[] {
    return Array.from(this.devices.values()).map(toPublicDevice);
  }
}

function toPublicDevice(device: RegisteredDevice): PublicDevice {
  return {
    id: device.id,
    name: device.name,
    appVersion: device.appVersion,
    connectedAt: device.connectedAt,
    lastSeenAt: device.lastSeenAt,
  };
}

function sanitizeDeviceName(value: unknown): string {
  if (typeof value !== 'string') {
    return 'Unknown Wingrid Device';
  }

  return value.trim().slice(0, 80) || 'Unknown Wingrid Device';
}
