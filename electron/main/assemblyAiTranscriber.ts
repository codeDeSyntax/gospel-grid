import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const WebSocket = require("ws") as any;

function getMicFactory() {
  try {
    return require("mic") as any;
  } catch {
    throw new Error(
      "Optional microphone backend package 'mic' is not installed. This app now uses renderer-side audio capture by default.",
    );
  }
}

export interface AssemblyAiConnectionParams {
  sample_rate?: number;
  speech_model?: string;
}

export interface AssemblyAiBeginEvent {
  type: "begin";
  sessionId: string;
  expiresAt: number;
}

export interface AssemblyAiTurnEvent {
  type: "turn";
  transcript: string;
  isFormatted: boolean;
  raw: unknown;
}

export interface AssemblyAiTerminationEvent {
  type: "termination";
  audioDurationSeconds?: number;
  sessionDurationSeconds?: number;
  raw: unknown;
}

export interface AssemblyAiErrorEvent {
  type: "error";
  error: unknown;
}

export type AssemblyAiEvent =
  | AssemblyAiBeginEvent
  | AssemblyAiTurnEvent
  | AssemblyAiTerminationEvent
  | AssemblyAiErrorEvent;

export interface AssemblyAiTranscriberOptions {
  apiKey: string;
  sampleRate?: number;
  speechModel?: string;
  useExternalAudioInput?: boolean;
  saveWavFile?: boolean;
  wavOutputDirectory?: string;
  onEvent?: (event: AssemblyAiEvent) => void;
  onTranscript?: (transcript: string, isFormatted: boolean) => void;
  onError?: (error: unknown) => void;
}

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_SPEECH_MODEL = "u3-rt-pro";
const DEFAULT_CHANNELS = 1;
const API_ENDPOINT_BASE_URL = "wss://streaming.assemblyai.com/v3/ws";

function isSoxAvailable() {
  const candidates =
    process.platform === "win32" ? ["sox.exe", "sox"] : ["sox"];

  for (const command of candidates) {
    const result = spawnSync(command, ["--version"], {
      windowsHide: true,
      stdio: "ignore",
    });

    if (!result.error && result.status === 0) {
      return true;
    }
  }

  return false;
}

function normalizeMicError(error: unknown): Error {
  if (error instanceof Error) {
    const maybeErrno = error as NodeJS.ErrnoException;
    const message = (error.message || "").toLowerCase();
    if (maybeErrno.code === "ENOENT" && message.includes("sox")) {
      return new Error(
        "Microphone backend not available: SoX is not installed or not in PATH. Install SoX (https://sox.sourceforge.net/) and restart Wingrid.",
      );
    }
    return error;
  }

  return new Error(String(error));
}

function clearLine() {
  process.stdout.write("\r" + " ".repeat(80) + "\r");
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}

function createWavHeader(
  sampleRate: number,
  channels: number,
  dataLength: number,
) {
  const buffer = Buffer.alloc(44);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);

  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * 2, 28);
  buffer.writeUInt16LE(channels * 2, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

export class AssemblyAiLiveTranscriber {
  private ws: any = null;
  private micInstance: any = null;
  private micInputStream: any = null;
  private stopRequested = false;
  private recordedFrames: Buffer[] = [];
  private readonly apiEndpoint: string;

  constructor(private readonly options: AssemblyAiTranscriberOptions) {
    const sampleRate = options.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const speechModel = options.speechModel ?? DEFAULT_SPEECH_MODEL;

    const connectionParams: AssemblyAiConnectionParams = {
      sample_rate: sampleRate,
      speech_model: speechModel,
    };

    const params = new URLSearchParams({
      sample_rate: String(connectionParams.sample_rate ?? DEFAULT_SAMPLE_RATE),
      speech_model: String(
        connectionParams.speech_model ?? DEFAULT_SPEECH_MODEL,
      ),
    });

    this.apiEndpoint = `${API_ENDPOINT_BASE_URL}?${params.toString()}`;
  }

  get isRunning() {
    return (
      !!this.ws && this.ws.readyState === WebSocket.OPEN && !this.stopRequested
    );
  }

  async start() {
    if (this.ws) {
      return;
    }

    this.stopRequested = false;
    this.recordedFrames = [];

    this.ws = new WebSocket(this.apiEndpoint, {
      headers: {
        Authorization: this.options.apiKey,
      },
    });

    this.ws.on("open", () => {
      this.options.onEvent?.({ type: "begin", sessionId: "", expiresAt: 0 });
      if (!this.options.useExternalAudioInput) {
        this.startMicrophone();
      }
    });

    this.ws.on("message", (message: Buffer | string) => {
      try {
        const payload = JSON.parse(message.toString());
        const msgType = payload.type;

        if (msgType === "Begin") {
          this.options.onEvent?.({
            type: "begin",
            sessionId: payload.id,
            expiresAt: payload.expires_at,
          });
          return;
        }

        if (msgType === "Turn") {
          const transcript = payload.transcript || "";
          const isFormatted = !!payload.turn_is_formatted;
          this.options.onTranscript?.(transcript, isFormatted);
          this.options.onEvent?.({
            type: "turn",
            transcript,
            isFormatted,
            raw: payload,
          });
          return;
        }

        if (msgType === "Termination") {
          this.options.onEvent?.({
            type: "termination",
            audioDurationSeconds: payload.audio_duration_seconds,
            sessionDurationSeconds: payload.session_duration_seconds,
            raw: payload,
          });
        }
      } catch (error) {
        this.options.onError?.(error);
        this.options.onEvent?.({ type: "error", error });
      }
    });

    this.ws.on("error", (error: unknown) => {
      this.options.onError?.(error);
      this.options.onEvent?.({ type: "error", error });
      void this.stop();
    });

    this.ws.on("close", () => {
      void this.stop();
    });
  }

  async stop() {
    if (this.stopRequested) return;
    this.stopRequested = true;

    await this.saveWavFileIfEnabled();

    if (this.micInstance) {
      try {
        this.micInstance.stop();
      } catch (error) {
        this.options.onError?.(error);
      }
      this.micInstance = null;
      this.micInputStream = null;
    }

    if (
      this.ws &&
      [WebSocket.OPEN, WebSocket.CONNECTING].includes(this.ws.readyState)
    ) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "Terminate" }));
        }
        this.ws.close();
      } catch (error) {
        this.options.onError?.(error);
      }
    }

    this.ws = null;
  }

  async dispose() {
    await this.stop();
  }

  sendAudioChunk(data: Buffer) {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      this.stopRequested
    ) {
      return false;
    }

    const chunk = Buffer.from(data);
    this.recordedFrames.push(chunk);
    this.ws.send(chunk);
    return true;
  }

  private startMicrophone() {
    try {
      if (!isSoxAvailable()) {
        throw new Error(
          "Microphone backend not available: SoX is not installed or not in PATH. Install SoX (https://sox.sourceforge.net/) and restart Wingrid.",
        );
      }

      const mic = getMicFactory();
      const sampleRate = this.options.sampleRate ?? DEFAULT_SAMPLE_RATE;
      this.micInstance = mic({
        rate: String(sampleRate),
        channels: String(DEFAULT_CHANNELS),
        debug: false,
        exitOnSilence: 6,
      });

      if (typeof this.micInstance?.on === "function") {
        this.micInstance.on("error", (error: unknown) => {
          const normalizedError = normalizeMicError(error);
          this.options.onError?.(normalizedError);
          void this.stop();
        });
      }

      this.micInputStream = this.micInstance.getAudioStream();

      this.micInputStream.on("data", (data: Buffer) => {
        if (
          !this.ws ||
          this.ws.readyState !== WebSocket.OPEN ||
          this.stopRequested
        ) {
          return;
        }

        this.recordedFrames.push(Buffer.from(data));
        this.ws.send(data);
      });

      this.micInputStream.on("error", (error: unknown) => {
        this.options.onError?.(normalizeMicError(error));
        void this.stop();
      });

      this.micInstance.start();
    } catch (error) {
      this.options.onError?.(normalizeMicError(error));
      void this.stop();
    }
  }

  private async saveWavFileIfEnabled() {
    if (!this.options.saveWavFile || this.recordedFrames.length === 0) {
      return;
    }

    const audioData = Buffer.concat(this.recordedFrames);
    const dataLength = audioData.length;
    const sampleRate = this.options.sampleRate ?? DEFAULT_SAMPLE_RATE;
    const channels = DEFAULT_CHANNELS;
    const wavHeader = createWavHeader(sampleRate, channels, dataLength);
    const wavFile = Buffer.concat([wavHeader, audioData]);
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const filename = `recorded_audio_${timestamp}.wav`;
    const outputDirectory = this.options.wavOutputDirectory ?? process.cwd();
    const outputPath = path.join(outputDirectory, filename);

    await fs.writeFile(outputPath, wavFile);
    console.log(`Audio saved to: ${outputPath}`);
    console.log(
      `Duration: ${(dataLength / (sampleRate * channels * 2)).toFixed(2)} seconds`,
    );
  }
}

export function createAssemblyAiLiveTranscriber(
  options: AssemblyAiTranscriberOptions,
) {
  return new AssemblyAiLiveTranscriber(options);
}

export { clearLine, formatTimestamp };
