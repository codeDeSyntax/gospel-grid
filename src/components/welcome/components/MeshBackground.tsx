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
    light: "opacity-30",
    medium: "opacity-50",
    strong: "opacity-70",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Primarily dark base */}
      <div className="absolute inset-0 bg-gradient-to-br from-background-primary via-background-secondary to-background-primary" />

      {/* Concentrated purple zones - MAXIMUM PROJECTION! */}
      {/* Bottom-right purple concentration - maximum intensity */}
      <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-gradient-to-tl from-primary-400/100 via-primary-300/95 to-primary-500/90" />

      {/* Top-left purple accent zone - amplified */}
      <div className="absolute top-0 left-0 w-3/5 h-3/5 bg-gradient-to-br from-primary-300/95 via-primary-500/90 to-primary-600/85" />

      {/* Center-right purple glow - ultra intense */}
      <div className="absolute top-1/4 right-0 w-2/5 h-3/5 bg-gradient-to-l from-primary-200/100 via-primary-400/100 to-primary-500/95" />

      {/* Small accent at bottom-left - maxed out */}
      <div className="absolute bottom-0 left-0 w-1/3 h-2/5 bg-gradient-to-tr from-primary-500/100 to-primary-600/85" />

      {/* Additional purple overlay for extra projection */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-400/20 via-transparent to-primary-300/25" />

      {/* Rest stays dark with minimal purple */}
      <div className="absolute inset-0 bg-gradient-to-t from-surface-primary via-surface-secondary to-surface-primary" />

      {/* Concentrated magical orbs in specific zones */}
      <div
        className={`absolute inset-0 ${intensityClasses[intensity]} pointer-events-none`}
      >
        {/* Large concentrated orb bottom-right - MAXIMUM intensity */}
        <div className="absolute bottom-0 right-0 w-[50rem] h-[50rem] bg-gradient-radial from-primary-300/100 via-primary-400/70 to-primary-500/40 rounded-full blur-3xl animate-float" />

        {/* Medium orb top-left - ultra enhanced */}
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-radial from-primary-200/90 via-primary-500/55 to-primary-600/25 rounded-full blur-2xl animate-float-delayed" />

        {/* Accent orb center-right - maximum boost */}
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-radial from-primary-100/85 via-primary-600/45 to-primary-700/20 rounded-full blur-xl animate-float-slow" />

        {/* Additional small intense orbs for extra projection */}
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-radial from-primary-300/80 via-primary-500/30 to-transparent rounded-full blur-2xl animate-float-delayed" />
        <div className="absolute top-1/6 left-1/4 w-32 h-32 bg-gradient-radial from-primary-200/75 via-primary-400/25 to-transparent rounded-full blur-xl animate-float-slow" />
      </div>

      {/* Subtle mesh network - purple accents on dark */}
      <div className={`absolute inset-0 ${intensityClasses[intensity]}`}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            {/* Strong purple glow for concentrated zones - MAXIMUM visibility */}
            <linearGradient id="meshGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="1.0" />
              <stop
                offset="30%"
                stopColor="rgb(59,130,246)"
                stopOpacity="1.0"
              />
              <stop
                offset="70%"
                stopColor="rgb(59,130,246)"
                stopOpacity="1.0"
              />
              <stop
                offset="100%"
                stopColor="rgb(59,130,246)"
                stopOpacity="0.9"
              />
            </linearGradient>

            {/* Concentrated animated gradient - ULTRA enhanced */}
            <linearGradient
              id="meshGlowAnimated"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgb(59,130,246)" stopOpacity="1.0">
                <animate
                  attributeName="stop-opacity"
                  values="1.0;1.0;1.0"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="50%" stopColor="rgb(59,130,246)" stopOpacity="1.0">
                <animate
                  attributeName="stop-opacity"
                  values="1.0;1.0;1.0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop
                offset="100%"
                stopColor="rgb(46, 16, 101)"
                stopOpacity="0.8"
              >
                <animate
                  attributeName="stop-opacity"
                  values="0.8;1.0;0.8"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </stop>
            </linearGradient>

            {/* Dark zones gradient - minimal */}
            <linearGradient id="meshDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(27, 27, 27)" stopOpacity="0.3" />
              <stop
                offset="50%"
                stopColor="rgb(30, 30, 30)"
                stopOpacity="0.2"
              />
              <stop
                offset="100%"
                stopColor="rgb(24, 24, 24)"
                stopOpacity="0.4"
              />
            </linearGradient>

            {/* Enhanced glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Strong glow filter for main lines */}
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Concentrated mesh network in purple zones */}
          {/* Bottom-right concentrated zone (high density) - more visible */}
          <g
            stroke="url(#meshGlow)"
            strokeWidth="1.2"
            fill="none"
            filter="url(#strongGlow)"
          >
            <path d="M1440,480 L2400,520 L1920,600" opacity="0.95">
              <animate
                attributeName="d"
                values="M1440,480 L2400,520 L1920,600;M1460,470 L2400,530 L1940,590;M1440,480 L2400,520 L1920,600"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M1500,400 L2400,440 L1800,500" opacity="0.9">
              <animate
                attributeName="d"
                values="M1500,400 L2400,440 L1800,500;M1520,390 L2400,450 L1820,490;M1500,400 L2400,440 L1800,500"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M1600,550 L2400,580 L2000,600" opacity="1.0">
              <animate
                attributeName="d"
                values="M1600,550 L2400,580 L2000,600;M1580,560 L2400,570 L1980,610;M1600,550 L2400,580 L2000,600"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Top-left concentrated zone - enhanced visibility */}
          <g
            stroke="url(#meshGlowAnimated)"
            strokeWidth="1.0"
            fill="none"
            filter="url(#glow)"
          >
            <path d="M0,0 L480,40 L240,120" opacity="0.85">
              <animate
                attributeName="d"
                values="M0,0 L480,40 L240,120;M0,10 L460,30 L260,110;M0,0 L480,40 L240,120"
                dur="6s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M0,80 L360,100 L180,180" opacity="0.8">
              <animate
                attributeName="d"
                values="M0,80 L360,100 L180,180;M20,70 L380,110 L200,170;M0,80 L360,100 L180,180"
                dur="7s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Center-right zone - boosted */}
          <g
            stroke="url(#meshGlow)"
            strokeWidth="0.9"
            fill="none"
            filter="url(#glow)"
          >
            <path d="M1680,180 L2400,200 L1920,300" opacity="0.8">
              <animate
                attributeName="d"
                values="M1680,180 L2400,200 L1920,300;M1700,170 L2400,210 L1940,290;M1680,180 L2400,200 L1920,300"
                dur="8s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Bottom-left zone - enhanced */}
          <g
            stroke="url(#meshGlowAnimated)"
            strokeWidth="0.8"
            fill="none"
            filter="url(#glow)"
          >
            <path d="M0,420 L480,460 L240,540" opacity="0.75">
              <animate
                attributeName="d"
                values="M0,420 L480,460 L240,540;M20,410 L460,470 L260,530;M0,420 L480,460 L240,540"
                dur="9s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Vertical mesh connections in purple zones - enhanced visibility */}
          <g
            stroke="url(#meshGlowAnimated)"
            strokeWidth="0.7"
            fill="none"
            filter="url(#glow)"
          >
            {/* Bottom-right vertical lines - more visible */}
            <path d="M1800,360 L1820,600 L1800,480" opacity="0.9">
              <animate
                attributeName="d"
                values="M1800,360 L1820,600 L1800,480;M1810,350 L1830,600 L1810,490;M1800,360 L1820,600 L1800,480"
                dur="10s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M2000,300 L1980,600 L2020,450" opacity="0.8">
              <animate
                attributeName="d"
                values="M2000,300 L1980,600 L2020,450;M2010,290 L1970,600 L2030,460;M2000,300 L1980,600 L2020,450"
                dur="12s"
                repeatCount="indefinite"
              />
            </path>

            {/* Top-left vertical lines - boosted */}
            <path d="M200,0 L220,240 L200,120" opacity="0.75">
              <animate
                attributeName="d"
                values="M200,0 L220,240 L200,120;M190,0 L230,240 L210,130;M200,0 L220,240 L200,120"
                dur="8s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M350,0 L330,180 L370,90" opacity="0.7">
              <animate
                attributeName="d"
                values="M350,0 L330,180 L370,90;M360,0 L320,180 L380,100;M350,0 L330,180 L370,90"
                dur="11s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Very subtle dark accent lines */}
          <g
            stroke="url(#meshDark)"
            strokeWidth="0.4"
            fill="none"
            opacity="0.2"
          >
            <path d="M0,150 Q600,250 1200,150 Q1800,50 2400,150">
              <animate
                attributeName="d"
                values="M0,150 Q600,250 1200,150 Q1800,50 2400,150;M0,160 Q600,240 1200,160 Q1800,60 2400,160;M0,150 Q600,250 1200,150 Q1800,50 2400,150"
                dur="15s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M0,350 Q400,450 800,350 Q1200,250 1600,350">
              <animate
                attributeName="d"
                values="M0,350 Q400,450 800,350 Q1200,250 1600,350;M0,340 Q400,460 800,340 Q1200,240 1600,340;M0,350 Q400,450 800,350 Q1200,250 1600,350"
                dur="18s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Interconnected nodes with enhanced visibility */}
          <g fill="url(#meshGlow)" filter="url(#glow)">
            <circle cx="200" cy="150" r="3" opacity="0.9">
              <animate
                attributeName="r"
                values="3;6;3"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.9;1;0.9"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="400" cy="250" r="4" opacity="0.8">
              <animate
                attributeName="r"
                values="4;8;4"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="600" cy="180" r="3.5" opacity="1.0">
              <animate
                attributeName="r"
                values="3.5;7;3.5"
                dur="2.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="1.0;1;1.0"
                dur="2.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="800" cy="320" r="5" opacity="0.7">
              <animate
                attributeName="r"
                values="5;9;5"
                dur="5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.7;1;0.7"
                dur="5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="300" cy="400" r="4" opacity="0.9">
              <animate
                attributeName="r"
                values="4;7;4"
                dur="3.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.9;1;0.9"
                dur="3.5s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="700" cy="350" r="3" opacity="0.8">
              <animate
                attributeName="r"
                values="3;6;3"
                dur="4.5s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.8;1;0.8"
                dur="4.5s"
                repeatCount="indefinite"
              />
            </circle>
          </g>

          {/* Enhanced connecting lines between nodes */}
          <g
            stroke="url(#meshGlowAnimated)"
            strokeWidth="2"
            fill="none"
            filter="url(#strongGlow)"
          >
            <path d="M200,150 Q350,100 400,250" opacity="0.7">
              <animate
                attributeName="opacity"
                values="0.7;1.0;0.7"
                dur="6s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M400,250 Q500,200 600,180" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;0.9;0.6"
                dur="4s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M600,180 Q700,250 800,320" opacity="0.8">
              <animate
                attributeName="opacity"
                values="0.8;1.0;0.8"
                dur="5s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M300,400 Q500,350 700,350" opacity="0.6">
              <animate
                attributeName="opacity"
                values="0.6;0.9;0.6"
                dur="7s"
                repeatCount="indefinite"
              />
            </path>
            <path d="M200,150 Q250,275 300,400" opacity="0.5">
              <animate
                attributeName="opacity"
                values="0.5;0.8;0.5"
                dur="8s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Enhanced magical flowing particles */}
          <g fill="url(#meshGlow)">
            <circle cx="100" cy="100" r="2" opacity="1.0">
              <animateMotion dur="15s" repeatCount="indefinite">
                <path d="M100,100 Q400,200 800,150 Q1200,100 1600,250" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="1.0;0.4;1.0"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="0" cy="200" r="2.5" opacity="0.8">
              <animateMotion dur="20s" repeatCount="indefinite">
                <path d="M0,200 Q600,100 1200,300 Q1800,200 2400,150" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0.8;0.3;0.8"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>
            <circle cx="300" cy="50" r="1.5" opacity="0.9">
              <animateMotion dur="12s" repeatCount="indefinite">
                <path d="M300,50 Q500,300 700,100 Q900,400 1100,200" />
              </animateMotion>
              <animate
                attributeName="opacity"
                values="0.9;0.5;0.9"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MeshBackground;
