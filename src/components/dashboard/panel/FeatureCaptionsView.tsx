import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Square, Trash2, Mic } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { replaceCaptionsState } from "@/store/slices/captionsSlice";
import { startRendererMicStreaming } from "@/components/dashboard/audio/micCapture";
import { LiveCaptionsSpeechDisplay } from "../captions";
import {
  CAPTIONS_FEATURE_WINDOW_ID,
  FEATURE_CAPTIONS_EVENT,
  loadFeatureCaptionsState,
  mergeRecentCaptionWords,
  saveFeatureCaptionsState,
  type FeatureCaptionsState,
} from "../RightPanel/featureCaptionsState";

const TARGET_SAMPLE_RATE = 16000;

type CaptionsMicCapture = {
  stop: () => void;
};

export const FeatureCaptionsView: React.FC = () => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
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
    <div className="h-full w-full overflow-auto no-scrollbar bg-theme-primary-900 px-5 py-5 text-theme-primary-50 rounded-r-2xl">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-2xl border border-theme-primary-400/25 bg-theme-primary-900 p-4">
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

        <div className="rounded-2xl border border-theme-primary-700/50 bg-theme-primary-950/70 p-4 shadow-sm backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Start / Resume Button */}
            <button
              type="button"
              onClick={handleStart}
              disabled={!isAssigned}
              className={`h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${
                captionsState.isStreaming
                  ? "bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 border border-primary-400"
                  : "bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 border border-primary-500/40"
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{captionsState.isPaused ? "Resume" : "Start"}</span>
            </button>

            {/* Pause Button */}
            <button
              type="button"
              onClick={handlePause}
              disabled={!captionsState.isStreaming}
              className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white/90 hover:text-white shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>

            {/* Stop Button */}
            <button
              type="button"
              onClick={handleStop}
              disabled={!captionsState.isStreaming && !captionsState.isPaused}
              className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-white/15 bg-white/[0.06] hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-300 text-white/90 shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>

            {/* Clear Text Button */}
            <button
              type="button"
              onClick={handleClear}
              disabled={!captionsState.text}
              className="h-9 px-4 rounded-xl flex items-center gap-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-white/90 hover:text-white shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 opacity-80" />
              <span>Clear Text</span>
            </button>
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

        <div
          className={`rounded-2xl border p-6 min-h-[220px] flex flex-col justify-between transition-colors `}
        >
         

          <div className="my-6">
            <LiveCaptionsSpeechDisplay
              text={captionsState.text}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
