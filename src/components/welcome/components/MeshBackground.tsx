import React from "react";

interface MeshBackgroundProps {
  className?: string;
  intensity?: "light" | "medium" | "strong";
}

export const MeshBackground: React.FC<MeshBackgroundProps> = ({
  className = "",
  intensity = "strong",
}) => {
  const intensityClasses = {
    light: "opacity-10",
    medium: "opacity-14",
    strong: "opacity-18",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base foundation with subtle tonal movement */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgb(var(--theme-primary-950))",
        }}
      />

      {/* Subtle tonal accents using theme colors */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 58% 42% at 15% 85%, 
            rgb(var(--primary-300) / 0.08) 0%, 
            rgb(var(--primary-500) / 0.04) 62%, 
               transparent 100%)`,
        }}
      />

      {/* Additional accent gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 35% 26% at 85% 20%, 
               rgb(var(--theme-primary-500) / 0.08) 0%, 
               rgb(var(--primary-500) / 0.04) 50%, 
               transparent 100%)`,
        }}
      />

      {/* Soft mottled veil to make pattern depth visible without stripes */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 12% 20%, rgb(var(--theme-primary-500) / 0.05) 0%, transparent 36%), radial-gradient(circle at 78% 68%, rgb(var(--primary-300) / 0.035) 0%, transparent 34%), radial-gradient(circle at 40% 42%, rgb(var(--theme-primary-400) / 0.04) 0%, transparent 45%)",
        }}
      />

      {/* Main mesh pattern layer */}
      <div
        className={`absolute inset-0 ${intensityClasses[intensity]} pointer-events-none`}
      >
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            {/* Primary mesh pattern */}
            <pattern
              id="welcomeMeshPattern"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Nodes with theme-aware colors */}
              <circle cx="30" cy="30" r="1.5" className="fill-primary-400/35" />
              <circle cx="90" cy="30" r="1.2" className="fill-primary-500/30" />
              <circle cx="30" cy="60" r="1.3" className="fill-primary-600/30" />
              <circle cx="60" cy="60" r="1.8" className="fill-primary-700/28" />
              <circle cx="90" cy="60" r="1.1" className="fill-primary-400/28" />
              <circle cx="30" cy="90" r="1" className="fill-primary-500/30" />
              <circle cx="90" cy="90" r="1.4" className="fill-primary-600/28" />

              {/* Horizontal connection lines */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="30"
                className="stroke-primary-400/18"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="60"
                className="stroke-primary-500/16"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="90"
                x2="90"
                y2="90"
                className="stroke-theme-primary-600/18"
                strokeWidth="0.6"
              />

              {/* Diagonal connection lines */}
              <line
                x1="30"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-primary-300/18"
                strokeWidth="0.55"
              />
              <line
                x1="60"
                y1="60"
                x2="90"
                y2="90"
                className="stroke-primary-400/16"
                strokeWidth="0.55"
              />
              <line
                x1="90"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-primary-500/16"
                strokeWidth="0.55"
              />
              <line
                x1="60"
                y1="60"
                x2="30"
                y2="90"
                className="stroke-primary-600/14"
                strokeWidth="0.55"
              />

              {/* Non-vertical cross-links for texture */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="60"
                className="stroke-primary-400/12"
                strokeWidth="0.45"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="90"
                className="stroke-primary-500/12"
                strokeWidth="0.45"
              />
            </pattern>

            {/* Dense mesh pattern for additional coverage */}
            <pattern
              id="welcomeDenseMesh"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              {/* Dense node network */}
              <circle cx="20" cy="20" r="0.8" className="fill-primary-400/20" />
              <circle cx="60" cy="20" r="0.6" className="fill-primary-500/18" />
              <circle cx="40" cy="40" r="1" className="fill-primary-600/20" />
              <circle cx="20" cy="60" r="0.7" className="fill-primary-700/18" />
              <circle cx="60" cy="60" r="0.9" className="fill-primary-400/20" />

              {/* Dense connection lines */}
              <line
                x1="20"
                y1="20"
                x2="60"
                y2="20"
                className="stroke-theme-primary-400/25"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="60"
                x2="60"
                y2="60"
                className="stroke-theme-primary-500/25"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="20"
                x2="40"
                y2="40"
                className="stroke-theme-primary-700/20"
                strokeWidth="0.3"
              />
              <line
                x1="40"
                y1="40"
                x2="60"
                y2="60"
                className="stroke-theme-primary-400/20"
                strokeWidth="0.3"
              />
            </pattern>
          </defs>

          {/* Apply the main mesh pattern */}
          <rect width="100%" height="100%" fill="url(#welcomeMeshPattern)" />
        </svg>
      </div>

      {/* Additional dense mesh layer */}
      <div className={`absolute inset-0 opacity-[0.06] pointer-events-none`}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <rect width="100%" height="100%" fill="url(#welcomeDenseMesh)" />
        </svg>
      </div>
    </div>
  );
};

export default MeshBackground;
