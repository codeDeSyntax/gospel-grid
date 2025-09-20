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
  const progress = totalTime > 0 ? (totalTime - remainingTime) / totalTime : 0;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          // Magical loading animation
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
              {/* Magical sparkle effect */}
              <defs>
                <linearGradient
                  id="magicalGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="25%" stopColor="#EC4899" />
                  <stop offset="50%" stopColor="#F59E0B" />
                  <stop offset="75%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Main loading circle with gradient */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#magicalGradient)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={`${circumference * 0.25} ${
                  circumference * 0.75
                }`}
                filter="url(#glow)"
              />

              {/* Inner sparkle dots */}
              {[0, 90, 180, 270].map((angle, index) => (
                <motion.circle
                  key={angle}
                  cx={
                    size / 2 +
                    Math.cos((angle * Math.PI) / 180) * (radius * 0.6)
                  }
                  cy={
                    size / 2 +
                    Math.sin((angle * Math.PI) / 180) * (radius * 0.6)
                  }
                  r={1.5}
                  fill="url(#magicalGradient)"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                  }}
                />
              ))}
            </svg>

            {/* Magical loading text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
                className="text-xs font-medium bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 bg-clip-text text-transparent"
              >
                ✨
              </motion.div>
            </div>
          </motion.div>
        ) : (
          // Enhanced countdown with magical effects
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
                  id="countdownGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop
                    offset="0%"
                    stopColor={
                      progress < 0.3
                        ? "#10B981"
                        : progress < 0.7
                        ? "#F59E0B"
                        : "#EF4444"
                    }
                  />
                  <stop
                    offset="100%"
                    stopColor={
                      progress < 0.3
                        ? "#059669"
                        : progress < 0.7
                        ? "#D97706"
                        : "#DC2626"
                    }
                  />
                </linearGradient>
                <filter id="countdownGlow">
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
                stroke="currentColor"
                strokeWidth={strokeWidth}
                fill="transparent"
                className="opacity-10"
              />

              {/* Progress circle with magical gradient */}
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="url(#countdownGradient)"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter="url(#countdownGlow)"
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
                  stroke="url(#countdownGradient)"
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
                        color: ["#EF4444", "#DC2626", "#EF4444"],
                      }
                    : {}
                }
                transition={{
                  duration: 0.8,
                  repeat: remainingTime <= 5 ? Infinity : 0,
                }}
                className={`text-xs font-bold ${
                  remainingTime <= 5
                    ? "text-red-500"
                    : remainingTime <= 10
                    ? "text-amber-500"
                    : "text-gray-600 dark:text-gray-400"
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
