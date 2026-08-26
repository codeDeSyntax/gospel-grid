import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeDHash,
  averageLuminance,
  classifyScene,
  isSlideChange,
  captureVideoFrame,
  hammingDistance,
  type SceneState,
} from "@/services/ai/frameActivityDetector";

export interface FrameActivityState {
  sceneState: SceneState;
  changeCount: number;
  lastChangeAt: number | null;
  /** True if the most recent transition looked like a discrete slide flip */
  isSlideChange: boolean;
  /** Hamming distance from the last hash comparison */
  lastDistance: number;
}

export interface UseFrameActivityDetectorOptions {
  windowId: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Analysis interval in ms. Default: 500ms (2fps analysis rate) */
  intervalMs?: number;
  /** Whether detection is active. Default: true */
  enabled?: boolean;
  /** Called when a scene change is detected */
  onSceneChange?: (state: FrameActivityState) => void;
}

const INITIAL_STATE: FrameActivityState = {
  sceneState: "active",
  changeCount: 0,
  lastChangeAt: null,
  isSlideChange: false,
  lastDistance: 0,
};

export function useFrameActivityDetector({
  windowId,
  videoRef,
  intervalMs = 500,
  enabled = true,
  onSceneChange,
}: UseFrameActivityDetectorOptions): FrameActivityState {
  const [state, setState] = useState<FrameActivityState>(INITIAL_STATE);

  // Mutable refs to avoid stale closures inside the interval
  const prevHashRef = useRef<bigint | null>(null);
  const prevStateRef = useRef<SceneState>("active");
  const changeCountRef = useRef(0);
  const enabledRef = useRef(enabled);
  const onChangeRef = useRef(onSceneChange);

  enabledRef.current = enabled;
  onChangeRef.current = onSceneChange;

  const analyze = useCallback(() => {
    if (!enabledRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    // Capture a small 64×64 frame sample — cheap and sufficient for hashing
    const frame = captureVideoFrame(video, 64, 64);
    if (!frame) return;

    const currHash = computeDHash(frame);
    const luma = averageLuminance(frame);
    const currState = classifyScene(currHash, prevHashRef.current, luma);

    const dist =
      prevHashRef.current !== null
        ? hammingDistance(prevHashRef.current, currHash)
        : 0;

    const slideFlip =
      prevHashRef.current !== null
        ? isSlideChange(prevHashRef.current, currHash)
        : false;

    const stateChanged = currState !== prevStateRef.current || slideFlip;

    if (stateChanged) {
      changeCountRef.current++;

      const next: FrameActivityState = {
        sceneState: currState,
        changeCount: changeCountRef.current,
        lastChangeAt: Date.now(),
        isSlideChange: slideFlip,
        lastDistance: dist,
      };

      setState(next);
      onChangeRef.current?.(next);
    } else if (dist !== state.lastDistance) {
      // Update distance silently without triggering a full re-render
      setState((prev) => ({ ...prev, lastDistance: dist }));
    }

    prevHashRef.current = currHash;
    prevStateRef.current = currState;
  }, [videoRef]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!enabled) {
      setState(INITIAL_STATE);
      prevHashRef.current = null;
      prevStateRef.current = "active";
      return;
    }

    // Use requestIdleCallback for non-blocking execution where supported
    let timerId: ReturnType<typeof setInterval> | null = null;
    let idleId: ReturnType<typeof requestIdleCallback> | null = null;

    const supportsIdle = typeof requestIdleCallback !== "undefined";

    if (supportsIdle) {
      const loop = () => {
        analyze();
        idleId = requestIdleCallback(loop, { timeout: intervalMs * 2 });
      };
      // Start first iteration after one interval
      timerId = setTimeout(() => {
        idleId = requestIdleCallback(loop, { timeout: intervalMs * 2 });
      }, intervalMs) as unknown as ReturnType<typeof setInterval>;
    } else {
      timerId = setInterval(analyze, intervalMs);
    }

    return () => {
      if (timerId !== null) {
        if (supportsIdle) {
          clearTimeout(timerId as unknown as ReturnType<typeof setTimeout>);
        } else {
          clearInterval(timerId);
        }
      }
      if (idleId !== null && supportsIdle) {
        cancelIdleCallback(idleId);
      }
    };
  }, [windowId, enabled, intervalMs, analyze]);

  return state;
}
