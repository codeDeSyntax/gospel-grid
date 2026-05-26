import crypto from 'node:crypto';
import type { ViewRequest, ViewRequestStatus } from './types.js';

interface ViewRequestStoreOptions {
  pendingRequestTtlMs: number;
}

interface CreateViewRequestInput {
  fromDeviceId: string;
  toDeviceId: string;
}

export class ViewRequestStore {
  private readonly pendingRequestTtlMs: number;
  private readonly requests = new Map<string, ViewRequest>();

  constructor({ pendingRequestTtlMs }: ViewRequestStoreOptions) {
    this.pendingRequestTtlMs = pendingRequestTtlMs;
  }

  create({ fromDeviceId, toDeviceId }: CreateViewRequestInput): ViewRequest {
    const now = Date.now();
    const request: ViewRequest = {
      id: crypto.randomUUID(),
      fromDeviceId,
      toDeviceId,
      status: 'pending',
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.pendingRequestTtlMs).toISOString(),
    };

    this.requests.set(request.id, request);
    return request;
  }

  resolve(requestId: string, status: Extract<ViewRequestStatus, 'accepted' | 'denied'>): ViewRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'pending') {
      return null;
    }

    if (Date.parse(request.expiresAt) < Date.now()) {
      request.status = 'expired';
      return null;
    }

    request.status = status;
    request.resolvedAt = new Date().toISOString();
    return request;
  }

  removeByDevice(deviceId: string): void {
    for (const [requestId, request] of this.requests) {
      if (request.fromDeviceId === deviceId || request.toDeviceId === deviceId) {
        this.requests.delete(requestId);
      }
    }
  }

  removeBetween(firstDeviceId: string, secondDeviceId: string): void {
    for (const [requestId, request] of this.requests) {
      const sameDirection =
        request.fromDeviceId === firstDeviceId &&
        request.toDeviceId === secondDeviceId;
      const reverseDirection =
        request.fromDeviceId === secondDeviceId &&
        request.toDeviceId === firstDeviceId;

      if (sameDirection || reverseDirection) {
        this.requests.delete(requestId);
      }
    }
  }
}
