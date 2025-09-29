import { BrowserWindow, ipcMain } from "electron";

interface SpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
}

class SpeechToTextService {
  private mainWindow: BrowserWindow | null = null;
  private isRecognitionActive = false;

  constructor(window: BrowserWindow) {
    this.mainWindow = window;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    ipcMain.handle(
      "start-speech-recognition",
      async (_, options: SpeechRecognitionOptions = {}) => {
        try {
          if (this.isRecognitionActive) {
            return { success: false, error: "Recognition already active" };
          }

          // Send recognition start command to renderer
          this.mainWindow?.webContents.send("start-recognition-internal", {
            language: options.language || "en-US",
            continuous: options.continuous !== false, // default to true
            interimResults: options.interimResults !== false, // default to true
          });

          this.isRecognitionActive = true;
          this.mainWindow?.webContents.send(
            "recognition-state-change",
            "starting"
          );

          return { success: true };
        } catch (error) {
          console.error("Failed to start speech recognition:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    ipcMain.handle("stop-speech-recognition", async () => {
      try {
        if (!this.isRecognitionActive) {
          return { success: false, error: "Recognition not active" };
        }

        // Send recognition stop command to renderer
        this.mainWindow?.webContents.send("stop-recognition-internal");

        this.isRecognitionActive = false;
        this.mainWindow?.webContents.send(
          "recognition-state-change",
          "stopped"
        );

        return { success: true };
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    ipcMain.handle("get-speech-languages", async () => {
      // Common speech recognition languages
      return [
        { code: "en-US", name: "English (US)" },
        { code: "en-GB", name: "English (UK)" },
        { code: "es-ES", name: "Spanish (Spain)" },
        { code: "es-MX", name: "Spanish (Mexico)" },
        { code: "fr-FR", name: "French (France)" },
        { code: "de-DE", name: "German (Germany)" },
        { code: "it-IT", name: "Italian (Italy)" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "ja-JP", name: "Japanese (Japan)" },
        { code: "ko-KR", name: "Korean (South Korea)" },
        { code: "zh-CN", name: "Chinese (Mandarin)" },
        { code: "ru-RU", name: "Russian (Russia)" },
        { code: "ar-SA", name: "Arabic (Saudi Arabia)" },
        { code: "hi-IN", name: "Hindi (India)" },
        { code: "nl-NL", name: "Dutch (Netherlands)" },
        { code: "sv-SE", name: "Swedish (Sweden)" },
        { code: "da-DK", name: "Danish (Denmark)" },
        { code: "no-NO", name: "Norwegian (Norway)" },
        { code: "fi-FI", name: "Finnish (Finland)" },
      ];
    });

    // Handle transcription results from renderer
    ipcMain.on("transcription-result-internal", (_, result) => {
      this.mainWindow?.webContents.send("transcription-result", result);
    });

    // Handle transcription errors from renderer
    ipcMain.on("transcription-error-internal", (_, error) => {
      this.isRecognitionActive = false;
      this.mainWindow?.webContents.send("transcription-error", error);
      this.mainWindow?.webContents.send("recognition-state-change", "error");
    });

    // Handle state changes from renderer
    ipcMain.on("recognition-state-internal", (_, state) => {
      if (state === "start") {
        this.mainWindow?.webContents.send("recognition-state-change", "active");
      } else if (state === "end") {
        this.isRecognitionActive = false;
        this.mainWindow?.webContents.send(
          "recognition-state-change",
          "stopped"
        );
      }
    });
  }

  public cleanup() {
    if (this.isRecognitionActive) {
      this.mainWindow?.webContents.send("stop-recognition-internal");
      this.isRecognitionActive = false;
    }
  }
}

export default SpeechToTextService;
