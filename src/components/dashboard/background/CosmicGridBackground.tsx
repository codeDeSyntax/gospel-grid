import React from "react";

// Utility function to generate cosmic curved lines background JSX
export const getCosmicCurvedLinesBackground = () => {
  return (
    <>
      {/* Cosmic Curved Lines Background */}
      <div className="absolute inset-0 opacity-25 overflow-hidden">
        {/* SVG Curved Lines Pattern */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            {/* Gradient definitions for the curves */}
            <linearGradient id="curve1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(59, 130, 246, 0.4)" />
              <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
            </linearGradient>
            <linearGradient id="curve2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(147, 51, 234, 0.3)" />
              <stop offset="50%" stopColor="rgba(6, 182, 212, 0.5)" />
              <stop offset="100%" stopColor="rgba(59, 130, 246, 0.3)" />
            </linearGradient>
            <linearGradient id="curve3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.3)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.5)" />
              <stop offset="100%" stopColor="rgba(147, 51, 234, 0.3)" />
            </linearGradient>
          </defs>

          {/* Curved Line 1 - Top flowing curve */}
          <path
            d="M-100,120 Q200,80 400,140 T900,100"
            stroke="url(#curve1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "4s" }}
          />

          {/* Curved Line 2 - Middle wave */}
          <path
            d="M-100,220 Q300,180 500,240 T900,200"
            stroke="url(#curve2)"
            strokeWidth="3"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "1s" }}
          />

          {/* Curved Line 3 - Center flowing curve */}
          <path
            d="M-100,320 Q250,280 450,340 T900,300"
            stroke="url(#curve3)"
            strokeWidth="2.5"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "2s" }}
          />

          {/* Curved Line 4 - Lower wave */}
          <path
            d="M-100,420 Q350,380 550,440 T900,400"
            stroke="url(#curve1)"
            strokeWidth="2"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "7s", animationDelay: "0.5s" }}
          />

          {/* Curved Line 5 - Bottom flowing curve */}
          <path
            d="M-100,520 Q200,480 400,540 T900,500"
            stroke="url(#curve2)"
            strokeWidth="1.5"
            fill="none"
            className="animate-pulse"
            style={{ animationDuration: "4.5s", animationDelay: "3s" }}
          />
        </svg>

        {/* Subtle glow effects */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 60%)
            `,
          }}
        />
      </div>
    </>
  );
};

interface CosmicGridBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const CosmicGridBackground: React.FC<CosmicGridBackgroundProps> = ({
  className = "",
  children,
}) => {
  return (
    <div className={`relative ${className}`}>
      {getCosmicCurvedLinesBackground()}
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
