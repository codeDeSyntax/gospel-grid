import React, { useEffect, useMemo, useRef, useState } from "react";
import { DepthButton } from "@/shared/DepthButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { replaceCaptionsState } from "@/store/slices/captionsSlice";
import { startRendererMicStreaming } from "@/components/dashboard/audio/micCapture";
import {
  CAPTIONS_FEATURE_WINDOW_ID,
  FEATURE_CAPTIONS_EVENT,
  loadFeatureCaptionsState,
  mergeRecentCaptionWords,
  saveFeatureCaptionsState,
  type FeatureCaptionsState,
} from "./featureCaptionsState";

const TARGET_SAMPLE_RATE = 16000;

type CaptionsMicCapture = {
  stop: () => void;
};

export const FeatureCaptionsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const displayAssignments = useAppSelector((s) => s.grid.displayAssignments);
  const captionsState = useAppSelector((s) => s.captions.state);
  const micCaptureRef = useRef<CaptionsMicCapture | null>(null);

  const assignedDisplayCount = useMemo(() => {
    return Object.values(displayAssignments).filter((windowIds) =>
      windowIds.includes(CAPTIONS_FEATURE_WINDOW_ID),
    ).length;
  }, [displayAssignments]);

  const isAssigned = assignedDisplayCount > 0;

  const applyState = (next: FeatureCaptionsState) => {
    saveFeatureCaptionsState(next);
    dispatch(replaceCaptionsState(next));
  };

  useEffect(() => {
    const syncFromStorage = () => {
      dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
    };

    const offSpeech = window.speechToTextAPI.onSpeechResult?.(
      (result: { success?: boolean; text?: string; error?: string }) => {
        const current = loadFeatureCaptionsState();

        if (!result?.success) {
          applyState({
            ...current,
            isStreaming: false,
            isPaused: false,
            lastError: result?.error || "Speech service error",
            updatedAtMs: Date.now(),
          });
          return;
        }

        applyState({
          ...current,
          text: mergeRecentCaptionWords(current.text, result?.text || ""),
          lastError: null,
          updatedAtMs: Date.now(),
        });
      },
    );

    const offStatus = window.speechToTextAPI.onWhisperStatus(
      (status: { isConnected?: boolean; isConnecting?: boolean }) => {
        const isConnected = Boolean(status?.isConnected);
        const isConnecting = Boolean(status?.isConnecting);
        applyState({
          ...loadFeatureCaptionsState(),
          isStreaming: isConnected || isConnecting,
          isPaused: !isConnected && !isConnecting,
          updatedAtMs: Date.now(),
        });
      },
    );

    const handleCustomEvent = () => {
      syncFromStorage();
    };

    window.addEventListener(FEATURE_CAPTIONS_EVENT, handleCustomEvent);
    window.addEventListener("storage", handleCustomEvent);

    return () => {
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      offSpeech?.();
      offStatus?.();
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, handleCustomEvent);
      window.removeEventListener("storage", handleCustomEvent);
    };
  }, [dispatch]);

  const handleStart = async () => {
    const result = await window.speechToTextAPI.startStreaming({
      sampleRate: TARGET_SAMPLE_RATE,
    });

    if (!result?.success) {
      applyState({
        ...captionsState,
        isStreaming: false,
        isPaused: false,
        lastError: result?.error || "Failed to start captions",
        updatedAtMs: Date.now(),
      });
      return;
    }

    try {
      const capture = await startRendererMicStreaming({
        targetSampleRate: TARGET_SAMPLE_RATE,
      });
      micCaptureRef.current?.stop();
      micCaptureRef.current = capture;
    } catch (error) {
      await window.speechToTextAPI.stopStreaming();
      applyState({
        ...captionsState,
        isStreaming: false,
        isPaused: false,
        lastError:
          error instanceof Error
            ? error.message
            : "Unable to access microphone",
        updatedAtMs: Date.now(),
      });
      return;
    }

    applyState({
      ...captionsState,
      isStreaming: true,
      isPaused: false,
      lastError: null,
      updatedAtMs: Date.now(),
    });
  };

  const handlePause = async () => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    await window.speechToTextAPI.stopStreaming();
    applyState({
      ...captionsState,
      isStreaming: false,
      isPaused: true,
      updatedAtMs: Date.now(),
    });
  };

  const handleStop = async () => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    await window.speechToTextAPI.stopStreaming();
    applyState({
      ...captionsState,
      isStreaming: false,
      isPaused: false,
      updatedAtMs: Date.now(),
    });
  };

  const handleClear = () => {
    applyState({
      ...captionsState,
      text: "",
      lastError: null,
      updatedAtMs: Date.now(),
    });
  };

  return (
    <div className="h-full w-full overflow-auto no-scrollbar px-5 py-5 text-theme-primary-50">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-theme-primary-400/25 bg-theme-primary-900/35 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-theme-primary-300/80">
            Live Captions
          </p>
          <p className="mt-2 text-sm text-theme-primary-200/80">
            Drag the Live Captions window to one or more screens, then start
            captions from here.
          </p>
          <p className="mt-2 text-[11px] text-theme-primary-300/80">
            Assigned screens: {assignedDisplayCount}
          </p>
        </div>

        <div className="rounded-2xl border border-theme-primary-400/25 bg-theme-primary-950/45 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <DepthButton
              onClick={handleStart}
              disabled={!isAssigned}
              sizeClassName="h-9 px-4 rounded-xl"
              inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                {captionsState.isPaused ? "Resume" : "Start"}
              </span>
            </DepthButton>

            <DepthButton
              onClick={handlePause}
              disabled={!captionsState.isStreaming}
              sizeClassName="h-9 px-4 rounded-xl"
              inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                Pause
              </span>
            </DepthButton>

            <DepthButton
              onClick={handleStop}
              disabled={!captionsState.isStreaming && !captionsState.isPaused}
              sizeClassName="h-9 px-4 rounded-xl"
              inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                Stop
              </span>
            </DepthButton>

            <DepthButton
              onClick={handleClear}
              sizeClassName="h-9 px-4 rounded-xl"
              inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
            >
              <span className="text-xs font-semibold uppercase tracking-wide">
                Clear Text
              </span>
            </DepthButton>
          </div>

          {!isAssigned && (
            <p className="mt-3 text-[11px] text-theme-primary-300/80">
              Assign the Live Captions window to a screen first to start
              streaming.
            </p>
          )}

          {captionsState.lastError && (
            <p className="mt-3 text-[11px] text-red-300/85">
              {captionsState.lastError}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-theme-primary-400/25 bg-theme-primary-900 p-4 min-h-[220px]">
          <p className="text-[11px] uppercase tracking-[0.16em] text-theme-primary-300/80 mb-3">
            Caption Output
          </p>
          <p className="text-xl leading-relaxed text-theme-primary-50/95">
            {captionsState.text || "Waiting for speech..."}
          </p>
        </div>
      </div>
    </div>
  );
};
