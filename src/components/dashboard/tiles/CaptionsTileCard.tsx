import React from "react";
import { Mic } from "lucide-react";

interface CaptionsTileCardProps {
  text: string;
  isDarkMode?: boolean;
  totalTiles?: number;
}

export const CaptionsTileCard: React.FC<CaptionsTileCardProps> = ({
  text,
  isDarkMode = true,
  totalTiles = 1,
}) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];

  const isSingle = totalTiles <= 1;
  const isDual = totalTiles === 2;

  // Responsive font scaling based on screen tile density
  const textClasses = (() => {
    if (isSingle) {
      return "text-base sm:text-lg md:text-xl lg:text-2xl font-thin leading-relaxed max-w-2xl line-clamp-4";
    }
    if (isDual) {
      return "text-xs sm:text-sm md:text-base font-thin leading-snug max-w-xl line-clamp-3";
    }
    return "text-[10px] sm:text-[11px] font-thin leading-snug max-w-md line-clamp-2";
  })();

  const emptyTextClasses = (() => {
    if (isSingle) {
      return "text-sm sm:text-base md:text-lg gap-2.5";
    }
    if (isDual) {
      return "text-xs sm:text-sm gap-2";
    }
    return "text-[10px] sm:text-[11px] gap-1.5";
  })();

  const micSize = isSingle ? 24 : isDual ? 18 : 13;
  const cursorHeight = isSingle ? "w-1.5 h-6 ml-2" : isDual ? "w-1 h-4 ml-1.5" : "w-1 h-3 ml-1";
  const headerPillClasses = isSingle
    ? "px-2.5 py-1 text-[11px]"
    : isDual
      ? "px-2 py-0.5 text-[9px]"
      : "px-1.5 py-0.5 text-[7.5px]";

  const paddingClasses = isSingle ? "p-3.5 sm:p-5" : isDual ? "p-2.5 sm:p-3.5" : "p-2 sm:p-2.5";

  return (
    <div
      className={`absolute inset-0 z-0 flex flex-col justify-between ${paddingClasses} overflow-hidden select-none transition-colors duration-200 ${
        isDarkMode
          ? "bg-gradient-to-b from-[#141414] via-black to-[#0d0d0d]"
          : "bg-gradient-to-b from-stone-100 via-neutral-50 to-stone-200"
      }`}
    >
      {/* Top Header Live Pill & Waveform */}
      <div className="relative z-10 w-full flex items-center justify-between shrink-0">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full border shadow-sm ${headerPillClasses} ${
            isDarkMode
              ? "border-primary-500/30 bg-primary-500/15 text-white"
              : "border-primary-500/40 bg-primary-100/90 text-primary-900 font-bold"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full animate-pulse shrink-0 ${
              isDarkMode ? "bg-primary-400" : "bg-primary-600"
            }`}
          />
          <span className="font-thin tracking-wider uppercase leading-none truncate">
            Live AI Captions
          </span>
        </div>

        {/* Audio Equalizer Bars */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[2, 3.5, 2.5, 4, 2].map((h, i) => (
            <span
              key={i}
              style={{ height: `${h * (isSingle ? 4 : isDual ? 3 : 2.2)}px` }}
              className={`w-0.5 sm:w-1 rounded-full animate-pulse ${
                isDarkMode ? "bg-primary-400/80" : "bg-primary-600/80"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Transcription Preview Text */}
      <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center text-center px-2 py-2 my-auto">
        {words.length === 0 ? (
          <div
            className={`italic font-thin flex items-center justify-center ${emptyTextClasses} ${
              isDarkMode ? "text-white/40" : "text-neutral-400"
            }`}
          >
            <Mic size={micSize} className="animate-pulse text-primary-400 shrink-0" />
            <span className="truncate">Listening for speech...</span>
          </div>
        ) : (
          <p
            className={`${textClasses} break-words ${
              isDarkMode ? "text-white/95" : "text-neutral-900"
            }`}
          >
            {trimmed}
            <span
              className={`inline-block ${cursorHeight} bg-primary-400 rounded-sm animate-pulse align-middle`}
            />
          </p>
        )}
      </div>
    </div>
  );
};
