import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MediaStreamEntry {
  stream: MediaStream;
  sourceId: string;
  status: "active" | "reconnecting" | "failed";
  retryCount: number;
}

export interface UseMediaStreamsOptions {
  /** Max capture width per window (default 1920) */
  maxWidth?: number;
  /** Max capture height per window (default 1080) */
  maxHeight?: number;
  /** Max frame rate (default 30) */
  maxFrameRate?: number;
  /** Max reconnection attempts per window (default 5) */
  retryLimit?: number;
  /** Base reconnect delay in ms (default 800) */
  retryDelayMs?: number;
  /** Enable/disable the streams (default true) */
  enabled?: boolean;
}

export type StreamStatus = "pending" | "active" | "reconnecting" | "failed";

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * High-performance MediaStream hook for live window capture.
 *
 * Instead of polling desktopCapturer.getSources() and transferring base64
 * strings, this hook creates one getUserMedia() MediaStream per window.
 * Chromium delivers frames straight from the GPU compositor into <video>
 * elements — zero CPU encoding, zero IPC transfer, zero React re-renders
 * per frame.
 *
 * Handles:
 * - Lazy creation (new windows) and teardown (removed windows)
 * - Automatic reconnection with exponential backoff on track-ended
 * - Proper cleanup on unmount
 */
export function useMediaStreams(
  sourceIds: string[],
  options: UseMediaStreamsOptions = {},
) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxFrameRate = 30,
    retryLimit = 5,
    retryDelayMs = 800,
    enabled = true,
  } = options;

  // ── React state (drives renders only when map reference changes) ────────
  const [streams, setStreams] = useState<Record<string, MediaStream>>({});
  const [statuses, setStatuses] = useState<Record<string, StreamStatus>>({});

  // ── Refs (mutable across renders, no re-render cost) ────────────────────
  const entriesRef = useRef<Record<string, MediaStreamEntry>>({});
  const retryTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const mountedRef = useRef(true);

  // Stable reference to the current sourceIds for closures
  const sourceIdsRef = useRef(sourceIds);
  sourceIdsRef.current = sourceIds;

  // ── Helpers ─────────────────────────────────────────────────────────────

  /** Create a single MediaStream via getUserMedia (GPU path). */
  const createStream = useCallback(
    async (sourceId: string): Promise<MediaStream | null> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: sourceId,
              maxWidth,
              maxHeight,
              maxFrameRate,
            },
          } as any, // 'mandatory' is a legacy Chrome constraint Electron still honours
        });
        return stream;
      } catch (err) {
        console.error(
          `[useMediaStreams] getUserMedia failed for ${sourceId}:`,
          err,
        );
        return null;
      }
    },
    [maxWidth, maxHeight, maxFrameRate],
  );

  /** Stop a stream and release its tracks + retry timer. */
  const teardownStream = useCallback((sourceId: string) => {
    const entry = entriesRef.current[sourceId];
    if (entry?.stream) {
      entry.stream.getTracks().forEach((t) => t.stop());
    }
    delete entriesRef.current[sourceId];

    if (retryTimersRef.current[sourceId]) {
      clearTimeout(retryTimersRef.current[sourceId]);
      delete retryTimersRef.current[sourceId];
    }
  }, []);

  /** Try to reconnect a dead stream with exponential backoff. */
  const reconnect = useCallback(
    (sourceId: string) => {
      if (!mountedRef.current) return;

      const prev = entriesRef.current[sourceId];
      const attempt = prev ? prev.retryCount + 1 : 1;

      if (attempt > retryLimit) {
        console.warn(
          `[useMediaStreams] Giving up on ${sourceId} after ${retryLimit} retries`,
        );

        // Update status to failed
        setStatuses((s) => ({ ...s, [sourceId]: "failed" }));

        // Remove dead stream from state
        setStreams((s) => {
          const next = { ...s };
          delete next[sourceId];
          return next;
        });
        return;
      }

      setStatuses((s) => ({ ...s, [sourceId]: "reconnecting" }));

      const delay = retryDelayMs * Math.pow(1.5, attempt - 1);

      retryTimersRef.current[sourceId] = setTimeout(async () => {
        if (!mountedRef.current) return;

        // Verify this sourceId is still wanted
        if (!sourceIdsRef.current.includes(sourceId)) {
          teardownStream(sourceId);
          return;
        }

        const stream = await createStream(sourceId);
        if (!stream || !mountedRef.current) {
          stream?.getTracks().forEach((t) => t.stop());
          // Recurse with incremented counter
          entriesRef.current[sourceId] = {
            stream: null as any,
            sourceId,
            status: "reconnecting",
            retryCount: attempt,
          };
          reconnect(sourceId);
          return;
        }

        // Success — store entry and wire up ended listener
        const entry: MediaStreamEntry = {
          stream,
          sourceId,
          status: "active",
          retryCount: attempt,
        };
        entriesRef.current[sourceId] = entry;

        const track = stream.getVideoTracks()[0];
        if (track) {
          track.onended = () => {
            if (mountedRef.current) reconnect(sourceId);
          };
        }

        setStreams((s) => ({ ...s, [sourceId]: stream }));
        setStatuses((s) => ({ ...s, [sourceId]: "active" }));
      }, delay);
    },
    [createStream, teardownStream, retryLimit, retryDelayMs],
  );

  /** Spin up a fresh stream for a given sourceId. */
  const startStream = useCallback(
    async (sourceId: string) => {
      // Defensive cleanup first
      teardownStream(sourceId);

      setStatuses((s) => ({ ...s, [sourceId]: "pending" }));

      const stream = await createStream(sourceId);

      if (!mountedRef.current) {
        stream?.getTracks().forEach((t) => t.stop());
        return;
      }

      if (!stream) {
        // First attempt failed – enter reconnect loop
        entriesRef.current[sourceId] = {
          stream: null as any,
          sourceId,
          status: "reconnecting",
          retryCount: 0,
        };
        reconnect(sourceId);
        return;
      }

      const entry: MediaStreamEntry = {
        stream,
        sourceId,
        status: "active",
        retryCount: 0,
      };
      entriesRef.current[sourceId] = entry;

      // Auto-reconnect on track death
      const track = stream.getVideoTracks()[0];
      if (track) {
        track.onended = () => {
          if (mountedRef.current) reconnect(sourceId);
        };
      }

      setStreams((s) => ({ ...s, [sourceId]: stream }));
      setStatuses((s) => ({ ...s, [sourceId]: "active" }));
    },
    [createStream, teardownStream, reconnect],
  );

  // ── Main synchronisation effect ────────────────────────────────────────

  useEffect(() => {
    if (!enabled) {
      // Tear down everything when disabled
      Object.keys(entriesRef.current).forEach(teardownStream);
      setStreams({});
      setStatuses({});
      return;
    }

    const desired = new Set(sourceIds);
    const active = new Set(Object.keys(entriesRef.current));

    // Remove streams for windows no longer in the list
    for (const id of active) {
      if (!desired.has(id)) {
        teardownStream(id);
        setStreams((s) => {
          const next = { ...s };
          delete next[id];
          return next;
        });
        setStatuses((s) => {
          const next = { ...s };
          delete next[id];
          return next;
        });
      }
    }

    // Start streams for newly added windows
    for (const id of desired) {
      if (!active.has(id)) {
        startStream(id);
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceIds.join(","), enabled]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      Object.keys(entriesRef.current).forEach(teardownStream);
      Object.values(retryTimersRef.current).forEach(clearTimeout);
      retryTimersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Derived convenience helpers ────────────────────────────────────────

  const allActive = useMemo(
    () =>
      sourceIds.length > 0 &&
      sourceIds.every((id) => statuses[id] === "active"),
    [sourceIds, statuses],
  );

  const anyFailed = useMemo(
    () => sourceIds.some((id) => statuses[id] === "failed"),
    [sourceIds, statuses],
  );

  return { streams, statuses, allActive, anyFailed };
}
