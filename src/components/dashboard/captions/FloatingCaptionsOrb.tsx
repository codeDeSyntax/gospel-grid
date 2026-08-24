import React, { useEffect, useMemo, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { DepthSurface } from "@/shared/DepthSurface";
import { DepthButton } from "@/shared/DepthButton";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { replaceCaptionsState } from "@/store/slices/captionsSlice";
import { startRendererMicStreaming } from "../audio/micCapture";
import {
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

export const FloatingCaptionsOrb: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const captionsState = useAppSelector((s) => s.captions.state);
  const micCaptureRef = useRef<CaptionsMicCapture | null>(null);
  const pendingSpeechRef = useRef<string | null>(null);
  const speechDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const statusText = useMemo(() => {
    if (captionsState.isStreaming) return "Listening";
    if (captionsState.isPaused) return "Paused";
    return "Idle";
  }, [captionsState.isPaused, captionsState.isStreaming]);

  useEffect(() => {
    const sync = () =>
      dispatch(replaceCaptionsState(loadFeatureCaptionsState()));

    const flushPendingSpeech = () => {
      if (pendingSpeechRef.current !== null) {
        const current = loadFeatureCaptionsState();
        const text = pendingSpeechRef.current;
        pendingSpeechRef.current = null;
        saveFeatureCaptionsState({
          ...current,
          text: mergeRecentCaptionWords(current.text, text),
          lastError: null,
          updatedAtMs: Date.now(),
        });
        dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
      }
    };

    const offSpeech = window.speechToTextAPI.onSpeechResult?.(
      (result: { success?: boolean; text?: string; error?: string }) => {
        if (speechDebounceTimerRef.current) {
          clearTimeout(speechDebounceTimerRef.current);
        }

        if (!result?.success) {
          flushPendingSpeech();
          const current = loadFeatureCaptionsState();
          saveFeatureCaptionsState({
            ...current,
            isStreaming: false,
            isPaused: false,
            lastError: result?.error || "Speech service error",
            updatedAtMs: Date.now(),
          });
          dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
          return;
        }

        pendingSpeechRef.current = result?.text || "";
        speechDebounceTimerRef.current = setTimeout(flushPendingSpeech, 150);
      },
    );

    const offStatus = window.speechToTextAPI.onWhisperStatus(
      (status: { isConnected?: boolean; isConnecting?: boolean }) => {
        const current = loadFeatureCaptionsState();
        const isConnected = Boolean(status?.isConnected);
        const isConnecting = Boolean(status?.isConnecting);

        saveFeatureCaptionsState({
          ...current,
          isStreaming: isConnected || isConnecting,
          isPaused: !isConnected && !isConnecting,
          updatedAtMs: Date.now(),
        });
        dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
      },
    );

    window.addEventListener(FEATURE_CAPTIONS_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      if (speechDebounceTimerRef.current) {
        clearTimeout(speechDebounceTimerRef.current);
      }
      flushPendingSpeech();
      offSpeech?.();
      offStatus?.();
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [dispatch]);

  const handleStart = async () => {
    const current = loadFeatureCaptionsState();
    const result = await window.speechToTextAPI.startStreaming({
      sampleRate: TARGET_SAMPLE_RATE,
    });

    if (!result?.success) {
      saveFeatureCaptionsState({
        ...current,
        isStreaming: false,
        isPaused: false,
        lastError: result?.error || "Failed to start captions",
        updatedAtMs: Date.now(),
      });
      dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
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
      saveFeatureCaptionsState({
        ...current,
        isStreaming: false,
        isPaused: false,
        lastError:
          error instanceof Error
            ? error.message
            : "Unable to access microphone",
        updatedAtMs: Date.now(),
      });
      dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
      return;
    }

    saveFeatureCaptionsState({
      ...current,
      isStreaming: true,
      isPaused: false,
      lastError: null,
      updatedAtMs: Date.now(),
    });
    dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
  };

  const handleStop = async () => {
    micCaptureRef.current?.stop();
    micCaptureRef.current = null;
    await window.speechToTextAPI.stopStreaming();

    const current = loadFeatureCaptionsState();
    saveFeatureCaptionsState({
      ...current,
      isStreaming: false,
      isPaused: false,
      updatedAtMs: Date.now(),
    });
    dispatch(replaceCaptionsState(loadFeatureCaptionsState()));
  };

  return (
    <div className="pointer-events-none absolute bottom-6 right-12 z-[70] flex items-end justify-end">
      <div className="pointer-events-auto">
        {isExpanded && (
          <DepthSurface
            className="mb-3 w-[320px] rounded-3xl border border-theme-primary-400/30 bg-theme-primary-950/85 p-4 shadow-[0_26px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-theme-primary-300/80">
                  Floating Captions
                </p>
                <p className="mt-1 text-sm text-theme-primary-100/95">
                  {statusText}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="rounded-full border border-theme-primary-400/35 px-2 py-1 text-[10px] uppercase tracking-wide text-theme-primary-200/80 hover:text-theme-primary-50"
              >
                Hide
              </button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <DepthButton
                onClick={handleStart}
                disabled={captionsState.isStreaming}
                sizeClassName="h-9 px-4 rounded-full"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  {captionsState.isStreaming ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Mic className="h-3.5 w-3.5" />
                  )}
                  Start
                </span>
              </DepthButton>

              <DepthButton
                onClick={handleStop}
                disabled={!captionsState.isStreaming && !captionsState.isPaused}
                sizeClassName="h-9 px-4 rounded-full"
                inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
              >
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </span>
              </DepthButton>
            </div>

            <p className="mt-3 line-clamp-2 text-xs text-theme-primary-100/85">
              {captionsState.text || "Waiting for speech..."}
            </p>

            {captionsState.lastError && (
              <p className="mt-2 text-[11px] text-red-300/90">
                {captionsState.lastError}
              </p>
            )}
          </DepthSurface>
        )}

        <DepthSurface
          className={`relative rounded-full w-10 justify-self-end m-3 transition-all duration-300 ${
            captionsState.isStreaming
              ? "border border-emerald-300/80 bg-emerald-400/20 shadow-[0_0_0_5px_rgba(16,185,129,0.18),0_12px_30px_rgba(16,185,129,0.25)]"
              : "border border-theme-primary-300/50 bg-theme-primary-500/18 shadow-[0_10px_24px_rgba(0,0,0,0.4)]"
          }`}
        >
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="group relative flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Toggle floating captions control"
            title="Floating captions control"
          >
            <span
              className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
                captionsState.isStreaming
                  ? "animate-ping bg-emerald-300/20 opacity-90"
                  : "opacity-0"
              }`}
            />
            <img
              src="./caption.png"
              alt="Bot"
              className="relative z-10 h-7 w-7 rounded-full object-cover drop-shadow-sm"
            />
          </button>
        </DepthSurface>
      </div>
    </div>
  );
};
