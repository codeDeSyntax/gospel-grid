import crypto from 'node:crypto';
import type { ViewRequest, ViewRequestStatus } from './types.js';

/**
 * After PC B accepts, PC A has this long to echo back the confirmation token.
 * Kept short (30 s) so a stale or replayed accept cannot be confirmed later.
 */
const CONFIRM_WINDOW_MS = 30_000;

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
      confirmationToken: crypto.randomBytes(24).toString('hex'),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.pendingRequestTtlMs).toISOString(),
    };

    this.requests.set(request.id, request);
    return request;
  }

  /**
   * PC B accepts the request. Advances status to 'accepted' and records the
   * time-window inside which PC A must confirm.
   */
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

    if (status === 'accepted') {
      // Shrink the expiry to the confirmation window so the token cannot be
      // replayed after PC A takes too long to confirm.
      request.expiresAt = new Date(Date.now() + CONFIRM_WINDOW_MS).toISOString();
    }

    return request;
  }

  /**
   * PC A confirms intent by echoing the confirmation token back to the server.
   * Returns the request if the token is valid and the window has not expired,
   * null otherwise.
   */
  confirm(requestId: string, token: string): ViewRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'accepted') {
      return null;
    }

    if (Date.parse(request.expiresAt) < Date.now()) {
      request.status = 'expired';
      return null;
    }

    // Constant-time comparison prevents timing-based token guessing.
    const expected = Buffer.from(request.confirmationToken, 'hex');
    const provided = Buffer.from(token, 'hex');
    if (
      expected.length !== provided.length ||
      !crypto.timingSafeEqual(expected, provided)
    ) {
      return null;
    }

    request.status = 'confirmed';
    return request;
  }

  /**
   * Marks the request as fully ready (PC B has acknowledged the confirmation).
   */
  markReady(requestId: string): ViewRequest | null {
    const request = this.requests.get(requestId);
    if (!request || request.status !== 'confirmed') {
      return null;
    }

    request.status = 'ready';
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
