import dgram, { type RemoteInfo, type Socket } from "node:dgram";
import os from "node:os";
import { EventEmitter } from "node:events";

const DISCOVERY_PROTOCOL = "wingrid.remote-screen.discovery.v1";
const DISCOVERY_PORT = 3012;
const BROADCAST_ADDRESS = "255.255.255.255";
const ANNOUNCE_INTERVAL_MS = 5000;
const PEER_TTL_MS = 15000;

export type RemoteScreenDiscoveredDevice = {
  deviceId: string;
  name: string;
  appVersion: string;
  address: string;
  signalingPort: number;
  connectUrl: string;
  lastSeenAt: string;
};

type DiscoveryMessage = {
  protocol: typeof DISCOVERY_PROTOCOL;
  type: "probe" | "announce";
  deviceId: string;
  name: string;
  appVersion: string;
  signalingPort: number;
  timestamp: number;
};

type RemoteScreenDiscoveryEvents = {
  devices: [RemoteScreenDiscoveredDevice[]];
  error: [string];
};

type DiscoveryStartOptions = {
  deviceId: string;
  name: string;
  appVersion: string;
  signalingPort: number;
};

export class RemoteScreenDiscoveryService extends EventEmitter {
  private socket: Socket | null = null;
  private announceTimer: NodeJS.Timeout | null = null;
  private pruneTimer: NodeJS.Timeout | null = null;
  private options: DiscoveryStartOptions | null = null;
  private peers = new Map<string, RemoteScreenDiscoveredDevice>();

  override on<K extends keyof RemoteScreenDiscoveryEvents>(
    event: K,
    listener: (...args: RemoteScreenDiscoveryEvents[K]) => void,
  ): this {
    return super.on(event, listener);
  }

  override emit<K extends keyof RemoteScreenDiscoveryEvents>(
    event: K,
    ...args: RemoteScreenDiscoveryEvents[K]
  ): boolean {
    return super.emit(event, ...args);
  }

  start(options: DiscoveryStartOptions): Promise<void> {
    this.options = options;

    if (this.socket) {
      this.broadcastProbe();
      this.broadcastAnnouncement();
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket({ type: "udp4", reuseAddr: true });
      this.socket = socket;

      socket.on("error", (error) => {
        this.emit("error", error.message);
      });

      socket.on("message", (buffer, remote) => {
        this.handleMessage(buffer, remote);
      });

      socket.bind(DISCOVERY_PORT, () => {
        try {
          socket.setBroadcast(true);
          this.broadcastProbe();
          this.broadcastAnnouncement();
          this.startTimers();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  stop(): void {
    if (this.announceTimer) {
      clearInterval(this.announceTimer);
      this.announceTimer = null;
    }

    if (this.pruneTimer) {
      clearInterval(this.pruneTimer);
      this.pruneTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.peers.clear();
    this.publishDevices();
  }

  getDevices(): RemoteScreenDiscoveredDevice[] {
    return Array.from(this.peers.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }

  refresh(): void {
    this.broadcastProbe();
    this.broadcastAnnouncement();
    this.pruneExpiredPeers();
  }

  private startTimers(): void {
    this.announceTimer ??= setInterval(() => {
      this.broadcastAnnouncement();
    }, ANNOUNCE_INTERVAL_MS);

    this.pruneTimer ??= setInterval(() => {
      this.pruneExpiredPeers();
    }, ANNOUNCE_INTERVAL_MS);
  }

  private handleMessage(buffer: Buffer, remote: RemoteInfo): void {
    const message = parseDiscoveryMessage(buffer);
    if (!message || !this.options) {
      return;
    }

    if (message.deviceId === this.options.deviceId) {
      return;
    }

    if (message.type === "probe") {
      this.sendAnnouncement(remote.address, remote.port);
      return;
    }

    const now = new Date().toISOString();
    this.peers.set(message.deviceId, {
      deviceId: message.deviceId,
      name: sanitizeName(message.name),
      appVersion: message.appVersion || "unknown",
      address: remote.address,
      signalingPort: message.signalingPort,
      connectUrl: `ws://${remote.address}:${message.signalingPort}`,
      lastSeenAt: now,
    });
    this.publishDevices();
  }

  private broadcastProbe(): void {
    this.sendMessage({ type: "probe" }, BROADCAST_ADDRESS, DISCOVERY_PORT);
  }

  private broadcastAnnouncement(): void {
    this.sendAnnouncement(BROADCAST_ADDRESS, DISCOVERY_PORT);
  }

  private sendAnnouncement(address: string, port: number): void {
    this.sendMessage({ type: "announce" }, address, port);
  }

  private sendMessage(
    partial: Pick<DiscoveryMessage, "type">,
    address: string,
    port: number,
  ): void {
    if (!this.socket || !this.options) {
      return;
    }

    const message: DiscoveryMessage = {
      protocol: DISCOVERY_PROTOCOL,
      type: partial.type,
      deviceId: this.options.deviceId,
      name: this.options.name,
      appVersion: this.options.appVersion,
      signalingPort: this.options.signalingPort,
      timestamp: Date.now(),
    };

    const payload = Buffer.from(JSON.stringify(message), "utf8");
    this.socket.send(payload, port, address);

    for (const broadcast of getSubnetBroadcastAddresses()) {
      if (broadcast !== address) {
        this.socket.send(payload, port, broadcast);
      }
    }
  }

  private pruneExpiredPeers(): void {
    const now = Date.now();
    let changed = false;

    for (const [deviceId, peer] of this.peers) {
      if (now - Date.parse(peer.lastSeenAt) > PEER_TTL_MS) {
        this.peers.delete(deviceId);
        changed = true;
      }
    }

    if (changed) {
      this.publishDevices();
    }
  }

  private publishDevices(): void {
    this.emit("devices", this.getDevices());
  }
}

function parseDiscoveryMessage(buffer: Buffer): DiscoveryMessage | null {
  try {
    const parsed = JSON.parse(buffer.toString("utf8")) as Partial<DiscoveryMessage>;
    if (parsed.protocol !== DISCOVERY_PROTOCOL) return null;
    if (parsed.type !== "probe" && parsed.type !== "announce") return null;
    if (!parsed.deviceId || !parsed.signalingPort) return null;

    return parsed as DiscoveryMessage;
  } catch {
    return null;
  }
}

function sanitizeName(value: unknown): string {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, 80)
    : "Unknown Wingrid Device";
}

function getSubnetBroadcastAddresses(): string[] {
  const addresses = new Set<string>();

  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const entry of interfaces ?? []) {
      if (entry.family !== "IPv4" || entry.internal || !entry.address || !entry.netmask) {
        continue;
      }

      addresses.add(calculateBroadcastAddress(entry.address, entry.netmask));
    }
  }

  return Array.from(addresses);
}

function calculateBroadcastAddress(address: string, netmask: string): string {
  const addressParts = address.split(".").map(Number);
  const maskParts = netmask.split(".").map(Number);

  return addressParts
    .map((part, index) => {
      const mask = maskParts[index] ?? 0;
      return (part & mask) | (~mask & 255);
    })
    .join(".");
}
