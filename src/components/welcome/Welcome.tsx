import React from "react";
import { X, Minus, Maximize2 } from "lucide-react";
import { ScreenAggregationMockup } from "./components/ScreenAggregationMockup";
import { useWindowControls } from "@/hooks/useWindowControls";
import MeshBackground from "./components/MeshBackground";

interface WelcomeProps {
  onGetStarted: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onGetStarted }) => {
  const { minimize, maximize, close } = useWindowControls();

  return (
    <div className="h-screen theme-text-main relative overflow-hidden bg-theme-primary-950">
      {/* Mesh background */}
      <MeshBackground intensity="light" />

      {/* macOS-style Window Controls */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        {/* Close button */}
        <div
          onClick={close}
          className="w-4 h-4 cursor-pointer rounded-full bg-theme-primary-700 hover:bg-red-600 transition-colors duration-200 flex items-center justify-center group"
          title="Close"
        >
          <X
            // size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            // strokeWidth={3}
          />
        </div>

        {/* Minimize button */}
        <div
          onClick={minimize}
          className="w-4 h-4 cursor-pointer rounded-full bg-theme-primary-700 hover:bg-theme-primary-500 transition-colors duration-200 flex items-center justify-center group"
          title="Minimize"
        >
          <Minus
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
        </div>

        {/* Maximize button */}
        <div
          onClick={maximize}
          className="w-4 h-4 cursor-pointer rounded-full bg-theme-primary-700 hover:bg-primary-600 transition-colors duration-200 flex items-center justify-center group"
          title="Maximize"
        >
          <Maximize2
            size={10}
            className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            strokeWidth={3}
          />
        </div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 h-full flex items-center justify-center">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex w-full flex-col items-center justify-center text-center space-y-4">
            {/* Mockup section */}
            <div className="relative w-full">
              <ScreenAggregationMockup />

              {/* Decorative elements with theme colors */}
              <div className="absolute top-1/4 -left-8 w-16 h-16 bg-gradient-to-br from-theme-primary-500/18 to-primary-500/10 rounded-full blur-xl animate-pulse"></div>
              <div
                className="absolute bottom-1/4 -right-8 w-20 h-20 bg-gradient-to-br from-theme-primary-400/16 to-primary-500/10 rounded-full blur-xl animate-pulse"
                style={{ animationDelay: "1s" }}
              ></div>
            </div>

            {/* Compact text content */}
            <div className="max-w-3xl space-y-4">
              {/* Main headline - now themed */}
              <div className="space-y-2">
                <p className="text-lg lg:text-xl theme-text-main leading-relaxed">
                  A tool for{" "}
                  <span className="text-primary-500 font-semibold">
                    aggregating multiple windows
                  </span>{" "}
                  in one place
                </p>
                <p className="text-sm lg:text-base theme-text-soft leading-relaxed">
                  Unleash the unlimited potential of multi-window aggregation.
                  Input live applications and watch our dashboard turn them into
                  unified streaming visuals.
                </p>
              </div>

              {/* Feature badges with theme styling */}
              <div className="flex flex-wrap justify-center gap-2">
                <div className="inline-flex items-center gap-2 bg-theme-primary-900/65 backdrop-blur border border-solid border-theme-primary-700 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span className="text-xs theme-text-soft">
                    Real-time Capture
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-theme-primary-900/65 backdrop-blur border border-solid border-theme-primary-700 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-primary-400 rounded-full"></div>
                  <span className="text-xs theme-text-soft">
                    Smart Grid Layout
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 bg-theme-primary-900/65 backdrop-blur border border-solid border-theme-primary-700 rounded-full px-2.5 py-1">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                  <span className="text-xs theme-text-soft">Ease of use</span>
                </div>
              </div>

              {/* CTA Button with theme styling */}
              <div className="space-y-2">
                <button
                  onClick={onGetStarted}
                  className="group relative cursor-pointer inline-flex items-center gap-2 border border-solid border-primary-400/60 bg-primary-500 text-primary-50 font-medium py-2.5 px-5 rounded-full transition-all duration-300 transform hover:scale-[1.02] hover:bg-primary-600 overflow-hidden"
                >
                  <span className="relative z-10 text-sm ">
                    Go to workspace
                  </span>
                  <svg
                    className="relative z-10 w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
