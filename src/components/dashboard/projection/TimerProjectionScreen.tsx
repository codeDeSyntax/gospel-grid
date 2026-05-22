import React from "react";
import type { FeatureTimerProjectionTheme } from "../RightPanel/featureTimerState";

interface TimerProjectionScreenProps {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  theme: FeatureTimerProjectionTheme;
  compact?: boolean;
  layoutMode?: "single" | "dual" | "triple" | "quad" | "empty";
}

interface TimerBlockProps {
  value: string;
  label: string;
  theme: FeatureTimerProjectionTheme;
  compact?: boolean;
}

const TimerBlock: React.FC<TimerBlockProps> = ({
  value,
  label,
  theme,
  compact = false,
}) => {
  const isDark = theme === "dark";

  return (
    <div
      className={`flex flex-col items-center ${compact ? "gap-0.5" : "gap-2"}`}
    >
      <div
        className={`relative overflow-hidden border shadow-[0_16px_38px_rgba(0,0,0,0.35)] ${
          compact
            ? "rounded-[8px] w-[clamp(28px,4.2vw,72px)] h-[clamp(28px,4.2vw,72px)]"
            : "rounded-[20px] w-[clamp(120px,17vw,230px)] h-[clamp(120px,17vw,230px)]"
        } ${
          isDark
            ? "border-theme-primary-200/25 bg-gradient-to-b from-theme-primary-700/70 via-theme-primary-800/85 to-theme-primary-900"
            : "border-theme-primary-300/60 bg-gradient-to-b from-theme-primary-50 via-theme-primary-100 to-theme-primary-200"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/18 to-transparent pointer-events-none" />
        <div
          className={`absolute inset-x-0 top-1/2 ${compact ? "h-px" : "h-[2px]"} ${
            isDark ? "bg-black/65" : "bg-theme-primary-500/45"
          }`}
        />
        <div
          className={`absolute inset-x-0 ${compact ? "top-[calc(50%-1px)] h-px" : "top-[calc(50%-2px)] h-[3px]"} ${
            isDark ? "bg-white/15" : "bg-white/35"
          }`}
        />

        <div
          className={`absolute inset-0 flex items-center justify-center font-[impact] leading-none tracking-[0.08em] ${
            compact
              ? "text-[clamp(18px,2.6vw,48px)]"
              : "text-[clamp(58px,8.2vw,150px)]"
          } ${isDark ? "theme-text-on-overlay" : "theme-text-main"}`}
          style={{ opacity: 0.95 }}
        >
          {value}
        </div>
      </div>

      <p
        className={`${compact ? "text-[clamp(6px,0.72vw,11px)]" : "text-[clamp(11px,1.2vw,30px)]"} tracking-[0.1em] uppercase font-semibold ${
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
}) => {
  const isDark = theme === "dark";
  const isSharedLayout = layoutMode !== "single";

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

      <div
        className={`absolute inset-0 flex items-center justify-center ${compact ? "p-[clamp(5px,0.7vw,10px)]" : isSharedLayout ? "p-[clamp(8px,1.2vw,20px)]" : "p-[clamp(18px,2.3vw,60px)]"}`}
      >
        <div
          className={`relative w-full h-full border flex flex-col items-center justify-center ${
            compact
              ? "rounded-[10px] p-[clamp(5px,0.8vw,12px)]"
              : isSharedLayout
                ? "rounded-[18px] p-[clamp(8px,1vw,22px)]"
                : "rounded-[24px] p-[clamp(14px,2vw,40px)]"
          } ${
            isDark
              ? "border-theme-primary-300/20 bg-[linear-gradient(180deg,rgba(var(--theme-primary-100),0.05),rgba(0,0,0,0.22))]"
              : "border-theme-primary-300/55 bg-[linear-gradient(180deg,rgba(var(--theme-primary-50),0.82),rgba(var(--theme-primary-100),0.56))]"
          }`}
        >
          <div
            className={`grid ${compact || isSharedLayout ? "grid-cols-2" : "grid-cols-4"} w-full place-items-center ${
              compact
                ? "gap-[clamp(4px,0.55vw,8px)]"
                : isSharedLayout
                  ? "gap-[clamp(6px,1vw,18px)]"
                  : "gap-[clamp(8px,1.5vw,28px)]"
            }`}
          >
            <TimerBlock
              value={days}
              label="Days"
              theme={theme}
              compact={compact}
            />
            <TimerBlock
              value={hours}
              label="Hours"
              theme={theme}
              compact={compact}
            />
            <TimerBlock
              value={minutes}
              label="Minutes"
              theme={theme}
              compact={compact}
            />
            <TimerBlock
              value={seconds}
              label="Seconds"
              theme={theme}
              compact={compact}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
