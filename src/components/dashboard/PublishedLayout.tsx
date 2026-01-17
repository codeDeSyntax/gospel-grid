import React, { useEffect, useState, useRef } from "react";
import { WindowInfo } from "./WindowList";
import { LiveWindowGrid } from "./LiveWindowGrid";
import { useWindowControls } from "@/hooks/useWindowControls";
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
    focusedWindowId
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { close: closeWindow, minimize: minimizeWindow } = useWindowControls();

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
      className="fixed inset-0 text-white z-50 overflow-hidden focus:outline-none"
      tabIndex={-1}
    >
      {/* Window Controls */}
      <div className="absolute top-1 right-20 z-10 flex gap-2">
        {/* Minimize button */}
        <button
          onClick={handleMinimizeButton}
          className="bg-white hover:bg-yellow-600 text-black  h-5  flex items-center justify-center transition-colors"
          title="Minimize Published Layout (ESC)"
        >
          Minimize
        </button>

        {/* Close button */}
        <button
          onClick={handleCloseButton}
          className="bg-red-500 hover:bg-red-700 text-white  h-5  flex items-center justify-center transition-colors"
          title="Close Published Layout"
        >
          close
        </button>
      </div>

      {/* Live Window Grid */}
      <LiveWindowGrid
        windows={windows.filter((w) => w.isSelected)}
        className="w-full h-full"
        layoutId={layoutId}
      />
    </div>
  );
};
