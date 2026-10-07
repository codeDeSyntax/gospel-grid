/**
 * globalSpeechService.ts
 *
 * Singleton coordinator for live microphone capture and Speech-to-Text streaming.
 * Ensures listening persists across component mounts, page switches, and modal closes.
 */

import { startRendererMicStreaming } from "@/components/dashboard/audio/micCapture";
import {
  loadFeatureCaptionsState,
  saveFeatureCaptionsState,
  FEATURE_CAPTIONS_EVENT,
} from "@/components/dashboard/RightPanel/featureCaptionsState";

const TARGET_SAMPLE_RATE = 16_000;
export const GLOBAL_SPEECH_STREAMING_EVENT = "wingrid:global-speech-streaming-changed";

type SpeechStreamingListener = (isStreaming: boolean) => void;

class GlobalSpeechService {
  private micCapture: { stop: () => void } | null = null;
  private isStreaming = false;
  private isStarting = false;
  private listeners = new Set<SpeechStreamingListener>();

  constructor() {
    // Initial state check
    try {
      const state = loadFeatureCaptionsState();
      this.isStreaming = Boolean(state.isStreaming);
    } catch {}

    // Listen for external IPC status updates from electron main process
    if (typeof window !== "undefined" && window.speechToTextAPI?.onWhisperStatus) {
      window.speechToTextAPI.onWhisperStatus((status) => {
        const active = Boolean(status?.isConnected || status?.isConnecting);
        if (this.isStreaming !== active && !this.micCapture && !active) {
          this.setStreamingState(false);
        }
      });
    }
  }

  public getIsStreaming(): boolean {
    return this.isStreaming;
  }

  public subscribe(listener: SpeechStreamingListener): () => void {
    this.listeners.add(listener);
    listener(this.isStreaming);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.isStreaming);
      } catch (err) {
        console.error("Error in speech streaming listener:", err);
      }
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent(GLOBAL_SPEECH_STREAMING_EVENT, {
          detail: { isStreaming: this.isStreaming },
        }),
      );
    }
  }

  private setStreamingState(streaming: boolean, lastError: string | null = null) {
    this.isStreaming = streaming;
    try {
      const current = loadFeatureCaptionsState();
      saveFeatureCaptionsState({
        ...current,
        isStreaming: streaming,
        isPaused: !streaming,
        lastError: lastError !== undefined ? lastError : current.lastError,
        updatedAtMs: Date.now(),
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(FEATURE_CAPTIONS_EVENT));
      }
    } catch {}
    this.notify();
  }

  public async start(): Promise<{ success: boolean; error?: string }> {
    if (this.isStreaming) {
      return { success: true };
    }
    if (this.isStarting) {
      return { success: false, error: "Already starting..." };
    }

    this.isStarting = true;
    console.log("🎙️ [GlobalSpeechService] Starting global speech streaming & mic capture...");

    try {
      const result = await window.speechToTextAPI?.startStreaming?.({
        sampleRate: TARGET_SAMPLE_RATE,
      });

      if (!result?.success) {
        console.warn("⚠️ [GlobalSpeechService] speechToTextAPI.startStreaming failed:", result?.error);
        this.setStreamingState(false, result?.error || "Failed to initialize speech recognition");
        this.isStarting = false;
        return { success: false, error: result?.error || "Failed to start speech service" };
      }

      const capture = await startRendererMicStreaming({
        targetSampleRate: TARGET_SAMPLE_RATE,
      });

      if (this.micCapture) {
        this.micCapture.stop();
      }
      this.micCapture = capture;
      this.setStreamingState(true, null);
      this.isStarting = false;
      console.log("%c✅ [GlobalSpeechService] Global speech listening ACTIVE across all views!", "color:#22c55e;font-weight:bold;");
      return { success: true };
    } catch (err) {
      console.error("❌ [GlobalSpeechService] Mic capture failed:", err);
      await window.speechToTextAPI?.stopStreaming?.().catch(() => {});
      this.micCapture = null;
      const errorMsg = err instanceof Error ? err.message : "Microphone access denied";
      this.setStreamingState(false, errorMsg);
      this.isStarting = false;
      return { success: false, error: errorMsg };
    }
  }

  public async stop(): Promise<void> {
    console.log("🛑 [GlobalSpeechService] Stopping global speech streaming...");
    if (this.micCapture) {
      try {
        this.micCapture.stop();
      } catch {}
      this.micCapture = null;
    }
    await window.speechToTextAPI?.stopStreaming?.().catch(() => {});
    this.setStreamingState(false);
  }

  public async toggle(): Promise<{ isStreaming: boolean; error?: string }> {
    if (this.isStreaming) {
      await this.stop();
      return { isStreaming: false };
    } else {
      const res = await this.start();
      return { isStreaming: res.success, error: res.error };
    }
  }
}

export const globalSpeechService = new GlobalSpeechService();
