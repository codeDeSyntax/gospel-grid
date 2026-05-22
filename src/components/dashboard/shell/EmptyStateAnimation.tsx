import React from "react";
import { motion } from "framer-motion";

interface EmptyStateAnimationProps {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export const EmptyStateAnimation: React.FC<EmptyStateAnimationProps> = ({
  title = "No windows selected",
  subtitle = "Select windows from the list to preview them here",
  size = "md",
}) => {
  const sizeMap = {
    sm: { container: "w-32 h-32", orb: "w-20 h-20", title: "text-base", subtitle: "text-xs" },
    md: { container: "w-48 h-48", orb: "w-32 h-32", title: "text-lg", subtitle: "text-sm" },
    lg: { container: "w-64 h-64", orb: "w-40 h-40", title: "text-xl", subtitle: "text-base" },
  };

  const sizes = sizeMap[size];

  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center justify-center gap-6">
        {/* Animated Empty State */}
        <div className={`relative ${sizes.container} flex items-center justify-center`}>
          {/* Outer Pulsating Ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-theme-primary-400/30"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.1, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Middle Ring */}
          <motion.div
            className="absolute inset-4 rounded-full border-2 border-theme-primary-500/40"
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.2, 0.4],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Inner Ring with Dashes */}
          <motion.div
            className="absolute inset-8 rounded-full border-2 border-dashed border-theme-primary-600/50"
            animate={{
              rotate: [0, -360],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Central Empty Orb */}
          <motion.div
            className={`relative ${sizes.orb} rounded-full bg-gradient-to-br from-theme-primary-100 to-theme-primary-200 
              shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center overflow-hidden`}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Void/Hole Effect */}
            <motion.div
              className="absolute inset-0 rounded-full bg-gradient-radial from-theme-primary-950/20 via-theme-primary-900/10 to-transparent"
              animate={{
                scale: [0.8, 1, 0.8],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Floating Particles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-theme-primary-400/40"
                style={{
                  left: "50%",
                  top: "50%",
                }}
                animate={{
                  x: [
                    0,
                    Math.cos((i * Math.PI * 2) / 8) * 40,
                    0,
                  ],
                  y: [
                    0,
                    Math.sin((i * Math.PI * 2) / 8) * 40,
                    0,
                  ],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}

            {/* Center Void Indicator */}
            <motion.div
              className="w-8 h-8 rounded-full border-2 border-theme-primary-700/30"
              animate={{
                scale: [1, 0.8, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>

          {/* Corner Accents */}
          {[0, 90, 180, 270].map((rotation, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${rotation}deg) translateY(-${sizes.container === "w-48 h-48" ? "96" : sizes.container === "w-32 h-32" ? "64" : "128"}px)`,
              }}
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            >
              <div className="w-full h-full rounded-full bg-theme-primary-500/50" />
            </motion.div>
          ))}
        </div>

        {/* Text Content */}
        <div className="text-center">
          <motion.div
            className={`${sizes.title} font-semibold text-theme-primary-800 mb-2`}
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {title}
          </motion.div>
          <div className={`${sizes.subtitle} text-theme-primary-600`}>
            {subtitle}
          </div>
        </div>

        {/* Decorative Bottom Elements */}
        <div className="flex items-center gap-2">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-theme-primary-400"
              animate={{
                y: [0, -8, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
