import React from "react";

interface CosmicBackgroundProps {
  className?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  className = "",
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base dark foundation - using neutral stone that works with all themes */}
      <div className="absolute inset-0 bg-stone-950" />

      {/* Small localized gradient in bottom-left corner only - like the original */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 35% at 15% 85%, 
               rgb(var(--theme-primary-400) / 0.8) 0%, 
               rgb(var(--theme-primary-500) / 0.6) 30%, 
               rgb(var(--theme-primary-600) / 0.4) 60%, 
               rgb(var(--theme-primary-700) / 0.2) 80%, 
               transparent 100%)`,
        }}
      />

      {/* Tiny accent in middle-left - very localized */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 30% 20% at 10% 60%, 
               rgb(var(--theme-primary-400) / 0.4) 0%, 
               rgb(var(--theme-primary-500) / 0.2) 50%, 
               transparent 100%)`,
        }}
      />

      {/* Enhanced mesh pattern with more interconnected lines - increased visibility */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="meshPattern"
              x="0"
              y="0"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
            >
              {/* Enhanced nodes with better visibility - using theme Tailwind classes */}
              <circle
                cx="30"
                cy="30"
                r="1.5"
                className="fill-theme-primary-400/70"
              />
              <circle
                cx="90"
                cy="30"
                r="1.2"
                className="fill-theme-primary-500/60"
              />
              <circle
                cx="30"
                cy="60"
                r="1.3"
                className="fill-theme-primary-600/65"
              />
              <circle
                cx="60"
                cy="60"
                r="1.8"
                className="fill-theme-primary-700/60"
              />
              <circle
                cx="90"
                cy="60"
                r="1.1"
                className="fill-theme-primary-400/60"
              />
              <circle
                cx="30"
                cy="90"
                r="1"
                className="fill-theme-primary-500/65"
              />
              <circle
                cx="90"
                cy="90"
                r="1.4"
                className="fill-theme-primary-600/60"
              />

              {/* More visible horizontal lines */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="30"
                className="stroke-theme-primary-400/40"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="60"
                className="stroke-theme-primary-500/35"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="90"
                x2="90"
                y2="90"
                className="stroke-theme-primary-600/35"
                strokeWidth="0.6"
              />

              {/* More visible vertical lines */}
              <line
                x1="30"
                y1="30"
                x2="30"
                y2="90"
                className="stroke-theme-primary-700/35"
                strokeWidth="0.6"
              />
              <line
                x1="60"
                y1="30"
                x2="60"
                y2="90"
                className="stroke-theme-primary-400/40"
                strokeWidth="0.6"
              />
              <line
                x1="90"
                y1="30"
                x2="90"
                y2="90"
                className="stroke-theme-primary-500/35"
                strokeWidth="0.6"
              />

              {/* Enhanced diagonal connections */}
              <line
                x1="30"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-theme-primary-600/30"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="90"
                y2="90"
                className="stroke-theme-primary-400/30"
                strokeWidth="0.5"
              />
              <line
                x1="90"
                y1="30"
                x2="60"
                y2="60"
                className="stroke-theme-primary-500/30"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="30"
                y2="90"
                className="stroke-theme-primary-700/30"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#meshPattern)" />
        </svg>
      </div>

      {/* Additional dense mesh layer for more coverage */}
      <div className="absolute inset-0 opacity-15">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="denseMesh"
              x="0"
              y="0"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              {/* Dense node network - using theme colors */}
              <circle
                cx="20"
                cy="20"
                r="0.8"
                className="fill-theme-primary-400/50"
              />
              <circle
                cx="40"
                cy="20"
                r="0.6"
                className="fill-theme-primary-500/40"
              />
              <circle
                cx="60"
                cy="20"
                r="0.7"
                className="fill-theme-primary-600/45"
              />
              <circle
                cx="20"
                cy="40"
                r="0.5"
                className="fill-theme-primary-700/40"
              />
              <circle
                cx="40"
                cy="40"
                r="1"
                className="fill-theme-primary-400/60"
              />
              <circle
                cx="60"
                cy="40"
                r="0.6"
                className="fill-theme-primary-500/40"
              />
              <circle
                cx="20"
                cy="60"
                r="0.7"
                className="fill-theme-primary-600/40"
              />
              <circle
                cx="40"
                cy="60"
                r="0.5"
                className="fill-theme-primary-700/35"
              />
              <circle
                cx="60"
                cy="60"
                r="0.8"
                className="fill-theme-primary-400/45"
              />

              {/* Dense connecting lines */}
              <line
                x1="20"
                y1="20"
                x2="60"
                y2="20"
                className="stroke-theme-primary-400/30"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="40"
                x2="60"
                y2="40"
                className="stroke-theme-primary-500/28"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="60"
                x2="60"
                y2="60"
                className="stroke-theme-primary-600/28"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="60"
                className="stroke-theme-primary-700/28"
                strokeWidth="0.4"
              />
              <line
                x1="40"
                y1="20"
                x2="40"
                y2="60"
                className="stroke-theme-primary-400/30"
                strokeWidth="0.4"
              />
              <line
                x1="60"
                y1="20"
                x2="60"
                y2="60"
                className="stroke-theme-primary-500/28"
                strokeWidth="0.4"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#denseMesh)" />
        </svg>
      </div>

      {/* Vertical flow lines from top to bottom */}
      <div className="absolute inset-0 opacity-18">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern
              id="verticalFlow"
              x="0"
              y="0"
              width="160"
              height="100"
              patternUnits="userSpaceOnUse"
            >
              {/* Long vertical flow lines spanning full height */}
              <line
                x1="40"
                y1="0"
                x2="40"
                y2="100"
                className="stroke-theme-primary-400/35"
                strokeWidth="0.5"
                strokeDasharray="8,4"
              />
              <line
                x1="80"
                y1="0"
                x2="80"
                y2="100"
                className="stroke-theme-primary-600/30"
                strokeWidth="0.5"
                strokeDasharray="6,6"
              />
              <line
                x1="120"
                y1="0"
                x2="120"
                y2="100"
                className="stroke-theme-primary-500/32"
                strokeWidth="0.5"
                strokeDasharray="10,3"
              />

              {/* Diagonal flow lines for dynamic effect */}
              <line
                x1="20"
                y1="0"
                x2="140"
                y2="100"
                className="stroke-theme-primary-700/25"
                strokeWidth="0.3"
                strokeDasharray="4,8"
              />
              <line
                x1="140"
                y1="0"
                x2="20"
                y2="100"
                className="stroke-theme-primary-400/25"
                strokeWidth="0.3"
                strokeDasharray="5,7"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verticalFlow)" />
        </svg>
      </div>

      {/* Minimal floating elements - very subtle - using theme colors */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-1/4 left-1/5 w-16 h-16 border border-theme-primary-400/20 rounded-lg rotate-12 animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 border border-theme-primary-500/15 rounded-full animate-float-delayed" />
      </div>
    </div>
  );
};
