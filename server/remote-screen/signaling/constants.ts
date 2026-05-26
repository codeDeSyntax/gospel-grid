import type { RemoteScreenMessageType } from './types.js';

export const REMOTE_SCREEN_PROTOCOL_VERSION = 1;

export const REMOTE_SCREEN_MESSAGE_TYPES = {
  HELLO: 'hello',
  DEVICE_LIST: 'device_list',
  VIEW_REQUEST: 'view_request',
  VIEW_REQUEST_ACCEPTED: 'view_request_accepted',
  VIEW_REQUEST_DENIED: 'view_request_denied',
  SIGNAL: 'signal',
  SESSION_ENDED: 'session_ended',
  ERROR: 'error',
} as const satisfies Record<string, RemoteScreenMessageType>;

export const REMOTE_SCREEN_DEFAULTS = {
  host: process.env.REMOTE_SCREEN_HOST || '0.0.0.0',
  port: Number.parseInt(process.env.REMOTE_SCREEN_PORT || '3011', 10),
  maxMessageBytes: 64 * 1024,
  pendingRequestTtlMs: 60 * 1000,
} as const;
