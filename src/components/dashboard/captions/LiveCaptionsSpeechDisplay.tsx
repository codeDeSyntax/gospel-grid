import React from "react";
import { Mic } from "lucide-react";

interface LiveCaptionsSpeechDisplayProps {
  text: string;
  isDarkMode: boolean;
  compact?: boolean;
}

// Symmetrical waveform heights matching the reference image
const WAVEFORM_HEIGHTS = [8, 14, 20, 28, 18, 24, 32, 38, 32, 24, 18, 28, 20, 14, 8];

export const LiveCaptionsSpeechDisplay: React.FC<LiveCaptionsSpeechDisplayProps> = ({
  text,
  isDarkMode,
  compact = false,
}) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];

  // Partition words into the multi-tier gradient & opacity styles matching the image:
  // 1. Primary committed text (High contrast bold)
  // 2. Highlighted keywords (Vivid Theme Gradient)
  // 3. Trailing active phrase (Medium opacity)
  // 4. Newest trailing words (Soft fading opacity)
  const renderStyledSpeech = () => {
    if (words.length === 0) {
      return (
        <span
          className={`italic font-thin flex items-center justify-center gap-2.5 ${
            compact ? "text-sm sm:text-base" : "text-lg sm:text-xl md:text-2xl"
          } ${isDarkMode ? "text-white/40" : "text-neutral-400"}`}
        >
          <Mic size={compact ? 16 : 22} className="animate-pulse text-primary-400 shrink-0" />
          <span>Listening for speech...</span>
        </span>
      );
    }

    if (words.length <= 3) {
      return (
        <span className={isDarkMode ? "text-white font-thin" : "text-[#111827] font-thin"}>
          {words.join(" ")}
          <span className="inline-block w-1.5 h-5 ml-1.5 bg-primary-400 rounded-sm animate-pulse align-middle" />
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
      <span className="leading-snug sm:leading-relaxed tracking-tight break-words">
        {/* Tier 1: Bold, crisp primary text (Matching 'Wow! what an amazing journey') */}
        <span className={isDarkMode ? "text-white font-thin" : "text-[#111827] font-thin"}>
          {seg1}{" "}
        </span>

        {/* Tier 2: App green theme highlight gradient (Matching 'ExploreEase' with project lime-green theme) */}
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

        {/* Tier 3: Medium contrast phrase (Matching 'Their super friendly team handled every detail') */}
        {seg3 && (
          <span className={isDarkMode ? "text-white/80 font-thin" : "text-[#475569] font-thin"}>
            {seg3}{" "}
          </span>
        )}

        {/* Tier 4: Soft trailing realtime words (Matching 'so all I had to do was relax and explore.') */}
        {seg4 && (
          <span className={isDarkMode ? "text-white/35 font-thin" : "text-[#94a3b8]/80 font-thin"}>
            {seg4}
          </span>
        )}

        {/* Real-time speech blinking cursor */}
        <span className="inline-block w-1.5 h-5 ml-1.5 bg-primary-400 rounded-sm animate-pulse align-middle" />
      </span>
    );
  };

  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-4 sm:gap-6 my-auto px-2 sm:px-6">
      {/* Speech Text Content - Big, bold and fully responsive */}
      <div
        className={`w-full max-w-4xl mx-auto transition-all ${
          compact
            ? "text-base sm:text-lg md:text-xl font-thin line-clamp-4 leading-snug"
            : "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-thin leading-relaxed"
        }`}
      >
        {renderStyledSpeech()}
      </div>

      {/* Symmetrical Audio Waveform Visualizer */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-2 select-none pointer-events-none">
        {WAVEFORM_HEIGHTS.map((height, idx) => {
          const scaledHeight = compact ? Math.max(4, Math.round(height * 0.65)) : height;
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
                width: compact ? 2.5 : 3.5,
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
