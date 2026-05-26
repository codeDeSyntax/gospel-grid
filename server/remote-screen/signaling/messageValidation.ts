import type { RawData } from 'ws';
import {
  REMOTE_SCREEN_MESSAGE_TYPES,
  REMOTE_SCREEN_PROTOCOL_VERSION,
} from './constants.js';
import type {
  RemoteScreenMessage,
  RemoteScreenMessageType,
  RemoteScreenPayload,
} from './types.js';

const allowedTypes = new Set<RemoteScreenMessageType>(Object.values(REMOTE_SCREEN_MESSAGE_TYPES));

export function parseRemoteScreenMessage(data: RawData, maxMessageBytes: number): RemoteScreenMessage {
  const rawMessage = rawDataToString(data);
  const size = Buffer.byteLength(rawMessage, 'utf8');
  if (size > maxMessageBytes) {
    throw new Error('Message is too large');
  }

  const message = JSON.parse(rawMessage) as unknown;
  if (!isRecord(message)) {
    throw new Error('Message must be a JSON object');
  }

  if (typeof message.type !== 'string' || !allowedTypes.has(message.type as RemoteScreenMessageType)) {
    throw new Error('Unknown remote screen message type');
  }

  if (message.version !== REMOTE_SCREEN_PROTOCOL_VERSION) {
    throw new Error('Unsupported remote screen protocol version');
  }

  validateMessageShape(message);
  return message as RemoteScreenMessage;
}

export function createRemoteScreenMessage(
  type: RemoteScreenMessageType,
  payload: RemoteScreenPayload = {},
): string {
  return JSON.stringify({
    version: REMOTE_SCREEN_PROTOCOL_VERSION,
    type,
    ...payload,
  });
}

function validateMessageShape(message: Record<string, unknown>): void {
  switch (message.type) {
    case REMOTE_SCREEN_MESSAGE_TYPES.HELLO:
      optionalString(message.deviceId, 'deviceId');
      optionalString(message.name, 'name');
      optionalString(message.appVersion, 'appVersion');
      break;

    case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST:
      if (!hasRecord(message.request)) {
        requireString(message.toDeviceId, 'toDeviceId');
      }
      break;

    case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_ACCEPTED:
    case REMOTE_SCREEN_MESSAGE_TYPES.VIEW_REQUEST_DENIED:
      if (!hasRecord(message.request)) {
        requireString(message.requestId, 'requestId');
      }
      break;

    case REMOTE_SCREEN_MESSAGE_TYPES.SIGNAL:
    case REMOTE_SCREEN_MESSAGE_TYPES.SESSION_ENDED:
      requireString(message.toDeviceId, 'toDeviceId');
      break;
  }
}

function rawDataToString(data: RawData): string {
  if (typeof data === 'string') {
    return data;
  }

  if (Buffer.isBuffer(data)) {
    return data.toString('utf8');
  }

  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf8');
  }

  return Buffer.from(data).toString('utf8');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasRecord(value: unknown): value is Record<string, unknown> {
  return isRecord(value);
}

function requireString(value: unknown, name: string): void {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }
}

function optionalString(value: unknown, name: string): void {
  if (value !== undefined && typeof value !== 'string') {
    throw new Error(`${name} must be a string when provided`);
  }
}
