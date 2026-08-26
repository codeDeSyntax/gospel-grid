import React from "react";
import type { FeatureTimerProjectionTheme } from "../RightPanel/featureTimerState";

interface TimerTileCardProps {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  theme?: FeatureTimerProjectionTheme;
  isDarkMode?: boolean;
}

export const TimerTileCard: React.FC<TimerTileCardProps> = ({
  days,
  hours,
  minutes,
  seconds,
  theme = "dark",
  isDarkMode = true,
}) => {
  const isDark = theme === "dark" || isDarkMode;

  const blocks = [
    { value: days, label: "Days" },
    { value: hours, label: "Hrs" },
    { value: minutes, label: "Min" },
    { value: seconds, label: "Sec" },
  ];

  return (
    <div
      className={`absolute inset-0 z-0 flex items-center justify-center p-2 sm:p-3 overflow-hidden select-none transition-colors duration-200 ${
        isDark
          ? "bg-gradient-to-b from-[#141414] via-black to-[#0d0d0d]"
          : "bg-gradient-to-b from-stone-100 via-neutral-50 to-stone-200"
      }`}
    >
      {/* Center Flip Clock Blocks */}
      <div className="relative z-10 w-full flex items-center justify-center my-auto">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full max-w-[260px] place-items-center">
          {blocks.map((block, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5 min-w-0 w-full">
              <div
                className={`relative overflow-hidden border rounded-lg w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 flex items-center justify-center shadow-md ${
                  isDark
                    ? "border-theme-primary-200/25 bg-gradient-to-b from-theme-primary-700/80 via-theme-primary-800/90 to-theme-primary-950 text-white"
                    : "border-theme-primary-300/70 bg-gradient-to-b from-theme-primary-50 via-theme-primary-100 to-theme-primary-200 text-neutral-900"
                }`}
              >
                {/* Center Seam */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
                <div className="absolute inset-x-0 top-[calc(50%-1px)] h-px bg-white/20" />

                <span className="font-[impact] text-sm sm:text-base font-bold leading-none select-none">
                  {block.value}
                </span>
              </div>

              <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-wide truncate ${isDark ? "text-white/60" : "text-neutral-600"}`}>
                {block.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
