import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type WindowInfo } from "../picker/WindowPicker";
import { LiveWindowGrid } from "../live/LiveWindowGrid";
import { useWindowControls } from "@/hooks/useWindowControls";
import { useAppSelector } from "@/store/hooks";
import { Minimize2, X } from "lucide-react";
import { DynamicBroadcastCard } from "../ai/DynamicBroadcastCard";
import { AiProducerCard } from "@/services/ai/types";

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

  // Attempt to parse structured card JSON if present
  let parsedCard: AiProducerCard | null = null;
  if (overlayText && overlayText.startsWith("{") && overlayText.endsWith("}")) {
    try {
      parsedCard = JSON.parse(overlayText);
    } catch {}
  }

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
            className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {parsedCard ? (
              <motion.div
                key={overlayText}
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl px-6 flex items-center justify-center pointer-events-auto"
              >
                <DynamicBroadcastCard card={parsedCard} />
              </motion.div>
            ) : /<[a-z][\s\S]*>/i.test(overlayText) ? (
              <motion.div
                key={overlayText}
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl px-6 flex items-center justify-center pointer-events-auto drop-shadow-2xl"
                dangerouslySetInnerHTML={{
                  __html: overlayText
                    .replace(/\bclassName=/gi, "class=")
                    .replace(/\bclss=/gi, "class="),
                }}
              />
            ) : (
              <motion.div
                key={overlayText}
                initial={{ opacity: 0, scale: 0.92, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 24 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-4xl px-6 flex items-center justify-center pointer-events-auto drop-shadow-2xl"
              >
                <div className="bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[32px] p-8 sm:p-12 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-3xl w-full text-center">
                  <p className="text-neutral-950 font-black text-3xl sm:text-4xl md:text-5xl leading-snug tracking-tight">
                    {overlayText}
                  </p>
                </div>
              </motion.div>
            )}
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
        windows={windows}
        className="w-full h-full"
        layoutId={layoutId}
        isFrozen={isFrozen}
      />
    </div>
  );
};
