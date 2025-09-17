import React from "react";

interface CosmicBackgroundProps {
  className?: string;
}

export const CosmicBackground: React.FC<CosmicBackgroundProps> = ({
  className = "",
}) => {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base dark foundation */}
      <div className="absolute inset-0 bg-slate-950" />

      {/* Small localized gradient in bottom-left corner only - like the reference */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 35% at 15% 85%, 
               rgba(59, 130, 246, 0.8) 0%, 
               rgba(99, 102, 241, 0.6) 30%, 
               rgba(124, 58, 237, 0.4) 60%, 
               rgba(91, 33, 182, 0.2) 80%, 
               transparent 100%)`,
        }}
      />

      {/* Tiny accent in middle-left - very localized */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 30% 20% at 10% 60%, 
               rgba(59, 130, 246, 0.4) 0%, 
               rgba(99, 102, 241, 0.2) 50%, 
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
              {/* Enhanced nodes with better visibility */}
              <circle cx="30" cy="30" r="1.5" fill="rgba(59, 130, 246, 0.7)" />
              <circle cx="90" cy="30" r="1.2" fill="rgba(99, 102, 241, 0.6)" />
              <circle cx="30" cy="60" r="1.3" fill="rgba(124, 58, 237, 0.65)" />
              <circle cx="60" cy="60" r="1.8" fill="rgba(91, 33, 182, 0.6)" />
              <circle cx="90" cy="60" r="1.1" fill="rgba(59, 130, 246, 0.6)" />
              <circle cx="30" cy="90" r="1" fill="rgba(99, 102, 241, 0.65)" />
              <circle cx="90" cy="90" r="1.4" fill="rgba(124, 58, 237, 0.6)" />

              {/* More visible horizontal lines */}
              <line
                x1="30"
                y1="30"
                x2="90"
                y2="30"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="60"
                x2="90"
                y2="60"
                stroke="rgba(99, 102, 241, 0.35)"
                strokeWidth="0.6"
              />
              <line
                x1="30"
                y1="90"
                x2="90"
                y2="90"
                stroke="rgba(124, 58, 237, 0.35)"
                strokeWidth="0.6"
              />

              {/* More visible vertical lines */}
              <line
                x1="30"
                y1="30"
                x2="30"
                y2="90"
                stroke="rgba(91, 33, 182, 0.35)"
                strokeWidth="0.6"
              />
              <line
                x1="60"
                y1="30"
                x2="60"
                y2="90"
                stroke="rgba(59, 130, 246, 0.4)"
                strokeWidth="0.6"
              />
              <line
                x1="90"
                y1="30"
                x2="90"
                y2="90"
                stroke="rgba(99, 102, 241, 0.35)"
                strokeWidth="0.6"
              />

              {/* Enhanced diagonal connections */}
              <line
                x1="30"
                y1="30"
                x2="60"
                y2="60"
                stroke="rgba(124, 58, 237, 0.3)"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="90"
                y2="90"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="0.5"
              />
              <line
                x1="90"
                y1="30"
                x2="60"
                y2="60"
                stroke="rgba(99, 102, 241, 0.3)"
                strokeWidth="0.5"
              />
              <line
                x1="60"
                y1="60"
                x2="30"
                y2="90"
                stroke="rgba(91, 33, 182, 0.3)"
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
              {/* Dense node network */}
              <circle cx="20" cy="20" r="0.8" fill="rgba(59, 130, 246, 0.5)" />
              <circle cx="40" cy="20" r="0.6" fill="rgba(99, 102, 241, 0.4)" />
              <circle cx="60" cy="20" r="0.7" fill="rgba(124, 58, 237, 0.45)" />
              <circle cx="20" cy="40" r="0.5" fill="rgba(91, 33, 182, 0.4)" />
              <circle cx="40" cy="40" r="1" fill="rgba(59, 130, 246, 0.6)" />
              <circle cx="60" cy="40" r="0.6" fill="rgba(99, 102, 241, 0.4)" />
              <circle cx="20" cy="60" r="0.7" fill="rgba(124, 58, 237, 0.4)" />
              <circle cx="40" cy="60" r="0.5" fill="rgba(91, 33, 182, 0.35)" />
              <circle cx="60" cy="60" r="0.8" fill="rgba(59, 130, 246, 0.45)" />

              {/* Dense connecting lines */}
              <line
                x1="20"
                y1="20"
                x2="60"
                y2="20"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="40"
                x2="60"
                y2="40"
                stroke="rgba(99, 102, 241, 0.28)"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="60"
                x2="60"
                y2="60"
                stroke="rgba(124, 58, 237, 0.28)"
                strokeWidth="0.4"
              />
              <line
                x1="20"
                y1="20"
                x2="20"
                y2="60"
                stroke="rgba(91, 33, 182, 0.28)"
                strokeWidth="0.4"
              />
              <line
                x1="40"
                y1="20"
                x2="40"
                y2="60"
                stroke="rgba(59, 130, 246, 0.3)"
                strokeWidth="0.4"
              />
              <line
                x1="60"
                y1="20"
                x2="60"
                y2="60"
                stroke="rgba(99, 102, 241, 0.28)"
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
                stroke="rgba(59, 130, 246, 0.35)"
                strokeWidth="0.5"
                strokeDasharray="8,4"
              />
              <line
                x1="80"
                y1="0"
                x2="80"
                y2="100"
                stroke="rgba(124, 58, 237, 0.3)"
                strokeWidth="0.5"
                strokeDasharray="6,6"
              />
              <line
                x1="120"
                y1="0"
                x2="120"
                y2="100"
                stroke="rgba(99, 102, 241, 0.32)"
                strokeWidth="0.5"
                strokeDasharray="10,3"
              />

              {/* Diagonal flow lines for dynamic effect */}
              <line
                x1="20"
                y1="0"
                x2="140"
                y2="100"
                stroke="rgba(91, 33, 182, 0.25)"
                strokeWidth="0.3"
                strokeDasharray="4,8"
              />
              <line
                x1="140"
                y1="0"
                x2="20"
                y2="100"
                stroke="rgba(59, 130, 246, 0.25)"
                strokeWidth="0.3"
                strokeDasharray="5,7"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verticalFlow)" />
        </svg>
      </div>

      {/* Minimal floating elements - very subtle */}
      <div className="absolute inset-0 opacity-3">
        <div className="absolute top-1/4 left-1/5 w-16 h-16 border border-blue-400/20 rounded-lg rotate-12 animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 border border-indigo-400/15 rounded-full animate-float-delayed" />
      </div>
    </div>
  );
};
