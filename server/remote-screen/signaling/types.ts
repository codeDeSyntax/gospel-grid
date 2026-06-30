import type WebSocket from 'ws';

export type RemoteScreenMessageType =
  | 'hello'
  | 'device_list'
  | 'view_request'
  | 'view_request_accepted'
  | 'view_request_denied'
  | 'view_request_confirm'
  | 'view_request_ready'
  | 'signal'
  | 'session_ended'
  | 'error';

export interface PublicDevice {
  id: string;
  name: string;
  appVersion: string;
  connectedAt: string;
  lastSeenAt: string;
}

export interface RegisteredDevice extends PublicDevice {
  connection: WebSocket;
}

export interface DeviceProfile {
  deviceId?: string;
  name?: string;
  appVersion?: string;
}

export type ViewRequestStatus = 'pending' | 'accepted' | 'denied' | 'expired' | 'confirmed' | 'ready';

export interface ViewRequest {
  id: string;
  fromDeviceId: string;
  toDeviceId: string;
  status: ViewRequestStatus;
  /** One-time token sent to PC A with view_request_accepted; PC A must echo it back in view_request_confirm. */
  confirmationToken: string;
  createdAt: string;
  expiresAt: string;
  resolvedAt?: string;
}

export type RemoteScreenMessage =
  | {
      version: number;
      type: 'hello';
      deviceId?: string;
      name?: string;
      appVersion?: string;
      device?: PublicDevice;
      serverTime?: string;
    }
  | {
      version: number;
      type: 'device_list';
      devices: PublicDevice[];
    }
  | {
      version: number;
      type: 'view_request';
      toDeviceId?: string;
      request?: ViewRequest;
      fromDevice?: PublicDevice | null;
    }
  | {
      version: number;
      type: 'view_request_accepted' | 'view_request_denied';
      requestId?: string;
      request?: ViewRequest;
      fromDevice?: PublicDevice | null;
      /** Confirmation token included in view_request_accepted so PC A can echo it back. */
      confirmationToken?: string;
    }
  | {
      version: number;
      type: 'view_request_confirm';
      requestId?: string;
      confirmationToken?: string;
    }
  | {
      version: number;
      type: 'view_request_ready';
      request?: ViewRequest;
      fromDevice?: PublicDevice | null;
    }
  | {
      version: number;
      type: 'signal' | 'session_ended';
      toDeviceId: string;
      fromDeviceId?: string;
      payload?: unknown;
    }
  | {
      version: number;
      type: 'error';
      error: string;
    };

export type RemoteScreenPayload = Record<string, unknown>;
