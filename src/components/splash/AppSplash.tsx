import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const LOADING_STEPS = [
  "INITIALIZING DISPLAY MATRIX...",
  "CALIBRATING GPU PIPELINES...",
  "READYING STAGE ENGINE...",
];

export const AppSplash: React.FC = () => {
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#1d1d1d] select-none pointer-events-auto"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015, filter: "blur(6px)" }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif" }}
    >
      {/* ── Soft Ambient Background Glow ──────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(118,203,1,0.06)_0%,rgba(255,255,255,0.02)_40%,transparent_75%)]" />

      {/* ── Minimized & Compact Isometric Stage Prism Canvas ───────────────── */}
      <div className="relative w-full max-w-[620px] h-[380px] flex items-center justify-center px-4">
        {/* SVG Isometric Stage Prism — Scaled down cleanly & crisply */}
        <svg
          viewBox="0 0 880 540"
          className="absolute inset-0 w-full h-full drop-shadow-[0_16px_40px_rgba(0,0,0,0.6)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Pure White Facet Gradients */}
            <linearGradient id="min-white-solid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.88" />
            </linearGradient>

            <linearGradient id="min-white-medium" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.6" />
            </linearGradient>

            <linearGradient id="min-white-glass" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.35" />
            </linearGradient>

            <linearGradient id="min-white-sheer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id="min-white-ghost" x1="100%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* ── Main Isometric Stage Crystal Matrix (Pure White Glass) ─────── */}
          {/* Top Left Apex Facet */}
          <polygon
            points="310,60 170,150 310,240"
            fill="url(#min-white-solid)"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
          />
          <polygon
            points="310,60 310,240 470,140"
            fill="url(#min-white-medium)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.2"
          />

          {/* Top Center-Right Stage Crest */}
          <polygon
            points="470,140 620,60 620,240"
            fill="url(#min-white-solid)"
            stroke="rgba(255,255,255,0.7)"
            strokeWidth="1.2"
          />

          {/* Far Right Top Wing Facet */}
          <polygon
            points="620,140 760,70 760,220"
            fill="url(#min-white-glass)"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
          />

          {/* Central Deep Core */}
          <polygon
            points="310,240 470,140 470,380"
            fill="url(#min-white-ghost)"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1.2"
          />
          <polygon
            points="310,240 470,380 310,380"
            fill="url(#min-white-sheer)"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.2"
          />

          {/* Central Keystone */}
          <polygon
            points="470,140 620,240 470,380"
            fill="url(#min-white-medium)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.2"
          />

          {/* Lower Right Facets */}
          <polygon
            points="620,240 760,220 760,370"
            fill="url(#min-white-glass)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
          />
          <polygon
            points="620,240 760,370 620,440"
            fill="url(#min-white-sheer)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
          />

          {/* Bottom Center Stage Point */}
          <polygon
            points="470,380 620,240 620,440"
            fill="url(#min-white-solid)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
          />
          <polygon
            points="470,380 620,440 470,450"
            fill="url(#min-white-medium)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.2"
          />

          {/* Far Bottom Shard */}
          <polygon
            points="620,440 760,370 760,450"
            fill="url(#min-white-sheer)"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.2"
          />

          {/* Left Orbital Shard */}
          <polygon
            points="160,280 210,310 160,340"
            fill="url(#min-white-solid)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.2"
          />

          {/* Right Orbital Shard */}
          <polygon
            points="770,250 820,280 770,310"
            fill="url(#min-white-medium)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.2"
          />
        </svg>

        {/* ── Compact Floating Micro-Shards ─────────────────────────────── */}
        <motion.div
          className="absolute left-[12%] top-[50%] w-3 h-3 rotate-45 border border-white/60 bg-white/40 backdrop-blur-sm pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.4)]"
          animate={{ y: [0, -6, 0], rotate: [45, 60, 45] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[8%] top-[42%] w-2.5 h-2.5 rotate-12 border border-white/50 bg-white/25 backdrop-blur-sm pointer-events-none shadow-[0_0_8px_rgba(255,255,255,0.3)]"
          animate={{ y: [0, 6, 0], rotate: [12, -15, 12] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Minimized Overlay Interface ─────────────────────────────────── */}
        <div className="relative z-10 w-full px-8 sm:px-12 flex flex-col justify-between h-[230px]">
          {/* Top Brand Title & Subtitle */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-start gap-0.5"
          >
            {/* App Name: Pure White WIN + #76cb01 Green GRID */}
            <div className="flex items-center gap-3">
              <img
                src="./wingrid.png"
                alt="Wingrid"
                className="w-8 h-8 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              />
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] uppercase font-sans">
                WIN<span className="text-[#76cb01]">GRID</span>
              </h1>
            </div>

            <div className="flex items-center gap-2 mt-0.5 ml-11">
              <span className="text-[10px] font-semibold tracking-[0.2em] text-white/80 uppercase">
                Stage Engine
              </span>
              <span className="h-2.5 w-px bg-white/30" />
              <span className="text-[9.5px] font-mono font-medium text-white/70 tracking-wider">
                v2.2.42
              </span>
            </div>
          </motion.div>

          {/* Bottom Info & Luminous Compact Rail */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-end w-full"
          >
            {/* Subtitle */}
            <p className="text-[9.5px] font-medium text-white/80 tracking-wider drop-shadow-sm mb-2">
              Multi-Display Projection & Window Matrix
            </p>

            {/* Glowing Rail */}
            <div className="relative w-52 sm:w-64 h-[2.5px] bg-white/20 rounded-full overflow-visible backdrop-blur-md">
              {/* Luminous Active White-to-Green Track */}
              <motion.div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-white to-[#76cb01] rounded-full shadow-[0_0_10px_#76cb01]"
                animate={{
                  width: ["15%", "85%", "100%"],
                  opacity: [0.8, 1, 0.95],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Glowing Laser Node */}
              <motion.div
                className="absolute -top-[3.5px] w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#76cb01]"
                animate={{
                  left: ["10%", "85%", "98%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Dynamic Step Status Ticker */}
            <div className="flex items-center justify-between w-52 sm:w-64 mt-2">
              <span className="text-[8.5px] font-mono font-medium tracking-[0.18em] text-white/85 uppercase truncate">
                {LOADING_STEPS[statusIndex]}
              </span>
              <span className="text-[8.5px] font-mono font-medium text-[#76cb01] tracking-widest">
                STAGE-1
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
