import React from "react";
import { motion } from "framer-motion";
import { Cast, Sparkles } from "lucide-react";

export const PublishedLayoutLoadingScreen: React.FC = () => {
  return (
    <div
      className="relative flex h-full min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(51,65,85,0.98),rgba(15,23,42,1)_58%,rgba(2,6,23,1))] text-white"
      role="status"
      aria-live="polite"
      aria-label="Loading published layout"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-[-5rem] h-72 w-72 rounded-full bg-cyan-400/18 blur-3xl"
        animate={{ opacity: [0.45, 0.8, 0.45], scale: [1, 1.08, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -bottom-24 right-[-4rem] h-80 w-80 rounded-full bg-sky-500/16 blur-3xl"
        animate={{ opacity: [0.3, 0.65, 0.3], scale: [1, 1.1, 1] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex w-[min(92vw,34rem)] flex-col items-center rounded-[2rem] border border-white/10 bg-slate-950/45 px-8 py-9 text-center shadow-[0_40px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:px-10">
        <div className="relative mb-7 flex h-28 w-28 items-center justify-center">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 90deg, rgba(34,211,238,0.06), rgba(34,211,238,0.95), rgba(56,189,248,0.28), rgba(34,211,238,0.06))",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))",
              mask: "radial-gradient(farthest-side, transparent calc(100% - 10px), #000 calc(100% - 9px))",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            aria-hidden="true"
            className="absolute inset-4 rounded-full border border-white/12 bg-slate-950/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            animate={{ scale: [1, 1.035, 1], opacity: [0.82, 1, 0.82] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="flex h-full w-full items-center justify-center">
              <Cast className="h-8 w-8 text-cyan-300/90" />
            </div>
          </motion.div>

          <motion.div
            aria-hidden="true"
            className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.95)]"
            animate={{
              y: [0, 84, 0],
              opacity: [0.45, 1, 0.45],
              scale: [0.85, 1.12, 0.85],
            }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="space-y-3">
          <p className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-cyan-100/85">
            <Sparkles className="h-3.5 w-3.5" />
            Loading published layout
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Preparing your projection view
          </h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-slate-300 sm:text-[0.95rem]">
            Restoring the window arrangement, quality settings, and live
            capture state for this published layout.
          </p>
        </div>

        <div className="mt-8 grid w-full gap-3 sm:grid-cols-3">
          {["Restoring layout", "Syncing quality", "Warming up windows"].map(
            (label, index) => (
              <motion.div
                key={label}
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-left"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + index * 0.12, duration: 0.35 }}
              >
                <div className="mb-2 h-1.5 w-8 rounded-full bg-cyan-300/80" />
                <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-300">
                  {label}
                </p>
              </motion.div>
            ),
          )}
        </div>
      </div>
    </div>
  );
};
