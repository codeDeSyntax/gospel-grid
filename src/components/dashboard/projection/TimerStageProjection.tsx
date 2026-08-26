import React from "react";
import type { FeatureTimerProjectionTheme } from "../RightPanel/featureTimerState";

interface TimerStageProjectionProps {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  theme: FeatureTimerProjectionTheme;
  layoutMode?: "single" | "dual" | "triple" | "quad" | "empty";
}

interface StageBlockProps {
  value: string;
  label: string;
  isDark: boolean;
  layoutMode: "single" | "dual" | "triple" | "quad" | "empty";
}

const StageBlock: React.FC<StageBlockProps> = ({
  value,
  label,
  isDark,
  layoutMode,
}) => {
  const isSingle = layoutMode === "single";
  const isDual = layoutMode === "dual";
  const isTriple = layoutMode === "triple";

  const blockDimensions = (() => {
    if (isSingle) {
      return "w-[clamp(140px,18vw,280px)] h-[clamp(140px,18vw,280px)] rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.55)]";
    }
    if (isDual) {
      return "w-[clamp(110px,14vw,220px)] h-[clamp(110px,14vw,220px)] rounded-[22px] shadow-[0_14px_36px_rgba(0,0,0,0.45)]";
    }
    if (isTriple) {
      return "w-[clamp(90px,11vw,180px)] h-[clamp(90px,11vw,180px)] rounded-[20px] shadow-[0_12px_30px_rgba(0,0,0,0.4)]";
    }
    return "w-[clamp(70px,9vw,140px)] h-[clamp(70px,9vw,140px)] rounded-[16px] shadow-[0_8px_24px_rgba(0,0,0,0.35)]";
  })();

  const textFontSize = (() => {
    if (isSingle) return "text-[clamp(68px,11vw,175px)] tracking-[0.08em]";
    if (isDual) return "text-[clamp(52px,8vw,135px)] tracking-[0.06em]";
    if (isTriple) return "text-[clamp(44px,6.8vw,110px)] tracking-[0.05em]";
    return "text-[clamp(32px,5vw,80px)] tracking-normal";
  })();

  const labelFontSize = (() => {
    if (isSingle) return "text-[clamp(14px,1.8vw,30px)] tracking-[0.14em]";
    if (isDual) return "text-[clamp(12px,1.4vw,22px)] tracking-[0.12em]";
    if (isTriple) return "text-[clamp(11px,1.2vw,18px)] tracking-[0.1em]";
    return "text-[clamp(9px,1vw,15px)] tracking-wider";
  })();

  const splitLine = isSingle || isDual || isTriple ? "h-[3px]" : "h-[2px]";
  const gap = isSingle ? "gap-3 sm:gap-4" : isDual || isTriple ? "gap-2 sm:gap-3" : "gap-1.5";

  return (
    <div className={`flex flex-col items-center justify-center ${gap}`}>
      <div
        className={`relative overflow-hidden border ${blockDimensions} ${
          isDark
            ? "border-theme-primary-200/30 bg-gradient-to-b from-theme-primary-700/80 via-theme-primary-800/90 to-theme-primary-950"
            : "border-theme-primary-300/70 bg-gradient-to-b from-theme-primary-50 via-theme-primary-100 to-theme-primary-200"
        }`}
      >
        {/* Subtle top reflection */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
        
        {/* Flip-clock center seam */}
        <div
          className={`absolute inset-x-0 top-1/2 ${splitLine} ${
            isDark ? "bg-black/75" : "bg-theme-primary-500/50"
          }`}
        />
        <div
          className={`absolute inset-x-0 ${isSingle || isDual || isTriple ? "top-[calc(50%-2px)] h-[3px]" : "top-[calc(50%-1px)] h-px"} ${
            isDark ? "bg-white/20" : "bg-white/40"
          }`}
        />

        {/* Digit Value */}
        <div
          className={`absolute inset-0 flex items-center justify-center font-[impact] leading-none select-none ${textFontSize} ${
            isDark ? "theme-text-on-overlay" : "theme-text-main"
          }`}
          style={{ opacity: 0.98 }}
        >
          {value}
        </div>
      </div>

      {/* Label */}
      <p
        className={`${labelFontSize} uppercase font-bold select-none ${
          isDark ? "theme-text-soft" : "theme-text-muted"
        }`}
      >
        {label}
      </p>
    </div>
  );
};

export const TimerStageProjection: React.FC<TimerStageProjectionProps> = ({
  days,
  hours,
  minutes,
  seconds,
  theme,
  layoutMode = "single",
}) => {
  const isDark = theme === "dark";
  const isSingle = layoutMode === "single";
  const isDual = layoutMode === "dual";
  const isTriple = layoutMode === "triple";

  // When projected as dual (50% split screen with portrait ~9:10 ratio), use a 2x2 grid
  // When projected single, triple, or quad, use 4 columns across the 16:9 box
  const gridCols = isDual ? "grid-cols-2" : "grid-cols-4";
  const gridGap = isSingle
    ? "gap-[clamp(16px,2.5vw,48px)]"
    : isDual
      ? "gap-[clamp(14px,2.2vw,36px)]"
      : isTriple
        ? "gap-[clamp(12px,1.8vw,30px)]"
        : "gap-[clamp(10px,1.5vw,24px)]";

  const cardPadding = isSingle
    ? "p-[clamp(24px,3.5vw,64px)]"
    : isDual
      ? "p-[clamp(16px,2.5vw,40px)]"
      : isTriple
        ? "p-[clamp(14px,2vw,32px)]"
        : "p-[clamp(12px,1.8vw,28px)]";

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none ${
        isDark
          ? "bg-[linear-gradient(90deg,rgba(var(--theme-primary-950),1)_0%,rgba(var(--theme-primary-900),1)_16%,rgba(var(--theme-primary-900),1)_84%,rgba(var(--theme-primary-950),1)_100%)]"
          : "bg-[linear-gradient(90deg,rgba(var(--theme-primary-50),1)_0%,rgba(var(--theme-primary-100),1)_16%,rgba(var(--theme-primary-100),1)_84%,rgba(var(--theme-primary-50),1)_100%)]"
      }`}
    >
      {/* Background Radial Glow */}
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-primary-100),0.18),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.2))]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-primary-900),0.12),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.6),rgba(var(--theme-primary-900),0.05))]"
        }`}
      />

      {/* Aesthetic Border Glow Lines */}
      <div className="absolute left-[2%] right-[2%] top-[2%] h-px bg-gradient-to-r from-transparent via-theme-primary-200/30 to-transparent pointer-events-none" />
      <div
        className={`absolute left-[2%] right-[2%] bottom-[2%] h-px bg-gradient-to-r from-transparent ${
          isDark ? "via-theme-primary-200/25" : "via-theme-primary-700/25"
        } to-transparent pointer-events-none`}
      />

      <div className={`relative z-10 w-full h-full flex items-center justify-center ${cardPadding}`}>
        <div
          className={`relative w-full h-full border flex flex-col items-center justify-center rounded-[32px] ${cardPadding} ${
            isDark
              ? "border-theme-primary-300/25 bg-[linear-gradient(180deg,rgba(var(--theme-primary-100),0.06),rgba(0,0,0,0.28))]"
              : "border-theme-primary-300/60 bg-[linear-gradient(180deg,rgba(var(--theme-primary-50),0.85),rgba(var(--theme-primary-100),0.6))]"
          }`}
        >
          <div className={`grid ${gridCols} w-full max-w-full place-items-center ${gridGap}`}>
            <StageBlock
              value={days}
              label="DAYS"
              isDark={isDark}
              layoutMode={layoutMode}
            />
            <StageBlock
              value={hours}
              label="HOURS"
              isDark={isDark}
              layoutMode={layoutMode}
            />
            <StageBlock
              value={minutes}
              label="MINUTES"
              isDark={isDark}
              layoutMode={layoutMode}
            />
            <StageBlock
              value={seconds}
              label="SECONDS"
              isDark={isDark}
              layoutMode={layoutMode}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
