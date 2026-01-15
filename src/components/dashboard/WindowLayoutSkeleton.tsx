import React from "react";

interface WindowLayoutSkeletonProps {
  columns?: 2 | 3 | 4;
  rows?: 2 | 3;
}

export const WindowLayoutSkeleton: React.FC<WindowLayoutSkeletonProps> = ({
  columns = 2,
  rows = 2,
}) => {
  const windows = [
    {
      shade: "bg-theme-primary-500/30",
      borderShade: "border-theme-primary-500/30",
    },
    {
      shade: "bg-theme-primary-500/30",
      borderShade: "border-theme-primary-500/30",
    },
    {
      shade: "bg-theme-primary-500/30",
      borderShade: "border-theme-primary-500/30",
    },
    {
      shade: "bg-theme-primary-500/30",
      borderShade: "border-theme-primary-500/30",
    },
  ];

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Window Grid Layout */}
        <div className="relative grid grid-cols-2 gap-3">
          {windows.map((window, index) => (
            <div
              key={index}
              className={`relative w-64 h-40  rounded-xl ${window.shade} borde-solid border-2 ${window.borderShade} overflow-hidden transition-all duration-300 hover:scale-105  `}
            >
              {/* Title bar */}
              <div className="absolute top-0 left-0 right-0 h-8  border-b border-theme-primary-500/40 flex items-center px-2 gap-1">
                <div className="w-2 h-2 rounded-full bg-theme-primary-500/70" />
                <div className="w-2 h-2 rounded-full bg-theme-primary-500/60" />
                <div className="w-2 h-2 rounded-full bg-theme-primary-500/50" />
              </div>

              {/* Content area with shimmer boxes */}
              <div className="absolute top-10 left-3 right-3 bottom-3 flex flex-col gap-2">
                {/* Shimmer bar 1 */}
                <div
                  className="h-3 bg-theme-primary-600/30 rounded shimmer-box"
                  style={{ animationDelay: `${index * 0.2}s` }}
                />
                {/* Shimmer bar 2 */}
                <div
                  className="h-3 w-3/4 bg-theme-primary-600/30 rounded shimmer-box"
                  style={{ animationDelay: `${index * 0.2 + 0.1}s` }}
                />
                {/* Shimmer bar 3 */}
                <div
                  className="h-3 w-5/6 bg-theme-primary-600/30 rounded shimmer-box"
                  style={{ animationDelay: `${index * 0.2 + 0.2}s` }}
                />
                {/* Shimmer block */}
                {/* <div
                  className="h-12 mt-2 bg-theme-primary-600/30 rounded shimmer-box"
                  style={{ animationDelay: `${index * 0.2 + 0.3}s` }}
                /> */}
              </div>
            </div>
          ))}

          {/* Centered Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-theme-primary-950/80 backdrop-blur-sm px-6 py-4 rounded-lg border border-theme-primary-700/30">
              <h3 className="text-sm font-medium text-theme-primary-300 mb-1">
                No Windows Selected
              </h3>
              <p className="text-xs text-theme-primary-400/60">
                Drag windows here to arrange them
              </p>
            </div>
          </div>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-theme-primary-500/50">Drop zone ready</div>
      </div>

      <style>{`
        @keyframes shimmer-pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .shimmer-box {
          animation: shimmer-pulse 2s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }

        .shimmer-box::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 100%
          );
          animation: shimmer-sweep 2s ease-in-out infinite;
        }

        @keyframes shimmer-sweep {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );
};
