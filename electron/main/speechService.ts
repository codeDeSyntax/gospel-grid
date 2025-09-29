import { BrowserWindow, ipcMain } from "electron";
import https from "https";
import querystring from "querystring";

export class SpeechService {
  private mainWindow: BrowserWindow | null = null;
  private isRecognizing = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupIpcHandlers();
  }

  private setupIpcHandlers() {
    // Speech Recognition Handlers
    ipcMain.handle("start-speech-recognition", async (_, options = {}) => {
      try {
        if (this.isRecognizing) {
          throw new Error("Speech recognition already active");
        }

        const defaultOptions = {
          language: "en-US",
          continuous: true,
          interimResults: true,
          ...options,
        };

        // Since Web Speech API runs in renderer process, we'll inject it
        await this.injectSpeechRecognition(defaultOptions);
        this.isRecognizing = true;

        return { success: true, message: "Speech recognition started" };
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    ipcMain.handle("stop-speech-recognition", async () => {
      try {
        if (!this.isRecognizing) {
          throw new Error("Speech recognition not active");
        }

        await this.stopSpeechRecognition();
        this.isRecognizing = false;

        return { success: true, message: "Speech recognition stopped" };
      } catch (error) {
        console.error("Failed to stop speech recognition:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });

    // Translation Handlers
    ipcMain.handle(
      "translate-text",
      async (
        _,
        text: string,
        options: {
          targetLanguage: string;
          sourceLanguage?: string;
        }
      ) => {
        try {
          const result = await this.translateText(text, options);

          // Send result via event for real-time updates
          this.mainWindow?.webContents.send("translation-result", result);

          return result;
        } catch (error) {
          console.error("Translation failed:", error);
          return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    );

    ipcMain.handle("get-supported-languages", async () => {
      return this.getSupportedLanguages();
    });

    ipcMain.handle("detect-language", async (_, text: string) => {
      try {
        return await this.detectLanguage(text);
      } catch (error) {
        console.error("Language detection failed:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    });
  }

  private async injectSpeechRecognition(options: any) {
    if (!this.mainWindow) return;

    // Inject Web Speech API code into renderer
    const speechCode = `
      (function() {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
          console.error('Speech recognition not supported');
          return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Configure recognition
        recognition.continuous = ${options.continuous};
        recognition.interimResults = ${options.interimResults};
        recognition.lang = '${options.language}';
        recognition.maxAlternatives = 1;

        // Event handlers
        recognition.onstart = function() {
          console.log('Speech recognition started');
        };

        recognition.onresult = function(event) {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Send result to main process
          window.electronAPI && window.electronAPI.send && window.electronAPI.send('speech-result-internal', {
            finalTranscript,
            interimTranscript,
            isFinal: finalTranscript.length > 0
          });

          // Also send via IPC for real-time updates
          require('electron').ipcRenderer.send('speech-result', {
            finalTranscript,
            interimTranscript,
            isFinal: finalTranscript.length > 0
          });
        };

        recognition.onerror = function(event) {
          console.error('Speech recognition error:', event.error);
          require('electron').ipcRenderer.send('speech-error', {
            error: event.error,
            message: event.message || 'Speech recognition error'
          });
        };

        recognition.onend = function() {
          console.log('Speech recognition ended');
          if (${options.continuous}) {
            recognition.start(); // Restart if continuous
          }
        };

        // Start recognition
        recognition.start();
        
        // Store reference globally
        window._speechRecognition = recognition;
      })();
    `;

    await this.mainWindow.webContents.executeJavaScript(speechCode);
  }

  private async stopSpeechRecognition() {
    if (!this.mainWindow) return;

    const stopCode = `
      if (window._speechRecognition) {
        window._speechRecognition.stop();
        delete window._speechRecognition;
      }
    `;

    await this.mainWindow.webContents.executeJavaScript(stopCode);
  }

  private async translateText(
    text: string,
    options: {
      targetLanguage: string;
      sourceLanguage?: string;
    }
  ) {
    // Using LibreTranslate free API as fallback
    // You can also use Google Translate free tier here
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        q: text,
        source: options.sourceLanguage || "auto",
        target: options.targetLanguage,
        format: "text",
      });

      const libretranslateOptions = {
        hostname: "libretranslate.pussthecat.org",
        port: 443,
        path: "/translate",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = https.request(libretranslateOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            resolve({
              success: true,
              originalText: text,
              translatedText: result.translatedText,
              sourceLanguage: options.sourceLanguage || "auto",
              targetLanguage: options.targetLanguage,
            });
          } catch (error) {
            reject(new Error("Failed to parse translation response"));
          }
        });
      });

      req.on("error", (error) => {
        // Fallback to mock translation for development
        resolve({
          success: true,
          originalText: text,
          translatedText: `[${options.targetLanguage.toUpperCase()}] ${text}`,
          sourceLanguage: options.sourceLanguage || "auto",
          targetLanguage: options.targetLanguage,
          note: "Mock translation - API unavailable",
        });
      });

      req.write(postData);
      req.end();
    });
  }

  private getSupportedLanguages() {
    return {
      speech: [
        { code: "en-US", name: "English (US)" },
        { code: "en-GB", name: "English (UK)" },
        { code: "es-ES", name: "Spanish (Spain)" },
        { code: "es-MX", name: "Spanish (Mexico)" },
        { code: "fr-FR", name: "French" },
        { code: "de-DE", name: "German" },
        { code: "it-IT", name: "Italian" },
        { code: "pt-BR", name: "Portuguese (Brazil)" },
        { code: "ru-RU", name: "Russian" },
        { code: "ja-JP", name: "Japanese" },
        { code: "ko-KR", name: "Korean" },
        { code: "zh-CN", name: "Chinese (Simplified)" },
        { code: "zh-TW", name: "Chinese (Traditional)" },
        { code: "ar-SA", name: "Arabic" },
        { code: "hi-IN", name: "Hindi" },
      ],
      translation: [
        { code: "en", name: "English" },
        { code: "es", name: "Spanish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "it", name: "Italian" },
        { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" },
        { code: "ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "zh", name: "Chinese" },
        { code: "ar", name: "Arabic" },
        { code: "hi", name: "Hindi" },
        { code: "nl", name: "Dutch" },
        { code: "sv", name: "Swedish" },
        { code: "da", name: "Danish" },
      ],
    };
  }

  private async detectLanguage(text: string) {
    // Simple language detection based on character patterns
    // For production, you'd want to use a proper language detection service

    if (/[\u4e00-\u9fff]/.test(text)) {
      return { code: "zh", name: "Chinese", confidence: 0.9 };
    }
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return { code: "ja", name: "Japanese", confidence: 0.9 };
    }
    if (/[\u0600-\u06ff]/.test(text)) {
      return { code: "ar", name: "Arabic", confidence: 0.9 };
    }
    if (/[\u0900-\u097f]/.test(text)) {
      return { code: "hi", name: "Hindi", confidence: 0.9 };
    }

    // Default to English for Latin characters
    return { code: "en", name: "English", confidence: 0.7 };
  }
}
