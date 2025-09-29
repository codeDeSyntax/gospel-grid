// Client-side speech recognition using Web Speech API
export class ClientSpeechRecognition {
  private recognition: any = null;
  private isSupported = false;

  constructor() {
    console.log("ClientSpeechRecognition constructor called");
    this.checkSupport();
    this.setupEventHandlers();
    console.log(
      "ClientSpeechRecognition initialized. Supported:",
      this.isSupported
    );
  }

  private checkSupport() {
    console.log("Checking speech recognition support...");
    if (typeof window !== "undefined") {
      const hasWebkitSpeech = "webkitSpeechRecognition" in window;
      const hasSpeech = "SpeechRecognition" in window;
      console.log("webkitSpeechRecognition available:", hasWebkitSpeech);
      console.log("SpeechRecognition available:", hasSpeech);

      this.isSupported = hasWebkitSpeech || hasSpeech;

      if (this.isSupported) {
        const SpeechRecognition =
          (window as any).webkitSpeechRecognition ||
          (window as any).SpeechRecognition;
        this.recognition = new SpeechRecognition();
        console.log("SpeechRecognition instance created:", !!this.recognition);
      } else {
        console.warn("Speech recognition not supported in this browser");
      }
    } else {
      console.warn("Window object not available");
    }
  }

  private setupEventHandlers() {
    if (!this.recognition) {
      console.warn("No recognition instance available for event handlers");
      return;
    }

    this.recognition.onstart = () => {
      console.log("Speech recognition onstart event fired");
      (window as any).electronAPI?.ipcRenderer?.send(
        "recognition-state-internal",
        "start"
      );
    };

    this.recognition.onresult = (event: any) => {
      console.log("Speech recognition onresult event fired:", event);
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        console.log(
          `Result ${i}: "${transcript}" (isFinal: ${event.results[i].isFinal})`
        );

        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      const result = {
        finalTranscript: finalTranscript.trim(),
        interimTranscript: interimTranscript,
        isFinal: finalTranscript.length > 0,
        timestamp: Date.now(),
        confidence: event.results[event.resultIndex]?.[0]?.confidence || 0,
      };

      console.log("Sending transcription result:", result);
      (window as any).electronAPI?.ipcRenderer?.send(
        "transcription-result-internal",
        result
      );
    };

    this.recognition.onspeechstart = () => {
      console.log("Speech recognition: speech started");
      (window as any).electronAPI?.ipcRenderer?.send(
        "recognition-state-internal",
        "speechstart"
      );
    };

    this.recognition.onspeechend = () => {
      console.log("Speech recognition: speech ended");
      (window as any).electronAPI?.ipcRenderer?.send(
        "recognition-state-internal",
        "speechend"
      );
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      const error = {
        error: event.error,
        message: this.getErrorMessage(event.error),
        timestamp: Date.now(),
      };
      console.log("Sending error:", error);
      (window as any).electronAPI?.ipcRenderer?.send(
        "transcription-error-internal",
        error
      );
    };

    this.recognition.onend = () => {
      console.log("Speech recognition ended");
      (window as any).electronAPI?.ipcRenderer?.send(
        "recognition-state-internal",
        "end"
      );
    };

    this.recognition.onnomatch = () => {
      console.log("Speech recognition: no match found");
      (window as any).electronAPI?.ipcRenderer?.send(
        "transcription-error-internal",
        {
          error: "no-match",
          message: "No speech was recognized",
          timestamp: Date.now(),
        }
      );
    };

    console.log("All event handlers setup complete");
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      "no-speech": "No speech detected. Please try speaking again.",
      "audio-capture": "Audio capture failed. Please check your microphone.",
      "not-allowed":
        "Microphone access denied. Please allow microphone access.",
      network: "Network error. Please check your internet connection.",
      "service-not-allowed": "Speech recognition service not allowed.",
      "bad-grammar": "Grammar error in recognition.",
      "language-not-supported": "Selected language is not supported.",
    };

    return errorMessages[error] || `Speech recognition error: ${error}`;
  }

  public async start(options: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }) {
    console.log(
      "ClientSpeechRecognition.start() called with options:",
      options
    );
    console.log(
      "isSupported:",
      this.isSupported,
      "recognition:",
      !!this.recognition
    );
    console.log("isSecureContext:", window.isSecureContext);

    if (!this.isSupported || !this.recognition) {
      throw new Error("Speech recognition is not supported in this browser");
    }

    // Check for secure context (required for Chrome)
    if (!window.isSecureContext) {
      console.warn(
        "Not in secure context - speech recognition may not work properly"
      );
    }

    try {
      // Request microphone permission first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          console.log("Requesting microphone permission...");
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          console.log("Microphone permission granted");
          // Stop the stream immediately as we just needed permission
          stream.getTracks().forEach((track) => track.stop());
        } catch (permissionError) {
          console.error("Microphone permission denied:", permissionError);
          throw new Error(
            "Microphone access is required for speech recognition"
          );
        }
      }

      // Configure recognition
      this.recognition.lang = options.language || "en-US";
      this.recognition.continuous = options.continuous !== false;
      this.recognition.interimResults = options.interimResults !== false;
      this.recognition.maxAlternatives = 1;

      console.log("Starting speech recognition with config:", {
        lang: this.recognition.lang,
        continuous: this.recognition.continuous,
        interimResults: this.recognition.interimResults,
      });

      // Start recognition
      this.recognition.start();
      console.log("Speech recognition start() method called");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      throw error;
    }
  }

  public stop() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  public isRecognitionSupported(): boolean {
    return this.isSupported;
  }
}

// Global instance
let speechRecognitionInstance: ClientSpeechRecognition | null = null;

// Function to initialize speech recognition
function initializeSpeechRecognition() {
  console.log("Initializing client-side speech recognition");
  speechRecognitionInstance = new ClientSpeechRecognition();
  console.log(
    "ClientSpeechRecognition instance created:",
    !!speechRecognitionInstance
  );

  // Listen for commands from main process
  (window as any).electronAPI?.ipcRenderer?.on(
    "start-recognition-internal",
    async (_: any, options: any) => {
      console.log("Received start-recognition-internal command:", options);
      try {
        await speechRecognitionInstance?.start(options);
      } catch (error) {
        console.error("Failed to start recognition:", error);
        (window as any).electronAPI?.ipcRenderer?.send(
          "transcription-error-internal",
          {
            error: "start-failed",
            message:
              error instanceof Error
                ? error.message
                : "Failed to start recognition",
            timestamp: Date.now(),
          }
        );
      }
    }
  );

  (window as any).electronAPI?.ipcRenderer?.on(
    "stop-recognition-internal",
    () => {
      console.log("Received stop-recognition-internal command");
      speechRecognitionInstance?.stop();
    }
  );

  console.log("IPC listeners setup complete");
}

// Setup client-side speech recognition when DOM is ready
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeSpeechRecognition);
  } else {
    // DOM is already loaded
    initializeSpeechRecognition();
  }
}
