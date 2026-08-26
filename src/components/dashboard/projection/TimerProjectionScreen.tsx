import React from "react";
import type { FeatureTimerProjectionTheme } from "../RightPanel/featureTimerState";

export type TimerSizeVariant = "hero" | "large" | "medium" | "compact";

interface TimerProjectionScreenProps {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  theme: FeatureTimerProjectionTheme;
  compact?: boolean;
  layoutMode?: "single" | "dual" | "triple" | "quad" | "empty";
  sizeVariant?: TimerSizeVariant;
}

interface TimerBlockProps {
  value: string;
  label: string;
  theme: FeatureTimerProjectionTheme;
  sizeVariant: TimerSizeVariant;
}

const TimerBlock: React.FC<TimerBlockProps> = ({
  value,
  label,
  theme,
  sizeVariant,
}) => {
  const isDark = theme === "dark";

  const blockClasses = (() => {
    switch (sizeVariant) {
      case "hero":
        return "rounded-2xl w-[clamp(120px,16vw,250px)] h-[clamp(120px,16vw,250px)] shadow-[0_16px_38px_rgba(0,0,0,0.45)]";
      case "large":
        return "rounded-xl w-[clamp(76px,10.5vw,150px)] h-[clamp(76px,10.5vw,150px)] shadow-[0_10px_25px_rgba(0,0,0,0.35)]";
      case "medium":
        return "rounded-lg w-[clamp(44px,6vw,80px)] h-[clamp(44px,6vw,80px)] shadow-md";
      case "compact":
      default:
        return "rounded-md w-[clamp(22px,2.8vw,36px)] h-[clamp(22px,2.8vw,36px)] shadow-sm";
    }
  })();

  const textClasses = (() => {
    switch (sizeVariant) {
      case "hero":
        return "text-[clamp(56px,8.8vw,150px)] tracking-[0.08em]";
      case "large":
        return "text-[clamp(34px,5.2vw,86px)] tracking-[0.06em] font-bold";
      case "medium":
        return "text-[clamp(20px,2.8vw,42px)] tracking-normal font-bold";
      case "compact":
      default:
        return "text-[clamp(10px,1.3vw,16px)] tracking-normal font-bold";
    }
  })();

  const labelClasses = (() => {
    switch (sizeVariant) {
      case "hero":
        return "text-[clamp(13px,1.5vw,24px)] tracking-[0.12em] font-bold";
      case "large":
        return "text-[clamp(10px,1.1vw,16px)] tracking-wider font-semibold";
      case "medium":
        return "text-[clamp(7.5px,0.8vw,11px)] tracking-wide font-semibold";
      case "compact":
      default:
        return "text-[clamp(6px,0.6vw,8px)] tracking-tight font-semibold leading-none";
    }
  })();

  const gapClasses = sizeVariant === "hero" ? "gap-2 sm:gap-3" : sizeVariant === "large" ? "gap-1.5" : "gap-0.5";

  return (
    <div className={`flex flex-col items-center min-w-0 ${gapClasses}`}>
      <div
        className={`relative overflow-hidden border ${blockClasses} ${
          isDark
            ? "border-theme-primary-200/25 bg-gradient-to-b from-theme-primary-700/70 via-theme-primary-800/85 to-theme-primary-900"
            : "border-theme-primary-300/60 bg-gradient-to-b from-theme-primary-50 via-theme-primary-100 to-theme-primary-200"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/18 to-transparent pointer-events-none" />
        <div
          className={`absolute inset-x-0 top-1/2 ${sizeVariant === "hero" ? "h-[2px]" : "h-px"} ${
            isDark ? "bg-black/65" : "bg-theme-primary-500/45"
          }`}
        />
        <div
          className={`absolute inset-x-0 ${sizeVariant === "hero" ? "top-[calc(50%-2px)] h-[3px]" : "top-[calc(50%-1px)] h-px"} ${
            isDark ? "bg-white/15" : "bg-white/35"
          }`}
        />

        <div
          className={`absolute inset-0 flex items-center justify-center font-[impact] leading-none ${textClasses} ${
            isDark ? "theme-text-on-overlay" : "theme-text-main"
          }`}
          style={{ opacity: 0.95 }}
        >
          {value}
        </div>
      </div>

      <p
        className={`${labelClasses} uppercase truncate ${
          isDark ? "theme-text-soft" : "theme-text-muted"
        }`}
      >
        {label}
      </p>
    </div>
  );
};

export const TimerProjectionScreen: React.FC<TimerProjectionScreenProps> = ({
  days,
  hours,
  minutes,
  seconds,
  theme,
  compact = false,
  layoutMode = "single",
  sizeVariant: explicitSizeVariant,
}) => {
  const isDark = theme === "dark";

  // Derive sizeVariant smartly if not explicitly supplied
  const effectiveSizeVariant: TimerSizeVariant = (() => {
    if (explicitSizeVariant) return explicitSizeVariant;
    if (compact) return "compact";
    if (layoutMode === "single") return "hero";
    if (layoutMode === "dual") return "large";
    return "medium";
  })();

  const outerPadding = (() => {
    switch (effectiveSizeVariant) {
      case "hero":
        return "p-[clamp(16px,3vw,56px)]";
      case "large":
        return "p-[clamp(10px,1.8vw,28px)]";
      case "medium":
        return "p-[clamp(6px,1vw,14px)]";
      case "compact":
      default:
        return "p-[clamp(3px,0.5vw,7px)]";
    }
  })();

  const innerCardClasses = (() => {
    switch (effectiveSizeVariant) {
      case "hero":
        return "rounded-[28px] p-[clamp(16px,2.5vw,48px)]";
      case "large":
        return "rounded-[20px] p-[clamp(10px,1.5vw,26px)]";
      case "medium":
        return "rounded-[14px] p-[clamp(6px,0.8vw,14px)]";
      case "compact":
      default:
        return "rounded-[8px] p-[clamp(3px,0.4vw,6px)]";
    }
  })();

  const gridCols = (() => {
    if (effectiveSizeVariant === "compact" || effectiveSizeVariant === "medium") return "grid-cols-4";
    if (layoutMode === "dual") return "grid-cols-2";
    return "grid-cols-4";
  })();

  const gridGap = (() => {
    switch (effectiveSizeVariant) {
      case "hero":
        return "gap-[clamp(12px,2vw,36px)]";
      case "large":
        return "gap-[clamp(8px,1.4vw,22px)]";
      case "medium":
        return "gap-[clamp(4px,0.8vw,12px)]";
      case "compact":
      default:
        return "gap-[clamp(2px,0.4vw,6px)]";
    }
  })();

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${
        isDark
          ? "bg-[linear-gradient(90deg,rgba(var(--theme-primary-950),1)_0%,rgba(var(--theme-primary-900),1)_16%,rgba(var(--theme-primary-900),1)_84%,rgba(var(--theme-primary-950),1)_100%)]"
          : "bg-[linear-gradient(90deg,rgba(var(--theme-primary-50),1)_0%,rgba(var(--theme-primary-100),1)_16%,rgba(var(--theme-primary-100),1)_84%,rgba(var(--theme-primary-50),1)_100%)]"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-primary-100),0.16),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.14))]"
            : "bg-[radial-gradient(ellipse_at_center,rgba(var(--theme-primary-900),0.1),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.5),rgba(var(--theme-primary-900),0.04))]"
        }`}
      />

      <div className="absolute left-[2.5%] right-[2.5%] top-[3%] h-px bg-gradient-to-r from-transparent via-theme-primary-200/25 to-transparent" />
      <div
        className={`absolute left-[2.5%] right-[2.5%] bottom-[3%] h-px bg-gradient-to-r from-transparent ${
          isDark ? "via-theme-primary-200/20" : "via-theme-primary-700/20"
        } to-transparent`}
      />

      <div className={`absolute inset-0 flex items-center justify-center ${outerPadding}`}>
        <div
          className={`relative w-full h-full border flex flex-col items-center justify-center ${innerCardClasses} ${
            isDark
              ? "border-theme-primary-300/20 bg-[linear-gradient(180deg,rgba(var(--theme-primary-100),0.05),rgba(0,0,0,0.22))]"
              : "border-theme-primary-300/55 bg-[linear-gradient(180deg,rgba(var(--theme-primary-50),0.82),rgba(var(--theme-primary-100),0.56))]"
          }`}
        >
          <div className={`grid ${gridCols} w-full max-w-full place-items-center ${gridGap}`}>
            <TimerBlock
              value={days}
              label={effectiveSizeVariant === "compact" ? "Days" : "Days"}
              theme={theme}
              sizeVariant={effectiveSizeVariant}
            />
            <TimerBlock
              value={hours}
              label={effectiveSizeVariant === "compact" ? "Hrs" : "Hours"}
              theme={theme}
              sizeVariant={effectiveSizeVariant}
            />
            <TimerBlock
              value={minutes}
              label={effectiveSizeVariant === "compact" ? "Min" : "Minutes"}
              theme={theme}
              sizeVariant={effectiveSizeVariant}
            />
            <TimerBlock
              value={seconds}
              label={effectiveSizeVariant === "compact" ? "Sec" : "Seconds"}
              theme={theme}
              sizeVariant={effectiveSizeVariant}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
