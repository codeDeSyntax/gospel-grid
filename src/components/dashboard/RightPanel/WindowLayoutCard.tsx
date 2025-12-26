import React from "react";
import { AutoFitWindowLayout } from "../AutoFitWindowLayoutOptimized";
import type { WindowLayoutCardProps } from "./types";

export const WindowLayoutCard: React.FC<WindowLayoutCardProps> = React.memo(
  ({
    selectedWindows,
    focusedWindowId,
    onWindowFocus,
    onWindowRemove,
    onWindowAdd,
  }) => {
    if (selectedWindows.length > 0) {
      return (
        <AutoFitWindowLayout
          selectedWindows={selectedWindows}
          focusedWindowId={focusedWindowId}
          onWindowFocus={onWindowFocus}
          onWindowRemove={onWindowRemove}
          onWindowAdd={onWindowAdd}
          maxDisplayWindows={4}
        />
      );
    }

    return (
      <div className="backdrop-blur-2xl  border border-theme-primary-400/50 rounded-2xl shadow-lg shadow-theme-primary-500/30 relative overflow-hidden h-full w-full flex items-center justify-center">
        {/* Animated Moving Mesh Background */}
        <div className="absolute inset-0">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="movingMesh"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                {/* Animated nodes */}
                <circle cx="30" cy="30" r="1" fill="rgba(168, 162, 158, 0.6)">
                  <animate
                    attributeName="r"
                    values="1;2;1"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.6;1;0.6"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Animated vertical lines moving up and down */}
                <line
                  x1="30"
                  y1="0"
                  x2="30"
                  y2="60"
                  stroke="rgba(120, 113, 108, 0.3)"
                  strokeWidth="0.5"
                >
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="translate"
                    values="0,-10;0,10;0,-10"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.1;0.5;0.1"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </line>

                {/* Animated horizontal lines */}
                <line
                  x1="0"
                  y1="30"
                  x2="60"
                  y2="30"
                  stroke="rgba(168, 162, 158, 0.3)"
                  strokeWidth="0.5"
                >
                  <animate
                    attributeName="opacity"
                    values="0.1;0.4;0.1"
                    dur="2.5s"
                    repeatCount="indefinite"
                  />
                </line>
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#movingMesh)"
              opacity="0.4"
            />
          </svg>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-theme-primary-400/40 rounded-full"
                style={{
                  left: `${15 + i * 12}%`,
                  top: `${20 + i * 8}%`,
                  animation: `float-${i % 3} ${
                    4 + (i % 3)
                  }s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Central content with gradient text - perfectly centered */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-8 max-w-lg mx-auto">
          <div className="relative flex items-center flex-col ">
            {/* Computer Error SVG Icon */}
            <img
              src="/computer_error.svg"
              alt="No Windows"
              className="w-40 h-40 mx-auto mb-4 opacity-60 animate-pulse"
            />

            {/* Stylish gradient text */}
            <span className="text-2xl font-impact font-extrabold mb-4 bg-gradient-to-r from-theme-primary-400 via-theme-primary-500 to-theme-primary-300 bg-clip-text text-transparent animate-gradient-x">
              No Windows Selected
            </span>

            {/* Multiple glowing underlines for depth */}
            <div className="relative mx-auto w-40 h-1">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-primary-400 to-transparent rounded-full opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-theme-primary-500 to-transparent rounded-full animate-pulse"></div>
              <div
                className="absolute inset-0 bg-gradient-to-r from-theme-primary-400 via-theme-primary-300 to-theme-primary-500 rounded-full opacity-40 animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>
          </div>

          <span className="text-xl font-[garamond] text-stone-300/90 leading-relaxed mt-3 mb-6 font-medium">
            Click on windows in the sidebar to add them to your layout
          </span>

          {/* Decorative elements */}
          <div className="flex items-center justify-center gap-2 opacity-60">
            <div className="w-2 h-2 rounded-full bg-theme-primary-400 animate-bounce"></div>
            <div
              className="w-2 h-2 rounded-full bg-theme-primary-500 animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-stone-800 animate-bounce"
              style={{ animationDelay: "0.4s" }}
            ></div>
          </div>
        </div>

        {/* CSS Animations */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes animate-gradient-x {
              0%, 100% {
                background-size: 200% 200%;
                background-position: left center;
              }
              50% {
                background-size: 200% 200%;
                background-position: right center;
              }
            }
            
            .animate-gradient-x {
              background-size: 200% 200%;
              animation: animate-gradient-x 3s ease infinite;
            }
            
            @keyframes float-0 {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              33% { transform: translateY(-20px) translateX(10px); }
              66% { transform: translateY(-10px) translateX(-5px); }
            }
            
            @keyframes float-1 {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              50% { transform: translateY(-15px) translateX(-8px); }
            }
            
            @keyframes float-2 {
              0%, 100% { transform: translateY(0px) translateX(0px); }
              25% { transform: translateY(-25px) translateX(5px); }
              75% { transform: translateY(-5px) translateX(-10px); }
            }
          `,
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if selected windows count or focused window changes
    return (
      prevProps.selectedWindows.length === nextProps.selectedWindows.length &&
      prevProps.focusedWindowId === nextProps.focusedWindowId
    );
  }
);
