import React from "react";
import { Mic } from "lucide-react";

interface CaptionsStageProjectionProps {
  text: string;
  layoutMode?: "single" | "dual" | "triple" | "quad" | "empty";
}

const STAGE_WAVEFORM_HEIGHTS = [12, 20, 28, 40, 26, 34, 46, 54, 46, 34, 26, 40, 28, 20, 12];

export const CaptionsStageProjection: React.FC<CaptionsStageProjectionProps> = ({
  text,
  layoutMode = "single",
}) => {
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];

  const isSingle = layoutMode === "single";
  const isDual = layoutMode === "dual";
  const isTriple = layoutMode === "triple";

  const renderStyledSpeech = () => {
    if (words.length === 0) {
      const micSize = isSingle ? 38 : isDual || isTriple ? 32 : 24;
      const emptyTextSize = isSingle
        ? "text-3xl sm:text-4xl md:text-5xl gap-4"
        : isDual || isTriple
          ? "text-2xl sm:text-3xl md:text-4xl gap-3.5"
          : "text-lg sm:text-xl md:text-2xl gap-2";

      return (
        <span
          className={`italic font-normal flex items-center justify-center ${emptyTextSize} text-white/40`}
        >
          <Mic size={micSize} className="animate-pulse text-primary-400 shrink-0" />
          <span>Listening for speech...</span>
        </span>
      );
    }

    const cursorClasses = isSingle
      ? "w-3 h-10 ml-3"
      : isDual || isTriple
        ? "w-2.5 h-8 ml-2.5"
        : "w-2 h-6 ml-2";

    if (words.length <= 3) {
      return (
        <span className="text-white font-normal">
          {words.join(" ")}
          <span className={`inline-block ${cursorClasses} bg-primary-400 rounded-sm animate-pulse align-middle`} />
        </span>
      );
    }

    // Partition words into the multi-tier gradient & opacity styles
    const seg1End = Math.max(1, Math.floor(words.length * 0.35));
    const seg2End = Math.max(seg1End + 1, Math.floor(words.length * 0.65));
    const seg3End = Math.max(seg2End + 1, Math.floor(words.length * 0.85));

    const seg1 = words.slice(0, seg1End).join(" ");
    const seg2 = words.slice(seg1End, seg2End).join(" ");
    const seg3 = words.slice(seg2End, seg3End).join(" ");
    const seg4 = words.slice(seg3End).join(" ");

    return (
      <span className="leading-snug md:leading-relaxed tracking-tight break-words">
        {/* Tier 1: Bold, crisp primary text */}
        <span className="text-white font-normal">
          {seg1}{" "}
        </span>

        {/* Tier 2: App green theme highlight gradient */}
        {seg2 && (
          <span className="bg-gradient-to-r from-primary-300 via-primary-400 to-primary-200 bg-clip-text text-transparent font-normal">
            {seg2}{" "}
          </span>
        )}

        {/* Tier 3: Medium contrast phrase */}
        {seg3 && (
          <span className="text-white/80 font-normal">
            {seg3}{" "}
          </span>
        )}

        {/* Tier 4: Soft trailing realtime words */}
        {seg4 && (
          <span className="text-white/45 font-normal">
            {seg4}
          </span>
        )}

        {/* Real-time speech blinking cursor */}
        <span className={`inline-block ${cursorClasses} bg-primary-400 rounded-sm animate-pulse align-middle`} />
      </span>
    );
  };

  const textContainerClasses = (() => {
    if (isSingle) {
      return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-relaxed max-w-6xl line-clamp-4";
    }
    if (isDual || isTriple) {
      return "text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal leading-snug max-w-5xl line-clamp-3";
    }
    return "text-xl sm:text-2xl md:text-3xl font-normal leading-snug max-w-3xl line-clamp-2";
  })();

  const waveformScale = isSingle ? 1.0 : isDual || isTriple ? 0.75 : 0.55;
  const waveformBarWidth = isSingle ? 4.5 : isDual || isTriple ? 3.6 : 2.6;

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-black flex flex-col justify-between items-center text-center select-none p-3 sm:p-5 md:p-6">
      {/* Background Radial Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />

      {/* Top buffer space */}
      <div className="shrink-0 h-1.5 sm:h-3 w-full pointer-events-none" />

      {/* Center Speech Transcription Area */}
      <div className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-4 overflow-hidden">
        <div className={`w-full mx-auto transition-all ${textContainerClasses}`}>
          {renderStyledSpeech()}
        </div>
      </div>

      {/* Bottom Symmetrical Audio Waveform Visualizer */}
      <div className="relative z-10 shrink-0 flex items-center justify-center select-none pointer-events-none pt-2 pb-1 gap-1.5">
        {STAGE_WAVEFORM_HEIGHTS.map((height, idx) => {
          const scaledHeight = Math.round(height * waveformScale);
          const animDelay = (idx % 5) * 0.12;

          return (
            <span
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                words.length > 0 ? "bg-primary-400/85" : "bg-white/40"
              }`}
              style={{
                width: waveformBarWidth,
                height: scaledHeight,
                animation:
                  words.length > 0
                    ? `pulse 0.85s ease-in-out infinite alternate ${animDelay}s`
                    : undefined,
                opacity: 0.85,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};
