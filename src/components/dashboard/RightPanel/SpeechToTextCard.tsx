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
import { BiMicrophone } from "react-icons/bi";

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
        <div className="flex items-center w-full justify-center gap-2 mb-2">
          <BiMicrophone className="w-24 h-24 animate-pulse text-theme-primary-300" />
        </div>
      </div>
    );
  }
);
