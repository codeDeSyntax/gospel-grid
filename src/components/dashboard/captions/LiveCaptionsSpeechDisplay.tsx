import React from "react";
import { Mic } from "lucide-react";

export type CaptionsSizeVariant = "hero" | "large" | "medium" | "compact";

interface LiveCaptionsSpeechDisplayProps {
  text: string;
  isDarkMode: boolean;
  compact?: boolean;
  sizeVariant?: CaptionsSizeVariant;
}

// Symmetrical waveform heights matching the reference image
const WAVEFORM_HEIGHTS = [8, 14, 20, 28, 18, 24, 32, 38, 32, 24, 18, 28, 20, 14, 8];

export const LiveCaptionsSpeechDisplay: React.FC<LiveCaptionsSpeechDisplayProps> = ({
  text,
  isDarkMode,
  compact = false,
  sizeVariant: explicitSizeVariant,
}) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];

  const effectiveSizeVariant: CaptionsSizeVariant = (() => {
    if (explicitSizeVariant) return explicitSizeVariant;
    if (compact) return "compact";
    return "large";
  })();

  const renderStyledSpeech = () => {
    if (words.length === 0) {
      const micSize = (() => {
        switch (effectiveSizeVariant) {
          case "hero": return 32;
          case "large": return 24;
          case "medium": return 16;
          case "compact": default: return 12;
        }
      })();

      const emptyTextClasses = (() => {
        switch (effectiveSizeVariant) {
          case "hero": return "text-2xl sm:text-3xl md:text-4xl gap-4";
          case "large": return "text-xl sm:text-2xl md:text-3xl gap-2.5";
          case "medium": return "text-sm sm:text-base gap-2";
          case "compact": default: return "text-[10px] sm:text-xs gap-1";
        }
      })();

      return (
        <span
          className={`italic font-thin flex items-center justify-center ${emptyTextClasses} ${
            isDarkMode ? "text-white/40" : "text-neutral-400"
          }`}
        >
          <Mic size={micSize} className="animate-pulse text-primary-400 shrink-0" />
          <span className="truncate">Listening for speech...</span>
        </span>
      );
    }

    const cursorClasses = (() => {
      switch (effectiveSizeVariant) {
        case "hero": return "w-2.5 h-8 ml-2.5";
        case "large": return "w-2 h-6 ml-2";
        case "medium": return "w-1.5 h-4 ml-1";
        case "compact": default: return "w-1 h-3 ml-1";
      }
    })();

    if (words.length <= 3) {
      return (
        <span className={isDarkMode ? "text-white font-thin" : "text-[#111827] font-thin"}>
          {words.join(" ")}
          <span className={`inline-block ${cursorClasses} bg-primary-400 rounded-sm animate-pulse align-middle`} />
        </span>
      );
    }

    // Dynamic thresholds based on word count
    const seg1End = Math.max(1, Math.floor(words.length * 0.35));
    const seg2End = Math.max(seg1End + 1, Math.floor(words.length * 0.65));
    const seg3End = Math.max(seg2End + 1, Math.floor(words.length * 0.85));

    const seg1 = words.slice(0, seg1End).join(" ");
    const seg2 = words.slice(seg1End, seg2End).join(" ");
    const seg3 = words.slice(seg2End, seg3End).join(" ");
    const seg4 = words.slice(seg3End).join(" ");

    return (
      <span className="leading-snug tracking-tight break-words">
        {/* Tier 1: Bold, crisp primary text */}
        <span className={isDarkMode ? "text-white font-thin" : "text-[#111827] font-thin"}>
          {seg1}{" "}
        </span>

        {/* Tier 2: App green theme highlight gradient */}
        {seg2 && (
          <span
            className={
              isDarkMode
                ? "bg-gradient-to-r from-primary-300 via-primary-400 to-primary-200 bg-clip-text text-transparent font-thin"
                : "bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 bg-clip-text text-transparent font-thin"
            }
          >
            {seg2}{" "}
          </span>
        )}

        {/* Tier 3: Medium contrast phrase */}
        {seg3 && (
          <span className={isDarkMode ? "text-white/80 font-thin" : "text-[#475569] font-thin"}>
            {seg3}{" "}
          </span>
        )}

        {/* Tier 4: Soft trailing realtime words */}
        {seg4 && (
          <span className={isDarkMode ? "text-white/35 font-thin" : "text-[#94a3b8]/80 font-thin"}>
            {seg4}
          </span>
        )}

        {/* Real-time speech blinking cursor */}
        <span className={`inline-block ${cursorClasses} bg-primary-400 rounded-sm animate-pulse align-middle`} />
      </span>
    );
  };

  const containerPadding = (() => {
    switch (effectiveSizeVariant) {
      case "hero": return "gap-8 md:gap-12 px-6 sm:px-12";
      case "large": return "gap-4 sm:gap-6 px-4 sm:px-8";
      case "medium": return "gap-2 px-3";
      case "compact": default: return "gap-1 px-1 overflow-hidden";
    }
  })();

  const speechTextClasses = (() => {
    switch (effectiveSizeVariant) {
      case "hero":
        return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-thin leading-relaxed line-clamp-4 max-w-6xl";
      case "large":
        return "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-thin leading-snug line-clamp-3 max-w-4xl";
      case "medium":
        return "text-sm sm:text-base md:text-lg font-normal leading-snug line-clamp-2 max-w-2xl";
      case "compact":
      default:
        return "text-[10px] sm:text-[11px] md:text-xs font-normal line-clamp-2 leading-tight max-w-lg";
    }
  })();

  const waveformConfig = (() => {
    switch (effectiveSizeVariant) {
      case "hero":
        return {
          heightFactor: 1.25,
          minHeight: 8,
          barWidth: 4.5,
          bars: WAVEFORM_HEIGHTS,
          gap: "gap-1.5 sm:gap-2 pt-4",
        };
      case "large":
        return {
          heightFactor: 0.8,
          minHeight: 5,
          barWidth: 3.5,
          bars: WAVEFORM_HEIGHTS,
          gap: "gap-1 pt-2",
        };
      case "medium":
        return {
          heightFactor: 0.45,
          minHeight: 3,
          barWidth: 2.4,
          bars: WAVEFORM_HEIGHTS.slice(2, 13),
          gap: "gap-0.5 pt-1",
        };
      case "compact":
      default:
        return {
          heightFactor: 0.25,
          minHeight: 3,
          barWidth: 1.8,
          bars: WAVEFORM_HEIGHTS.slice(3, 12),
          gap: "gap-0.5 pt-0.5",
        };
    }
  })();

  return (
    <div className={`w-full flex flex-col items-center justify-center text-center my-auto ${containerPadding}`}>
      {/* Speech Text Content */}
      <div className={`w-full mx-auto transition-all ${speechTextClasses}`}>
        {renderStyledSpeech()}
      </div>

      {/* Symmetrical Audio Waveform Visualizer */}
      <div className={`flex items-center justify-center select-none pointer-events-none ${waveformConfig.gap}`}>
        {waveformConfig.bars.map((height, idx) => {
          const scaledHeight = Math.max(waveformConfig.minHeight, Math.round(height * waveformConfig.heightFactor));
          const animDelay = (idx % 5) * 0.12;

          return (
            <span
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                isDarkMode
                  ? words.length > 0
                    ? "bg-primary-400/80"
                    : "bg-white/40"
                  : words.length > 0
                    ? "bg-primary-600/80"
                    : "bg-neutral-400"
              }`}
              style={{
                width: waveformConfig.barWidth,
                height: scaledHeight,
                animation:
                  words.length > 0
                    ? `pulse 0.85s ease-in-out infinite alternate ${animDelay}s`
                    : undefined,
                opacity: isDarkMode ? 0.75 : 0.85,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
