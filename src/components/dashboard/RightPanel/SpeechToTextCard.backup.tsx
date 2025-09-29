import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Settings,
  Copy,
  Download,
  Volume2,
} from "lucide-react";

interface SpeechToTextCardProps {
  onWindowSelect: (windowId: string) => void;
}

interface LanguageOption {
  code: string;
  name: string;
}

export const SpeechToTextCard: React.FC<SpeechToTextCardProps> = React.memo(
  ({ onWindowSelect }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [sourceLanguage, setSourceLanguage] = useState("en-US");
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
    const [supportedLanguages, setSupportedLanguages] = useState<
      LanguageOption[]
    >([]);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Refs for event listeners
    const resultUnsubscribeRef = useRef<(() => void) | null>(null);
    const errorUnsubscribeRef = useRef<(() => void) | null>(null);
    const stateUnsubscribeRef = useRef<(() => void) | null>(null);

    // Load supported languages on component mount
    useEffect(() => {
      const loadLanguages = async () => {
        try {
          if (window.speechToTextAPI?.getSupportedLanguages) {
            const languages =
              await window.speechToTextAPI.getSupportedLanguages();
            setSupportedLanguages(languages);
          }
        } catch (error) {
          console.error("Failed to load supported languages:", error);
        }
      };

      loadLanguages();
    }, []);

    // Set up event listeners
    useEffect(() => {
      console.log(
        "Setting up event listeners, speechToTextAPI available:",
        !!window.speechToTextAPI
      );

      if (!window.speechToTextAPI) {
        console.warn("speechToTextAPI not available, cannot set up listeners");
        return;
      }

      // Listen for transcription results
      const unsubscribeResults = window.speechToTextAPI.onTranscriptionResult(
        (result: any) => {
          console.log("Transcription result received:", result);
          const { transcript, isFinal } = result;

          if (isFinal) {
            setCurrentTranscript((prev) => {
              const newTranscript = prev + " " + transcript;
              return newTranscript.trim();
            });
            setInterimTranscript("");
          } else {
            setInterimTranscript(transcript);
          }
        }
      );

      // Listen for transcription errors
      const unsubscribeErrors = window.speechToTextAPI.onTranscriptionError(
        (error: any) => {
          console.error("Transcription error received:", error);
          setError(`Speech recognition error: ${error}`);
          setIsRecording(false);
        }
      );

      // Listen for recognition state changes
      const unsubscribeState = window.speechToTextAPI.onRecognitionStateChange(
        (state: string) => {
          console.log("Recognition state change received:", state);

          if (state === "stopped" || state === "error") {
            setIsRecording(false);
          } else if (state === "active") {
            setIsRecording(true);
          }
        }
      );

      return () => {
        unsubscribeResults();
        unsubscribeErrors();
        unsubscribeState();
      };
    }, []);

    const handleStartRecording = useCallback(async () => {
      console.log("SpeechToTextCard: handleStartRecording called");
      console.log("speechToTextAPI available:", !!window.speechToTextAPI);

      if (!window.speechToTextAPI) {
        console.error("Speech recognition API not available");
        setError("Speech recognition API not available");
        return;
      }

      try {
        setError("");
        setIsLoading(true);

        console.log("Starting recognition with options:", {
          language: sourceLanguage,
          continuous: true,
          interimResults: true,
        });

        await window.speechToTextAPI.startRecognition({
          language: sourceLanguage,
          continuous: true,
          interimResults: true,
        });

        console.log("Recognition started successfully");
        setIsRecording(true);
      } catch (error) {
        console.error("Failed to start recording:", error);
        setError("Failed to start speech recognition");
      } finally {
        setIsLoading(false);
      }
    }, [sourceLanguage]);

    const handleStopRecording = useCallback(async () => {
      if (!window.speechToTextAPI) return;

      try {
        await window.speechToTextAPI.stopRecognition();
        setIsRecording(false);

        // Save current transcript to history if it has content
        if (currentTranscript.trim()) {
          setTranscriptHistory((prev) => [...prev, currentTranscript.trim()]);
        }
      } catch (error) {
        console.error("Failed to stop recording:", error);
        setError("Failed to stop speech recognition");
      }
    }, [currentTranscript]);

    const handleClearTranscript = () => {
      setCurrentTranscript("");
      setInterimTranscript("");
      setError("");
    };

    const handleCopyTranscript = async () => {
      const fullTranscript =
        currentTranscript + (interimTranscript ? " " + interimTranscript : "");
      if (fullTranscript.trim()) {
        try {
          await navigator.clipboard.writeText(fullTranscript.trim());
          // Could show a toast notification here
        } catch (error) {
          console.error("Failed to copy text:", error);
        }
      }
    };

    const handleExportTranscript = () => {
      const fullHistory = transcriptHistory
        .concat(currentTranscript ? [currentTranscript] : [])
        .join("\n\n");

      if (fullHistory.trim()) {
        const blob = new Blob([fullHistory], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transcript-${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    const displayTranscript =
      currentTranscript + (interimTranscript ? " " + interimTranscript : "");

    return (
      <div className="group col-span-5 row-span-3 backdrop-blur-2xl bg-gradient-to-r from-theme-primary-900/80 via-stone-900/70 to-theme-primary-800/80 border border-theme-primary-400/50 rounded-2xl p-3 shadow-lg shadow-theme-primary-500/30 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isRecording ? "bg-green-500 animate-pulse" : "bg-stone-500"
              }`}
            ></div>
            <h3 className="text-base font-semibold text-white">
              Speech to Text
            </h3>
          </div>
          <button
            onClick={() => onWindowSelect("speech-to-text")}
            className="group relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-theme-primary-500/20 via-theme-primary-500/20 to-theme-primary-600/20 border border-theme-primary-400/30 backdrop-blur-sm transition-all duration-300 hover:from-theme-primary-500/30 hover:via-theme-primary-500/30 hover:to-theme-primary-600/30 hover:border-theme-primary-300/50 hover:shadow-lg hover:shadow-theme-primary-500/25 hover:scale-105 flex-shrink-0"
            title="Add to window grid"
          >
            <Volume2 className="w-4 h-4 text-theme-primary-300 group-hover:text-white transition-colors duration-300" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-theme-primary-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isRecording ? "bg-theme-primary-500" : "bg-stone-500"
              }`}
            ></div>
            <span className="text-theme-primary-300 text-xs font-medium">
              {isRecording ? "RECORDING" : "READY"}
            </span>
          </div>
          <div className="text-stone-400 text-xs">
            •{" "}
            {supportedLanguages.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}
          </div>
        </div>

        {/* Transcript Display */}
        <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-600/30 h-24 overflow-hidden">
          {error ? (
            <div className="text-red-400 text-sm">{error}</div>
          ) : displayTranscript ? (
            <div className="text-white text-sm leading-relaxed line-clamp-3">
              {currentTranscript}
              {interimTranscript && (
                <span className="text-stone-400 italic">
                  {" "}
                  {interimTranscript}
                </span>
              )}
            </div>
          ) : (
            <div className="text-stone-500 text-sm italic line-clamp-3">
              {isRecording
                ? "Listening... Speak into your microphone."
                : "Click the microphone button below to start transcription."}
            </div>
          )}
          {displayTranscript && (
            <div className="text-stone-400 text-xs mt-2 flex items-center gap-1">
              <span>🎤 Live</span>
              <span>•</span>
              <span>{displayTranscript.split(" ").length} words</span>
            </div>
          )}
        </div>

        {/* Floating Controls - appears on hover */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading || !window.speechToTextAPI}
            className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isRecording
                ? "bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30"
                : "bg-theme-primary-500/20 border border-theme-primary-400/50 text-theme-primary-300 hover:bg-theme-primary-500/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>

          {displayTranscript && (
            <>
              <button
                onClick={handleCopyTranscript}
                title="Copy transcript"
                className="p-2 rounded-lg bg-stone-500/20 border border-stone-400/50 text-stone-300 hover:bg-stone-500/30 transition-all duration-200"
              >
                <Copy className="w-3 h-3" />
              </button>
              <button
                onClick={handleClearTranscript}
                title="Clear transcript"
                className="p-2 rounded-lg bg-stone-500/20 border border-stone-400/50 text-stone-300 hover:bg-stone-500/30 transition-all duration-200"
              >
                <MicOff className="w-3 h-3" />
              </button>
            </>
          )}

          {/* Language selector - compact */}
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            disabled={isRecording}
            className="bg-stone-800/50 border border-stone-600/50 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-theme-primary-500 disabled:opacity-50 max-w-20"
            title="Select Language"
          >
            {supportedLanguages.slice(0, 5).map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.code.split("-")[0].toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* API Not Available Warning */}
        {!window.speechToTextAPI && (
          <div className="absolute inset-0 bg-stone-900/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="text-center p-3">
              <div className="text-red-400 text-sm font-medium mb-1">
                Speech API Unavailable
              </div>
              <div className="text-stone-300 text-xs">
                Speech recognition is not available.
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);
