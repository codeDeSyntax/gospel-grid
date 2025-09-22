import React from "react";
import { Sparkles } from "lucide-react";
import type { AITranscriptionCardProps } from "./types";

export const AITranscriptionCard: React.FC<AITranscriptionCardProps> = ({
  onWindowSelect,
}) => {
  return (
    <div className="col-span-5 row-span-3 backdrop-blur-2xl bg-gradient-to-r from-theme-primary-900/80 via-stone-900/70 to-theme-primary-800/80 border border-theme-primary-400/50 rounded-2xl p-3 shadowlg shadow-theme-primary-500/30 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <h3 className="text-base font-semibold text-white">
            AI Live Transcription
          </h3>
        </div>
        <button
          onClick={() => onWindowSelect("ai-transcription")}
          className="group relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-theme-primary-500/20 via-theme-primary-500/20 to-theme-primary-600/20 border border-theme-primary-400/30 backdrop-blur-sm transition-all duration-300 hover:from-theme-primary-500/30 hover:via-theme-primary-500/30 hover:to-theme-primary-600/30 hover:border-theme-primary-300/50 hover:shadow-lg hover:shadow-theme-primary-500/25 hover:scale-105 flex-shrink-0"
          title="Add to window grid"
        >
          <Sparkles className="w-4 h-4 text-theme-primary-300 group-hover:text-white transition-colors duration-300" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-theme-primary-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-theme-primary-500 rounded-full"></div>
          <span className="text-theme-primary-300 text-xs font-medium">
            LISTENING
          </span>
        </div>
        <div className="text-stone-400 text-xs">• Live audio</div>
      </div>

      <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-600/30 h-24 overflow-hidden">
        <div className="text-white text-sm leading-relaxed line-clamp-3">
          "Welcome everyone to today's service. Let us begin with a moment of
          prayer and reflection..."
        </div>
        <div className="text-stone-400 text-xs mt-2 flex items-center gap-1">
          <span>🎤 Preaching</span>
          <span>•</span>
          <span>94%</span>
        </div>
      </div>
    </div>
  );
};
