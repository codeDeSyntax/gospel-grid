import type { RemoteScreenMessageType } from './types.js';

export const REMOTE_SCREEN_PROTOCOL_VERSION = 1;

export const REMOTE_SCREEN_MESSAGE_TYPES = {
  HELLO: 'hello',
  DEVICE_LIST: 'device_list',
  VIEW_REQUEST: 'view_request',
  VIEW_REQUEST_ACCEPTED: 'view_request_accepted',
  VIEW_REQUEST_DENIED: 'view_request_denied',
  /** Sent by PC A (the requester) after receiving view_request_accepted, echoing the confirmation token. */
  VIEW_REQUEST_CONFIRM: 'view_request_confirm',
  /** Sent by the server to PC B (the sharer) after PC A's confirmation token is verified. */
  VIEW_REQUEST_READY: 'view_request_ready',
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
