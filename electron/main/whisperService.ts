import { pipeline } from "@xenova/transformers";
import { BrowserWindow } from "electron";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";

export class WhisperService {
  private transcriber: any = null;
  private isInitializing = false;
  private isReady = false;
  private mainWindow: BrowserWindow | null = null;
  private processingQueue: Array<{
    buffer: Buffer;
    options: any;
    resolve: any;
    reject: any;
  }> = [];
  private isProcessingQueue = false;
  private maxQueueSize = 10; // Increased queue size to handle fast audio chunks

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    // Set FFmpeg path
    ffmpeg.setFfmpegPath(ffmpegPath);
    this.initialize();
  }

  private async initialize() {
    if (this.isInitializing || this.isReady) return;

    this.isInitializing = true;
    console.log("🎤 Initializing Whisper model in Electron main process...");
    console.log("⚠️  First run may take a few minutes to download the model");

    try {
      // Send loading status to renderer
      this.sendToRenderer("whisper-status", {
        status: "loading",
        message: "Downloading Whisper model...",
      });

      // Use the small English model for better performance
      this.transcriber = await pipeline(
        "automatic-speech-recognition",
        "Xenova/whisper-small.en",
        {
          revision: "main",
          // Cache the model in the app's data directory
          cache_dir:
            process.env.NODE_ENV === "development" ? "./models" : undefined,
        }
      );

      this.isReady = true;
      this.isInitializing = false;

      console.log(
        "✅ Whisper model loaded successfully in Electron main process!"
      );

      // Notify renderer that Whisper is ready
      this.sendToRenderer("whisper-status", {
        status: "ready",
        message: "Whisper model loaded successfully",
      });
    } catch (error) {
      console.error("❌ Failed to load Whisper model:", error);
      this.isInitializing = false;

      // Notify renderer about error
      this.sendToRenderer("whisper-status", {
        status: "error",
        message: `Failed to load Whisper model: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  }

  private sendToRenderer(channel: string, data: any) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private async processAudioFile(filePath: string): Promise<Float32Array> {
    return new Promise((resolve, reject) => {
      const outputPath = filePath.replace(".webm", ".wav");

      console.log("🔄 Converting audio to WAV format...");

      ffmpeg(filePath)
        .toFormat("wav")
        .audioFrequency(16000) // Resample to 16kHz
        .audioChannels(1) // Convert to mono
        .audioCodec("pcm_f32le") // 32-bit float PCM little-endian
        .on("end", () => {
          console.log("✅ Audio conversion completed");

          try {
            // Read the converted WAV file
            const wavBuffer = fs.readFileSync(outputPath);

            console.log(`📁 WAV file size: ${wavBuffer.length} bytes`);

            // Parse WAV header to get the correct data offset
            // WAV files have a header, we need to skip to the actual audio data
            let dataOffset = 44; // Standard WAV header size

            // Find the 'data' chunk for more robust parsing
            for (let i = 12; i < wavBuffer.length - 4; i++) {
              if (wavBuffer.readUInt32BE(i) === 0x64617461) {
                // 'data' in hex
                dataOffset = i + 8; // Skip 'data' + size (4 bytes each)
                break;
              }
            }

            console.log(`📊 Audio data starts at offset: ${dataOffset}`);

            // Calculate the number of float samples
            const audioDataLength = wavBuffer.length - dataOffset;
            const sampleCount = Math.floor(audioDataLength / 4); // 4 bytes per float32

            console.log(
              `🔢 Sample count: ${sampleCount}, Audio data length: ${audioDataLength}`
            );

            // Create properly aligned buffer for Float32Array
            const alignedBuffer = wavBuffer.buffer.slice(
              dataOffset,
              dataOffset + sampleCount * 4
            );
            const audioData = new Float32Array(alignedBuffer);

            console.log(`🎵 Final audio array length: ${audioData.length}`);

            // Clean up temporary files
            fs.unlinkSync(filePath);
            fs.unlinkSync(outputPath);

            resolve(audioData);
          } catch (error) {
            console.error("❌ Audio processing error:", error);
            // Clean up files on error
            try {
              fs.unlinkSync(filePath);
              fs.unlinkSync(outputPath);
            } catch (cleanupError) {
              console.warn("⚠️ Cleanup error:", cleanupError);
            }
            reject(error);
          }
        })
        .on("error", (error) => {
          console.error("❌ Audio conversion error:", error);
          reject(error);
        })
        .save(outputPath);
    });
  }

  public async transcribe(
    audioBuffer: Buffer,
    options: {
      language?: string;
      task?: "transcribe" | "translate";
    } = {}
  ): Promise<{
    text: string;
    confidence?: number;
    processingTime: number;
  }> {
    if (!this.isReady || !this.transcriber) {
      throw new Error(
        "Whisper model not ready yet. Please wait for initialization to complete."
      );
    }

    const startTime = Date.now();

    try {
      console.log("📝 Transcribing audio with Whisper...");
      console.log(`🎤 Audio buffer size: ${audioBuffer.length} bytes`);

      // Save audio buffer to temporary file
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(
        tempDir,
        `whisper_audio_${Date.now()}.webm`
      );

      fs.writeFileSync(tempFilePath, audioBuffer);
      console.log(`💾 Saved audio to temporary file: ${tempFilePath}`);

      // Process audio with FFmpeg
      const audioData = await this.processAudioFile(tempFilePath);
      console.log(`🔊 Audio data processed: ${audioData.length} samples`);

      const result = await this.transcriber(audioData, {
        language: options.language || "english",
        task: options.task || "transcribe",
        return_timestamps: false,
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      const processingTime = Date.now() - startTime;

      console.log(`✅ Whisper transcription completed in ${processingTime}ms`);
      console.log(`📝 Result: "${result.text}"`);

      return {
        text: result.text || "",
        confidence: result.confidence || 0,
        processingTime,
      };
    } catch (error) {
      console.error("❌ Whisper transcription error:", error);
      throw new Error(
        `Transcription failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public async transcribeStream(
    audioBuffer: Buffer,
    options: {
      language?: string;
      isLast?: boolean;
    } = {}
  ): Promise<{
    text: string;
    confidence?: number;
    processingTime: number;
  }> {
    // Use queue system for better performance
    return new Promise((resolve, reject) => {
      // Smart queue management - prioritize recent requests
      if (this.processingQueue.length >= this.maxQueueSize) {
        // Drop older requests, keep the newest ones
        const droppedCount = Math.floor(this.maxQueueSize / 2);
        for (let i = 0; i < droppedCount; i++) {
          const dropped = this.processingQueue.shift();
          if (dropped) {
            dropped.reject(
              new Error(
                "Request dropped due to queue overflow - prioritizing recent audio"
              )
            );
          }
        }
        console.log(
          `🗑️ Dropped ${droppedCount} old audio chunks to prevent queue overflow`
        );
      }

      this.processingQueue.push({
        buffer: audioBuffer,
        options,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.processingQueue.length > 0) {
      const request = this.processingQueue.shift();
      if (!request) break;

      try {
        const result = await this.processStreamAudio(
          request.buffer,
          request.options
        );
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay to prevent CPU overload
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    this.isProcessingQueue = false;
  }

  private async processStreamAudio(
    audioBuffer: Buffer,
    options: {
      language?: string;
      isLast?: boolean;
    } = {}
  ): Promise<{
    text: string;
    confidence?: number;
    processingTime: number;
  }> {
    if (!this.isReady || !this.transcriber) {
      throw new Error(
        "Whisper model not ready yet. Please wait for initialization to complete."
      );
    }

    const startTime = Date.now();

    try {
      // Skip very small or empty audio chunks
      if (audioBuffer.length < 1000) {
        // Less than ~0.06 seconds at 16kHz
        return {
          text: "",
          confidence: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // Convert Buffer directly to Float32Array (optimized)
      const audioData = new Float32Array(
        audioBuffer.buffer,
        audioBuffer.byteOffset,
        audioBuffer.length / 4
      );

      // Skip silent audio (quick RMS check)
      let sum = 0;
      for (let i = 0; i < audioData.length; i += 100) {
        // Sample every 100th value for speed
        sum += audioData[i] * audioData[i];
      }
      const rms = Math.sqrt(sum / (audioData.length / 100));

      // More aggressive silence detection and music/noise filtering
      if (rms < 0.01) {
        // Increased threshold for better silence detection
        return {
          text: "",
          confidence: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // Skip very loud audio (likely music/noise) or very consistent audio (background noise)
      if (rms > 0.3) {
        // Very loud, likely music or noise
        console.log(
          `🎵 Skipping loud audio (likely music): RMS ${rms.toFixed(4)}`
        );
        return {
          text: "",
          confidence: 0,
          processingTime: Date.now() - startTime,
        };
      }

      console.log(
        `⚡ Fast processing: ${audioData.length} samples, RMS: ${rms.toFixed(
          4
        )}`
      );

      // Optimized Whisper options for speed and better speech detection
      const result = await this.transcriber(audioData, {
        language: options.language || "english",
        task: "transcribe",
        return_timestamps: false,
        chunk_length_s: 20, // Shorter chunks for speed
        stride_length_s: 2, // Reduced overlap
        no_speech_threshold: 0.6, // Higher threshold to skip non-speech more aggressively
        compression_ratio_threshold: 1.5, // More aggressive filtering
        logprob_threshold: -0.8, // Skip low-confidence transcriptions
      });

      const processingTime = Date.now() - startTime;

      let text = result.text || "";

      // Server-side filtering for unwanted transcriptions
      if (text) {
        text = text.trim();

        // Filter out common unwanted patterns at the service level
        const unwantedPatterns = [
          /^\([^)]*\)$/, // Anything in parentheses
          /^\s*(music|applause|laughter|noise|silence|cheering|singing|instrumental)\s*$/i,
          /^\s*\[.*\]\s*$/, // Anything in square brackets
          /^\s*♪.*♪\s*$/, // Musical notes
        ];

        for (const pattern of unwantedPatterns) {
          if (pattern.test(text)) {
            console.log(`🚫 Server filtered: "${text}"`);
            text = "";
            break;
          }
        }
      }

      console.log(`⚡ Fast transcription (${processingTime}ms): "${text}"`);

      return {
        text,
        confidence: result.confidence || 0,
        processingTime,
      };
    } catch (error) {
      console.error("❌ Fast stream transcription error:", error);
      throw new Error(
        `Transcription failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public getSupportedLanguages(): Array<{ code: string; name: string }> {
    // Whisper supports many languages, here are the most common ones
    return [
      { code: "english", name: "English" },
      { code: "spanish", name: "Spanish" },
      { code: "french", name: "French" },
      { code: "german", name: "German" },
      { code: "italian", name: "Italian" },
      { code: "portuguese", name: "Portuguese" },
      { code: "russian", name: "Russian" },
      { code: "japanese", name: "Japanese" },
      { code: "korean", name: "Korean" },
      { code: "chinese", name: "Chinese" },
      { code: "dutch", name: "Dutch" },
      { code: "arabic", name: "Arabic" },
      { code: "hindi", name: "Hindi" },
    ];
  }

  public getStatus(): {
    isReady: boolean;
    isInitializing: boolean;
    modelName: string;
  } {
    return {
      isReady: this.isReady,
      isInitializing: this.isInitializing,
      modelName: "Xenova/whisper-small.en",
    };
  }

  public async restart() {
    console.log("🔄 Restarting Whisper service...");
    this.isReady = false;
    this.isInitializing = false;
    this.transcriber = null;
    await this.initialize();
  }
}

export default WhisperService;
