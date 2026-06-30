import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  DesktopCaptureSource,
  RemoteScreenDevice,
  RemoteScreenViewRequest,
} from "@/types/electron";

type RemoteSignalMessage = {
  type: "signal";
  fromDeviceId?: string;
  toDeviceId: string;
  payload?: RemoteSignalPayload;
};

type RemoteSignalPayload =
  | {
      kind: "offer";
      description: RTCSessionDescriptionInit;
    }
  | {
      kind: "answer";
      description: RTCSessionDescriptionInit;
    }
  | {
      kind: "ice-candidate";
      candidate: RTCIceCandidateInit;
    };

export type RemoteSession = {
  deviceId: string;
  deviceName: string;
  role: "viewer" | "sharer";
  state: RTCPeerConnectionState | "starting" | "ended";
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
};

export type RemoteWebRtcController = {
  sessions: RemoteSession[];
  activeRemoteStream: MediaStream | null;
  lastError: string | null;
  startSharingForRequest: (
    request: RemoteScreenViewRequest,
    source: Pick<DesktopCaptureSource, "id" | "name">,
  ) => Promise<{ success: boolean; error?: string }>;
  closePeer: (deviceId: string, notify?: boolean) => void;
};

type PeerEntry = {
  peer: RTCPeerConnection;
  role: "viewer" | "sharer";
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  deviceName: string;
  shareSource?: Pick<DesktopCaptureSource, "id" | "name">;
  reconnectTimer?: ReturnType<typeof setTimeout>;
  iceRestartTimer?: ReturnType<typeof setTimeout>;
};

const peerConfig: RTCConfiguration = {
  iceServers: [],
};

async function getDesktopCaptureStream(
  source: Pick<DesktopCaptureSource, "id">,
): Promise<MediaStream> {
  if (!source.id) {
    throw new Error("Select a screen or window before sharing.");
  }

  return navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: source.id,
        maxWidth: 1920,
        maxHeight: 1080,
        maxFrameRate: 30,
      },
    } as MediaTrackConstraints,
  });
}

export function useRemoteWebRtc(): RemoteWebRtcController {
  const peersRef = useRef(new Map<string, PeerEntry>());
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const remoteScreenApi = window.electronAPI?.remoteScreen;

  const publishSessions = useCallback(() => {
    setSessions(
      Array.from(peersRef.current.entries()).map(([deviceId, entry]) => ({
        deviceId,
        deviceName: entry.deviceName,
        role: entry.role,
        state: entry.peer.connectionState || "starting",
        remoteStream: entry.remoteStream,
        localStream: entry.localStream,
      })),
    );
  }, []);

  const closePeer = useCallback(
    (deviceId: string, notify = true) => {
      const entry = peersRef.current.get(deviceId);
      if (!entry) return;

      if (entry.reconnectTimer) {
        clearTimeout(entry.reconnectTimer);
      }
      if (entry.iceRestartTimer) {
        clearTimeout(entry.iceRestartTimer);
      }
      entry.localStream?.getTracks().forEach((track) => track.stop());
      entry.remoteStream?.getTracks().forEach((track) => track.stop());
      entry.peer.close();
      peersRef.current.delete(deviceId);

      if (notify) {
        void remoteScreenApi?.endSession(deviceId, "closed");
      }

      publishSessions();
    },
    [publishSessions, remoteScreenApi],
  );

  const restartOffer = useCallback(
    async (deviceId: string) => {
      const entry = peersRef.current.get(deviceId);
      if (!entry || entry.role !== "sharer") return;
      if (entry.peer.signalingState !== "stable") return;

      try {
        entry.peer.restartIce();
        const offer = await entry.peer.createOffer({ iceRestart: true });
        await entry.peer.setLocalDescription(offer);
        await remoteScreenApi?.sendSignal(deviceId, {
          kind: "offer",
          description: offer,
        } satisfies RemoteSignalPayload);
        setLastError(null);
      } catch (error) {
        setLastError(
          error instanceof Error
            ? error.message
            : "Failed to restart remote screen connection.",
        );
      } finally {
        publishSessions();
      }
    },
    [publishSessions, remoteScreenApi],
  );

  const createPeer = useCallback(
    (device: RemoteScreenDevice, role: "viewer" | "sharer") => {
      closePeer(device.id, false);

      const peer = new RTCPeerConnection(peerConfig);
      const entry: PeerEntry = {
        peer,
        role,
        localStream: null,
        remoteStream: null,
        deviceName: device.name,
      };

      peersRef.current.set(device.id, entry);

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          void remoteScreenApi?.sendSignal(device.id, {
            kind: "ice-candidate",
            candidate: event.candidate.toJSON(),
          } satisfies RemoteSignalPayload);
        }
      };

      peer.ontrack = (event) => {
        const [stream] = event.streams;
        if (!stream) return;

        entry.remoteStream = stream;
        publishSessions();
      };

      peer.onconnectionstatechange = () => {
        if (entry.iceRestartTimer) {
          clearTimeout(entry.iceRestartTimer);
        }

        if (peer.connectionState === "disconnected") {
          entry.iceRestartTimer = setTimeout(() => {
            if (peer.connectionState !== "disconnected") return;
            if (entry.role === "sharer") {
              void restartOffer(device.id);
            }
          }, 2500);
        }

        if (peer.connectionState === "failed") {
          if (entry.role === "sharer") {
            void restartOffer(device.id);
          }
          publishSessions();
          return;
        }

        if (peer.connectionState === "closed") {
          publishSessions();
          return;
        }

        publishSessions();
      };

      publishSessions();
      return entry;
    },
    [closePeer, publishSessions, remoteScreenApi, restartOffer],
  );

  const restartLocalCapture = useCallback(
    async (deviceId: string) => {
      const entry = peersRef.current.get(deviceId);
      if (!entry?.shareSource || entry.role !== "sharer") return;
      if (entry.peer.connectionState === "closed") return;

      try {
        const nextStream = await getDesktopCaptureStream(entry.shareSource);
        const [nextTrack] = nextStream.getVideoTracks();
        const sender = entry.peer
          .getSenders()
          .find((candidate) => candidate.track?.kind === "video");

        if (!nextTrack || !sender) {
          nextStream.getTracks().forEach((track) => track.stop());
          throw new Error("Could not restart the selected share source.");
        }

        await sender.replaceTrack(nextTrack);
        entry.localStream?.getTracks().forEach((track) => track.stop());
        entry.localStream = nextStream;
        nextTrack.onended = () => {
          entry.reconnectTimer = setTimeout(() => {
            void restartLocalCapture(deviceId);
          }, 900);
        };
        setLastError(null);
        publishSessions();
      } catch (error) {
        setLastError(
          error instanceof Error
            ? error.message
            : "Remote screen source ended and could not be restarted.",
        );
        publishSessions();
      }
    },
    [publishSessions],
  );

  const startSharingForRequest = useCallback(
    async (
      request: RemoteScreenViewRequest,
      source: Pick<DesktopCaptureSource, "id" | "name">,
    ) => {
      if (!request.fromDevice) {
        setLastError("Requesting device is no longer available.");
        return { success: false, error: "Requesting device is no longer available." };
      }

      if (!remoteScreenApi) {
        setLastError("Remote screen API is not available.");
        return { success: false, error: "Remote screen API is not available." };
      }

      try {
        const localStream = await getDesktopCaptureStream(source);

        const entry = createPeer(request.fromDevice, "sharer");
        entry.deviceName = `${request.fromDevice.name} -> ${source.name}`;
        entry.shareSource = source;
        entry.localStream = localStream;
        localStream.getTracks().forEach((track) => {
          entry.peer.addTrack(track, localStream);
          track.onended = () => {
            entry.reconnectTimer = setTimeout(() => {
              void restartLocalCapture(request.fromDevice!.id);
            }, 900);
          };
        });

        // acceptViewRequest is no longer called here. The new two-step protocol
        // means PC B receives view_request_ready only after the server has
        // verified PC A's confirmation token, so by the time startSharingForRequest
        // is invoked the request is already fully confirmed on the server side.
        const offer = await entry.peer.createOffer();
        await entry.peer.setLocalDescription(offer);
        await remoteScreenApi.sendSignal(request.fromDevice.id, {
          kind: "offer",
          description: offer,
        } satisfies RemoteSignalPayload);

        setLastError(null);
        publishSessions();
        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to start screen sharing.";
        setLastError(message);
        return { success: false, error: message };
      }
    },
    [
      closePeer,
      createPeer,
      publishSessions,
      remoteScreenApi,
      restartLocalCapture,
    ],
  );

  const handleOffer = useCallback(
    async (
      fromDeviceId: string,
      payload: Extract<RemoteSignalPayload, { kind: "offer" }>,
    ) => {
      const device: RemoteScreenDevice = {
        id: fromDeviceId,
        name: fromDeviceId,
        appVersion: "unknown",
        connectedAt: "",
        lastSeenAt: "",
      };
      const entry = createPeer(device, "viewer");
      await entry.peer.setRemoteDescription(payload.description);
      const answer = await entry.peer.createAnswer();
      await entry.peer.setLocalDescription(answer);
      await remoteScreenApi?.sendSignal(fromDeviceId, {
        kind: "answer",
        description: answer,
      } satisfies RemoteSignalPayload);
      publishSessions();
    },
    [createPeer, publishSessions, remoteScreenApi],
  );

  const handleSignal = useCallback(
    async (message: RemoteSignalMessage) => {
      const fromDeviceId = message.fromDeviceId;
      const payload = message.payload;
      if (!fromDeviceId || !payload) return;

      try {
        if (payload.kind === "offer") {
          await handleOffer(fromDeviceId, payload);
          return;
        }

        const entry = peersRef.current.get(fromDeviceId);
        if (!entry) return;

        if (payload.kind === "answer") {
          await entry.peer.setRemoteDescription(payload.description);
          publishSessions();
          return;
        }

        if (payload.kind === "ice-candidate") {
          await entry.peer.addIceCandidate(payload.candidate);
        }
      } catch (error) {
        setLastError(
          error instanceof Error
            ? error.message
            : "Failed to process WebRTC signaling message.",
        );
      }
    },
    [handleOffer, publishSessions],
  );

  useEffect(() => {
    const offSignal = remoteScreenApi?.onSignal((signal) => {
      void handleSignal(signal as RemoteSignalMessage);
    });

    const offSessionEnded = remoteScreenApi?.onSessionEnded((event) => {
      const payload = event as { fromDeviceId?: string };
      if (payload.fromDeviceId) {
        closePeer(payload.fromDeviceId, false);
      }
    });

    return () => {
      offSignal?.();
      offSessionEnded?.();
    };
  }, [closePeer, handleSignal, remoteScreenApi]);

  useEffect(() => {
    return () => {
      for (const deviceId of peersRef.current.keys()) {
        closePeer(deviceId, false);
      }
    };
  }, [closePeer]);

  return useMemo(
    () => ({
      sessions,
      activeRemoteStream:
        sessions.find((session) => session.remoteStream)?.remoteStream ?? null,
      lastError,
      startSharingForRequest,
      closePeer,
    }),
    [sessions, lastError, startSharingForRequest, closePeer],
  );
}
