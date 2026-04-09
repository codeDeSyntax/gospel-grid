import React from "react";
import { motion } from "framer-motion";

interface RestlessWalkerSvgProps {
  className?: string;
}

const RestlessWalkerSvg: React.FC<RestlessWalkerSvgProps> = ({ className }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="32" cy="12" r="6" fill="currentColor" opacity="0.92" />
      <path
        d="M28 24C28 22.9 28.9 22 30 22H34C35.1 22 36 22.9 36 24V34H28V24Z"
        fill="currentColor"
        opacity="0.86"
      />
      <motion.path
        d="M28 27L22 32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.88"
        animate={{ y: [0, -1, 1, -1, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M36 27L42 31"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.88"
        animate={{ y: [0, 1, -1, 1, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M31 34L24 47"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.92"
        animate={{ y: [0, -1.5, 1.5, -1.5, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.path
        d="M33 34L40 46"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.92"
        animate={{ y: [0, 1.5, -1.5, 1.5, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="20"
        y="47"
        width="10"
        height="3.5"
        rx="1.75"
        fill="currentColor"
        opacity="0.9"
        animate={{ y: [47, 45.5, 48.5, 45.5, 47] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.rect
        x="38"
        y="46"
        width="10"
        height="3.5"
        rx="1.75"
        fill="currentColor"
        opacity="0.9"
        animate={{ y: [46, 47.5, 44.5, 47.5, 46] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
      />

      <path
        d="M46 20C48.5 20 49.5 18 52 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M49 24C51.5 24 52.5 22 55 22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M16 42C14 43 13 45 13 47"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M50 40C52 41 53 43 53 45"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.22"
      />
    </svg>
  );
};

export const WaitingDropHint: React.FC = () => {
  return (
    <div className="flex h-full w-full items-center justify-center select-none px-3 py-2">
      <div className="relative h-32 w-full max-w-[240px] -translate-x-3 sm:h-36 sm:max-w-[280px] sm:-translate-x-5 md:max-w-[320px] md:-translate-x-6">
        <div className="absolute left-1/2 top-[68%] h-px w-[86%] -translate-x-1/2 bg-gradient-to-r from-transparent via-theme-primary-500/35 to-transparent" />

        <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-theme-primary-500/35 bg-theme-primary-900/72 shadow-[0_0_18px_rgba(0,0,0,0.30)] sm:h-14 sm:w-14 md:h-16 md:w-16">
            <RestlessWalkerSvg className="h-8 w-8 text-theme-primary-100/92 sm:h-9 sm:w-9 md:h-10 md:w-10" />
          </div>
        </div>

        <div className="absolute right-1/2 top-6 mr-4 max-w-[150px] rounded-2xl border border-theme-primary-500/35 bg-theme-primary-900/90 px-2.5 py- shadow-[0_8px_24px_rgba(0,0,0,0.28)] sm:mr-6 sm:max-w-[180px] sm:px-3 md:max-w-[210px]">
          <p className="text-[10px]  text-theme-primary-100/92 sm:text-[11px]">
            drag from the left panel into here
          </p>
          <div className="absolute -right-1.5 bottom-2 h-3 w-3 rotate-45 border-r border-b border-theme-primary-500/35 bg-theme-primary-900/90" />
          <div className="absolute -right-4 bottom-[7px] h-px w-3 bg-theme-primary-400/45" />
        </div>
      </div>
    </div>
  );
};
