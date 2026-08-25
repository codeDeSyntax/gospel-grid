import React from "react";
import { motion } from "framer-motion";

export const AppSplash: React.FC = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden bg-black/60 backdrop-blur-md select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      {/* ── Minimalist Obsidian Glassmorphic Card (420×270) ── */}
      <motion.div
        className="relative w-[420px] h-[270px] rounded-[24px] border border-white/[0.12] flex flex-col items-center justify-center overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.65),0_0_0_1px_rgba(133,202,62,0.2)] bg-gradient-to-br from-[#181d16] via-[#0e120c] to-[#070906]"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Subtle Ambient Glow Behind Icon */}
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-[radial-gradient(circle,_rgba(133,202,62,0.22)_0%,_rgba(94,172,36,0.06)_50%,_transparent_70%)] z-0" />

        {/* Centered Content: Icon & Version */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-4">
          <motion.div
            className="w-[90px] h-[90px] flex items-center justify-center"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <img
              src="./wingrid.png"
              alt="Wingrid"
              className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(133,202,62,0.35)]"
            />
          </motion.div>

          <span className="text-[11px] font-semibold tracking-[0.12em] text-white/55 bg-white/[0.05] px-3.5 py-1 rounded-full border border-white/[0.08]">
            v2.2.42
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};
