import { motion } from "framer-motion";

export const AppSplash = () => {
  return (
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center overflow-hidden bg-[#282828]"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.055),transparent_38%)]" />

      <motion.div
        className="relative flex h-40 w-40 items-center justify-center"
        initial={{ opacity: 0, scale: 0.86 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox="0 0 160 160"
          aria-hidden="true"
        >
          <circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="4"
          />
          <motion.circle
            cx="80"
            cy="80"
            r="70"
            fill="none"
            stroke="rgba(216,216,216,0.84)"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.25, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        <motion.img
          src="./wingrid.png"
          alt="Wingrid"
          draggable={false}
          className="h-24 w-24 object-contain drop-shadow-[0_18px_34px_rgba(0,0,0,0.35)]"
          animate={{ scale: [1, 1.035, 1] }}
          transition={{ duration: 1.25, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};
