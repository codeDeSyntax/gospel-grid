import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CircularCountdownProps {
  remainingTime: number; // Time remaining in seconds
  totalTime: number; // Total countdown time in seconds
  size?: number; // Size of the circle in pixels
  strokeWidth?: number; // Width of the progress stroke
  className?: string;
  isLoading?: boolean; // Show magical loading animation
}

export const CircularCountdown: React.FC<CircularCountdownProps> = ({
  remainingTime,
  totalTime,
  size = 40,
  strokeWidth = 3,
  className = "",
  isLoading = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const baseId = React.useId().replace(/[:]/g, "");
  const loadingGradientId = `${baseId}-loading-gradient`;
  const loadingGlowId = `${baseId}-loading-glow`;
  const countdownGradientId = `${baseId}-countdown-gradient`;
  const countdownGlowId = `${baseId}-countdown-glow`;
  const progress = totalTime > 0 ? (totalTime - remainingTime) / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Loading animation
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0"
          >
            <svg
              width={size}
              height={size}
              className="transform animate-spin"
              style={{ animationDuration: "2s" }}
            >
              <defs>
                <linearGradient
                  id={loadingGradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgb(var(--theme-primary-500))" />
                  <stop
                    offset="50%"
                    stopColor="rgb(var(--theme-primary-700))"
                  />
                  <stop
                    offset="100%"
                    stopColor="rgb(var(--theme-primary-900))"
                  />
                </linearGradient>
                <filter id={loadingGlowId}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Loading circle with gradient */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#${loadingGradientId})`}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.25} ${
                  circumference * 0.75
                }`}
                filter={`url(#${loadingGlowId})`}
              />
            </svg>
          </motion.div>
        ) : (
          // Countdown display
          <motion.div
            key="countdown"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0"
          >
            <svg width={size} height={size} className="transform -rotate-90">
              <defs>
                <linearGradient
                  id={countdownGradientId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgb(var(--theme-primary-600))" />
                  <stop
                    offset="100%"
                    stopColor="rgb(var(--theme-primary-900))"
                  />
                </linearGradient>
                <filter id={countdownGlowId}>
                  <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background circle with subtle glow */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="rgb(var(--theme-primary-300))"
                strokeWidth={strokeWidth}
                fill="transparent"
                opacity={0.4}
              />

              {/* Progress circle with magical gradient */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={`url(#${countdownGradientId})`}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter={`url(#${countdownGlowId})`}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />

              {/* Pulse effect when time is low */}
              {remainingTime <= 10 && (
                <motion.circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius + 2}
                  stroke={`url(#${countdownGradientId})`}
                  strokeWidth={1}
                  fill="transparent"
                  opacity={0.3}
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                  }}
                />
              )}
            </svg>

            {/* Enhanced time display */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.span
                animate={
                  remainingTime <= 5
                    ? {
                        scale: [1, 1.2, 1],
                        opacity: [0.65, 1, 0.65],
                      }
                    : {}
                }
                transition={{
                  duration: 0.8,
                  repeat: remainingTime <= 5 ? Infinity : 0,
                }}
                className={`text-xs font-bold ${
                  remainingTime <= 5
                    ? "text-theme-primary-900"
                    : remainingTime <= 10
                      ? "text-theme-primary-800"
                      : "text-theme-primary-700"
                }`}
              >
                {Math.max(0, Math.ceil(remainingTime))}
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
