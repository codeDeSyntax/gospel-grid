import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowInfo } from "./WindowList";
import { LiveWindowGrid } from "./LiveWindowGrid";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useAppSelector } from "@/store/hooks";
import { Minimize2, X } from "lucide-react";

interface PublishedLayoutProps {
  windows: WindowInfo[];
  layout: string;
  focusedWindowId: string | null;
  layoutId?: string;
  onMinimize: () => void; // ESC key - minimize and focus main window
  onClose: () => void; // Close button - close window and focus main window
}

export const PublishedLayout: React.FC<PublishedLayoutProps> = ({
  windows,
  layout,
  focusedWindowId,
  layoutId,
  onMinimize,
  onClose,
}) => {
  const [currentFocusedId, setCurrentFocusedId] = useState<string | null>(
    focusedWindowId,
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { close: closeWindow, minimize: minimizeWindow } = useWindowControls();
  const isBlackout = useAppSelector((state) => state.app.isBlackout);
  const isFrozen = useAppSelector((state) => state.app.isFrozen);
  const overlayText = useAppSelector((state) => state.app.overlayText);
  const overlayVisible = useAppSelector((state) => state.app.overlayVisible);

  // Focus the container when it mounts to ensure keyboard events are captured
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handle escape key to minimize and focus main window
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleMinimizeButton(); // Use the same function as the minimize button
      }
    };

    // Add event listener to document to ensure it captures all escape presses
    document.addEventListener("keydown", handleKeyPress, true);

    return () => {
      document.removeEventListener("keydown", handleKeyPress, true);
    };
  }, [onMinimize]);

  // Handle minimize button and ESC key - minimize and focus main window
  const handleMinimizeButton = async () => {
    onMinimize(); // Notify parent component
    await minimizeWindow(); // Actually minimize this window (main process will focus main window)
  };

  // Handle close button - actually close the window
  const handleCloseButton = async () => {
    onClose(); // Notify parent component
    await closeWindow(); // Actually close this window (main process will focus main window)
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 text-white z-50 overflow-hidden focus:outline-none bg-black"
      tabIndex={-1}
    >
      {/* Blackout Overlay — covers entire projection with solid black */}
      {isBlackout && <div className="absolute inset-0 z-30 bg-black" />}

      {/* Text Overlay — centered with framer-motion animation */}
      <AnimatePresence>
        {overlayVisible && overlayText && !isBlackout && (
          <motion.div
            key="overlay-backdrop"
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              key={overlayText}
              className="text-white font-black text-center px-16"
              style={{
                fontSize: "clamp(2rem, 5vw, 5rem)",
                lineHeight: 1.3,
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "baseline",
                gap: "0.25em 0.3em",
              }}
            >
              {overlayText.split(" ").map((word, wi) => (
                <motion.span
                  key={`${overlayText}-${wi}`}
                  style={{
                    display: "inline-block",
                    textShadow:
                      "0 4px 32px rgba(0,0,0,0.95), 0 0 60px rgba(0,0,0,0.7)",
                  }}
                  initial={{
                    opacity: 0,
                    y: -(70 + (wi % 3) * 30),
                    x: wi % 2 === 0 ? -(12 + (wi % 4) * 8) : 12 + (wi % 4) * 8,
                    rotate:
                      wi % 2 === 0 ? -(10 + (wi % 3) * 6) : 10 + (wi % 3) * 6,
                    scale: 0.4,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: 0,
                    rotate: 0,
                    scale: 1,
                  }}
                  exit={{
                    opacity: 0,
                    y: 80,
                    rotate: wi % 2 === 0 ? -12 : 12,
                    scale: 0.5,
                    transition: {
                      delay: wi * 0.04,
                      duration: 0.3,
                      ease: "easeIn",
                    },
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 22,
                    delay: wi * 0.09,
                  }}
                >
                  {word}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Window Controls — auto-hide, show on hover */}
      <div className="absolute top-0 right-0 z-20 flex gap-1 p-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
        {/* Minimize button */}
        <button
          onClick={handleMinimizeButton}
          className="bg-white/90 hover:bg-yellow-500 text-black px-3 h-6 text-xs font-semibold rounded-sm flex items-center justify-center transition-colors"
          title="Minimize Published Layout (ESC)"
        >
          Minimize
        </button>

        {/* Close button */}
        <button
          onClick={handleCloseButton}
          className="bg-red-500/90 hover:bg-red-700 text-white px-3 h-6 text-xs font-semibold rounded-sm flex items-center justify-center transition-colors"
          title="Close Published Layout"
        >
          Close
        </button>
      </div>

      {/* Live Window Grid */}
      <LiveWindowGrid
        windows={windows.filter((w) => w.isSelected)}
        className="w-full h-full"
        layoutId={layoutId}
        isFrozen={isFrozen}
      />
    </div>
  );
};
