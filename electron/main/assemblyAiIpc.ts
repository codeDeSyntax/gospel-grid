import { BrowserWindow, ipcMain, type WebContents } from "electron";
import {
  createAssemblyAiLiveTranscriber,
  type AssemblyAiLiveTranscriber,
} from "./assemblyAiTranscriber";

type SpeechStatus = {
  isConnected: boolean;
  isConnecting: boolean;
  sessionId?: string;
};

let transcriber: AssemblyAiLiveTranscriber | null = null;
let registered = false;
let activeTarget: WebContents | null = null;

const status: SpeechStatus = {
  isConnected: false,
  isConnecting: false,
  sessionId: undefined,
};

const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_SPEECH_MODEL = "u3-rt-pro";

function toBufferLike(input: unknown): Buffer | null {
  if (Buffer.isBuffer(input)) {
    return input;
  }

  if (input instanceof Uint8Array) {
    return Buffer.from(input);
  }

  if (input instanceof ArrayBuffer) {
    return Buffer.from(input);
  }

  return null;
}

function sendToRenderer(channel: string, payload: unknown) {
  if (activeTarget && !activeTarget.isDestroyed()) {
    activeTarget.send(channel, payload);
    return;
  }

  const windows = BrowserWindow.getAllWindows();
  for (const window of windows) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
}

function publishStatus() {
  sendToRenderer("whisper-status", { ...status });
}

function resetStatus() {
  status.isConnected = false;
  status.isConnecting = false;
  status.sessionId = undefined;
  publishStatus();
}

async function stopActiveTranscriber() {
  if (!transcriber) {
    resetStatus();
    return;
  }

  try {
    await transcriber.stop();
  } finally {
    transcriber = null;
    resetStatus();
  }
}

function getApiKey(): string | null {
  const key = process.env.ASSEMBLYAI_API_KEY?.trim();
  return key ? key : null;
}

export function registerAssemblyAiIpc() {
  if (registered) return;
  registered = true;

  ipcMain.handle(
    "assembly-start-streaming",
    async (
      event,
      options?: {
        sampleRate?: number;
        speechModel?: string;
      },
    ) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: "ASSEMBLYAI_API_KEY is missing. Add it to your .env file.",
        };
      }

      activeTarget = event.sender;

      if (transcriber && status.isConnected) {
        return { success: true };
      }

      await stopActiveTranscriber();

      status.isConnecting = true;
      status.isConnected = false;
      status.sessionId = undefined;
      publishStatus();

      try {
        transcriber = createAssemblyAiLiveTranscriber({
          apiKey,
          sampleRate: options?.sampleRate ?? DEFAULT_SAMPLE_RATE,
          speechModel: options?.speechModel ?? DEFAULT_SPEECH_MODEL,
          useExternalAudioInput: true,
          saveWavFile: false,
          onTranscript: (transcript, isFormatted) => {
            sendToRenderer("speech-result", {
              success: true,
              text: transcript,
              isFinal: isFormatted,
            });
          },
          onEvent: (evt) => {
            if (evt.type === "begin") {
              status.isConnecting = false;
              status.isConnected = true;
              if (evt.sessionId) {
                status.sessionId = evt.sessionId;
              }
              publishStatus();
              return;
            }

            if (evt.type === "termination") {
              resetStatus();
              return;
            }

            if (evt.type === "error") {
              sendToRenderer("speech-result", {
                success: false,
                error:
                  evt.error instanceof Error
                    ? evt.error.message
                    : String(evt.error),
              });
              resetStatus();
            }
          },
          onError: (error) => {
            sendToRenderer("speech-result", {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
            resetStatus();
          },
        });

        await transcriber.start();
        return { success: true };
      } catch (error) {
        await stopActiveTranscriber();
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  ipcMain.handle("assembly-stop-streaming", async () => {
    await stopActiveTranscriber();
    return { success: true };
  });

  ipcMain.on("assembly-send-audio-chunk", (_event, chunkLike: unknown) => {
    if (!transcriber || !status.isConnected) {
      return;
    }

    const chunk = toBufferLike(chunkLike);
    if (!chunk || chunk.length === 0) {
      return;
    }

    transcriber.sendAudioChunk(chunk);
  });

  ipcMain.handle("whisper-get-status", async () => {
    return { success: true, status: { ...status } };
  });

  ipcMain.handle(
    "whisper-restart",
    async (
      _event,
      options?: {
        sampleRate?: number;
        speechModel?: string;
      },
    ) => {
      await stopActiveTranscriber();

      const apiKey = getApiKey();
      if (!apiKey) {
        return {
          success: false,
          error: "ASSEMBLYAI_API_KEY is missing. Add it to your .env file.",
        };
      }

      status.isConnecting = true;
      publishStatus();

      try {
        transcriber = createAssemblyAiLiveTranscriber({
          apiKey,
          sampleRate: options?.sampleRate ?? DEFAULT_SAMPLE_RATE,
          speechModel: options?.speechModel ?? DEFAULT_SPEECH_MODEL,
          useExternalAudioInput: true,
          saveWavFile: false,
          onTranscript: (transcript, isFormatted) => {
            sendToRenderer("speech-result", {
              success: true,
              text: transcript,
              isFinal: isFormatted,
            });
          },
          onEvent: (evt) => {
            if (evt.type === "begin") {
              status.isConnecting = false;
              status.isConnected = true;
              if (evt.sessionId) {
                status.sessionId = evt.sessionId;
              }
              publishStatus();
            }
          },
          onError: (error) => {
            sendToRenderer("speech-result", {
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
            resetStatus();
          },
        });

        await transcriber.start();
        return { success: true };
      } catch (error) {
        await stopActiveTranscriber();
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
  );

  ipcMain.handle("whisper-get-languages", async () => {
    return {
      success: true,
      languages: [
        { code: "en", name: "English" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "pt", name: "Portuguese" },
      ],
    };
  });

  ipcMain.handle("whisper-transcribe", async () => {
    return {
      success: false,
      error:
        "Batch transcription is not wired yet. Use assembly-start-streaming.",
    };
  });

  ipcMain.handle("whisper-transcribe-stream", async () => {
    return {
      success: false,
      error:
        "Chunk transcription route is not wired yet. Use assembly-start-streaming.",
    };
  });
}

export async function shutdownAssemblyAiIpc() {
  await stopActiveTranscriber();
}
