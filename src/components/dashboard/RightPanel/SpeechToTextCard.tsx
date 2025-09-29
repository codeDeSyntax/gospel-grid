import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic,
  MicOff,
  Languages,
  Settings,
  Copy,
  Download,
  Volume2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface SpeechToTextCardProps {
  onWindowSelect: (windowId: string) => void;
}

interface LanguageOption {
  code: string;
  name: string;
}

interface WhisperStatus {
  isConnected: boolean;
  isConnecting: boolean;
  sessionId?: string;
}

export const SpeechToTextCard: React.FC<SpeechToTextCardProps> = React.memo(
  ({ onWindowSelect }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [sourceLanguage, setSourceLanguage] = useState("english");
    const [currentTranscript, setCurrentTranscript] = useState("");
    const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
    const [supportedLanguages, setSupportedLanguages] = useState<
      LanguageOption[]
    >([]);
    const [whisperStatus, setWhisperStatus] = useState<WhisperStatus>({
      isConnected: true, // Default to connected since AssemblyAI is ready after API key validation
      isConnecting: false,
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    // Audio recording refs
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const workletNodeRef = useRef<AudioWorkletNode | null>(null);
    const processingQueueRef = useRef<Float32Array[]>([]);
    const isProcessingRef = useRef(false); // Load supported languages and Whisper status on component mount
    useEffect(() => {
      const initializeWhisper = async () => {
        try {
          // Get supported languages (returns {success, languages} object)
          const langResult =
            await window.speechToTextAPI.getSupportedLanguages();
          if (langResult.success && langResult.languages) {
            setSupportedLanguages(langResult.languages);
          } else {
            // Set default languages if API call fails
            setSupportedLanguages([
              { code: "english", name: "English" },
              { code: "spanish", name: "Spanish" },
              { code: "french", name: "French" },
              { code: "german", name: "German" },
            ]);
          }

          // Get initial status
          const statusResult = await window.speechToTextAPI.getStatus();
          if (statusResult.success && statusResult.status) {
            setWhisperStatus({
              isConnected: statusResult.status.isConnected || false,
              isConnecting: statusResult.status.isConnecting || false,
              sessionId: statusResult.status.sessionId,
            });
          }
        } catch (error) {
          console.error("Failed to initialize Whisper:", error);
          setError("Failed to initialize speech recognition service");
          // Set default languages as fallback
          setSupportedLanguages([
            { code: "english", name: "English" },
            { code: "spanish", name: "Spanish" },
            { code: "french", name: "French" },
            { code: "german", name: "German" },
          ]);
        }
      };

      initializeWhisper();
    }, []);

    // Listen for Whisper status updates
    useEffect(() => {
      const unsubscribe = window.speechToTextAPI.onWhisperStatus(
        (status: any) => {
          console.log("Whisper status update:", status);

          if (status.status === "ready") {
            setWhisperStatus({
              isConnected: true,
              isConnecting: false,
            });
            setError("");
          } else if (status.status === "loading") {
            setWhisperStatus({
              isConnected: false,
              isConnecting: true,
            });
            setError("");
          } else if (status.status === "error") {
            setWhisperStatus({
              isConnected: false,
              isConnecting: false,
            });
            setError(status.message || "AssemblyAI initialization failed");
          }
        }
      );

      return unsubscribe;
    }, []);

    // High-performance audio processing queue
    const processAudioQueue = useCallback(async () => {
      if (isProcessingRef.current || processingQueueRef.current.length === 0) {
        return;
      }

      isProcessingRef.current = true;

      while (processingQueueRef.current.length > 0) {
        const audioData = processingQueueRef.current.shift();
        if (audioData) {
          await processAudioChunk(audioData);

          // Small delay to prevent overwhelming the system
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      isProcessingRef.current = false;
    }, [sourceLanguage]);

    const processAudioChunk = useCallback(
      async (audioData: Float32Array) => {
        try {
          // Convert Float32Array to ArrayBuffer for IPC with zero-copy transfer
          const arrayBuffer = audioData.buffer.slice(
            audioData.byteOffset,
            audioData.byteOffset + audioData.byteLength
          ) as ArrayBuffer;

          console.log(
            `⚡ Processing optimized audio chunk: ${audioData.length} samples`
          );

          // Use streaming API with optimized parameters
          const result = await window.speechToTextAPI.transcribeStream(
            arrayBuffer,
            {
              language: sourceLanguage,
              isLast: false,
            }
          );

          if (result.success && result.text) {
            const transcript = result.text.trim();

            // Enhanced quality filtering for better transcription
            const isValidTranscription = (text: string): boolean => {
              if (!text || text.length < 3) return false;

              // Remove sound descriptions and unwanted patterns
              const unwantedPatterns = [
                /^\([^)]*\)$/, // Anything in parentheses like "(music)", "(crowd cheering)"
                /\(music\)/i,
                /\(crowd cheering\)/i,
                /\(applause\)/i,
                /\(laughter\)/i,
                /\(noise\)/i,
                /\(silence\)/i,
                /\(singing\)/i,
                /\(instrumental\)/i,
                /\(background music\)/i,
                /^(music|applause|laughter|noise|silence|cheering|singing)$/i,
                /^(um|uh|ah|mm|hmm|oh|eh)$/i, // Common filler words
                /^[\W\s]*$/, // Only punctuation and whitespace
                /^[^a-zA-Z]*$/, // No alphabetic characters
              ];

              // Check against unwanted patterns
              for (const pattern of unwantedPatterns) {
                if (pattern.test(text)) {
                  console.log(
                    `🚫 Filtered out unwanted transcription: "${text}"`
                  );
                  return false;
                }
              }

              // Must contain at least some alphabetic content
              const hasAlphabetic = /[a-zA-Z]/.test(text);
              if (!hasAlphabetic) {
                console.log(
                  `🚫 Filtered out non-alphabetic transcription: "${text}"`
                );
                return false;
              }

              // Filter out very short words unless they're common meaningful words
              if (text.length < 4) {
                const meaningfulShortWords = [
                  "yes",
                  "no",
                  "ok",
                  "hi",
                  "bye",
                  "and",
                  "the",
                  "for",
                  "you",
                  "are",
                  "can",
                  "but",
                  "not",
                  "see",
                  "get",
                  "now",
                  "how",
                  "why",
                  "who",
                  "new",
                  "old",
                  "big",
                  "run",
                  "go",
                  "do",
                  "be",
                ];
                if (!meaningfulShortWords.includes(text.toLowerCase())) {
                  console.log(
                    `🚫 Filtered out short non-meaningful word: "${text}"`
                  );
                  return false;
                }
              }

              return true;
            };

            if (isValidTranscription(transcript)) {
              console.log(`✅ Valid transcription: "${transcript}"`);

              // Optimized state updates
              setCurrentTranscript((prev) => {
                const newText = prev ? `${prev} ${transcript}` : transcript;
                return newText;
              });

              // Efficient history management (keep last 50 entries)
              setTranscriptHistory((prev) => {
                const newHistory = [...prev, transcript];
                return newHistory.length > 50
                  ? newHistory.slice(-50)
                  : newHistory;
              });
            }
          } else if (
            result.error &&
            !result.error.includes("silent") &&
            !result.error.includes("queue overflow")
          ) {
            console.warn("⚠️ Transcription chunk error:", result.error);
          }
        } catch (error) {
          console.error("❌ Fast audio processing error:", error);
          setError(
            `Transcription error: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      },
      [sourceLanguage]
    );
    const startLiveTranscription = useCallback(async () => {
      try {
        setError("");
        setIsLoading(true);

        console.log("🚀 Starting AssemblyAI direct streaming...");

        // Request microphone access first
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });

        streamRef.current = stream;

        // Start AssemblyAI streaming session
        const streamResult = await window.speechToTextAPI.startStreaming({
          sampleRate: 16000,
        });

        if (!streamResult.success) {
          throw new Error(
            streamResult.error || "Failed to start AssemblyAI streaming"
          );
        }

        console.log("✅ AssemblyAI streaming session started");

        // Listen for real-time transcription results from AssemblyAI
        const unsubscribe = window.speechToTextAPI.onSpeechResult?.(
          (result: any) => {
            if (result.success && result.text) {
              const transcript = result.text.trim();

              // Enhanced quality filtering for better transcription
              const isValidTranscription = (text: string): boolean => {
                if (!text || text.length < 3) return false;

                // Remove sound descriptions and unwanted patterns
                const unwantedPatterns = [
                  /^\([^)]*\)$/, // Anything in parentheses like "(music)", "(crowd cheering)"
                  /\(music\)/i,
                  /\(crowd cheering\)/i,
                  /\(applause\)/i,
                  /\(laughter\)/i,
                  /\(noise\)/i,
                  /\(silence\)/i,
                  /\(singing\)/i,
                  /\(instrumental\)/i,
                  /\(background music\)/i,
                  /^(music|applause|laughter|noise|silence|cheering|singing)$/i,
                  /^(um|uh|ah|mm|hmm|oh|eh)$/i, // Common filler words
                  /^[^\w\s]*$/, // Only punctuation/symbols
                  /^\d+$/, // Only numbers
                ];

                return !unwantedPatterns.some((pattern) =>
                  pattern.test(text.toLowerCase())
                );
              };

              if (transcript && isValidTranscription(transcript)) {
                console.log(
                  `✅ AssemblyAI transcription: "${transcript}" (final: ${result.isFinal})`
                );

                // Update current transcript based on whether it's interim or final
                setCurrentTranscript((prev) => {
                  if (result.isFinal) {
                    // Final result - append to existing transcript
                    return prev ? `${prev} ${transcript}` : transcript;
                  } else {
                    // Interim result - show as temporary addition
                    const basePrev =
                      prev?.replace(/ \[\.\.\..*\]$/, "") || prev || "";
                    return basePrev
                      ? `${basePrev} [... ${transcript}]`
                      : `[... ${transcript}]`;
                  }
                });

                // Add to history only for final results
                if (result.isFinal) {
                  setTranscriptHistory((prev) => {
                    const newHistory = [...prev, transcript];
                    return newHistory.length > 50
                      ? newHistory.slice(-50)
                      : newHistory;
                  });
                }
              } else {
                console.log(
                  `🚫 Filtered out unwanted transcription: "${transcript}"`
                );
              }
            } else if (result.error) {
              console.warn("⚠️ AssemblyAI transcription error:", result.error);
            }
          }
        );

        // Store the unsubscribe function for cleanup
        if (unsubscribe) {
          (window as any).assemblyUnsubscribe = unsubscribe;
        }

        // Use Web Audio API instead of MediaRecorder to get raw PCM data
        // This is what AssemblyAI streaming requires - raw audio samples, not container formats
        console.log("🎙️ Setting up Web Audio API for raw PCM capture...");

        const audioContext = new AudioContext({
          sampleRate: 16000, // AssemblyAI requires 16kHz
        });

        // Create audio source from the microphone stream
        const sourceNode = audioContext.createMediaStreamSource(stream);

        // Create a script processor to capture raw audio data
        // Note: ScriptProcessorNode is deprecated but still widely supported
        // In production, consider using AudioWorkletNode for better performance
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

        scriptProcessor.onaudioprocess = async (audioProcessingEvent) => {
          // Get the raw audio data (Float32Array)
          const inputBuffer = audioProcessingEvent.inputBuffer;
          const audioData = inputBuffer.getChannelData(0); // Get mono channel

          // Convert Float32Array to Int16Array (16-bit PCM) as expected by AssemblyAI
          const pcmData = new Int16Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            // Convert from -1.0...1.0 to -32768...32767
            const sample = Math.max(-1, Math.min(1, audioData[i]));
            pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
          }

          // Convert Int16Array to ArrayBuffer for transmission
          const arrayBuffer = pcmData.buffer;

          console.log(
            `🎤 Captured raw PCM: ${pcmData.length} samples (${arrayBuffer.byteLength} bytes)`
          );

          try {
            // Send raw PCM data to AssemblyAI streaming
            await window.speechToTextAPI.transcribeStream(arrayBuffer, {
              language: sourceLanguage,
              isLast: false,
            });
          } catch (error) {
            console.error("❌ Error sending PCM data to AssemblyAI:", error);
          }
        };

        // Connect the audio nodes
        sourceNode.connect(scriptProcessor);
        scriptProcessor.connect(audioContext.destination);

        // Store references for cleanup
        (window as any).audioContextRef = audioContext;
        (window as any).scriptProcessorRef = scriptProcessor;
        (window as any).sourceNodeRef = sourceNode;

        setIsStreaming(true);
        setIsRecording(true);
        setIsLoading(false);

        console.log(
          "🎤 AssemblyAI streaming started with Web Audio API (raw PCM capture)"
        );
      } catch (error) {
        console.error("Failed to start AssemblyAI streaming:", error);
        setError(
          "Failed to access microphone or start AssemblyAI streaming. Please check permissions and API key."
        );
        setIsLoading(false);
      }
    }, [sourceLanguage]);

    const stopLiveTranscription = useCallback(async () => {
      console.log("🛑 Stopping AssemblyAI direct streaming...");

      try {
        // Stop AssemblyAI streaming session
        await window.speechToTextAPI.stopStreaming();
        console.log("✅ AssemblyAI streaming session stopped");
      } catch (error) {
        console.error("❌ Error stopping AssemblyAI streaming:", error);
      }

      // Stop MediaRecorder if active (legacy cleanup)
      const mediaRecorder = (window as any).mediaRecorderRef;
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        (window as any).mediaRecorderRef = null;
        console.log("🛑 MediaRecorder stopped");
      }

      // Clean up Web Audio API resources
      const scriptProcessor = (window as any).scriptProcessorRef;
      const sourceNode = (window as any).sourceNodeRef;
      const audioContext = (window as any).audioContextRef;

      if (scriptProcessor) {
        scriptProcessor.disconnect();
        (window as any).scriptProcessorRef = null;
        console.log("🛑 ScriptProcessor disconnected");
      }

      if (sourceNode) {
        sourceNode.disconnect();
        (window as any).sourceNodeRef = null;
        console.log("🛑 Source node disconnected");
      }

      if (audioContext && audioContext.state !== "closed") {
        audioContext.close();
        (window as any).audioContextRef = null;
        console.log("🛑 AudioContext closed");
      }

      // Clean up event listeners
      if ((window as any).assemblyUnsubscribe) {
        (window as any).assemblyUnsubscribe();
        (window as any).assemblyUnsubscribe = null;
      }

      // Stop audio processing (if any AudioWorklet was used)
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect();
        workletNodeRef.current = null;
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear processing queue
      processingQueueRef.current = [];
      isProcessingRef.current = false;

      setIsStreaming(false);
      setIsRecording(false);
      setIsLoading(false);

      console.log("🛑 AssemblyAI direct streaming stopped");
    }, []);

    const handleToggleRecording = useCallback(() => {
      if (isRecording) {
        stopLiveTranscription();
      } else {
        startLiveTranscription();
      }
    }, [isRecording, startLiveTranscription, stopLiveTranscription]);

    const handleClearTranscript = () => {
      setCurrentTranscript("");
      setError("");
    };

    const handleCopyTranscript = async () => {
      if (currentTranscript.trim()) {
        try {
          await navigator.clipboard.writeText(currentTranscript.trim());
          console.log("📋 Transcript copied to clipboard");
        } catch (error) {
          console.error("Failed to copy text:", error);
          setError("Failed to copy transcript to clipboard");
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
        a.download = `whisper-transcript-${new Date()
          .toISOString()
          .slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        console.log("📁 Transcript exported to file");
      }
    };

    const handleRestartWhisper = async () => {
      try {
        setIsLoading(true);
        setError("");
        await window.speechToTextAPI.restart();
        console.log("🔄 Whisper service restarted");
      } catch (error) {
        console.error("Failed to restart Whisper:", error);
        setError("Failed to restart speech recognition service");
      } finally {
        setIsLoading(false);
      }
    };

    const canRecord = !isLoading; // Simplify - just check if not loading

    return (
      <div className="col-span-5 row-span-3 backdrop-blur-2xl bg-gradient-to-r from-theme-primary-900/80 via-stone-900/70 to-theme-primary-800/80 border border-theme-primary-400/50 rounded-2xl p-3 shadow-lg shadow-theme-primary-500/30 relative overflow-hidden group">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isRecording
                  ? "bg-red-500 animate-pulse"
                  : isLoading
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-green-500"
              }`}
            ></div>
            <h3 className="text-base font-semibold text-white">
              AI Live Transcription
            </h3>
          </div>
          <button
            onClick={() => onWindowSelect("speech-to-text")}
            className="group relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-theme-primary-500/20 via-theme-primary-500/20 to-theme-primary-600/20 border border-theme-primary-400/30 backdrop-blur-sm transition-all duration-300 hover:from-theme-primary-500/30 hover:via-theme-primary-500/30 hover:to-theme-primary-600/30 hover:border-theme-primary-300/50 hover:shadow-lg hover:shadow-theme-primary-500/25 hover:scale-105 flex-shrink-0"
            title="Add to window grid"
          >
            <Volume2 className="w-4 h-4 text-theme-primary-300 group-hover:text-white transition-colors duration-300" />
          </button>
        </div>

        {/* Status and Language */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs">
            <Languages className="w-3 h-3 text-theme-primary-300" />
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              disabled={isRecording || isLoading}
              className="bg-stone-900/50 border border-stone-600/50 rounded px-2 py-1 text-theme-primary-300 text-xs focus:outline-none focus:ring-1 focus:ring-theme-primary-500 disabled:opacity-50"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            {whisperStatus.isConnecting && (
              <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
            )}
            <span className="text-xs text-stone-400">AssemblyAI Streaming</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleToggleRecording}
            disabled={!canRecord}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
              isRecording
                ? "bg-red-500/20 border border-red-400/50 text-red-300 hover:bg-red-500/30"
                : "bg-theme-primary-500/20 border border-theme-primary-400/50 text-theme-primary-300 hover:bg-theme-primary-500/30"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-3 h-3" />
            ) : (
              <Mic className="w-3 h-3" />
            )}
            {isLoading
              ? "Processing..."
              : isRecording
              ? "Stop Live"
              : "Start Live"}
          </button>

          <button
            onClick={handleClearTranscript}
            disabled={!currentTranscript}
            className="px-2 py-1 rounded text-xs font-medium bg-stone-500/20 border border-stone-400/50 text-stone-300 hover:bg-stone-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Clear
          </button>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={handleCopyTranscript}
              disabled={!currentTranscript.trim()}
              title="Copy transcript"
              className="p-1 rounded bg-blue-500/20 border border-blue-400/50 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={handleExportTranscript}
              disabled={!transcriptHistory.length && !currentTranscript.trim()}
              title="Export transcript"
              className="p-1 rounded bg-green-500/20 border border-green-400/50 text-green-300 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Download className="w-3 h-3" />
            </button>
            {!whisperStatus.isConnected && !whisperStatus.isConnecting && (
              <button
                onClick={handleRestartWhisper}
                disabled={isLoading}
                title="Restart Whisper service"
                className="p-1 rounded bg-orange-500/20 border border-orange-400/50 text-orange-300 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Settings className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        <div className="bg-stone-900/50 rounded-lg p-2 border border-stone-600/30 h-16 overflow-hidden">
          {error ? (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              {error}
            </div>
          ) : currentTranscript ? (
            <div className="text-white text-xs leading-relaxed line-clamp-3">
              {currentTranscript}
            </div>
          ) : (
            <div className="text-stone-500 text-xs italic">
              {isRecording
                ? "Live transcription active... Speak naturally and see text appear in real-time."
                : isLoading
                ? "Processing audio..."
                : 'Click "Start Live" to begin real-time transcription.'}
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="flex items-center justify-between mt-1 text-xs">
          <div className="text-stone-400">
            <span>Powered by AssemblyAI</span>
            {transcriptHistory.length > 0 && (
              <span> • {transcriptHistory.length} clips</span>
            )}
          </div>
          <div className="text-theme-primary-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Real-time streaming
          </div>
        </div>
      </div>
    );
  }
);
