import React from "react";

const SKELETON_ROW_COUNT = 8;

const titleWidths = ["w-24", "w-28", "w-20", "w-32", "w-24", "w-28", "w-20", "w-32"];
const subtitleWidths = [
  "w-[72%]",
  "w-[58%]",
  "w-[80%]",
  "w-[64%]",
  "w-[70%]",
  "w-[52%]",
  "w-[76%]",
  "w-[60%]",
];

export const WindowListSkeleton: React.FC = () => (
  <div
    className="space-y-1.5 pb-2"
    role="status"
    aria-busy="true"
    aria-label="Loading available windows"
  >
    {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
      <div
        key={`window-skeleton-${index}`}
        className="shimmer-surface relative flex items-center gap-2.5 rounded-full border border-solid border-theme-primary-600 bg-theme-primary-800/90 py-1.5 pl-5 pr-8"
        style={{ ["--shimmer-delay" as string]: `${index * 0.12}s` }}
      >
        {/* Drag handle */}
        <div className="absolute left-0 top-0 flex h-full w-4 items-center justify-center rounded-l-full border-r border-solid border-theme-primary-700/60">
          <div className="flex flex-col gap-[3px] opacity-40">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex gap-[3px]">
                <div className="h-[3px] w-[3px] rounded-full bg-theme-primary-600" />
                <div className="h-[3px] w-[3px] rounded-full bg-theme-primary-600" />
              </div>
            ))}
          </div>
        </div>

        {/* App icon */}
        <div
          className="shimmer-block h-8 w-8 shrink-0 rounded-lg border border-solid border-theme-primary-700/70"
          style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.05}s` }}
        />

        {/* Text lines */}
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div
            className={`shimmer-block h-2.5 rounded ${titleWidths[index % titleWidths.length]}`}
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.1}s` }}
          />
          <div
            className={`shimmer-block h-2 rounded ${subtitleWidths[index % subtitleWidths.length]}`}
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.16}s` }}
          />
        </div>

        {/* Selection rail */}
        <div className="absolute right-0 top-0 flex h-full w-7 items-center justify-center rounded-r-full border-l border-solid border-theme-primary-700/60">
          <div
            className="shimmer-block h-4 w-4 rounded"
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.08}s` }}
          />
        </div>
      </div>
    ))}
  </div>
);
