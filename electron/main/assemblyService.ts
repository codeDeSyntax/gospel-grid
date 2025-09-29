import { Readable } from "stream";
import { AssemblyAI } from "assemblyai";
import { BrowserWindow } from "electron";

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  error?: string;
  confidence?: number;
  isFinal?: boolean;
}

export interface AssemblyServiceStatus {
  isConnected: boolean;
  isConnecting: boolean;
  sessionId?: string;
  error?: string;
}

export interface StreamingOptions {
  language?: string;
  isLast?: boolean;
  sampleRate?: number;
}

export class AssemblyService {
  private client: AssemblyAI;
  private transcriber: any;
  private isConnected = false;
  private sessionId?: string;
  private onTranscriptCallback?: (result: TranscriptionResult) => void;
  private onStatusCallback?: (status: AssemblyServiceStatus) => void;
  private audioStream?: any; // Store the continuous audio stream
  private mainWindow?: BrowserWindow;

  constructor(apiKey: string, mainWindow?: BrowserWindow) {
    console.log(
      "🔑 AssemblyAI constructor received API key:",
      apiKey ? `${apiKey.substring(0, 8)}...` : "❌ MISSING"
    );

    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      console.error("❌ Invalid AssemblyAI API key:", apiKey);
      throw new Error(
        "AssemblyAI API key is required. Please set ASSEMBLYAI_API_KEY environment variable or provide a valid API key."
      );
    }

    this.client = new AssemblyAI({
      apiKey: apiKey,
    });

    this.mainWindow = mainWindow;
    console.log("🎯 AssemblyAI service initialized with API key");

    // Send initial status
    this.notifyStatus({
      isConnected: false,
      isConnecting: false,
    });
  }

  async initialize(): Promise<void> {
    console.log(
      "🎯 AssemblyAI service initialized - API validation will occur on first streaming attempt"
    );
    // Skip API validation during startup to avoid blocking the app
    // Validation will happen when streaming is actually needed
  }

  async startStreaming(options: StreamingOptions = {}): Promise<void> {
    if (this.isConnected) {
      console.log("⚠️ Already connected to streaming service");
      return;
    }

    try {
      console.log("🔗 Creating AssemblyAI streaming transcriber...");
      console.log("🌐 Testing connectivity to streaming.assemblyai.com...");

      // Create streaming transcriber with the correct Node.js SDK configuration
      this.transcriber = this.client.streaming.transcriber({
        sampleRate: 16_000,
        formatTurns: true,
      });

      // Set up event handlers exactly like the official Node.js SDK example
      this.transcriber.on("open", ({ id }: { id: string }) => {
        this.sessionId = id;
        this.isConnected = true;
        console.log(`🔗 AssemblyAI session opened: ${id}`);
        console.log(`📊 Transcriber ready to receive audio data`);

        this.notifyStatus({
          isConnected: true,
          isConnecting: false,
          sessionId: id,
        });
      });

      this.transcriber.on("error", (error: any) => {
        console.error("❌ AssemblyAI streaming error:", error);
        this.isConnected = false;

        this.notifyStatus({
          isConnected: false,
          isConnecting: false,
          error: error?.message || "Streaming error",
        });

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            success: false,
            error: error?.message || "Streaming error",
          });
        }
      });

      this.transcriber.on("close", (code: number, reason: string) => {
        console.log(`🔒 AssemblyAI session closed: ${code} - ${reason}`);
        this.isConnected = false;
        this.sessionId = undefined;

        this.notifyStatus({
          isConnected: false,
          isConnecting: false,
        });
      });

      // Handle transcription results - this is the key part like the "turn" event
      this.transcriber.on("turn", (turn: any) => {
        console.log(`🎯 Turn event received:`, JSON.stringify(turn, null, 2));

        if (!turn.transcript) {
          console.log(`⚠️ Turn event has no transcript, skipping...`);
          return;
        }

        console.log(
          `🎤 AssemblyAI transcription: "${turn.transcript}" (final: ${turn.end_of_turn})`
        );

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback({
            success: true,
            text: turn.transcript,
            confidence: turn.confidence || 0.9,
            isFinal: turn.end_of_turn || false,
          });
        }

        // Also send to renderer process if mainWindow is available
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send("speech-result", {
            success: true,
            text: turn.transcript,
            confidence: turn.confidence || 0.9,
            isFinal: turn.end_of_turn || false,
          });
        }
      });

      // Connect to streaming service like in the official Node.js example
      console.log("🚀 Connecting to AssemblyAI streaming service...");
      await this.transcriber.connect();
      console.log("✅ Connected to AssemblyAI streaming service");

      // Create a continuous audio stream that we can write to
      // This mimics the recording.stream().pipeTo(transcriber.stream()) from the docs
      const { Readable } = await import("stream");

      this.audioStream = new Readable({
        read() {
          // This will be pushed to by transcribeStream method
        },
      });

      // Start streaming the audio data
      console.log("🎵 Starting continuous audio stream to AssemblyAI...");
      this.transcriber.stream(this.audioStream);
      console.log("✅ Continuous audio stream established");
    } catch (error) {
      console.error("❌ Failed to start AssemblyAI streaming:", error);
      this.isConnected = false;

      this.notifyStatus({
        isConnected: false,
        isConnecting: false,
        error:
          error instanceof Error ? error.message : "Failed to start streaming",
      });

      throw error;
    }
  }

  async stopStreaming(): Promise<void> {
    if (!this.isConnected || !this.transcriber) {
      console.log("⚠️ No active streaming session to stop");
      return;
    }

    try {
      console.log("🛑 Closing AssemblyAI streaming connection...");

      // Close the transcriber like in the official Node.js example
      await this.transcriber.close();

      this.isConnected = false;
      this.sessionId = undefined;
      this.transcriber = null;

      console.log("✅ AssemblyAI streaming connection closed");

      this.notifyStatus({
        isConnected: false,
        isConnecting: false,
      });
    } catch (error) {
      console.error("❌ Error stopping AssemblyAI streaming:", error);
      throw error;
    }
  }

  async transcribeStream(
    audioBuffer: ArrayBuffer,
    options: StreamingOptions = {}
  ): Promise<TranscriptionResult> {
    if (!this.isConnected || !this.transcriber || !this.audioStream) {
      return {
        success: false,
        error: "Not connected to streaming service or stream not available",
      };
    }

    try {
      // Convert ArrayBuffer to Buffer for Node.js stream compatibility
      const audioData = Buffer.from(audioBuffer);

      // Log audio format information for debugging
      console.log(
        `🎤 Sending ${audioData.length} bytes to AssemblyAI transcriber`
      );
      console.log(
        `🔊 Audio data preview: [${audioData.slice(0, 20).join(", ")}...]`
      );
      console.log(
        `📊 Audio buffer info: first 8 bytes as hex: ${audioData
          .slice(0, 8)
          .toString("hex")}`
      );

      // We're now expecting raw PCM data from Web Audio API (Int16Array)
      console.log(`� Expecting raw PCM audio data (16-bit, 16kHz, mono)`);

      // Create a readable stream from the audio buffer (raw PCM)
      const audioStream = new Readable({
        read() {
          this.push(audioData);
          this.push(null); // End the stream
        },
      });

      // Send the audio stream to the transcriber
      // The official SDK uses client.stream(audioStream) approach
      if (typeof this.transcriber.stream === "function") {
        await this.transcriber.stream(audioStream);
        console.log("✅ Raw PCM audio stream sent to AssemblyAI");
      } else if (typeof this.transcriber.sendAudio === "function") {
        // Alternative method if stream() is not available
        this.transcriber.sendAudio(audioData);
        console.log("✅ Raw PCM audio data sent to AssemblyAI");
      } else {
        console.error("❌ No suitable method to send audio to transcriber");
        console.log(
          "🔍 Available transcriber methods:",
          Object.keys(this.transcriber)
        );
        return {
          success: false,
          error: "Transcriber does not support audio streaming",
        };
      }

      // Return success immediately - transcription results come through events
      return {
        success: true,
        text: "", // Actual transcription will come through the 'turn' event
      };
    } catch (error) {
      console.error("❌ Error streaming audio to AssemblyAI:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown streaming error",
      };
    }
  }

  // File-based transcription (for backward compatibility)
  async transcribeFile(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
    try {
      // Convert ArrayBuffer to base64 for upload
      const audioData = new Uint8Array(audioBuffer);
      const base64Audio = Buffer.from(audioData).toString("base64");

      // Create a data URL for the audio
      const audioUrl = `data:audio/wav;base64,${base64Audio}`;

      const transcript = await this.client.transcripts.transcribe({
        audio: audioUrl,
        language_code: "en", // AssemblyAI streaming only supports English
      });

      if (transcript.status === "completed" && transcript.text) {
        return {
          success: true,
          text: transcript.text,
          confidence: transcript.confidence || 0.9,
        };
      } else if (transcript.status === "error") {
        return {
          success: false,
          error: transcript.error || "Transcription failed",
        };
      } else {
        return {
          success: false,
          error: "Transcription not completed",
        };
      }
    } catch (error) {
      console.error("❌ AssemblyAI transcription error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown transcription error",
      };
    }
  }

  onTranscript(callback: (result: TranscriptionResult) => void): void {
    this.onTranscriptCallback = callback;
  }

  onStatus(callback: (status: AssemblyServiceStatus) => void): void {
    this.onStatusCallback = callback;
  }

  private notifyStatus(status: AssemblyServiceStatus): void {
    if (this.onStatusCallback) {
      this.onStatusCallback(status);
    }
  }

  getStatus(): AssemblyServiceStatus {
    return {
      isConnected: this.isConnected,
      isConnecting: false,
      sessionId: this.sessionId,
    };
  }

  getSupportedLanguages() {
    // AssemblyAI streaming only supports English
    return [{ code: "en", name: "English" }];
  }

  async restart(): Promise<void> {
    console.log("🔄 Restarting AssemblyAI service...");

    if (this.isConnected) {
      await this.stopStreaming();
    }

    console.log("✅ AssemblyAI service restarted");
  }

  destroy(): void {
    if (this.isConnected) {
      this.stopStreaming().catch(console.error);
    }
    this.onTranscriptCallback = undefined;
    this.onStatusCallback = undefined;
    console.log("🗑️ AssemblyAI service destroyed");
  }
}
