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
    className="w-full border-solid border-t border-b-0 border-l-0 border-r-0 border-t-neutral-200 dark:border-t-neutral-700"
    role="status"
    aria-busy="true"
    aria-label="Loading available windows"
  >
    {Array.from({ length: SKELETON_ROW_COUNT }).map((_, index) => (
      <div
        key={`window-skeleton-${index}`}
        className="shimmer-surface relative flex w-full items-center gap-2.5 py-1.5 pl-3.5 pr-7 bg-transparent border-solid border-t-0 border-l-0 border-r-0 border-b border-b-neutral-200 dark:border-b-neutral-700"
        style={{ ["--shimmer-delay" as string]: `${index * 0.12}s` }}
      >
        {/* Drag handle */}
        <div className="absolute left-0 top-0 flex h-full w-2 items-center justify-center border-solid border-t-0 border-b-0 border-l-0 border-r border-r-neutral-200 dark:border-r-neutral-700">
          <div className="flex flex-col gap-[2px] opacity-20">
            {Array.from({ length: 3 }).map((__, row) => (
              <div key={row} className="flex gap-[2px]">
                <div className="h-[1.5px] w-[1.5px] rounded-full bg-neutral-400 dark:bg-neutral-500" />
                <div className="h-[1.5px] w-[1.5px] rounded-full bg-neutral-400 dark:bg-neutral-500" />
              </div>
            ))}
          </div>
        </div>

        {/* App icon */}
        <div
          className="shimmer-block h-7 w-7 shrink-0 rounded-full border border-solid border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-white/[0.08]"
          style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.05}s` }}
        />

        {/* Text lines */}
        <div className="min-w-0 flex-1 space-y-1 py-0">
          <div
            className={`shimmer-block h-2 rounded ${titleWidths[index % titleWidths.length]}`}
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.1}s` }}
          />
          <div
            className={`shimmer-block h-1.5 rounded ${subtitleWidths[index % subtitleWidths.length]}`}
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.16}s` }}
          />
        </div>

        {/* Selection rail */}
        <div className="absolute right-0 top-0 flex h-full w-7 items-center justify-center border-solid border-t-0 border-b-0 border-r-0 border-l border-l-neutral-200 dark:border-l-neutral-700">
          <div
            className="shimmer-block h-4 w-4 rounded"
            style={{ ["--shimmer-delay" as string]: `${index * 0.12 + 0.08}s` }}
          />
        </div>
      </div>
    ))}
  </div>
);
