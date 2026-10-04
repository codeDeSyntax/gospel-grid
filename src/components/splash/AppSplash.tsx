import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_STEPS = [
  "INITIALIZING DISPLAY MATRIX",
  "CALIBRATING GPU PIPELINES",
  "READYING STAGE ENGINE",
  "WORKSPACE READY",
];

export const AppSplash: React.FC = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-[#0c1014] select-none pointer-events-auto"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Ambient Radial Atmosphere ────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_50%_48%,rgba(0,96,137,0.18)_0%,rgba(120,198,229,0.04)_40%,transparent_70%)]" />

      {/* ── Central Brand Container ─────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm w-full"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Logo Glass Emblem */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Subtle Ambient Pulse behind logo */}
          <div className="absolute -inset-2 rounded-3xl bg-[#006089]/20 blur-xl animate-pulse" />
          
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl">
            <img
              src="./wingrid.png"
              alt="Wingrid"
              className="h-full w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            />
          </div>
        </div>

        {/* Brand Title */}
        <h1 className="text-3xl font-black tracking-tight text-white font-sans uppercase">
          WIN<span className="text-[#78c6e5]">GRID</span>
        </h1>

        {/* Brand Tagline */}
        <p className="mt-1.5 text-xs font-medium tracking-wide text-neutral-400 max-w-[240px]">
          Multi-Display Projection & Window Matrix
        </p>

        {/* ── Sleek Minimal Progress Bar ───────────────────────────────────── */}
        <div className="relative mt-8 w-56 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#006089] via-[#78c6e5] to-white shadow-[0_0_8px_#78c6e5]"
            animate={{
              x: ["-100%", "100%"],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ width: "65%" }}
          />
        </div>

        {/* ── Status Ticker & Version Badge ─────────────────────────────────── */}
        <div className="mt-4 flex items-center justify-between w-56 text-[10px] font-mono font-medium text-neutral-400">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#78c6e5] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#78c6e5]" />
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={statusIndex}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.2 }}
                className="truncate tracking-wider text-neutral-300"
              >
                {LOADING_STEPS[statusIndex]}
              </motion.span>
            </AnimatePresence>
          </div>

          <span className="text-neutral-500 tracking-widest text-[9px] shrink-0 ml-2">
            v2.2.47
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
