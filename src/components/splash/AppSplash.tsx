import { motion } from "framer-motion";
import React from "react";

export const AppSplash = () => {
  // Generate diagonal/triangular halftone dot pattern for the corners of the card
  const renderCornerDots = (corner: "tl" | "br") => {
    const dots = [];
    const size = 8;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - r; c++) {
        const opacity = (size - r - c) / size;
        const radius = 2.4 * opacity;
        
        // Position dots with progressive spacing
        const x = corner === "tl" ? c * 9 : 80 - c * 9;
        const y = corner === "tl" ? r * 9 : 80 - r * 9;
        
        dots.push(
          <circle
            key={`${r}-${c}`}
            cx={x + 6}
            cy={y + 6}
            r={radius}
            fill="#7bb94d"
            opacity={opacity * 0.7}
          />
        );
      }
    }
    return (
      <svg
        className={`absolute ${
          corner === "tl" ? "top-5 left-5" : "bottom-5 right-5"
        } w-24 h-24 pointer-events-none`}
        viewBox="0 0 100 100"
      >
        {dots}
      </svg>
    );
  };

  // Generate the play-button logo shape made of individual dots
  const renderLogoDots = () => {
    const dots = [];
    const rows = 9;
    for (let r = 0; r < rows; r++) {
      // Create a triangle shape pointing right
      const dotsInRow = r < 5 ? r + 1 : 9 - r;
      for (let c = 0; c < dotsInRow; c++) {
        const x = c * 7.5;
        const y = r * 7.5;
        // progressive opacity to look smooth
        const opacity = 0.5 + (c / 5) * 0.5;
        dots.push(
          <circle
            key={`${r}-${c}`}
            cx={x + 6}
            cy={y + 6}
            r={2.2}
            fill="#7bb94d"
            opacity={opacity}
          />
        );
      }
    }
    return (
      <svg className="w-12 h-16 text-[#7bb94d]" viewBox="0 0 45 72">
        {dots}
      </svg>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden bg-black/[0.08] backdrop-blur-[2px] select-none"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {/* ── Center Card ── */}
      <motion.div
        className="w-[560px] h-[360px] bg-white rounded-[28px] border border-neutral-100 relative flex flex-col items-center justify-center p-8 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {/* Halftone corners */}
        {renderCornerDots("tl")}
        {renderCornerDots("br")}

        {/* Center content container */}
        <div className="flex flex-col items-center justify-center text-center mt-2">
          {/* Logo & Branding */}
          <div className="flex items-center gap-4.5">
            {renderLogoDots()}
            <div className="flex flex-col items-start text-left">
              <span
                className="text-4xl font-light tracking-wide text-neutral-800"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.01em" }}
              >
                WINGRID
              </span>
              <span className="text-[10px] font-semibold text-[#7bb94d] tracking-[0.16em] uppercase mt-0.5">
                Intelligent Data Aggregator
              </span>
              <span className="text-[8px] font-bold text-neutral-400 tracking-wider uppercase mt-0.5">
                by josiokssolutions
              </span>
            </div>
          </div>

          {/* Version number */}
          <span className="text-xl font-light text-neutral-500 tracking-wider mt-5 mb-7">
            v. 2.2.39
          </span>

          {/* Segmented green loading bar */}
          <div className="flex gap-[3px] w-48 h-3.5 border border-[#7bb94d]/50 p-[2px] rounded bg-white">
            {Array.from({ length: 14 }).map((_, i) => (
              <motion.div
                key={i}
                className="h-full w-[10px] bg-[#7bb94d] rounded-[1px]"
                initial={{ opacity: 0.15 }}
                animate={{ opacity: [0.15, 1, 0.15] }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                  delay: i * 0.08,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>

          {/* Loading status text */}
          <span className="text-[9px] text-neutral-400 font-medium tracking-[0.18em] uppercase mt-2.5 animate-pulse">
            Loading...
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
