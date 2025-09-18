import React, { useEffect, useState, useRef } from "react";
import { WindowInfo } from "./WindowList";
import { LiveWindowGrid } from "./LiveWindowGrid";

interface PublishedLayoutProps {
  windows: WindowInfo[];
  layout: string;
  focusedWindowId: string | null;
  onClose: () => void;
}

export const PublishedLayout: React.FC<PublishedLayoutProps> = ({
  windows,
  layout,
  focusedWindowId,
  onClose,
}) => {
  const [currentFocusedId, setCurrentFocusedId] = useState<string | null>(
    focusedWindowId
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus the container when it mounts to ensure keyboard events are captured
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  // Handle escape key to minimize
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Add event listener to document to ensure it captures all escape presses
    document.addEventListener("keydown", handleKeyPress, true);

    return () => {
      document.removeEventListener("keydown", handleKeyPress, true);
    };
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black text-white z-50 overflow-hidden focus:outline-none"
      tabIndex={-1}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-red-600 hover:bg-red-700 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        title="Close Published Layout (Esc)"
      >
        ✕
      </button>

      {/* Live Window Grid */}
      <LiveWindowGrid
        windows={windows.filter((w) => w.isSelected)}
        className="w-full h-full"
      />
    </div>
  );
};
