# Wingrid Remote Screen Service

This folder is reserved for Wingrid's remote screen viewing feature. It is intentionally separate from `server/audio-transcription` so transcription, device discovery, signaling, and future media streaming code do not become tangled.

Signaling files live in `signaling/` and are written in TypeScript. This folder does not own a package, TypeScript config, or compiled output; it is checked by the root project config.

## Current Scope

- Maintains a list of connected Wingrid devices.
- Relays explicit screen-view requests between devices.
- Relays WebRTC signaling messages after a request has been accepted.
- Refuses oversized or unknown messages.
- Does not start screen capture automatically.

## Security Rules

- Remote viewing must be approval-based.
- A device must introduce itself with a protocol `hello` message before any other action.
- The signaling server does not capture, store, or inspect screen media.
- WebRTC media exchange should happen only after `view_request_accepted`.
- Add pairing/PIN verification before enabling unattended or cross-network access.

## Check

```bash
pnpm run check:remote-screen
```
